// Despacho dos modelos estáticos (flora, props, estruturas) -> voxel + parâmetros de render.
import type { Vox } from './vox';
import { floraVox, type RecFlora } from './flora';
import { propVox, estrVox, dimProp, T23, type RecProp, type RecEstr } from './props';

export type RecEstatica = RecFlora | RecProp | RecEstr;
export type Montado = { v: Vox; R: number; mcx: number; mcy: number; yaw: number };
const Y0 = Math.PI / 4, Y1 = (3 * Math.PI) / 4;
export function construirEstatico(r: RecEstatica): Montado {
  if (r.tipo === 'flora') { const v = floraVox(r); return { v, R: 24, mcx: 24, mcy: 24, yaw: Y0 }; }
  if (r.tipo === 'estr') { const v = estrVox(r); return { v, R: 17, mcx: v.w / 2, mcy: v.d / 2, yaw: r.o ? Y1 : Y0 }; }
  const v = propVox(r), R = Math.hypot(v.w, v.d) / 2 + 1; return { v, R, mcx: v.w / 2, mcy: v.d / 2, yaw: r.o ? Y1 : Y0 };
}
export { dimProp, T23 };
