// Arte procedural em canvas: tiles, props e personagens em 64 px/tile.
// Não achamos pacote CC0 de top-down pós-nuclear acessível, então geramos aqui (conta em conceitos.json).
import Alea from 'alea';

export const TS = 64;
type G = CanvasRenderingContext2D;
const OUT = '#0a0806';

function cv(w: number, h: number): [HTMLCanvasElement, G] {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}
const R = (seed: string) => Alea(seed);

function elip(g: G, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient, stroke = true, rot = 0) {
  g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
  if (stroke) { g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke(); }
}
function cap(g: G, x1: number, y1: number, x2: number, y2: number, w: number, fill: string) {
  g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = w + 4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  g.strokeStyle = fill; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
function rr(g: G, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke = true) {
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill();
  if (stroke) { g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke(); }
}
function grad(g: G, x0: number, y0: number, x1: number, y1: number, a: string, b: string) {
  const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr;
}
function speckle(g: G, rng: () => number, n: number, cores: string[], max = 2, alpha = 0.4) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * (0.4 + rng() * 0.6); g.fillStyle = cores[Math.floor(rng() * cores.length)];
    const s = 1 + rng() * max; g.fillRect(rng() * TS, rng() * TS, s, s);
  }
  g.globalAlpha = 1;
}
/** desenha mais de uma vez nas bordas para o tile emendar sem costura */
function embrulhado(g: G, fn: (dx: number, dy: number) => void) {
  for (const dx of [-TS, 0, TS]) for (const dy of [-TS, 0, TS]) fn(dx, dy);
}
function mancha(g: G, rng: () => number, n: number, cor: string, a: number, rmin: number, rmax: number) {
  for (let i = 0; i < n; i++) {
    const x = rng() * TS, y = rng() * TS, r = rmin + rng() * (rmax - rmin);
    embrulhado(g, (dx, dy) => {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      gr.addColorStop(0, cor); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2); g.globalAlpha = 1;
    });
  }
}
function rachadura(g: G, rng: () => number, cor: string, w = 1.4) {
  let x = 10 + rng() * 44, y = 10 + rng() * 44; g.strokeStyle = cor; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y);
  const a0 = rng() * 6.28;
  for (let i = 0; i < 6; i++) { x += Math.cos(a0 + (rng() - 0.5) * 1.4) * 6; y += Math.sin(a0 + (rng() - 0.5) * 1.4) * 6; g.lineTo(x, y); }
  g.stroke();
}

