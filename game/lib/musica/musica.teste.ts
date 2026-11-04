import { teste, assert, entre } from '../../../tools/testes/harness';
import { Barramento } from '../../nucleo/barramento';
import { novoMundo } from '../../nucleo/index';
import type { EstadoMusical, NotaAgendada } from '../../nucleo/contratos';
import {
  MOTIVO_M, RESPOSTA_R, MOTIVO_M2, RESPOSTA_R2, FRASE, COLOSSO, GANGUE_78, MASCATE, SEGUNDA_VOZ, BPM_TEMA, HARMONIA, SEGMENTOS, STINGERS, VINHETA,
  PARCIAIS_DRONE, BATIMENTO_DRONE_HZ, DETUNE_RABECA, todosSegmentos, tempos, hz, motivoMorse, AUTORIA_PARTITURA, type Segmento,
} from './partitura';
import { MaestroCinzas, HISTERESE, SEM_REPETIR_S, TEMA_POR_HORA } from './maestro';
import { cordaKS, violaPar, alturaHz, energiaAcima, renderDrone } from './sintese';
import { notasVinheta, sinalAbrigo7 } from './vinheta';
import { DiretorMusical } from './index';
import { intervaloBatimento } from '../../dados/sons';

teste('música: batimento acelera de 900 ms (30% de vida) a 520 ms (5%), sem passar dos limites', () => {
  assert.equal(intervaloBatimento(1), 900); assert.equal(intervaloBatimento(0.3), 900); assert.equal(intervaloBatimento(0.05), 520); assert.equal(intervaloBatimento(0), 520);
  let ant = 901; for (let h = 0.3; h >= 0.05; h -= 0.01) { const ms = intervaloBatimento(h); assert.ok(ms <= ant, 'monotônico'); ant = ms; }
});

const pc = (m: number) => ((m % 12) + 12) % 12;
const FA_SUST = 6, MI_BEMOL = 3;
/** Ré eólio ∪ Ré mixolídio sem o Fá♯ (Ré Mi Fá Sol Lá Si♭ Si Dó) + os vizinhos da "sirene": Sol♯ (de M) e Dó♯ (de M') */
const MODO = new Set([2, 4, 5, 7, 9, 10, 11, 0, 8, 1]);
/** roda o maestro por `seg` segundos, chamando agendar a cada `passo` (como o laço de 100 ms de audio.ts) */
function rodar(m: MaestroCinzas, de: number, seg: number, passo = 0.1, janela = 0.3, aoPasso?: (t: number) => void): NotaAgendada[] {
  const out: NotaAgendada[] = []; for (let t = de; t < de + seg; t += passo) { aoPasso?.(t); out.push(...m.agendar(t, janela)); } return out;
}

