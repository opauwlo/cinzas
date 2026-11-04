// Áudio procedural: SFX por ZzFX normalizados por categoria (volume sentido parelho entre tiro, passo e clique), barramentos (efeitos, interface,
// ambiente, música) com ducking, cadeia mestre EQ + compressor + limitador com perfis (celular, fone, noturno), reverb ao ar livre e interno,
// ambiente em camadas (vento, chuva, trovão, grilos, pássaros, fogo), Geiger como processo de Poisson, batimento, passos por superfície,
// vozes das criaturas, a trilha adaptativa (lib/musica: maestro + orquestra no barramento de música) e o motor do jipe (viagem).
import { PRE, PERFIS, DUCK, NIVEL_BASE, normalizar, catDe, ALVO_MUSICA, intervaloBatimento, type Som, type Perfil } from './dados/sons';
import { musica, STINGERS, hz } from './lib/musica';
import { Orquestra } from './lib/musica/orquestra';
import { tocarVinheta, tocarSinalAbrigo7, type VersaoVinheta } from './lib/musica/vinheta';
import { SANFONA_MASCATE } from './lib/musica/partitura';
import { barramento } from './nucleo/barramento';
export type { Som } from './dados/sons';
type Z = typeof import('zzfx');
/** `mono`: soma L+R no fim da cadeia (fone de um lado só, alto-falante único); sem valor = ligado no perfil "Alto-falante do celular" */
export type Ajustes = { mestre: number; sfx: number; amb: number; mus: number; perfil: Perfil; graves: number; agudos: number; mono?: boolean };
let z: Z | null = null, ctx: AudioContext | null = null, ligado = false;
let mestre: GainNode, bSfx: GainNode, bUi: GainNode, bAmb: GainNode, bMus: GainNode, dAmb: GainNode, dMus: GainNode, sendExt: GainNode, sendInt: GainNode;
let cadeia: { hp: BiquadFilterNode; grave: BiquadFilterNode; medio: BiquadFilterNode; agudo: BiquadFilterNode; comp: DynamicsCompressorNode } | null = null;
let vol: Ajustes = { mestre: 0.6, sfx: 0.7, amb: 0.5, mus: 0.3, perfil: 'equilibrado', graves: 0, agudos: 0 }, vibraOn = true;
let cpm = 0, batendo = false, ruidoBuf: AudioBuffer | null = null;
type Camadas = { vento: GainNode; ventoF: BiquadFilterNode; chuva: GainNode; chuvaF: BiquadFilterNode; fogo: GainNode };
let cam: Camadas | null = null, orq: Orquestra | null = null, musF: BiquadFilterNode | null = null, musG: GainNode | null = null, saidaEst: GainNode | null = null, saidaMono: GainNode | null = null;
const estado = { hora: 12, vento: 0, chuva: 0, interior: false, bioma: 'ermo', fogo: 0, perigo: 0, tempestade: 0, neblina: 0 };
const cache = new Map<string, AudioBuffer[]>();