// ---------------------------------------------------------------- tiles
function terra(v: number) {
  const [c, g] = cv(TS, TS); const rng = R('terra' + v);
  g.fillStyle = '#675f4b'; g.fillRect(0, 0, TS, TS);
  mancha(g, rng, 6, '#7e7458', 0.5, 14, 30); mancha(g, rng, 5, '#443e31', 0.45, 10, 24); mancha(g, rng, 2, '#5b6040', 0.35, 10, 20);
  speckle(g, rng, 520, ['#8a7f62', '#3e382c', '#7a7058', '#554e3c'], 2, 0.5);
  for (let i = 0; i < 3 + (v % 3); i++) { // pedrinhas
    const x = 6 + rng() * 52, y = 6 + rng() * 52; elip(g, x, y, 2.5 + rng() * 2, 2 + rng() * 1.5, '#8d8672', false); elip(g, x - .6, y - .6, 1.2, 1, 'rgba(255,255,255,.25)', false);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 1, y + 2, 4, 1.2);
  }
  g.strokeStyle = '#7d7b45'; g.lineWidth = 1; // mato seco
  for (let i = 0; i < 6; i++) { const x = rng() * 60 + 2, y = rng() * 60 + 2; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + k * 3, y - 5 - rng() * 3); g.stroke(); } }
  if (v === 2) rachadura(g, rng, '#2f2a21', 1.6);
  if (v === 3) { mancha(g, rng, 1, '#14110d', 0.7, 12, 18); } // óleo
  if (v === 4) { g.fillStyle = 'rgba(15,12,9,.5)'; g.beginPath(); g.ellipse(32, 32, 14, 10, .4, 0, 7); g.fill(); mancha(g, rng, 2, '#000', .5, 8, 14); } // chamuscado
  if (v === 5) { // ossos
    g.strokeStyle = '#cdc3a6'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(18, 40); g.lineTo(34, 30); g.moveTo(24, 28); g.lineTo(40, 44); g.stroke();
    elip(g, 46, 24, 5, 4.5, '#d2c8aa'); g.fillStyle = OUT; g.fillRect(44, 23, 2, 2); g.fillRect(48, 23, 2, 2);
  }
  return c;
}
function estrada(v: number, linha: 'h' | 'v' | null = null) {
  const [c, g] = cv(TS, TS); const rng = R('estrada' + v + (linha ?? ''));
  g.fillStyle = '#2b2c2f'; g.fillRect(0, 0, TS, TS);
  mancha(g, rng, 5, '#3b3c41', 0.5, 16, 30); mancha(g, rng, 4, '#151618', 0.5, 12, 26);
  speckle(g, rng, 600, ['#4a4b50', '#1a1b1d', '#3a3b3f', '#5a5a5e'], 2, 0.55);
  if (v % 2 === 0) { rachadura(g, rng, '#0d0d0f', 1.6); if (rng() < 0.6) rachadura(g, rng, '#0d0d0f', 1.1); }
  if (v === 3) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(8 + rng() * 20, 8 + rng() * 20, 26, 20); }
  if (linha) {
    g.globalAlpha = 0.9; g.fillStyle = '#b5a03a';
    if (linha === 'h') g.fillRect(6, 29, 52, 5); else g.fillRect(29, 6, 5, 52);
    g.globalAlpha = 1; // desgaste da tinta
    g.globalCompositeOperation = 'destination-out'; speckle(g, rng, 40, ['#000'], 3, 0.8); g.globalCompositeOperation = 'source-over';
    g.globalAlpha = .6; speckle(g, rng, 220, ['#4a4b50', '#1a1b1d'], 1.5, 0.5); g.globalAlpha = 1;
  }
  return c;
}
function calcada(v: number) {
  const [c, g] = cv(TS, TS); const rng = R('calcada' + v);
  g.fillStyle = '#7a776c'; g.fillRect(0, 0, TS, TS);
  mancha(g, rng, 5, '#8d8a7d', 0.4, 14, 26); mancha(g, rng, 4, '#4f4d45', 0.4, 10, 20);
  speckle(g, rng, 400, ['#9a9689', '#5b594f', '#6a675d'], 2, 0.45);
  g.strokeStyle = '#3e3c36'; g.lineWidth = 2; g.strokeRect(1, 1, TS - 2, TS - 2); g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 64); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(3, 3); g.lineTo(61, 3); g.moveTo(3, 3); g.lineTo(3, 61); g.stroke();
  if (v > 0) rachadura(g, rng, '#26241f', 1.4);
  if (v === 2) mancha(g, rng, 2, '#5e6a37', 0.5, 6, 12);
  return c;
}
function madeira(v: number) {
  const [c, g] = cv(TS, TS); const rng = R('madeira' + v);
  const cores = ['#6a4828', '#5e3f23', '#744f2d', '#573a20'];
  for (let i = 0; i < 4; i++) {
    const y = i * 16; g.fillStyle = grad(g, 0, y, 0, y + 16, cores[(i + v) % 4], cores[(i + v + 1) % 4]); g.fillRect(0, y, TS, 16);
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, y + .8); g.lineTo(TS, y + .8); g.stroke();
    g.strokeStyle = 'rgba(255,220,160,.10)'; g.beginPath(); g.moveTo(0, y + 2.4); g.lineTo(TS, y + 2.4); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.4)'; const sx = 8 + ((i * 29 + v * 17) % 48); g.beginPath(); g.moveTo(sx, y); g.lineTo(sx, y + 16); g.stroke();
    for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(0,0,0,.14)'; g.beginPath(); const gy = y + 3 + k * 3; g.moveTo(rng() * 20, gy); g.lineTo(30 + rng() * 34, gy + (rng() - .5) * 2); g.stroke(); }
  }
  elip(g, 12 + rng() * 40, 8 + rng() * 48, 3, 2, 'rgba(30,18,8,.6)', false);
  mancha(g, rng, 3, '#000', 0.25, 10, 22); speckle(g, rng, 140, ['#000', '#a07a4c'], 1.5, 0.25);
  if (v === 2) { g.fillStyle = 'rgba(15,40,30,.35)'; g.fillRect(0, 0, TS, TS); }
  return c;
}
function azulejo(v: number) {
  const [c, g] = cv(TS, TS); const rng = R('azulejo' + v);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j + v) % 2 ? '#898d84' : '#5e625b'; g.fillRect(i * 32, j * 32, 32, 32); }
  g.strokeStyle = '#33352f'; g.lineWidth = 1.5; for (const p of [0, 32]) { g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 64); g.moveTo(0, p); g.lineTo(64, p); g.stroke(); }
  mancha(g, rng, 5, '#1b1a14', 0.35, 10, 22); mancha(g, rng, 2, '#6b2a1c', 0.25, 6, 12); speckle(g, rng, 260, ['#000', '#aab0a4'], 1.5, 0.22);
  if (v === 1) rachadura(g, rng, '#1d1e1a', 1.3);
  return c;
}
function concreto(v: number) {
  const [c, g] = cv(TS, TS); const rng = R('concreto' + v);
  g.fillStyle = '#62666a'; g.fillRect(0, 0, TS, TS);
  mancha(g, rng, 6, '#787d80', 0.4, 12, 26); mancha(g, rng, 5, '#35383a', 0.45, 10, 22);
  speckle(g, rng, 420, ['#8a8f92', '#3b3e40'], 2, 0.45);
  g.strokeStyle = '#26282a'; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
  for (const [x, y] of [[6, 6], [58, 6], [6, 58], [58, 58]]) elip(g, x, y, 2.2, 2.2, '#2e3032', false);
  if (v) rachadura(g, rng, '#1a1b1c', 1.3);
  return c;
}
function paredeTopo(v: number) {
  const [c, g] = cv(TS, TS); const rng = R('parede' + v);
  g.fillStyle = grad(g, 0, 0, 0, TS, '#6d665b', '#4a443b'); g.fillRect(0, 0, TS, TS);
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.6; // tijolos
  for (let r = 0; r < 8; r++) { const y = r * 8; g.beginPath(); g.moveTo(0, y); g.lineTo(TS, y); g.stroke(); for (let x = (r % 2) * 8; x < TS; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } }
  mancha(g, rng, 5, '#1c1914', 0.45, 10, 22); speckle(g, rng, 300, ['#867e70', '#2a261f'], 2, 0.4);
  g.fillStyle = 'rgba(255,240,210,.35)'; g.fillRect(0, 0, TS, 3); // luz de cima
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, TS - 4, TS, 4);
  g.fillStyle = 'rgba(255,240,210,.12)'; g.fillRect(0, 0, 3, TS); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(TS - 3, 0, 3, TS);
  if (v === 1) { g.fillStyle = 'rgba(20,12,8,.6)'; g.beginPath(); g.moveTo(20, 0); g.lineTo(34, 0); g.lineTo(28, 14); g.lineTo(23, 9); g.fill(); } // lasca
  return c;
}
function janela(v: number) {
  const c = paredeTopo(v + 3); const g = c.getContext('2d')!;
  g.fillStyle = '#1a1d1f'; g.fillRect(8, 8, 48, 48);
  g.fillStyle = grad(g, 0, 10, 0, 54, '#52707a', '#1f3036'); g.fillRect(12, 12, 40, 40);
  g.strokeStyle = '#0c0d0e'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 12); g.lineTo(32, 52); g.moveTo(12, 32); g.lineTo(52, 32); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(15, 28); g.lineTo(28, 15); g.moveTo(15, 46); g.lineTo(46, 15); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(40, 14); g.lineTo(34, 30); g.lineTo(44, 38); g.moveTo(34, 30); g.lineTo(22, 40); g.stroke();
  return c;
}
function entulho(v: number) {
  const c = terra(v + 1); const g = c.getContext('2d')!; const rng = R('ent' + v);
  for (let i = 0; i < 9; i++) {
    const x = 8 + rng() * 48, y = 8 + rng() * 48, s = 4 + rng() * 8;
    g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y - s * .2); g.lineTo(x + s * .5, y + s); g.lineTo(x - s, y + s * .4); g.closePath();
    g.fillStyle = grad(g, x - s, y - s, x + s, y + s, '#8d8a80', '#4f4d46'); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke();
  }
  g.strokeStyle = '#5a2f1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 48); g.lineTo(50, 40); g.stroke(); // vergalhão enferrujado
  return c;
}

