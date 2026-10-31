// Utilidades de cor (inteiros 0xRRGGBB) e ruído por voxel.
export const rgb = (c: number): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const pack = (r: number, g: number, b: number) => (Math.max(0, Math.min(255, Math.round(r))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(b)));
export const mix = (a: number, b: number, t: number) => { const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b); return pack(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t); };
export const escurecer = (c: number, t: number) => mix(c, 0x000000, t);
export const clarear = (c: number, t: number) => mix(c, 0xffffff, t);
export const luma = (c: number) => { const [r, g, b] = rgb(c); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; };
/** puxa a cor para o cinza (sujeira, desbotado) */
export const desbotar = (c: number, t: number) => { const l = luma(c) * 255; return mix(c, pack(l, l, l), t); };

export const hash3 = (x: number, y: number, z: number) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** ruído por voxel: variação ±amp em torno da cor base */
export const ruido = (x: number, y: number, z: number, amp: number, base: number) => { const t = (hash3(x, y, z) - 0.5) * 2 * amp; return t > 0 ? mix(base, 0xffffff, t) : mix(base, 0x000000, -t); };

export function hsl(h: number, s: number, l: number) {
  h = ((h % 1) + 1) % 1; const a = s * Math.min(l, 1 - l), f = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return pack(f(0) * 255, f(8) * 255, f(4) * 255);
}
export function paraHsl(c: number): [number, number, number] {
  const [r, g, b] = rgb(c).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : mx === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6; return [h, s, l];
}
export const ajustar = (c: number, dh: number, ds: number, dl: number) => { const [h, s, l] = paraHsl(c); return hsl(h + dh, Math.max(0, Math.min(1, s + ds)), Math.max(0, Math.min(1, l + dl))); };
