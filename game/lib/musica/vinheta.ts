// VINHETA da Farol 107,7 — três notas (Ré5–Lá4–Sol♯4). A segunda FALHA sempre no mesmo lugar (a fita pula: cai 45 cents e corta
// em 37% da nota, com um estalo de estática). É a pista sonora do loop no roteiro: quem presta atenção percebe que é SEMPRE igual.
// Na vitória a vinheta toca 'liberta': sem a falha, e a terceira nota resolve no Fá♯ — a terça maior que o jogo guardou até o fim.
// `notasVinheta` é pura (testes em Node); `tocarVinheta` e `tocarSinalAbrigo7` são o adaptador Web Audio.
import type { NotaAgendada } from '../../nucleo/contratos';
import { VINHETA, hz, motivoMorse } from './partitura';
import type { Orquestra } from './orquestra';

export type VersaoVinheta = 'loop' | 'liberta';
export type NotaVinheta = NotaAgendada & { /** a nota que falha: [instante da falha (s), queda em cents] */ falha?: [number, number] };

/** as notas da vinheta a partir de t0 (s): idênticas em toda execução — sem sorteio, de propósito */
export function notasVinheta(t0: number, versao: VersaoVinheta = 'loop'): NotaVinheta[] {
  const tempo = 60 / VINHETA.bpm, f = versao === 'loop' ? VINHETA.loop : VINHETA.liberta, out: NotaVinheta[] = []; let b = 0;
  f.forEach(([m, d], i) => {
    const t = t0 + b * tempo, dur = d * tempo;
    if (versao === 'loop' && i === VINHETA.falha.nota) {
      const tf = t + dur * VINHETA.falha.em;
      out.push({ t, dur: tf - t, voz: 'radio', midi: m, vel: 0.7, falha: [tf, VINHETA.falha.cents] }, { t: tf, dur: VINHETA.falha.estaticaS, voz: 'radio', midi: 0, vel: 0.9 });
    } else out.push({ t, dur: i === f.length - 1 ? dur * 1.6 : dur, voz: 'radio', midi: m, vel: 0.7 });
    b += d;
  });
  return out;
}

/** toca a vinheta no rádio (destino = o barramento que o rádio usa). Timbre de "jingle de AM": seno + triângulo na oitava, ataque de sino. */
export function tocarVinheta(ctx: BaseAudioContext, destino: AudioNode, orq: Orquestra, t0 = ctx.currentTime + 0.05, versao: VersaoVinheta = 'loop') {
  const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 330; lp.type = 'lowpass'; lp.frequency.value = 3200; hp.connect(lp).connect(destino);
  for (const n of notasVinheta(t0, versao)) {
    if (n.midi === 0) { orq.tocar(n, destino); continue; }
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain(), g = ctx.createGain(), f = hz(n.midi), fimNota = n.t + n.dur;
    o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 2; g2.gain.value = 0.25; o.connect(g); o2.connect(g2).connect(g); g.connect(hp);
    g.gain.setValueAtTime(0, n.t); g.gain.linearRampToValueAtTime(0.22 * n.vel, n.t + 0.01); g.gain.setTargetAtTime(0.12 * n.vel, n.t + 0.02, 0.15);
    if (n.falha) { // a fita pula: o tom escorrega e a nota some
      const [tf, cents] = n.falha;
      for (const x of [o, o2]) { x.detune.setValueAtTime(0, n.t + (tf - n.t) * 0.55); x.detune.linearRampToValueAtTime(cents, tf); }
      g.gain.setValueAtTime(0.12 * n.vel, tf - 0.004); g.gain.linearRampToValueAtTime(0, tf);
    } else g.gain.setTargetAtTime(0, fimNota, 0.12);
    for (const x of [o, o2]) { x.start(n.t); x.stop(fimNota + 0.8); }
  }
}

/** o sinal do Abrigo 7: o tema em código Morse ("A7"), no rádio. Devolve as notas (para legenda e testes). */
export function sinalAbrigo7(t0: number, bpm = 160): NotaAgendada[] {
  const tempo = 60 / bpm, out: NotaAgendada[] = []; let b = 0;
  for (const [m, d] of motivoMorse('A7')) { if (m) out.push({ t: t0 + b * tempo, dur: d * tempo * 0.92, voz: 'radio', midi: m, vel: 0.55 }); b += d; }
  return out;
}
export function tocarSinalAbrigo7(orq: Orquestra, destino: AudioNode, t0: number) { for (const n of sinalAbrigo7(t0)) orq.tocar(n, destino); }