// ---------------------------------------------------------------- props
function sombraRect(g: G, x: number, y: number, w: number, h: number, r = 6) { g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.roundRect(x + 4, y + 6, w, h, r); g.fill(); }

function carro(cor: number) {
  const [c, g] = cv(128, 64); const rng = R('carro' + cor);
  const bases = [['#8a3b2a', '#5e2418'], ['#3d5566', '#25353f'], ['#9a8a62', '#6a5c3d']][cor % 3];
  sombraRect(g, 6, 10, 116, 44, 14);
  for (const x of [20, 88]) { g.fillStyle = '#0c0c0d'; g.fillRect(x, 6, 18, 6); g.fillRect(x, 52, 18, 6); }
  rr(g, 6, 10, 116, 44, 14, grad(g, 0, 10, 0, 54, bases[0], bases[1]));
  for (let i = 0; i < 5; i++) { g.globalAlpha = .55; elip(g, 12 + rng() * 100, 14 + rng() * 36, 3 + rng() * 6, 2 + rng() * 4, '#6b3b1c', false); } g.globalAlpha = 1;
  rr(g, 36, 15, 52, 34, 9, grad(g, 0, 15, 0, 49, bases[0], bases[1]));
  g.fillStyle = grad(g, 0, 18, 0, 46, '#27343a', '#0f171b'); // vidros
  g.beginPath(); g.roundRect(78, 18, 12, 28, 3); g.fill(); g.beginPath(); g.roundRect(34, 18, 10, 28, 3); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(80, 20); g.lineTo(88, 20); g.lineTo(82, 44); g.lineTo(80, 44); g.fill();
  g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(46, 18, 30, 28);
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(96, 10); g.lineTo(96, 54); g.moveTo(26, 10); g.lineTo(26, 54); g.stroke(); // capô/porta-malas
  elip(g, 118, 20, 3, 4, '#d8d19a', false); elip(g, 118, 44, 3, 4, '#d8d19a', false); elip(g, 9, 20, 2.5, 4, '#7a1d12', false); elip(g, 9, 44, 2.5, 4, '#7a1d12', false);
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 12); g.lineTo(110, 12); g.stroke();
  return c;
}
function girar(src: HTMLCanvasElement) {
  const [c, g] = cv(src.height, src.width); g.translate(c.width / 2, c.height / 2); g.rotate(Math.PI / 2); g.drawImage(src, -src.width / 2, -src.height / 2); return c;
}
function geladeira(cor: number) {
  const [c, g] = cv(64, 64); sombraRect(g, 10, 6, 44, 52, 5);
  rr(g, 10, 6, 44, 52, 5, grad(g, 10, 6, 54, 58, cor === 1 ? '#c8ccc0' : '#d3d6cf', '#8e938a'));
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(12, 31, 40, 2); rr(g, 44, 14, 4, 12, 2, '#42464a', false); rr(g, 44, 38, 4, 12, 2, '#42464a', false);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(13, 8, 36, 2); g.fillStyle = 'rgba(120,70,30,.35)'; g.beginPath(); g.ellipse(24, 46, 8, 5, 0, 0, 7); g.fill();
  return c;
}
function armario(cor: number) {
  const [c, g] = cv(64, 64); sombraRect(g, 8, 8, 48, 48, 4);
  const b = ['#556b76', '#6a6e5a', '#59626c'][cor % 3];
  rr(g, 8, 8, 48, 48, 4, grad(g, 8, 8, 56, 56, b, '#2c363c'));
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; for (const x of [24, 40]) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x, 56); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.55)'; for (const x of [12, 28, 44]) for (let k = 0; k < 4; k++) g.fillRect(x, 14 + k * 4, 8, 1.6);
  g.fillStyle = '#c9c2a3'; for (const x of [21, 37, 53]) g.fillRect(x - 1, 34, 2, 6);
  g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(10, 10, 44, 2);
  return c;
}
function caixa(cor: number) {
  const [c, g] = cv(64, 64); sombraRect(g, 12, 12, 40, 40, 3);
  rr(g, 12, 12, 40, 40, 3, grad(g, 12, 12, 52, 52, '#b58652', '#82592f'));
  g.fillStyle = 'rgba(210,190,140,.75)'; g.fillRect(12, 29, 40, 7); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(32, 12); g.lineTo(32, 52); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(14, 14, 36, 2); if (cor === 1) { g.fillStyle = '#7a2a1a'; g.fillRect(40, 40, 8, 6); }
  return c;
}
function ferramentas() {
  const [c, g] = cv(64, 64); sombraRect(g, 10, 18, 44, 28, 4);
  rr(g, 10, 18, 44, 28, 4, grad(g, 10, 18, 54, 46, '#b5392a', '#6c1d14'));
  rr(g, 22, 12, 20, 8, 3, '#8b8f92', false); g.fillStyle = '#17110e'; g.fillRect(24, 14, 16, 3);
  g.fillStyle = '#d9c25a'; g.fillRect(28, 28, 8, 5); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(12, 20, 40, 2);
  return c;
}
function barril(cor: number) {
  const [c, g] = cv(64, 64); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(35, 38, 22, 20, 0, 0, 7); g.fill();
  elip(g, 32, 32, 21, 21, grad(g, 10, 10, 54, 54, cor ? '#7b8a2e' : '#77603a', '#3a4115'));
  elip(g, 32, 32, 15, 15, 'rgba(0,0,0,.28)', false); g.strokeStyle = '#d9c13a'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 18, 0.3, 2.4); g.stroke();
  g.fillStyle = '#16190a'; g.beginPath(); g.arc(32, 32, 3, 0, 7); g.fill();
  for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(32, 32); g.arc(32, 32, 10, k * 2.094 - 0.5, k * 2.094 + 0.5); g.closePath(); g.fillStyle = '#e4cf3a'; g.fill(); }
  elip(g, 32, 32, 3.2, 3.2, '#16190a', false); g.fillStyle = 'rgba(190,255,70,.2)'; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill();
  return c;
}
function cama(cor: number) {
  const [c, g] = cv(64, 64); sombraRect(g, 10, 6, 44, 54, 6);
  rr(g, 10, 6, 44, 54, 6, '#3d2e1e'); rr(g, 13, 9, 38, 48, 4, grad(g, 0, 0, 64, 64, ['#6e5f43', '#5a6a77', '#7a5a52'][cor % 3], '#2c2820'));
  rr(g, 16, 11, 32, 12, 5, '#cfc7b0'); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(14, 34); g.lineTo(50, 34); g.stroke();
  return c;
}
function mesa(cor: number) {
  const [c, g] = cv(64, 64); sombraRect(g, 8, 10, 48, 44, 5);
  rr(g, 8, 10, 48, 44, 5, grad(g, 8, 10, 56, 54, '#7a5632', '#4a331c'));
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(10, 18 + i * 9); g.lineTo(54, 18 + i * 9); g.stroke(); }
  elip(g, 24, 30, 6, 6, '#c9c4b2'); elip(g, 24, 30, 3.5, 3.5, '#8a8570', false); if (cor) rr(g, 38, 24, 10, 14, 2, '#2c4a5a', false);
  return c;
}
function arvore(v: number) {
  const [c, g] = cv(64, 64); const rng = R('arv' + v);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(36, 38, 22, 18, 0, 0, 7); g.fill();
  const galho = (x: number, y: number, a: number, l: number, w: number, d: number) => {
    const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.strokeStyle = OUT; g.lineWidth = w + 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = d > 1 ? '#4a3b2d' : '#3c3024'; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if (d > 0) { galho(x2, y2, a + 0.5 + rng() * .4, l * .7, w * .7, d - 1); galho(x2, y2, a - 0.5 - rng() * .4, l * .7, w * .7, d - 1); }
  };
  for (let i = 0; i < 6; i++) galho(32, 32, (i / 6) * 6.28 + rng(), 12 + rng() * 6, 4, 2);
  elip(g, 32, 32, 5, 5, '#2a211a');
  return c;
}
function bunker() {
  const [c, g] = cv(128, 128);
  rr(g, 6, 6, 116, 116, 8, grad(g, 0, 0, 128, 128, '#53585b', '#2c2f31'));
  g.fillStyle = '#d9b320'; for (let i = 0; i < 12; i++) { g.save(); g.beginPath(); g.rect(8 + i * 10, 8, 5, 6); g.rect(8 + i * 10, 114, 5, 6); g.fillStyle = i % 2 ? '#d9b320' : '#17130a'; g.fill(); g.restore(); }
  elip(g, 64, 64, 40, 40, grad(g, 20, 20, 108, 108, '#6a7074', '#2a2e30'));
  elip(g, 64, 64, 30, 30, grad(g, 30, 30, 98, 98, '#3b4144', '#1d2022'), true);
  g.strokeStyle = '#a2a8a4'; g.lineWidth = 5; g.lineCap = 'round'; for (let k = 0; k < 3; k++) { const a = k * 2.094; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22); g.stroke(); }
  elip(g, 64, 64, 6, 6, '#a2a8a4'); g.fillStyle = '#5dff9a'; g.beginPath(); g.arc(104, 24, 5, 0, 7); g.fill(); g.fillStyle = 'rgba(93,255,154,.25)'; g.beginPath(); g.arc(104, 24, 14, 0, 7); g.fill();
  g.font = '700 14px Cinzel, serif'; g.fillStyle = '#d9b320'; g.textAlign = 'center'; g.fillText('ABRIGO 7', 64, 118);
  return c;
}
function portaF() {
  const [c, g] = cv(64, 64); sombraRect(g, 2, 22, 60, 20, 2);
  rr(g, 2, 20, 60, 22, 2, grad(g, 0, 20, 0, 42, '#80552b', '#5c3a1c'));
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1.5; for (const x of [18, 34, 50]) { g.beginPath(); g.moveTo(x, 21); g.lineTo(x, 41); g.stroke(); }
  elip(g, 52, 31, 2.6, 2.6, '#cfb866', false); g.fillStyle = 'rgba(255,230,180,.25)'; g.fillRect(3, 21, 58, 2);
  return c;
}
function portaA() {
  const [c, g] = cv(64, 64); sombraRect(g, 0, 0, 10, 46, 2);
  rr(g, 0, 0, 10, 46, 2, grad(g, 0, 0, 10, 0, '#80552b', '#5c3a1c')); elip(g, 6, 40, 2, 2, '#cfb866', false);
  return c;
}

