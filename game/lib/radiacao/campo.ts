// Campo de radiação vivo (Plano GOTY §2.3 / S1): fontes tiradas dos picos de `zona.rad` + pluma no ar numa grade 96×96.
// Advecção semi-lagrangiana (Stam, "Stable Fluids", 1999) com vento uniforme + difusão explícita de 5 pontos, a ~2 Hz.
// Três camadas somadas em `amostra`:
//   leito — o `zona.rad` de hoje (estático: quem não tem pluma por perto sente exatamente o que sente hoje);
//   solo  — excesso depositado (pluma que assentou, chuva ácida, Colosso morto); volta ao leito devagar, a chuva lava;
//   ar    — a pluma: as fontes emitem, o vento leva, a difusão abre, a chuva derruba, a poeira levanta do chão;
//   pó    — pó azul (momento autoral, ver po.ts): gruda, é carregado e deixa rastro.
// Puro: sem Phaser/DOM; aleatório só via game/lib/rng.ts (e simplex-noise semeado por ele).
import { createNoise2D } from 'simplex-noise';
import type { CampoRadiacao, ClimaMundo, FonteRad, TipoFonteRad, ZonaMundo } from '../../nucleo/contratos';
import { Rng, hashStr } from '../rng';
import { MIN_POR_SEG } from '../../dados/balanco';

export const G = 96;
/** fontes tiradas do leito por zona (as mais fortes; o pântano tem água quente demais para virar 20 fontes) */
export const MAX_FONTES = 8;
/** parâmetros físicos (unidade de tempo: minuto de jogo; distância: casa da grade) */
export const FIS = {
  /** casas por minuto com vento 1 (0,85 → ~15 casas/h) */ vel: 0.3,
  /** ventilação da pluma por minuto (vida média ~35 min) */ ventila: 1 / 35,
  /** derrubada pela chuva por minuto, por unidade de chuva */ lavaAr: 0.15,
  /** difusão base e extra com poeira (casas²/min) */ difusao: 0.05, difusaoPoeira: 0.3,
  /** emissão por minuto de uma fonte de força 1 (12 casas vento abaixo de uma cratera: ~60 cpm, o dobro… triplo do fundo) */ emissao: 0.2,
  /** fração da ventilação que assenta no solo (deposição seca) e da chuva que fica no solo */ depSeca: 0.15, depUmida: 0.5,
  /** solo volta ao leito (por minuto) e a chuva lava o excesso */ relaxSolo: 1 / 720, lavaSolo: 0.012,
  /** poeira levanta o chão para o ar (por minuto, por unidade de poeira) */ suspende: 0.004,
  /** chuva ácida: taxa no ar por unidade de chuva e deposição no solo por minuto */ acidaAr: 0.575, acidaSolo: 0.0015,
  /** taxa de uma casa coberta de pó azul (po = 1) */ taxaPo: 1.2,
  /** passo máximo da simulação (estabilidade da difusão e CFL) */ passoMax: 1.5,
} as const;

const tipoPorBioma = (bioma: string, pico: number): TipoFonteRad => pico >= 0.85 ? 'cratera' : bioma === 'pantano' || bioma === 'floresta' ? 'cogumelo' : bioma === 'industrial' ? 'barril' : 'carcaca';
const andavel = (z: ZonaMundo, i: number) => !z.solido[i] && z.tipos[i] !== 17 && z.tipos[i] !== 18; // 17/18 = água (T.AGUA_RASA/FUNDA em zona.ts)

export class CampoCinzas implements CampoRadiacao {
  readonly leito = new Float32Array(G * G);
  readonly solo = new Float32Array(G * G);
  readonly po = new Float32Array(G * G);
  ar = new Float32Array(G * G);
  private tmp = new Float32Array(G * G);
  private lista: FonteRad[] = [];
  private idxFonte: Int32Array = new Int32Array(0);
  private sx: number; private sy: number;
  private ruido: (x: number, y: number) => number;
  /** minutos de jogo simulados (para o meandro do vento) */ t = 0;
  acida = 0;
  temPo = false;

