// Props e estruturas em voxel (1 tile = 23 voxels). Um gerador por objeto; variação por receita (cor, estado, dano).
import { Vox, type Cor } from './vox';
import { ruido, mix, escurecer, clarear, hash3 } from './cor';
import * as P from './paletas';

export type RecProp = { tipo: 'prop'; n: string; v: number; d: number; o: 0 | 1; sem: number };
export type RecEstr = { tipo: 'estr'; n: 'parede' | 'janela' | 'porta' | 'portaA' | 'ruina'; estilo: number; alto: 'a' | 'b'; sem: number; o?: 0 | 1 };
export const T23 = 23;
/** dimensões em tiles (modelo, antes de girar) e altura em voxels */
export const PROP_DIM: Record<string, [number, number, number]> = {
  carro: [3, 2, 30], caminhao: [4, 2, 38], container: [3, 1, 40], barraca: [2, 2, 30], tanque: [2, 2, 52], bunker: [2, 2, 14], helicoptero: [3, 3, 34],
};
export const dimProp = (n: string, o: 0 | 1 = 0) => { const [w, d] = PROP_DIM[n] ?? [1, 1]; return (o ? [d, w] : [w, d]) as [number, number]; };

const m = (base: number, amp = 0.1): Cor => (x, y, z) => ruido(x, y, z, amp, base);
const mt = (base: number, amp = 0.1): Cor => (x, y, z) => (hash3(x, y, z) < 0.05 ? 0x7a3b1c : ruido(x, y, z, amp, base));
const box = (v: Vox, x: number, y: number, z: number, w: number, d: number, h: number, c: Cor, emis = false) => v.box(x, y, z, x + w, y + d, z + h, c, emis);

function carro(r: RecProp): Vox {
  const w = T23 * 3, d = T23 * 2, v = new Vox(w, d, 30), tipo = ['sedan', 'hatch', 'picape', 'van', 'jipe'][r.v % 5], pal = P.CARROS[(r.v >> 3) % P.CARROS.length], queimado = r.d > 0.88;
  const tinta: Cor = (x, y, z) => { if (queimado) return ruido(x, y, z, 0.12, 0x24201e); const h = hash3(x + r.sem, y, z); if (h < 0.05 + r.d * 0.08) return 0x7a3b1c; if (h < 0.1) return 0x2a211c; return ruido(x, y, z, 0.1, z > 12 ? pal[0] : pal[1]); };
  const x0 = 6, x1 = w - 6, y0 = 6, y1 = d - 6, vidro: Cor = (x, y, z) => (queimado ? 0x14110f : hash3(x, y, z) < 0.05 + r.d * 0.2 ? 0x5a6a70 : ruido(x, y, z, 0.1, 0x1f2a31));
  const sem = r.d > 0.6 && r.sem % 3 === 0;
  for (const [wx, wy] of [[x0 + 7, y0 - 1], [x1 - 9, y0 - 1], [x0 + 7, y1 - 2], [x1 - 9, y1 - 2]]) v.ell(wx + 3, wy + 1.5, sem ? 3.2 : 4.2, 4.6, 2, sem ? 3.2 : 4.2, 0x121212);
  v.box(x0, y0, 4, x1, y1, 13, tinta);
  if (tipo === 'picape') { v.box(x1 - 24, y0 + 1, 13, x1, y1 - 1, 24, tinta); v.box(x1 - 22, y0 + 2, 14, x1 - 2, y1 - 2, 23, vidro); v.box(x0, y0, 13, x0 + 26, y1, 14, tinta); v.box(x0, y0, 13, x0 + 26, y0 + 1, 19, tinta); v.box(x0, y1 - 1, 13, x0 + 26, y1, 19, tinta); v.box(x0, y0, 13, x0 + 1, y1, 19, tinta); v.box(x1 - 24, y0 + 1, 22, x1 - 6, y1 - 1, 25, tinta); }
  else if (tipo === 'van') { v.box(x0, y0 + 1, 13, x1 - 6, y1 - 1, 27, tinta); v.box(x1 - 14, y0 + 2, 15, x1 - 5, y1 - 2, 25, vidro); v.box(x0 + 2, y0, 19, x1 - 18, y0 + 1, 22, vidro); v.box(x1 - 6, y0 + 1, 13, x1, y1 - 1, 17, tinta); }
  else if (tipo === 'jipe') { v.box(x0 + 4, y0 + 1, 13, x1 - 12, y1 - 1, 15, tinta); v.box(x1 - 24, y0 + 2, 13, x1 - 8, y1 - 2, 24, vidro); v.box(x1 - 24, y0 + 2, 24, x1 - 8, y1 - 2, 26, tinta); v.box(x1 - 12, y0 + 1, 13, x1, y1 - 1, 17, tinta); for (let i = 0; i < 3; i++) v.box(x0 + 6 + i * 8, y0 + 3, 15, x0 + 8 + i * 8, y1 - 3, 22, 0x2a2a2a); }
  else { const c0 = tipo === 'hatch' ? 8 : 14, c1 = tipo === 'hatch' ? 12 : 14; v.box(x1 - 14, y0 + 1, 13, x1, y1 - 1, 16 - (r.d > 0.5 ? 1 : 0), tinta); v.box(x0, y0 + 1, 13, x0 + c1, y1 - 1, 15, tinta);
    v.box(x0 + c0, y0 + 2, 13, x1 - 14, y1 - 2, 25, (x, y, z) => { const borda = x < x0 + c0 + 2 || x > x1 - 16 || y < y0 + 4 || y > y1 - 4 || z > 23; return borda ? tinta(x, y, z) : vidro(x, y, z); }); v.box(x0 + c0, y0 + 2, 24, x1 - 14, y1 - 2, 26, tinta); }
  if (r.d > 0.5) { v.cut(x1 - 6, y0 + 3, 12, x1, y0 + 9, 20); }
  v.box(x1 - 1, y0 + 3, 7, x1 + 1, y0 + 8, 10, 0xb8b090); v.box(x1 - 1, y1 - 8, 7, x1 + 1, y1 - 3, 10, 0x4a2a24); v.box(x0 - 1, y0 + 3, 6, x0 + 1, y1 - 3, 9, 0x2a2a2c);
  if (tipo === 'jipe' && r.d < 0.3) v.box(x0 + 2, y0 + 3, 10, x0 + 8, y0 + 7, 14, 0x4a5a3a);
  return v;
}
function caminhao(r: RecProp): Vox {
  const w = T23 * 4, d = T23 * 2, v = new Vox(w, d, 38), x0 = 6, x1 = w - 6, y0 = 7, y1 = d - 7, cab = pal(r, 0);
  for (const wx of [x0 + 6, x0 + 28, x1 - 18]) for (const wy of [y0 - 1, y1 - 2]) v.ell(wx + 3, wy + 1.5, 5, 5.2, 2.2, 5, 0x121212);
  v.box(x0, y0, 6, x1, y1, 12, m(0x3a3a3c)); v.box(x1 - 20, y0, 12, x1, y1, 30, mt(cab)); v.box(x1 - 18, y0 + 1, 22, x1 - 2, y1 - 1, 29, m(0x1f2a31, 0.1));
  v.box(x0, y0, 12, x1 - 22, y1, 34, mt(r.v % 2 ? 0x6a6a5a : 0x8a8a84)); for (let z = 14; z < 34; z += 5) v.box(x0, y0, z, x1 - 22, y0 + 1, z + 1, 0x4a4a46); return v;
}
const pal = (r: RecProp, i: number) => P.CARROS[(r.v >> 2) % P.CARROS.length][i];

