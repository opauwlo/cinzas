// Paredes, janelas e portas em voxel (mesmo renderer dos personagens). 23 voxels = 1 tile.
import { Vox, renderVox, mix, hash3, type Cor, type Render } from './voxel';
const N = 23;
export const ALTA = 54, BAIXA = 13;
const ru = (x: number, y: number, z: number, a: number, base: number) => { const t = (hash3(x, y, z) - 0.5) * 2 * a; return t > 0 ? mix(base, 0xffffff, t) : mix(base, 0x000000, -t); };

function paleta(estilo: number): Cor {
  if (estilo === 0) { // madeira velha com tábuas horizontais
    const b = [0x5a6563, 0x6b5a45, 0x58604a][0];
    return (x, y, z) => { if (z % 5 === 0) return 0x1a1613; const fundo = hash3(x >> 2, y >> 2, z) < 0.08; return ru(x, y, z, 0.1, fundo ? 0x2a2218 : mix(b, 0x000000, (1 - Math.min(1, z / 40)) * 0.35)); };
  }
  if (estilo === 1) { // tijolo aparente
    return (x, y, z) => { const c = Math.floor(z / 3), u = x + y + (c % 2) * 4; if (z % 3 === 0 || u % 8 === 0) return 0x8a8578; const f = hash3(Math.floor(u / 8), c, 3); return ru(x, y, z, 0.07, mix(f < 0.5 ? 0x6e4636 : 0x5d3b2e, 0x14100d, (1 - Math.min(1, z / 44)) * 0.5)); };
  }
  return (x, y, z) => { if ((x + y) % 11 === 0 || z % 14 === 0) return 0x2c2e2e; return ru(x, y, z, 0.09, mix(0x6a6b66, 0x111210, (1 - Math.min(1, z / 40)) * 0.45)); };
}

export function parede(estilo: number, alto: number, janela: boolean): Vox {
  const v = new Vox(N, N, alto), pal = paleta(estilo);
  v.box(0, 0, 0, N, N, alto - 1, pal); v.box(0, 0, alto - 1, N, N, alto, (x, y, z) => ru(x, y, z, 0.08, 0x77766d));
  v.box(0, 0, alto - 3, N, 1, alto - 1, 0x55544e); v.box(0, 0, 0, N, N, 2, 0x161512);
  if (janela && alto > 20) {
    const z0 = 20, z1 = 42, quadro = 0x3a2f24, vidro: Cor = (x, y, z) => (z > z1 - 5 && (x + y) % 5 < 2 ? 0x44606b : ru(x, y, z, 0.1, 0x1b2830));
    v.box(N - 2, 5, z0 - 2, N, 18, z1 + 2, quadro); v.box(5, N - 2, z0 - 2, 18, N, z1 + 2, quadro);
    v.box(N - 2, 7, z0, N, 16, z1, vidro); v.box(7, N - 2, z0, 16, N, z1, vidro);
    v.box(N - 2, 11, z0, N, 12, z1, quadro); v.box(11, N - 2, z0, 12, N, z1, quadro); v.box(N - 2, 7, 31, N, 16, 32, quadro); v.box(7, N - 2, 31, 16, N, 32, quadro);
  }
  return v;
}
export function porta(aberta: boolean): Vox {
  const v = new Vox(N, N, ALTA), madeira: Cor = (x, y, z) => ru(x, y, z, 0.1, 0x6a4527);
  v.box(0, 5, 0, 3, 18, ALTA - 1, 0x4a3a2a); v.box(N - 3, 5, 0, N, 18, ALTA - 1, 0x4a3a2a); v.box(0, 5, 44, N, 18, ALTA - 1, 0x4a3a2a); v.box(0, 5, ALTA - 1, N, 18, ALTA, 0x77766d);
  if (!aberta) { v.box(3, 10, 0, N - 3, 13, 44, madeira); for (let x = 6; x < N - 3; x += 5) v.box(x, 13, 0, x + 1, 14, 44, 0x2a1a0e); v.box(N - 6, 13, 20, N - 4, 14, 23, 0xc9b25a); }
  else { v.box(3, 13, 0, 6, N, 44, madeira); v.box(5, N - 1, 20, 6, N, 23, 0xc9b25a); }
  return v;
}

export function tarefasParedes(out: Record<string, Render>): (() => void)[] {
  const t: (() => void)[] = [], Y = Math.PI / 4, Y2 = (3 * Math.PI) / 4;
  for (let e = 0; e < 3; e++) {
    t.push(() => { out[`parede${e}_a`] = renderVox(parede(e, ALTA, false), { yaw: Y, R: 17 }); out[`parede${e}_b`] = renderVox(parede(e, BAIXA, false), { yaw: Y, R: 17 }); out[`janela${e}_a`] = renderVox(parede(e, ALTA, true), { yaw: Y, R: 17 }); out[`janela${e}_b`] = renderVox(parede(e, BAIXA, true), { yaw: Y, R: 17 }); });
  }
  t.push(() => { for (const [n, a] of [['f', false], ['a', true]] as [string, boolean][]) { out[`porta_x_${n}`] = renderVox(porta(a), { yaw: Y, R: 17 }); out[`porta_y_${n}`] = renderVox(porta(a), { yaw: Y2, R: 17 }); } });
  return t;
}
