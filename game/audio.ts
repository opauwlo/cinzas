// Áudio procedural: SFX por ZzFX (amostras próprias em barramentos), ambiente em camadas (vento, chuva, trovão, grilos, pássaros, fogo),
// Geiger como processo de Poisson, batimento, passos por superfície, vozes das criaturas e música de tensão.
type Z = typeof import('zzfx');
let z: Z | null = null, ctx: AudioContext | null = null, ligado = false;
let mestre: GainNode, bSfx: GainNode, bAmb: GainNode, bMus: GainNode;
let vol = { mestre: 0.8, sfx: 0.9, amb: 0.8, mus: 0.5 }, vibraOn = true;
let cpm = 0, batendo = false, ruidoBuf: AudioBuffer | null = null;
type Camadas = { vento: GainNode; ventoF: BiquadFilterNode; chuva: GainNode; chuvaF: BiquadFilterNode; fogo: GainNode };
let cam: Camadas | null = null, musica: { g: GainNode; f: BiquadFilterNode } | null = null;
const estado = { hora: 12, vento: 0, chuva: 0, interior: false, bioma: 'ermo', fogo: 0, perigo: 0, tempestade: 0, neblina: 0 };

const cache = new Map<string, AudioBuffer[]>();
const PRE: Record<string, number[]> = {
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
  nota: [0.5, 0, 440, 0.005, 0.08, 0.35, 0, 1], alarme: [0.55, 0, 700, 0.01, 0.2, 0.12, 2, 1, 0, 0, -190, 0.1], sinal: [0.35, 0, 1300, 0.004, 0.05, 0.12, 0, 1, 0, 0, 420, 0.05, 0, 0.3],
  geiger: [0.5, 0.6, 2700, 0, 0, 0.004, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3], bat1: [0.9, 0, 58, 0.01, 0.05, 0.14, 0, 1, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.04], bat2: [0.7, 0, 52, 0.01, 0.04, 0.12, 0, 1, -2],
};
export type Som = keyof typeof PRE;

export async function iniciarAudio() {
  if (ligado) return; ligado = true;
  try {
    z = await import('zzfx'); try { void z.ZZFX.audioContext.close(); } catch { /* */ }
    ctx = new AudioContext({ latencyHint: 'interactive' });
    mestre = ctx.createGain(); const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; mestre.connect(comp).connect(ctx.destination);
    bSfx = ctx.createGain(); bAmb = ctx.createGain(); bMus = ctx.createGain(); bSfx.connect(mestre); bAmb.connect(mestre); bMus.connect(mestre); aplicarVolumes();
    await ctx.resume(); ruidoBuf = criarRuido(); construirAmbiente(); geigerLoop(); batimentoLoop(); grilosLoop(); musicaLoop();
  } catch { ligado = false; }
}
export function aplicarVolumes(v?: Partial<typeof vol & { vibra: boolean }>) {
  if (v) { vol = { ...vol, ...v }; if (v.vibra !== undefined) vibraOn = v.vibra; }
  if (!ctx) return; const t = ctx.currentTime; mestre.gain.setTargetAtTime(vol.mestre, t, 0.05); bSfx.gain.setTargetAtTime(vol.sfx, t, 0.05); bAmb.gain.setTargetAtTime(vol.amb, t, 0.05); bMus.gain.setTargetAtTime(vol.mus * 0.55, t, 0.05);
}
export const vibra = (p: number | number[]) => { if (!vibraOn) return; try { navigator.vibrate?.(p); } catch { /* sem háptico */ } };