export async function iniciarAudio() {
  if (ligado) return; ligado = true;
  try {
    z = await import('zzfx'); try { void z.ZZFX.audioContext.close(); } catch { /* */ }
    ctx = new AudioContext({ latencyHint: 'interactive' }); const c = ctx;
    // cadeia mestre: tudo → passa-alta → graves → médios → agudos → compressor (cola a mistura) → limitador (nunca estoura) → volume geral → saída
    const pre = c.createGain(), hp = c.createBiquadFilter(), grave = c.createBiquadFilter(), medio = c.createBiquadFilter(), agudo = c.createBiquadFilter(), comp = c.createDynamicsCompressor(), lim = c.createDynamicsCompressor();
    hp.type = 'highpass'; grave.type = 'lowshelf'; medio.type = 'peaking'; agudo.type = 'highshelf'; comp.attack.value = 0.008; comp.release.value = 0.2;
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.06;
    mestre = c.createGain(); pre.connect(hp).connect(grave).connect(medio).connect(agudo).connect(comp).connect(lim).connect(mestre); cadeia = { hp, grave, medio, agudo, comp };
    // saída estéreo ou mono (um nó de 1 canal "speakers" soma L+R; o destino copia para os dois lados); aplicarVolumes escolhe
    saidaEst = c.createGain(); saidaMono = new GainNode(c, { channelCount: 1, channelCountMode: 'explicit', channelInterpretation: 'speakers', gain: 0 });
    mestre.connect(saidaEst).connect(c.destination); mestre.connect(saidaMono).connect(c.destination);
    // barramentos: efeitos e interface vão direto; ambiente e música passam por um "ducking" que abaixa quando há tiro, pancada ou alarme
    bSfx = c.createGain(); bUi = c.createGain(); bAmb = c.createGain(); bMus = c.createGain(); dAmb = c.createGain(); dMus = c.createGain();
    bSfx.connect(pre); bUi.connect(pre); bAmb.connect(dAmb).connect(pre); bMus.connect(dMus).connect(pre);
    // reverb: ao ar livre = cauda longa e escura; dentro de casa = curta e clara (envios separados, trocados por ambiente())
    sendExt = c.createGain(); sendInt = c.createGain(); const rExt = c.createConvolver(), rInt = c.createConvolver(); rExt.buffer = respostaIR(1.7, 2.6, 0.55); rInt.buffer = respostaIR(0.5, 4.5, 0.9);
    bSfx.connect(sendExt).connect(rExt).connect(pre); bSfx.connect(sendInt).connect(rInt).connect(pre); sendExt.gain.value = 0.1; sendInt.gain.value = 0;
    // app em segundo plano (tela apagada, outro app, menu, bolso): o som para de verdade e volta ao retornar
    const visivel = () => { if (document.hidden) void c.suspend().catch(() => undefined); else void c.resume().catch(() => undefined); };
    document.addEventListener('visibilitychange', visivel); window.addEventListener('pagehide', () => void c.suspend().catch(() => undefined));
    // iOS "interrupted" (ligação) ou suspenso pelo sistema: retoma no próximo toque
    window.addEventListener('pointerdown', () => { if (!document.hidden && c.state !== 'running') void c.resume().catch(() => undefined); }, { passive: true });
    aplicarVolumes(); await c.resume(); ruidoBuf = criarRuido(); construirAmbiente();
    // trilha: orquestra → passa-baixa (furtivo/interior) → ganho do diretor (rádio falando) → barramento de música (com ducking)
    musF = c.createBiquadFilter(); musF.type = 'lowpass'; musF.frequency.value = 20000; musF.Q.value = 0.5; musG = c.createGain(); musF.connect(musG).connect(bMus);
    orq = new Orquestra(c, musF, ruidoBuf); musica.ligar(barramento); aquecerViola();
    geigerLoop(); batimentoLoop(); grilosLoop(); maestroLoop();
  } catch { ligado = false; }
}
/** volumes, perfil de equalização e ajustes de graves/agudos (dB, −6..+6); `vibra` liga o háptico */
export function aplicarVolumes(v?: Partial<Ajustes & { vibra: boolean }>) {
  if (v) { const { vibra: vb, ...r } = v; vol = { ...vol, ...r }; if (vb !== undefined) vibraOn = vb; }
  if (!ctx || !cadeia) return; const t = ctx.currentTime, p = PERFIS[vol.perfil] ?? PERFIS.equilibrado, k = 0.05;
  mestre.gain.setTargetAtTime(vol.mestre * p.trim, t, k); bSfx.gain.setTargetAtTime(vol.sfx, t, k); bUi.gain.setTargetAtTime(vol.sfx, t, k); bAmb.gain.setTargetAtTime(vol.amb, t, k); bMus.gain.setTargetAtTime(vol.mus * ALVO_MUSICA, t, k);
  const mono = vol.mono ?? vol.perfil === 'celular'; saidaEst?.gain.setTargetAtTime(mono ? 0 : 1, t, k); saidaMono?.gain.setTargetAtTime(mono ? 1 : 0, t, k);
  cadeia.hp.frequency.setTargetAtTime(p.hp, t, k); cadeia.grave.frequency.setTargetAtTime(p.grave[0], t, k); cadeia.grave.gain.setTargetAtTime(p.grave[1] + vol.graves, t, k);
  cadeia.medio.frequency.setTargetAtTime(p.medio[0], t, k); cadeia.medio.gain.setTargetAtTime(p.medio[1], t, k); cadeia.medio.Q.setTargetAtTime(p.medio[2], t, k);
  cadeia.agudo.frequency.setTargetAtTime(p.agudo[0], t, k); cadeia.agudo.gain.setTargetAtTime(p.agudo[1] + vol.agudos, t, k);
  cadeia.comp.threshold.setTargetAtTime(p.comp[0], t, k); cadeia.comp.ratio.setTargetAtTime(p.comp[1], t, k); cadeia.comp.knee.setTargetAtTime(p.comp[2], t, k);
}
export const vibra = (p: number | number[]) => { if (!vibraOn) return; try { navigator.vibrate?.(p); } catch { /* sem háptico */ } };

