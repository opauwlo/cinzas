// Motor de voxels -> sprites pixel art. Um voxel = 1 pixel de arte. Câmera ortográfica a 30° (iso 2:1),
// ray casting por pixel (sem buracos), sombreamento em faixas, contorno seletivo e borda interna.
// Todos os personagens, props e paredes saem daqui: identidade visual única.
export const PITCH = Math.PI / 6;
const SP = Math.sin(PITCH), CP = Math.cos(PITCH);
export const FLAG = 0x1000000, EMIS = 0x2000000;
export type Cor = number | ((x: number, y: number, z: number) => number);

export const rgb = (c: number): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const mix = (a: number, b: number, t: number) => { const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b); return (Math.round(r1 + (r2 - r1) * t) << 16) | (Math.round(g1 + (g2 - g1) * t) << 8) | Math.round(b1 + (b2 - b1) * t); };
export const hash3 = (x: number, y: number, z: number) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export class Vox {
  g: Uint32Array;
  constructor(public w: number, public d: number, public h: number) { this.g = new Uint32Array(w * d * h); }
  private i(x: number, y: number, z: number) { return (z * this.d + y) * this.w + x; }
  in(x: number, y: number, z: number) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h; }
  get(x: number, y: number, z: number) { return this.in(x, y, z) ? this.g[this.i(x, y, z)] : 0; }
  set(x: number, y: number, z: number, c: Cor, emis = false) {
    if (!this.in(x, y, z)) return; const v = typeof c === 'function' ? c(x, y, z) : c; if (v < 0) return;
    this.g[this.i(x, y, z)] = (v & 0xffffff) | FLAG | (emis ? EMIS : 0);
  }
  clear(x: number, y: number, z: number) { if (this.in(x, y, z)) this.g[this.i(x, y, z)] = 0; }
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: Cor, emis = false) {
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) this.set(x, y, z, c, emis);
  }
  cut(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) { for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) this.clear(x, y, z); }
  ell(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, c: Cor, emis = false) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rz; if (dx * dx + dy * dy + dz * dz <= 1) this.set(x, y, z, c, emis);
    }
  }
  /** caixa girada ao redor do eixo Y (balanço frente/trás no plano XZ) com pivô (px,pz) */
  rbox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, px: number, pz: number, ang: number, c: Cor, emis = false) {
    const co = Math.cos(ang), si = Math.sin(ang), R = Math.hypot(Math.max(Math.abs(x0 - px), Math.abs(x1 - px)), Math.max(Math.abs(z0 - pz), Math.abs(z1 - pz))) + 1;
    for (let z = Math.floor(pz - R); z <= Math.ceil(pz + R); z++) for (let x = Math.floor(px - R); x <= Math.ceil(px + R); x++) {
      const rx = x + 0.5 - px, rz = z + 0.5 - pz, ox = rx * co + rz * si + px, oz = -rx * si + rz * co + pz;
      if (ox < x0 || ox >= x1 || oz < z0 || oz >= z1) continue;
      for (let y = y0; y < y1; y++) this.set(x, y, Math.floor(z), typeof c === 'function' ? (() => c(Math.floor(ox), y, Math.floor(oz))) : c, emis);
    }
  }
}

export type Render = { canvas: HTMLCanvasElement; ox: number; oy: number };
export type Opc = { yaw: number; R: number; mcx?: number; mcy?: number; outline?: boolean; luz?: [number, number, number]; faixas?: number[] };

