// "Não pode ter lugar vazio": mede quão longe qualquer ponto do mapa fica de algo para fazer (PURO, usado pelo gerador e pelos testes).
// Algo para fazer = contêiner com saque, objeto interativo, planta colhível, ponto de interesse.
import type { Prop, FloraObj, Poi } from '../zona';
import { colheitaDe } from '../dados/colheita';

/** centros de tudo o que o jogador pode fazer ou ver de longe */
export function atracoes(props: Prop[], flora: FloraObj[], pois: Poi[]): [number, number][] {
  const a: [number, number][] = [];
  for (const p of props) if (p.inters.length > 0 || (p.loot?.length ?? 0) > 0) a.push([p.x + p.w / 2, p.y + p.h / 2]);
  for (const f of flora) if (colheitaDe(f.rec) && !f.cortada) a.push([f.x, f.y]);
  for (const o of pois) a.push([o.x, o.y]);
  return a;
}
/** distância (em tiles) de cada célula da grade w×h à atração mais próxima: transformada de distância 3-4 (erro < 8%) */
export function distanciaAtracoes(fontes: [number, number][], w: number, h: number): Float32Array {
  const d = new Int32Array(w * h).fill(1e6);
  for (const [x, y] of fontes) d[Math.min(h - 1, Math.max(0, Math.floor(y))) * w + Math.min(w - 1, Math.max(0, Math.floor(x)))] = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 3); if (y > 0) { v = Math.min(v, d[i - w] + 3); if (x > 0) v = Math.min(v, d[i - w - 1] + 4); if (x < w - 1) v = Math.min(v, d[i - w + 1] + 4); } d[i] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + 3); if (y < h - 1) { v = Math.min(v, d[i + w] + 3); if (x < w - 1) v = Math.min(v, d[i + w + 1] + 4); if (x > 0) v = Math.min(v, d[i + w - 1] + 4); } d[i] = v;
  }
  const out = new Float32Array(w * h); for (let i = 0; i < w * h; i++) out[i] = d[i] / 3; return out;
}
/** pior lacuna (tiles até a atração mais próxima) e o percentil 95 sobre as células `andavel` */
export function lacunas(d: Float32Array, w: number, h: number, andavel: (x: number, y: number) => boolean) {
  const v: number[] = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (andavel(x, y)) v.push(d[y * w + x]);
  v.sort((a, b) => a - b); return { max: v.length ? v[v.length - 1] : 0, p95: v.length ? v[Math.floor(v.length * 0.95)] : 0, n: v.length };
}
