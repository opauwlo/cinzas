// Núcleo da biblioteca: grade de voxels, carimbo 3D (rotaciona/escala partes) e renderizador por ray casting.
// Um voxel = 1 pixel de arte. Câmera ortográfica a 30° (iso 2:1), luz em faixas, contorno seletivo e borda interna.
import { mix } from './cor';

export const PITCH = Math.PI / 6;
const SP = Math.sin(PITCH), CP = Math.cos(PITCH);
export const FLAG = 0x1000000, EMIS = 0x2000000;
export type Cor = number | ((x: number, y: number, z: number) => number);
export type V3 = [number, number, number];

export class Vox {
  g: Uint32Array;
  constructor(public w: number, public d: number, public h: number) { this.g = new Uint32Array(w * d * h); }
  in(x: number, y: number, z: number) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h; }
  get(x: number, y: number, z: number) { return this.in(x, y, z) ? this.g[(z * this.d + y) * this.w + x] : 0; }
  set(x: number, y: number, z: number, c: Cor, emis = false) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z); if (!this.in(x, y, z)) return;
    const v = typeof c === 'function' ? c(x, y, z) : c; if (v < 0) return;
    this.g[(z * this.d + y) * this.w + x] = (v & 0xffffff) | FLAG | (emis ? EMIS : 0);
  }
  clear(x: number, y: number, z: number) { x = Math.round(x); y = Math.round(y); z = Math.round(z); if (this.in(x, y, z)) this.g[(z * this.d + y) * this.w + x] = 0; }
  /** caixa [x0,x1) x [y0,y1) x [z0,z1) */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: Cor, emis = false) {
    x0 = Math.round(x0); y0 = Math.round(y0); z0 = Math.round(z0); x1 = Math.round(x1); y1 = Math.round(y1); z1 = Math.round(z1);
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) this.set(x, y, z, c, emis);
  }
  cut(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
    x0 = Math.round(x0); y0 = Math.round(y0); z0 = Math.round(z0); x1 = Math.round(x1); y1 = Math.round(y1); z1 = Math.round(z1);
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) this.clear(x, y, z);
  }
  ell(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, c: Cor, emis = false) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rz; if (dx * dx + dy * dy + dz * dz <= 1) this.set(x, y, z, c, emis);
    }
  }
  /** cilindro vertical */
  cil(cx: number, cy: number, z0: number, z1: number, rx: number, ry: number, c: Cor, emis = false) {
    for (let z = Math.round(z0); z < Math.round(z1); z++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, z, c, emis);
    }
  }
  /** tronco de cone vertical: raio r0 em z0 até r1 em z1 */
  cone(cx: number, cy: number, z0: number, z1: number, r0: number, r1: number, c: Cor, emis = false) {
    const n = Math.max(1, Math.round(z1) - Math.round(z0));
    for (let i = 0; i < n; i++) { const r = r0 + (r1 - r0) * (i / Math.max(1, n - 1)); this.cil(cx, cy, Math.round(z0) + i, Math.round(z0) + i + 1, Math.max(0.5, r), Math.max(0.5, r), c, emis); }
  }
  /** linha 3D grossa (galhos, antenas, cabos) */
  linha(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, esp: number, c: Cor, emis = false) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0, z1 - z0) * 2)), o = Math.floor(esp / 2);
    for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(x0 + (x1 - x0) * t) - o, y = Math.round(y0 + (y1 - y0) * t) - o, z = Math.round(z0 + (z1 - z0) * t) - o; this.box(x, y, z, x + esp, y + esp, z + esp, c, emis); }
  }
  copiar() { const o = new Vox(this.w, this.d, this.h); o.g.set(this.g); return o; }
  /** espelha no eixo Y (lado esquerdo vira direito) */
  espelhar() { const o = new Vox(this.w, this.d, this.h); for (let z = 0; z < this.h; z++) for (let y = 0; y < this.d; y++) for (let x = 0; x < this.w; x++) o.g[(z * this.d + (this.d - 1 - y)) * this.w + x] = this.g[(z * this.d + y) * this.w + x]; return o; }
  /** inclina o modelo ao longo da horizontal da tela (balanço de plantas ao vento): k = fração da altura */
  cisalhar(k: number) {
    const o = new Vox(this.w, this.d, this.h);
    for (let z = 0; z < this.h; z++) { const s = Math.round(k * z * z / Math.max(1, this.h) * 0.9); for (let y = 0; y < this.d; y++) for (let x = 0; x < this.w; x++) { const c = this.g[(z * this.d + y) * this.w + x]; if (!c) continue; const nx = x + s, ny = y - s; if (nx >= 0 && ny >= 0 && nx < this.w && ny < this.d) o.g[(z * this.d + ny) * this.w + nx] = c; } }
    return o;
  }
  contar() { let n = 0; for (let i = 0; i < this.g.length; i++) if (this.g[i]) n++; return n; }
}