// ---------------------------------------------------------------- personagens (olhando para +x)
type Arma = 'nenhuma' | 'melee' | 'pistola';
function humano(frame: number, arma: Arma) {
  const [c, g] = cv(TS, TS); const sw = [-6, 0, 6, 0][frame % 4];
  elip(g, 29 + sw, 22, 7.5, 4.2, '#2a2118'); elip(g, 29 - sw, 42, 7.5, 4.2, '#2a2118');          // botas
  rr(g, 12, 21, 13, 22, 4, '#4a3a24');                                                             // mochila
  g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(14, 23, 9, 2);
  elip(g, 31, 32, 10.5, 17.5, grad(g, 20, 14, 42, 50, '#65774b', '#34402a'));                     // tronco
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(24, 20); g.lineTo(24, 44); g.stroke();
  const ax = arma === 'nenhuma' ? 44 : 49;
  cap(g, 34, 19, ax, 23 + (arma === 'nenhuma' ? sw * .5 : 0), 6.4, '#576a43');                    // braços
  cap(g, 34, 45, ax, 41 - (arma === 'nenhuma' ? sw * .5 : 0), 6.4, '#576a43');
  elip(g, ax + 2, 23, 3.4, 3.4, '#c9a27a'); elip(g, ax + 2, 41, 3.4, 3.4, '#c9a27a');
  if (arma === 'melee') { cap(g, 52, 42, 60, 32, 2.6, '#8d9196'); g.strokeStyle = OUT; g.lineWidth = 2; g.beginPath(); g.moveTo(60, 32); g.lineTo(59, 26); g.stroke(); g.strokeStyle = '#8d9196'; g.lineWidth = 1.4; g.stroke(); }
  if (arma === 'pistola') { rr(g, 50, 31, 12, 5, 1.5, '#2b2e31'); g.fillStyle = '#52575b'; g.fillRect(52, 31.5, 9, 1.6); rr(g, 52, 35, 4, 5, 1, '#1b1d1f', false); }
  elip(g, 37, 32, 9.5, 9.5, grad(g, 28, 22, 46, 42, '#d4ae86', '#a8825c'));                      // cabeça
  g.fillStyle = '#2a2118'; g.beginPath(); g.arc(35, 32, 10.2, Math.PI * .55, Math.PI * 1.45); g.closePath(); g.fill();   // capuz
  g.strokeStyle = OUT; g.lineWidth = 2; g.beginPath(); g.arc(37, 32, 9.5, 0, 7); g.stroke();
  g.fillStyle = '#ff5733'; g.fillRect(27, 24, 5, 16);                                              // lenço coral
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(40, 28, 3, 1.8, -.5, 0, 7); g.fill();
  return c;
}
function irradiado(frame: number) {
  const [c, g] = cv(TS, TS); const sw = [-6, 0, 6, 0][frame % 4], bal = [-2, 0, 2, 0][frame % 4];
  elip(g, 28 + sw, 23, 7, 4, '#2c2b22'); elip(g, 28 - sw, 41, 7, 4, '#2c2b22');
  elip(g, 29, 32, 11.5, 16.5, grad(g, 18, 14, 42, 50, '#7c8960', '#46512f'));
  g.fillStyle = '#4f4236'; g.beginPath(); g.moveTo(22, 20); g.lineTo(36, 24); g.lineTo(30, 32); g.lineTo(37, 40); g.lineTo(22, 46); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(170,255,70,.85)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(24, 26); g.lineTo(30, 30); g.lineTo(27, 36); g.lineTo(33, 40); g.stroke();
  cap(g, 34, 20, 54, 22 + bal, 6.6, '#8a996a'); cap(g, 34, 44, 54, 42 - bal, 6.6, '#8a996a');     // braços esticados
  for (const y of [22 + bal, 42 - bal]) { g.strokeStyle = '#d8e0b8'; g.lineWidth = 1.6; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(54, y); g.lineTo(60, y + k * 3); g.stroke(); } }
  elip(g, 39, 32, 8.8, 8.8, grad(g, 30, 23, 48, 41, '#9dad7c', '#65744b'));
  g.fillStyle = 'rgba(30,40,15,.8)'; g.beginPath(); g.arc(35, 32, 8, Math.PI * .6, Math.PI * 1.4); g.fill();
  g.fillStyle = '#c6ff4a'; g.beginPath(); g.arc(44, 28.5, 2, 0, 7); g.arc(44, 35.5, 2, 0, 7); g.fill();
  g.fillStyle = 'rgba(198,255,74,.3)'; g.beginPath(); g.arc(44, 28.5, 5, 0, 7); g.arc(44, 35.5, 5, 0, 7); g.fill();
  return c;
}
function cao(frame: number) {
  const [c, g] = cv(TS, TS); const sw = [-5, 0, 5, 0][frame % 4];
  for (const [x, y, s] of [[40, 22, sw], [40, 42, -sw], [16, 22, -sw], [16, 42, sw]] as [number, number, number][]) elip(g, x + s, y, 5.5, 3.2, '#3a2f26');
  g.strokeStyle = OUT; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 32); g.quadraticCurveTo(2, 28 + sw, 4, 22); g.stroke();
  g.strokeStyle = '#4d3f33'; g.lineWidth = 3; g.stroke();
  elip(g, 27, 32, 19, 9.5, grad(g, 10, 22, 44, 42, '#7a6450', '#43362b'));
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.2; for (let x = 20; x <= 34; x += 4) { g.beginPath(); g.moveTo(x, 25); g.lineTo(x, 39); g.stroke(); }
  elip(g, 47, 32, 8, 6.5, grad(g, 40, 26, 55, 38, '#8a7059', '#4e3e30')); g.fillStyle = '#4e3e30'; g.beginPath(); g.moveTo(52, 29); g.lineTo(61, 31); g.lineTo(61, 34); g.lineTo(52, 36); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
  elip(g, 44, 26, 3, 2, '#2c2219'); elip(g, 44, 38, 3, 2, '#2c2219');
  g.fillStyle = '#ff3a2a'; g.beginPath(); g.arc(50, 29, 1.8, 0, 7); g.arc(50, 35, 1.8, 0, 7); g.fill();
  g.fillStyle = '#e9e4cf'; g.fillRect(58, 33.5, 1.6, 2.4); g.fillRect(55, 33.8, 1.4, 2);
  return c;
}
function rato(frame: number) {
  const [c, g] = cv(TS, TS); const sw = [-3, 3][frame % 2];
  g.strokeStyle = OUT; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(22, 32); g.quadraticCurveTo(12, 38 + sw, 6, 30); g.stroke(); g.strokeStyle = '#b08a7c'; g.lineWidth = 1.6; g.stroke();
  elip(g, 30 + sw * .4, 25, 4, 2.4, '#2e261f'); elip(g, 30 - sw * .4, 39, 4, 2.4, '#2e261f');
  elip(g, 31, 32, 12, 6.8, grad(g, 20, 26, 42, 38, '#6a5a4c', '#3a3028')); elip(g, 43, 32, 6, 4.6, '#5d4f42');
  elip(g, 40, 28, 2.2, 2.2, '#4a3c32'); elip(g, 40, 36, 2.2, 2.2, '#4a3c32'); g.fillStyle = '#ff3a2a'; g.beginPath(); g.arc(45, 30.3, 1.1, 0, 7); g.arc(45, 33.7, 1.1, 0, 7); g.fill();
  g.fillStyle = '#d9a8a0'; g.beginPath(); g.arc(49, 32, 1.4, 0, 7); g.fill();
  return c;
}
function sombraTex() { const [c, g] = cv(64, 64); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 26); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; }
function clarao() { const [c, g] = cv(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,245,200,1)'); gr.addColorStop(.35, 'rgba(255,190,80,.7)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; }

