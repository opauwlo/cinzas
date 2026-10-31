// Modelos em voxel: personagens (8 direções x 4 quadros) e props. Tudo passa pelo mesmo renderer (voxel.ts).
import { Vox, renderVox, mix, hash3, tombar, tombarLado, type Render, type Cor } from './voxel';

export type Arma = 'nenhuma' | 'melee' | 'pistola';
export const DIRS = 8; // 0=E,1=SE,2=S,3=SW,4=W,5=NW,6=N,7=NE  (direção na tela)
export const dirYaw = (d: number) => (d * Math.PI) / 4; // 0 = direita, 90° = para baixo (frente da câmera)

const P = {
  jaqueta: 0x4d5339, jaquetaEsc: 0x373c28, calca: 0x3c3d40, bota: 0x1f1b17, pele: 0xb38966, peleEsc: 0x8f6b4d, cabelo: 0x2b2118,
  colete: 0x6a5838, correia: 0x2a2820, mochila: 0x5c4a33, lenco: 0xb04a1f, aco: 0x6c6f70, ferrugem: 0x7a3b1c,
  irPele: 0x8b9878, irPeleEsc: 0x66735a, irRoupa: 0x5b4f44, irRoupaEsc: 0x403830, brilho: 0xc8ff5a,
};
const ruido = (x: number, y: number, z: number, amp: number, base: number) => { const t = (hash3(x, y, z) - 0.5) * 2 * amp; return t > 0 ? mix(base, 0xffffff, t) : mix(base, 0x000000, -t); };

function linha(v: Vox, x0: number, y: number, z0: number, x1: number, z1: number, c: Cor, esp = 1) {
  const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 2);
  for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(x0 + (x1 - x0) * t), z = Math.round(z0 + (z1 - z0) * t); v.box(x, y, z, x + esp, y + esp, z + esp, c); }
}