teste('música: o tema "Toada do Abrigo" bate com o plano (M, R, M\', R\', 3/4 a ♩ = 66, 8 barras) e é partitura provisória', () => {
  assert.equal(AUTORIA_PARTITURA, 'provisoria-direcao-de-audio');
  assert.deepEqual(MOTIVO_M, [[62, 2], [69, 1], [68, 0.5], [69, 2.5]], 'M = Ré4–Lá4–Sol♯4–Lá4 (2, 1, ½, 2½)');
  assert.deepEqual(RESPOSTA_R, [[72, 1], [69, 1], [65, 1], [64, 2], [62, 1]], 'R = Dó5–Lá4–Fá4–Mi4–Ré4 (1, 1, 1, 2, 1)');
  assert.deepEqual(MOTIVO_M2.map(([m]) => m), [67, 74, 73, 74], "M' = Sol4–Ré5–Dó♯5–Ré5");
  assert.deepEqual(RESPOSTA_R2.map(([m]) => m), [77, 74, 70, 69], "R' = Fá5–Ré5–Si♭4 | Lá4");
  assert.equal(BPM_TEMA, 66); assert.equal(tempos(FRASE), 24, '8 barras de 3/4'); assert.equal(HARMONIA.length, 8);
  const ivs = MOTIVO_M.slice(1).map(([m], i) => m - MOTIVO_M[i][0]); assert.deepEqual(ivs, [7, -1, 1], '+5ª justa, −2ª m, +2ª m');
  entre(tempos(FRASE) * 60 / BPM_TEMA, 21, 23, 'frase completa ~22 s');
  // leitmotivs derivados
  assert.deepEqual(COLOSSO.map(([, d]) => d), MOTIVO_M.map(([, d]) => d * 4), 'Colosso = M em aumentação ×4');
  assert.deepEqual(COLOSSO.map(([m]) => m), MOTIVO_M.map(([m]) => m - 12), 'Colosso nos graves (uma oitava abaixo)');
  const g = SEGMENTOS.find(s => s.id === 'combate_gangue')!; assert.equal(g.compasso, '7/8'); assert.equal(g.porBarra, 7); assert.equal(tempos(GANGUE_78), 7);
  assert.ok(GANGUE_78.every(([m]) => m === 68 || m === 69), 'gangues: só a célula Sol♯–Lá');
  assert.ok(MASCATE.some(([m]) => m === 71) && !MASCATE.some(([m]) => m === 68), 'mascate: M em maior (Ré–Lá–Si–Lá)');
  assert.equal(tempos(SEGUNDA_VOZ), tempos(FRASE), 'a segunda voz anda junto com a frase');
  for (let i = 0; i < FRASE.length; i++) { const iv = FRASE[i][0] - SEGUNDA_VOZ[i][0]; assert.ok(iv === 3 || iv === 4, `dupla em terças (nota ${i}: ${iv} semitons)`); }
  entre(DETUNE_RABECA, -17, -15, 'rabeca em 436 Hz contra a viola em 440');
});

teste('música: todas as notas no modo (Ré eólio/mixolídio + Sol♯/Dó♯ da sirene); Fá♯ só na vitória; nada de Mi♭', () => {
  const ver = (s: Segmento) => { for (const n of s.notas) { if (n.voz === 'zabumba' || n.voz === 'drone' || n.m === 0) continue; const p = pc(n.m);
    if (p === FA_SUST) assert.ok(s.picardia && s.estados.includes('vitoria'), `${s.id}: Fá♯ fora do final`); else assert.ok(MODO.has(p) && p !== MI_BEMOL, `${s.id}: nota ${n.m} fora do modo`); } };
  for (const s of todosSegmentos()) ver(s);
  const vit = SEGMENTOS.find(s => s.id === 'vitoria_final')!; assert.ok(vit.notas.some(n => pc(n.m) === FA_SUST), 'o final tem a terça maior');
  assert.ok(SEGMENTOS.filter(s => s.picardia).every(s => s.estados.length === 1 && s.estados[0] === 'vitoria'), 'só o estado vitória libera o Fá♯');
  for (const [k, l] of Object.entries(STINGERS)) for (const [m] of l) { if (k === 'vitoria') continue; assert.ok(MODO.has(pc(m)) && pc(m) !== FA_SUST, `stinger ${k} fora do tom`); }
  assert.ok(STINGERS.vitoria.some(([m]) => pc(m) === FA_SUST) && STINGERS.vitoria[0][0] % 12 === 2, 'a vitória da campanha em Ré maior');
  assert.equal(pc(STINGERS.nivel[0][0]), 2, 'nível começa em Ré'); assert.equal(pc(STINGERS.conquista[STINGERS.conquista.length - 1][0]), 2, 'conquista resolve em Ré');
});