// ---------------------------------------------------------------- matrizes 3x3 (linha a linha)
export type M3 = readonly number[];
export const I3: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
/** gira em torno de X (inclina para os lados): y'=y c - z s ; z'=y s + z c */
export const rotX = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
/** gira em torno de Y (balanço frente/trás): x'=x c - z s ; z'=x s + z c. Positivo leva a ponta de baixo para a frente */
export const rotY = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; };
/** gira em torno de Z (torção): x'=x c - y s ; y'=x s + y c */
export const rotZ = (a: number): M3 => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
export const mulM = (a: M3, b: M3): M3 => { const r = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) r[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j]; return r; };
export const rot = (rx = 0, ry = 0, rz = 0): M3 => mulM(rotZ(rz), mulM(rotY(ry), rotX(rx)));
export const aplicar = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];

/**
 * Copia `src` para `dst` girando (M) e escalando (s) ao redor de `pivot` (em coordenadas de src),
 * com o pivô indo parar em `pos` (coordenadas de dst). Amostragem inversa: não deixa buracos.
 */
export function carimbar(dst: Vox, src: Vox, o: { pivot: V3; pos: V3; M?: M3; s?: number }) {
  const M = o.M ?? I3, s = o.s ?? 1, [px, py, pz] = o.pivot, [tx, ty, tz] = o.pos;
  let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
  for (const cx of [0, src.w]) for (const cy of [0, src.d]) for (const cz of [0, src.h]) {
    const r = aplicar(M, [(cx - px) * s, (cy - py) * s, (cz - pz) * s]); const X = r[0] + tx, Y = r[1] + ty, Z = r[2] + tz;
    if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; if (Z < z0) z0 = Z; if (Z > z1) z1 = Z;
  }
  const ix0 = Math.max(0, Math.floor(x0)), ix1 = Math.min(dst.w - 1, Math.ceil(x1)), iy0 = Math.max(0, Math.floor(y0)), iy1 = Math.min(dst.d - 1, Math.ceil(y1)), iz0 = Math.max(0, Math.floor(z0)), iz1 = Math.min(dst.h - 1, Math.ceil(z1));
  const inv = 1 / s;
  for (let z = iz0; z <= iz1; z++) for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) {
    const qx = x + 0.5 - tx, qy = y + 0.5 - ty, qz = z + 0.5 - tz;
    // M^T (inversa) aplicada em (q)
    const sx = Math.floor((M[0] * qx + M[3] * qy + M[6] * qz) * inv + px), sy = Math.floor((M[1] * qx + M[4] * qy + M[7] * qz) * inv + py), sz = Math.floor((M[2] * qx + M[5] * qy + M[8] * qz) * inv + pz);
    if (sx < 0 || sy < 0 || sz < 0 || sx >= src.w || sy >= src.d || sz >= src.h) continue;
    const c = src.g[(sz * src.d + sy) * src.w + sx]; if (c) dst.g[(z * dst.d + y) * dst.w + x] = c;
  }
}

// ---------------------------------------------------------------- renderizador
export type Render = { canvas: HTMLCanvasElement; ox: number; oy: number };
export type Opc = { yaw: number; R: number; mcx?: number; mcy?: number; outline?: boolean; luz?: V3; faixas?: number[] };