// ---------------------------------------------------------------- legendas visuais de som (acessibilidade: quem não ouve vê o que soou e de que lado)
export type AvisoSom = { nome: string; cat: string; pan: number; vol: number };
let avisoFn: ((a: AvisoSom) => void) | null = null;
/** a HUD registra aqui para receber os sons que merecem legenda (vozes de criatura, tiro inimigo, alarme, trovão, dano…) */
export const setAvisoVisual = (fn: ((a: AvisoSom) => void) | null) => { avisoFn = fn; };
const CAT_VISIVEL = new Set(['voz', 'colosso', 'alerta']), NOME_VISIVEL = new Set(['tiro_inimigo', 'dano', 'porta', 'trovao']);
const avisar = (nome: string, cat: string, pan: number, vol: number) => { if (avisoFn && (CAT_VISIVEL.has(cat) || NOME_VISIVEL.has(nome)) && vol >= 0.18) avisoFn({ nome, cat, pan, vol }); };

function criarRuido() { const n = ctx!.sampleRate * 3, b = ctx!.createBuffer(1, n, ctx!.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
function fonteRuido(loop = true) { const s = ctx!.createBufferSource(); s.buffer = ruidoBuf; s.loop = loop; if (loop) s.loopStart = Math.random() * 2; return s; }
/** resposta ao impulso sintética: ruído estéreo que decai (decai = expoente), `brilho` = 1 é claro e perto de 0 é escuro */
function respostaIR(seg: number, decai: number, brilho: number) {
  const c = ctx!, n = Math.floor(c.sampleRate * seg), b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let ant = 0; for (let i = 0; i < n; i++) { ant += (Math.random() * 2 - 1 - ant) * brilho; d[i] = ant * Math.pow(1 - i / n, decai) * (i < 60 ? i / 60 : 1); } }
  return b;
}
function buffers(nome: string): AudioBuffer[] {
  let a = cache.get(nome); if (a) return a; const p = PRE[nome]; if (!p || !z || !ctx) return []; a = [];
  for (let i = 0; i < 3; i++) { const s = z.ZZFX.buildSamples(...(p as number[])); normalizar(s, nome, z.ZZFX.sampleRate); const b = ctx.createBuffer(1, s.length, z.ZZFX.sampleRate); b.getChannelData(0).set(s); a.push(b); }
  cache.set(nome, a); return a;
}
/** abaixa o ambiente e a música `db` decibéis por `seg` segundos (para o tiro, a pancada ou o alarme aparecerem na mistura) */
function duck(db: number, seg: number) {
  if (!ctx) return; const t = ctx.currentTime, a = 10 ** (-db / 20);
  for (const d of [dAmb, dMus]) { d.gain.cancelScheduledValues(t); d.gain.setTargetAtTime(a, t, 0.015); d.gain.setTargetAtTime(1, t + seg, 0.25); }
}
/** toca um som já normalizado para o nível da sua categoria; `dist` (tiles) escurece o som de longe; `ui` usa o barramento da interface (sem reverb) */
export function tocar(nome: Som, o: { vol?: number; pan?: number; rate?: number; dist?: number; ui?: boolean; /** sem variação de tom (stingers no tom); `em` = atraso s */ afinado?: boolean; em?: number } = {}) {
  if (!ctx || !z || ctx.state !== 'running') return; const bs = buffers(nome); if (!bs.length) return;
  const s = ctx.createBufferSource(); s.buffer = bs[(Math.random() * bs.length) | 0]; s.playbackRate.value = (o.rate ?? 1) * (o.afinado ? 1 : 0.94 + Math.random() * 0.12);
  const g = ctx.createGain(); g.gain.value = (o.vol ?? 1) * NIVEL_BASE; let no: AudioNode = s.connect(g);
  if (o.dist && o.dist > 3) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.max(1400, 14000 * (1 - Math.min(1, o.dist / 26))); no = no.connect(f); }
  if (o.pan) no = no.connect(new StereoPannerNode(ctx, { pan: Math.max(-1, Math.min(1, o.pan)) }));
  no.connect(o.ui ? bUi : bSfx); s.start(ctx.currentTime + (o.em ?? 0));
  const cat = catDe(nome); if (!o.ui) avisar(nome, cat, o.pan ?? 0, o.vol ?? 1);
  const dk = DUCK[cat]; if (dk && (o.vol ?? 1) >= 0.5) duck(dk[0], dk[1]);
}
/** volume por distância (em tiles) e pan pelo deslocamento horizontal em tela */
export const aDist = (d: number) => Math.max(0, 1 - d / 22) ** 1.4;

