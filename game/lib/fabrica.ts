// Fábrica de sprites: receita + clipe + direção + quadro -> sprite renderizado sob demanda (lazy) e em cache.
// Para criar um tipo novo basta registrar um modelo (montar + clipes + centro); o resto (8 direções, cache, fila) já vem pronto.
import { renderVox, type Vox } from './vox';
import { montarHumano, poseHumano, CLIPES_HUMANO, centroHumano, type RecHumano } from './humano';
import { montarQuad, poseQuad, CLIPES_QUAD, centroQuad, montarInseto, poseInseto, CLIPES_INSETO, centroInseto, montarAve, poseAve, CLIPES_AVE, centroAve, type RecQuad, type RecInseto, type RecAve } from './fauna';

export type Quadro = { key: string; ox: number; oy: number; w: number; h: number; canvas: HTMLCanvasElement };
export type Modelo<R = never> = { tipo: string; clipes: Record<string, { n: number; loop: boolean }>; montar: (r: R, clip: string, i: number) => Vox; centro: (r: R) => [number, number, number] };
const MODELOS: Record<string, Modelo<never>> = {};
export function registrarModelo<R>(m: Modelo<R>) { MODELOS[m.tipo] = m as unknown as Modelo<never>; }
registrarModelo<RecHumano>({ tipo: 'humano', clipes: CLIPES_HUMANO, montar: (r, c, i) => montarHumano(r, poseHumano(c, i, r)), centro: centroHumano });
registrarModelo<RecQuad>({ tipo: 'quad', clipes: CLIPES_QUAD, montar: (r, c, i) => montarQuad(r, poseQuad(c, i, r)), centro: centroQuad });
registrarModelo<RecInseto>({ tipo: 'inseto', clipes: CLIPES_INSETO, montar: (r, c, i) => montarInseto(r, poseInseto(c, i)), centro: centroInseto });
registrarModelo<RecAve>({ tipo: 'ave', clipes: CLIPES_AVE, montar: (r, c, i) => montarAve(r, poseAve(c, i)), centro: centroAve });
export const clipesDe = (tipo: string) => MODELOS[tipo]?.clipes ?? {};

const kcache = new WeakMap<object, string>();
export const chaveRec = (r: object) => { let k = kcache.get(r); if (!k) { k = JSON.stringify(r); kcache.set(r, k); } return k; };
const hashStr = (s: string) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };

function recortar(r: { canvas: HTMLCanvasElement; ox: number; oy: number }) {
  const c = r.canvas, g = c.getContext('2d')!, d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return { canvas: c, ox: r.ox, oy: r.oy };
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d')!.drawImage(c, -x0, -y0); return { canvas: o, ox: r.ox - x0, oy: r.oy - y0 };
}

type Pedido = { k: string; tipo: string; rec: unknown; clip: string; dir: number; i: number; prio: number };
export class Fabrica {
  quadros = new Map<string, Quadro>(); private fila: Pedido[] = []; private pend = new Set<string>(); private porRec = new Map<string, Set<string>>(); total = 0;
  constructor(private registrar: (key: string, c: HTMLCanvasElement) => void, private remover: (key: string) => void = () => undefined) {}
  private key(rk: string, clip: string, dir: number, i: number) { return `${hashStr(rk)}|${clip}|${dir}|${i}`; }
  /** devolve o quadro se já existe; senão enfileira (prio menor = mais urgente) e devolve null */
  pedir(tipo: string, rec: object, clip: string, dir: number, i: number, prio = 0): Quadro | null {
    const rk = chaveRec(rec), k = this.key(rk, clip, dir, i), q = this.quadros.get(k); if (q) return q;
    if (!this.pend.has(k)) { this.pend.add(k); this.fila.push({ k, tipo, rec, clip, dir, i, prio }); } else { const p = this.fila.find(x => x.k === k); if (p && prio < p.prio) p.prio = prio; }
    return null;
  }
  /** renderiza pedidos até estourar `ms` (ao menos um). Devolve quantos fez. */
  processar(ms: number): number {
    const t0 = performance.now(); let n = 0; this.fila.sort((a, b) => a.prio - b.prio);
    while (this.fila.length && (n === 0 || performance.now() - t0 < ms)) { const p = this.fila.shift()!; this.pend.delete(p.k); this.renderizar(p); n++; }
    if (this.total > 2600) this.podar(); return n;
  }
  pendentes() { return this.fila.length; }
  private renderizar(p: Pedido) {
    const m = MODELOS[p.tipo]; if (!m) return; const rec = p.rec as never, [mcx, mcy, R] = m.centro(rec), v = m.montar(rec, p.clip, p.i);
    const r = recortar(renderVox(v, { yaw: (p.dir * Math.PI) / 4, R, mcx, mcy })), rk = chaveRec(p.rec as object);
    const q: Quadro = { key: p.k, ox: r.ox, oy: r.oy, w: r.canvas.width, h: r.canvas.height, canvas: r.canvas }; this.quadros.set(p.k, q); this.total++; this.registrar(p.k, r.canvas);
    let s = this.porRec.get(rk); if (!s) { s = new Set(); this.porRec.set(rk, s); } s.add(p.k);
  }
  temEstatico(id: string) { return this.quadros.get('e|' + id); }
  vincular(registrar: (key: string, c: HTMLCanvasElement) => void, remover: (key: string) => void) { this.registrar = registrar; this.remover = remover; }
  /** sprite estático (flora, props, estruturas): síncrono e em cache */
  estatico(id: string, montar: () => Vox, o: { yaw?: number; R: number; mcx?: number; mcy?: number }): Quadro {
    const k = 'e|' + id, q = this.quadros.get(k); if (q) return q; const v = montar();
    const r = recortar(renderVox(v, { yaw: o.yaw ?? Math.PI / 4, R: o.R, mcx: o.mcx, mcy: o.mcy })); const n: Quadro = { key: k, ox: r.ox, oy: r.oy, w: r.canvas.width, h: r.canvas.height, canvas: r.canvas };
    this.quadros.set(k, n); this.total++; this.registrar(k, r.canvas); return n;
  }
  /** descarta o que não é mais usado (ao trocar de zona) */
  podar(manter?: Set<string>) {
    for (const [rk, s] of this.porRec) { if (manter?.has(rk)) continue; for (const k of s) { this.quadros.delete(k); this.remover(k); this.total--; } this.porRec.delete(rk); }
  }
}
