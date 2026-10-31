// Sons procedurais: receitas ZzFX, categorias de volume e EQUALIZAÇÃO de loudness. PURO: roda em Node nos testes (sem Web Audio).
// Cada som pertence a uma categoria com um nível-alvo; ao montar o som ele é normalizado para esse nível (energia média em 200 ms) sem passar
// do teto de pico, então um tiro, um passo e um clique de menu ficam na proporção certa sem ajuste manual de volume por som.
export const PRE: Record<string, number[]> = {
  tiro: [1.1, 0.05, 190, 0.005, 0.03, 0.2, 4, 3, -8, 0, 0, 0, 0, 1.5, 0, 0.2, 0, 0.7, 0.04],
  tiro_escopeta: [1.5, 0.1, 120, 0.004, 0.05, 0.36, 4, 2.5, -6, 0, 0, 0, 0, 2.5, 0, 0.3, 0, 0.8, 0.08],
  tiro_rifle: [1.3, 0.03, 260, 0.002, 0.03, 0.3, 4, 3, -9, 0, 0, 0, 0, 1.2, 0, 0.15, 0.04, 0.7, 0.05],
  tiro_inimigo: [0.9, 0.08, 170, 0.005, 0.03, 0.22, 4, 3, -7, 0, 0, 0, 0, 1.5, 0, 0.2, 0, 0.7, 0.04],
  seco: [0.4, 0, 900, 0, 0, 0.02, 4],
  swing: [0.35, 0.2, 320, 0.01, 0.02, 0.08, 4, 0, -4, 0, 0, 0, 0, 4],
  golpe: [0.9, 0.1, 130, 0.005, 0.02, 0.1, 4, 2, -3, 0, 0, 0, 0, 3, 0, 0, 0, 0.5, 0.02],
  carne: [1, 0.1, 85, 0.005, 0.04, 0.18, 4, 2, -5, 0, 0, 0, 0, 2],
  metal: [0.8, 0.05, 520, 0.001, 0.02, 0.25, 0, 1, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0.5, 0.05],
  dano: [1, 0.1, 80, 0.01, 0.06, 0.25, 2, 1.5, -4, 0, 0, 0, 0, 2, 0, 0, 0, 0.6, 0.1],
  saque: [0.45, 0.2, 380, 0.02, 0.03, 0.07, 1, 1],
  achado: [0.5, 0, 660, 0.01, 0.06, 0.2, 0, 1, 0, 0, 120, 0.05],
  raro1: [0.7, 0, 880, 0.01, 0.12, 0.35, 0, 1], raro2: [0.7, 0, 1320, 0.01, 0.2, 0.5, 0, 1],
  comer: [0.5, 0.3, 280, 0.02, 0.05, 0.1, 4, 0, 4, 0, 0, 0, 0, 5],
  beber: [0.4, 0.3, 420, 0.02, 0.08, 0.12, 1, 0, -2, 0, 0, 0, 0, 0.5],
  curar: [0.5, 0, 520, 0.02, 0.1, 0.3, 0, 1, 2],
  porta: [0.6, 0.1, 70, 0.02, 0.1, 0.15, 4, 3, 0, 0, 0, 0, 0, 2],
  morte: [1, 0, 70, 0.02, 0.3, 0.8, 2, 2, -6],
  clique: [0.3, 0, 520, 0, 0.01, 0.05, 1], ok: [0.35, 0, 740, 0, 0.04, 0.1, 0, 1, 0, 0, 90, 0.04], erro: [0.4, 0, 180, 0, 0.05, 0.1, 2, 1], abrir: [0.3, 0, 400, 0.01, 0.03, 0.08, 1, 1, 6],
  passo_terra: [0.22, 0.5, 70, 0.002, 0.01, 0.06, 4, 0, 0, 0, 0, 0, 0, 3], passo_areia: [0.2, 0.5, 120, 0.004, 0.02, 0.09, 4, 0, 0, 0, 0, 0, 0, 5], passo_concreto: [0.28, 0.4, 150, 0, 0.005, 0.04, 4, 0, 0, 0, 0, 0, 0, 1], passo_madeira: [0.3, 0.3, 100, 0, 0.01, 0.07, 4, 0, 0, 0, 0, 0, 0, 1.5],
  passo_metal: [0.3, 0.2, 320, 0, 0.005, 0.08, 0, 1, 0, 0, 0, 0, 0, 0.6], passo_agua: [0.3, 0.4, 260, 0.01, 0.03, 0.1, 1, 0, 6, 0, 0, 0, 0, 3], passo_azulejo: [0.26, 0.3, 190, 0, 0.005, 0.05, 4, 0, 0, 0, 0, 0, 0, 0.8],
  zumbi: [0.5, 0.35, 70, 0.04, 0.2, 0.4, 3, 2, -1, 0, 0, 0, 0, 1.5, 12], corredor: [0.55, 0.3, 140, 0.02, 0.12, 0.25, 3, 2, 3, 0, 0, 0, 0, 1.5, 20], colosso: [1.2, 0.2, 40, 0.06, 0.4, 0.9, 3, 3, -1, 0, 0, 0, 0, 2.5, 25],
  cao: [0.55, 0.25, 360, 0.01, 0.06, 0.14, 2, 1.5, -12, 0, 0, 0, 0, 0.5], javali: [0.6, 0.2, 110, 0.02, 0.1, 0.2, 3, 2, -2, 0, 0, 0, 0, 1], cervo: [0.4, 0.2, 520, 0.02, 0.08, 0.3, 0, 1, -3], rato: [0.35, 0.3, 1600, 0.005, 0.03, 0.08, 2, 1, -5], inseto: [0.35, 0.4, 900, 0.005, 0.02, 0.07, 4, 1, 0, 0, 0, 0, 0, 6], corvo: [0.4, 0.25, 700, 0.01, 0.06, 0.18, 2, 1, -6, 0, 0, 0, 0, 0.5, 18], humano: [0.5, 0.25, 160, 0.02, 0.1, 0.25, 3, 1.5, -2, 0, 0, 0, 0, 0.8, 8],
  grilo: [0.1, 0, 4400, 0.001, 0.012, 0.03, 0, 1], passaro: [0.14, 0.2, 2400, 0.005, 0.03, 0.08, 0, 1, 18, 0, 0, 0, 0, 0],
  pegar: [0.45, 0.05, 780, 0.004, 0.02, 0.07, 0, 1, 0, 0, 180, 0.025], nota: [0.5, 0, 440, 0.005, 0.08, 0.35, 0, 1], alarme: [0.55, 0, 700, 0.01, 0.2, 0.12, 2, 1, 0, 0, -190, 0.1], sinal: [0.35, 0, 1300, 0.004, 0.05, 0.12, 0, 1, 0, 0, 420, 0.05, 0, 0.3],
  geiger: [0.5, 0.6, 2700, 0, 0, 0.004, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3], bat1: [0.9, 0, 58, 0.01, 0.05, 0.14, 0, 1, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.04], bat2: [0.7, 0, 52, 0.01, 0.04, 0.12, 0, 1, -2],
  freio: [0.6, 0.05, 1400, 0.03, 0.3, 0.45, 4, 2, -3, 0, 0, 0, 0, 2.2], partida: [0.9, 0.1, 55, 0.02, 0.25, 0.5, 4, 1.5, 4, 0, 0, 0, 0, 2],
};
export type Som = keyof typeof PRE;