// ---------------------------------------------------------------- camadas de ambiente
function construirAmbiente() {
  const c = ctx!; const vento = fonteRuido(), ventoF = c.createBiquadFilter(), vg = c.createGain(); ventoF.type = 'bandpass'; ventoF.frequency.value = 420; ventoF.Q.value = 0.7; vg.gain.value = 0; vento.connect(ventoF).connect(vg).connect(bAmb); vento.start();
  const chuva = fonteRuido(), chuvaF = c.createBiquadFilter(), cg = c.createGain(); chuvaF.type = 'lowpass'; chuvaF.frequency.value = 7000; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; cg.gain.value = 0; chuva.connect(hp).connect(chuvaF).connect(cg).connect(bAmb); chuva.start();
  const fogo = fonteRuido(), ff = c.createBiquadFilter(), fg = c.createGain(); ff.type = 'bandpass'; ff.frequency.value = 1800; ff.Q.value = 1.4; fg.gain.value = 0; fogo.connect(ff).connect(fg).connect(bAmb); fogo.start();
  cam = { vento: vg, ventoF, chuva: cg, chuvaF, fogo: fg };
  // a cama musical (drone) agora é a voz 'drone' da orquestra, em Ré e com fundamental ausente (lib/musica/partitura.ts PARCIAIS_DRONE)
}
/** chamado ~10 vezes por segundo pela cena (e pela tela de viagem) */
let ultAmb = 0;
export function ambiente(e: Partial<typeof estado>) {
  Object.assign(estado, e); const agoraMs = performance.now(), dt = ultAmb ? Math.min(0.5, (agoraMs - ultAmb) / 1000) : 0.1; ultAmb = agoraMs;
  musica.pelaCena(dt, estado); // reserva: só decide se o ModuloJogo 'musica' ainda não estiver registrado no núcleo
  if (!ctx || !cam) return; const t = ctx.currentTime, i = estado.interior ? 0.28 : 1;
  cam.vento.gain.setTargetAtTime(Math.min(0.36, estado.vento * 0.34) * i, t, 0.6); cam.ventoF.frequency.setTargetAtTime(260 + estado.vento * 700, t, 0.8);
  cam.chuva.gain.setTargetAtTime(Math.min(0.26, estado.chuva * 0.26) * (estado.interior ? 0.35 : 1), t, 0.5); cam.chuvaF.frequency.setTargetAtTime(estado.interior ? 1400 : 7500, t, 0.3);
  cam.fogo.gain.setTargetAtTime(estado.fogo * 0.11, t, 0.3);
  sendExt.gain.setTargetAtTime(estado.interior ? 0.02 : 0.1, t, 0.3); sendInt.gain.setTargetAtTime(estado.interior ? 0.22 : 0, t, 0.3);
}
export function trovao(atraso: number) {
  if (!ctx || ctx.state !== 'running') return; const c = ctx, t = c.currentTime + atraso, s = fonteRuido(false), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(90, t + 2.2);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.06); g.gain.exponentialRampToValueAtTime(0.01, t + 2.6); s.connect(f).connect(g).connect(bAmb); s.start(t, Math.random() * 1.5, 2.8); vibraEm(atraso, [60, 40, 90]);
  setTimeout(() => avisar('trovao', 'alerta', 0, 1), atraso * 1000);
}
const vibraEm = (s: number, p: number[]) => setTimeout(() => vibra(p), s * 1000);
function grilosLoop() { const passo = () => { if (!ligado) return; const noite = estado.hora < 6 || estado.hora >= 19.5, calmo = estado.chuva < 0.2 && estado.vento < 0.6 && !estado.interior; if (calmo && noite && ['ermo', 'floresta', 'pantano', 'base'].includes(estado.bioma)) { const n = 3 + ((Math.random() * 3) | 0); for (let i = 0; i < n; i++) setTimeout(() => tocar('grilo', { vol: 0.35, rate: 0.95 + Math.random() * 0.1 }), i * 70); } else if (calmo && !noite && estado.hora > 7 && Math.random() < 0.5 && estado.bioma !== 'industrial') tocar('passaro', { vol: 0.6, pan: Math.random() * 2 - 1, rate: 0.8 + Math.random() * 0.6 }); setTimeout(passo, 700 + Math.random() * 1800); }; passo(); }
// ---------------------------------------------------------------- trilha: relógio musical ("A Tale of Two Clocks": laço de 100 ms que agenda 300 ms à frente)
const PASSO_MAESTRO_MS = 100, JANELA_S = 0.3;
function maestroLoop() {
  const passo = () => {
    if (!ligado) return;
    if (ctx && orq && ctx.state === 'running') {
      const t = ctx.currentTime;
      for (const n of musica.maestro.agendar(t, JANELA_S)) orq.tocar(n);
      for (const k of musica.maestro.tirarCortes()) silencioTotal(k.t, k.seg);
      if (musF && musG) { musF.frequency.setTargetAtTime(musica.mix.corte, t, 0.4); musG.gain.setTargetAtTime(10 ** (musica.mix.ganhoDb / 20), t, 0.3); }
    }
    setTimeout(passo, PASSO_MAESTRO_MS);
  };
  passo();
}
/** silêncio como recurso: a trilha some e o ambiente cai junto (morte: 1,5 s de vácuo; abate do Colosso: um sino e 4 s) */
function silencioTotal(t: number, seg: number) {
  if (!ctx || !orq) return; orq.calar(t, 0.06);
  dAmb.gain.cancelScheduledValues(t); dAmb.gain.setTargetAtTime(0.05, t, 0.05); dAmb.gain.setTargetAtTime(1, t + seg, 0.6);
  if (seg >= 3) for (const m of [57, 62]) orq.tocar({ t: t + 0.02, dur: 3.5, voz: 'sino', midi: m, vel: 0.5 }, bUi);
}
/** as cordas da viola são calculadas aos poucos (uma a cada 60 ms), fora do caminho do primeiro compasso */
function aquecerViola() { const ms = [50, 55, 57, 58, 60, 62, 64, 65, 67, 68, 69, 70, 72, 73, 74, 77, 66, 59]; let i = 0; const passo = () => { if (!orq || i >= ms.length) return; orq.aquecer(ms[i++]); setTimeout(passo, 60); }; passo(); }
/** atraso (s) até o próximo meio-tempo da trilha, se estiver a ≤ 120 ms (stinger no pulso); 0 sem música tocando */
const noPulso = () => (ctx ? Math.max(0, musica.maestro.quantizar(ctx.currentTime) - ctx.currentTime) : 0);
/** stinger no tom: as notas de M em Ré, com o timbre `som` cuja altura-base é `base` Hz */
function stinger(lista: [number, number][], som: Som, base: number, ui = true) { const q = noPulso(); for (const [m, at] of lista) tocar(som, { rate: hz(m) / base, ui, afinado: true, em: q + at }); }