  constructor(readonly zona: ZonaMundo, readonly seed: string) {
    this.sx = G / Math.max(1, zona.w); this.sy = G / Math.max(1, zona.h);
    const rng = new Rng(seed + '|rad|' + zona.id); this.ruido = createNoise2D(() => rng.f());
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
      const zx = Math.min(zona.w - 1, Math.floor(gx / this.sx)), zy = Math.min(zona.h - 1, Math.floor(gy / this.sy));
      this.leito[gy * G + gx] = zona.rad[zy * zona.w + zx] ?? 0;
    }
    this.extrairFontes(rng);
  }

  /** picos do leito viram fontes (supressão de não-máximos, raio 8); a zona industrial ganha barris pela seed */
  private extrairFontes(rng: Rng) {
    const L = this.leito, picos: [number, number, number][] = [];
    for (let y = 2; y < G - 2; y++) for (let x = 2; x < G - 2; x++) {
      const v = L[y * G + x]; if (v < 0.45) continue;
      let max = true; for (let dy = -3; dy <= 3 && max; dy++) for (let dx = -3; dx <= 3; dx++) { const w = L[(y + dy) * G + x + dx]; if (w > v || (w === v && (dy < 0 || (dy === 0 && dx < 0)))) { max = false; break; } }
      if (max) picos.push([x, y, v]);
    }
    picos.sort((a, b) => b[2] - a[2] || a[1] - b[1] || a[0] - b[0]);
    for (const [x, y, v] of picos) if (this.lista.length < MAX_FONTES && this.lista.every(f => Math.hypot(f.x - x - 0.5, f.y - y - 0.5) >= 10)) this.lista.push({ x: x + 0.5, y: y + 0.5, forca: v, tipo: tipoPorBioma(this.zona.bioma, v) });
    if (this.zona.bioma === 'industrial') for (let k = rng.int(2, 4), t = 0; k > 0 && t < 200; t++) {
      const x = rng.int(4, G - 5), y = rng.int(4, G - 5); if (!this.andavelG(x, y) || this.lista.some(f => Math.hypot(f.x - x, f.y - y) < 6)) continue;
      this.lista.push({ x: x + 0.5, y: y + 0.5, forca: 0.45, tipo: 'barril' }); this.bolha(this.leito, x + 0.5, y + 0.5, 0.55, 1.8, true); k--;
    }
    this.reindexar();
  }
  andavelG(gx: number, gy: number) {
    const zx = Math.min(this.zona.w - 1, Math.floor(gx / this.sx)), zy = Math.min(this.zona.h - 1, Math.floor(gy / this.sy));
    return this.zona.solido.length === 0 || andavel(this.zona, zy * this.zona.w + zx);
  }
  private reindexar() { this.idxFonte = Int32Array.from(this.lista, f => Math.min(G - 1, Math.floor(f.y)) * G + Math.min(G - 1, Math.floor(f.x))); }
  /** soma (ou tira o máximo, se `max`) um cone de altura `pico` e raio `r` numa grade */
  private bolha(a: Float32Array, cx: number, cy: number, pico: number, r: number, max = false) {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(G - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(G - 1, Math.ceil(cx + r)); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d >= r) continue; const v = pico * (1 - d / r); const i = y * G + x; a[i] = max ? Math.max(a[i], v) : a[i] + v;
    }
  }

  fontes(): readonly FonteRad[] { return this.lista; }
  /** fonte nova em jogo (Colosso morto, barril aberto): emite no ar e esquenta o solo, que esfria com o tempo */
  adicionarFonte(f: FonteRad, calorSolo = 0.6) { this.lista.push(f); this.reindexar(); this.bolha(this.solo, f.x * this.sx, f.y * this.sy, calorSolo, 2.2); }
  removerFonte(f: FonteRad) { const i = this.lista.indexOf(f); if (i >= 0) { this.lista.splice(i, 1); this.reindexar(); } }

  // ---------------------------------------------------------------- leitura (barata: sem alocação)
  private gi(x: number, y: number) { const gx = Math.min(G - 1, Math.max(0, Math.floor(x * this.sx))), gy = Math.min(G - 1, Math.max(0, Math.floor(y * this.sy))); return gy * G + gx; }
  /** ar com interpolação bilinear (centro da casa em +0,5) */
  amostraAr(x: number, y: number): number {
    const fx = x * this.sx - 0.5, fy = y * this.sy - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), wx = fx - x0, wy = fy - y0, a = this.ar;
    const g = (xx: number, yy: number) => xx < 0 || yy < 0 || xx >= G || yy >= G ? 0 : a[yy * G + xx];
    return (g(x0, y0) * (1 - wx) + g(x0 + 1, y0) * wx) * (1 - wy) + (g(x0, y0 + 1) * (1 - wx) + g(x0 + 1, y0 + 1) * wx) * wy + this.acida;
  }
  /** o que está no chão da casa (leito + solo + pó): igual ao `zona.rad` de hoje enquanto nada mudou */
  amostraChao(x: number, y: number): number { const i = this.gi(x, y); return this.leito[i] + this.solo[i] + this.po[i] * FIS.taxaPo; }
  amostra(x: number, y: number): number { return this.amostraChao(x, y) + this.amostraAr(x, y); }
  gradiente(x: number, y: number): { dx: number; dy: number } {
    const gx = this.amostra(x + 1, y) - this.amostra(x - 1, y), gy = this.amostra(x, y + 1) - this.amostra(x, y - 1), m = Math.hypot(gx, gy);
    return m < 1e-4 ? { dx: 0, dy: 0 } : { dx: gx / m, dy: gy / m };
  }

  // ---------------------------------------------------------------- simulação
  /** dt em segundos reais (como o `tick`); a física corre em minutos de jogo (MIN_POR_SEG) */
  passo(dt: number, clima: ClimaMundo): void {
    let min = Math.min(120, Math.max(0, dt * MIN_POR_SEG)); if (min <= 0) return;
    const n = Math.ceil(min / FIS.passoMax); min /= n;
    for (let k = 0; k < n; k++) this.subpasso(min, clima);
  }
  /** nada no ar, nada a mais no solo e nada que emita: a simulação dorme (zonas frias custam ~0) */
  private ocioso = false;
  private subpasso(dm: number, c: ClimaMundo) {
    this.t += dm;
    const chuva = Math.max(0, c.chuva), poeira = Math.max(0, c.poeira);
    this.acida = c.acida ? chuva * FIS.acidaAr : 0;
    if (this.ocioso && this.lista.length === 0 && poeira < 0.02 && !this.acida) { if (this.temPo && chuva > 0.05) this.chuvaNoPo(chuva * dm); return; }
    // vento uniforme com meandro lento (simplex no tempo): a pluma serpenteia em vez de andar em linha reta
    const dir = c.ventoDir + 0.3 * this.ruido(this.t / 25, 0.5), vel = Math.max(0, c.vento) * FIS.vel * (1 + 0.25 * this.ruido(this.t / 9, 7.3));
    const ox = -Math.cos(dir) * vel * dm, oy = -Math.sin(dir) * vel * dm;
    const ix = Math.floor(ox), iy = Math.floor(oy), wx = ox - ix, wy = oy - iy;
    const w00 = (1 - wx) * (1 - wy), w10 = wx * (1 - wy), w01 = (1 - wx) * wy, w11 = wx * wy;
    const A = this.ar, B = this.tmp;
    // 1) advecção: cada casa busca o ar de onde o vento veio (fora da grade = ar limpo)
    for (let y = 0; y < G; y++) {
      const y0 = y + iy, y1 = y0 + 1, r0 = y0 >= 0 && y0 < G ? y0 * G : -1, r1 = y1 >= 0 && y1 < G ? y1 * G : -1;
      for (let x = 0; x < G; x++) {
        const x0 = x + ix, x1 = x0 + 1, c0 = x0 >= 0 && x0 < G, c1 = x1 >= 0 && x1 < G;
        B[y * G + x] = (r0 >= 0 ? (c0 ? A[r0 + x0] * w00 : 0) + (c1 ? A[r0 + x1] * w10 : 0) : 0) + (r1 >= 0 ? (c0 ? A[r1 + x0] * w01 : 0) + (c1 ? A[r1 + x1] * w11 : 0) : 0);
      }
    }
    // 2) difusão + perdas + trocas com o solo
    const D = Math.min(0.24, (FIS.difusao + FIS.difusaoPoeira * poeira) * dm);
    const perdaVent = FIS.ventila * dm, perdaChuva = FIS.lavaAr * chuva * dm, perda = Math.min(0.9, perdaVent + perdaChuva);
    const dep = (FIS.depSeca * perdaVent + FIS.depUmida * perdaChuva);
    const volta = Math.min(1, (FIS.relaxSolo + FIS.lavaSolo * chuva) * dm), sobe = FIS.suspende * poeira * dm, acidaSolo = c.acida ? FIS.acidaSolo * chuva * dm : 0;
    const L = this.leito, S = this.solo, P = this.po; let vivo = 0;
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
      const i = y * G + x, v = B[i];
      const viz = (x > 0 ? B[i - 1] : 0) + (x < G - 1 ? B[i + 1] : 0) + (y > 0 ? B[i - G] : 0) + (y < G - 1 ? B[i + G] : 0);
      const chao = L[i] + S[i] + P[i] * FIS.taxaPo;
      A[i] = (v + D * (viz - 4 * v)) * (1 - perda) + chao * sobe;
      S[i] += v * dep - S[i] * volta + acidaSolo; vivo += A[i] + S[i];
    }
    this.ocioso = vivo < 1e-3;
    // 3) emissão das fontes (chuva molha o chão e segura; poeira levanta mais)
    const em = FIS.emissao * dm * (1 - 0.6 * Math.min(1, chuva)) * (1 + 1.5 * poeira);
    for (let k = 0; k < this.lista.length; k++) {
      const f = this.lista[k]; if (f.tipo === 'po_azul') continue; // pó é pesado: só sobe com poeira (via `sobe`)
      A[this.idxFonte[k]] += f.forca * em;
    }
    // 4) chuva espalha o pó azul devagar (césio é solúvel): a água leva para as casas vizinhas e parte some no solo
    if (this.temPo && chuva > 0.05) this.chuvaNoPo(chuva * dm);
  }
  private chuvaNoPo(k: number) {
    const P = this.po, B = this.tmp, f = Math.min(0.2, 0.01 * k); B.set(P); let resta = 0;
    for (let y = 1; y < G - 1; y++) for (let x = 1; x < G - 1; x++) {
      const i = y * G + x, v = B[i]; if (v < 1e-5) continue; const sai = v * f; P[i] -= sai; const q = sai * 0.2; P[i - 1] += q; P[i + 1] += q; P[i - G] += q; P[i + G] += q;
      resta += P[i];
    }
    this.temPo = resta > 1e-4;
  }

  // ---------------------------------------------------------------- pó azul (a lógica de quem carrega fica em po.ts)
  /** pó no chão, em coordenadas da zona */
  poEm(x: number, y: number) { return this.po[this.gi(x, y)]; }
  depositarPo(x: number, y: number, q: number) { if (q <= 0) return; this.po[this.gi(x, y)] += q; this.temPo = true; }
  /** tira uma fração do pó da casa; devolve quanto saiu */
  pegarPo(x: number, y: number, frac: number) { const i = this.gi(x, y), q = this.po[i] * Math.min(1, frac); this.po[i] -= q; return q; }
  /** pó em lista esparsa (para o save: rastro que o jogador deixou nesta zona) */
  exportarPo(max = 400): [number, number][] {
    const o: [number, number][] = []; for (let i = 0; i < this.po.length; i++) if (this.po[i] > 0.0005) o.push([i, Math.round(this.po[i] * 1e4) / 1e4]);
    return o.sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, max);
  }
  importarPo(l: readonly (readonly [number, number])[]) { this.po.fill(0); for (const [i, q] of l) if (i >= 0 && i < this.po.length) this.po[i] = q; this.temPo = l.length > 0; this.sincronizarFontesPo(); }
  /** a cápsula de pó azul nasce em algumas zonas (pela seed): um ponto muito quente, de raio curto, sem pluma */
  semearPo(chance: number) {
    const rng = new Rng(this.seed + '|po|' + this.zona.id); if (!rng.chance(chance)) return;
    for (let t = 0; t < 300; t++) {
      const x = rng.int(8, G - 9), y = rng.int(8, G - 9); if (!this.andavelG(x, y) || this.lista.some(f => Math.hypot(f.x - x, f.y - y) < 12)) continue;
      this.po[y * G + x] = 1; for (const d of [-1, 1, -G, G]) this.po[y * G + x + d] = 0.25; this.temPo = true; break;
    }
    this.sincronizarFontesPo();
  }
  private sincronizarFontesPo() {
    this.lista = this.lista.filter(f => f.tipo !== 'po_azul');
    let mi = -1, mv = 0.3; for (let i = 0; i < this.po.length; i++) if (this.po[i] > mv) { mv = this.po[i]; mi = i; }
    if (mi >= 0) this.lista.push({ x: (mi % G + 0.5) / this.sx, y: (Math.floor(mi / G) + 0.5) / this.sy, forca: mv * FIS.taxaPo, tipo: 'po_azul' });
    this.reindexar();
  }
  /** soma do ar (para testes e diagnóstico) */
  massaAr() { let s = 0; for (let i = 0; i < this.ar.length; i++) s += this.ar[i]; return s; }
}

/** chance de a zona ter a cápsula de pó azul, por bioma (ferro-velho de cidade é onde ela costuma estar) */
export const CHANCE_PO: Record<string, number> = { cidade: 0.5, ermo: 0.3, industrial: 0.35 };

export function criarCampo(zona: ZonaMundo, seed: string): CampoCinzas {
  const c = new CampoCinzas(zona, seed); c.semearPo(CHANCE_PO[zona.bioma] ?? 0);
  // aquece: 2 h de jogo de brisa leve, para a pluma já existir ao chegar (o resultado só depende da seed)
  const clima: ClimaMundo = { tipo: 'limpo', chuva: 0, vento: 0.2, ventoDir: (hashStr(seed + zona.id) / 4294967296) * Math.PI * 2, neblina: 0, poeira: 0, acida: false };
  if (c.fontes().length) c.passo(120 / MIN_POR_SEG, clima);
  c.t = 0; return c;
}
