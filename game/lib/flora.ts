// Flora procedural: árvores (morta, queimada, doente, salgueiro, pinheiro, palmeira), arbustos, capim, cacto, cogumelos, troncos, pedras, ossos...
// Cada receita tem semente e parâmetros; o mesmo gerador produz centenas de plantas diferentes.
import { Vox, type Cor } from './vox';
import { Rng } from './rng';
import { ruido, mix, escurecer, clarear, hash3 } from './cor';
import * as P from './paletas';

export type TipoFlora = 'arvore' | 'arbusto' | 'capim' | 'cacto' | 'cogumelo' | 'tronco' | 'toco' | 'pedra' | 'ossos' | 'flor' | 'junco';
export type RecFlora = { tipo: 'flora'; f: TipoFlora; v: string; sem: number; alt: number; cor: number; cor2: number; balanco: number; sw?: -1 | 0 | 1 };
export const FLORA_N = 48;

const bark = (cor: number) => (x: number, y: number, z: number) => ruido(x, y, z, 0.14, cor);

export function floraVox(r: RecFlora): Vox {
  const rng = new Rng(r.sem), v = new Vox(FLORA_N, FLORA_N, 96), cx = 24, cy = 24;
  const galho = (x: number, y: number, z: number, dx: number, dy: number, dz: number, len: number, esp: number, nivel: number, cor: number, folha: number) => {
    const x1 = x + dx * len, y1 = y + dy * len, z1 = z + dz * len; v.linha(x, y, z, x1, y1, z1, Math.max(1, Math.round(esp)), bark(cor));
    if (nivel > 0) { const n = nivel > 1 ? 3 : 2; for (let k = 0; k < n; k++) { const a = rng.range(-0.9, 0.9), b = rng.range(-0.9, 0.9); let nx = dx + a * 0.8, ny = dy + b * 0.8, nz = dz * 0.7 + rng.range(0.1, 0.5); const m = Math.hypot(nx, ny, nz); nx /= m; ny /= m; nz /= m; galho(x1, y1, z1, nx, ny, nz, len * rng.range(0.55, 0.75), esp * 0.7, nivel - 1, cor, folha); } }
    else if (folha) { v.ell(x1, y1, z1, 3.2, 3.2, 2.4, (xx, yy, zz) => (hash3(xx, yy, zz) < 0.5 ? ruido(xx, yy, zz, 0.14, folha) : -1)); }
  };
  switch (r.f) {
    case 'arvore': {
      const h0 = Math.round(26 * r.alt), r0 = r.v === 'pinheiro' ? 2 : r.v === 'palmeira' ? 1.6 : 3.2, cor = r.cor;
      if (r.v === 'pinheiro') {
        v.cone(cx, cy, 0, 60 * r.alt, 2.4, 1.3, bark(cor)); const layers = Math.round(8 * r.alt);
        for (let i = 0; i < layers; i++) { const z = 18 * r.alt + i * (40 * r.alt / layers), rad = 9 - i * (7.4 / layers); v.cone(cx, cy, Math.round(z), Math.round(z) + 5, rad, rad * 0.25, (x, y, zz) => (hash3(x, y, zz) < 0.82 ? ruido(x, y, zz, 0.12, r.cor2) : -1)); }
        v.cone(cx, cy, Math.round(56 * r.alt), Math.round(64 * r.alt), 1.6, 0.5, (x, y, z) => ruido(x, y, z, 0.1, r.cor2));
      } else if (r.v === 'palmeira') {
        let x = cx, z = 0; const tilt = rng.range(-0.18, 0.18); for (let i = 0; i < 48 * r.alt; i++) { x += tilt; z++; v.cil(x, cy, z, z + 1, r0, r0, (xx, yy, zz) => (zz % 4 === 0 ? escurecer(bark(cor)(xx, yy, zz), 0.25) : bark(cor)(xx, yy, zz))); }
        const top = 48 * r.alt, n = 8; for (let k = 0; k < n; k++) { const a = (k / n) * 6.283 + rng.range(-0.2, 0.2); let px = x, py = cy, pz = top; for (let i = 0; i < 14; i++) { px += Math.cos(a) * 1.3; py += Math.sin(a) * 1.3; pz += 0.5 - i * 0.09; v.box(px, py, pz, px + 2, py + 2, pz + 1, (xx, yy, zz) => ruido(xx, yy, zz, 0.14, i % 2 ? r.cor2 : escurecer(r.cor2, 0.15))); } }
      } else if (r.v === 'salgueiro') {
        v.cone(cx, cy, 0, h0, r0 + 0.8, r0 - 0.6, bark(cor)); v.cone(cx, cy, 0, 5, r0 + 2.2, r0 + 0.8, bark(cor));
        for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283 + rng.range(-0.3, 0.3); galho(cx, cy, h0 - 4, Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0.5, 11 * r.alt, 2, 0, cor, 0); const ex = cx + Math.cos(a) * 9 * r.alt, ey = cy + Math.sin(a) * 9 * r.alt; for (let j = -3; j <= 3; j++) v.linha(ex + j, ey + j * 0.5, h0 + 1, ex + j * 1.1, ey + j * 0.5, h0 - 14 * r.alt - Math.abs(j), 1, (x, y, z) => (hash3(x, y, z) < 0.8 ? ruido(x, y, z, 0.14, r.cor2) : -1)); }
      } else {
        v.cone(cx, cy, 0, h0, r0 + 0.4, r0 - 0.5, bark(cor)); v.cone(cx, cy, 0, 5, r0 + 2.4, r0 + 0.4, bark(cor));
        const n = rng.int(3, 5); for (let k = 0; k < n; k++) { const a = (k / n) * 6.283 + rng.range(-0.5, 0.5); galho(cx, cy, h0 - rng.range(0, 6), Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0.75, 14 * r.alt * rng.range(0.8, 1.1), 2.4, r.v === 'queimada' ? 1 : 2, cor, r.v === 'doente' ? r.cor2 : 0); }
        if (r.v === 'queimada') for (let k = 0; k < 8; k++) v.set(cx + rng.int(-3, 3), cy + 3, rng.int(2, h0 - 4), 0xff7a20, true);
        if (r.v === 'morta' && rng.chance(0.5)) v.cut(cx - 1, cy + 2, 8, cx + 2, cy + 4, 14);
      }
      break;
    }
    case 'arbusto': { const n = rng.int(7, 12); for (let k = 0; k < n; k++) { const a = rng.range(0, 6.283), l = rng.range(6, 11) * r.alt; v.linha(cx, cy, 0, cx + Math.cos(a) * l * 0.7, cy + Math.sin(a) * l * 0.7, l, 1, bark(r.cor)); if (r.v !== 'seco') v.ell(cx + Math.cos(a) * l * 0.7, cy + Math.sin(a) * l * 0.7, l, 2.6, 2.6, 2, (x, y, z) => (hash3(x, y, z) < 0.6 ? ruido(x, y, z, 0.14, r.cor2) : -1)); } break; }
    case 'capim': { const n = rng.int(16, 28); for (let k = 0; k < n; k++) { const a = rng.range(0, 6.283), d = rng.range(0, 6), l = rng.range(8, 16) * r.alt, bx = cx + Math.cos(a) * d, by = cy + Math.sin(a) * d, o = rng.range(-3, 3); v.linha(bx, by, 0, bx + o, by + rng.range(-2, 2), l, 1, (x, y, z) => ruido(x, y, z, 0.15, z > l * 0.6 ? r.cor2 : r.cor)); } break; }
    case 'cacto': { const h = Math.round(26 * r.alt); v.cil(cx, cy, 0, h, 3.4, 3.4, (x, y, z) => ((x + z) % 4 === 0 ? escurecer(ruido(x, y, z, 0.1, r.cor), 0.2) : ruido(x, y, z, 0.1, r.cor))); v.ell(cx, cy, h, 3.4, 3.4, 2.4, bark(r.cor));
      for (const sg of [-1, 1]) if (rng.chance(0.8)) { const z0 = rng.int(8, 14); v.cil(cx + sg * 5, cy, z0, z0 + 2, 2, 2, bark(r.cor)); v.box(cx + sg * 3, cy - 1, z0, cx + sg * 6, cy + 1, z0 + 2, bark(r.cor)); v.cil(cx + sg * 6, cy, z0, z0 + rng.int(8, 13), 2, 2, bark(r.cor)); }
      for (let k = 0; k < 14; k++) v.set(cx + rng.int(-4, 4), cy + 3, rng.int(2, h), 0xe8e0b8); break; }
    case 'cogumelo': { const n = rng.int(3, 6); for (let k = 0; k < n; k++) { const x = cx + rng.range(-6, 6), y = cy + rng.range(-6, 6), h = rng.range(4, 12) * r.alt, rad = rng.range(2.4, 4.6) * Math.min(1.5, r.alt); v.cil(x, y, 0, h, 1.1, 1.1, 0xc9c0a0); v.ell(x, y, h, rad, rad, rad * 0.55, (xx, yy, zz) => (hash3(xx, yy, zz) < 0.12 ? 0xffffff : mix(r.cor, r.cor2, (zz - h) / 3)), r.v === 'brilho'); } break; }
    case 'tronco': { const L = Math.round(30 * r.alt); v.cil(8, cy, 3.4, 3.5, 0, 0, 0); for (let x = 8; x < 8 + L; x++) v.ell(x + 0.5, cy, 3.6, 0.9, 3.5, 3.4, bark(r.cor)); for (let k = 0; k < 3; k++) { const x = 12 + k * 7; v.linha(x, cy + 2, 6, x + 2, cy + 6, 11, 1, bark(r.cor)); } v.cut(8 + L - 3, cy - 1, 4, 8 + L + 1, cy + 4, 8); break; }
    case 'toco': { v.cil(cx, cy, 0, 6, 4.4, 4.4, bark(r.cor)); v.cil(cx, cy, 6, 7, 3.6, 3.6, (x, y, z) => (Math.round(Math.hypot(x - cx, y - cy)) % 2 ? 0x9a7a52 : 0x7a5a3a)); v.cil(cx, cy, 0, 3, 5.6, 5.6, bark(r.cor)); break; }
    case 'pedra': { const g = r.alt, n = rng.int(1, 3); for (let k = 0; k < n; k++) { const x = cx + (k ? rng.range(-8, 8) : 0), y = cy + (k ? rng.range(-8, 8) : 0), s = (k ? rng.range(0.4, 0.7) : 1) * g; v.ell(x, y, 5 * s, 8 * s, 6.5 * s, 5.5 * s, (xx, yy, zz) => { const h = hash3(xx, yy, zz); if (r.v === 'musgo' && zz > 5 * s && h < 0.5) return ruido(xx, yy, zz, 0.12, 0x4a5a2a); return ruido(xx, yy, zz, 0.16, r.cor); }); } break; }
    case 'ossos': { const e = (x: number, y: number, z: number, x2: number, y2: number, z2: number) => v.linha(x, y, z, x2, y2, z2, 1, 0xd8d0b8); e(cx - 6, cy - 4, 1, cx + 5, cy + 3, 1); e(cx - 3, cy + 5, 1, cx + 6, cy - 5, 1); v.ell(cx + 7, cy, 2, 2.4, 2, 2, 0xdad2ba); v.set(cx + 9, cy - 1, 3, 0x2a2018); v.set(cx + 9, cy + 1, 3, 0x2a2018); for (let k = 0; k < 4; k++) { v.linha(cx - 2 + k * 2, cy, 1, cx - 2 + k * 2, cy + 3, 4, 1, 0xd8d0b8); } break; }
    case 'flor': { const n = rng.int(3, 6); for (let k = 0; k < n; k++) { const x = cx + rng.range(-6, 6), y = cy + rng.range(-6, 6), h = rng.range(5, 10); v.linha(x, y, 0, x + rng.range(-1, 1), y, h, 1, 0x5a6a3a); v.ell(x, y, h, 1.6, 1.6, 1.2, mix(r.cor, 0x3a3a3a, 0.3)); } break; }
    case 'junco': { const n = rng.int(14, 24); for (let k = 0; k < n; k++) { const a = rng.range(0, 6.283), d = rng.range(0, 7), l = rng.range(14, 26) * r.alt, bx = cx + Math.cos(a) * d, by = cy + Math.sin(a) * d; v.linha(bx, by, 0, bx + rng.range(-3, 3), by + rng.range(-3, 3), l, 1, (x, y, z) => ruido(x, y, z, 0.12, r.cor)); if (rng.chance(0.4)) v.cil(bx, by, l - 3, l + 1, 1, 1, 0x5a3a24); } break; }
  }
  void clarear; void P; return r.sw ? v.cisalhar(r.sw * 0.14 * (r.f === 'capim' || r.f === 'junco' ? 1.6 : 1)) : v;
}

