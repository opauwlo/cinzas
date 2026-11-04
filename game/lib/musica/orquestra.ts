// ORQUESTRA: o adaptador Web Audio da trilha. Recebe NotaAgendada (do maestro) e toca num nó de destino (o barramento de música de audio.ts).
// Vozes 100% sintetizadas no nosso código (0 KB de amostras): viola por Karplus-Strong (sintese.ts), rabeca de arco, pífano com sopro,
// zabumba (tum + bacalhau), coral por formantes, cama com fundamental ausente, sanfona, rádio AM (passa-banda + estática) e sino.
// Fino de propósito: a música (o quê e quando) está em partitura.ts e maestro.ts, que rodam em Node.
import type { NotaAgendada, VozId } from '../../nucleo/contratos';
import { hz, PARCIAIS_DRONE, BATIMENTO_DRONE_HZ, DETUNE_RABECA, FORMANTES, PARCIAIS_SINO } from './partitura';
import { violaPar } from './sintese';

type Ativa = { g: GainNode; fontes: AudioScheduledSourceNode[]; fim: number };
/** pan padrão de cada instrumento (a "roda" de músicos) e ganho de mistura */
const PAN: Record<VozId, number> = { viola: -0.12, rabeca: 0.22, pifano: 0.3, zabumba: 0, coral: 0, drone: 0, sanfona: -0.3, radio: 0.15, sino: 0.05 };
const GANHO: Record<VozId, number> = { viola: 0.55, rabeca: 0.16, pifano: 0.2, zabumba: 0.5, coral: 0.12, drone: 0.1, sanfona: 0.1, radio: 0.2, sino: 0.12 };
const SEG_VIOLA = 3.2;

export class Orquestra {
  private ativas = new Set<Ativa>();
  private violas = new Map<number, AudioBuffer>();
  private onda: PeriodicWave;
  private rabecaAnt = { fim: -1, f: 0 };
  private curva: Float32Array<ArrayBuffer>;
  constructor(private ctx: BaseAudioContext, private destino: AudioNode, private ruido: AudioBuffer) {
    const re = new Float32Array(PARCIAIS_DRONE.length), im = Float32Array.from(PARCIAIS_DRONE); im[0] = 0; im[1] = 0;
    this.onda = ctx.createPeriodicWave(re, im, { disableNormalization: false });
    this.curva = new Float32Array(257); for (let i = 0; i < 257; i++) { const x = i / 128 - 1; this.curva[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); }
  }
  /** pré-calcula as cordas da viola (chame aos poucos, fora do quadro) */
  aquecer(midi: number) { this.buffer(midi); }
  quantas() { return this.ativas.size; }