teste('música: melodia na faixa do alto-falante (Ré4 293,7 Hz – 4 kHz) e nada tonal abaixo de 140 Hz', () => {
  for (const s of todosSegmentos()) for (const n of s.notas) {
    if (!n.m || n.voz === 'zabumba' || n.voz === 'drone') continue; const f = hz(n.m);
    if (n.papel === 'melodia') entre(f, 293, 4000, `${s.id} melodia ${n.m}`);
    assert.ok(f >= 140, `${s.id}: ${n.voz} ${n.m} (${f.toFixed(0)} Hz) abaixo do corte do celular`);
  }
  for (const n of notasVinheta(0, 'loop').concat(notasVinheta(0, 'liberta'), sinalAbrigo7(0))) if (n.midi) entre(hz(n.midi), 293, 4000, 'vinheta/sinal');
});

teste('música: drone com fundamental ausente — sem energia abaixo de 140 Hz e o Ré2 implícito', () => {
  assert.equal(PARCIAIS_DRONE[1], 0, 'o 1º harmônico é zero');
  const midis = new Set(SEGMENTOS.flatMap(s => s.notas.filter(n => n.voz === 'drone').map(n => n.m)));
  for (const m of midis) for (let h = 1; h < PARCIAIS_DRONE.length; h++) if (PARCIAIS_DRONE[h]) assert.ok(hz(m) * h >= 140, `drone ${m}: harmônico ${h} em ${(hz(m) * h).toFixed(0)} Hz`);
  const fs = 8000, s = renderDrone(hz(38), PARCIAIS_DRONE, BATIMENTO_DRONE_HZ, 1.2, fs);
  assert.ok(1 - energiaAcima(s, fs, 140, 0, 8192) < 0.01, 'menos de 1% da energia abaixo de 140 Hz');
  entre(alturaHz(s, fs, 60, 400, 0, 2048), 70, 77, 'a periodicidade (a altura que o ouvido ouve) continua sendo Ré2 ~73 Hz');
});

teste('música: viola por Karplus-Strong afinada (±8 cents) e com ≥ 70% da energia acima de 300 Hz (gate G5)', () => {
  const fs = 44100;
  for (const m of [62, 69, 74, 81]) { const f = hz(m), s = cordaKS(f, 0.5, fs); const c = 1200 * Math.log2(alturaHz(s, fs, f * 0.7, f * 1.4, 2000, 4096) / f); entre(c, -8, 8, `corda ${m} cents`); }
  const v = violaPar(hz(62), 0.6, fs); assert.ok(v.every(Number.isFinite)); entre(Math.max(...v.map(Math.abs)), 0.5, 0.95, 'pico normalizado');
  entre(energiaAcima(v, fs, 300, 1000, 8192), 0.7, 1, 'Ré4 da viola: energia acima de 300 Hz');
  assert.deepEqual(Array.from(cordaKS(293.66, 0.05, fs)), Array.from(cordaKS(293.66, 0.05, fs)), 'a mesma nota soa sempre igual');
});

teste('música: transições caem na barra (ou no tempo, se urgente) e a histerese segura o combate 8 s', () => {
  const m = new MaestroCinzas('2026-11-04'); m.pedir('exploracao'); rodar(m, 0, 30);
  m.pedir('abrigo'); rodar(m, 30, 40); // pedido de prioridade maior: entra na barra
  m.pedir('combate'); rodar(m, 70, 20);
  assert.equal(m.estado(), 'combate');
  for (const tr of m.log) if (tr.antes) { const u = (tr.t - tr.antes.ini) / (tr.urgente ? tr.antes.durTempo : tr.antes.durBarra); assert.ok(Math.abs(u - Math.round(u)) < 1e-6, `${tr.de}→${tr.para} em ${tr.t.toFixed(3)} fora da ${tr.urgente ? 'batida' : 'barra'}`); }
  assert.ok(m.log.some(t => t.para === 'combate' && t.urgente), 'combate entra no próximo tempo');
  const t0 = 90; rodar(m, t0, 30, 0.1, 0.3, () => m.pedir('exploracao')); const saiu = m.log.find(tr => tr.de === 'combate')?.t ?? -1;
  assert.ok(saiu >= t0 + HISTERESE.combate!, `combate saiu cedo (${(saiu - t0).toFixed(1)} s)`); assert.ok(saiu > 0 && saiu < t0 + 14, 'mas sai');
  // pedido que vai e volta antes da histerese não derruba o combate
  const m2 = new MaestroCinzas('x'); m2.pedir('combate'); rodar(m2, 0, 5); rodar(m2, 5, 20, 0.1, 0.3, t => m2.pedir(Math.floor(t) % 6 < 3 ? 'exploracao' : 'combate')); assert.equal(m2.estado(), 'combate');
});