/** o menu chama no primeiro toque: liga o áudio e põe o rádio para sintonizar até achar o tema */
export async function iniciarMenu() { await iniciarAudio(); musica.menu(); }
/** a vinheta da Farol 107,7 no rádio ('loop': a 2ª nota falha sempre no mesmo lugar; 'liberta': só no fim) */
export function vinhetaRadio(versao: VersaoVinheta = 'loop') { if (ctx && orq && ctx.state === 'running') tocarVinheta(ctx, bUi, orq, ctx.currentTime + 0.05 + noPulso(), versao); }
/** o sinal do Abrigo 7: o tema em Morse */
export function sinalAbrigo7() { if (ctx && orq && ctx.state === 'running') tocarSinalAbrigo7(orq, bUi, ctx.currentTime + 0.05); }
/** a sanfona do mascate, DIEGÉTICA: toca no mundo (barramento de ambiente), escurece e baixa com a distância (tiles) */
export function sanfonaAoLonge(dist: number, pan = 0) {
  if (!ctx || !orq || ctx.state !== 'running') return; const c = ctx, lp = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime + 0.05, tempo = 60 / SANFONA_MASCATE.bpm;
  lp.type = 'lowpass'; lp.frequency.value = Math.max(700, 6000 * (1 - Math.min(1, dist / 40))); g.gain.value = 0.25 + aDist(dist) * 1.6; lp.connect(g).connect(bAmb);
  for (const n of SANFONA_MASCATE.notas) orq.tocar({ t: t0 + n.b * tempo, dur: n.d * tempo, voz: n.voz, midi: n.m, vel: n.v, pan }, lp);
  setTimeout(() => { try { g.disconnect(); } catch { /* */ } }, (SANFONA_MASCATE.barras * 3 * tempo + 2) * 1000);
}
export const setGeiger = (v: number) => { cpm = v; };
function geigerLoop() { const passo = () => { if (!ligado) return; const taxa = Math.max(0.05, cpm / 60); if (cpm > 0) tocar('geiger', { vol: 0.4, rate: 0.9 + Math.random() * 0.3 }); setTimeout(passo, Math.min(4000, -Math.log(1 - Math.random()) / taxa * 1000)); }; passo(); }
let vidaBat: number | null = null;
/** `hp01` (0..1) opcional; sem ele, usa a vida que o módulo de música leu do Mundo */
export const setBatimento = (b: boolean, hp01?: number) => { batendo = b; if (hp01 !== undefined) vidaBat = hp01; };
/** o batimento escala: 900 ms com 30% de vida até 520 ms com 5%; volume e háptico sobem juntos (P0 0.6) */
function batimentoLoop() {
  const passo = () => {
    if (!ligado) return; const ms = intervaloBatimento(vidaBat ?? musica.vida01), k = (900 - ms) / 380;
    if (batendo) { tocar('bat1', { vol: 0.8 + 0.2 * k }); setTimeout(() => tocar('bat2', { vol: 0.65 + 0.2 * k }), ms * 0.21); vibra([30 + Math.round(20 * k), 70 - Math.round(30 * k), 30 + Math.round(20 * k)]); }
    setTimeout(passo, ms);
  };
  passo();
}

