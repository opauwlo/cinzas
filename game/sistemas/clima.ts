// Clima e ciclo dia/noite. Estado suave (chuva, vento, neblina, poeira, nuvens), raios e trovões, gradação de cor por hora
// e camada de efeitos desenhada em pixels (chuva, respingos, névoa pontilhada, poeira).
import { Rng } from '../lib/rng';
import type { Bioma, ClimaId } from '../dados/biomas';

type Alvo = { chuva: number; vento: number; neblina: number; poeira: number; nuvem: number; tempestade: number; acida: boolean };
const ALVOS: Record<ClimaId, Alvo> = {
  limpo: { chuva: 0, vento: 0.1, neblina: 0, poeira: 0, nuvem: 0.1, tempestade: 0, acida: false },
  nublado: { chuva: 0, vento: 0.25, neblina: 0, poeira: 0, nuvem: 0.7, tempestade: 0, acida: false },
  vento: { chuva: 0, vento: 0.85, neblina: 0, poeira: 0, nuvem: 0.3, tempestade: 0, acida: false },
  chuva: { chuva: 0.6, vento: 0.35, neblina: 0.1, poeira: 0, nuvem: 0.85, tempestade: 0, acida: false },
  tempestade: { chuva: 1, vento: 0.85, neblina: 0.1, poeira: 0, nuvem: 1, tempestade: 1, acida: false },
  neblina: { chuva: 0, vento: 0.1, neblina: 0.8, poeira: 0, nuvem: 0.5, tempestade: 0, acida: false },
  poeira: { chuva: 0, vento: 0.95, neblina: 0, poeira: 0.85, nuvem: 0.4, tempestade: 0, acida: false },
  acida: { chuva: 0.55, vento: 0.3, neblina: 0.2, poeira: 0, nuvem: 0.85, tempestade: 0, acida: true },
};
export const NOME_CLIMA: Record<ClimaId, string> = { limpo: 'Céu limpo', nublado: 'Nublado', vento: 'Ventania', chuva: 'Chuva', tempestade: 'Tempestade', neblina: 'Neblina', poeira: 'Tempestade de poeira', acida: 'Chuva ácida' };

/** claridade natural pela hora (0 = noite, 1 = dia) */
export const luzDia = (h: number) => (h < 5 ? 0 : h < 7.5 ? (h - 5) / 2.5 : h < 18 ? 1 : h < 20.5 ? 1 - (h - 18) / 2.5 : 0);
const KEYS: [number, [number, number, number]][] = [[0, [96, 112, 178]], [5, [104, 118, 182]], [6.5, [255, 196, 156]], [8, [255, 242, 228]], [12, [255, 255, 255]], [16.5, [255, 244, 224]], [18.3, [255, 176, 124]], [20, [168, 124, 150]], [21.5, [100, 114, 178]], [24, [96, 112, 178]]];
/** cor multiplicativa do céu pela hora, escurecida por nuvens/tempestade */
export function gradeCor(h: number, nuvem: number, tempestade: number): number {
  let i = 0; while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) i++;
  const [h0, c0] = KEYS[i], [h1, c1] = KEYS[i + 1], t = Math.max(0, Math.min(1, (h - h0) / (h1 - h0))), mix = (a: number, b: number) => a + (b - a) * t;
  const cn = 1 - nuvem * 0.18 - tempestade * 0.18; let r = mix(c0[0], c1[0]) * cn, g = mix(c0[1], c1[1]) * cn, b = mix(c0[2], c1[2]) * (1 - nuvem * 0.08 - tempestade * 0.08);
  const gray = (r + g + b) / 3, d = nuvem * 0.25; r += (gray - r) * d; g += (gray - g) * d; b += (gray - b) * d;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
