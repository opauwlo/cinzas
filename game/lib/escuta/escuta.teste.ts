import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { teste, assert } from '../../../tools/testes/harness';
import { Barramento, type EventoJogo } from '../../nucleo/barramento';
import { novoMundo } from '../../nucleo/index';
import type { Instrumento, Transmissao } from '../../nucleo/contratos';
import { CadernoEscuta } from './caderno';
import { ProgramacaoEscuta, MINUTO_FAROL, DURACAO_JANELA } from './programacao';
import { AMOSTRAS } from './amostras';
import { REGRAS, caminhos, toques, validarCatalogo } from './verificacao';
import { textoFicha, textoRecorte, carimbo } from './textos';
import { criarEscuta } from './index';

const T = (id: string) => AMOSTRAS.find(t => t.id === id)!;
const SAQ = T('saq-posto-km40'), FAROL = T('farol-fita-1'), FILHOS = T('filhos-vigilia'), MIL = T('milicia-boletim'), PX = T('px-dona-cida');

teste('escuta: amostras cobrem as 5 vozes, são rascunho de IA e o catálogo passa na validação', () => {
  assert.deepEqual(validarCatalogo(AMOSTRAS), []);
  assert.deepEqual(new Set(AMOSTRAS.map(t => t.emissor)), new Set(['farol', 'saqueadores', 'filhos', 'milicia', 'px']));
  for (const t of AMOSTRAS) assert.equal(t.autoria, 'rascunho-ia', t.id);
  assert.equal(SAQ.alegacoes.find(a => a.tipo === 'prazo')?.verdade, 'falso', 'Saqueadores: prazo falso');
  assert.equal(FILHOS.tecnica, 'prova_social'); assert.equal(MIL.tecnica, 'autoridade'); assert.equal(PX.tecnica, 'nenhuma');
  assert.ok(PX.alegacoes.every(a => a.verdade === 'verdade'), 'a PX não mente');
  const ruim: Transmissao = { ...SAQ, id: 'x', alegacoes: [{ ...SAQ.alegacoes[1], id: 'y', comoVerificar: ['geiger'] }], falas: [{ quem: 'a', texto: 'b' }] };
  assert.ok(validarCatalogo([ruim]).length > 0, 'a validação pega instrumento que não resolve o tipo');
});

teste('escuta: toda alegação tem ≥ 1 instrumento que a resolve, e verificar nunca passa de 2 toques', () => {
  for (const t of AMOSTRAS) for (const a of t.alegacoes) {
    const c = caminhos(a); assert.ok(c.length >= 1, `${a.id} sem caminho`);
    for (const i of c) assert.ok(toques(i) <= 2, `${a.id}/${i}: ${toques(i)} toques`);
  }
  assert.deepEqual(REGRAS.geiger, ['radiacao']); assert.deepEqual(REGRAS.tempo, ['prazo']);
  assert.ok(REGRAS.ir.includes('local') && REGRAS.ir.includes('conteudo'));
  for (const i of Object.keys(REGRAS) as Instrumento[]) assert.ok(REGRAS[i].length > 0);
});

teste('escuta: PRAZO FALSO sai sozinho quando a mesma transmissão volta noutro dia com o mesmo prazo', () => {
  const c = new CadernoEscuta();
  const novas = c.ouvir(SAQ, 1); assert.equal(novas.length, 2);
  assert.equal(c.verificar('saq-prazo', 'tempo', 1), null, 'sem repetição não há prova');
  c.ouvir(SAQ, 1); assert.equal(c.ficha('saq-prazo')!.estado, 'aberta', 'repetir no mesmo dia não prova nada');
  assert.equal(c.ouvir(SAQ, 2).length, 0, 'não abre ficha repetida');
  const f = c.ficha('saq-prazo')!;
  assert.equal(f.estado, 'falso'); assert.equal(f.comoDescobri, 'tempo'); assert.equal(carimbo(f)?.texto, 'PRAZO FALSO');
  assert.equal(c.ficha('saq-remedios')!.estado, 'aberta', 'a isca continua aberta: precisa ir ver');
  const mudou: Transmissao = { ...SAQ, alegacoes: SAQ.alegacoes.map(a => ({ ...a, disseram: a.disseram + ' (outro prazo)' })) };
  const c2 = new CadernoEscuta(); c2.ouvir(SAQ, 1); c2.ouvir(mudou, 2); assert.equal(c2.ficha('saq-prazo')!.estado, 'aberta', 'prazo diferente não é repetição');
});

