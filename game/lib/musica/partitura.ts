// PARTITURA PROVISÓRIA da trilha do CINZAS — "Toada do Abrigo" e os seus derivados (docs/plano-goty/audio.md §2.4–2.5, §3.3).
// Escrita pela direção de áudio do sprint 1 para provar o motor; o(a) compositor(a) contratado(a) substitui este arquivo inteiro
// (mesmo formato: segmentos de N barras com notas em tempos). PURO: sem Web Audio, roda nos testes em Node.
// Regras verificáveis (musica.teste.ts): tudo em Ré, sem terça no I; Fá natural = perda; Fá♯ só no estado 'vitoria'.
import type { EstadoMusical, VozId } from '../../nucleo/contratos';

export const AUTORIA_PARTITURA = 'provisoria-direcao-de-audio' as const;
export const TONICA = 62; // Ré4
export const BPM_TEMA = 66;
export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** papel da nota na textura: os testes de faixa (300 Hz–4 kHz) valem para a melodia */
export type Papel = 'melodia' | 'harmonia' | 'baixo' | 'cama' | 'perc' | 'efeito';
/** b e d em tempos (unidade da fórmula de compasso do segmento); m = MIDI (0 = estática no rádio); v = 0..1 */
export type NotaPart = { b: number; d: number; m: number; v: number; voz: VozId; papel: Papel; pan?: number };
export type Contexto = { ato: number; noite: boolean; amanhecer: boolean; bioma: string; gangue: boolean };
export type Segmento = {
  id: string; estados: EstadoMusical[]; bpm: number; /** tempos por barra */ porBarra: number; compasso: '3/4' | '7/8';
  barras: number; notas: NotaPart[];
  /** tem linha melódica (entra na cota anti-fadiga e na regra dos 5 min) */ melodia: boolean;
  /** frase completa do tema (no máximo 3× por hora) */ tema?: boolean;
  /** toca uma vez e depois o estado fica em silêncio (morte, vitória) */ unico?: boolean;
  /** comprimento variável em segundos [mín, máx]: o padrão de `barras` se repete (silêncio musical com a cama) */ elastico?: [number, number];
  /** barras (contadas a partir de 0) em que o segmento aceita sair sem urgência; padrão: todas */ saidas?: number[];
  peso?: number; quando?: (c: Contexto) => boolean;
  /** micro-timing fixo de mão humana (o mesmo sempre: "errado de propósito", nunca sorteado) */ humano?: boolean;
  /** libera a terça maior (Fá♯): só o final */ picardia?: boolean;
  /** segmento de entrada: é o primeiro sempre que o estado começa (o menu sempre abre sintonizando o rádio) */ abertura?: boolean;
};

// ---------------------------------------------------------------- o tema (§2.4): [midi, tempos]; 0 = pausa
export type Frase = [number, number][];
/** Motivo M, "o chamado": Ré4–Lá4–Sol♯4–Lá4 (2, 1, ½, 2½) */
export const MOTIVO_M: Frase = [[62, 2], [69, 1], [68, 0.5], [69, 2.5]];
/** Resposta R, "a queda": Dó5–Lá4–Fá4–Mi4–Ré4 (1, 1, 1, 2, 1) */
export const RESPOSTA_R: Frase = [[72, 1], [69, 1], [65, 1], [64, 2], [62, 1]];
export const transpor = (f: Frase, st: number): Frase => f.map(([m, d]) => [m ? m + st : 0, d]);
export const aumentar = (f: Frase, k: number): Frase => f.map(([m, d]) => [m, d * k]);
export const tempos = (f: Frase) => f.reduce((a, [, d]) => a + d, 0);
/** M' = M uma 4ª acima: Sol4–Ré5–Dó♯5–Ré5 */
export const MOTIVO_M2 = transpor(MOTIVO_M, 5);
/** R' em meia cadência: Fá5–Ré5–Si♭4 | Lá4 (suspenso) */
export const RESPOSTA_R2: Frase = [[77, 1], [74, 1], [70, 1], [69, 3]];
/** frase completa: M | R | M' | R' = 8 barras de 3/4 (~22 s a ♩ = 66) */
export const FRASE: Frase = [...MOTIVO_M, ...RESPOSTA_R, ...MOTIVO_M2, ...RESPOSTA_R2];
/** harmonia por barra sobre o pedal de Ré (cordas soltas da afinação "Cinza"): [baixo, ...cordas do dedilhado] — sem terça no I */
export const HARMONIA: number[][] = [
  [50, 57, 62], [50, 57, 62], // Ré5
  [50, 58, 60, 62], [50, 58, 62], // Si♭(add9)/Ré, Si♭/Ré
  [50, 55, 62], [50, 55, 60, 64], // Sol5/Ré, Dó/Ré
  [50, 57, 62, 64], [50, 57, 62, 64], // Lá sus4 (Lá–Ré–Mi)
];