function container(r: RecProp): Vox {
  const v = new Vox(T23 * 3, T23, 40), cor = [0x6a3a2a, 0x2f4a5a, 0x5a6a3a, 0x8a6a2a][r.v % 4], c: Cor = (x, y, z) => { if (x % 6 === 0) return escurecer(ruido(x, y, z, 0.1, cor), 0.25); return hash3(x, y, z) < 0.06 ? 0x7a3b1c : ruido(x, y, z, 0.08, cor); };
  v.box(3, 3, 0, T23 * 3 - 3, T23 - 3, 38, c); v.box(3, 3, 38, T23 * 3 - 3, T23 - 3, 40, m(escurecer(cor, 0.2))); v.box(T23 * 3 - 4, 5, 4, T23 * 3 - 2, T23 - 5, 34, 0x2a2a2a); return v;
}
function barraca(r: RecProp): Vox {
  const v = new Vox(T23 * 2, T23 * 2, 30), cor = r.v % 3 === 0 ? 0x7a6a44 : r.v % 3 === 1 ? 0x5a5a48 : 0x6a4a3a, c: Cor = (x, y, z) => ruido(x, y, z, 0.1, cor);
  for (let z = 0; z < 26; z++) { const w = 20 - z * 0.7; v.box(23 - w, 5 + z * 0.25, z, 23 + w, 41 - z * 0.25, z + 1, c); }
  v.cut(18, 30, 0, 28, 44, 16); v.box(18, 30, 0, 19, 40, 17, 0x2a2018); v.box(27, 30, 0, 28, 40, 17, 0x2a2018); v.box(22, 4, 26, 24, 42, 29, 0x3a2a1e); return v;
}
function tanque(r: RecProp): Vox {
  const v = new Vox(T23 * 2, T23 * 2, 52), c: Cor = (x, y, z) => { if (z % 12 === 0) return 0x2a2a2a; return hash3(x, y, z) < 0.07 ? 0x7a3b1c : ruido(x, y, z, 0.08, r.v % 2 ? 0x8a8a84 : 0x6a6a64); };
  v.cil(23, 23, 0, 46, 17, 17, c); v.cil(23, 23, 46, 50, 15, 15, c); v.cil(23, 23, 50, 52, 6, 6, 0x4a4a46); for (let z = 4; z < 46; z += 12) v.cil(23, 23, z, z + 1, 17.6, 17.6, 0x2f2f2f); v.box(35, 23 - 2, 2, 39, 23 + 2, 40, 0x3a3a3a); return v;
}
function bunker(): Vox {
  const v = new Vox(T23 * 2, T23 * 2, 14), c: Cor = m(0x585c5e, 0.08); v.box(3, 3, 0, 43, 43, 5, c);
  for (let i = 0; i < 40; i += 4) { v.box(3 + i, 3, 5, 5 + i, 6, 6, (i / 4) % 2 ? 0xc9a52a : 0x1a1a18); v.box(3 + i, 40, 5, 5 + i, 43, 6, (i / 4) % 2 ? 0xc9a52a : 0x1a1a18); }
  v.ell(23, 23, 6, 15, 15, 4, m(0x6a7073, 0.08)); v.ell(23, 23, 9.5, 11, 11, 2.2, m(0x3d4346, 0.08));
  for (let k = 0; k < 3; k++) { const a = k * 2.094; for (let q = 0; q < 9; q++) v.box(Math.round(23 + Math.cos(a) * q), Math.round(23 + Math.sin(a) * q), 11, Math.round(23 + Math.cos(a) * q) + 2, Math.round(23 + Math.sin(a) * q) + 2, 13, 0xa2a8a4); }
  v.box(38, 7, 5, 41, 10, 9, 0x5dff9a, true); return v;
}
function helicoptero(): Vox {
  const v = new Vox(T23 * 3, T23 * 3, 34), c = mt(0x4a5238); v.ell(30, 34, 12, 18, 9, 9, c); v.box(40, 31, 8, 62, 37, 12, c); v.box(58, 30, 8, 66, 38, 20, c); v.ell(22, 34, 14, 7, 7, 6, m(0x1f2a31)); v.cut(18, 28, 8, 30, 40, 11);
  v.linha(8, 34, 22, 52, 34, 24, 1, 0x2a2a2a); v.linha(34, 8, 22, 34, 60, 24, 1, 0x3a3a3a); v.box(20, 24, 0, 44, 25, 2, 0x2a2a2a); v.box(20, 43, 0, 44, 44, 2, 0x2a2a2a); v.cil(30, 34, 20, 26, 2, 2, 0x2a2a2a); return v;
}

