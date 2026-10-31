import { iso } from './chao';
export const ang = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
export const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** direção na tela (0=direita, 2=baixo...) a partir do ângulo no grid */
export const dirTela = (a: number) => (Math.round(Math.atan2((Math.cos(a) + Math.sin(a)) * 0.5, Math.cos(a) - Math.sin(a)) / (Math.PI / 4)) + 8) % 8;
export const proj = (x: number, y: number, z = 0) => { const [sx, sy] = iso(x, y); return [sx, sy - z] as const; };