// ---------------------------------------------------------------- leitmotivs derivados (§2.4)
/** Colosso: M em aumentação (4× mais lento) nos graves do coral */
export const COLOSSO = transpor(aumentar(MOTIVO_M, 4), -12);
/** Combate: M em diminuição (colcheias) a ♩ = 132 — cabe em 1 barra */
export const M_DIM = aumentar(MOTIVO_M, 0.5), R_DIM = aumentar(RESPOSTA_R, 0.5), M2_DIM = aumentar(MOTIVO_M2, 0.5), R2_DIM = aumentar(RESPOSTA_R2, 0.5);
/** Gangues: a célula Sol♯–Lá da "sirene" como riff de rabeca em 7/8 (2+2+3), em colcheias */
export const GANGUE_78: Frase = [[68, 1], [69, 1], [68, 1], [69, 1], [68, 1], [69, 2]];
export const GANGUE_78_FIM: Frase = [[68, 1], [69, 1], [65, 1], [64, 1], [62, 3]];
/** Mascate: a sanfona toca M em maior (Ré–Lá–Si–Lá): o vizinho de baixo vira a sexta maior, curto e quente */
export const MASCATE: Frase = [[62, 1], [69, 0.5], [71, 0.5], [69, 1], [0, 0.5], [62, 0.5], [69, 0.5], [71, 0.5], [74, 2]];
/** Morte: só R, na incelência, na metade do andamento */
export const INCELENCIA: Frase = [...aumentar(RESPOSTA_R, 2), [0, 3], [72, 2], [69, 2], [65, 2], [64, 2], [65, 1], [64, 1], [62, 6], [0, 6]];
/** segunda voz da dupla caipira no final: terças paralelas por baixo, em Ré maior (a única vez que o Fá♯ aparece) */
export const SEGUNDA_VOZ: Frase = [[59, 2], [66, 1], [64, 0.5], [66, 2.5], [69, 1], [66, 1], [62, 1], [60, 2], [59, 1], [64, 2], [71, 1], [69, 0.5], [71, 2.5], [74, 1], [71, 1], [67, 1], [66, 3]];

// ---------------------------------------------------------------- vinheta da Farol 107,7 (vinheta.ts toca; aqui só a escrita)
/** três notas: Ré5–Lá4–Sol♯4. A segunda FALHA sempre no mesmo ponto (a fita pula: −45 cents e corta em 37% da nota) — pista do loop no roteiro.
 *  'liberta' (só na vitória): a falha some e a terceira nota resolve em Fá♯ — a terça maior guardada o jogo inteiro. */
export const VINHETA = {
  /** [midi, tempos] a ♩ = 132 */ loop: [[74, 1], [69, 1], [68, 2]] as Frase,
  liberta: [[74, 1], [69, 1], [66, 2]] as Frase,
  falha: { nota: 1, em: 0.37, cents: -45, estaticaS: 0.22 },
  bpm: 132,
} as const;

/** código Morse: o sinal do Abrigo 7 é o tema — as alturas de M em ritmo de "A7" (· — / — — · · ·), um tempo = um ponto */
export function motivoMorse(texto = 'A7'): Frase {
  const MORSE: Record<string, string> = { A: '.-', B: '-...', R: '.-.', I: '..', G: '--.', O: '---', '7': '--...', S: '...' };
  const alt = transpor(MOTIVO_M, 12).map(([m]) => m), f: Frase = []; let k = 0;
  for (const ch of texto.toUpperCase()) {
    const cod = MORSE[ch]; if (!cod) { f.push([0, 7]); continue; }
    for (const s of cod) { f.push([alt[k++ % alt.length], s === '.' ? 1 : 3]); f.push([0, 1]); }
    f.push([0, 2]);
  }
  return f;
}