/** nível de sombra por face; tom vem de n·L com luz de cima-esquerda */
export function renderVox(v: Vox, o: Opc): Render {
  const yaw = o.yaw, cy = Math.cos(yaw), sy = Math.sin(yaw), mcx = o.mcx ?? v.w / 2, mcy = o.mcy ?? v.d / 2;
  const W = Math.ceil(o.R * 2) + 4, H = Math.ceil(o.R * 2 * SP + v.h * CP) + 4, ox = Math.ceil(o.R) + 2, oy = Math.ceil(o.R * SP + v.h * CP) + 2;
  const L = o.luz ?? [-0.5, 0.38, 0.78], faixas = o.faixas ?? [0.5, 0.68, 0.86, 1.04];
  const col = new Int32Array(W * H).fill(-1), dep = new Float32Array(W * H).fill(1e9), sh = new Float32Array(W * H);
  const dx = -sy * CP, dy = -cy * CP, dz = -SP; // direção do raio em coordenadas do modelo
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const u = px + 0.5 - ox, vv = py + 0.5 - oy, zs = v.h + 2, Ry = (vv + zs * CP) / SP;
    let X = cy * u + sy * Ry + mcx, Y = -sy * u + cy * Ry + mcy, Z = zs;
    // entrada no AABB do grid
    let t0 = 0, t1 = 1e9;
    for (const [p, d, mx] of [[X, dx, v.w], [Y, dy, v.d], [Z, dz, v.h]] as [number, number, number][]) {
      if (Math.abs(d) < 1e-9) { if (p < 0 || p >= mx) { t1 = -1; break; } continue; }
      let a = (0 - p) / d, b = (mx - p) / d; if (a > b) { const tmp = a; a = b; b = tmp; } t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
    if (t1 <= t0) continue;
    const e = 1e-4; X += dx * (t0 + e); Y += dy * (t0 + e); Z += dz * (t0 + e);
    let cx = Math.floor(X), cyy = Math.floor(Y), cz = Math.floor(Z);
    const sx = dx > 0 ? 1 : -1, sy2 = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
    const tdx = Math.abs(1 / (dx || 1e-9)), tdy = Math.abs(1 / (dy || 1e-9)), tdz = Math.abs(1 / (dz || 1e-9));
    let tmx = ((dx > 0 ? cx + 1 - X : X - cx)) * tdx, tmy = ((dy > 0 ? cyy + 1 - Y : Y - cyy)) * tdy, tmz = ((dz > 0 ? cz + 1 - Z : Z - cz)) * tdz;
    let face = t0 === 0 ? 2 : -1, tt = t0; // face de entrada aproximada: topo
    if (face < 0) { // descobre por qual plano entrou
      const dist = [Math.abs(X - 0) < 0.01 || Math.abs(X - v.w) < 0.01 ? 0 : 9, Math.abs(Y) < 0.01 || Math.abs(Y - v.d) < 0.01 ? 1 : 9, Math.abs(Z) < 0.01 || Math.abs(Z - v.h) < 0.01 ? 2 : 9]; face = Math.min(...dist) === 9 ? 2 : dist.indexOf(Math.min(...dist));
    }
    let fs = face === 0 ? -sx : face === 1 ? -sy2 : -sz;
    for (let n = 0; n < 220; n++) {
      if (cx < 0 || cyy < 0 || cz < 0 || cx >= v.w || cyy >= v.d || cz >= v.h) break;
      const c = v.g[(cz * v.d + cyy) * v.w + cx];
      if (c) {
        const nm: [number, number, number] = [0, 0, 0]; nm[face] = fs;
        const wx = cy * nm[0] - sy * nm[1], wy = sy * nm[0] + cy * nm[1], wz = nm[2];
        const lam = wx * L[0] + wy * L[1] + wz * L[2]; const idx = py * W + px;
        sh[idx] = c & EMIS ? 9 : lam; col[idx] = c & 0xffffff; dep[idx] = tt; break;
      }
      if (tmx < tmy && tmx < tmz) { cx += sx; tt = t0 + tmx; tmx += tdx; face = 0; fs = -sx; }
      else if (tmy < tmz) { cyy += sy2; tt = t0 + tmy; tmy += tdy; face = 1; fs = -sy2; }
      else { cz += sz; tt = t0 + tmz; tmz += tdz; face = 2; fs = -sz; }
    }
  }
  const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d')!; const img = g.createImageData(W, H);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : col[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, c = col[i]; if (c < 0) continue;
    let k = 1; const s = sh[i];
    if (s < 5) { const t = 0.5 + 0.62 * s; k = faixas.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a)); }
    else k = 1.25;
    // borda interna: se um vizinho está bem mais perto, escurece (separa membros do tronco)
    if (s < 5) for (const [nx, ny] of [[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]]) { if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (col[j] >= 0 && dep[j] < dep[i] - 2.4) { k *= 0.62; break; } }
    const [r, gg, b] = rgb(c); const o = i * 4; img.data[o] = Math.min(255, r * k); img.data[o + 1] = Math.min(255, gg * k); img.data[o + 2] = Math.min(255, b * k); img.data[o + 3] = 255;
  }
  if (o.outline !== false) { // contorno seletivo: cor do vizinho escurecida
    const base = new Uint8ClampedArray(img.data);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (col[y * W + x] >= 0) continue;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) { if (at(nx, ny) < 0) continue; const j = (ny * W + nx) * 4, o2 = (y * W + x) * 4; img.data[o2] = base[j] * 0.22; img.data[o2 + 1] = base[j + 1] * 0.2; img.data[o2 + 2] = base[j + 2] * 0.22; img.data[o2 + 3] = 255; break; }
    }
  }
  g.putImageData(img, 0, 0);
  return { canvas: out, ox, oy };
}

/** deita o modelo: eixo "para cima" vira o comprimento (rosto para cima) */
export function tombar(v: Vox): Vox {
  const o = new Vox(v.h, v.d, v.w);
  for (let z = 0; z < v.h; z++) for (let y = 0; y < v.d; y++) for (let x = 0; x < v.w; x++) { const c = v.get(x, y, z); if (c) o.g[(x * o.d + y) * o.w + z] = c; }
  return o;
}
/** deita de lado (animais): troca Y por Z */
export function tombarLado(v: Vox): Vox {
  const o = new Vox(v.w, v.h, v.d);
  for (let z = 0; z < v.h; z++) for (let y = 0; y < v.d; y++) for (let x = 0; x < v.w; x++) { const c = v.get(x, y, z); if (c) o.g[(y * o.d + z) * o.w + x] = c; }
  return o;
}