teste('escuta: ir e Geiger só valem no lugar da alegação e depois de ouvir', () => {
  const c = new CadernoEscuta();
  c.registrarVisita('posto', 1); c.ouvir(SAQ, 1);
  assert.equal(c.ficha('saq-remedios')!.estado, 'aberta', 'visita antes de ouvir não verifica');
  c.registrarVisita('ermo', 1); assert.equal(c.ficha('saq-remedios')!.estado, 'aberta');
  assert.equal(c.registrarVisita('posto', 1).length, 1); assert.equal(c.ficha('saq-remedios')!.estado, 'falso');
  c.ouvir(FILHOS, 2); c.registrarLeitura('ermo', 2, 900); assert.equal(c.ficha('filhos-brilho')!.estado, 'aberta');
  c.registrarLeitura('pantano', 2, 912); const f = c.ficha('filhos-brilho')!;
  assert.equal(f.estado, 'falso'); assert.equal(f.cpm, 912); assert.match(textoFicha(f).como!, /912 cpm/);
  assert.equal(c.verificar('mil-governo', 'geiger', 2), null, 'instrumento que não serve devolve null');
  c.ouvir(MIL, 3); assert.equal(c.verificar('mil-governo', 'cruzar', 3), null, 'cruzar sem pista não vale');
  assert.ok(c.registrarPista('mil-governo')); assert.deepEqual(c.manuais('mil-governo'), ['cruzar']);
  assert.equal(c.verificar('mil-governo', 'cruzar', 3)!.estado, 'falso');
});

teste('escuta: programação é determinística por seed + dia + minuto + ato', () => {
  const a = new ProgramacaoEscuta(AMOSTRAS), b = new ProgramacaoEscuta([...AMOSTRAS].reverse());
  for (const seed of ['2026-11-04', 'outra']) for (let d = 1; d <= 30; d++) for (let ato = 1; ato <= 4; ato++) {
    const ga = a.grade(seed, d, ato).map(x => `${x.t.id}@${x.minuto}`), gb = b.grade(seed, d, ato).map(x => `${x.t.id}@${x.minuto}`);
    assert.deepEqual(ga, gb, `${seed} d${d} a${ato}`);
    for (let i = 1; i < ga.length; i++) assert.ok(a.grade(seed, d, ato)[i].minuto - a.grade(seed, d, ato)[i - 1].minuto >= DURACAO_JANELA, 'nunca duas no ar juntas');
  }
  assert.equal(a.noAr('s', 1, 1080, 1)?.id, 'saq-posto-km40', 'Saqueadores às 18h'); assert.equal(a.noAr('s', 1, 1079, 1), null);
  assert.equal(a.noAr('s', 1, 1080, 3), null, 'Saqueadores não estão no ato III');
  const p = a.proximas('s', 1, 0, 1, 4); assert.equal(p[0].t.emissor, 'farol'); assert.ok(p.every((x, i) => i === 0 || x.dia * 1440 + x.minuto >= p[i - 1].dia * 1440 + p[i - 1].minuto));
});

teste('escuta: a Farol roda num loop de 7 dias e nunca toca fora das 6h40', () => {
  const fitas: Transmissao[] = [1, 2, 3].map(n => ({ ...FAROL, id: `farol-fita-${n}`, alegacoes: FAROL.alegacoes.map(a => ({ ...a, id: `${a.id}-${n}` })), falas: FAROL.falas.map(f => ({ ...f, alegacao: f.alegacao ? `${f.alegacao}-${n}` : undefined })) }));
  const p = new ProgramacaoEscuta([...AMOSTRAS.filter(t => t.emissor !== 'farol'), ...fitas]);
  for (const seed of ['a', 'b', '2026-11-04']) {
    for (let d = 1; d <= 30; d++) assert.equal(p.fitaFarol(seed, d, 2)?.id, p.fitaFarol(seed, d + 7, 2)?.id, `dia ${d} = dia ${d + 7}`);
    assert.equal(new Set([1, 2, 3, 4, 5, 6, 7].map(d => p.fitaFarol(seed, d, 2)?.id)).size, 3, 'a semana toca todas as fitas');
    for (let ato = 1; ato <= 4; ato++) for (let d = 1; d <= 14; d++) for (let m = 0; m < 1440; m++) {
      const t = p.noAr(seed, d, m, ato);
      if (t?.emissor === 'farol') assert.ok(m >= MINUTO_FAROL && m < MINUTO_FAROL + DURACAO_JANELA, `Farol às ${m}`);
    }
  }
});