// ---------------------------------------------------------------- construtores
const linha = (voz: VozId, papel: Papel, b0: number, f: Frase, v: number, pan?: number): NotaPart[] => {
  const o: NotaPart[] = []; let b = b0; for (const [m, d] of f) { if (m) o.push({ b, d, m, v, voz, papel, pan }); b += d; } return o;
};
/** a cama: drone por barra (o maestro corta na barra sem deixar cauda); `m` é a fundamental AUSENTE (ver PARCIAIS_DRONE) */
const cama = (barras: number, porBarra: number, m = 38, v = 0.5, de = 0): NotaPart[] =>
  Array.from({ length: barras }, (_, i) => ({ b: (de + i) * porBarra, d: porBarra * 1.25, m, v, voz: 'drone' as const, papel: 'cama' as const }));
/** dedilhado da viola: baixo no 1, cordas no 2 e no 3 ('cheio') ou só no 2 ('esparso'); harmonias por barra */
function dedilhado(harm: number[][], barras: number, v: number, jeito: 'cheio' | 'esparso' = 'cheio', de = 0, porBarra = 3): NotaPart[] {
  const o: NotaPart[] = [];
  for (let i = 0; i < barras; i++) {
    const [baixo, ...cordas] = harm[i % harm.length], b = (de + i) * porBarra;
    o.push({ b, d: porBarra, m: baixo, v: v * 1.1, voz: 'viola', papel: 'baixo' });
    for (const m of cordas) o.push({ b: b + 1, d: 2, m, v: v * 0.8, voz: 'viola', papel: 'harmonia' });
    if (jeito === 'cheio') for (const m of cordas.slice(-2)) o.push({ b: b + 2, d: 1, m, v: v * 0.6, voz: 'viola', papel: 'harmonia' });
  }
  return o;
}
/** pulso de semínimas na corda solta mais grave que o alto-falante ainda toca (Ré3, 147 Hz) */
const pulso = (barras: number, porBarra: number, v: number, so1 = false): NotaPart[] => {
  const o: NotaPart[] = [];
  for (let i = 0; i < barras * porBarra; i++) if (!so1 || i % porBarra === 0) o.push({ b: i, d: 0.9, m: 50, v: i % porBarra === 0 ? v : v * 0.6, voz: 'viola', papel: 'baixo' });
  return o;
};
/** baque de zabumba: tum (pele de cima, 45), bacalhau (vareta embaixo, 76) */
const baque = (barras: number, v: number, porBarra = 3): NotaPart[] => {
  const o: NotaPart[] = [];
  for (let i = 0; i < barras; i++) {
    const b = i * porBarra; o.push({ b, d: 0.5, m: 45, v, voz: 'zabumba', papel: 'perc' }, { b: b + 1.5, d: 0.25, m: 76, v: v * 0.55, voz: 'zabumba', papel: 'perc' }, { b: b + 2, d: 0.5, m: 45, v: v * 0.7, voz: 'zabumba', papel: 'perc' });
    if (i % 4 === 3) o.push({ b: b + 2.5, d: 0.25, m: 45, v: v * 0.6, voz: 'zabumba', papel: 'perc' });
  }
  return o;
};
const sino = (b: number, m: number, v: number): NotaPart => ({ b, d: 6, m, v, voz: 'sino', papel: 'efeito' });
const estatica = (b: number, d: number, v: number): NotaPart => ({ b, d, m: 0, v, voz: 'radio', papel: 'efeito' });

const seg = (s: Segmento): Segmento => s;
const T = 3; // tempos por barra em 3/4