export function humano(frame: number, arma: Arma, tipo: 'sobrevivente' | 'irradiado'): Vox {
  const ir = tipo === 'irradiado';
  const v = new Vox(28, 18, 48), ph = (frame * Math.PI) / 2, sw = Math.sin(ph) * (ir ? 0.34 : 0.55), pass = frame % 2 === 1;
  const dz = pass ? 0 : -1, hipZ = 18 + dz, lean = ir ? 0.3 : 0.04;
  const pele = ir ? P.irPele : P.pele, peleEsc = ir ? P.irPeleEsc : P.peleEsc;
  const calca: Cor = (x, y, z) => ruido(x, y, z, 0.1, ir ? P.irRoupaEsc : P.calca);
  const jaq: Cor = (x, y, z) => { if (ir && hash3(x, y, z) < 0.16) return peleEsc; return ruido(x, y, z, 0.1, ir ? P.irRoupa : P.jaqueta); };
  // pernas (pivô no quadril): calça, joelho, bota e pé
  for (const [y0, y1, a] of [[4, 8, sw], [10, 14, -sw]] as [number, number, number][]) {
    v.rbox(7, y0, 4 + dz, 11, y1, hipZ, 9, hipZ, a, (x, y, z) => (z < 8 + dz ? P.bota : (z > 9 + dz && z < 12 + dz && x > 9 ? mix(P.calca, 0x555555, 0.5) : calca(x, y, z))));
    v.rbox(7, y0, 0 + dz, 13, y1, 4 + dz, 9, hipZ, a, P.bota);
  }
  // tronco (inclinado nos irradiados)
  const tz = hipZ + 13;
  v.rbox(6, 4, hipZ, 12, 14, tz, 9, hipZ, -lean, (x, y, z) => {
    if (z < hipZ + 2) return P.correia; // cinto
    if (!ir && x >= 11 && Math.abs((y - 9) - (z - hipZ - 6) * 0.7) < 1.2) return P.correia; // correia do colete
    if (!ir && z > hipZ + 3 && z < hipZ + 9 && x >= 10) return ruido(x, y, z, 0.08, P.colete);
    return jaq(x, y, z);
  });
  // mochila
  v.rbox(2, 5, hipZ + 3, 6, 13, hipZ + 14, 9, hipZ, -lean, (x, y, z) => ruido(x, y, z, 0.12, z > hipZ + 11 ? 0x4a5a3a : P.mochila));
  // pescoço e cabeça
  const ho = ir ? 3 : 0, hz = hipZ + 14 - (ir ? 2 : 0);
  v.box(8 + ho, 7, tz - 1, 10 + ho, 11, tz + 2 - (ir ? 2 : 0), pele);
  v.ell(9.5 + ho, 9, hz + 4.3, 3.8, 3.5, 4.3, (x, y, z) => {
    const topo = z > hz + 7, tras = x < 9 + ho, frente = x >= 11 + ho - 0.5;
    if (ir) { if (topo || tras) return hash3(x, y, z) < 0.5 ? 0x3a3f2a : P.irPeleEsc; return ruido(x, y, z, 0.08, pele); }
    if (topo || tras) return P.cabelo; if (frente && z < hz + 3) return peleEsc; return ruido(x, y, z, 0.07, pele);
  });
  if (!ir) { // capuz e lenço
    v.ell(9 + ho, 9, hz + 4.6, 4.2, 4.1, 4.7, (x, y, z) => ruido(x, y, z, 0.1, P.jaqueta));
    v.cut(11 + ho, 6, hz + 1, 14, 12, hz + 7); v.box(11 + ho, 7, hz + 1, 12 + ho, 11, hz + 7, (x, y, z) => (z < hz + 3 ? P.lenco : pele));
    v.box(7, 6, tz - 1, 12, 12, tz + 1, P.lenco);
  }
  // olhos
  const ex = 11 + ho + (ir ? 1 : 0);
  v.set(ex, 7, hz + 4, ir ? P.brilho : 0x15110d, ir); v.set(ex, 11, hz + 4, ir ? P.brilho : 0x15110d, ir);
  if (ir) { v.set(ex, 9, hz + 2, 0x2a1810); for (let k = 0; k < 7; k++) v.set(8 + ho + (k % 3), 6 + (k % 5), hz + 7 - (k % 3), P.brilho, true); }
  // braços (pivô no ombro)
  const sz = tz - 1.5, braco: Cor = (x, y, z) => (z < sz - 10 ? (ir ? pele : 0x2a2823) : jaq(x, y, z));
  const aE = arma === 'nenhuma' ? (ir ? 1.25 + Math.sin(ph) * 0.12 : -sw * 0.8) : (arma === 'pistola' ? 0.95 : -sw * 0.5);
  const aD = arma === 'nenhuma' ? (ir ? 1.2 - Math.sin(ph) * 0.12 : sw * 0.8) : (arma === 'pistola' ? 1.25 : 1.4);
  v.rbox(8, 2, sz - 13, 11, 4, sz + 1, 9.5, sz, aE, braco); v.rbox(8, 14, sz - 13, 11, 16, sz + 1, 9.5, sz, aD, braco);
  const mao = (a: number, y: number) => [9.5 + Math.sin(a) * 12.5, y, sz - Math.cos(a) * 12.5] as const;
  if (arma !== 'nenhuma') {
    const [hx, hy, hzz] = mao(aD, 14.5);
    if (arma === 'melee') { linha(v, Math.round(hx) - 1, 14, Math.round(hzz) + 1, Math.round(hx) + 9, Math.round(hzz) - 5, P.aco, 2); v.box(Math.round(hx) + 9, 14, Math.round(hzz) - 7, Math.round(hx) + 12, 16, Math.round(hzz) - 5, P.ferrugem); }
    else { v.box(Math.round(hx), 14, Math.round(hzz) - 1, Math.round(hx) + 6, 16, Math.round(hzz) + 2, 0x25282b); v.box(Math.round(hx), 14, Math.round(hzz) - 4, Math.round(hx) + 2, 16, Math.round(hzz) - 1, 0x1a1c1e); }
    void hy;
  }
  return v;
}