teste('escuta: revelar o ato fecha tudo, marca "você nunca foi ver" e não apaga o que foi verificado', () => {
  const c = new CadernoEscuta(); for (const t of AMOSTRAS) c.ouvir(t, 1);
  c.registrarVisita('posto', 1);
  const abertas = c.fichas().filter(f => f.estado === 'aberta').length, reveladas = c.revelarAto(1, 5);
  assert.equal(reveladas.length, abertas); assert.ok(c.fichas().every(f => f.estado !== 'aberta'));
  for (const f of reveladas) { assert.equal(f.nuncaFoiVer, true); assert.equal(f.comoDescobri, undefined); assert.match(textoFicha(f).como!, /nunca foi ver/); }
  const ir = c.ficha('saq-remedios')!; assert.equal(ir.comoDescobri, 'ir'); assert.ok(!ir.nuncaFoiVer);
  assert.equal(c.revelarAto(1, 6).length, 0);
});

teste('escuta: a interface só mostra o `real` (e a técnica) depois de verificado', () => {
  const c = new CadernoEscuta(); for (const t of AMOSTRAS) c.ouvir(t, 1);
  const reais = AMOSTRAS.flatMap(t => t.alegacoes.map(a => a.real));
  for (const f of c.fichas()) {
    assert.equal(f.real, undefined, `${f.alegacaoId} aberta com real`);
    const txt = JSON.stringify(textoFicha(f)); for (const r of reais) assert.ok(!txt.includes(r), `${f.alegacaoId} vazou: ${r}`);
    assert.equal(textoFicha(f).tecnica, undefined); assert.equal(textoFicha(f).carimbo, null); assert.equal(textoRecorte(f), null);
    assert.match(textoFicha(f).emissor, /^Voz em /, 'aberta, a ficha não entrega quem é o emissor real');
  }
  c.registrarVisita('posto', 1); const f = c.ficha('saq-remedios')!, txt = textoFicha(f);
  assert.equal(txt.real, SAQ.alegacoes[0].real); assert.equal(txt.carimbo?.texto, 'FALSO'); assert.ok(txt.tecnica);
  c.registrarPista('mil-governo'); c.verificar('mil-governo', 'cruzar', 1);
  assert.match(textoRecorte(c.ficha('mil-governo')!)!, /^A Milícia Velha me disse no rádio: “Ordem do Governo Provisório/);
});

teste('escuta: save do Caderno vai e volta (e a repetição continua valendo depois de carregar)', () => {
  const c = new CadernoEscuta(); c.ouvir(SAQ, 1); c.ouvir(FILHOS, 1); c.registrarLeitura('pantano', 1, 700); c.ouvir(FAROL, 2); c.sintonizar(FAROL, 2); c.registrarPista('farol-ao-vivo');
  const s = JSON.parse(JSON.stringify(c.salvar())), d = new CadernoEscuta(); d.carregar(s);
  assert.deepEqual(d.fichas(), c.fichas()); assert.deepEqual(d.salvar(), c.salvar());
  d.ouvir(SAQ, 3); assert.equal(d.ficha('saq-prazo')!.estado, 'falso', 'prazo falso detectado depois do load');
  assert.deepEqual(d.manuais('farol-ao-vivo'), ['cruzar'], 'a pista sobrevive ao save');
  d.carregar({ lixo: true }); assert.equal(d.fichas().length, 0, 'save estranho zera sem quebrar');
});

