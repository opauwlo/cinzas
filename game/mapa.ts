import Alea from 'alea';
import { createNoise2D } from 'simplex-noise';
import { sortearLoot, type TipoContainer } from './itens';

export const W = 96;
export const H = 96;
export const T = { TERRA: 0, ESTRADA: 1, CALCADA: 2, MADEIRA: 3, AZULEJO: 4, PAREDE: 5, PORTA: 6, JANELA: 7, ENTULHO: 8, LINHA_H: 9, LINHA_V: 10, CONCRETO: 11 } as const;

export type PropTipo = TipoContainer | 'barril' | 'cama' | 'mesa' | 'arvore' | 'carro_v' | 'bunker';
export type Prop = {
  id: number; tipo: PropTipo; x: number; y: number; // tile (canto superior esquerdo)
  w: number; h: number; cor: number; solido: boolean;
  loot?: string[]; aberto?: boolean; especial?: boolean;
};
export type Spawn = { tipo: 'irr' | 'cao' | 'rato'; x: number; y: number };
export type Predio = { x: number; y: number; w: number; h: number; tipo: 'casa' | 'loja' | 'oficina' | 'mercado' };

export type Mundo = {
  tipos: Uint8Array; rad: Float32Array; solido: Uint8Array; opaco: Uint8Array;
  props: Prop[]; spawns: Spawn[]; predios: Predio[];
  jogador: { x: number; y: number }; abrigo: { x: number; y: number }; radio: { x: number; y: number };
};

const ESTRADAS_X = [22, 70];
const ESTRADAS_Y = [30, 62];
const naEstradaX = (x: number) => ESTRADAS_X.some(r => x >= r && x < r + 3);
const naEstradaY = (y: number) => ESTRADAS_Y.some(r => y >= r && y < r + 3);

export const idx = (x: number, y: number) => y * W + x;
export const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