export function cao(frame: number): Vox {
  const v = new Vox(34, 14, 24), ph = (frame * Math.PI) / 2, s = Math.sin(ph) * 0.7, bob = frame % 2 === 0 ? 0 : 1;
  const pelo: Cor = (x, y, z) => { const r = hash3(x, y, z); if (r < 0.08) return 0x8a5f58; return ruido(x, y, z, 0.12, z < 8 ? 0x4a3a2e : 0x5d4a3a); };
  for (const [x, y, a] of [[21, 3, s], [21, 9, -s], [7, 3, -s], [7, 9, s]] as [number, number, number][]) { v.rbox(x, y, 0, x + 3, y + 2, 9 + bob, x + 1.5, 9 + bob, a, 0x3f3025); v.rbox(x, y, 0, x + 4, y + 2, 2, x + 1.5, 9 + bob, a, 0x2a2018); }
  v.ell(14, 7, 11 + bob, 10, 3.6, 4.4, pelo); v.ell(19, 7, 10.5 + bob, 5, 4, 4.6, pelo);
  for (let x = 11; x < 22; x += 2) for (let z = 9; z < 13; z += 2) { v.set(x, 3, z + bob, 0x7a6b58); v.set(x, 10, z + bob, 0x7a6b58); } // costelas
  v.ell(27, 7, 14 + bob, 3.6, 2.8, 3, pelo); v.box(29, 6, 12 + bob, 33, 9, 14 + bob, (x, y, z) => ruido(x, y, z, 0.1, 0x3d2f25)); v.box(29, 6, 11 + bob, 33, 9, 12 + bob, 0x6a3b3b);
  v.set(32, 6, 13 + bob, 0xe8e2cc); v.set(32, 8, 13 + bob, 0xe8e2cc); v.set(33, 7, 14 + bob, 0x100c0a);
  v.box(26, 3, 16 + bob, 28, 5, 19 + bob, 0x3d2f25); v.box(26, 9, 16 + bob, 28, 11, 19 + bob, 0x3d2f25);
  v.set(28, 5, 15 + bob, 0xff3a1a, true); v.set(28, 9, 15 + bob, 0xff3a1a, true);
  linha(v, 5, 7, 13 + bob, 1, 18 + bob, 0x3d2f25, 2);
  return v;
}
export function rato(frame: number): Vox {
  const v = new Vox(22, 9, 9), s = frame % 2 ? 1 : -1;
  v.ell(10, 4.5, 3.6, 5.2, 2.4, 2.4, (x, y, z) => ruido(x, y, z, 0.14, 0x4f4036)); v.ell(15.5, 4.5, 3.4, 2.4, 1.7, 1.7, 0x5d4c40); v.box(17, 4, 2, 20, 5, 4, 0x5d4c40); v.set(19, 4, 3, 0xd8a0a0);
  v.box(14, 2, 5, 16, 3, 7, 0x6a5748); v.box(14, 6, 5, 16, 7, 7, 0x6a5748); v.set(17, 3, 4, 0xff3a1a, true); v.set(17, 6, 4, 0xff3a1a, true);
  for (const [x, y, a] of [[12 + s, 2, 1], [12 - s, 7, 1], [6 - s, 2, 1], [6 + s, 7, 1]] as [number, number, number][]) { void a; v.box(x, y, 0, x + 2, y + 1, 2, 0x3a2e26); }
  linha(v, 5, 4, 2, 0, 2 + (s > 0 ? 1 : 0), 0xb08a7c, 1);
  return v;
}