function criarRuido() { const n = ctx!.sampleRate * 3, b = ctx!.createBuffer(1, n, ctx!.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
function fonteRuido(loop = true) { const s = ctx!.createBufferSource(); s.buffer = ruidoBuf; s.loop = loop; if (loop) s.loopStart = Math.random() * 2; return s; }

function buffers(nome: string): AudioBuffer[] {
  let a = cache.get(nome); if (a) return a; const p = PRE[nome]; if (!p || !z || !ctx) return []; a = [];
  for (let i = 0; i < 3; i++) { const s = z.ZZFX.buildSamples(...p), b = ctx.createBuffer(1, s.length, z.ZZFX.sampleRate); b.getChannelData(0).set(s); a.push(b); }
  cache.set(nome, a); return a;
}
export function tocar(nome: Som, o: { vol?: number; pan?: number; rate?: number } = {}) {
  if (!ctx || !z) return; const bs = buffers(nome); if (!bs.length) return; const s = ctx.createBufferSource(); s.buffer = bs[(Math.random() * bs.length) | 0]; s.playbackRate.value = (o.rate ?? 1) * (0.94 + Math.random() * 0.12);
  const g = ctx.createGain(); g.gain.value = (o.vol ?? 1) * 0.35; s.connect(g); if (o.pan) { const p = new StereoPannerNode(ctx, { pan: Math.max(-1, Math.min(1, o.pan)) }); g.connect(p).connect(bSfx); } else g.connect(bSfx); s.start();
}
/** volume por distância (em tiles) e pan pelo deslocamento horizontal em tela */
export const aDist = (d: number) => Math.max(0, 1 - d / 22) ** 1.4;

// ---------------------------------------------------------------- camadas de ambiente
function construirAmbiente() {
  const c = ctx!; const vento = fonteRuido(), ventoF = c.createBiquadFilter(), vg = c.createGain(); ventoF.type = 'bandpass'; ventoF.frequency.value = 420; ventoF.Q.value = 0.7; vg.gain.value = 0; vento.connect(ventoF).connect(vg).connect(bAmb); vento.start();
  const chuva = fonteRuido(), chuvaF = c.createBiquadFilter(), cg = c.createGain(); chuvaF.type = 'lowpass'; chuvaF.frequency.value = 7000; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; cg.gain.value = 0; chuva.connect(hp).connect(chuvaF).connect(cg).connect(bAmb); chuva.start();
  const fogo = fonteRuido(), ff = c.createBiquadFilter(), fg = c.createGain(); ff.type = 'bandpass'; ff.frequency.value = 1800; ff.Q.value = 1.4; fg.gain.value = 0; fogo.connect(ff).connect(fg).connect(bAmb); fogo.start();
  cam = { vento: vg, ventoF, chuva: cg, chuvaF, fogo: fg };
  const mg = c.createGain(), mf = c.createBiquadFilter(); mf.type = 'lowpass'; mf.frequency.value = 220; mg.gain.value = 0.0; const o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55; o2.type = 'sine'; o2.frequency.value = 82.4; o3.type = 'triangle'; o3.frequency.value = 110.6;
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 90; lfo.connect(lg).connect(mf.frequency); o1.connect(mf); o2.connect(mf); o3.connect(mf); mf.connect(mg).connect(bMus); o1.start(); o2.start(); o3.start(); lfo.start(); musica = { g: mg, f: mf };
}
/** chamado ~10 vezes por segundo pela cena */
export function ambiente(e: Partial<typeof estado>) {
  Object.assign(estado, e); if (!ctx || !cam) return; const t = ctx.currentTime, i = estado.interior ? 0.28 : 1;
  cam.vento.gain.setTargetAtTime(Math.min(0.55, estado.vento * 0.5) * i, t, 0.6); cam.ventoF.frequency.setTargetAtTime(260 + estado.vento * 700, t, 0.8);
  cam.chuva.gain.setTargetAtTime(Math.min(0.5, estado.chuva * 0.5) * (estado.interior ? 0.35 : 1), t, 0.5); cam.chuvaF.frequency.setTargetAtTime(estado.interior ? 1400 : 7500, t, 0.3);
  cam.fogo.gain.setTargetAtTime(estado.fogo * 0.18, t, 0.3);
  if (musica) { const noite = estado.hora < 6 || estado.hora >= 20; musica.g.gain.setTargetAtTime((0.12 + estado.perigo * 0.2 + (noite ? 0.06 : 0)), t, 1.2); musica.f.frequency.setTargetAtTime(180 + estado.perigo * 520, t, 1.5); }
}
export function trovao(atraso: number) {
  if (!ctx) return; const c = ctx, t = c.currentTime + atraso, s = fonteRuido(false), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(90, t + 2.2);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9, t + 0.06); g.gain.exponentialRampToValueAtTime(0.01, t + 2.6); s.connect(f).connect(g).connect(bAmb); s.start(t, Math.random() * 1.5, 2.8); vibraEm(atraso, [60, 40, 90]);
}
const vibraEm = (s: number, p: number[]) => setTimeout(() => vibra(p), s * 1000);
function grilosLoop() { const passo = () => { if (!ligado) return; const noite = estado.hora < 6 || estado.hora >= 19.5, calmo = estado.chuva < 0.2 && estado.vento < 0.6 && !estado.interior; if (calmo && noite && ['ermo', 'floresta', 'pantano', 'base'].includes(estado.bioma)) { const n = 3 + ((Math.random() * 3) | 0); for (let i = 0; i < n; i++) setTimeout(() => tocar('grilo', { vol: 0.35, rate: 0.95 + Math.random() * 0.1 }), i * 70); } else if (calmo && !noite && estado.hora > 7 && Math.random() < 0.5 && estado.bioma !== 'industrial') tocar('passaro', { vol: 0.6, pan: Math.random() * 2 - 1, rate: 0.8 + Math.random() * 0.6 }); setTimeout(passo, 700 + Math.random() * 1800); }; passo(); }
function musicaLoop() { const escala = [0, 3, 5, 7, 10, 12]; const passo = () => { if (!ligado) return; if (ctx && vol.mus > 0.02 && Math.random() < 0.7) { const n = 55 * Math.pow(2, escala[(Math.random() * escala.length) | 0] / 12) * (Math.random() < 0.5 ? 2 : 4), o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime; o.type = 'triangle'; o.frequency.value = n; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08 + estado.perigo * 0.1, t + 0.04); g.gain.exponentialRampToValueAtTime(0.001, t + 2.4); o.connect(g).connect(bMus); o.start(t); o.stop(t + 2.6); } setTimeout(passo, 3500 + Math.random() * 7000 - estado.perigo * 2500); }; passo(); }
export const setGeiger = (v: number) => { cpm = v; };
function geigerLoop() { const passo = () => { if (!ligado) return; const taxa = Math.max(0.05, cpm / 60); if (cpm > 0) tocar('geiger', { vol: 0.6, rate: 0.9 + Math.random() * 0.3 }); setTimeout(passo, Math.min(4000, -Math.log(1 - Math.random()) / taxa * 1000)); }; passo(); }
export const setBatimento = (b: boolean) => { batendo = b; };
function batimentoLoop() { const passo = () => { if (!ligado) return; if (batendo) { tocar('bat1', { vol: 1 }); setTimeout(() => tocar('bat2', { vol: 0.8 }), 190); vibra([30, 70, 30]); } setTimeout(passo, 900); }; passo(); }