teste('música: determinístico por seed e independente do tamanho da janela do agendador', () => {
  const ex = (seed: string, passo: number, janela: number) => { const m = new MaestroCinzas(seed); m.pedir('exploracao'); return rodar(m, 0, 600, passo, janela).map(n => `${n.t.toFixed(4)}|${n.voz}|${n.midi}|${n.vel}`); };
  const a = ex('2026-11-04', 0.1, 0.3); assert.ok(a.length > 100);
  assert.deepEqual(a, ex('2026-11-04', 0.1, 0.3), 'mesma seed, mesma música');
  assert.deepEqual(a, ex('2026-11-04', 0.25, 0.4), 'janela diferente, mesmas notas (o relógio é o do AudioContext)');
  assert.notDeepEqual(a, ex('2026-11-05', 0.1, 0.3), 'outro dia, outra ordem ("a música de hoje")');
  const m = new MaestroCinzas('s'); m.pedir('exploracao'); rodar(m, 0, 200); const k = m.salvar(); const m2 = new MaestroCinzas('s'); m2.carregar(k); assert.equal(m2.k, m.k, 'o save guarda a posição na sequência');
});

teste('música: cota anti-fadiga — exploração ≤ 35% com melodia, sem repetir em 5 min, tema ≤ 3×/h, respiro depois do combate', () => {
  const m = new MaestroCinzas('2026-11-04'); m.contexto({ bioma: 'ermo', ato: 2 }); m.pedir('exploracao');
  const inicios = new Map<string, number[]>(); let ult = '';
  rodar(m, 0, 1800, 0.1, 0.3, t => { const s = m.segmento(); if (s && s !== ult) { const l = inicios.get(s) ?? []; l.push(t); inicios.set(s, l); ult = s; } });
  const [mel, tot] = m.tempoMelodia.exploracao!; entre(mel / tot, 0.05, 0.35, 'fração do tempo com melodia na exploração');
  const segMel = new Set(SEGMENTOS.filter(s => s.melodia).map(s => s.id));
  for (const [id, ts] of inicios) if (segMel.has(id)) for (let i = 1; i < ts.length; i++) assert.ok(ts[i] - ts[i - 1] >= SEM_REPETIR_S - 0.5, `${id} repetiu em ${(ts[i] - ts[i - 1]).toFixed(0)} s`);
  // uma hora no abrigo: a frase completa no máximo 3×
  const a = new MaestroCinzas('2026-11-04'); a.contexto({ ato: 2 }); a.pedir('abrigo'); let temas = 0, u = '';
  const ehTema = new Set(SEGMENTOS.filter(s => s.tema).map(s => s.id));
  rodar(a, 0, 3600, 0.2, 0.4, () => { const s = a.segmento(); if (s !== u) { if (ehTema.has(s)) temas++; u = s; } });
  assert.ok(temas >= 1 && temas <= TEMA_POR_HORA, `tema tocou ${temas}× na hora`);
  // respiro: depois do combate, 6–12 s sem nenhuma nota
  const c = new MaestroCinzas('r'); c.pedir('combate'); rodar(c, 0, 10); let tSaida = -1;
  const depois = rodar(c, 10, 40, 0.1, 0.3, t => { c.pedir('exploracao'); if (tSaida < 0 && c.estado() === 'exploracao') tSaida = t; });
  const primeira = depois.filter(n => n.t > tSaida).reduce((a2, n) => Math.min(a2, n.t), Infinity);
  entre(primeira - tSaida, 5.6, 13, 'respiro sem música depois do combate');
});