// ------------------------------------------------------------ props (grid 23 voxels por tile; modelo alinhado ao eixo X do grid)
const T23 = 23;
export function carro(cor: number, quebrado: boolean): Vox {
  const w = T23 * 3, d = T23 * 2, v = new Vox(w, d, 30);
  const pin = [[0x7d3a2a, 0x5a2a20], [0x3f5566, 0x2a3a46], [0x92835c, 0x6d6143]][cor % 3];
  const tinta: Cor = (x, y, z) => { const r = hash3(x, y, z); if (r < 0.06) return P.ferrugem; if (r < 0.1) return 0x2a211c; return ruido(x, y, z, 0.1, z > 12 ? pin[0] : pin[1]); };
  const x0 = 6, x1 = w - 6, y0 = 6, y1 = d - 6;
  for (const [wx, wy] of [[x0 + 7, y0 - 1], [x1 - 9, y0 - 1], [x0 + 7, y1 - 2], [x1 - 9, y1 - 2]]) v.ell(wx + 3, wy + 1.5, 4.2, 4.6, 2, 4.2, 0x121212);
  v.box(x0, y0, 4, x1, y1, 13, tinta); v.box(x1 - 14, y0 + 1, 13, x1, y1 - 1, 16 - (quebrado ? 1 : 0), tinta); v.box(x0, y0 + 1, 13, x0 + 14, y1 - 1, 15, tinta);
  v.box(x0 + 14, y0 + 2, 13, x1 - 14, y1 - 2, 25, (x, y, z) => {
    const borda = x < x0 + 16 || x > x1 - 16 || y < y0 + 4 || y > y1 - 4 || z > 23; if (borda) return tinta(x, y, z);
    return hash3(x, y, z) < 0.05 ? 0x5a6a70 : ruido(x, y, z, 0.1, 0x1f2a31); });
  v.box(x0 + 14, y0 + 2, 24, x1 - 14, y1 - 2, 26, tinta);
  if (quebrado) { v.cut(x1 - 6, y0 + 3, 12, x1, y0 + 9, 20); v.box(x1 - 14, y0 + 2, 13, x1 - 4, y1 - 2, 14, 0x1b1714); }
  v.box(x1 - 1, y0 + 3, 7, x1 + 1, y0 + 8, 10, 0xb8b090); v.box(x1 - 1, y1 - 8, 7, x1 + 1, y1 - 3, 10, 0x4a2a24);
  v.box(x0 - 1, y0 + 3, 6, x0 + 1, y1 - 3, 9, 0x2a2a2c);
  return v;
}
export function geladeira(): Vox {
  const v = new Vox(T23, T23, 46); const c: Cor = (x, y, z) => ruido(x, y, z, 0.07, z < 3 ? 0x6b6b66 : 0xc8cac0);
  v.box(5, 4, 0, 18, 18, 42, c); v.box(5, 4, 42, 18, 18, 44, 0xd8dad0);
  v.box(17, 4, 25, 18, 18, 26, 0x55574f); v.box(17, 15, 28, 19, 16, 38, 0x3a3c3a); v.box(17, 15, 8, 19, 16, 22, 0x3a3c3a);
  for (let i = 0; i < 9; i++) v.set(17, 6 + (i * 5) % 11, 4 + (i * 7) % 36, 0x9a8a5a);
  return v;
}
export function armario(cor: number): Vox {
  const v = new Vox(T23, T23, 46); const b = [0x4f636a, 0x5e6455, 0x555a63][cor % 3];
  const c: Cor = (x, y, z) => (hash3(x, y, z) < 0.05 ? P.ferrugem : ruido(x, y, z, 0.08, b));
  v.box(5, 4, 0, 18, 19, 42, c); v.box(5, 4, 42, 18, 19, 43, mix(b, 0xffffff, 0.2));
  for (const y of [9, 14]) v.box(17, y, 1, 18, y + 1, 41, 0x1b2024);
  for (const y of [6, 11, 16]) { for (let k = 0; k < 4; k++) v.box(17, y, 33 + k * 2, 18, y + 3, 34 + k * 2, 0x1b2024); v.box(17, y + 1, 20, 18, y + 2, 24, 0xc9c2a3); }
  return v;
}
export function caixa(cor: number): Vox {
  const v = new Vox(T23, T23, 24); const c: Cor = (x, y, z) => ruido(x, y, z, 0.12, 0x9a7449);
  v.box(4, 4, 0, 14, 13, 9, c); v.box(7, 10, 0, 18, 19, 11, c); v.box(9, 5, 9, 17, 12, 17, (x, y, z) => ruido(x, y, z, 0.12, cor ? 0x8a6540 : 0xa58055));
  for (const [x0, y0, z1] of [[4, 4, 9], [7, 10, 11], [9, 5, 17]]) v.box(x0, y0 + 3, z1 - 1, x0 + 10, y0 + 5, z1, 0xcdbd90);
  return v;
}
export function ferramentas(): Vox {
  const v = new Vox(T23, T23, 26);
  v.box(3, 5, 0, 20, 18, 12, (x, y, z) => ruido(x, y, z, 0.09, z < 2 ? 0x2a2a2a : 0x8f2f22)); v.box(3, 5, 12, 20, 18, 14, 0x6f241a);
  v.box(8, 8, 14, 15, 9, 17, 0x7b7e80); v.box(8, 14, 14, 15, 15, 17, 0x7b7e80); v.box(8, 8, 17, 15, 15, 18, 0x7b7e80);
  v.box(19, 9, 6, 21, 14, 8, 0xc9b25a); return v;
}
export function barril(cor: number): Vox {
  const v = new Vox(T23, T23, 26); const b = cor ? 0x8a8a2e : 0x7a5f33;
  v.ell(11.5, 11.5, 12.5, 6.5, 6.5, 12.5, (x, y, z) => { const r = hash3(x, y, z); if (z > 4 && z < 8 || z > 15 && z < 19) return 0xc9a52a; if (r < 0.1) return P.ferrugem; return ruido(x, y, z, 0.09, b); });
  v.box(8, 8, 24, 15, 15, 26, 0x55503a); if (cor) { v.set(12, 12, 25, 0xd8c030, true); } return v;
}
export function cama(cor: number): Vox {
  const v = new Vox(T23, T23, 14); const b = [0x6e5f43, 0x56646f, 0x77574f][cor % 3];
  v.box(3, 2, 0, 20, 21, 4, 0x3a2c1e); v.box(4, 3, 4, 19, 20, 8, (x, y, z) => ruido(x, y, z, 0.1, 0xb8b09a)); v.box(4, 8, 8, 19, 20, 10, (x, y, z) => ruido(x, y, z, 0.12, b)); v.box(5, 3, 8, 17, 8, 11, 0xd0c8b0); v.box(3, 2, 4, 20, 3, 13, 0x3a2c1e); return v;
}
export function mesa(cor: number): Vox {
  const v = new Vox(T23, T23, 22); v.box(3, 3, 14, 20, 20, 17, (x, y, z) => ruido(x, y, z, 0.1, 0x6a4a2a));
  for (const [x, y] of [[4, 4], [18, 4], [4, 18], [18, 18]]) v.box(x, y, 0, x + 1, y + 1, 14, 0x3a2a1a);
  v.ell(9, 10, 18, 2.2, 2.2, 1, 0xc9c4b2); if (cor) v.box(13, 12, 17, 17, 16, 19, 0x2c4a5a); return v;
}
export function arvore(v0: number): Vox {
  const v = new Vox(T23, T23, 70); const cor: Cor = (x, y, z) => ruido(x, y, z, 0.14, 0x9a8a70);
  v.box(10, 10, 0, 14, 14, 26, cor); v.box(9, 9, 0, 15, 15, 4, cor);
  const g = (x: number, y: number, z: number, dx: number, dy: number, dz: number, l: number, e: number) => { for (let i = 0; i < l; i++) { x += dx; y += dy; z += dz; v.box(Math.round(x), Math.round(y), Math.round(z), Math.round(x) + e, Math.round(y) + e, Math.round(z) + e, cor); } };
  for (let k = 0; k < 7; k++) { const a = (k / 7) * 6.28 + v0, h = 18 + k * 5; g(12, 12, h, Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.5, 10 - (k % 3), 2); const x = 12 + Math.cos(a) * 6, y = 12 + Math.sin(a) * 6; g(x, y, h + 5, Math.cos(a + 0.6) * 0.5, Math.sin(a + 0.6) * 0.5, 0.7, 5, 1); }
  return v;
}
export function bunker(): Vox {
  const v = new Vox(T23 * 2, T23 * 2, 14); const c: Cor = (x, y, z) => ruido(x, y, z, 0.08, 0x585c5e);
  v.box(3, 3, 0, 43, 43, 5, c);
  for (let i = 0; i < 40; i += 4) { v.box(3 + i, 3, 5, 5 + i, 6, 6, (i / 4) % 2 ? 0xc9a52a : 0x1a1a18); v.box(3 + i, 40, 5, 5 + i, 43, 6, (i / 4) % 2 ? 0xc9a52a : 0x1a1a18); }
  v.ell(23, 23, 6, 15, 15, 4, (x, y, z) => ruido(x, y, z, 0.08, 0x6a7073)); v.ell(23, 23, 9.5, 11, 11, 2.2, (x, y, z) => ruido(x, y, z, 0.08, 0x3d4346));
  for (let k = 0; k < 3; k++) { const a = k * 2.094; for (let r = 0; r < 9; r++) v.box(Math.round(23 + Math.cos(a) * r), Math.round(23 + Math.sin(a) * r), 11, Math.round(23 + Math.cos(a) * r) + 2, Math.round(23 + Math.sin(a) * r) + 2, 13, 0xa2a8a4); }
  v.box(38, 7, 5, 41, 10, 9, 0x5dff9a, true); return v;
}