export function gerarFlora(rng: Rng, f: TipoFlora, v: string): RecFlora {
  const base: RecFlora = { tipo: 'flora', f, v, sem: rng.int(1, 999999), alt: rng.range(0.8, 1.25), cor: rng.pick(P.CASCA), cor2: rng.pick(P.FOLHAGEM_DOENTE), balanco: 0.5 };
  switch (f) {
    case 'arvore': if (v === 'queimada') base.cor = rng.pick(P.CINZAS_TRONCO); if (v === 'pinheiro') { base.cor2 = rng.pick(P.FOLHAGEM_PINHEIRO); base.alt = rng.range(0.8, 1.2); if (rng.chance(0.4)) base.cor2 = mix(base.cor2, 0x7a5a2a, 0.5); } if (v === 'palmeira') { base.cor = 0x6a5a3e; base.cor2 = rng.pick([0x7a8a3a, 0x8a8a3a, 0x5a7a3a]); } if (v === 'salgueiro') base.cor2 = rng.pick([0x6a7a4a, 0x7a8a5a, 0x8a8a5a]); base.balanco = v === 'pinheiro' ? 0.4 : 0.55; break;
    case 'arbusto': base.cor = rng.pick(P.CASCA); base.cor2 = rng.pick(P.FOLHAGEM_DOENTE); base.alt = rng.range(0.6, 1.1); base.balanco = 0.8; break;
    case 'capim': base.cor = rng.pick([0x8a8a4a, 0x7a7a3a, 0x9a8f50]); base.cor2 = rng.pick([0xb0a060, 0xa89850, 0x9a9a50]); base.alt = rng.range(0.7, 1.2); base.balanco = 1; break;
    case 'cacto': base.cor = rng.pick([0x6a7a4a, 0x7a8a5a, 0x5a6a4a]); base.balanco = 0; break;
    case 'cogumelo': base.cor = rng.pick([0x40e0d0, 0x7aff6a, 0xff6ad0, 0x7a9aff]); base.cor2 = clarear(base.cor, 0.3); base.balanco = 0; base.v = 'brilho'; break;
    case 'pedra': base.cor = rng.pick([0x6a6a64, 0x5a5a56, 0x7a7870, 0x4a4a48]); base.alt = rng.range(0.5, 1.3); base.balanco = 0; if (rng.chance(0.3)) base.v = 'musgo'; break;
    case 'flor': base.cor = rng.pick([0x9a5a6a, 0x8a7a3a, 0x6a5a8a, 0xa0a0a0]); base.balanco = 0.9; break;
    case 'junco': base.cor = rng.pick([0x8a7a44, 0x7a6a3a, 0x6a6a3a]); base.alt = rng.range(0.8, 1.2); base.balanco = 1; break;
    default: base.balanco = 0;
  }
  return base;
}
