import { teste, assert } from '../../../tools/testes/harness';
import { Barramento } from '../../nucleo/barramento';
import { novoMundo } from '../../nucleo/index';
import { OBJETIVOS } from '../../dados/objetivos';
import { LOCAIS } from '../../dados/locais';
import { Medidor, percentil, veredito } from './desempenho';
import { TelemetriaLocal, armazemMemoria, CHAVE, MAX_EVENTOS } from './telemetria';
import { lerModoDemo, localLiberado, objetivoLiberado, encerraDemo, ORDEM_ATO_I, motivoBloqueio } from './demo';
import { resumirUA, rotuloGpu } from './aparelho';
import { cadernoDosDados } from './oquemedimos';
import { criarModuloProducao } from './index';
import { relatorioTexto } from './relatorio';

const DIA = 86_400_000;
const relogio = (t0 = Date.UTC(2026, 10, 4, 12)) => { const r = { t: t0, agora: () => r.t }; return r; };

teste('produção: p50/p95/pior pelo posto mais próximo, fps pela média, buffer circular guarda só os últimos', () => {
  assert.equal(percentil([1, 2, 3, 4], 50), 2); assert.equal(percentil([], 95), 0);
  const m = new Medidor(100); for (let i = 1; i <= 100; i++) m.quadro(i);
  const r = m.resumo(); assert.equal(r.p50ms, 50); assert.equal(r.p95ms, 95); assert.equal(r.piorMs, 100); assert.equal(r.amostras, 100);
  assert.equal(r.fps, Math.round(100_000 / 5050 * 10) / 10); assert.equal(r.travadas, 51, 'quadros ≥ 50 ms contam como travada');
  for (let i = 0; i < 100; i++) m.quadro(16); const r2 = m.resumo(); assert.equal(r2.p95ms, 16, 'quadros antigos saíram do buffer'); assert.equal(r2.piorMs, 16);
  m.quadro(5000); assert.equal(m.resumo().pausas, 1, 'aba no fundo não vira quadro'); assert.equal(m.resumo().piorMs, 16);
  m.zerar(); assert.equal(m.resumo().amostras, 0);
});
teste('produção: medir um quadro é barato (100 mil quadros bem abaixo de 1 ms cada)', () => {
  const m = new Medidor(2048), t0 = performance.now(); for (let i = 0; i < 100_000; i++) m.quadro(16 + (i % 7)); const ms = (performance.now() - t0) / 100_000;
  assert.ok(ms < 0.01, `custo por quadro ${ms.toFixed(5)} ms`); const t1 = performance.now(); m.resumo(); assert.ok(performance.now() - t1 < 5, 'resumo de 2048 quadros em menos de 5 ms');
});
teste('produção: veredito segue a meta do plano (p95 < 33 ms)', () => {
  assert.equal(veredito({ fps: 60, p50ms: 16, p95ms: 17, piorMs: 20, amostras: 600 }).nota, 'liso');
  assert.equal(veredito({ fps: 40, p50ms: 22, p95ms: 30, piorMs: 60, amostras: 600 }).nota, 'aceitável');
  assert.equal(veredito({ fps: 25, p50ms: 35, p95ms: 48, piorMs: 90, amostras: 600 }).nota, 'pesado');
  assert.equal(veredito({ fps: 60, p50ms: 16, p95ms: 17, piorMs: 20, amostras: 10 }).nota, 'sem dados');
});
teste('produção: telemetria desligada por padrão não grava nada, nem com idade declarada', () => {
  const a = armazemMemoria(), t = new TelemetriaLocal(a);
  assert.equal(t.consentiu(), false); t.registrar('abertura'); t.marco('primeiro_saque');
  t.declararIdade('adulto'); t.registrar('abertura');
  assert.deepEqual(t.exportar(), []); assert.deepEqual(a.dump(), {}, 'armazenamento intocado');
  t.definirConsentimento(true); assert.equal(t.consentiu(), true); t.registrar('abertura', { demo: false }); assert.equal(t.exportar().length, 1);
});
teste('produção: quem se declara menor de 18 não é medido e nada fica guardado, nem a resposta', () => {
  const a = armazemMemoria(), t = new TelemetriaLocal(a);
  t.declararIdade('menor'); t.definirConsentimento(true); t.registrar('abertura');
  assert.equal(t.consentiu(), false); assert.deepEqual(t.exportar(), []); assert.deepEqual(a.dump(), {});
  const b = armazemMemoria(), u = new TelemetriaLocal(b); u.declararIdade('adulto'); u.definirConsentimento(true); u.registrar('x');
  u.declararIdade('menor'); assert.equal(u.consentiu(), false); assert.deepEqual(b.dump(), {}, 'declarar menor depois apaga o que havia');
});
teste('produção: apagar limpa a lista e troca o id; revogar apaga tudo do aparelho', () => {
  const a = armazemMemoria(), t = new TelemetriaLocal(a); t.declararIdade('adulto'); t.definirConsentimento(true);
  t.registrar('a'); t.marco('primeira_morte'); const id1 = JSON.parse(a.ler(CHAVE)!).id;
  t.apagar(); assert.deepEqual(t.exportar(), []); assert.notEqual(JSON.parse(a.ler(CHAVE)!).id, id1); assert.equal(t.marco('primeira_morte'), true, 'marcos também zeram');
  t.definirConsentimento(false); assert.equal(t.consentiu(), false); assert.equal(a.ler(CHAVE), null);
});
teste('produção: retenção de 90 dias e limite de eventos', () => {
  const a = armazemMemoria(), r = relogio(), t = new TelemetriaLocal(a, r.agora); t.declararIdade('adulto'); t.definirConsentimento(true);
  t.registrar('velho'); r.t += 50 * DIA; t.registrar('novo'); r.t += 41 * DIA;
  assert.deepEqual(t.exportar().map(e => e.nome), ['novo'], 'o de 91 dias saiu');
  const reaberto = new TelemetriaLocal(a, () => r.t + 60 * DIA); assert.equal(reaberto.consentiu(), true); assert.deepEqual(reaberto.exportar(), [], 'poda também ao abrir');
  for (let i = 0; i < MAX_EVENTOS + 30; i++) t.registrar('e', { i }); const ex = t.exportar(); assert.equal(ex.length, MAX_EVENTOS); assert.equal(ex[0].dados?.i, 30); assert.equal(t.estado().descartados, 31);
});
teste('produção: dados pessoais não entram mesmo se alguém tentar registrar', () => {
  const t = new TelemetriaLocal(); t.declararIdade('adulto'); t.definirConsentimento(true);
  t.registrar('morte', { causa: 'lobo', email: 'a@b.c', nome: 'Cris', lat: -23.5, contato: 'x@y.z', modelo: 'moto g' }); t.registrar('Nome Ruim!');
  const ex = t.exportar(); assert.equal(ex.length, 1); assert.deepEqual(ex[0].dados, { causa: 'lobo' });
});
teste('produção: envio só com endpoint configurado E consentimento', () => {
  const enviados: string[] = []; const post = async (_u: string, c: string) => { enviados.push(c); return true; };
  const sem = new TelemetriaLocal(); sem.declararIdade('adulto'); sem.definirConsentimento(true); sem.registrar('a');
  assert.equal(sem.podeEnviar(), false); assert.deepEqual(sem.pendentes(), []); void sem.enviar(post);
  const semSim = new TelemetriaLocal(armazemMemoria(), Date.now, { url: 'https://t.exemplo/api/send', site: 's1' }); semSim.registrar('a');
  assert.equal(semSim.podeEnviar(), false); void semSim.enviar(post); assert.equal(enviados.length, 0, 'nenhuma requisição saiu');
  const ok = new TelemetriaLocal(armazemMemoria(), Date.now, { url: 'https://t.exemplo/api/send', site: 's1' }); ok.declararIdade('adulto'); ok.definirConsentimento(true);
  ok.registrar('a'); ok.registrar('b'); ok.registrar('c'); assert.equal(ok.pendentes().length, 3);
  const corpo = ok.corpoUmami(ok.pendentes()[0]); assert.equal(corpo.type, 'event'); assert.equal(corpo.payload.website, 's1'); assert.equal(corpo.payload.name, 'a');
  assert.ok(!('referrer' in corpo.payload) && !('screen' in corpo.payload), 'sem referrer nem tela no envio');
  ok.confirmarEnvio(1); assert.deepEqual(ok.pendentes().map(e => e.nome), ['b', 'c']); assert.equal(ok.estado().enviados, 1);
  ok.definirConsentimento(false); assert.deepEqual(ok.pendentes(), [], 'revogou: nada pendente sai');
});
teste('produção: o módulo transforma o barramento em funil só com consentimento, cada marco uma vez', () => {
  const bus = new Barramento(), m = novoMundo(); m.zona.bioma = 'ermo';
  const t = new TelemetriaLocal(), mod = criarModuloProducao({ tel: () => t, bus, intervaloSeg: 1, janela: new Medidor(64) });
  mod.iniciar!(m); bus.emit({ t: 'saque', item: 'agua', q: 1, raro: false }); assert.deepEqual(t.exportar(), [], 'sem consentimento, nada');
  t.declararIdade('adulto'); t.definirConsentimento(true);
  bus.emit({ t: 'saque', item: 'agua', q: 1, raro: false }); bus.emit({ t: 'saque', item: 'faca', q: 1, raro: true });
  bus.emit({ t: 'viagem', de: 'base', para: 'ermo', fase: 'inicio' }); bus.emit({ t: 'morte', causa: 'lobo' }); bus.emit({ t: 'morte', causa: 'fome' });
  bus.emit({ t: 'telemetria', nome: 'objetivo', dados: { id: 'madeira', ato: 1 } }); m.ato = 2; mod.tick!(0.5, m);
  const nomes = t.exportar().map(e => e.nome);
  assert.deepEqual(nomes.filter(n => n === 'primeiro_saque').length, 1); assert.ok(nomes.includes('primeira_viagem')); assert.equal(nomes.filter(n => n === 'primeira_morte').length, 1);
  assert.equal(nomes.filter(n => n === 'morte').length, 2); assert.ok(nomes.includes('objetivo')); assert.ok(nomes.includes('ato'));
  mod.desligar(); bus.emit({ t: 'vitoria' }); assert.ok(!t.exportar().some(e => e.nome === 'vitoria'), 'desligar cancela a inscrição');
});
teste('produção: demo libera só o Ato I (base e Ermo, até "sobreviva a uma noite")', () => {
  const ordem = OBJETIVOS.map(o => o.id), d = lerModoDemo('1');
  assert.deepEqual(OBJETIVOS.filter(o => o.ato === 1).map(o => o.id), [...ORDEM_ATO_I], 'a cópia bate com a campanha');
  assert.equal(lerModoDemo(undefined).ativo, false); assert.equal(lerModoDemo('0').ativo, false); assert.equal(d.ativo, true);
  for (const id of d.locais) assert.ok(LOCAIS.some(l => l.id === id), `local ${id} existe`);
  assert.ok(localLiberado(d, 'ermo')); assert.ok(!localLiberado(d, 'cidade')); assert.ok(!localLiberado(d, 'abrigo7')); assert.equal(motivoBloqueio(d, 'base'), null);
  assert.ok(objetivoLiberado(d, 'noite', ordem)); assert.ok(!objetivoLiberado(d, 'nivel3', ordem)); assert.ok(!objetivoLiberado(d, 'inexistente', ordem));
  assert.ok(encerraDemo(d, 'noite')); assert.ok(!encerraDemo(d, 'abater3')); assert.ok(!encerraDemo(lerModoDemo(''), 'noite'));
  const fora = lerModoDemo(''); assert.ok(localLiberado(fora, 'abrigo7')); assert.ok(objetivoLiberado(fora, 'abrigo7', ordem));
  assert.ok(!/últimas|só hoje|corra|apenas \d/i.test(d.mensagemFim), 'mensagem de fim sem urgência falsa');
});
teste('produção: aparelho resumido sem identificador (UA reduzido não vira versão falsa)', () => {
  const ua = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';
  assert.deepEqual(resumirUA(ua), { so: 'Android ?', navegador: 'Chrome 142', movel: true });
  assert.equal(resumirUA('Mozilla/5.0 (Linux; Android 14; moto g84 5G) AppleWebKit/537.36 Chrome/120.0.6099.230 Mobile Safari/537.36').so, 'Android 14');
  assert.deepEqual(resumirUA('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'), { so: 'iOS 18', navegador: 'Safari 18', movel: true });
  assert.ok(!JSON.stringify(resumirUA('Mozilla/5.0 (Linux; Android 14; moto g84 5G) Chrome/120.0 Mobile')).includes('moto'), 'modelo não passa');
  assert.equal(rotuloGpu('ANGLE (Qualcomm, Adreno (TM) 619, OpenGL ES 3.2)'), 'Qualcomm · Adreno (TM) 619');
});
teste('produção: "O que medimos" carimba VERDADE pelo estado real e FALSO se uma promessa quebrar', () => {
  const a = armazemMemoria(), t = new TelemetriaLocal(a), agora = Date.now();
  const fichas = (bruto = a.ler(CHAVE)) => cadernoDosDados({ estado: t.estado(), eventos: t.exportar(), bruto, agora, piorQuadroMs: 41 });
  assert.ok(fichas().every(f => f.estado === 'verdade'), 'desligada: tudo verdade');
  assert.equal(fichas('{"v":1}').find(f => f.id === 'desligada')!.estado, 'falso', 'algo guardado sem o sim é carimbado FALSO');
  t.declararIdade('adulto'); t.definirConsentimento(true); t.registrar('morte', { causa: 'lobo' });
  const f = fichas(); assert.ok(f.every(x => x.estado === 'verdade')); assert.match(f.find(x => x.id === 'quadro')!.verdade, /41 ms/);
  const forjado = cadernoDosDados({ estado: t.estado(), eventos: [{ nome: 'x', t: agora, dados: { email: 'a@b.c' } }], bruto: a.ler(CHAVE), agora, piorQuadroMs: 0 });
  assert.equal(forjado.find(x => x.id === 'pessoal')!.estado, 'falso');
  const velho = cadernoDosDados({ estado: { ...t.estado(), maisAntigo: agora - 120 * DIA }, eventos: t.exportar(), bruto: '', agora, piorQuadroMs: 0 });
  assert.equal(velho.find(x => x.id === 'retencao')!.estado, 'falso');
});
teste('produção: relatório do Diag cabe no chat e diz a meta', () => {
  const m = new Medidor(); for (let i = 0; i < 600; i++) m.quadro(i % 10 ? 16.7 : 40);
  const t = relatorioTexto({ quando: new Date(2026, 10, 4, 14, 5), resumo: m.resumo(), aparelho: { so: 'Android 15', navegador: 'Chrome 142', movel: true, modelo: 'motorola edge 70 fusion+', dpr: 2.6, tela: '412x915', nucleos: 8, memoriaGb: 8, gpu: 'Adreno (TM) 720', webgl: 2, maxTextura: 4096 }, inpMs: 72 });
  assert.match(t, /2026-11-04 14:05/); assert.match(t, /p95 40 ms/); assert.match(t, /meta: p95 < 33 ms/); assert.match(t, /INP\): 72 ms/); assert.ok(t.split('\n').length <= 9);
});