// ---------------------------------------------------------------- motor do jipe (tela de viagem): serra + quadrada graves, tremor do "put-put" e vento do pneu no asfalto
type Motor = { g: GainNode; o: OscillatorNode[]; f: BiquadFilterNode; r: AudioBufferSourceNode; rg: GainNode; rf: BiquadFilterNode; lfo: OscillatorNode };
let motorNo: Motor | null = null;
/** marcha lenta afinada em Ré2 (73,4 Hz) e o 2º oscilador na quinta: o jipe também toca no tom (P0 0.3) */
const MOTOR_RE2 = hz(38);
export const motor = {
  ligar() {
    if (!ctx || motorNo) return; const c = ctx, g = c.createGain(), am = c.createGain(), f = c.createBiquadFilter(), o1 = c.createOscillator(), o2 = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), r = fonteRuido(), rf = c.createBiquadFilter(), rg = c.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = MOTOR_RE2; o2.frequency.value = MOTOR_RE2 * 1.5; musica.viagem(true); f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 2.5; am.gain.value = 0.72; lfo.frequency.value = 9; lg.gain.value = 0.28; lfo.connect(lg).connect(am.gain);
    o1.connect(f); o2.connect(f); f.connect(am).connect(g).connect(bSfx); rf.type = 'bandpass'; rf.frequency.value = 500; rf.Q.value = 0.6; r.connect(rf).connect(rg).connect(bSfx); g.gain.value = 0; rg.gain.value = 0;
    g.gain.setTargetAtTime(0.5, c.currentTime, 0.4); o1.start(); o2.start(); lfo.start(); r.start(); motorNo = { g, o: [o1, o2], f, r, rg, rf, lfo };
  },
  /** velocidade de 0 (parado) a 1 (cruzeiro): sobe o tom, o filtro, o tremor e o ruído do pneu */
  vel(v: number) {
    if (!ctx || !motorNo) return; const t = ctx.currentTime, k = Math.max(0, Math.min(1, v));
    motorNo.o[0].frequency.setTargetAtTime(MOTOR_RE2 * (1 + k), t, 0.3); motorNo.o[1].frequency.setTargetAtTime(MOTOR_RE2 * 1.5 * (1 + k), t, 0.3); // Ré2 → Ré3, a quinta junto motorNo.f.frequency.setTargetAtTime(220 + k * 560, t, 0.3);
    motorNo.lfo.frequency.setTargetAtTime(7 + k * 15, t, 0.3); motorNo.rg.gain.setTargetAtTime(k * 0.1, t, 0.4); motorNo.rf.frequency.setTargetAtTime(380 + k * 900, t, 0.4);
  },
  parar() {
    musica.viagem(false); if (!ctx || !motorNo) return; const c = ctx, n = motorNo; motorNo = null; n.g.gain.setTargetAtTime(0, c.currentTime, 0.25); n.rg.gain.setTargetAtTime(0, c.currentTime, 0.25);
    setTimeout(() => { try { n.o.forEach(o => o.stop()); n.lfo.stop(); n.r.stop(); } catch { /* já parou */ } }, 1200);
  },
};