// ---------------------------------------------------------------- os segmentos, por estado (§3.3). O maestro escolhe a ORDEM; nunca inventa notas.
export const SEGMENTOS: Segmento[] = [
  // silêncio deliberado: uma barra vazia que se repete
  seg({ id: 'silencio', estados: ['silencio'], bpm: 66, porBarra: T, compasso: '3/4', barras: 1, notas: [], melodia: false }),

  // MENU: o rádio AM sintoniza, a vinheta da Farol 107,7 falha, e o tema chega "de longe"
  seg({ id: 'menu_radio', estados: ['menu'], bpm: 66, porBarra: T, compasso: '3/4', barras: 10, melodia: true, abertura: true, saidas: [0, 4, 10],
    notas: [estatica(0, 2.5, 0.5), estatica(3, 2, 0.35), ...linha('radio', 'melodia', 6, [[74, 0.5], [69, 0.185], [0, 0.315], [68, 1]], 0.5), estatica(6.685, 0.35, 0.6),
      ...linha('radio', 'melodia', 12, [...MOTIVO_M, ...RESPOSTA_R], 0.55), estatica(24, 3, 0.3), ...cama(6, T, 38, 0.25, 4)] }),
  seg({ id: 'menu_estatica', estados: ['menu'], bpm: 66, porBarra: T, compasso: '3/4', barras: 6, melodia: true,
    notas: [estatica(0, 3, 0.25), ...linha('radio', 'melodia', 6, MOTIVO_M, 0.4), estatica(12, 3, 0.2), ...cama(6, T, 38, 0.25)] }),

  // ABRIGO: o tema inteiro, viola perto (ato 1: só M, fragmentado; ato 4: com coral; noite: rabeca lenta, menos notas)
  seg({ id: 'abrigo_toada', estados: ['abrigo'], bpm: 66, porBarra: T, compasso: '3/4', barras: 8, melodia: true, tema: true, humano: true, saidas: [4, 8], peso: 3,
    quando: c => c.ato >= 2 && c.ato < 4 && !c.noite, notas: [...linha('viola', 'melodia', 0, FRASE, 0.75, -0.1), ...dedilhado(HARMONIA, 8, 0.32), ...cama(8, T)] }),
  seg({ id: 'abrigo_toada_coral', estados: ['abrigo'], bpm: 66, porBarra: T, compasso: '3/4', barras: 8, melodia: true, tema: true, humano: true, saidas: [4, 8], peso: 3,
    quando: c => c.ato >= 4, notas: [...linha('viola', 'melodia', 0, FRASE, 0.75, -0.1), ...dedilhado(HARMONIA, 8, 0.3), ...linha('coral', 'harmonia', 0, [[57, 6], [58, 6], [55, 6], [57, 6]], 0.22), ...cama(8, T)] }),
  seg({ id: 'abrigo_m_solo', estados: ['abrigo'], bpm: 66, porBarra: T, compasso: '3/4', barras: 6, melodia: true, humano: true, peso: 2,
    notas: [...linha('viola', 'melodia', 0, MOTIVO_M, 0.7, -0.1), ...dedilhado(HARMONIA.slice(0, 1), 4, 0.28, 'esparso', 2), ...linha('viola', 'melodia', 12, [[62, 2], [69, 4]], 0.6, -0.1), ...cama(6, T)] }),
  seg({ id: 'abrigo_noite', estados: ['abrigo'], bpm: 66, porBarra: T, compasso: '3/4', barras: 6, melodia: true, humano: true, peso: 3, quando: c => c.noite,
    notas: [...linha('rabeca', 'melodia', 0, aumentar(RESPOSTA_R, 3).slice(0, 4).concat([[62, 3]]) as Frase, 0.45, 0.2), ...dedilhado([[50, 57, 62], [50, 58, 62]], 6, 0.22, 'esparso'), ...cama(6, T, 38, 0.4)] }),
  seg({ id: 'abrigo_respiro', estados: ['abrigo'], bpm: 66, porBarra: T, compasso: '3/4', barras: 4, melodia: false, notas: [sino(0, 74, 0.18), ...cama(4, T, 38, 0.4)] }),

  // EXPLORAÇÃO: M sozinho, muito espaço; entre blocos, silêncio musical (só a cama) de 45–120 s
  seg({ id: 'exp_m_rabeca', estados: ['exploracao'], bpm: 66, porBarra: T, compasso: '3/4', barras: 8, melodia: true, peso: 2, quando: c => c.bioma !== 'floresta',
    notas: [...linha('rabeca', 'melodia', 0, MOTIVO_M, 0.5, 0.25), ...linha('rabeca', 'melodia', 12, [[62, 2], [69, 4]], 0.4, 0.25), ...cama(8, T)] }),
  seg({ id: 'exp_m_pifano', estados: ['exploracao'], bpm: 66, porBarra: T, compasso: '3/4', barras: 8, melodia: true, quando: c => c.bioma === 'floresta' || c.amanhecer, peso: 3,
    notas: [...linha('pifano', 'melodia', 0, transpor(MOTIVO_M, 12), 0.45, 0.3), ...linha('pifano', 'melodia', 1.5, transpor(MOTIVO_M, 12), 0.16, -0.4), ...linha('pifano', 'melodia', 12, [[74, 2], [81, 4]], 0.38, 0.3), ...cama(8, T, 38, 0.4)] }),
  seg({ id: 'exp_r_viola', estados: ['exploracao'], bpm: 66, porBarra: T, compasso: '3/4', barras: 6, melodia: true, humano: true, peso: 2,
    notas: [...linha('viola', 'melodia', 0, RESPOSTA_R, 0.6, -0.15), ...dedilhado(HARMONIA.slice(2, 4), 2, 0.24, 'esparso', 2), ...cama(6, T)] }),
  seg({ id: 'exp_cidade_radio', estados: ['exploracao'], bpm: 66, porBarra: T, compasso: '3/4', barras: 6, melodia: true, peso: 5, quando: c => c.bioma === 'cidade',
    notas: [estatica(0, 1.5, 0.3), ...linha('radio', 'melodia', 1.5, [[62, 1], [69, 1], [71, 0.5], [69, 1.5], [74, 1], [71, 1], [69, 1], [67, 2], [62, 2]], 0.45, 0.5), estatica(15, 3, 0.25), ...cama(6, T, 38, 0.35)] }),
  seg({ id: 'exp_ar', estados: ['exploracao'], bpm: 66, porBarra: T, compasso: '3/4', barras: 1, melodia: false, elastico: [45, 120], notas: cama(1, T, 38, 0.45) }),

  // TENSÃO: a melodia some; pulso de Ré3 e o cluster Sol♯–Lá–Si♭ no coral ("medo")
  seg({ id: 'tensao_pulso', estados: ['tensao'], bpm: 66, porBarra: T, compasso: '3/4', barras: 4, melodia: false,
    notas: [...pulso(4, T, 0.34), ...linha('coral', 'cama', 0, [[56, 12]], 0.1), ...linha('coral', 'cama', 0, [[57, 12]], 0.1), ...linha('coral', 'cama', 0, [[58, 12]], 0.08), ...cama(4, T, 38, 0.6)] }),
  seg({ id: 'tensao_pulso_b', estados: ['tensao'], bpm: 66, porBarra: T, compasso: '3/4', barras: 4, melodia: false,
    notas: [...pulso(4, T, 0.3), { b: 3, d: 0.5, m: 45, v: 0.35, voz: 'zabumba', papel: 'perc' }, { b: 9, d: 0.5, m: 45, v: 0.4, voz: 'zabumba', papel: 'perc' }, ...cama(4, T, 38, 0.6)] }),
  seg({ id: 'tensao_aumentacao', estados: ['tensao'], bpm: 66, porBarra: T, compasso: '3/4', barras: 4, melodia: true,
    notas: [...linha('rabeca', 'melodia', 0, aumentar(MOTIVO_M, 2), 0.28, 0.3), ...pulso(4, T, 0.3, true), ...cama(4, T, 38, 0.6)] }),

  // COMBATE: ♩ = 132 (2× o tema, troca sem quebra): baque de zabumba, pulso de viola e M em diminuição na rabeca
  seg({ id: 'combate_a', estados: ['combate'], bpm: 132, porBarra: T, compasso: '3/4', barras: 4, melodia: false,
    notas: [...linha('rabeca', 'melodia', 0, [...M_DIM, ...M_DIM, ...R_DIM, ...M2_DIM], 0.55, 0.25), ...pulso(4, T, 0.4), ...baque(4, 0.8), ...cama(4, T, 38, 0.6)] }),
  seg({ id: 'combate_b', estados: ['combate'], bpm: 132, porBarra: T, compasso: '3/4', barras: 4, melodia: false,
    notas: [...linha('rabeca', 'melodia', 0, [...R_DIM, ...R2_DIM, ...M_DIM, ...M_DIM], 0.55, 0.25), ...pulso(4, T, 0.4), ...baque(4, 0.8), ...cama(4, T, 38, 0.6)] }),
  seg({ id: 'combate_c', estados: ['combate'], bpm: 132, porBarra: T, compasso: '3/4', barras: 4, melodia: false, peso: 0.6,
    notas: [...pulso(4, T, 0.45), ...baque(4, 0.9), ...linha('coral', 'cama', 0, [[57, 6], [56, 6]], 0.12), ...cama(4, T, 38, 0.65)] }),
  seg({ id: 'combate_gangue', estados: ['combate'], bpm: 264, porBarra: 7, compasso: '7/8', barras: 4, melodia: false, peso: 6, quando: c => c.gangue,
    notas: [...linha('rabeca', 'melodia', 0, [...GANGUE_78, ...GANGUE_78, ...GANGUE_78, ...GANGUE_78_FIM], 0.6, 0.25),
      ...[0, 7, 14, 21].flatMap(b => [0, 2, 4].map((k, i) => ({ b: b + k, d: 0.8, m: i ? 76 : 45, v: i ? 0.45 : 0.8, voz: 'zabumba' as const, papel: 'perc' as const }))),
      ...[0, 7, 14, 21].flatMap(b => [0, 2, 4].map(k => ({ b: b + k, d: 1.5, m: 50, v: 0.32, voz: 'viola' as const, papel: 'baixo' as const }))), ...cama(4, 7, 38, 0.6)] }),

  // COLOSSO: M em aumentação ×4 no coral grave, a sirene (Sol♯–Lá, com portamento) na rabeca aguda e as alfaias
  seg({ id: 'colosso_coral', estados: ['colosso'], bpm: 66, porBarra: T, compasso: '3/4', barras: 8, melodia: false,
    notas: [...linha('coral', 'harmonia', 0, COLOSSO, 0.45), ...linha('coral', 'cama', 0, [[56, 24]], 0.14), ...linha('rabeca', 'melodia', 0, [[80, 6], [81, 6], [80, 6], [81, 6]], 0.32, 0.35),
      ...Array.from({ length: 8 }, (_, i) => ({ b: i * T, d: 0.6, m: 43, v: 0.85, voz: 'zabumba' as const, papel: 'perc' as const })),
      ...[4, 5, 6, 7].map(i => ({ b: i * T + 2, d: 0.5, m: 43, v: 0.6, voz: 'zabumba' as const, papel: 'perc' as const })), ...cama(8, T, 38, 0.7)] }),
  seg({ id: 'colosso_alfaias', estados: ['colosso'], bpm: 66, porBarra: T, compasso: '3/4', barras: 4, melodia: false,
    notas: [...linha('coral', 'harmonia', 0, [[50, 6], [56, 6]], 0.4), ...linha('coral', 'harmonia', 0, [[57, 6], [57, 6]], 0.25), ...baque(4, 0.9), ...pulso(4, T, 0.35), ...cama(4, T, 38, 0.7)] }),

  // VIAGEM: toada de estrada na viola, ♩ = 100
  seg({ id: 'viagem_toada', estados: ['viagem'], bpm: 100, porBarra: T, compasso: '3/4', barras: 8, melodia: true, humano: true,
    notas: [...dedilhado([[50, 57, 62], [50, 55, 60, 64], [50, 57, 62], [50, 57, 62, 64]], 8, 0.3), ...linha('viola', 'melodia', 0, MOTIVO_M, 0.6, -0.1), ...linha('viola', 'melodia', 12, RESPOSTA_R, 0.55, -0.1), ...cama(8, T, 38, 0.35)] }),
  seg({ id: 'viagem_estrada', estados: ['viagem'], bpm: 100, porBarra: T, compasso: '3/4', barras: 8, melodia: true, humano: true,
    notas: [...dedilhado([[50, 57, 62], [50, 58, 62], [50, 55, 62], [50, 57, 62, 64]], 8, 0.3), ...linha('pifano', 'melodia', 6, transpor(MOTIVO_M, 12), 0.35, 0.3), ...cama(8, T, 38, 0.35)] }),

  // MORTE: (1,5 s de vácuo é do maestro) e depois só R na incelência, à capela
  seg({ id: 'morte_incelencia', estados: ['morte'], bpm: 66, porBarra: T, compasso: '3/4', barras: 14, melodia: true, unico: true, saidas: [14],
    notas: linha('coral', 'melodia', 0, INCELENCIA, 0.5) }),

  // VITÓRIA: a frase inteira com a dupla em terças e, no fim, Ré maior: a primeira vez que o Fá♯ soa no jogo
  seg({ id: 'vitoria_final', estados: ['vitoria'], bpm: 66, porBarra: T, compasso: '3/4', barras: 11, melodia: true, tema: true, unico: true, humano: true, picardia: true, saidas: [11],
    notas: [...linha('viola', 'melodia', 0, FRASE, 0.75, -0.2), ...linha('rabeca', 'harmonia', 0, SEGUNDA_VOZ, 0.45, 0.25), ...dedilhado(HARMONIA, 8, 0.3),
      ...linha('viola', 'melodia', 24, [[74, 9]], 0.7, -0.2), ...linha('rabeca', 'harmonia', 24, [[66, 9]], 0.45, 0.25), ...dedilhado([[50, 57, 62, 66]], 3, 0.32, 'cheio', 8),
      ...linha('coral', 'harmonia', 24, [[62, 9]], 0.25), ...linha('coral', 'harmonia', 24, [[66, 9]], 0.22), ...linha('coral', 'harmonia', 24, [[69, 9]], 0.2), sino(30, 74, 0.25), ...cama(11, T, 38, 0.4)] }),
];