/** direção e tamanho da sombra do sol (em tela) e opacidade */
export function sombraSol(h: number, nuvem: number) {
  const t = Math.max(0, Math.min(1, (h - 6) / 12)), elev = Math.sin(t * Math.PI), dia = luzDia(h);
  return { dx: -Math.cos(t * Math.PI) * (1.2 - elev * 0.5), len: 0.25 + (1 - elev) * 1.1, a: dia * (1 - nuvem * 0.75) * 0.9 };
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const NR = 64; const RUIDO = (() => { const r = new Rng('nevoa'), g = new Float32Array(NR * NR), a = new Float32Array(NR * NR); for (let i = 0; i < a.length; i++) a[i] = r.f(); for (let y = 0; y < NR; y++) for (let x = 0; x < NR; x++) { let s = 0, w = 0; for (let o = 0; o < 3; o++) { const k = 4 << o, fx = (x / NR) * k, fy = (y / NR) * k, x0 = Math.floor(fx) % k, y0 = Math.floor(fy) % k, x1 = (x0 + 1) % k, y1 = (y0 + 1) % k, tx = fx - Math.floor(fx), ty = fy - Math.floor(fy), v = (n: number, m: number) => a[((m * 7 + o * 13) % NR) * NR + ((n * 5 + o * 3) % NR)]; const val = v(x0, y0) * (1 - tx) * (1 - ty) + v(x1, y0) * tx * (1 - ty) + v(x0, y1) * (1 - tx) * ty + v(x1, y1) * tx * ty; s += val / (1 << o); w += 1 / (1 << o); } g[y * NR + x] = s / w; } return g; })();

export class Clima {
  tipo: ClimaId = 'limpo'; chuva = 0; vento = 0.1; neblina = 0; poeira = 0; nuvem = 0.1; tempestade = 0; acida = false; dentro = 0;
  private alvo: Alvo = { ...ALVOS.limpo }; private proxima = 0; private rng: Rng; fase = 0; private raioT = 8; flash = 0; trovoes: number[] = []; aoRaio?: (atraso: number) => void;
  private gotas: Float32Array; private splash: { x: number; y: number; t: number }[] = []; private nGotas = 1000;
  constructor(seed: string, public bioma: Bioma, minutos: number, tipoInicial?: ClimaId) {
    this.rng = new Rng(seed + '|clima'); this.gotas = new Float32Array(this.nGotas * 4);
    for (let i = 0; i < this.nGotas; i++) { this.gotas[i * 4] = this.rng.f(); this.gotas[i * 4 + 1] = this.rng.f(); this.gotas[i * 4 + 2] = 0.8 + this.rng.f() * 0.5; this.gotas[i * 4 + 3] = this.rng.f(); }
    this.definir(tipoInicial ?? this.rng.peso(bioma.clima), true); this.proxima = minutos + this.rng.range(120, 300);
  }
  definir(t: ClimaId, imediato = false) { this.tipo = t; this.alvo = { ...ALVOS[t] }; if (imediato) { this.chuva = this.alvo.chuva; this.vento = this.alvo.vento; this.neblina = this.alvo.neblina; this.poeira = this.alvo.poeira; this.nuvem = this.alvo.nuvem; this.tempestade = this.alvo.tempestade; this.acida = this.alvo.acida; } }
  /** rajada: vento instantâneo com oscilação */
  get rajada() { return Math.max(0, Math.min(1.2, this.vento * (0.8 + 0.2 * Math.sin(this.fase * 0.7) + 0.12 * Math.sin(this.fase * 2.3 + 1)))); }
  atualizar(dt: number, minutos: number, interior: boolean) {
    this.fase += dt; const k = Math.min(1, dt * 0.22), a = this.alvo;
    this.chuva += (a.chuva - this.chuva) * k; this.vento += (a.vento - this.vento) * k; this.neblina += (a.neblina - this.neblina) * k; this.poeira += (a.poeira - this.poeira) * k; this.nuvem += (a.nuvem - this.nuvem) * k; this.tempestade += (a.tempestade - this.tempestade) * k;
    this.acida = a.acida && this.chuva > 0.15; this.dentro += ((interior ? 1 : 0) - this.dentro) * Math.min(1, dt * 3);
    if (minutos >= this.proxima) { let n = this.rng.peso(this.bioma.clima); if (n === this.tipo) n = this.rng.peso(this.bioma.clima); this.definir(n); this.proxima = minutos + this.rng.range(120, 300); }
    if (this.tempestade > 0.5) { this.raioT -= dt; if (this.raioT <= 0) { this.raioT = this.rng.range(5, 18); this.flash = 1; const d = this.rng.range(0.1, 1); this.aoRaio?.(d * 3.2); } }
    this.flash = Math.max(0, this.flash - dt * 2.2);
  }
  /** nome para o HUD */
  get nome() { return NOME_CLIMA[this.tipo]; }
  /** visibilidade (multiplicador do alcance de visão) */
  get visibilidade() { return 1 - this.neblina * 0.45 - this.poeira * 0.4 - this.chuva * 0.12; }
  /** multiplicador do alcance de ruído */
  get ruidoMult() { return 1 - this.chuva * 0.3 - this.vento * 0.12; }
  ativo() { return (this.chuva > 0.03 && this.dentro < 0.95) || this.neblina > 0.04 || this.poeira > 0.04; }

  /** desenha a camada de clima (pixels RGBA). Devolve true se desenhou algo. */
  desenhar(d: Uint8ClampedArray, w: number, h: number, scrollX: number, scrollY: number, dt: number, z = 1): boolean {
    d.fill(0); let algo = false; const vis = 1 - this.dentro, ch = this.chuva * vis, vx = -(0.15 + this.rajada * 0.9) * 40 / z;
    const px = (x: number, y: number, r: number, g: number, b: number, a: number) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const o = (y * w + x) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = a; };
    if (ch > 0.03) {
      algo = true; const n = Math.min(this.nGotas, Math.floor(360 * Math.min(1, ch) * (w * z * h * z) / (206 * 440))), cor = this.acida ? [150, 235, 110] : [176, 196, 214], len = 3 + Math.round(ch * 2);
      for (let i = 0; i < n; i++) {
        const o = i * 4; let x = this.gotas[o] * w, y = this.gotas[o + 1] * h; const sp = this.gotas[o + 2] * (150 + ch * 90) / z;
        x += vx * dt; y += sp * dt; if (y >= h) { if (this.rng.chance(0.25) && this.splash.length < 40) this.splash.push({ x, y: this.rng.range(h * 0.1, h * 0.95), t: 0 }); y -= h; this.gotas[o + 3] = this.rng.f(); } if (x < 0) x += w; this.gotas[o] = x / w; this.gotas[o + 1] = y / h;
        const tail = vx / sp; for (let k = 0; k < len; k++) px(x - tail * k * 2, y - k, cor[0], cor[1], cor[2], 190 - k * 28);
      }
      for (let i = this.splash.length - 1; i >= 0; i--) { const s = this.splash[i]; s.t += dt; if (s.t > 0.28) { this.splash.splice(i, 1); continue; } const r = 1 + Math.floor(s.t * 10), a = 170 * (1 - s.t / 0.28); px(s.x - r, s.y, 190, 210, 225, a); px(s.x + r, s.y, 190, 210, 225, a); px(s.x, s.y - 1, 190, 210, 225, a * 0.7); }
    }
    if (this.neblina > 0.04 || this.poeira > 0.04) {
      algo = true; const dens = Math.max(this.neblina * 0.85, this.poeira * 0.55) * (this.neblina > this.poeira ? vis * 0.9 + 0.1 : 1), ox = Math.floor(scrollX * 0.15 + this.fase * (6 + this.rajada * 40)), oy = Math.floor(scrollY * 0.15 + this.fase * 2);
      const cor = this.poeira > this.neblina ? [190, 160, 110] : [176, 184, 186];
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        const a = RUIDO[(((y >> 1) + oy) & (NR - 1)) * NR + (((x >> 1) + ox) & (NR - 1))] * dens * 1.25, q = Math.floor(a * 3 + BAYER[((y >> 1) & 3) * 4 + ((x >> 1) & 3)]) / 3 * 0.62;
        if (q > 0.02) { const al = q * 255; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) px(x + i, y + j, cor[0], cor[1], cor[2], al); }
      }
    }
    if (this.poeira > 0.15) { const n = Math.floor(70 * this.poeira); for (let i = 0; i < n; i++) { const t = (i * 0.618 + this.fase * (0.35 + (i % 7) * 0.05)) % 1, x = (t * (w + 60) + (i * 37) % w) % w, y = ((i * 73) % h + Math.sin(this.fase + i) * 3 + h) % h, l = 4 + (i % 4) * 2; for (let k = 0; k < l; k++) px(x - k, y, 210, 180, 130, 150 - k * 14); } }
    return algo;
  }
}