export function propVox(r: RecProp): Vox {
  const v = new Vox(...(((): [number, number, number] => { const [w, d, h] = PROP_DIM[r.n] ?? [1, 1, 50]; return [w * T23, d * T23, h]; })()));
  const c = (cor: number, a = 0.1) => m(cor, a), s = r.sem;
  switch (r.n) {
    case 'carro': return carro(r); case 'caminhao': return caminhao(r); case 'container': return container(r); case 'barraca': return barraca(r); case 'tanque': return tanque(r); case 'bunker': return bunker(); case 'helicoptero': return helicoptero();
    case 'geladeira': box(v, 5, 4, 0, 13, 14, 42, (x, y, z) => ruido(x, y, z, 0.07, z < 3 ? 0x6b6b66 : [0xc8cac0, 0xb8bcb0, 0xd0d0c4][r.v % 3])); box(v, 5, 4, 42, 13, 14, 2, 0xd8dad0); box(v, 17, 4, 25, 1, 14, 1, 0x55574f); box(v, 17, 15, 28, 2, 1, 10, 0x3a3c3a); box(v, 17, 15, 8, 2, 1, 14, 0x3a3c3a); for (let i = 0; i < 9; i++) v.set(17, 6 + (i * 5) % 11, 4 + (i * 7) % 36, 0x9a8a5a); break;
    case 'armario': box(v, 5, 4, 0, 13, 15, 42, (x, y, z) => (hash3(x, y, z) < 0.05 ? 0x7a3b1c : ruido(x, y, z, 0.08, [0x4f636a, 0x5e6455, 0x555a63][r.v % 3]))); box(v, 5, 4, 42, 13, 15, 1, 0x7a8a90); for (const y of [9, 14]) box(v, 17, y, 1, 1, 1, 40, 0x1b2024); for (const y of [6, 11, 16]) { for (let k = 0; k < 4; k++) box(v, 17, y, 33 + k * 2, 1, 3, 1, 0x1b2024); box(v, 17, y + 1, 20, 1, 1, 4, 0xc9c2a3); } break;
    case 'caixa': box(v, 4, 4, 0, 10, 9, 9, c(0x9a7449, 0.12)); box(v, 7, 10, 0, 11, 9, 11, c(0x9a7449, 0.12)); box(v, 9, 5, 9, 8, 7, 8, c(r.v % 2 ? 0x8a6540 : 0xa58055, 0.12)); for (const [x0, y0, z1] of [[4, 4, 9], [7, 10, 11], [9, 5, 17]]) box(v, x0, y0 + 3, z1 - 1, 10, 2, 1, 0xcdbd90); break;
    case 'ferramentas': box(v, 3, 5, 0, 17, 13, 12, (x, y, z) => ruido(x, y, z, 0.09, z < 2 ? 0x2a2a2a : 0x8f2f22)); box(v, 3, 5, 12, 17, 13, 2, 0x6f241a); box(v, 8, 8, 14, 7, 1, 3, 0x7b7e80); box(v, 8, 14, 14, 7, 1, 3, 0x7b7e80); box(v, 8, 8, 17, 7, 7, 1, 0x7b7e80); break;
    case 'barril': { const cor = [0x7a5f33, 0x6a6a2e, 0x3a5a7a, 0x8a3a2a][r.v % 4]; v.ell(11.5, 11.5, 12.5, 6.5, 6.5, 12.5, (x, y, z) => { const h = hash3(x, y, z); if ((z > 4 && z < 8) || (z > 15 && z < 19)) return 0x9a9a8a; if (h < 0.1) return 0x7a3b1c; return ruido(x, y, z, 0.09, cor); }); box(v, 8, 8, 24, 7, 7, 2, 0x55503a); break; }
    case 'tambor_toxico': v.ell(11.5, 11.5, 12.5, 6.5, 6.5, 12.5, (x, y, z) => ((z > 8 && z < 13) ? 0xd8c030 : ruido(x, y, z, 0.09, 0x6a7a2e))); v.ell(11.5, 11.5, 22, 3.5, 3.5, 3, 0x9aff4a, true); box(v, 7, 7, 24, 9, 9, 1, 0x2a2a1a); break;
    case 'cama': box(v, 3, 2, 0, 17, 19, 4, 0x3a2c1e); box(v, 4, 3, 4, 15, 17, 4, (x, y, z) => ruido(x, y, z, 0.1, 0xb8b09a)); box(v, 4, 8, 8, 15, 12, 2, (x, y, z) => ruido(x, y, z, 0.12, [0x6e5f43, 0x56646f, 0x77574f][r.v % 3])); box(v, 5, 3, 8, 12, 5, 3, 0xd0c8b0); box(v, 3, 2, 4, 17, 1, 9, 0x3a2c1e); break;
    case 'mesa': box(v, 3, 3, 14, 17, 17, 3, c(0x6a4a2a)); for (const [x, y] of [[4, 4], [18, 4], [4, 18], [18, 18]]) box(v, x, y, 0, 1, 1, 14, 0x3a2a1a); v.ell(9, 10, 18, 2.2, 2.2, 1, 0xc9c4b2); if (r.v % 2) box(v, 13, 12, 17, 4, 4, 2, 0x2c4a5a); break;
    case 'cadeira': box(v, 6, 6, 0, 1, 1, 10, 0x3a2a1a); box(v, 15, 6, 0, 1, 1, 10, 0x3a2a1a); box(v, 6, 15, 0, 1, 1, 10, 0x3a2a1a); box(v, 15, 15, 0, 1, 1, 10, 0x3a2a1a); box(v, 5, 5, 10, 12, 12, 2, c(0x6a4a2a)); box(v, 5, 5, 12, 2, 12, 12, c(0x6a4a2a)); break;
    case 'sofa': box(v, 3, 3, 0, 17, 17, 9, c([0x5a4a3a, 0x4a5a4a, 0x5a3a3a][r.v % 3], 0.1)); box(v, 3, 3, 9, 4, 17, 8, c([0x5a4a3a, 0x4a5a4a, 0x5a3a3a][r.v % 3], 0.1)); box(v, 3, 3, 9, 17, 3, 5, c(0x4a3a2a)); box(v, 3, 17, 9, 17, 3, 5, c(0x4a3a2a)); break;
    case 'estante': box(v, 4, 3, 0, 14, 17, 48, c(0x5a4028)); for (let z = 8; z < 46; z += 10) { box(v, 5, 4, z, 12, 15, 1, 0x3a2818); for (let k = 0; k < 6; k++) box(v, 6 + (k % 2), 4 + k * 2, z + 1, 3, 2, 6 + (hash3(k, z, s) * 4) | 0, [0x7a3a2a, 0x3a5a7a, 0x6a6a3a, 0x5a3a6a, 0x8a7a4a][(k + z) % 5]); } break;
    case 'prateleira': for (const [x, y] of [[4, 3], [4, 19], [18, 3], [18, 19]]) box(v, x, y, 0, 1, 1, 46, 0x5a5d60); for (let z = 6; z < 44; z += 12) { box(v, 4, 3, z, 15, 17, 1, 0x6a6d70); for (let k = 0; k < 4; k++) box(v, 6 + (k % 2) * 3, 5 + k * 3, z + 1, 4, 3, 5 + (hash3(k, z, s + 3) * 4 | 0), [0x8a3a2a, 0x3a5a7a, 0x9a8a4a, 0x5a7a4a][(k + z) % 4]); } break;
    case 'fogao': box(v, 4, 4, 0, 15, 15, 20, c(0xb8b4a4, 0.07)); box(v, 4, 4, 20, 15, 15, 2, 0x2a2a2a); for (const [x, y] of [[7, 7], [7, 13], [12, 7], [12, 13]]) v.cil(x, y, 22, 23, 2.2, 2.2, 0x1a1a1a); box(v, 19, 7, 8, 1, 9, 6, 0x3a3a3a); break;
    case 'pia': box(v, 4, 4, 0, 15, 15, 20, c(0x7a7a72)); box(v, 6, 6, 20, 11, 11, 2, c(0xb8bcb0)); box(v, 15, 11, 22, 1, 1, 6, 0x9a9a92); break;
    case 'vaso': box(v, 6, 6, 0, 10, 12, 10, c(0xd0d0c4)); box(v, 4, 6, 10, 5, 12, 14, c(0xd0d0c4)); box(v, 8, 7, 10, 6, 10, 1, 0x9a9a92); break;
    case 'tv': box(v, 5, 4, 0, 12, 15, 14, c(0x4a3a2a)); box(v, 6, 5, 14, 3, 13, 12, 0x1a1a1a); box(v, 9, 6, 15, 1, 11, 10, mix(0x1a2a2a, 0x2a3a3a, 0.5)); break;
    case 'guarda_roupa': box(v, 3, 4, 0, 16, 16, 50, c(0x5a4028)); box(v, 19, 11, 1, 1, 1, 46, 0x2a1a0e); box(v, 19, 9, 22, 1, 1, 4, 0xc9b25a); box(v, 19, 12, 22, 1, 1, 4, 0xc9b25a); break;
    case 'mala': box(v, 4, 4, 0, 14, 12, 12, c([0x5a3a2a, 0x3a4a5a, 0x4a4a3a][r.v % 3])); box(v, 4, 9, 12, 14, 2, 1, 0x9a8a5a); box(v, 10, 4, 5, 1, 1, 2, 0xc9b25a); break;
    case 'lixeira': v.cil(11.5, 11.5, 0, 20, 5.5, 5.5, mt(0x4a4d50)); v.cil(11.5, 11.5, 20, 22, 6.2, 6.2, 0x3a3d40); for (let k = 0; k < 4; k++) v.box(8 + k * 2, 8, 22, 2, 2, 2 + (hash3(k, s, 1) * 3 | 0), [0x8a8a7a, 0x6a4a3a, 0x4a5a4a, 0x9a9a8a][k]); break;
    case 'balcao': box(v, 2, 4, 0, 19, 15, 22, c(0x6a4a2a)); box(v, 2, 4, 22, 19, 15, 2, c(0x8a8478)); box(v, 12, 8, 24, 5, 5, 4, 0x2a2a2a); box(v, 13, 9, 28, 3, 3, 1, 0x4a6a6a); break;
    case 'bancada': box(v, 2, 3, 14, 19, 17, 3, c(0x6a4a2a)); for (const [x, y] of [[3, 4], [19, 4], [3, 18], [19, 18]]) box(v, x, y, 0, 2, 2, 14, 0x4a4a46); box(v, 15, 4, 17, 4, 4, 5, 0x6a6e72); box(v, 5, 8, 17, 8, 2, 1, 0x8a8a84); box(v, 5, 12, 17, 5, 3, 3, 0xb5471f); box(v, 14, 11, 17, 3, 6, 2, 0x4a4a46); break;
    case 'pneus': for (let k = 0; k < 3; k++) v.cil(11.5, 11.5, k * 6, k * 6 + 6, 7 - (k % 2) * 0.5, 7 - (k % 2) * 0.5, (x, y, z) => ruido(x, y, z, 0.08, 0x1d1d1f)); v.cil(11.5, 11.5, 0, 18, 3, 3, 0x0e0e0f); break;
    case 'poste': v.cil(11.5, 11.5, 0, 66, 1.6, 1.6, mt(0x4a4d50)); box(v, 8, 10, 64, 10, 3, 2, 0x4a4d50); box(v, 6, 9, 63, 5, 5, 2, r.v % 2 ? 0xffd890 : 0x3a3a3a, r.v % 2 === 1); v.cil(11.5, 11.5, 0, 4, 3, 3, 0x3a3d40); if (r.d > 0.5) v.cut(6, 8, 60, 10, 15, 66); break;
    case 'placa': v.cil(11.5, 11.5, 0, 44, 1, 1, 0x5a5d60); box(v, 4, 10, 36, 15, 2, 14, (x, y, z) => ((x + z) % 5 === 0 ? 0xc9a52a : 0xd8c040)); box(v, 8, 12, 40, 7, 1, 2, 0x1a1a1a); box(v, 11, 12, 42, 1, 1, 5, 0x1a1a1a); break;
    case 'cerca': box(v, 0, 10, 0, 23, 1, 18, (x, y, z) => ((x + z) % 3 === 0 && z > 2 ? 0x8a8a84 : -1)); for (const x of [1, 11, 21]) box(v, x, 9, 0, 2, 3, 22, 0x4a4a46); box(v, 0, 10, 20, 23, 1, 2, 0x6a6a64); break;
    case 'hidrante': v.cil(11.5, 11.5, 0, 12, 3.2, 3.2, mt(0xa8322a)); v.cil(11.5, 11.5, 12, 15, 4, 4, 0xa8322a); box(v, 6, 10, 7, 12, 3, 3, 0xa8322a); break;
    case 'banco': box(v, 2, 6, 6, 19, 11, 2, c(0x6a4a2a)); box(v, 2, 6, 8, 19, 2, 8, c(0x6a4a2a)); for (const x of [3, 18]) box(v, x, 6, 0, 2, 11, 7, 0x3a3a3c); break;
    case 'carrinho': box(v, 5, 5, 6, 13, 13, 1, 0x8a8a84); for (let k = 0; k < 4; k++) { box(v, 5, 5 + k * 4, 6, 13, 1, 10, (x, y, z) => ((x + z) % 3 === 0 ? 0x8a8a84 : -1)); } for (const [x, y] of [[5, 5], [15, 5], [5, 15], [15, 15]]) box(v, x, y, 0, 2, 2, 6, 0x2a2a2a); break;
    case 'caixote_militar': box(v, 3, 4, 0, 17, 15, 14, c(0x4a5238, 0.1)); box(v, 3, 4, 14, 17, 15, 2, c(0x3a4228)); box(v, 8, 4, 8, 7, 1, 3, 0xc9b25a); box(v, 3, 9, 0, 17, 1, 14, 0x2a3220); break;
    case 'saco_areia': for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) v.ell(5 + k * 4.4 + (j % 2) * 2, 9 + j * 3, 3 + j * 4, 3.4, 2.8, 2.4, (x, y, z) => ruido(x, y, z, 0.12, 0x9a8a5a)); break;
    case 'barricada': for (let k = 0; k < 5; k++) box(v, 2, 4 + k * 3, 3 + (k % 2) * 2, 19, 2, 4, c([0x6a4a2a, 0x5a3a1e, 0x7a5a3a][k % 3], 0.15)); box(v, 4, 4, 0, 2, 15, 20, 0x4a3a2a); box(v, 17, 4, 0, 2, 15, 20, 0x4a3a2a); break;
    case 'bomba': box(v, 6, 6, 0, 10, 10, 36, c([0xb8b4a4, 0xa8322a][r.v % 2])); box(v, 7, 7, 26, 8, 8, 8, 0x1f2a31); box(v, 16, 8, 14, 3, 2, 10, 0x2a2a2a); box(v, 5, 5, 36, 12, 12, 3, 0x3a3a3c); break;
    case 'entulho': for (let k = 0; k < 12; k++) { const x = 3 + hash3(k, s, 1) * 16, y = 3 + hash3(k, s, 2) * 16, z = 2 + hash3(k, s, 3) * 6; v.ell(x, y, z, 2 + hash3(k, s, 4) * 3, 2 + hash3(k, s, 5) * 3, 2 + hash3(k, s, 6) * 3, (xx, yy, zz) => (hash3(xx, yy, zz) < 0.1 ? 0x7a3b1c : ruido(xx, yy, zz, 0.16, 0x7a7870))); } break;
    case 'bau': box(v, 3, 5, 0, 17, 13, 12, c(0x6a4a2a)); box(v, 3, 5, 12, 17, 13, 3, c(0x5a3a1e)); box(v, 2, 5, 4, 19, 1, 8, 0x3a3a3c); box(v, 2, 17, 4, 19, 1, 8, 0x3a3a3c); box(v, 19, 10, 8, 1, 3, 3, 0xc9b25a); break;
    case 'fogueira': for (let k = 0; k < 6; k++) { const a = k * 1.047; v.linha(11.5 + Math.cos(a) * 6, 11.5 + Math.sin(a) * 6, 1, 11.5 + Math.cos(a) * 1.5, 11.5 + Math.sin(a) * 1.5, 5, 2, c(0x4a3a2a)); } v.ell(11.5, 11.5, 6, 3, 3, 4, 0xff8a20, true); v.ell(11.5, 11.5, 8, 1.8, 1.8, 4, 0xffe070, true); for (let k = 0; k < 8; k++) v.ell(11.5 + Math.cos(k * 0.8) * 8, 11.5 + Math.sin(k * 0.8) * 8, 1, 2, 2, 1.6, 0x6a6a64); break;
    case 'saco_dormir': v.ell(11.5, 11.5, 3, 4.5, 9, 3, c([0x5a6a4a, 0x6a4a3a, 0x4a5a6a][r.v % 3])); box(v, 9, 3, 4, 6, 4, 2, 0xd0c8b0); break;
    case 'bandeira': v.cil(11.5, 11.5, 0, 62, 1, 1, 0x5a4a3a); box(v, 12, 11, 40, 14, 1, 20, (x, y, z) => ruido(x, y, z, 0.12, [0xb5471f, 0xa8322a, 0x2a2a2a, 0xb6ff5a][r.v % 4])); box(v, 16, 11, 46, 5, 1, 5, 0x1a1a1a); break;
    case 'totem': v.cil(11.5, 11.5, 0, 50, 2, 2, c(0x5a4a3a)); for (let k = 0; k < 3; k++) { v.ell(11.5, 11.5, 14 + k * 12, 4, 3.6, 4, 0xd8d0b8); v.set(13, 9, 15 + k * 12, 0x1a1410); v.set(13, 13, 15 + k * 12, 0x1a1410); } v.ell(11.5, 11.5, 52, 2, 2, 2, 0xb6ff5a, true); break;
    case 'tanque_agua': for (const [x, y] of [[5, 5], [17, 5], [5, 17], [17, 17]]) box(v, x, y, 0, 2, 2, 20, 0x5a5d60); v.cil(11.5, 11.5, 20, 40, 9, 9, mt(0x3a5a7a)); v.cil(11.5, 11.5, 40, 42, 7, 7, 0x2a3a4a); box(v, 18, 10, 22, 4, 3, 2, 0x2a2a2a); break;
    case 'gerador': box(v, 3, 5, 0, 17, 13, 14, mt(0x4a5238)); box(v, 5, 6, 14, 6, 11, 4, 0x2a2a2a); box(v, 15, 6, 3, 3, 11, 8, 0x1a1a1a); box(v, 8, 3, 8, 6, 2, 3, 0xc9a52a); break;
    case 'antena': v.cil(11.5, 11.5, 0, 6, 4, 4, 0x4a4d50); for (let z = 6; z < 68; z += 4) { v.linha(8 + (z / 68) * 3, 8, z, 15 - (z / 68) * 3, 15, z + 4, 1, 0x7a7d80); v.linha(15 - (z / 68) * 3, 8, z, 8 + (z / 68) * 3, 15, z + 4, 1, 0x7a7d80); } v.set(11, 11, 70, 0xff3a1a, true); break;
    case 'horta': box(v, 2, 2, 0, 19, 19, 4, c(0x4a3624, 0.15)); for (let k = 0; k < 9; k++) { const x = 5 + (k % 3) * 6, y = 5 + ((k / 3) | 0) * 6, h = 2 + r.v * 3; v.linha(x, y, 4, x, y, 4 + h, 1, 0x5a7a3a); if (r.v > 1) v.ell(x, y, 4 + h, 2, 2, 1.6, (xx, yy, zz) => ruido(xx, yy, zz, 0.12, [0x8a6a2a, 0xa83a2a, 0x7a8a3a][k % 3])); } break;
    case 'lixo': for (let k = 0; k < 10; k++) { const x = 3 + hash3(k, s, 1) * 16, y = 3 + hash3(k, s, 2) * 16; v.ell(x, y, 2, 2.4 + hash3(k, s, 3) * 2, 2.4, 1.6, [0x6a6a5a, 0x4a4a3a, 0x8a8a7a, 0x5a4a3a][k % 4]); } break;
    case 'ponte_radio': box(v, 4, 4, 0, 15, 15, 16, mt(0x4a5238)); box(v, 6, 5, 16, 11, 13, 6, 0x2a2a2a); v.set(14, 6, 19, 0x5dff9a, true); v.linha(8, 8, 22, 8, 8, 40, 1, 0x7a7d80); break;
    default: box(v, 4, 4, 0, 15, 15, 20, c(0x7a6a5a));
  }
  return v;
}

