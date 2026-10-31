// Armas em voxel, desenhadas no referencial do braço (a mão fica em (hx,hy,hz); "para baixo" é -z, "frente" é +x).
// Com o braço levantado a ~80°, a arma aponta para a frente. Serve para qualquer humanoide.
import { Vox, type Cor } from './vox';
import { ruido, mix } from './cor';
import { ACO } from './paletas';

const aco: Cor = (x, y, z) => ruido(x, y, z, 0.1, ACO);
const madeira: Cor = (x, y, z) => ruido(x, y, z, 0.12, 0x6a4a2c);
const ferrugem: Cor = (x, y, z) => ruido(x, y, z, 0.14, 0x7a3b1c);
const preto: Cor = (x, y, z) => ruido(x, y, z, 0.08, 0x23252a);

export const ARMAS_VISUAIS = ['pe_de_cabra', 'taco', 'cano', 'facao', 'machado', 'faca', 'martelo', 'pistola', 'escopeta', 'rifle', 'tocha', 'clava_pregos'] as const;

/** desenha a arma na mão (hx,hy,hz). `dir` = ângulo de inclinação da arma para a frente (rad). */
export function desenharArma(id: string, v: Vox, hx: number, hy: number, hz: number) {
  const L = (len: number, tilt: number, esp: number, c: Cor, x0 = hx, z0 = hz) => { const x1 = x0 + Math.sin(tilt) * len, z1 = z0 - Math.cos(tilt) * len; v.linha(x0, hy, z0, x1, hy, z1, esp, c); return [x1, z1] as const; };
  switch (id) {
    case 'pe_de_cabra': { const [x, z] = L(17, 0.6, 2, aco, hx, hz + 2); L(5, 1.7, 2, ferrugem, x, z); v.box(Math.round(hx), Math.round(hy), Math.round(hz) + 1, Math.round(hx) + 2, Math.round(hy) + 2, Math.round(hz) + 3, 0x2a2a2a); break; }
    case 'cano': L(16, 0.5, 2, (x, y, z) => ruido(x, y, z, 0.1, 0x5a5d60), hx, hz + 2); break;
    case 'taco': { L(18, 0.55, 3, madeira, hx, hz + 2); const x = hx + Math.sin(0.55) * 13, z = hz + 2 - Math.cos(0.55) * 13; for (let i = 0; i < 4; i++) v.set(x + i, hy - 1 + (i % 2) * 3, z - i * 2, 0x2a2a2a); break; }
    case 'clava_pregos': { L(16, 0.5, 3, madeira, hx, hz + 2); for (let i = 0; i < 6; i++) v.set(hx + 5 + (i % 3) * 2, hy - 1 + (i % 2) * 3, hz - 4 - (i % 4) * 2, 0xb8b8b0); break; }
    case 'facao': { v.box(Math.round(hx), Math.round(hy), Math.round(hz), Math.round(hx) + 2, Math.round(hy) + 2, Math.round(hz) + 3, 0x3a2a1e); L(14, 0.5, 2, (x, y, z) => ruido(x, y, z, 0.08, 0x9a9da0), hx + 1, hz - 1); break; }
    case 'faca': { v.box(Math.round(hx), Math.round(hy), Math.round(hz), Math.round(hx) + 2, Math.round(hy) + 2, Math.round(hz) + 3, 0x2a2018); L(8, 0.4, 2, (x, y, z) => ruido(x, y, z, 0.08, 0xa8abae), hx + 1, hz - 1); break; }
    case 'machado': { L(17, 0.5, 2, madeira, hx, hz + 2); const x = hx + Math.sin(0.5) * 15, z = hz + 2 - Math.cos(0.5) * 15; v.box(Math.round(x) - 1, Math.round(hy) - 2, Math.round(z) - 4, Math.round(x) + 3, Math.round(hy) + 3, Math.round(z) + 2, aco); v.box(Math.round(x) + 3, Math.round(hy) - 2, Math.round(z) - 3, Math.round(x) + 4, Math.round(hy) + 3, Math.round(z) + 1, 0xc9ccd0); break; }
    case 'martelo': { L(13, 0.5, 2, madeira, hx, hz + 2); const x = hx + Math.sin(0.5) * 11, z = hz + 2 - Math.cos(0.5) * 11; v.box(Math.round(x) - 1, Math.round(hy) - 2, Math.round(z) - 3, Math.round(x) + 5, Math.round(hy) + 3, Math.round(z) + 1, aco); break; }
    case 'tocha': { L(12, 0.45, 2, madeira, hx, hz + 2); const x = hx + Math.sin(0.45) * 11, z = hz + 2 - Math.cos(0.45) * 11; v.ell(x + 1, hy + 0.5, z - 2, 2.5, 2.5, 3, 0xffa030, true); v.ell(x + 1, hy + 0.5, z - 3, 1.4, 1.4, 2, 0xfff0a0, true); break; }
    case 'pistola': { const x = Math.round(hx), y = Math.round(hy), z = Math.round(hz); v.box(x, y, z - 8, x + 2, y + 2, z + 1, preto); v.box(x + 2, y, z - 3, x + 3, y + 2, z, 0x1a1c1e); v.box(x - 1, y, z + 0, x + 1, y + 2, z + 4, 0x3a2a1e); v.set(x, y, z - 8, 0x6a6e72); break; }
    case 'escopeta': { const x = Math.round(hx), y = Math.round(hy), z = Math.round(hz); v.box(x, y, z - 16, x + 2, y + 2, z, preto); v.box(x, y, z - 11, x + 3, y + 2, z - 6, madeira); v.box(x - 1, y, z - 2, x + 3, y + 2, z + 6, madeira); break; }
    case 'rifle': { const x = Math.round(hx), y = Math.round(hy), z = Math.round(hz); v.box(x, y, z - 19, x + 2, y + 2, z, preto); v.box(x, y, z - 14, x + 3, y + 2, z - 6, 0x4a3a28); v.box(x - 1, y, z - 2, x + 3, y + 2, z + 7, 0x4a3a28); v.box(x + 1, y, z - 11, x + 3, y + 2, z - 8, 0x1a1c1e); break; }
  }
  void mix;
}
