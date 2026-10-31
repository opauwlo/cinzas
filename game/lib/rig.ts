// Esqueleto simples: articulações com posição e orientação; partes (Vox pequenos) são carimbadas nelas.
import { Vox, carimbar, I3, mulM, aplicar, rot, type M3, type V3 } from './vox';

export type Art = { pos: V3; M: M3 };
export type Parte = { v: Vox; pivot: V3 };
export type Osso = { rx?: number; ry?: number; rz?: number };

export const raiz = (pos: V3, o: Osso = {}): Art => ({ pos, M: rot(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0) });
/** articulação filha: deslocada (no referencial do pai) e girada */
export const ligar = (pai: Art, off: V3, o: Osso = {}): Art => { const d = aplicar(pai.M, off); return { pos: [pai.pos[0] + d[0], pai.pos[1] + d[1], pai.pos[2] + d[2]], M: mulM(pai.M, rot(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0)) }; };
export const colocar = (out: Vox, p: Parte, a: Art, s = 1) => carimbar(out, p.v, { pivot: p.pivot, pos: a.pos, M: a.M, s });
export const semRot = I3;