// ---------------------------------------------------------------- categorias e níveis-alvo
export type Cat = 'tiro' | 'colosso' | 'impacto' | 'alerta' | 'voz' | 'coleta' | 'batida' | 'ui' | 'passo' | 'pontual';
/** nível-alvo de cada categoria: energia média em janela de 200 ms (dBFS) do som já normalizado, antes dos volumes dos barramentos */
export const NIVEL: Record<Cat, number> = { tiro: -12, colosso: -13, impacto: -15, alerta: -16, voz: -18, coleta: -20, batida: -16, ui: -22, passo: -26, pontual: -28 };
const LISTAS: [Cat, string[]][] = [
  ['tiro', ['tiro', 'tiro_escopeta', 'tiro_rifle', 'tiro_inimigo']], ['colosso', ['colosso']],
  ['impacto', ['golpe', 'carne', 'metal', 'dano', 'morte', 'porta', 'partida']], ['alerta', ['alarme', 'sinal', 'freio']],
  ['voz', ['zumbi', 'corredor', 'cao', 'javali', 'cervo', 'rato', 'inseto', 'corvo', 'humano']],
  ['coleta', ['saque', 'achado', 'raro1', 'raro2', 'comer', 'beber', 'curar', 'pegar', 'nota', 'swing']],
  ['ui', ['clique', 'ok', 'erro', 'abrir', 'seco']], ['batida', ['bat1', 'bat2']], ['pontual', ['grilo', 'passaro', 'geiger']],
];
export const catDe = (nome: string): Cat => (nome.startsWith('passo_') ? 'passo' : (LISTAS.find(([, l]) => l.includes(nome))?.[0] ?? 'coleta'));

