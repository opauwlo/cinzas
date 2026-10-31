// Gerador de zonas: um motor, vários biomas. Mesma seed = mesmo mapa e mesmo saque para todo mundo.
import Alea from 'alea';
import { createNoise2D } from 'simplex-noise';
import { Rng } from './lib/rng';
import { gerarFlora, type RecFlora, type TipoFlora } from './lib/flora';
import { dimProp, type RecProp } from './lib/props';
import { sortearLoot, type Container } from './dados/itens';
import { BIOMAS } from './dados/biomas';
import { biomaDe, TEMAS } from './dados/meta';
import { ARQS, GRUPO, FACCOES } from './dados/criaturas';

export const W = 96, H = 96;
export const T = { TERRA: 0, ESTRADA: 1, CALCADA: 2, MADEIRA: 3, AZULEJO: 4, PAREDE: 5, PORTA: 6, JANELA: 7, ENTULHO: 8, LINHA_H: 9, LINHA_V: 10, CONCRETO: 11, GRAMA: 12, AREIA: 13, LAMA: 14, FLORESTA: 15, METAL: 16, AGUA_RASA: 17, AGUA_FUNDA: 18, RUINA: 19 } as const;
export const idx = (x: number, y: number) => y * W + x;
export const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

export type InterKind = 'saque' | 'cortar' | 'desmontar' | 'bau' | 'bancada' | 'cama' | 'fogueira' | 'jipe' | 'horta' | 'bunker' | 'tanque' | 'rasgar' | 'esfolar' | 'fonte';
export type Interacao = { k: InterKind; rot: string; dur: number; ruido?: number; requer?: string[]; feito?: boolean };
export type Luz = { r: number; cor: number; f: number; noite: boolean };
export type Prop = { id: number; rec: RecProp; x: number; y: number; w: number; h: number; solido: boolean; loot?: string[]; aberto?: boolean; inters: Interacao[]; luz?: Luz; especial?: boolean; estado?: number };
export type FloraObj = { id: number; rec: RecFlora; x: number; y: number; solido: boolean; cortavel: boolean; cortada?: boolean };
export type Spawn = { id: number; arq: string; x: number; y: number; faccao?: number; grupo: number };
export type Poi = { id: string; tipo: string; nome: string; x: number; y: number; r: number };
export type Predio = { x: number; y: number; w: number; h: number; tipo: string };
export type Solto = { id: number; x: number; y: number; item: string; q: number };
export type Zona = {
  id: string; nome: string; bioma: string; seed: string;
  tipos: Uint8Array; rad: Float32Array; solido: Uint8Array; opaco: Uint8Array; estilo: Uint8Array;
  props: Prop[]; flora: FloraObj[]; spawns: Spawn[]; predios: Predio[]; pois: Poi[];
  jogador: { x: number; y: number }; jipe: { x: number; y: number };
  soltos: Solto[];
};

const CONT: Record<string, Container> = { geladeira: 'geladeira', armario: 'armario', caixa: 'caixa', ferramentas: 'ferramentas', caixote_militar: 'caixote_militar', prateleira: 'prateleira', estante: 'estante', guarda_roupa: 'guarda_roupa', mala: 'mala', bomba: 'bomba', lixeira: 'lixeira', balcao: 'balcao', bau: 'bau_gangue', bancada: 'bancada_velha' };
const ROTULO: Record<string, string> = { geladeira: 'geladeira', armario: 'armário', caixa: 'caixa', ferramentas: 'caixa de ferramentas', caixote_militar: 'caixote militar', prateleira: 'prateleira', estante: 'estante', guarda_roupa: 'guarda-roupa', mala: 'mala', bomba: 'bomba de combustível', lixeira: 'lixeira', balcao: 'balcão', bau: 'baú', bancada: 'bancada velha', carro: 'porta-malas' };
const DUR: Record<string, number> = { geladeira: 2.2, armario: 2.6, caixa: 1.6, ferramentas: 2, caixote_militar: 2.8, prateleira: 2, estante: 1.8, guarda_roupa: 2, mala: 1.4, bomba: 2.4, lixeira: 1.4, balcao: 1.8, bau: 2.4, bancada: 2, carro: 3 };
const FERR = ['pe_de_cabra', 'machado', 'facao', 'faca', 'taco'];
const ESTILO_PREDIO: Record<string, number> = { casa: 0, cabana: 0, loja: 1, mercado: 1, posto: 1, oficina: 2, hospital: 2, galpao: 3 };
const PISO_PREDIO: Record<string, number> = { casa: T.MADEIRA, cabana: T.MADEIRA, loja: T.AZULEJO, mercado: T.AZULEJO, posto: T.AZULEJO, hospital: T.AZULEJO, oficina: T.CONCRETO, galpao: T.CONCRETO };
const DIM_PREDIO: Record<string, [number, number, number, number]> = { casa: [8, 12, 7, 9], loja: [10, 14, 8, 10], mercado: [12, 15, 8, 10], oficina: [8, 12, 7, 9], galpao: [14, 20, 10, 14], cabana: [6, 8, 5, 7], hospital: [14, 18, 10, 12], posto: [8, 10, 6, 8] };
const MOBILIA: Record<string, string[]> = {
  casa: ['geladeira', 'armario', 'guarda_roupa', 'cama', 'mesa', 'cadeira', 'sofa', 'estante', 'fogao', 'tv', 'pia', 'vaso', 'mala', 'lixeira'],
  cabana: ['cama', 'bau', 'mesa', 'fogao', 'armario', 'cadeira', 'saco_dormir'],
  loja: ['prateleira', 'prateleira', 'prateleira', 'balcao', 'caixa', 'armario', 'estante', 'lixeira', 'caixa'],
  mercado: ['geladeira', 'geladeira', 'geladeira', 'prateleira', 'prateleira', 'prateleira', 'prateleira', 'caixa', 'caixa', 'carrinho', 'balcao'],
  oficina: ['bancada', 'ferramentas', 'ferramentas', 'caixa', 'pneus', 'barril', 'armario', 'lixeira'],
  galpao: ['caixa', 'caixa', 'caixa', 'barril', 'barril', 'prateleira', 'prateleira', 'prateleira', 'pneus', 'ferramentas', 'gerador', 'tambor_toxico', 'caixote_militar'],
  hospital: ['cama', 'cama', 'cama', 'cama', 'armario', 'armario', 'armario', 'geladeira', 'caixa', 'guarda_roupa', 'mala'],
  posto: ['balcao', 'geladeira', 'prateleira', 'caixa', 'lixeira'],
};

