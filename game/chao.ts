// Chão isométrico em pixel art: cada pixel do losango é calculado a partir da posição contínua no mundo,
// então o terreno emenda sem costura (ruído contínuo) e a radiação mancha o chão sem quadrados.
import { W, H, T, idx, dentro, type Mundo } from './mapa';
import { mix, hash3 } from './voxel';

export const TW = 32, TH = 16; // losango do tile
export const iso = (x: number, y: number) => [(x - y) * (TW / 2), (x + y) * (TH / 2)] as const;
export const CH = 16;

const h2 = (x: number, y: number, s = 0) => hash3(x | 0, y | 0, s);
function vn(x: number, y: number, s: number) { // value noise
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
const fbm = (x: number, y: number, s: number) => vn(x, y, s) * 0.55 + vn(x * 2.1, y * 2.1, s + 7) * 0.3 + vn(x * 4.3, y * 4.3, s + 13) * 0.15;
const rampa = (r: number[], t: number) => r[Math.max(0, Math.min(r.length - 1, Math.floor(t * r.length)))];

const TERRA = [0x3a352b, 0x463f33, 0x544c3e, 0x645b49, 0x766b55, 0x8a7e65];
const ASFALTO = [0x1e2022, 0x27292c, 0x303336, 0x3b3e42, 0x474b50];
const CALCADA = [0x484844, 0x55554f, 0x63635c, 0x72726a, 0x818178];
const MAD = [[0x35241a, 0x3f2c1f, 0x4a3425], [0x2e2018, 0x382719, 0x43301f], [0x3b2a1d, 0x4a3524, 0x573f2b]];

/** cor do chão em (gx,gy) contínuos; x,y = tile; u,v = posição dentro do tile */
function corChao(m: Mundo, t: number, gx: number, gy: number, x: number, y: number, u: number, v: number): number {
  const g = fbm(gx * 1.25, gy * 1.25, 1), grao = h2(gx * 29, gy * 29, 3);
  const viz = (dx: number, dy: number) => (dentro(x + dx, y + dy) ? m.tipos[idx(x + dx, y + dy)] : T.TERRA);
  const isRua = (q: number) => q === T.ESTRADA || q === T.LINHA_H || q === T.LINHA_V;
  switch (t) {
    case T.ESTRADA: case T.LINHA_H: case T.LINHA_V: {
      let c = rampa(ASFALTO, g * 0.9 + (grao - 0.5) * 0.28 + 0.05);
      const rg = Math.abs(vn(gx * 1.7, gy * 1.7, 22) - 0.5); if (rg < 0.012) c = 0x0c0c0d; // rachadura
      if (vn(gx * 0.6, gy * 0.6, 40) > 0.78 && grao < 0.5) c = mix(c, 0x050505, 0.6); // óleo
      if (grao > 0.985) c = 0x4a4d50;
      if (t === T.LINHA_H && Math.abs(v - 0.5) < 0.05 && h2(gx * 9, gy * 9, 5) > 0.18) c = mix(c, 0x9a8a30, 0.8 - grao * 0.3);
      if (t === T.LINHA_V && Math.abs(u - 0.5) < 0.05 && h2(gx * 9, gy * 9, 6) > 0.18) c = mix(c, 0x9a8a30, 0.8 - grao * 0.3);
      return c;
    }
    case T.CALCADA: {
      let c = rampa(CALCADA, g * 0.8 + (grao - 0.5) * 0.25 + 0.12);
      if (u < 0.045 || v < 0.045) c = mix(c, 0x1a1a18, 0.6); // juntas das lajes
      if (Math.abs(vn(gx * 2, gy * 2, 9) - 0.5) < 0.01) c = 0x1f1f1d;
      if (vn(gx * 0.9, gy * 0.9, 31) > 0.8 && grao < 0.4) c = mix(c, 0x4a5a2a, 0.55); // musgo
      for (const [dx, dy, ex, ey] of [[1, 0, u > 0.86, 0], [-1, 0, u < 0.14, 0], [0, 1, v > 0.86, 0], [0, -1, v < 0.14, 0]] as [number, number, boolean, number][]) if (ex && isRua(viz(dx, dy))) { c = mix(c, 0x8d8d84, 0.35); void ey; }
      return c;
    }
    case T.MADEIRA: case T.PORTA: {
      const pr = Math.floor(gy * 4), seg = Math.floor((gx + h2(pr, 0, 4) * 3) / 1.6), pal = MAD[(x * 7 + y * 3 + ((m.tipos[idx(x, y)] === T.PORTA) ? 1 : 0)) % 3 === 0 ? 1 : 0];
      let c = pal[Math.floor(h2(pr, seg, 8) * 3)]; const f = (gy * 4) % 1;
      if (f < 0.12) c = 0x150e0a; if (Math.abs(((gx + h2(pr, 0, 4) * 3) / 1.6) % 1) < 0.025) c = 0x150e0a;
      c = mix(c, 0x000000, fbm(gx * 2, gy * 2, 55) * 0.35 + (grao - 0.5) * 0.12);
      if (h2(gx * 13, gy * 13, 9) > 0.992) c = 0x6a5a3a;
      return c;
    }
    case T.AZULEJO: {
      const q = (Math.floor(gx * 2) + Math.floor(gy * 2)) & 1; let c = q ? 0x62665f : 0x474b45; if ((gx * 2) % 1 < 0.06 || (gy * 2) % 1 < 0.06) c = 0x24262a;
      c = mix(c, 0x0a0a08, fbm(gx * 1.5, gy * 1.5, 66) * 0.5 + (grao - 0.5) * 0.14); if (vn(gx, gy, 70) > 0.82) c = mix(c, 0x5a2a1c, 0.35); return c;
    }
    case T.CONCRETO: {
      let c = rampa([0x2a2d2f, 0x34383a, 0x3f4345, 0x4b5052, 0x575d5f], g * 0.8 + (grao - 0.5) * 0.2 + 0.15); if ((gx / 2) % 1 < 0.03 || (gy / 2) % 1 < 0.03) c = 0x181a1b;
      if (Math.abs(vn(gx * 1.4, gy * 1.4, 77) - 0.5) < 0.011) c = 0x131516; return c;
    }
    case T.ENTULHO: {
      let c = rampa(TERRA, g * 0.8 + 0.05); const cell = h2(Math.floor(gx * 5), Math.floor(gy * 5), 90);
      if (cell > 0.45) { const fx = (gx * 5) % 1, fy = (gy * 5) % 1; if (fx < 0.75 && fy < 0.75) c = fx < 0.3 || fy < 0.3 ? 0x8a877c : 0x5e5c54; else c = 0x15130f; }
      if (h2(Math.floor(gx * 3), Math.floor(gy * 3), 91) > 0.93) c = 0x6e3a1f; return c;
    }
    case T.PAREDE: case T.JANELA: return 0x1c1b19;
    default: {
      let c = rampa(TERRA, g * 0.95 + (grao - 0.5) * 0.3);
      const rg = Math.abs(vn(gx * 1.5, gy * 1.5, 12) - 0.5); if (rg < 0.01) c = 0x1d1a15;
      if (grao > 0.993) c = 0x8a8068; else if (grao < 0.006) c = 0x14110e;
      const tf = vn(gx * 3.1, gy * 3.1, 17); if (tf > 0.74 && grao > 0.7) c = mix(c, 0x6d6c36, 0.7); // mato seco
      const f = h2(x, y, 33);
      if (f < 0.03) { const dx = gx - (x + 0.5), dy = gy - (y + 0.5); if (Math.abs(dx - dy) < 0.05 && Math.abs(dx + dy) < 0.5) c = 0xc9c0a2; } // osso
      if (f > 0.97 && Math.hypot(gx - x - 0.5, gy - y - 0.5) < 0.22) c = mix(c, 0x0c0a08, 0.7); // chamuscado
      return c;
    }
  }
}

export function radiacao(m: Mundo, gx: number, gy: number) {
  const x = Math.min(W - 1, Math.max(0, Math.floor(gx - 0.5))), y = Math.min(H - 1, Math.max(0, Math.floor(gy - 0.5))), fx = gx - 0.5 - x, fy = gy - 0.5 - y;
  const q = (a: number, b: number) => m.rad[idx(Math.min(W - 1, Math.max(0, a)), Math.min(H - 1, Math.max(0, b)))];
  return q(x, y) * (1 - fx) * (1 - fy) + q(x + 1, y) * fx * (1 - fy) + q(x, y + 1) * (1 - fx) * fy + q(x + 1, y + 1) * fx * fy;
}

/** assa o chão de um chunk CHxCH em um canvas; (ox,oy) é a origem do canvas em coordenadas de mundo-tela */
export function assarChao(m: Mundo, cx: number, cy: number): { canvas: HTMLCanvasElement; ox: number; oy: number } {
  const w = (CH * 2 - 1) * (TW / 2) + TW, h = (CH * 2 - 1) * (TH / 2) + TH;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!, img = g.createImageData(w, h), d = img.data;
  const ox = ((cx - cy) * CH - (CH - 1)) * (TW / 2) - TW / 2, oy = (cx + cy) * CH * (TH / 2);
  const parede = (x: number, y: number) => dentro(x, y) && (m.tipos[idx(x, y)] === T.PAREDE || m.tipos[idx(x, y)] === T.JANELA);
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
    const x = cx * CH + i, y = cy * CH + j; if (!dentro(x, y)) continue; const t = m.tipos[idx(x, y)];
    const [sx, sy] = iso(x, y), lx = sx - ox - TW / 2, ly = sy - oy;
    for (let py = 0; py < TH; py++) for (let px = 0; px < TW; px++) {
      const dx = Math.abs(px + 0.5 - TW / 2) / (TW / 2), dy = Math.abs(py + 0.5 - TH / 2) / (TH / 2); if (dx + dy > 1.02) continue;
      const sxp = (px + 0.5 - TW / 2) / (TW / 2), syp = (py + 0.5 - TH / 2) / (TH / 2); // u ao longo de x (grid), v ao longo de y
      const u = (sxp + syp) / 2 + 0.5, v = (syp - sxp) / 2 + 0.5, gx = x + u, gy = y + v;
      let col = corChao(m, t, gx, gy, x, y, u, v);
      // sombra de contato e ao lado das paredes
      if (t !== T.PAREDE && t !== T.JANELA) {
        let s = 0; if (parede(x, y - 1) && v < 0.5) s = Math.max(s, 0.5 - v); if (parede(x - 1, y) && u < 0.3) s = Math.max(s, (0.3 - u) * 1.2); if (parede(x + 1, y) && u > 0.8) s = Math.max(s, (u - 0.8) * 1.2); if (parede(x, y + 1) && v > 0.8) s = Math.max(s, (v - 0.8) * 1.2);
        if (s > 0) col = mix(col, 0x000000, Math.min(0.62, s * 1.3));
      }
      // radiação: mancha verde em pontilhado, cratera com rachaduras brilhantes
      const r = radiacao(m, gx, gy);
      if (r > 0.06 && t === T.TERRA || r > 0.06 && t === T.ENTULHO) {
        const lim = h2(gx * 31, gy * 31, 5); if (lim < r * 1.25) col = mix(col, 0x7fae2c, 0.5 + r * 0.3);
        if (r > 0.55) { col = mix(col, 0x0b1006, 0.45); if (Math.abs(vn(gx * 2.2, gy * 2.2, 14) - 0.5) < 0.02 + (r - 0.55) * 0.05) col = 0xb7ff4a; }
      }
      const o = ((ly + py) * w + (lx + px)) * 4; d[o] = (col >> 16) & 255; d[o + 1] = (col >> 8) & 255; d[o + 2] = col & 255; d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0); return { canvas: c, ox, oy };
}