/** a sanfona do mascate, diegética (toca no mundo, não na trilha): audio.ts a espacializa pela distância */
export const SANFONA_MASCATE: Segmento = seg({ id: 'mascate_sanfona', estados: [], bpm: 100, porBarra: T, compasso: '3/4', barras: 3, melodia: true,
  notas: [...linha('sanfona', 'melodia', 0, MASCATE, 0.55), ...linha('sanfona', 'harmonia', 0, [[50, 3], [57, 3], [50, 3]], 0.3)] });

// ---------------------------------------------------------------- stingers no tom (P0 0.3): notas de M em Ré; [midi, atraso s]
export const STINGERS = {
  nivel: [[74, 0], [81, 0.085], [80, 0.17], [81, 0.255]] as [number, number][], // Ré5–Lá5–Sol♯5–Lá5
  conquista: [[81, 0], [88, 0.13], [86, 0.28]] as [number, number][], // Lá5–Mi6–Ré6
  raro: [[81, 0], [88, 0.11]] as [number, number][], // Lá5–Mi6 (as receitas raro1/raro2 já estavam no tom)
  sinal: [[86, 0], [93, 0.16]] as [number, number][], // Ré6–Lá6: o "chamado" (quinta ascendente)
  /** a vitória da campanha é a vinheta liberta: Ré–Lá–Fá♯–Ré */
  vitoria: [[74, 0], [81, 0.13], [78, 0.26], [86, 0.39]] as [number, number][],
};