teste('escuta: o Caderno percebe o eco de 7 dias da Farol (a voz é gravada)', () => {
  const c = new CadernoEscuta(); c.sintonizar(FAROL, 2); assert.equal(c.sintonizar(FAROL, 5), null);
  assert.deepEqual(c.sintonizar(FAROL, 9), { transmissaoId: 'farol-fita-1', de: 2, para: 9 }); assert.equal(c.sintonizar(FAROL, 9), null);
  assert.equal(c.sintonizar(SAQ, 1), null); assert.equal(c.sintonizar(SAQ, 8), null, 'eco é só da Farol');
});

// ---------------------------------------------------------------- módulo ligado ao barramento, como na cena
function rodarDia(e: ReturnType<typeof criarEscuta>, m: ReturnType<typeof novoMundo>, de: number, ate: number) {
  for (let x = de; x <= ate; x++) { m.minutos = x; m.dia = Math.floor(x / 1440) + 1; m.hora = (x % 1440) / 60; e.modulo.tick!(0.6, m); }
}
function montar() {
  const bus = new Barramento(), e = criarEscuta(bus, AMOSTRAS), m = novoMundo(), ev: EventoJogo[] = [];
  bus.qualquer(x => ev.push(x)); m.seed = '2026-11-04'; m.zona.id = 'base'; m.ato = 1;
  return { bus, e, m, ev };
}

teste('escuta: módulo no abrigo pega a Farol às 6h40, emite transmissao/caderno e resolve a isca ao ir ao Posto', () => {
  const { bus, e, m, ev } = montar();
  e.modulo.carregar!(undefined); m.minutos = 390; e.modulo.iniciar!(m); bus.emit({ t: 'zona', zonaId: 'base', bioma: 'base', seed: m.seed });
  rodarDia(e, m, 390, 399); assert.equal(e.balao(), null);
  rodarDia(e, m, 400, 400); const b = e.balao()!; assert.equal(b.transmissaoId, 'farol-fita-1'); assert.equal(b.hora, '06h40');
  rodarDia(e, m, 401, 1150);
  const fases = ev.filter((x): x is Extract<EventoJogo, { t: 'transmissao' }> => x.t === 'transmissao' && x.id === 'farol-fita-1').map(x => x.fase);
  assert.deepEqual(fases, ['inicio', 'fala', 'fala', 'fala', 'fim']);
  assert.ok(ev.some(x => x.t === 'transmissao' && x.id === 'saq-posto-km40' && x.fase === 'fim'), 'ouviu os Saqueadores às 18h');
  assert.ok(ev.some(x => x.t === 'caderno' && x.alegacaoId === 'saq-remedios' && x.estado === 'aberta'));
  assert.ok(e.manuais('farol-ao-vivo').length === 0, 'sem pista, nada de botão falso');
  bus.emit({ t: 'zona', zonaId: 'posto', bioma: 'ermo', seed: m.seed }); m.zona.id = 'posto';
  assert.equal(e.fichas().find(f => f.alegacaoId === 'saq-remedios')!.estado, 'falso');
  assert.ok(ev.some(x => x.t === 'caderno' && x.alegacaoId === 'saq-remedios' && x.estado === 'falso'));
  rodarDia(e, m, 1151, 1440 + 1150); assert.equal(e.fichas().find(f => f.alegacaoId === 'saq-prazo')!.estado, 'aberta', 'fora do abrigo o rádio não pega');
  bus.emit({ t: 'zona', zonaId: 'base', bioma: 'base', seed: m.seed }); m.zona.id = 'base';
  rodarDia(e, m, 2 * 1440 + 1070, 2 * 1440 + 1150);
  assert.equal(e.fichas().find(f => f.alegacaoId === 'saq-prazo')!.estado, 'falso', 'dia 3, mesmo prazo: PRAZO FALSO');
  const s = JSON.parse(JSON.stringify(e.modulo.salvar!())), e2 = criarEscuta(new Barramento(), AMOSTRAS); e2.modulo.carregar!(s);
  assert.deepEqual(e2.fichas(), e.fichas(), 'save do módulo ida e volta');
});