teste('música: densidade máxima de notas por segundo em todos os estados (o celular aguenta e não vira "metralhadora")', () => {
  const estados: EstadoMusical[] = ['menu', 'abrigo', 'exploracao', 'tensao', 'combate', 'colosso', 'viagem', 'morte', 'vitoria'];
  for (const e of estados) for (const gangue of [false, true]) {
    const m = new MaestroCinzas('d'); m.contexto({ gangue, ato: 4, bioma: 'cidade' }); m.pedir(e); const ns = rodar(m, 0, 120).sort((x, y) => x.t - y.t);
    let j = 0, max = 0, maxMel = 0; for (let i = 0; i < ns.length; i++) { while (ns[j].t < ns[i].t - 1) j++; max = Math.max(max, i - j + 1); }
    const mel = ns.filter(n => n.voz === 'rabeca' || n.voz === 'pifano' || n.voz === 'radio' || n.voz === 'sanfona'); j = 0;
    for (let i = 0; i < mel.length; i++) { while (mel[j].t < mel[i].t - 1) j++; maxMel = Math.max(maxMel, i - j + 1); }
    assert.ok(max <= 12, `${e}${gangue ? '/gangue' : ''}: ${max} notas em 1 s`); assert.ok(maxMel <= 6, `${e}: ${maxMel} notas melódicas em 1 s`);
    if (e !== 'morte' && e !== 'vitoria') assert.ok(ns.length > 0, `${e} tem música`);
  }
});

teste('música: morte = 1,5 s de vácuo e a incelência (só R) uma vez; vitória toca o final uma vez com o Fá♯', () => {
  const m = new MaestroCinzas('m'); m.pedir('exploracao'); rodar(m, 0, 20); m.cortar(1.5); m.pedir('morte');
  const ns = rodar(m, 20, 120); const cortes = m.tirarCortes(); assert.equal(cortes.length, 1); assert.equal(cortes[0].seg, 1.5);
  const primeira = Math.min(...ns.map(n => n.t)); entre(primeira - cortes[0].t, 1.5, 1.7, 'vácuo antes da incelência');
  assert.ok(ns.every(n => n.voz === 'coral'), 'à capela'); const alturas = new Set(ns.map(n => pc(n.midi))); assert.ok([...alturas].every(p => [0, 9, 5, 4, 2].includes(p)), 'só as notas de R');
  assert.ok(ns.length < 30, 'toca uma vez e depois silêncio');
  const v = new MaestroCinzas('v'); v.pedir('vitoria'); const vn = rodar(v, 0, 120); assert.ok(vn.some(n => pc(n.midi) === FA_SUST)); entre(Math.max(...vn.map(n => n.t)), 25, 35, 'o final não se repete');
});

teste('música: stinger quantizado no meio-tempo só quando está a ≤ 120 ms', () => {
  const m = new MaestroCinzas('q'); m.pedir('abrigo'); rodar(m, 0, 3); const meio = 60 / 66 / 2;
  const q = m.quantizar(3.0); assert.ok(q >= 3.0 && q - 3.0 <= 0.12 + 1e-9); const k = (q - m.log[m.log.length - 1].t) / meio; assert.ok(q === 3.0 || Math.abs(k - Math.round(k)) < 1e-6);
});