// ---------------------------------------------------------------- estruturas (paredes, janelas, portas, ruínas)
export const ALTA = 54, BAIXA = 13;
function paleta(estilo: number, sem: number): Cor {
  if (estilo === 0) { const b = [0x5a6563, 0x6b5a45, 0x58604a][sem % 3]; return (x, y, z) => { if (z % 5 === 0) return 0x1a1613; return ruido(x, y, z, 0.1, hash3(x >> 2, y >> 2, z) < 0.08 ? 0x2a2218 : mix(b, 0x000000, (1 - Math.min(1, z / 40)) * 0.35)); }; }
  if (estilo === 1) return (x, y, z) => { const c = Math.floor(z / 3), u = x + y + (c % 2) * 4; if (z % 3 === 0 || u % 8 === 0) return 0x8a8578; const f = hash3(Math.floor(u / 8), c, 3); return ruido(x, y, z, 0.07, mix(f < 0.5 ? 0x6e4636 : 0x5d3b2e, 0x14100d, (1 - Math.min(1, z / 44)) * 0.5)); };
  if (estilo === 3) return (x, y, z) => { if ((x + y) % 4 === 0) return 0x2a2c2e; return hash3(x, y, z) < 0.06 ? 0x7a3b1c : ruido(x, y, z, 0.08, mix(0x7a7d7e, 0x14110f, (1 - Math.min(1, z / 44)) * 0.4)); };
  return (x, y, z) => { if ((x + y) % 11 === 0 || z % 14 === 0) return 0x2c2e2e; return ruido(x, y, z, 0.09, mix(0x6a6b66, 0x111210, (1 - Math.min(1, z / 40)) * 0.45)); };
}
export function estrVox(r: RecEstr): Vox {
  const N = T23, alto = r.alto === 'a' ? ALTA : BAIXA;
  if (r.n === 'porta' || r.n === 'portaA') {
    const v = new Vox(N, N, ALTA), madeira: Cor = m(0x6a4527);
    box(v, 0, 5, 0, 3, 13, ALTA - 1, 0x4a3a2a); box(v, N - 3, 5, 0, 3, 13, ALTA - 1, 0x4a3a2a); box(v, 0, 5, 44, N, 13, ALTA - 45, 0x4a3a2a); box(v, 0, 5, ALTA - 1, N, 13, 1, 0x77766d);
    if (r.n === 'porta') { box(v, 3, 10, 0, N - 6, 3, 44, madeira); for (let x = 6; x < N - 3; x += 5) box(v, x, 13, 0, 1, 1, 44, 0x2a1a0e); box(v, N - 6, 13, 20, 2, 1, 3, 0xc9b25a); } else { box(v, 3, 13, 0, 3, N - 13, 44, madeira); box(v, 5, N - 1, 20, 1, 1, 3, 0xc9b25a); }
    return v;
  }
  const v = new Vox(N, N, alto), pal = paleta(r.estilo, r.sem);
  if (r.n === 'ruina') {
    const h = 22 + (r.sem % 5) * 6; box(v, 0, 0, 0, N, N, h, pal); for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) { const cut = Math.floor(hash3(x >> 1, y >> 1, r.sem) * 14); for (let z = h - cut; z < h; z++) v.clear(x, y, z); } box(v, 0, 0, 0, N, N, 2, 0x161512); return v;
  }
  box(v, 0, 0, 0, N, N, alto - 1, pal); box(v, 0, 0, alto - 1, N, N, 1, m(0x77766d, 0.08)); box(v, 0, 0, alto - 3, N, 1, 2, 0x55544e); box(v, 0, 0, 0, N, N, 2, 0x161512);
  if (r.n === 'janela' && alto > 20) {
    const z0 = 20, z1 = 42, quadro = 0x3a2f24, vidro: Cor = (x, y, z) => (z > z1 - 5 && (x + y) % 5 < 2 ? 0x44606b : ruido(x, y, z, 0.1, 0x1b2830));
    box(v, N - 2, 5, z0 - 2, 2, 13, z1 - z0 + 4, quadro); box(v, 5, N - 2, z0 - 2, 13, 2, z1 - z0 + 4, quadro); box(v, N - 2, 7, z0, 2, 9, z1 - z0, vidro); box(v, 7, N - 2, z0, 9, 2, z1 - z0, vidro);
    box(v, N - 2, 11, z0, 2, 1, z1 - z0, quadro); box(v, 11, N - 2, z0, 1, 2, z1 - z0, quadro); box(v, N - 2, 7, 31, 2, 9, 1, quadro); box(v, 7, N - 2, 31, 9, 2, 1, quadro);
  }
  return v;
}