export type Atlas = Record<string, HTMLCanvasElement>;
export function gerarAtlas(): Atlas {
  const a: Atlas = {};
  for (let v = 0; v < 6; v++) a['terra' + v] = terra(v);
  for (let v = 0; v < 4; v++) a['estrada' + v] = estrada(v);
  for (let v = 0; v < 2; v++) { a['linha_h' + v] = estrada(v * 2, 'h'); a['linha_v' + v] = estrada(v * 2, 'v'); }
  for (let v = 0; v < 3; v++) { a['calcada' + v] = calcada(v); a['madeira' + v] = madeira(v); a['parede' + v] = paredeTopo(v); a['entulho' + v] = entulho(v); a['concreto' + (v % 2)] = concreto(v % 2); }
  for (let v = 0; v < 2; v++) { a['azulejo' + v] = azulejo(v); a['janela' + v] = janela(v); }
  for (let v = 0; v < 3; v++) { a['carro' + v] = carro(v); a['carro_v' + v] = girar(carro(v)); a['geladeira' + v] = geladeira(v); a['armario' + v] = armario(v); a['caixa' + v] = caixa(v); a['cama' + v] = cama(v); a['mesa' + v] = mesa(v); a['arvore' + v] = arvore(v); }
  a.ferramentas = ferramentas(); a.barril0 = barril(0); a.barril1 = barril(1); a.bunker = bunker(); a.porta_f = portaF(); a.porta_a = portaA(); a.sombra = sombraTex(); a.clarao = clarao();
  for (let f = 0; f < 4; f++) { a['jog_nenhuma' + f] = humano(f, 'nenhuma'); a['jog_melee' + f] = humano(f, 'melee'); a['jog_pistola' + f] = humano(f, 'pistola'); a['irr' + f] = irradiado(f); a['cao' + f] = cao(f); }
  for (let f = 0; f < 2; f++) a['rato' + f] = rato(f);
  return a;
}