export function gerarMundo(seed: string): Mundo {
  const rng = Alea(seed);
  const ruido = createNoise2D(Alea(seed + 'r'));
  const tipos = new Uint8Array(W * H);
  const rad = new Float32Array(W * H);
  const solido = new Uint8Array(W * H);
  const opaco = new Uint8Array(W * H);
  const props: Prop[] = [];
  const predios: Predio[] = [];
  const spawns: Spawn[] = [];
  const ocupado = new Uint8Array(W * H); // props e portas (não colocar nada em cima)
  const interior = new Uint8Array(W * H);
  let pid = 1;
  const ri = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1));

  // terreno base, estradas e calçadas
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let t: number = T.TERRA;
    const ex = naEstradaX(x), ey = naEstradaY(y);
    if (ex || ey) {
      t = T.ESTRADA;
      if (ex && !ey && x % 3 === 1 && ESTRADAS_X.includes(x - 1) && y % 6 < 3) t = T.LINHA_V;
      if (ey && !ex && y % 3 === 1 && ESTRADAS_Y.includes(y - 1) && x % 6 < 3) t = T.LINHA_H;
    } else if (naEstradaX(x - 1) || naEstradaX(x + 1) || naEstradaY(y - 1) || naEstradaY(y + 1)) t = T.CALCADA;
    tipos[idx(x, y)] = t;
    if (t === T.TERRA && rng() < 0.012) tipos[idx(x, y)] = T.ENTULHO;
  }

  const livre = (x: number, y: number) => dentro(x, y) && tipos[idx(x, y)] === T.TERRA && !ocupado[idx(x, y)];

  // prédios
  const blocos = [[0, 21, 0, 29], [26, 69, 0, 29], [74, 96, 0, 29], [0, 21, 34, 61], [26, 69, 34, 61], [74, 96, 34, 61], [0, 21, 66, 96], [26, 69, 66, 96], [74, 96, 66, 96]];
  const tiposPredio: Predio['tipo'][] = ['casa', 'casa', 'loja', 'oficina', 'mercado'];
  let radioPredio: Predio | null = null;
  for (const [x0, x1, y0, y1] of blocos) {
    const central = x0 === 26 && y0 === 34;
    const tent = central ? 14 : 7;
    for (let k = 0; k < tent; k++) {
      const tp = tiposPredio[ri(0, tiposPredio.length - 1)];
      const w = tp === 'mercado' ? ri(12, 15) : ri(8, 12);
      const h = tp === 'mercado' ? ri(8, 10) : ri(7, 9);
      const bx = ri(x0 + 2, Math.max(x0 + 2, x1 - w - 2));
      const by = ri(y0 + 2, Math.max(y0 + 2, y1 - h - 2));
      if (bx + w >= x1 || by + h >= y1) continue;
      if (predios.some(p => bx < p.x + p.w + 3 && bx + w + 3 > p.x && by < p.y + p.h + 3 && by + h + 3 > p.y)) continue;
      // blocos de canto (ermo): poucos prédios
      if (!central && (x0 !== 26 || y0 !== 34) && rng() < 0.35) continue;
      predios.push({ x: bx, y: by, w, h, tipo: tp });
    }
  }
  // o prédio do rádio: o mais próximo do centro-leste
  radioPredio = [...predios].sort((a, b) => Math.hypot(a.x - 60, a.y - 48) - Math.hypot(b.x - 60, b.y - 48))[0] ?? null;

  const portasPredio: [number, number][] = [];
  for (const p of predios) {
    const piso = p.tipo === 'casa' ? T.MADEIRA : p.tipo === 'oficina' ? T.CONCRETO : T.AZULEJO;
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
      const borda = x === p.x || y === p.y || x === p.x + p.w - 1 || y === p.y + p.h - 1;
      const i = idx(x, y);
      if (borda) { tipos[i] = T.PAREDE; solido[i] = 1; opaco[i] = 1; }
      else { tipos[i] = piso; interior[i] = 1; }
    }
    // divisória
    if (p.w >= 10) {
      const dx = p.x + Math.floor(p.w / 2);
      const gap = ri(p.y + 2, p.y + p.h - 3);
      for (let y = p.y + 1; y < p.y + p.h - 1; y++) {
        const i = idx(dx, y);
        if (y === gap || y === gap + 1) { ocupado[i] = 1; continue; }
        tipos[i] = T.PAREDE; solido[i] = 1; opaco[i] = 1; interior[i] = 0;
      }
    }
    // porta principal (lado voltado ao centro do mundo) + janelas + brechas
    const lado = Math.abs(p.x + p.w / 2 - W / 2) > Math.abs(p.y + p.h / 2 - H / 2) ? (p.x + p.w / 2 < W / 2 ? 'E' : 'O') : (p.y + p.h / 2 < H / 2 ? 'S' : 'N');
    const portas: [number, number][] = [];
    const poe = (l: string) => {
      if (l === 'N') portas.push([ri(p.x + 2, p.x + p.w - 3), p.y]);
      if (l === 'S') portas.push([ri(p.x + 2, p.x + p.w - 3), p.y + p.h - 1]);
      if (l === 'O') portas.push([p.x, ri(p.y + 2, p.y + p.h - 3)]);
      if (l === 'E') portas.push([p.x + p.w - 1, ri(p.y + 2, p.y + p.h - 3)]);
    };
    poe(lado); if (rng() < 0.4) poe('NSEO'[ri(0, 3)]);
    for (const [x, y] of portas) {
      const i = idx(x, y); tipos[i] = T.PORTA; solido[i] = 0; opaco[i] = 1; ocupado[i] = 1; portasPredio.push([x, y]);
      for (const [ax, ay] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) if (dentro(ax, ay)) ocupado[idx(ax, ay)] = 1;
    }
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
      const i = idx(x, y);
      if (tipos[i] !== T.PAREDE) continue;
      const canto = (x === p.x || x === p.x + p.w - 1) && (y === p.y || y === p.y + p.h - 1);
      if (canto) continue;
      const r = rng();
      const ehBorda = x === p.x || y === p.y || x === p.x + p.w - 1 || y === p.y + p.h - 1;
      if (!ehBorda) continue;
      const vizPorta = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([ax, ay]) => tipos[idx(ax, ay)] === T.PORTA);
      if (vizPorta) continue;
      if (r < 0.2) { tipos[i] = T.JANELA; opaco[i] = 0; }
      else if (r < 0.26) { tipos[i] = T.ENTULHO; solido[i] = 0; opaco[i] = 0; } // brecha na parede
    }
    // móveis e contêineres
    const cont: TipoContainer[] = p.tipo === 'mercado' ? ['geladeira', 'geladeira', 'caixa', 'caixa', 'armario'] : p.tipo === 'oficina' ? ['ferramentas', 'ferramentas', 'armario', 'caixa'] : p.tipo === 'loja' ? ['armario', 'caixa', 'caixa', 'ferramentas'] : ['geladeira', 'armario', 'armario', 'caixa'];
    const encostado: [number, number][] = [];
    for (let y = p.y + 1; y < p.y + p.h - 1; y++) for (let x = p.x + 1; x < p.x + p.w - 1; x++) {
      const i = idx(x, y);
      if (!interior[i] || ocupado[i]) continue;
      if ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([ax, ay]) => tipos[idx(ax, ay)] === T.PAREDE)) encostado.push([x, y]);
    }
    for (let k = encostado.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [encostado[k], encostado[j]] = [encostado[j], encostado[k]]; }
    let n = 0;
    for (const [x, y] of encostado) {
      if (n >= cont.length + 2) break;
      const i = idx(x, y);
      if (ocupado[i]) continue;
      if (n < cont.length) {
        const tp = cont[n];
        const especial = p === radioPredio && n === 0;
        const loot = especial ? ['radio', ...sortearLoot(tp, rng).slice(0, 1)] : sortearLoot(tp, rng);
        props.push({ id: pid++, tipo: tp, x, y, w: 1, h: 1, cor: ri(0, 2), solido: true, loot, aberto: false, especial });
      } else {
        props.push({ id: pid++, tipo: rng() < 0.5 ? 'cama' : 'mesa', x, y, w: 1, h: 1, cor: ri(0, 2), solido: true });
      }
      ocupado[i] = 1; solido[i] = 1; n++;
    }
  }

  // crateras de radiação (ermo) e ruído de contaminação leve
  const crateras: [number, number, number][] = [[10, 12, 8], [12, 80, 7], [84, 14, 6], [58, 48, 0]].filter(c => c[2] > 0) as [number, number, number][];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = Math.max(0, ruido(x / 18, y / 18) - 0.3) * 0.55;
    for (const [cx, cy, cr] of crateras) { const d = Math.hypot(x - cx, y - cy); if (d < cr * 1.6) r = Math.max(r, Math.pow(1 - d / (cr * 1.6), 1.4)); }
    if (interior[idx(x, y)] || tipos[idx(x, y)] === T.PAREDE) r = 0;
    rad[idx(x, y)] = Math.min(1, r);
  }

  // abrigo (bunker) no canto sudeste
  const abrigo = { x: 87, y: 86 };
  for (let y = abrigo.y - 3; y <= abrigo.y + 3; y++) for (let x = abrigo.x - 4; x <= abrigo.x + 4; x++) {
    const i = idx(x, y); tipos[i] = T.CONCRETO; rad[i] = 0; solido[i] = 0; ocupado[i] = 1;
  }
  props.push({ id: pid++, tipo: 'bunker', x: abrigo.x - 1, y: abrigo.y - 1, w: 2, h: 2, cor: 0, solido: false });

  // carros nas estradas (alguns com porta-malas)
  for (let k = 0; k < 34; k++) {
    const horiz = rng() < 0.5;
    const via = horiz ? ESTRADAS_Y[ri(0, 1)] : ESTRADAS_X[ri(0, 1)];
    const off = ri(0, 2);
    const along = ri(3, W - 6);
    const x = horiz ? along : via + off, y = horiz ? via + off : along;
    const w = horiz ? 2 : 1, h = horiz ? 1 : 2;
    let ok = true;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (!dentro(xx, yy) || ocupado[idx(xx, yy)] || ![T.ESTRADA, T.LINHA_H, T.LINHA_V].includes(tipos[idx(xx, yy)] as 1 | 9 | 10)) ok = false;
    if (!ok) continue;
    if (Math.hypot(x - 47, y - 29) < 5) continue;
    const comPortaMalas = rng() < 0.45;
    props.push({ id: pid++, tipo: horiz ? 'carro' : 'carro_v', x, y, w, h, cor: ri(0, 2), solido: true, loot: comPortaMalas ? sortearLoot('carro', rng) : undefined, aberto: false });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { ocupado[idx(xx, yy)] = 1; solido[idx(xx, yy)] = 1; }
  }

  // barris tóxicos perto de crateras, árvores mortas no ermo
  for (let k = 0; k < 90; k++) {
    const x = ri(1, W - 2), y = ri(1, H - 2);
    if (!livre(x, y)) continue;
    const r = rad[idx(x, y)];
    if (r > 0.3 && rng() < 0.4) { props.push({ id: pid++, tipo: 'barril', x, y, w: 1, h: 1, cor: ri(0, 1), solido: true }); ocupado[idx(x, y)] = 1; solido[idx(x, y)] = 1; rad[idx(x, y)] = Math.min(1, r + 0.2); }
    else if (rng() < 0.3 && Math.hypot(x - 47, y - 31) > 6) { props.push({ id: pid++, tipo: 'arvore', x, y, w: 1, h: 1, cor: ri(0, 2), solido: true }); ocupado[idx(x, y)] = 1; solido[idx(x, y)] = 1; }
  }

  // jogador: calçada ao norte da estrada central
  const jogador = { x: 47, y: 29 };

  // inimigos
  const longe = (x: number, y: number) => Math.hypot(x - jogador.x, y - jogador.y) > 20;
  const grupo = (tipo: Spawn['tipo'], n: number, cx: number, cy: number) => {
    for (let k = 0; k < n; k++) {
      for (let t = 0; t < 10; t++) {
        const x = cx + ri(-2, 2), y = cy + ri(-2, 2);
        if (dentro(x, y) && !solido[idx(x, y)] && tipos[idx(x, y)] !== T.PORTA && tipos[idx(x, y)] !== T.PAREDE && tipos[idx(x, y)] !== T.JANELA) { spawns.push({ tipo, x, y }); break; }
      }
    }
  };
  for (let g = 0; g < 16; g++) { const cx = ri(3, W - 4), cy = ri(3, H - 4); if (longe(cx, cy)) grupo('irr', ri(2, 4), cx, cy); }
  for (let g = 0; g < 6; g++) { const cx = ri(3, W - 4), cy = ri(3, H - 4); if (longe(cx, cy)) grupo('cao', ri(1, 2), cx, cy); }
  for (let g = 0; g < 8; g++) { const cx = ri(3, W - 4), cy = ri(3, H - 4); if (longe(cx, cy)) grupo('rato', ri(3, 5), cx, cy); }

  const rp = props.find(p => p.especial);
  return { tipos, rad, solido, opaco, props, spawns, predios, jogador, abrigo, radio: rp ? { x: rp.x, y: rp.y } : { x: 60, y: 48 } };
}