// ---------------------------------------------------------------- atalhos usados pela cena
export const sfx = {
  tiro: (arma: string) => { tocar(arma === 'escopeta' ? 'tiro_escopeta' : arma === 'rifle' ? 'tiro_rifle' : 'tiro'); vibra(arma === 'escopeta' ? 38 : 22); },
  tiroInimigo: (d: number, pan: number) => tocar('tiro_inimigo', { vol: aDist(d), pan }), seco: () => tocar('seco'), swing: () => tocar('swing'),
  golpe: () => { tocar('golpe'); vibra(18); }, acerto: (carne = true) => { tocar(carne ? 'carne' : 'metal'); vibra([20, 20, 30]); }, dano: () => { tocar('dano'); vibra([70, 30, 40]); },
  saque: () => tocar('saque'), achado: () => tocar('achado'), raro: () => { tocar('raro1'); setTimeout(() => tocar('raro2'), 110); vibra([30, 40, 30, 40, 90]); },
  comer: () => tocar('comer'), beber: () => tocar('beber'), curar: () => tocar('curar'), porta: () => tocar('porta'), morte: () => { tocar('morte'); vibra([200, 80, 300]); },
  vitoria: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime; o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9); o.connect(g).connect(bSfx); o.start(t); o.stop(t + 1); }, i * 130)); vibra([40, 40, 40, 40, 120]); },
  ui: (k: 'clique' | 'ok' | 'erro' | 'abrir' = 'clique') => tocar(k),
  nivel: () => { [0, 4, 7, 12].forEach((s, i) => setTimeout(() => tocar('nota', { rate: 2 ** (s / 12) }), i * 85)); vibra([40, 30, 90]); },
  conquista: () => { tocar('raro1'); setTimeout(() => tocar('raro2'), 130); setTimeout(() => tocar('nota', { rate: 2 }), 280); vibra([30, 40, 30, 40, 90]); },
  alarme: () => { for (let i = 0; i < 4; i++) setTimeout(() => tocar('alarme'), i * 430); vibra([180, 90, 180, 90, 180]); },
  sinal: () => { tocar('sinal'); setTimeout(() => tocar('sinal', { rate: 1.25 }), 160); },
  passo: (sup: string, correr: boolean, v = 1) => tocar(('passo_' + sup) as Som in PRE ? ('passo_' + sup) as Som : 'passo_terra', { vol: (correr ? 1 : 0.6) * v, rate: correr ? 1.12 : 0.95 }),
  voz: (tipo: string, d: number, pan: number, v = 1) => tocar((tipo in PRE ? tipo : 'zumbi') as Som, { vol: aDist(d) * v, pan }),
};
export const trocarAmbiente = ambiente;
