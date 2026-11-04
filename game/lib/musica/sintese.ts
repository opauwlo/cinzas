// Síntese pura (sem Web Audio): a corda da viola por Karplus-Strong (Karplus & Strong, 1983, algoritmo de domínio público),
// com afinação fina por passa-tudo fracionário (Jaffe & Smith, 1983) e o par de cordas da viola caipira (oitava nos pares graves).
// Determinística: a excitação vem de Rng com seed pela nota — a mesma nota soa sempre igual. orquestra.ts põe em AudioBuffer e guarda em cache.
import { Rng } from '../rng';

type OpcCorda = { /** 0..1: quanto agudo tem a palhetada */ brilho?: number; /** perda por volta (0,99..0,9999) */ decai?: number; /** posição da palhetada (0..0,5): tira harmônicos */ pos?: number; semente?: string };

/** uma corda dedilhada: Float32Array de `seg` segundos em `fs` */
export function cordaKS(freq: number, seg: number, fs: number, o: OpcCorda = {}): Float32Array {
  const brilho = o.brilho ?? 0.6, decai = o.decai ?? 0.9985, pos = o.pos ?? 0.14, n = Math.max(1, Math.floor(seg * fs)), out = new Float32Array(n);
  const atraso = fs / freq - 0.5, N = Math.max(2, Math.floor(atraso - 0.01)), frac = atraso - N, C = (1 - frac) / (1 + frac);
  const buf = new Float32Array(N), rng = new Rng(o.semente ?? `ks:${freq.toFixed(2)}`);
  // excitação: ruído com passa-baixa de um polo (brilho) e o pente da posição da palhetada
  let lp = 0; for (let i = 0; i < N; i++) { lp += (rng.f() * 2 - 1 - lp) * (0.2 + brilho * 0.8); buf[i] = lp; }
  const p = Math.max(1, Math.round(N * pos)), ex = Float32Array.from(buf); for (let i = 0; i < N; i++) buf[i] = ex[i] - 0.9 * ex[(i - p + N) % N];
  let media = 0; for (let i = 0; i < N; i++) media += buf[i]; media /= N; for (let i = 0; i < N; i++) buf[i] -= media;
  let idx = 0, ant = 0, apIn = 0, apOut = 0;
  for (let i = 0; i < n; i++) {
    const x = buf[idx], m = 0.5 * (x + ant) * decai; ant = x;
    const ap = C * m + apIn - C * apOut; apIn = m; apOut = ap;
    out[i] = x; buf[idx] = ap; idx = idx + 1 === N ? 0 : idx + 1;
  }
  return out;
}

/** o par de cordas da viola: uníssono desafinado (+4 cents) ou oitava acima nos pares graves (Ré3 e abaixo), como na viola de verdade */
export function violaPar(freq: number, seg: number, fs: number): Float32Array {
  const a = cordaKS(freq, seg, fs, { semente: `viola:${freq.toFixed(2)}` });
  const b = freq < 160 ? cordaKS(freq * 2, seg, fs, { brilho: 0.7, decai: 0.9975, semente: `oit:${freq.toFixed(2)}` }) : cordaKS(freq * 2 ** (4 / 1200), seg, fs, { semente: `par:${freq.toFixed(2)}` });
  const out = new Float32Array(a.length), gb = freq < 160 ? 0.45 : 0.8; let pico = 0;
  // corpo: um passa-alta suave (~180 Hz) tira o "embolado" que o alto-falante não toca, sem mexer no timbre
  let hpX = 0, hpY = 0; const r = Math.exp(-2 * Math.PI * 180 / fs);
  for (let i = 0; i < a.length; i++) { const x = a[i] + gb * b[i]; hpY = r * (hpY + x - hpX); hpX = x; out[i] = hpY; pico = Math.max(pico, Math.abs(hpY)); }
  if (pico > 0) for (let i = 0; i < out.length; i++) out[i] *= 0.9 / pico;
  return out;
}

/** altura estimada por autocorrelação (Hz) — para o teste de afinação */
export function alturaHz(s: Float32Array, fs: number, fmin = 70, fmax = 1500, de = 0, n = 4096): number {
  const lmin = Math.floor(fs / fmax), lmax = Math.ceil(fs / fmin); let melhor = 0, lag = lmin;
  const ac = (l: number) => { let a = 0; for (let i = de; i < de + n; i++) a += s[i] * s[i + l]; return a; };
  for (let l = lmin; l <= lmax; l++) { const a = ac(l); if (a > melhor) { melhor = a; lag = l; } }
  const y0 = ac(lag - 1), y1 = ac(lag), y2 = ac(lag + 1), d = (y0 - y2) / (2 * (y0 - 2 * y1 + y2) || 1); // interpolação parabólica
  return fs / (lag + d);
}

/** fração da energia acima de `fc` Hz, por DFT direta em `n` amostras a partir de `de` (n potência de 2) */
export function energiaAcima(s: ArrayLike<number>, fs: number, fc: number, de = 0, n = 4096): number {
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = (s[de + i] ?? 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1))); // janela de Hann
  fft(re, im); let acima = 0, total = 0;
  for (let k = 1; k < n / 2; k++) { const e = re[k] * re[k] + im[k] * im[k]; total += e; if (k * fs / n >= fc) acima += e; }
  return total ? acima / total : 0;
}
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j], vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

/** a cama renderizada em amostras (o mesmo que orquestra.ts monta com PeriodicWave): para medir o espectro nos testes */
export function renderDrone(f0: number, parciais: readonly number[], batimentoHz: number, seg: number, fs: number): Float32Array {
  const n = Math.floor(seg * fs), out = new Float32Array(n);
  for (let h = 1; h < parciais.length; h++) { const a = parciais[h]; if (!a) continue; for (const df of [0, batimentoHz]) { const w = 2 * Math.PI * (f0 + df) * h / fs; for (let i = 0; i < n; i++) out[i] += a * 0.5 * Math.sin(w * i); } }
  return out;
}