  tocar(n: NotaAgendada, destino: AudioNode = this.destino) {
    const c = this.ctx, t = Math.max(c.currentTime + 0.005, n.t), dur = Math.max(0.05, n.dur), g = c.createGain(); g.gain.value = 0;
    const pan = new StereoPannerNode(c, { pan: Math.max(-1, Math.min(1, n.pan ?? PAN[n.voz])) }); g.connect(pan).connect(destino);
    const amp = n.vel * GANHO[n.voz], f = n.midi > 0 ? hz(n.midi) : 0;
    let fontes: AudioScheduledSourceNode[] = [], fim = t + dur;
    switch (n.voz) {
      case 'viola': {
        const s = c.createBufferSource(); s.buffer = this.buffer(n.midi); s.connect(g);
        g.gain.setValueAtTime(amp, t); g.gain.setTargetAtTime(0, t + dur, 0.09); fim = t + Math.min(SEG_VIOLA, dur + 0.5); s.start(t); fontes = [s]; break;
      }
      case 'rabeca': {
        const o1 = c.createOscillator(), o2 = c.createOscillator(), hp = c.createBiquadFilter(), corpo = c.createBiquadFilter(), lp = c.createBiquadFilter(), vib = c.createOscillator(), vg = c.createGain();
        o1.type = o2.type = 'sawtooth'; o1.detune.value = DETUNE_RABECA; o2.detune.value = DETUNE_RABECA + 7;
        // portamento: nota emendada na anterior desliza (é o que faz Sol♯–Lá virar sirene)
        const leg = this.rabecaAnt.fim > t - 0.15 && this.rabecaAnt.f > 0;
        for (const o of [o1, o2]) { o.frequency.setValueAtTime(leg ? this.rabecaAnt.f : f, t); if (leg) o.frequency.exponentialRampToValueAtTime(f, t + 0.14); }
        hp.type = 'highpass'; hp.frequency.value = 260; corpo.type = 'peaking'; corpo.frequency.value = 1050; corpo.Q.value = 1.1; corpo.gain.value = 7; lp.type = 'lowpass'; lp.frequency.value = 3400;
        vib.frequency.value = 5.4; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(14, t + Math.min(0.45, dur * 0.6)); vib.connect(vg); vg.connect(o1.detune); vg.connect(o2.detune);
        o1.connect(hp); o2.connect(hp); hp.connect(corpo).connect(lp).connect(g);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.09); g.gain.setTargetAtTime(amp * 0.78, t + 0.12, 0.2); g.gain.setTargetAtTime(0, t + dur, 0.07);
        fim = t + dur + 0.4; fontes = [o1, o2, vib]; for (const o of fontes) o.start(t); this.rabecaAnt = { fim: t + dur, f }; break;
      }
      case 'pifano': {
        const o = c.createOscillator(), sopro = this.fonteRuido(), bp = c.createBiquadFilter(), sg = c.createGain(), vib = c.createOscillator(), vg = c.createGain();
        o.type = 'triangle'; o.frequency.value = f; vib.frequency.value = 6.2; vg.gain.value = 9; vib.connect(vg).connect(o.detune);
        bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3; sg.gain.value = 0.35; sopro.connect(bp).connect(sg).connect(g); o.connect(g);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp * 1.15, t + 0.035); g.gain.setTargetAtTime(amp * 0.85, t + 0.05, 0.08); g.gain.setTargetAtTime(0, t + dur, 0.05);
        fim = t + dur + 0.3; fontes = [o, sopro, vib]; o.start(t); vib.start(t); sopro.start(t, Math.random() * 2); break;
      }
      case 'zabumba': {
        if (n.midi >= 70) { // bacalhau: a vareta na pele de baixo
          const r = this.fonteRuido(), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2600; r.connect(hp).connect(g);
          g.gain.setValueAtTime(amp * 0.9, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.05); fim = t + 0.08; fontes = [r]; r.start(t, Math.random() * 2);
        } else { // tum: corpo que cai de tom + o 2º modo (audível no celular) + o tapa da pele
          const o = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain(), r = this.fonteRuido(), bp = c.createBiquadFilter(), rg = c.createGain();
          o.frequency.setValueAtTime(f * 2.2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); o2.frequency.setValueAtTime(f * 2.4, t); o2.frequency.exponentialRampToValueAtTime(f * 2.3, t + 0.04);
          g2.gain.value = 0.55; o2.connect(g2).connect(g); o.connect(g); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.9; r.connect(bp).connect(rg).connect(g);
          rg.gain.setValueAtTime(0.9, t); rg.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
          g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.42); fim = t + 0.45; fontes = [o, o2, r]; o.start(t); o2.start(t); r.start(t, Math.random() * 2);
        }
        break;
      }
      case 'coral': {
        const vogal = FORMANTES[n.midi < 55 ? 'u' : 'a'], soma = c.createGain(), vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 4.7; vg.gain.value = 11; vib.connect(vg);
        const os = [-9, 0, 8].map(d => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; vg.connect(o.detune); return o; });
        for (const [ff, a] of vogal) { const bp = c.createBiquadFilter(), fg = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = ff / 90; fg.gain.value = a * 3; for (const o of os) o.connect(bp); bp.connect(fg).connect(soma); }
        soma.connect(g); const at = Math.min(0.4, dur * 0.3);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + at); g.gain.setTargetAtTime(0, t + dur, 0.22);
        fim = t + dur + 1.1; fontes = [...os, vib]; for (const o of fontes) o.start(t); break;
      }
      case 'drone': { // fundamental ausente (PARCIAIS_DRONE) + segundo oscilador 0,6 Hz acima: o batimento lento e fixo
        const o1 = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(); o1.setPeriodicWave(this.onda); o2.setPeriodicWave(this.onda);
        o1.frequency.value = f; o2.frequency.value = f + BATIMENTO_DRONE_HZ; lp.type = 'lowpass'; lp.frequency.value = 1600; o1.connect(lp); o2.connect(lp); lp.connect(g);
        const x = dur * 0.2; // a nota seguinte entra em t + 0,8·dur: as rampas lineares se somam em ganho constante
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + x); g.gain.setValueAtTime(amp, t + dur - x); g.gain.linearRampToValueAtTime(0, t + dur);
        fontes = [o1, o2]; o1.start(t); o2.start(t); break;
      }
      case 'sanfona': { // duas palhetas desafinadas (fole cansado) e o tremor do fole
        const os = [-9, 8].map(d => { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f; o.detune.value = d; return o; }), lp = c.createBiquadFilter(), trem = c.createOscillator(), tg = c.createGain(), am = c.createGain();
        lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.8; trem.frequency.value = 3.1; tg.gain.value = 0.12; am.gain.value = 0.88; trem.connect(tg).connect(am.gain);
        for (const o of os) o.connect(lp); lp.connect(am).connect(g);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.06); g.gain.setTargetAtTime(0, t + dur, 0.08);
        fim = t + dur + 0.4; fontes = [...os, trem]; for (const o of fontes) o.start(t); break;
      }
      case 'radio': fontes = this.radio(n, g, t, dur, amp, f); fim = t + dur + 0.2; break;
      case 'sino': {
        fontes = PARCIAIS_SINO.map(([r, a]) => { const o = c.createOscillator(), og = c.createGain(); o.frequency.value = f * r; og.gain.setValueAtTime(a, t); og.gain.exponentialRampToValueAtTime(0.0005, t + dur * (r < 1 ? 1 : 1 / Math.sqrt(r))); o.connect(og).connect(g); o.start(t); return o; });
        g.gain.setValueAtTime(amp, t); fim = t + dur; break;
      }
    }
    for (const s of fontes) try { s.stop(fim + 0.05); } catch { /* já parado */ }
    const a: Ativa = { g, fontes, fim }; this.ativas.add(a);
    fontes[0]?.addEventListener('ended', () => { this.ativas.delete(a); try { pan.disconnect(); } catch { /* */ } });
  }

  /** silêncio total: tudo que soa (ou já está agendado) some em `fade` s a partir de `t` */
  calar(t = this.ctx.currentTime, fade = 0.08) {
    for (const a of this.ativas) {
      a.g.gain.cancelScheduledValues(t); a.g.gain.setTargetAtTime(0, t, fade / 3);
      for (const s of a.fontes) try { s.stop(t + fade * 3); } catch { /* */ }
    }
    this.ativas.clear(); this.rabecaAnt.fim = -1;
  }

  private buffer(midi: number): AudioBuffer {
    let b = this.violas.get(midi); if (b) return b; const fs = this.ctx.sampleRate, d = violaPar(hz(midi), SEG_VIOLA, fs);
    b = this.ctx.createBuffer(1, d.length, fs); b.getChannelData(0).set(d); this.violas.set(midi, b); return b;
  }
  private fonteRuido() { const s = this.ctx.createBufferSource(); s.buffer = this.ruido; s.loop = true; return s; }
  /** rádio AM: tom (ou só estática, midi 0) → passa-banda 300–3.400 Hz → saturação leve → "fading" de AM; mais a estática por baixo */
  private radio(n: NotaAgendada, g: GainNode, t: number, dur: number, amp: number, f: number): AudioScheduledSourceNode[] {
    const c = this.ctx, hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), sat = c.createWaveShaper(), fade = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    hp.type = 'highpass'; hp.frequency.value = 320; lp.type = 'lowpass'; lp.frequency.value = 3300; sat.curve = this.curva;
    lfo.frequency.value = 0.31; lg.gain.value = 0.3; fade.gain.value = 0.7; lfo.connect(lg).connect(fade.gain); hp.connect(lp).connect(sat).connect(fade).connect(g);
    const est = this.fonteRuido(), ebp = c.createBiquadFilter(), eg = c.createGain(); ebp.type = 'bandpass'; ebp.Q.value = 0.7; est.connect(ebp).connect(eg).connect(hp);
    const fontes: AudioScheduledSourceNode[] = [lfo, est];
    if (f > 0) {
      const o = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain(); o.type = 'triangle'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f; g2.gain.value = 0.18;
      o.connect(hp); o2.connect(g2).connect(hp); o.start(t); o2.start(t); fontes.unshift(o, o2); ebp.frequency.value = 2200; eg.gain.value = 0.12;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.03); g.gain.setTargetAtTime(0, t + dur, 0.06);
    } else { // sintonia: o passa-banda da estática varre o dial
      ebp.frequency.setValueAtTime(700, t); ebp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.6); ebp.frequency.exponentialRampToValueAtTime(1100, t + dur); eg.gain.value = 1;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp * 0.55, t + 0.08); g.gain.setTargetAtTime(0, t + dur - 0.1, 0.06);
    }
    lfo.start(t); est.start(t, Math.random() * 2); return fontes;
  }
}