// ---------------------------------------------------------------- atalhos usados pela cena
export const sfx = {
  tiro: (arma: string) => { tocar(arma === 'escopeta' ? 'tiro_escopeta' : arma === 'rifle' ? 'tiro_rifle' : 'tiro'); vibra(arma === 'escopeta' ? 38 : 22); },
  tiroInimigo: (d: number, pan: number) => tocar('tiro_inimigo', { vol: aDist(d), pan, dist: d }), seco: () => tocar('seco', { ui: true }), swing: () => tocar('swing'),
  golpe: () => { tocar('golpe'); vibra(18); }, acerto: (carne = true) => { tocar(carne ? 'carne' : 'metal'); vibra([20, 20, 30]); }, dano: () => { tocar('dano'); vibra([70, 30, 40]); },
  pegar: () => tocar('pegar'), saque: () => tocar('saque'), achado: () => tocar('achado'), raro: () => { stinger(STINGERS.raro, 'raro1', 880, false); vibra([30, 40, 30, 40, 90]); },
  comer: () => tocar('comer'), beber: () => tocar('beber'), curar: () => tocar('curar'), porta: () => tocar('porta'), morte: () => { tocar('morte'); vibra([200, 80, 300]); },
  freio: () => { tocar('freio'); vibra([60, 40, 90]); }, partida: () => { tocar('partida'); vibra([40, 30, 40]); },
  /** a vitória da campanha: a vinheta da Farol 107,7 enfim inteira, terminando no Fá♯ (Ré maior) — a primeira vez no jogo */
  vitoria: () => { if (orq) vinhetaRadio('liberta'); else stinger(STINGERS.vitoria, 'nota', 440); vibra([40, 40, 40, 40, 120]); },
  ui: (k: 'clique' | 'ok' | 'erro' | 'abrir' = 'clique') => tocar(k, { ui: true }),
  nivel: () => { stinger(STINGERS.nivel, 'nota', 440); vibra([40, 30, 90]); },
  conquista: () => { stinger(STINGERS.conquista, 'raro1', 880); vibra([30, 40, 30, 40, 90]); },
  alarme: () => { for (let i = 0; i < 4; i++) setTimeout(() => tocar('alarme'), i * 430); vibra([180, 90, 180, 90, 180]); },
  sinal: () => stinger(STINGERS.sinal, 'sinal', 1300),
  passo: (sup: string, correr: boolean, v = 1) => tocar(('passo_' + sup) as Som in PRE ? ('passo_' + sup) as Som : 'passo_terra', { vol: (correr ? 1 : 0.6) * v, rate: correr ? 1.12 : 0.95 }),
  voz: (tipo: string, d: number, pan: number, v = 1) => tocar((tipo in PRE ? tipo : 'zumbi') as Som, { vol: aDist(d) * v, pan, dist: d }),
  /** sequência de demonstração para ajustar o equalizador: passo, golpe, tiro, clique e um achado */
  teste: () => { const seq: [Som, number][] = [['passo_terra', 0], ['passo_concreto', 260], ['golpe', 620], ['tiro', 1050], ['raro1', 1700], ['clique', 2200]]; for (const [n, ms] of seq) setTimeout(() => tocar(n, { ui: n === 'clique' }), ms); },
};
export const trocarAmbiente = ambiente;
