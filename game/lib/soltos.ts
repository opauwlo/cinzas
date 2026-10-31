// Ícones de itens soltos no chão (pixel art desenhada por código, 14x12 px): passar por cima coleta.
const K = '#0a0908';
type C = CanvasRenderingContext2D;
const px = (c: C, x: number, y: number, cor: string) => { c.fillStyle = cor; c.fillRect(x, y, 1, 1); };
const re = (c: C, x: number, y: number, w: number, h: number, cor: string) => { c.fillStyle = cor; c.fillRect(x, y, w, h); };
function li(c: C, x0: number, y0: number, x1: number, y1: number, cor: string, dx = 0, dy = 0) {
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, ax = Math.abs(x1 - x0), ay = Math.abs(y1 - y0); let e = ax - ay, x = x0, y = y0;
  for (let i = 0; i < 40; i++) { px(c, x + dx, y + dy, cor); if (x === x1 && y === y1) break; const e2 = 2 * e; if (e2 > -ay) { e -= ay; x += sx; } if (e2 < ax) { e += ax; y += sy; } }
}
export const ITENS_SOLTOS = ['madeira', 'sucata', 'tecido', 'enlatado', 'legume', 'eletronico'] as const;
export function texturaSolto(item: string): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = 14; cv.height = 12; const c = cv.getContext('2d')!;
  re(c, 2, 10, 10, 2, 'rgba(0,0,0,.35)'); // sombra
  switch (item) {
    case 'madeira': for (const d of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]]) { li(c, 2, 9, 11, 4, K, d[0], d[1]); li(c, 3, 4, 10, 9, K, d[0], d[1]); } li(c, 2, 9, 11, 4, '#a98a56'); li(c, 3, 4, 10, 9, '#8a6a3a'); px(c, 5, 7, '#cdb07c'); px(c, 8, 7, '#6a4e28'); break;
    case 'sucata': re(c, 1, 4, 11, 7, K); re(c, 2, 6, 5, 4, '#6b7078'); re(c, 6, 5, 5, 4, '#8a9099'); re(c, 4, 8, 6, 2, '#565c64'); px(c, 7, 5, '#c7ccd2'); px(c, 3, 6, '#a0a6ad'); px(c, 9, 7, '#c7ccd2'); break;
    case 'tecido': re(c, 1, 3, 12, 8, K); re(c, 2, 4, 10, 6, '#b9b09a'); re(c, 2, 7, 10, 1, '#8f8772'); re(c, 4, 4, 2, 1, '#d6cfba'); px(c, 9, 9, '#8f8772'); px(c, 2, 9, K); px(c, 11, 4, K); break;
    case 'enlatado': re(c, 3, 2, 8, 10, K); re(c, 4, 3, 6, 8, '#b0553a'); re(c, 4, 3, 6, 1, '#cdd1d6'); re(c, 4, 10, 6, 1, '#8a9097'); re(c, 5, 6, 4, 2, '#e0b83a'); break;
    case 'legume': re(c, 1, 3, 12, 8, K); re(c, 2, 5, 3, 5, '#3f8a36'); re(c, 5, 3, 4, 7, '#58b04a'); re(c, 9, 5, 3, 5, '#3f8a36'); px(c, 6, 4, '#8fe36a'); px(c, 3, 6, '#7fd06a'); px(c, 10, 6, '#7fd06a'); break;
    default: re(c, 1, 3, 12, 8, K); re(c, 2, 4, 10, 6, '#2a6a4a'); re(c, 5, 5, 4, 3, '#14161a'); px(c, 3, 5, '#d9a02b'); px(c, 4, 8, '#d9a02b'); px(c, 10, 5, '#d9a02b'); px(c, 9, 8, '#d9a02b'); px(c, 3, 8, '#8fe36a');
  }
  return cv;
}