/** o que aparece solto no chão por bioma (peso) e quantos por zona: passar por cima coleta */
const SOLTOS: Record<string, [string, number][]> = {
  base: [['madeira', 5], ['sucata', 3], ['tecido', 2]], ermo: [['sucata', 5], ['tecido', 3], ['madeira', 3], ['enlatado', 1], ['legume', 3]], cidade: [['sucata', 5], ['tecido', 4], ['enlatado', 2], ['eletronico', 1]],
  floresta: [['madeira', 7], ['legume', 3], ['tecido', 1]], industrial: [['sucata', 7], ['eletronico', 2], ['tecido', 1]], pantano: [['legume', 4], ['madeira', 3], ['tecido', 2]],
};
const N_SOLTOS: Record<string, number> = { base: 16, ermo: 34, cidade: 32, floresta: 46, industrial: 32, pantano: 30 };
export function gerarZona(id: string, biomaId: string, seed: string, nome?: string, tema?: string): Zona {
  const B = biomaDe(biomaId, tema), TEMA = tema ? TEMAS[tema] : undefined, rng = new Rng(`${seed}|${id}`), ruido = createNoise2D(Alea(`${seed}|${id}|n`)), ruido2 = createNoise2D(Alea(`${seed}|${id}|m`));
  const tipos = new Uint8Array(W * H), rad = new Float32Array(W * H), solido = new Uint8Array(W * H), opaco = new Uint8Array(W * H), estilo = new Uint8Array(W * H), ocupado = new Uint8Array(W * H), interior = new Uint8Array(W * H);
  const props: Prop[] = [], flora: FloraObj[] = [], spawns: Spawn[] = [], predios: Predio[] = [], pois: Poi[] = []; let pid = 1, fid = 1, sid = 1, gid = 1;
  const baseTile = { terra: T.TERRA, grama: T.GRAMA, areia: T.AREIA, floresta: T.FLORESTA, lama: T.LAMA, metal: T.METAL }[B.tile];
  const jogador = { x: 48, y: 84 }, jipe = { x: 43, y: 83 };
  const ri = (a: number, b: number) => rng.int(a, b);
  const perto = (x: number, y: number, ax: number, ay: number, r: number) => Math.hypot(x - ax, y - ay) < r;
  const fazerSoltos = (): Solto[] => { const r2 = new Rng(`${seed}|${id}|soltos`), tab = SOLTOS[biomaId] ?? SOLTOS.ermo, n = N_SOLTOS[biomaId] ?? 30, out: Solto[] = []; for (let k = 0, t = 0; k < n && t < n * 40; t++) { const x = r2.int(3, W - 4), y = r2.int(3, H - 4); if (!livre(x, y) || out.some(o => Math.abs(o.x - x - 0.5) < 2 && Math.abs(o.y - y - 0.5) < 2)) continue; out.push({ id: 500000 + k, x: x + 0.5, y: y + 0.5, item: r2.peso(tab), q: 1 }); k++; } return out; };

  // ---- terreno
  const estradas = biomaId === 'cidade' ? { xs: [22, 70], ys: [30, 62] } : biomaId === 'ermo' ? { xs: [] as number[], ys: [56] } : biomaId === 'industrial' ? { xs: [40], ys: [48] } : { xs: [] as number[], ys: [] as number[] };
  const naX = (x: number) => estradas.xs.some(r => x >= r && x < r + 3), naY = (y: number) => estradas.ys.some(r => y >= r && y < r + 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let t: number = baseTile;
    if (biomaId === 'ermo' && ruido(x / 16, y / 16) > 0.35) t = T.AREIA;
    if (biomaId === 'floresta' && ruido(x / 11, y / 11) > 0.25) t = T.GRAMA;
    if (biomaId === 'pantano' && ruido2(x / 14, y / 14) > 0.5) t = T.GRAMA;
    if (biomaId === 'industrial' && ruido(x / 20, y / 20) > 0.1) t = T.CONCRETO;
    if (B.agua > 0 && !perto(x, y, jogador.x, jogador.y, 13)) { const v = ruido2(x / 9, y / 9) + ruido(x / 22, y / 22) * 0.5; if (v > 1.0 - B.agua * 1.0) t = T.AGUA_FUNDA; else if (v > 0.7 - B.agua * 1.4) t = T.AGUA_RASA; }
    const ex = naX(x), ey = naY(y);
    if (ex || ey) { t = T.ESTRADA; if (ex && !ey && x % 3 === 1 && estradas.xs.includes(x - 1) && y % 6 < 3) t = T.LINHA_V; if (ey && !ex && y % 3 === 1 && estradas.ys.includes(y - 1) && x % 6 < 3) t = T.LINHA_H; }
    else if (estradas.xs.length + estradas.ys.length && (naX(x - 1) || naX(x + 1) || naY(y - 1) || naY(y + 1))) t = T.CALCADA;
    tipos[idx(x, y)] = t; if (t === T.AGUA_FUNDA) solido[idx(x, y)] = 1;
    if ((t === T.TERRA || t === T.AREIA) && rng.chance(0.01)) tipos[idx(x, y)] = T.ENTULHO;
  }
  // clareira inicial
  for (let y = jogador.y - 6; y <= jogador.y + 5; y++) for (let x = jogador.x - 9; x <= jogador.x + 9; x++) if (dentro(x, y)) { tipos[idx(x, y)] = biomaId === 'industrial' ? T.CONCRETO : baseTile === T.LAMA ? T.GRAMA : baseTile; solido[idx(x, y)] = 0; ocupado[idx(x, y)] = 1; }
  const livre = (x: number, y: number) => dentro(x, y) && !ocupado[idx(x, y)] && !solido[idx(x, y)] && [T.TERRA, T.GRAMA, T.AREIA, T.LAMA, T.FLORESTA, T.METAL, T.CONCRETO, T.ENTULHO].includes(tipos[idx(x, y)] as 0);
  const livreRect = (x: number, y: number, w: number, h: number) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!livre(i, j)) return false; return true; };

  // ---- radiação
  const crateras: [number, number, number][] = [];
  for (let k = 0; k < B.crateras; k++) { for (let t = 0; t < 30; t++) { const x = ri(10, W - 10), y = ri(10, H - 30), r = ri(5, 9); if (!perto(x, y, jogador.x, jogador.y, 28) && crateras.every(c => !perto(x, y, c[0], c[1], 22))) { crateras.push([x, y, r]); break; } } }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = Math.max(0, ruido(x / 18 + 3, y / 18) - 0.3) * 0.55 * B.rad;
    for (const [cx, cy, cr] of crateras) { const d = Math.hypot(x - cx, y - cy); if (d < cr * 1.6) r = Math.max(r, Math.pow(1 - d / (cr * 1.6), 1.4)); }
    if (biomaId === 'pantano' && tipos[idx(x, y)] === T.AGUA_RASA) r = Math.max(r, 0.25 * B.rad);
    rad[idx(x, y)] = Math.min(1, r);
  }

  // ---- prédios
  const prop = (n: string, x: number, y: number, o: 0 | 1 = 0, op: { v?: number; d?: number; solido?: boolean; especial?: boolean; semLoot?: boolean; forcaLoot?: boolean } = {}): Prop | null => {
    const [w, h] = dimProp(n, o); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!dentro(i, j) || ocupado[idx(i, j)] || solido[idx(i, j)] || tipos[idx(i, j)] === T.PORTA) return null;
    const rec: RecProp = { tipo: 'prop', n, v: op.v ?? ri(0, 5), d: op.d ?? rng.f(), o, sem: ri(1, 99999) }, sol = op.solido ?? true, p: Prop = { id: pid++, rec, x, y, w, h, solido: sol, inters: [] };
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { ocupado[idx(i, j)] = 1; if (sol) solido[idx(i, j)] = 1; }
    const tp = CONT[n]; if (tp && !op.semLoot) { p.loot = sortearLoot(tp, () => rng.f(), TEMA && n !== 'lixeira' && rng.chance(TEMA.chance) ? [rng.pick(TEMA.extra)] : []); p.aberto = false; p.inters.push({ k: 'saque', rot: 'Vasculhar ' + ROTULO[n], dur: DUR[n] ?? 2, ruido: 3 }); }
    if (n === 'cama' || n === 'sofa') p.inters.push({ k: 'rasgar', rot: 'Rasgar ' + (n === 'cama' ? 'colchão' : 'sofá'), dur: 1.8, ruido: 3 });
    props.push(p); return p;
  };
  const carro = (x: number, y: number, o: 0 | 1, extra?: string[]) => {
    const p = prop('carro', x, y, o, { v: ri(0, 3) + 5 * ri(0, 5), d: rng.f() }); if (!p) return null; if (rng.chance(0.5) || extra) { p.loot = sortearLoot('carro', () => rng.f(), extra ?? []); p.aberto = false; p.inters.push({ k: 'saque', rot: 'Vasculhar porta-malas', dur: 3, ruido: 3 }); }
    p.inters.push({ k: 'desmontar', rot: 'Desmontar carro', dur: 4, ruido: 6, requer: FERR }); return p;
  };
  const dimPred = (tp: string) => { const d = DIM_PREDIO[tp]; return [ri(d[0], d[1]), ri(d[2], d[3])] as const; };
  const construirPredio = (p: Predio) => {
    const piso = PISO_PREDIO[p.tipo] ?? T.CONCRETO, est = ESTILO_PREDIO[p.tipo] ?? 2;
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
      const borda = x === p.x || y === p.y || x === p.x + p.w - 1 || y === p.y + p.h - 1, i = idx(x, y); ocupado[i] = 1;
      if (borda) { tipos[i] = T.PAREDE; solido[i] = 1; opaco[i] = 1; estilo[i] = est; } else { tipos[i] = piso; interior[i] = 1; rad[i] = 0; }
    }
    if (p.w >= 10 && p.tipo !== 'galpao') { const dx = p.x + Math.floor(p.w / 2), gap = ri(p.y + 2, p.y + p.h - 3); for (let y = p.y + 1; y < p.y + p.h - 1; y++) { const i = idx(dx, y); if (y === gap || y === gap + 1) { ocupado[i] = 1; continue; } tipos[i] = T.PAREDE; solido[i] = 1; opaco[i] = 1; interior[i] = 0; estilo[i] = est; } }
    const lado = Math.abs(p.x + p.w / 2 - W / 2) > Math.abs(p.y + p.h / 2 - H / 2) ? (p.x + p.w / 2 < W / 2 ? 'E' : 'O') : (p.y + p.h / 2 < H / 2 ? 'S' : 'N'), portas: [number, number][] = [];
    const poe = (l: string) => { if (l === 'N') portas.push([ri(p.x + 2, p.x + p.w - 3), p.y]); if (l === 'S') portas.push([ri(p.x + 2, p.x + p.w - 3), p.y + p.h - 1]); if (l === 'O') portas.push([p.x, ri(p.y + 2, p.y + p.h - 3)]); if (l === 'E') portas.push([p.x + p.w - 1, ri(p.y + 2, p.y + p.h - 3)]); };
    poe(lado); if (rng.chance(p.tipo === 'galpao' ? 1 : 0.4)) poe('NSEO'[ri(0, 3)]);
    for (const [x, y] of portas) { const i = idx(x, y); tipos[i] = T.PORTA; solido[i] = 0; opaco[i] = 1; for (const [ax, ay] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) if (dentro(ax, ay)) ocupado[idx(ax, ay)] = 1; }
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
      const i = idx(x, y); if (tipos[i] !== T.PAREDE) continue; const canto = (x === p.x || x === p.x + p.w - 1) && (y === p.y || y === p.y + p.h - 1); if (canto) continue;
      const bd = x === p.x || y === p.y || x === p.x + p.w - 1 || y === p.y + p.h - 1; if (!bd) continue; if ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([ax, ay]) => tipos[idx(ax, ay)] === T.PORTA)) continue;
      const r = rng.f(); if (r < (p.tipo === 'galpao' ? 0.08 : 0.2)) { tipos[i] = T.JANELA; opaco[i] = 0; } else if (r < 0.26 && (biomaId === 'ermo' || biomaId === 'cidade')) { tipos[i] = T.ENTULHO; solido[i] = 0; opaco[i] = 0; } else if (r < 0.31 && biomaId === 'ermo') { tipos[i] = T.RUINA; opaco[i] = 0; }
    }
    // mobília: células encostadas nas paredes
    const lista = MOBILIA[p.tipo] ?? MOBILIA.casa, enc: [number, number][] = [];
    for (let y = p.y + 1; y < p.y + p.h - 1; y++) for (let x = p.x + 1; x < p.x + p.w - 1; x++) { const i = idx(x, y); if (!interior[i] || ocupado[i]) continue; if ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([ax, ay]) => tipos[idx(ax, ay)] === T.PAREDE)) enc.push([x, y]); }
    rng.embaralhar(enc); let n = 0; const alvo = Math.min(enc.length, p.tipo === 'galpao' ? 14 : p.tipo === 'hospital' ? 11 : Math.max(4, Math.floor(enc.length * 0.5)));
    for (const [x, y] of enc) { if (n >= alvo) break; const nome = lista[n % lista.length]; if (['carrinho', 'pneus', 'caixote_militar'].includes(nome) && p.tipo === 'casa') continue; if (prop(nome, x, y, rng.chance(0.5) ? 1 : 0)) n++; }
    // meio do galpão
    if (p.tipo === 'galpao') for (let k = 0; k < 5; k++) { const x = ri(p.x + 3, p.x + p.w - 4), y = ri(p.y + 3, p.y + p.h - 4); prop(rng.pick(['caixa', 'barril', 'caixote_militar', 'pneus']), x, y); }
    if (p.tipo === 'posto') for (let k = 0; k < 2; k++) prop('bomba', p.x + 2 + k * 3, Math.min(H - 2, p.y + p.h + 1), 0, { v: k });
  };

  const gangs: { f: number; x: number; y: number }[] = [];
  const acampamento = (faccao: number, cx: number, cy: number) => {
    const f = FACCOES[faccao]; pois.push({ id: `camp${pois.length}`, tipo: 'acampamento', nome: 'Acampamento: ' + f.nome, x: cx, y: cy, r: 12 });
    for (let j = cy - 7; j <= cy + 7; j++) for (let i = cx - 7; i <= cx + 7; i++) if (dentro(i, j) && Math.hypot(i - cx, j - cy) < 7.5 && !ocupado[idx(i, j)]) { if (tipos[idx(i, j)] === T.ENTULHO) tipos[idx(i, j)] = baseTile; }
    const fogo = prop('fogueira', cx, cy, 0, { solido: false }); if (fogo) { fogo.luz = { r: 7, cor: 0xff9a40, f: 0.25, noite: false }; fogo.inters.push({ k: 'fogueira', rot: 'Usar fogueira', dur: 0.4 }); }
    for (let k = 0; k < ri(2, 3); k++) { const a = rng.range(0, 6.283); prop('barraca', Math.round(cx + Math.cos(a) * 5) - 1, Math.round(cy + Math.sin(a) * 5) - 1, rng.pick([0, 1] as const), { v: ri(0, 2) }); }
    prop('bandeira', cx + 3, cy - 3, 0, { v: faccao, solido: false }); if (faccao === 1) { prop('totem', cx - 3, cy - 3); prop('totem', cx + 4, cy + 3); }
    for (let k = 0; k < ri(2, 3); k++) { const a = rng.range(0, 6.283); const p = prop(faccao === 2 ? 'caixote_militar' : 'bau', Math.round(cx + Math.cos(a) * 3.5), Math.round(cy + Math.sin(a) * 3.5)); if (p) { p.loot = sortearLoot('bau_gangue', () => rng.f(), faccao === 2 ? ['municao', 'kit'] : ['municao']); p.aberto = false; p.inters = [{ k: 'saque', rot: 'Vasculhar ' + (faccao === 2 ? 'caixote' : 'baú') + ' do bando', dur: 2.6, ruido: 4 }]; } }
    for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283; prop(rng.pick(['saco_areia', 'barricada']), Math.round(cx + Math.cos(a) * 7), Math.round(cy + Math.sin(a) * 7), rng.pick([0, 1] as const), { v: ri(0, 2) }); }
    const g = gid++, n = ri(4, 7); for (let k = 0; k < n; k++) { const a = rng.range(0, 6.283), r = rng.range(2, 5); spawns.push({ id: sid++, arq: f.arq, x: Math.round(cx + Math.cos(a) * r), y: Math.round(cy + Math.sin(a) * r), faccao, grupo: g }); }
    gangs.push({ f: faccao, x: cx, y: cy });
  };
  const achaClareira = (r: number, minDist: number) => { for (let t = 0; t < 80; t++) { const x = ri(r + 2, W - r - 2), y = ri(r + 2, H - r - 2); if (perto(x, y, jogador.x, jogador.y, minDist) || pois.some(p => perto(x, y, p.x, p.y, 24))) continue; let ok = true; for (let j = y - r; j <= y + r && ok; j++) for (let i = x - r; i <= x + r; i++) if (Math.hypot(i - x, j - y) <= r && !livre(i, j)) { ok = false; break; } if (ok) return [x, y] as const; } return null; };

  if (biomaId === 'base') return gerarBase();

  const aguaPerto = (x: number, y: number, w: number, h: number) => { for (let j = y - 1; j <= y + h; j++) for (let i = x - 1; i <= x + w; i++) if (dentro(i, j) && (tipos[idx(i, j)] === T.AGUA_RASA || tipos[idx(i, j)] === T.AGUA_FUNDA)) return true; return false; };
  const corredorRua = (x: number, y: number, w: number, h: number) => { for (let j = y - 2; j < y + h + 2; j++) for (let i = x - 2; i < x + w + 2; i++) if (naX(i) || naY(j) || naX(i - 1) || naX(i + 1) || naY(j - 1) || naY(j + 1)) return true; return false; };
  for (let k = 0; k < B.predios * 6 && predios.length < B.predios; k++) {
    const tp = rng.peso(B.tiposPredio), [w, h] = dimPred(tp), x = ri(3, W - w - 3), y = ri(3, H - h - 3);
    if (predios.some(p => x < p.x + p.w + 3 && x + w + 3 > p.x && y < p.y + p.h + 3 && y + h + 3 > p.y) || corredorRua(x, y, w, h) || aguaPerto(x, y, w, h)) continue;
    if (x < jogador.x + 12 && x + w > jogador.x - 12 && y < jogador.y + 8 && y + h > jogador.y - 9) continue;
    const pr: Predio = { x, y, w, h, tipo: tp }; predios.push(pr); construirPredio(pr);
    if (tp === 'hospital') pois.push({ id: `hosp${pois.length}`, tipo: 'hospital', nome: 'Hospital abandonado', x: x + w / 2, y: y + h / 2, r: 12 });
    if (tp === 'posto') pois.push({ id: `posto${pois.length}`, tipo: 'posto', nome: 'Posto de gasolina', x: x + w / 2, y: y + h / 2, r: 10 });
  }
  // rádio de campanha (garantido na Cidade Velha)
  if (id === 'cidade') { const alvos = props.filter(p => p.loot && ['mala', 'armario', 'guarda_roupa', 'caixa'].includes(p.rec.n)); const a = alvos.length ? alvos[Math.floor(rng.f() * alvos.length)] : null; if (a) { a.loot!.unshift('radio'); a.especial = true; } }

  // ---- acampamentos de gangues e pontos de interesse
  for (let g = 0; g < B.gangues; g++) { const c = achaClareira(8, 30); if (c) acampamento(biomaId === 'industrial' ? rng.pick([1, 2]) : biomaId === 'cidade' ? rng.pick([0, 1]) : 0, c[0], c[1]); }
  if (['ermo', 'floresta', 'industrial'].includes(biomaId) && rng.chance(0.8)) {
    const c = achaClareira(6, 28); if (c) { prop('helicoptero', c[0] - 1, c[1] - 1, 0, { solido: true, semLoot: true }); for (let k = 0; k < 2; k++) { const p = prop('caixote_militar', c[0] + 3 + k * 2, c[1] + 2); if (p) { p.loot = sortearLoot('caixote_militar', () => rng.f()); } } pois.push({ id: 'heli', tipo: 'helicoptero', nome: 'Helicóptero caído', x: c[0], y: c[1], r: 12 }); const g = gid++; for (let k = 0; k < 3; k++) spawns.push({ id: sid++, arq: 'irradiado', x: c[0] + ri(-4, 4), y: c[1] + ri(-4, 4), grupo: g }); }
  }

  // ---- props externos
  const solta = (n: string, vezes: number, op: { perto?: [number, number, number]; o?: 0 | 1; luz?: Luz; v?: number } = {}) => {
    for (let k = 0; k < vezes; k++) for (let t = 0; t < 12; t++) {
      let x = ri(2, W - 4), y = ri(2, H - 4); if (op.perto) { const [cx, cy, r] = op.perto; x = Math.round(cx + rng.range(-r, r)); y = Math.round(cy + rng.range(-r, r)); }
      const [w, h] = dimProp(n, op.o ?? 0); if (!livreRect(x, y, w, h)) continue; const p = prop(n, x, y, op.o ?? (rng.pick([0, 1] as const)), { v: op.v }); if (p && op.luz) p.luz = op.luz; break;
    }
  };
  const mapaCarros = B.carros;
  for (let k = 0; k < mapaCarros; k++) for (let t = 0; t < 14; t++) {
    const horiz = rng.chance(0.5); let x: number, y: number;
    if (estradas.xs.length + estradas.ys.length && rng.chance(0.85)) { if (horiz && estradas.ys.length) { const via = rng.pick(estradas.ys); x = ri(3, W - 7); y = via + ri(0, 1); } else if (estradas.xs.length) { const via = rng.pick(estradas.xs); y = ri(3, H - 7); x = via + ri(0, 1); } else continue; } else { x = ri(3, W - 7); y = ri(3, H - 7); }
    const o: 0 | 1 = (naY(y) && !naX(x)) ? 0 : (naX(x) && !naY(y)) ? 1 : (horiz ? 0 : 1), [w, h] = dimProp('carro', o);
    const ruaOk = (i: number, j: number) => [T.ESTRADA, T.LINHA_H, T.LINHA_V].includes(tipos[idx(i, j)] as 1), emRua = estradas.xs.length + estradas.ys.length > 0 && ruaOk(x, y);
    if (emRua) { let ok = true; for (let j = y; j < y + h && ok; j++) for (let i = x; i < x + w; i++) if (!dentro(i, j) || !ruaOk(i, j) || ocupado[idx(i, j)]) { ok = false; break; } if (!ok) continue; } else if (!livreRect(x, y, w, h)) continue;
    if (perto(x, y, jogador.x, jogador.y, 16)) continue; if (carro(x, y, o, k < 2 ? ['combustivel'] : undefined)) break;
  }
  if (B.cidade) { solta('poste', 22, { v: 0 }); solta('hidrante', 8); solta('banco', 6); solta('carrinho', 4); solta('lixeira', 10); solta('lixo', 12); solta('placa', 6); solta('entulho', 14); solta('pneus', 6); }
  else if (biomaId === 'ermo') { solta('barril', 8); solta('pneus', 4); solta('entulho', 14); solta('placa', 3); solta('lixo', 6); for (const [cx, cy, r] of crateras) solta('tambor_toxico', 2, { perto: [cx, cy, r * 1.2] }); }
  else if (biomaId === 'industrial') { solta('container', 10); solta('tanque', 5); solta('barril', 12); solta('tambor_toxico', 6); solta('pneus', 8); solta('gerador', 3); solta('caixote_militar', 4); solta('placa', 4); solta('poste', 6); solta('entulho', 8); }
  else if (biomaId === 'floresta') { solta('lixo', 3); solta('placa', 1); solta('barraca', 1); solta('saco_dormir', 2); }
  else if (biomaId === 'pantano') { solta('barril', 4); solta('tambor_toxico', 6); solta('lixo', 2); }
  for (let k = 0; k < B.cercas; k++) { const o: 0 | 1 = rng.pick([0, 1] as const), x = ri(4, W - 12), y = ri(4, H - 12), n = ri(3, 7); for (let q = 0; q < n; q++) { if (rng.chance(0.15)) continue; const p = prop('cerca', o ? x : x + q, o ? y + q : y, o, { solido: true, semLoot: true }); void p; } }

  // ---- flora (variantes pré-geradas por tipo para reaproveitar texturas)
  const pool = new Map<string, RecFlora[]>();
  const variante = (f: TipoFlora, v: string) => { const k = `${f}|${v}`; let a = pool.get(k); if (!a) { const n = f === 'arvore' ? 6 : f === 'capim' ? 5 : 4; a = Array.from({ length: n }, (_, i) => gerarFlora(new Rng(`${seed}|${id}|${k}|${i}`), f, v)); pool.set(k, a); } return rng.pick(a); };
  const nFlora = Math.round(W * H * B.densFlora);
  for (let k = 0; k < nFlora * 3 && flora.length < nFlora; k++) {
    const x = ri(1, W - 2), y = ri(1, H - 2); if (!livre(x, y)) continue; const cl = ruido(x / 7 + 11, y / 7) * 0.5 + 0.5; if (rng.f() > 0.25 + cl * 0.9) continue;
    if (perto(x, y, jogador.x, jogador.y, 8)) continue; const [f, v] = rng.peso(B.flora.map(([a, b, c]) => [[a, b] as [TipoFlora, string], c] as const)), rec = variante(f, v);
    const jx = x + 0.5 + rng.range(-0.3, 0.3), jy = y + 0.5 + rng.range(-0.3, 0.3), sol = f === 'arvore' || f === 'cacto' || f === 'tronco' || (f === 'pedra' && rec.alt > 0.9);
    flora.push({ id: fid++, rec, x: jx, y: jy, solido: sol, cortavel: f === 'arvore' }); ocupado[idx(x, y)] = 1; if (sol) solido[idx(x, y)] = 1;
  }
  const extras = (f: TipoFlora, v: string, n: number) => { for (let k = 0; k < n; k++) for (let t = 0; t < 10; t++) { const x = ri(1, W - 2), y = ri(1, H - 2); if (!livre(x, y) || perto(x, y, jogador.x, jogador.y, 8)) continue; const rec = variante(f, v); flora.push({ id: fid++, rec, x: x + 0.5, y: y + 0.5, solido: f === 'pedra' && rec.alt > 0.9, cortavel: false }); ocupado[idx(x, y)] = 1; if (f === 'pedra' && rec.alt > 0.9) solido[idx(x, y)] = 1; break; } };
  extras('pedra', '', B.rochas); extras('ossos', '', B.ossos);

  // ---- criaturas
  const nGrupos = Math.round(14 * B.densInimigos), spawnLivre = (x: number, y: number) => dentro(x, y) && !solido[idx(x, y)] && ![T.PORTA, T.PAREDE, T.JANELA, T.AGUA_FUNDA, T.RUINA].includes(tipos[idx(x, y)] as 5) && !perto(x, y, jogador.x, jogador.y, 22);
  const grupo = (arq: string, cx: number, cy: number) => { const g = gid++, [a, b] = GRUPO[arq] ?? [1, 1], n = ri(a, b); for (let k = 0; k < n; k++) for (let t = 0; t < 10; t++) { const x = cx + ri(-2, 2), y = cy + ri(-2, 2); if (spawnLivre(x, y)) { spawns.push({ id: sid++, arq, x, y, grupo: g }); break; } } };
  for (let g = 0; g < nGrupos; g++) { const x = ri(3, W - 4), y = ri(3, H - 4); if (spawnLivre(x, y)) grupo(rng.peso(B.inimigos), x, y); }
  const nFauna = Math.round(12 * B.densFauna); for (let g = 0; g < nFauna; g++) { const x = ri(3, W - 4), y = ri(3, H - 4); if (spawnLivre(x, y)) grupo(rng.peso(B.fauna), x, y); }
  if (rng.chance(B.colosso)) { for (let t = 0; t < 30; t++) { const x = ri(8, W - 8), y = ri(8, H - 20); if (spawnLivre(x, y) && !perto(x, y, jogador.x, jogador.y, 34)) { spawns.push({ id: sid++, arq: 'colosso', x, y, grupo: gid++ }); pois.push({ id: 'colosso', tipo: 'colosso', nome: 'Covil do Colosso', x, y, r: 14 }); break; } } }

  if (TEMA?.garante) { const alvo = props.find(p => p.loot && p.loot.length && p.rec.n !== 'carro'); if (alvo) alvo.loot!.push(TEMA.garante); }
  for (let k = 0, t = 0; k < (B.fontes ?? 0) && t < 120; t++) { const x = ri(6, W - 8), y = ri(6, H - 8); if (perto(x, y, jogador.x, jogador.y, 8)) continue; const p = prop('tanque_agua', x, y, 0, { semLoot: true, v: 1 }); if (p) { p.inters.push({ k: 'fonte', rot: 'Água do reservatório', dur: 1.2 }); k++; } }
  // jipe do jogador
  const j = prop('carro', jipe.x, jipe.y, 0, { v: 4 + 5 * 3, d: 0.1, semLoot: true }); if (j) { j.inters.push({ k: 'jipe', rot: 'Usar o jipe (viajar)', dur: 0.3 }); }
  return { id, nome: nome ?? B.nome, bioma: biomaId, seed, tipos, rad, solido, opaco, estilo, props, flora, spawns, predios, pois, jogador, jipe, soltos: fazerSoltos() };

  // =============================================================== ABRIGO (base do jogador)
  function gerarBase(): Zona {
    const cx0 = 31, cx1 = 65, cy0 = 56, cy1 = 89;
    for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) { tipos[idx(x, y)] = (x + y) % 11 === 0 ? T.TERRA : T.GRAMA; ocupado[idx(x, y)] = 0; solido[idx(x, y)] = 0; }
    const gate = (x: number) => x >= 45 && x <= 49;
    for (let x = cx0; x <= cx1; x++) { for (const y of [cy0, cy1]) { if (y === cy1 && gate(x)) continue; prop('cerca', x, y, 0, { solido: true, semLoot: true }); } }
    for (let y = cy0 + 1; y < cy1; y++) for (const x of [cx0, cx1]) prop('cerca', x, y, 1, { solido: true, semLoot: true });
    const casa: Predio = { x: 35, y: 59, w: 13, h: 9, tipo: 'cabana' }; predios.push(casa);
    for (let y = casa.y; y < casa.y + casa.h; y++) for (let x = casa.x; x < casa.x + casa.w; x++) { const b = x === casa.x || y === casa.y || x === casa.x + casa.w - 1 || y === casa.y + casa.h - 1, i = idx(x, y); ocupado[i] = b ? 1 : 0; if (b) { tipos[i] = T.PAREDE; solido[i] = 1; opaco[i] = 1; estilo[i] = 0; } else { tipos[i] = T.MADEIRA; interior[i] = 1; } }
    const dx = 41, dy = casa.y + casa.h - 1; tipos[idx(dx, dy)] = T.PORTA; solido[idx(dx, dy)] = 0; opaco[idx(dx, dy)] = 1; for (const [ax, ay] of [[dx + 1, dy], [dx - 1, dy], [dx, dy + 1], [dx, dy - 1]]) ocupado[idx(ax, ay)] = 1;
    for (const x of [37, 40, 44, 46]) { const i = idx(x, casa.y); tipos[i] = T.JANELA; opaco[i] = 0; }
    const mk = (n: string, x: number, y: number, o: 0 | 1, k?: Interacao) => { const p = prop(n, x, y, o, { semLoot: true, v: 1 }); if (p && k) p.inters.push(k); return p; };
    mk('cama', 36, 60, 0, { k: 'cama', rot: 'Dormir', dur: 0.3 }); mk('bau', 38, 60, 0, { k: 'bau', rot: 'Abrir baú do abrigo', dur: 0.3 }); mk('bancada', 40, 60, 0, { k: 'bancada', rot: 'Usar a bancada', dur: 0.3 });
    mk('fogao', 42, 60, 0, { k: 'fogueira', rot: 'Cozinhar no fogão', dur: 0.3 }); mk('estante', 44, 60, 0); mk('mesa', 39, 64, 0); mk('cadeira', 38, 64, 1); mk('cadeira', 41, 64, 1); mk('armario', 46, 62, 0); mk('tv', 36, 65, 0);
    for (let y = casa.y + 1; y < casa.y + casa.h - 1; y++) for (let x = casa.x + 1; x < casa.x + casa.w - 1; x++) ocupado[idx(x, y)] = 1; // fecha o interior (sem flora dentro de casa)
    const fogo = mk('fogueira', 54, 74, 0, { k: 'fogueira', rot: 'Usar a fogueira', dur: 0.3 }); if (fogo) { fogo.solido = false; fogo.luz = { r: 8, cor: 0xff9a40, f: 0.25, noite: false }; }
    mk('tanque_agua', 60, 62, 0, { k: 'tanque', rot: 'Coletar água da chuva', dur: 1.2 }); mk('gerador', 33, 72, 0); mk('antena', 62, 58, 0);
    for (let i = 0; i < 4; i++) mk('horta', 56 + (i % 2) * 4, 79 + ((i / 2) | 0) * 4, 0, { k: 'horta', rot: 'Cuidar da horta', dur: 1 });
    for (const x of [44, 50]) { const p = prop('poste', x, 86, 0, { semLoot: true, v: 1 }); if (p) p.luz = { r: 7, cor: 0xffd890, f: 0.1, noite: true }; }
    mk('saco_areia', 51, 86, 0); mk('barricada', 43, 86, 1); mk('lixo', 34, 84, 0);
    const jp = prop('carro', 43, 83, 0, { v: 4 + 5 * 3, d: 0.1, semLoot: true }); if (jp) jp.inters.push({ k: 'jipe', rot: 'Usar o jipe (viajar)', dur: 0.3 });
    // flora dentro e fora
    const poolB: RecFlora[] = ['seco', ''].map((v, i) => gerarFlora(new Rng(`${seed}|base|${v}|${i}`), 'arbusto', v)), capins = [0, 1, 2, 3].map(i => gerarFlora(new Rng(`${seed}|base|c|${i}`), 'capim', '')), arvores = ['morta', 'doente', 'pinheiro'].map((v, i) => gerarFlora(new Rng(`${seed}|base|a|${i}`), 'arvore', v)), pedras = [0, 1, 2].map(i => gerarFlora(new Rng(`${seed}|base|p|${i}`), 'pedra', ''));
    for (let k = 0; k < 900; k++) { const x = ri(1, W - 2), y = ri(1, H - 2), dentroBase = x > cx0 && x < cx1 && y > cy0 && y < cy1; if (!livre(x, y) || (dentroBase && rng.chance(0.85))) continue; if (perto(x, y, jogador.x, jogador.y, 5)) continue; const r = rng.f(), rec = dentroBase ? (r < 0.8 ? rng.pick(capins) : rng.pick(poolB)) : (r < 0.25 ? rng.pick(arvores) : r < 0.5 ? rng.pick(poolB) : r < 0.9 ? rng.pick(capins) : rng.pick(pedras)); const sol = rec.f === 'arvore'; flora.push({ id: fid++, rec, x: x + 0.5 + rng.range(-0.3, 0.3), y: y + 0.5 + rng.range(-0.3, 0.3), solido: sol, cortavel: sol && !dentroBase }); ocupado[idx(x, y)] = 1; if (sol) solido[idx(x, y)] = 1; if (flora.length > 260) break; }
    return { id, nome: nome ?? 'Abrigo', bioma: 'base', seed, tipos, rad, solido, opaco, estilo, props, flora, spawns, predios, pois, jogador: { x: 48, y: 85 }, jipe: { x: 43, y: 83 }, soltos: fazerSoltos() };
  }
}
void ARQS;
