// Áudio procedural: ZzFX para SFX, Geiger como processo de Poisson, batimento com HP baixo (HANDOFF §4).
type Z = typeof import('zzfx');
let z: Z | null = null;
let ctx: AudioContext | null = null;
let cpm = 0, batendo = false, ligado = false;

export async function iniciarAudio() {
  if (ligado) return; ligado = true;
  try {
    z = await import('zzfx');
    ctx = new AudioContext({ latencyHint: 'interactive' });
    z.ZZFX.audioContext = ctx; z.ZZFX.volume = 0.32;
    await ctx.resume();
    vento(); geigerLoop(); batimentoLoop();
  } catch { ligado = false; }
}
const tocar = (...p: (number | undefined)[]) => { try { z?.zzfx(...p); } catch { /* sem áudio */ } };

function vento() {
  if (!ctx) return;
  const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  let l = 0; for (let i = 0; i < n; i++) { l = l * 0.985 + (Math.random() * 2 - 1) * 0.06; d[i] = l; }
  const s = ctx.createBufferSource(); s.buffer = b; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
  const g = ctx.createGain(); g.gain.value = 0.55; s.connect(f).connect(g).connect(ctx.destination); s.start();
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 180; lfo.connect(lg).connect(f.frequency); lfo.start();
}
export function setGeiger(v: number) { cpm = v; }
function geigerLoop() {
  const passo = () => {
    if (!ligado) return;
    const taxa = Math.max(0.05, cpm / 60);
    if (cpm > 0) tocar(0.5, 0.6, 2600 + Math.random() * 900, 0, 0, 0.004, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0.3);
    setTimeout(passo, Math.min(4000, -Math.log(1 - Math.random()) / taxa * 1000)); // intervalos exponenciais
  };
  passo();
}
export function setBatimento(b: boolean) { batendo = b; }
function batimentoLoop() {
  const passo = () => {
    if (!ligado) return;
    if (batendo) { tocar(0.9, 0, 58, 0.01, 0.05, 0.14, 0, 1, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.04); setTimeout(() => tocar(0.7, 0, 52, 0.01, 0.04, 0.12, 0, 1, -2), 190); vibra([30, 70, 30]); }
    setTimeout(passo, 900);
  };
  passo();
}
export function vibra(p: number | number[]) { try { navigator.vibrate?.(p); } catch { /* sem háptico */ } }

export const sfx = {
  tiro: () => { tocar(1.1, 0.05, 190, 0.005, 0.03, 0.2, 4, 3, -8, 0, 0, 0, 0, 1.5, 0, 0.2, 0, 0.7, 0.04); vibra(22); },
  seco: () => tocar(0.4, 0, 900, 0, 0, 0.02, 4),
  golpe: () => { tocar(0.7, 0.1, 130, 0.005, 0.02, 0.1, 4, 2, -3, 0, 0, 0, 0, 3, 0, 0, 0, 0.5, 0.02); vibra(18); },
  acerto: () => { tocar(1, 0.1, 85, 0.005, 0.04, 0.18, 4, 2, -5, 0, 0, 0, 0, 2); vibra([20, 20, 30]); },
  dano: () => { tocar(1, 0.1, 80, 0.01, 0.06, 0.25, 2, 1.5, -4, 0, 0, 0, 0, 2, 0, 0, 0, 0.6, 0.1); vibra([70, 30, 40]); },
  saque: () => tocar(0.45, 0.2, 380, 0.02, 0.03, 0.07, 1, 1),
  achado: () => tocar(0.5, 0, 660, 0.01, 0.06, 0.2, 0, 1, 0, 0, 120, 0.05),
  raro: () => { tocar(0.7, 0, 880, 0.01, 0.12, 0.35, 0, 1); setTimeout(() => tocar(0.7, 0, 1320, 0.01, 0.2, 0.5, 0, 1), 110); vibra([30, 40, 30, 40, 90]); },
  comer: () => tocar(0.5, 0.3, 280, 0.02, 0.05, 0.1, 4, 0, 4, 0, 0, 0, 0, 5),
  porta: () => tocar(0.6, 0.1, 70, 0.02, 0.1, 0.15, 4, 3, 0, 0, 0, 0, 0, 2),
  morte: () => { tocar(1, 0, 70, 0.02, 0.3, 0.8, 2, 2, -6); vibra([200, 80, 300]); },
  vitoria: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tocar(0.7, 0, f, 0.01, 0.15, 0.4, 0, 1), i * 130)); vibra([40, 40, 40, 40, 120]); },
  toque: () => tocar(0.3, 0, 520, 0, 0.01, 0.05, 1),
};