export type Sprites = Record<string, Render>;
export type Tarefa = () => void;
/** Lista de tarefas pequenas (para gerar a arte aos poucos, sem travar a tela de carregamento). */
export function tarefasSprites(out: Sprites): Tarefa[] {
  const t: Tarefa[] = []; const R = 17; const Y = Math.PI / 4, Y2 = (3 * Math.PI) / 4;
  const frames = [0, 1, 2, 3];
  for (const arma of ['nenhuma', 'melee', 'pistola'] as Arma[]) for (let d = 0; d < DIRS; d++) for (const f of frames) t.push(() => { out[`jog_${arma}_${d}_${f}`] = renderVox(humano(f, arma, 'sobrevivente'), { yaw: dirYaw(d), R, mcx: 9, mcy: 9 }); });
  for (let d = 0; d < DIRS; d++) for (const f of frames) {
    t.push(() => { out[`irr_${d}_${f}`] = renderVox(humano(f, 'nenhuma', 'irradiado'), { yaw: dirYaw(d), R, mcx: 9, mcy: 9 }); });
    t.push(() => { out[`cao_${d}_${f}`] = renderVox(cao(f), { yaw: dirYaw(d), R: 19, mcx: 15, mcy: 7 }); });
    if (f < 2) t.push(() => { out[`rato_${d}_${f}`] = renderVox(rato(f), { yaw: dirYaw(d), R: 11, mcx: 10, mcy: 4.5 }); });
  }
  for (let d = 0; d < DIRS; d++) t.push(() => {
    out[`irr_morto_${d}`] = renderVox(tombar(humano(1, 'nenhuma', 'irradiado')), { yaw: dirYaw(d), R: 25, mcx: 24, mcy: 9 });
    out[`cao_morto_${d}`] = renderVox(tombarLado(cao(1)), { yaw: dirYaw(d), R: 19, mcx: 15, mcy: 12 });
    out[`rato_morto_${d}`] = renderVox(tombarLado(rato(1)), { yaw: dirYaw(d), R: 11, mcx: 10, mcy: 4 });
  });
  for (let c = 0; c < 3; c++) { t.push(() => { const m = carro(c, c === 2); out[`carro${c}`] = renderVox(m, { yaw: Y, R: 42 }); out[`carro_v${c}`] = renderVox(m, { yaw: Y2, R: 42 }); }); }
  t.push(() => { out.geladeira = renderVox(geladeira(), { yaw: Y, R: 17 }); out.ferramentas = renderVox(ferramentas(), { yaw: Y, R: 17 }); out.barril0 = renderVox(barril(0), { yaw: Y, R: 17 }); out.barril1 = renderVox(barril(1), { yaw: Y, R: 17 }); });
  for (let c = 0; c < 3; c++) t.push(() => { out['armario' + c] = renderVox(armario(c), { yaw: Y, R: 17 }); out['caixa' + c] = renderVox(caixa(c), { yaw: Y, R: 17 }); out['cama' + c] = renderVox(cama(c), { yaw: Y, R: 17 }); out['mesa' + c] = renderVox(mesa(c), { yaw: Y, R: 17 }); out['arvore' + c] = renderVox(arvore(c), { yaw: Y, R: 17 }); });
  t.push(() => { out.bunker = renderVox(bunker(), { yaw: Y, R: 35 }); });
  return t;
}