// ---------------------------------------------------------------- medidas e normalização
export const TETO_PICO_DB = -3;
const db = (x: number) => 20 * Math.log10(Math.max(1e-9, x));
export function picoDb(s: ArrayLike<number>) { let p = 0; for (let i = 0; i < s.length; i++) p = Math.max(p, Math.abs(s[i])); return db(p); }
/** "volume sentido": a maior energia média em janelas de 200 ms (o ouvido soma o som curto nessa janela, então um estalo de 5 ms soa baixo) */
export function loudnessDb(s: ArrayLike<number>, fs = 44100): number {
  const w = Math.round(fs * 0.2), n = s.length, soma = new Float64Array(n + 1), passo = Math.max(1, Math.round(fs * 0.01)); let melhor = 0;
  for (let i = 0; i < n; i++) soma[i + 1] = soma[i] + s[i] * s[i];
  for (let i = 0; i < n; i += passo) melhor = Math.max(melhor, (soma[Math.min(n, i + w)] - soma[i]) / w);
  return 10 * Math.log10(Math.max(1e-12, melhor));
}
/** ganho linear que leva o som ao nível-alvo sem passar do teto de pico (som mudo = 1) */
export function ganhoPara(s: ArrayLike<number>, alvoDb: number, fs = 44100, teto = TETO_PICO_DB) {
  const l = loudnessDb(s, fs); if (l < -90) return 1;
  return 10 ** (Math.min(alvoDb - l, teto - picoDb(s)) / 20);
}
/** normaliza as amostras no lugar para o nível da categoria do som; devolve o ganho aplicado */
export function normalizar(s: Float32Array | number[], nome: string, fs = 44100) { const g = ganhoPara(s, NIVEL[catDe(nome)], fs); for (let i = 0; i < s.length; i++) s[i] *= g; return g; }

// ---------------------------------------------------------------- mixagem: nível base, ducking e perfis de equalização
/** ganho linear aplicado aos sons já normalizados (junto com os volumes dos barramentos): mantém o tiro perto de −22 dBFS de energia */
export const NIVEL_BASE = 0.34;
/** quando um som destes toca, o ambiente e a música abaixam [dB, segundos de espera] para o efeito aparecer */
export const DUCK: Partial<Record<Cat, [number, number]>> = { tiro: [7, 0.18], colosso: [5, 0.3], impacto: [3, 0.12], alerta: [4, 0.4] };
export type Perfil = 'equilibrado' | 'celular' | 'fone' | 'noturno';
export type PerfilEq = {
  nome: string; desc: string; /** passa-alta (Hz) */ hp: number;
  /** [frequência Hz, ganho dB] da prateleira de graves */ grave: [number, number]; /** [Hz, dB, Q] do realce de médios (presença) */ medio: [number, number, number];
  /** [Hz, dB] da prateleira de agudos */ agudo: [number, number]; /** compressor: [limiar dB, razão, joelho dB] */ comp: [number, number, number]; /** ganho final */ trim: number;
};
export const PERFIS: Record<Perfil, PerfilEq> = {
  equilibrado: { nome: 'Equilibrado', desc: 'Mistura neutra, com os agudos suavizados.', hp: 40, grave: [120, 1], medio: [2400, -1.5, 0.8], agudo: [7000, -3], comp: [-20, 3, 20], trim: 1 },
  celular: { nome: 'Alto-falante do celular', desc: 'Corta os graves que o alto-falante não toca e realça a voz e os passos.', hp: 140, grave: [180, -4], medio: [1700, 2.5, 0.9], agudo: [8000, -2], comp: [-22, 4, 18], trim: 1.15 },
  fone: { nome: 'Fone de ouvido', desc: 'Graves cheios e agudos macios.', hp: 30, grave: [110, 2.5], medio: [2600, -1, 0.8], agudo: [7500, -3.5], comp: [-18, 3, 20], trim: 1 },
  noturno: { nome: 'Noturno', desc: 'Volume parelho: tiro não estoura e som baixo aparece.', hp: 60, grave: [140, -1], medio: [2200, -1.5, 0.8], agudo: [6500, -4], comp: [-28, 6, 12], trim: 0.8 },
};
export const PERFIS_ORDEM: Perfil[] = ['equilibrado', 'celular', 'fone', 'noturno'];