teste('escuta: sair do abrigo no meio corta a fala, e virar o ato revela o que ficou aberto', () => {
  const { bus, e, m } = montar(); e.modulo.carregar!(undefined); e.modulo.iniciar!(m);
  rodarDia(e, m, 1080, 1080); assert.equal(e.balao()?.transmissaoId, 'saq-posto-km40');
  bus.emit({ t: 'zona', zonaId: 'ermo', bioma: 'ermo', seed: m.seed }); m.zona.id = 'ermo';
  assert.equal(e.balao(), null); assert.deepEqual(e.fichas().map(f => f.alegacaoId), ['saq-remedios'], 'só o que foi ouvido vira ficha');
  m.ato = 2; rodarDia(e, m, 1081, 1081);
  assert.ok(e.fichas().every(f => f.estado !== 'aberta' && f.nuncaFoiVer));
});

teste('escuta: momento autoral — o Caderno guarda a assinatura entre mortes e anota a margem da fita', () => {
  const { bus, e, m } = montar(); let meta: unknown = null; e.aoGravarMeta(x => { meta = x; });
  e.modulo.carregar!(undefined); e.modulo.iniciar!(m); rodarDia(e, m, 1075, 1150);
  bus.emit({ t: 'zona', zonaId: 'posto', bioma: 'ermo', seed: m.seed });
  const sq = e.assinaturas().find(a => a.emissor === 'saqueadores')!;
  assert.deepEqual(sq.frequencias, ['94,1 FM']); assert.deepEqual(sq.horarios, [1080]); assert.ok(sq.efeitos.includes('chiado')); assert.equal(sq.pegas, 1);
  // morreu: nova run, memória carregada do meta
  const e2 = criarEscuta(new Barramento(), AMOSTRAS); e2.carregarMeta(JSON.parse(JSON.stringify(meta))); e2.modulo.carregar!(undefined);
  const m2 = novoMundo(); m2.seed = 'outra-seed'; m2.zona.id = 'base'; m2.ato = 1; e2.modulo.iniciar!(m2);
  rodarDia(e2, m2, 1080, 1080);
  assert.match(e2.balao()!.nota!, /^Vida 1: você pegou os Saqueadores do Km 40 em escassez e prazo falso\./);
  rodarDia(e2, m2, 1081, 1150);
  const isca = e2.fichas().find(f => f.alegacaoId === 'saq-remedios')!;
  assert.equal(isca.estado, 'falso'); assert.equal(isca.vidaDescoberta, 1); assert.match(textoFicha(isca).nota!, /vida 1/);
  assert.equal(e2.fichas().find(f => f.alegacaoId === 'saq-prazo')!.estado, 'aberta', 'o que não foi visto na vida 1 continua por ver');
  // a Revelação do fim do ato não vira saber entre vidas
  e2.revelarAto(1); const e3 = criarEscuta(new Barramento(), AMOSTRAS); e3.carregarMeta(e2.salvarMeta()); e3.modulo.carregar!(undefined);
  e3.caderno.ouvir(SAQ, 1); assert.equal(e3.fichas().find(f => f.alegacaoId === 'saq-prazo')!.estado, 'aberta');
});

teste('escuta: tick cabe no orçamento (≤ 1 ms) e a lógica não usa Math.random nem Phaser/DOM', () => {
  const { e, m } = montar(); e.modulo.carregar!(undefined); e.modulo.iniciar!(m); m.minutos = 400; e.modulo.tick!(0.016, m);
  const t0 = performance.now(); for (let i = 0; i < 20000; i++) e.modulo.tick!(0.016, m);
  assert.ok((performance.now() - t0) / 20000 < 0.05, 'tick médio');
  const dir = join(process.cwd(), 'game/lib/escuta');
  for (const f of readdirSync(dir).filter(f => f.endsWith('.ts') && !f.endsWith('.teste.ts'))) {
    const src = readFileSync(join(dir, f), 'utf8');
    assert.ok(!/Math\.random/.test(src), `${f}: Math.random`); assert.ok(!/from 'phaser'|from 'react'|document\.|window\./.test(src), `${f}: Phaser/DOM na lógica`);
    assert.ok(!/from '\.\.\/(radiacao|narrativa|musica|arte|producao)/.test(src), `${f}: importa outra lib de área`);
  }
});