export function renderVox(v: Vox, o: Opc): Render {
  const yaw = o.yaw, cy = Math.cos(yaw), sy = Math.sin(yaw), mcx = o.mcx ?? v.w / 2, mcy = o.mcy ?? v.d / 2, vw = v.w, vd = v.d, vh = v.h, G = v.g;
  const W = Math.ceil(o.R * 2) + 4, H = Math.ceil(o.R * 2 * SP + vh * CP) + 4, ox = Math.ceil(o.R) + 2, oy = Math.ceil(o.R * SP + vh * CP) + 2;
  const L = o.luz ?? [-0.5, 0.38, 0.78], faixas = o.faixas ?? [0.5, 0.68, 0.86, 1.04];
  const face = new Float32Array(6);
  for (let ax = 0; ax < 3; ax++) for (let sg = 0; sg < 2; sg++) {
    const n = [0, 0, 0]; n[ax] = sg === 0 ? -1 : 1; const wx = cy * n[0] - sy * n[1], wy = sy * n[0] + cy * n[1], lam = wx * L[0] + wy * L[1] + n[2] * L[2], t = 0.5 + 0.62 * lam;
    face[ax * 2 + sg] = faixas.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));
  }
  const col = new Int32Array(W * H).fill(-1), dep = new Float32Array(W * H).fill(1e9), sh = new Float32Array(W * H);
  const dx = -sy * CP, dy = -cy * CP, dz = -SP;
  const sx = dx > 0 ? 1 : -1, sy2 = dy > 0 ? 1 : -1, tdx = dx === 0 ? 1e9 : Math.abs(1 / dx), tdy = dy === 0 ? 1e9 : Math.abs(1 / dy), tdz = Math.abs(1 / dz), zs = vh + 2;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const u = px + 0.5 - ox, vv = py + 0.5 - oy, Ry = (vv + zs * CP) / SP;
    const X0 = cy * u + sy * Ry + mcx, Y0 = -sy * u + cy * Ry + mcy;
    let t0 = 0, t1 = 1e9, ent = 2;
    if (dx !== 0) { let a = (0 - X0) / dx, b = (vw - X0) / dx; if (a > b) { const t = a; a = b; b = t; } if (a > t0) { t0 = a; ent = 0; } if (b < t1) t1 = b; } else if (X0 < 0 || X0 >= vw) continue;
    if (dy !== 0) { let a = (0 - Y0) / dy, b = (vd - Y0) / dy; if (a > b) { const t = a; a = b; b = t; } if (a > t0) { t0 = a; ent = 1; } if (b < t1) t1 = b; } else if (Y0 < 0 || Y0 >= vd) continue;
    { let a = (0 - zs) / dz, b = (vh - zs) / dz; if (a > b) { const t = a; a = b; b = t; } if (a > t0) { t0 = a; ent = 2; } if (b < t1) t1 = b; }
    if (t1 <= t0) continue;
    const te = t0 + 1e-4, X = X0 + dx * te, Y = Y0 + dy * te, Z = zs + dz * te;
    let cx = Math.floor(X), cyy = Math.floor(Y), cz = Math.floor(Z); cx = cx < 0 ? 0 : cx >= vw ? vw - 1 : cx; cyy = cyy < 0 ? 0 : cyy >= vd ? vd - 1 : cyy; cz = cz < 0 ? 0 : cz >= vh ? vh - 1 : cz;
    let tmx = dx > 0 ? (cx + 1 - X) * tdx : dx < 0 ? (X - cx) * tdx : 1e9, tmy = dy > 0 ? (cyy + 1 - Y) * tdy : dy < 0 ? (Y - cyy) * tdy : 1e9, tmz = (Z - cz) * tdz;
    let f = ent * 2 + ((ent === 0 ? dx : ent === 1 ? dy : dz) > 0 ? 0 : 1), tt = t0;
    for (let n = 0; n < 320; n++) {
      if (cx < 0 || cyy < 0 || cz < 0 || cx >= vw || cyy >= vd || cz >= vh) break;
      const c = G[(cz * vd + cyy) * vw + cx];
      if (c) { const i = py * W + px; sh[i] = c & EMIS ? 9 : face[f]; col[i] = c & 0xffffff; dep[i] = tt; break; }
      if (tmx < tmy && tmx < tmz) { cx += sx; tt = t0 + tmx; tmx += tdx; f = sx > 0 ? 0 : 1; }
      else if (tmy < tmz) { cyy += sy2; tt = t0 + tmy; tmy += tdy; f = 2 + (sy2 > 0 ? 0 : 1); }
      else { cz -= 1; tt = t0 + tmz; tmz += tdz; f = 5; }
    }
  }
  const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d')!; const img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, c = col[i]; if (c < 0) continue;
    let k = sh[i] > 5 ? 1.25 : sh[i];
    if (sh[i] < 5) for (let q = 0; q < 4; q++) { const nx = q === 0 ? x - 1 : q === 1 ? x + 1 : x, ny = q === 2 ? y - 1 : q === 3 ? y + 1 : y; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (col[j] >= 0 && dep[j] < dep[i] - 2.4) { k *= 0.62; break; } }
    const o4 = i * 4; d[o4] = Math.min(255, ((c >> 16) & 255) * k); d[o4 + 1] = Math.min(255, ((c >> 8) & 255) * k); d[o4 + 2] = Math.min(255, (c & 255) * k); d[o4 + 3] = 255;
  }
  if (o.outline !== false) {
    const base = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (col[y * W + x] >= 0) continue;
      for (let q = 0; q < 4; q++) { const nx = q === 0 ? x - 1 : q === 1 ? x + 1 : x, ny = q === 2 ? y - 1 : q === 3 ? y + 1 : y; if (nx < 0 || ny < 0 || nx >= W || ny >= H || col[ny * W + nx] < 0) continue; const j = (ny * W + nx) * 4, o2 = (y * W + x) * 4; d[o2] = base[j] * 0.22; d[o2 + 1] = base[j + 1] * 0.2; d[o2 + 2] = base[j + 2] * 0.22; d[o2 + 3] = 255; break; }
    }
  }
  g.putImageData(img, 0, 0);
  return { canvas: out, ox, oy };
}

export { mix };