teste('música: vinheta da Farol 107,7 — três notas, a segunda falha SEMPRE no mesmo ponto; liberta só no fim, com Fá♯', () => {
  const a = notasVinheta(10), b = notasVinheta(10); assert.deepEqual(a, b, 'sem sorteio');
  const tons = a.filter(n => n.midi > 0); assert.equal(tons.length, 3); assert.deepEqual(tons.map(n => n.midi), VINHETA.loop.map(([m]) => m));
  const f = tons[1].falha!; assert.ok(f, 'a segunda nota falha'); const tempo = 60 / VINHETA.bpm; entre((f[0] - tons[1].t) / (VINHETA.loop[1][1] * tempo), 0.369, 0.371, 'falha em 37%'); assert.equal(f[1], -45);
  assert.ok(a.some(n => n.midi === 0 && Math.abs(n.t - f[0]) < 1e-9), 'estalo de estática no ponto da falha'); assert.ok(!a.some(n => pc(n.midi) === FA_SUST && n.midi));
  const l = notasVinheta(0, 'liberta'); assert.ok(!l.some(n => n.falha) && pc(l[2].midi) === FA_SUST, 'liberta: sem falha, Fá♯ no fim');
  const morse = motivoMorse('A7').filter(([m]) => m).map(([, d]) => d); assert.deepEqual(morse, [1, 3, 3, 3, 1, 1, 1], 'A7 = · — / — — · · ·');
});

teste('música: o diretor lê o Mundo e os eventos (abrigo, tensão, combate, Colosso, viagem, morte, vitória, furtivo)', () => {
  const d = new DiretorMusical(), b = new Barramento(), m = novoMundo(); d.ligar(b); m.zona.id = 'base'; m.zona.bioma = 'base'; m.hora = 14; m.ato = 2;
  const passo = (s: number) => { for (let t = 0; t < s; t += 0.05) d.tick(0.05, m); return d.maestro; };
  const estado = (s: number) => { passo(s); return (d.maestro as unknown as { pend: { e: string } | null }).pend?.e ?? d.maestro.estado(); };
  assert.equal(estado(0.2), 'abrigo');
  m.zona.id = 'ermo'; m.zona.bioma = 'ermo'; assert.equal(estado(0.2), 'exploracao');
  m.perigo = 0.3; assert.equal(estado(0.5), 'exploracao', 'tensão só depois de 1,5 s'); assert.equal(estado(1.2), 'tensao');
  m.perigo = 0.75; assert.equal(estado(1.1), 'combate');
  m.perigo = 0; b.emit({ t: 'dano', quem: 'jogador', valor: 10, fonte: 'colosso' }); assert.equal(estado(0.1), 'colosso');
  b.emit({ t: 'abate', arq: 'colosso', x: 0, y: 0 }); assert.equal(estado(4), 'exploracao', 'Colosso morto e sem dano recente: o mundo acalma'); assert.ok(d.maestro.agendar(100, 0.1).length === 0 && d.maestro.tirarCortes()[0]?.seg === 4, '4 s de silêncio total no abate do Colosso');
  passo(4); b.emit({ t: 'viagem', de: 'base', para: 'cidade', fase: 'inicio' }); assert.equal(estado(0.1), 'viagem'); b.emit({ t: 'viagem', de: 'base', para: 'cidade', fase: 'fim' });
  m.jogador.furtivo = true; passo(0.1); assert.equal(d.mix.corte, 900); assert.equal(d.mix.ganhoDb, -6); m.jogador.furtivo = false;
  m.jogador.hp = 20; passo(0.1); entre(d.vida01, 0.19, 0.21, 'vida para o batimento');
  b.emit({ t: 'musica', estado: 'menu', prioridade: 2 }); assert.equal(estado(0.1), 'menu'); b.emit({ t: 'musica', estado: 'menu', prioridade: -1 }); assert.equal(estado(0.1), 'exploracao');
  b.emit({ t: 'morte', causa: 'x' }); assert.equal(estado(0.1), 'morte'); b.emit({ t: 'vitoria' }); assert.equal(estado(0.1), 'vitoria');
  d.desligar();
});

teste('música: o menu sempre abre sintonizando o rádio (segmento de abertura), em qualquer seed', () => {
  for (const seed of ['a', 'b', '2026-11-04']) { const m = new MaestroCinzas(seed); m.pedir('menu'); m.agendar(0, 0.3); assert.equal(m.segmento(), 'menu_radio', seed); }
});