// ---------------------------------------------------------------- timbres puros (orquestra.ts usa; os testes medem)
/** drone com FUNDAMENTAL AUSENTE: harmônicos 2..6 da nota (amplitudes), o 1º em zero. Para Ré2 (73 Hz): 147/220/294/367/440 Hz —
 *  o cérebro "ouve" o Ré2 que o alto-falante do celular não toca (corta abaixo de ~140 Hz). */
export const PARCIAIS_DRONE = [0, 0, 1, 0.75, 0.5, 0.28, 0.16];
/** o segundo oscilador da cama, desafinado em 0,6 Hz: o batimento lento e SEMPRE igual ("disco empenado", §2.1) */
export const BATIMENTO_DRONE_HZ = 0.6;
/** rabeca afinada em Lá = 436 contra a viola em 440 (≈ −16 cents) */
export const DETUNE_RABECA = 1200 * Math.log2(436 / 440);
/** vogais do coral: formantes [Hz, ganho] (Peterson & Barney, voz média) */
export const FORMANTES: Record<'a' | 'u', [number, number][]> = { a: [[730, 1], [1090, 0.5], [2440, 0.25]], u: [[300, 1], [870, 0.35], [2240, 0.12]] };
/** parciais inarmônicos de sino de igreja (razões da fundamental) e decaimento relativo */
export const PARCIAIS_SINO: [number, number][] = [[0.5, 0.6], [1, 1], [1.183, 0.5], [1.506, 0.35], [2, 0.3], [2.514, 0.2], [2.662, 0.15]];

/** todas as notas que a trilha pode tocar (para os testes e para pré-aquecer os buffers da viola) */
export const todosSegmentos = () => [...SEGMENTOS, SANFONA_MASCATE];
export const segmentosDe = (e: EstadoMusical) => SEGMENTOS.filter(s => s.estados.includes(e));
