// Cena da viagem de jipe, em pixel art procedural no canvas 2D (sem imagens): céu por hora e clima, sol/lua/estrelas, nuvens, horizonte da cidade de origem
// e de destino em paralaxe (com o "marco" de cada local), beira de estrada, asfalto rolando, o jipe animado (rodas girando, suspensão, faróis, freio,
// fumaça e poeira), chuva e raios. Tudo é desenhado com retângulos inteiros: a cena fica nítida em qualquer escala inteira.
import { Rng } from './rng';
import { hash3 } from './cor';
import { localPorId } from '../dados/locais';
import { P_PARADA } from '../sistemas/rota';

export type ClimaViagem = 'limpo' | 'nublado' | 'vento' | 'chuva' | 'tempestade' | 'neblina' | 'poeira' | 'acida';
export type OpcViagem = { de: string; para: string; hora: number; clima: ClimaViagem; seed: string; w: number; h: number; /** comprimento nominal da estrada em px de arte (≈ 60 × segundos a toda a velocidade): bioma e marcos se distribuem por ele */ total?: number; /** fábrica de canvas fora da tela, para o marco do destino crescer ao chegar; sem ela o marco é desenhado direto */ criar?: (w: number, h: number) => { alvo: CanvasImageSource; g: CanvasRenderingContext2D } | null };
/** estado a cada quadro: tempo (s), distância rodada (px de arte), velocidade 0..1, freando, progresso 0..1 da rota e se há um obstáculo à frente (evento) */
export type EstadoViagem = { t: number; dist: number; vel: number; freio: boolean; p: number; obstaculo: boolean };
type G = CanvasRenderingContext2D;

// ---------------------------------------------------------------- cores e retângulos
const mix = (a: number, b: number, t: number) => { const k = Math.max(0, Math.min(1, t)); return (Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k) << 16) | (Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k) << 8) | Math.round((a & 255) * (1 - k) + (b & 255) * k); };
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const R = (g: G, c: number, x: number, y: number, w: number, h: number, a = 1) => { if (w <= 0 || h <= 0) return; if (a < 1) g.globalAlpha = a; g.fillStyle = hex(c); g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); if (a < 1) g.globalAlpha = 1; };
const disco = (g: G, c: number, cx: number, cy: number, r: number, a = 1) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6)); R(g, c, cx - w, cy + y, w * 2 + 1, 1, a); } };

// ---------------------------------------------------------------- fonte 3x5 (placas e letreiros)
const FONTE: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
  '-': '000000111000000', '.': '000000000000010', ' ': '000000000000000', '>': '100010001010100', '!': '010010010000010',
};
export const larguraTexto = (s: string) => s.length * 4 - 1;
/** escreve `s` (A–Z, 0–9, sem acento) com a fonte 3x5 em (x, y) */
export function texto(g: G, s: string, x: number, y: number, c: number, a = 1) {
  const t = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); let cx = x;
  for (const ch of t) { const f = FONTE[ch] ?? FONTE[' ']; for (let i = 0; i < 15; i++) if (f[i] === '1') R(g, c, cx + (i % 3), y + Math.floor(i / 3), 1, 1, a); cx += 4; }
}

// ---------------------------------------------------------------- céu
const CEU: [number, number, number][] = [[0, 0x05070f, 0x0c1326], [5, 0x1a1f3a, 0x6a4a5a], [6.5, 0x6a5a6a, 0xd98a4a], [8, 0x7a8590, 0xc9c2a4], [12, 0x8a949a, 0xd0cbb0], [17, 0x8a8a90, 0xd9a05a], [19, 0x4a3a5a, 0xe0703a], [21, 0x10142a, 0x3a2a4a], [24, 0x05070f, 0x0c1326]];
export function ceuEm(h: number): [number, number] {
  const x = ((h % 24) + 24) % 24; for (let i = 1; i < CEU.length; i++) if (x <= CEU[i][0]) { const a = CEU[i - 1], b = CEU[i], t = (x - a[0]) / (b[0] - a[0]); return [mix(a[1], b[1], t), mix(a[2], b[2], t)]; } return [CEU[0][1], CEU[0][2]];
}
const noiteDe = (h: number) => { const x = ((h % 24) + 24) % 24; return x >= 21 || x < 5 ? 1 : x >= 19 ? (x - 19) / 2 : x < 6.5 ? 1 - (x - 5) / 1.5 : 0; };
/** quanto o clima escurece e acinzenta o céu (0..1) e o tom que ele puxa */
const CLIMA: Record<ClimaViagem, [number, number]> = { limpo: [0, 0], nublado: [0.3, 0x5a5f65], vento: [0.12, 0x80807a], chuva: [0.45, 0x474c52], tempestade: [0.7, 0x2c3036], neblina: [0.4, 0x8a8f90], poeira: [0.35, 0xa88548], acida: [0.3, 0x6a8a3a] };

// ---------------------------------------------------------------- horizonte: faixas repetidas por bioma (determinísticas)
type Bloco = { x: number; w: number; h: number; tipo: string; v: number };
type Cam = 'longe' | 'perto';
const MENUS: Record<string, Record<Cam, [string, number][]>> = {
  cidade: { longe: [['torre', 5], ['predio', 3], ['guindaste', 1]], perto: [['predio', 4], ['ruina', 3], ['outdoor', 2]] },
  industrial: { longe: [['chamine', 4], ['tanque', 4], ['trelica', 2], ['predio', 1]], perto: [['tanque', 3], ['container', 4], ['ruina', 1]] },
  floresta: { longe: [['monte', 4], ['pinheiro', 6], ['arvore', 3]], perto: [['pinheiro', 4], ['arvore', 5], ['arbusto', 3]] },
  pantano: { longe: [['monte', 3], ['salgueiro', 5], ['arvore', 2]], perto: [['salgueiro', 4], ['cogumelo', 4], ['arbusto', 3]] },
  ermo: { longe: [['monte', 5], ['pilone', 3], ['ruina', 2]], perto: [['ruina', 3], ['arvore', 3], ['poste', 3], ['pedra', 2]] },
  base: { longe: [['monte', 4], ['pilone', 2], ['torre_vigia', 1]], perto: [['cerca', 4], ['arvore', 3], ['arbusto', 3]] },
};
/** faixa contínua de horizonte (não repete): usa o menu da origem até `xb` e o do destino depois; gera até `fim` */
function faixa(a: string, b: string, cam: Cam, seed: string, xb: number, fim: number): Bloco[] {
  const rng = new Rng(`${seed}|${a}>${b}|${cam}`), out: Bloco[] = [], grande = cam === 'longe'; let x = -50 + rng.int(0, 14);
  while (x < fim) { const menu = (MENUS[x < xb ? a : b] ?? MENUS.ermo)[cam], tipo = rng.peso(menu), w = tipo === 'torre' ? rng.int(14, 24) : tipo === 'monte' ? rng.int(40, 90) : tipo === 'predio' ? rng.int(18, 34) : tipo === 'chamine' ? rng.int(5, 8) : tipo === 'tanque' ? rng.int(16, 26) : tipo === 'guindaste' ? 26 : tipo === 'trelica' ? 22 : rng.int(9, 18), h = tipo === 'torre' ? rng.int(34, 78) : tipo === 'predio' ? rng.int(16, grande ? 40 : 30) : tipo === 'chamine' ? rng.int(40, 70) : tipo === 'monte' ? rng.int(10, 26) : tipo === 'tanque' ? rng.int(12, 22) : rng.int(10, 30); out.push({ x, w, h, tipo, v: rng.int(0, 999) }); x += w + rng.int(grande ? 2 : 8, grande ? 20 : 46); }
  return out;
}
function bloco(g: G, b: Bloco, x: number, y: number, cor: number, noite: number, t: number, sombra: number) {
  const c = cor, esc = mix(c, 0x000000, 0.25), lit = (i: number) => (hash3(b.v, i, 7) < 0.22 + noite * 0.1 && noite > 0.35);
  switch (b.tipo) {
    case 'torre': case 'predio': { R(g, c, x, y - b.h, b.w, b.h); R(g, esc, x, y - b.h, 2, b.h); if (b.v % 3 === 0) R(g, 0x000000, x + b.w - 5, y - b.h, 5, 3, 0); R(g, mix(c, 0xffffff, 0.12), x + 2, y - b.h, b.w - 2, 1); for (let j = 4; j < b.h - 2; j += 4) for (let i = 3; i < b.w - 2; i += 4) { if (lit(j * 31 + i)) R(g, 0xe8c76a, x + i, y - b.h + j, 2, 2, 0.9); else if (hash3(b.v, j * 31 + i, 9) < 0.6) R(g, esc, x + i, y - b.h + j, 2, 2, 0.55); } if (b.tipo === 'torre') { R(g, esc, x + (b.w >> 1), y - b.h - 5, 1, 5); if (b.v % 2) R(g, 0xff3a1a, x + (b.w >> 1), y - b.h - 6, 1, 1, Math.sin(t * 4 + b.v) > 0 ? 1 : 0.2); } else R(g, esc, x - 1, y - b.h - 1, b.w + 2, 1); break; }
    case 'guindaste': R(g, esc, x + 4, y - b.h, 2, b.h); R(g, esc, x, y - b.h, b.w, 2); R(g, esc, x + 20, y - b.h + 2, 1, 10); break;
    case 'chamine': R(g, c, x, y - b.h, b.w, b.h); for (let j = 0; j < b.h; j += 8) R(g, j % 16 ? 0xb0b0a8 : 0xa8322a, x, y - b.h + j, b.w, 4, 0.9); for (let k = 0; k < 4; k++) disco(g, mix(sombra, 0x6a6a66, 0.5), x + (b.w >> 1) + Math.sin(t + k + b.v) * 3 + k * 2, y - b.h - 3 - k * 5 - ((t * 6 + k * 3) % 3), 2 + k, 0.35); break;
    case 'tanque': R(g, c, x, y - b.h, b.w, b.h); R(g, esc, x, y - b.h, b.w, 2); R(g, esc, x + b.w - 3, y - b.h, 3, b.h); R(g, c, x + 2, y - b.h - 2, b.w - 4, 2); break;
    case 'trelica': for (let j = 0; j < 4; j++) { R(g, esc, x, y - 8 - j * 8, b.w, 1); R(g, esc, x + j * 5, y - 8 - j * 8, 1, 8); } R(g, esc, x, y - 32, 1, 32); R(g, esc, x + b.w - 1, y - 32, 1, 32); break;
    case 'monte': { const w = b.w, h = b.h; for (let j = 0; j < h; j++) { const k = Math.floor((1 - j / h) * (w / 2)); R(g, j > h * 0.72 ? esc : c, x + k, y - h + j, w - k * 2, 1); if (j === 2 || j === 3) R(g, mix(c, 0xffffff, 0.22), x + k + 1, y - h + j, Math.max(0, w - k * 2 - 2), 1, 0.7); } break; }
    case 'pilone': R(g, esc, x + 4, y - 24, 1, 24); R(g, esc, x + 1, y - 22, 7, 1); R(g, esc, x + 2, y - 18, 5, 1); R(g, esc, x - 40, y - 21, 40, 1, 0.5); break;
    case 'pinheiro': R(g, esc, x + (b.w >> 1), y - 4, 1, 4); for (let j = 0; j < 4; j++) R(g, c, x + j * 2, y - 6 - j * 5, b.w - j * 4, 5); R(g, c, x + (b.w >> 1) - 1, y - 28, 2, 4); break;
    case 'arvore': R(g, esc, x + (b.w >> 1), y - b.h, 1, b.h); R(g, esc, x + (b.w >> 1) - 4, y - b.h + 5, 4, 1); R(g, esc, x + (b.w >> 1) + 1, y - b.h + 8, 5, 1); R(g, esc, x + (b.w >> 1) - 3, y - b.h + 11, 3, 1); break;
    case 'salgueiro': R(g, esc, x + 5, y - 14, 2, 14); for (let k = 0; k < 6; k++) R(g, c, x + k * 2, y - 14 + (k % 2) * 2, 1, 10 + (k % 3) * 2); R(g, c, x + 1, y - 16, 10, 3); break;
    case 'cogumelo': R(g, 0xd9c48a, x + 3, y - 4, 2, 4); R(g, 0x7ae35a, x, y - 7, 8, 3, 0.9 - Math.sin(t * 2 + b.v) * 0.2); break;
    case 'arbusto': R(g, c, x, y - 5, b.w, 5); R(g, esc, x + 2, y - 3, b.w - 4, 3); break;
    case 'ruina': R(g, c, x, y - b.h, b.w, b.h); R(g, 0x000000, x + 3, y - b.h + 4, 3, 4, 0.7); R(g, mix(c, 0x000000, 0.4), x - 1, y - b.h, 4, 4); R(g, c, x + b.w - 5, y - b.h - 3, 5, 3); break;
    case 'poste': R(g, esc, x + 4, y - 24, 1, 24); R(g, esc, x + 1, y - 23, 7, 1); R(g, 0xffd890, x + 1, y - 22, 2, 1, noite > 0.5 ? 1 : 0); break;
    case 'pedra': R(g, c, x, y - 5, 7, 5); R(g, esc, x + 4, y - 7, 5, 7); break;
    case 'container': R(g, [0x6a3a2a, 0x2f4a5a, 0x5a6a3a][b.v % 3], x, y - 9, 18, 9); for (let i = 3; i < 18; i += 4) R(g, esc, x + i, y - 9, 1, 9); break;
    case 'cerca': for (let i = 0; i < b.w; i += 3) R(g, esc, x + i, y - 8, 1, 8); R(g, esc, x, y - 6, b.w, 1); break;
    case 'torre_vigia': R(g, esc, x + 2, y - 20, 2, 20); R(g, c, x - 1, y - 26, 8, 6); R(g, 0xe8c76a, x + 1, y - 24, 3, 2, noite > 0.4 ? 1 : 0.2); break;
    case 'outdoor': R(g, esc, x + 3, y - 14, 2, 14); R(g, esc, x + 11, y - 14, 2, 14); R(g, 0x2a2e33, x, y - 24, 16, 10); texto(g, 'CINZAS', x + 1, y - 21, 0xd9a02b); break;
    default: R(g, c, x, y - b.h, b.w, b.h);
  }
}

// ---------------------------------------------------------------- marcos: o "sprite da cidade" de cada local (aparece perto do fim da viagem)
export function marco(g: G, id: string, x: number, y: number, t: number, noite: number, rot = true) {
  const luz = (cx: number, cy: number, c = 0xe8c76a) => R(g, c, cx, cy, 2, 2, noite > 0.35 ? 0.95 : 0.35), pisca = (cx: number, cy: number, c: number) => R(g, c, cx, cy, 2, 2, Math.sin(t * 5 + cx) > 0 ? 1 : 0.15);
  const janelas = (bx: number, by: number, w: number, h: number) => { for (let j = 4; j < h - 2; j += 5) for (let i = 3; i < w - 2; i += 5) if (hash3(bx + i, by + j, 3) < 0.7) luz(bx + i, by - h + j); };
  switch (id) {
    case 'base': R(g, 0x6a5a45, x, y - 14, 22, 14); R(g, 0x4a3a2a, x - 2, y - 18, 26, 5); R(g, 0x1a1410, x + 9, y - 8, 5, 8); luz(x + 3, y - 10); luz(x + 16, y - 10); for (let i = -10; i < 40; i += 4) R(g, 0x4a4a46, x + i, y - 8, 1, 8); R(g, 0x4a4a46, x - 10, y - 6, 50, 1); R(g, 0x4a4d50, x + 32, y - 34, 1, 34); pisca(x + 31, y - 36, 0xff3a1a); break;
    case 'ermo': R(g, 0x5a5a52, x, y - 12, 18, 12); R(g, 0x1a1410, x + 6, y - 9, 5, 9); R(g, 0x5a5a52, x + 14, y - 16, 4, 4); for (let k = 0; k < 3; k++) R(g, 0x3a3226, x + 26 + k * 8, y - 18 + k * 2, 1, 18 - k * 2); R(g, 0x3a3226, x + 24, y - 14, 10, 1); disco(g, 0x2a251c, x + 50, y - 1, 6, 0.8); if (rot) texto(g, 'ERMO', x + 4, y - 26, 0xd0cbb0); break;
    case 'floresta': for (let k = 0; k < 5; k++) { R(g, 0x2c3a26, x + k * 9, y - 18 - (k % 2) * 6, 7, 18 + (k % 2) * 6); R(g, 0x3a4a30, x + k * 9 - 2, y - 24 - (k % 2) * 6, 11, 6); } R(g, 0x5a4028, x + 14, y - 12, 18, 12); R(g, 0x3a2a1a, x + 12, y - 16, 22, 5); luz(x + 20, y - 8, 0xffa040); for (let k = 0; k < 3; k++) disco(g, 0x6a6a66, x + 28 + k * 3 + Math.sin(t + k) * 2, y - 20 - k * 6, 2 + k, 0.4); break;
    case 'cidade': { const L: [number, number, number][] = [[0, 16, 44], [18, 14, 62], [34, 20, 50], [56, 16, 70], [74, 22, 38]]; for (const [dx, w, h] of L) { R(g, 0x4a4f55, x + dx, y - h, w, h); R(g, 0x383c41, x + dx, y - h, 2, h); janelas(x + dx, y, w, h); R(g, 0x383c41, x + dx + (w >> 1), y - h - 4, 1, 4); } pisca(x + 63, y - 74, 0xff3a1a); if (rot) texto(g, 'CIDADE VELHA', x - 6, y + 4, 0xd0cbb0); break; }
    case 'pantano': R(g, 0x4a3a28, x + 6, y - 12, 14, 8); R(g, 0x3a2a1a, x + 4, y - 16, 18, 5); for (const k of [0, 5, 19, 24]) R(g, 0x3a2a1a, x + k, y - 6, 1, 6); luz(x + 12, y - 10, 0xffa040); for (let k = 0; k < 4; k++) { R(g, 0x7ae35a, x + 30 + k * 6, y - 5 - (k % 2) * 3, 3, 2, 0.9 - Math.sin(t * 2 + k) * 0.3); } R(g, 0x3a4a30, x - 8, y - 20, 2, 20); for (let k = 0; k < 4; k++) R(g, 0x3a4a30, x - 12 + k * 2, y - 20, 1, 12); break;
    case 'industrial': for (const [dx, h] of [[0, 56], [10, 48], [20, 60]] as const) { R(g, 0x56595c, x + dx, y - h, 6, h); for (let j = 0; j < h; j += 8) R(g, j % 16 ? 0xb0b0a8 : 0xa8322a, x + dx, y - h + j, 6, 4); } for (let k = 0; k < 3; k++) { R(g, 0x4a4d50, x + 34 + k * 14, y - 20, 12, 20); R(g, 0x383c41, x + 34 + k * 14, y - 22, 12, 3); } R(g, 0xff9a30, x + 21, y - 66 - Math.round(Math.sin(t * 9) * 2), 3, 5, 0.9); disco(g, 0xff7a20, x + 22, y - 64, 6, 0.18); if (rot) texto(g, 'REFINARIA 9', x - 2, y + 4, 0xd0cbb0); break;
    case 'posto': R(g, 0x8a8478, x, y - 20, 34, 3); R(g, 0xa8322a, x, y - 23, 34, 3); R(g, 0x6a6a64, x + 3, y - 17, 2, 17); R(g, 0x6a6a64, x + 29, y - 17, 2, 17); R(g, 0xb8b4a4, x + 10, y - 12, 4, 12); R(g, 0xb8b4a4, x + 20, y - 12, 4, 12); R(g, 0x4a4d50, x + 44, y - 30, 2, 30); R(g, 0x2a2e33, x + 38, y - 36, 14, 8); texto(g, 'POSTO', x + 39, y - 33, 0xffd890); R(g, 0x5a4a3a, x + 56, y - 10, 12, 10); luz(x + 60, y - 7); break;
    case 'hospital': R(g, 0x8a8f90, x, y - 40, 40, 40); R(g, 0x6a6f70, x, y - 40, 40, 3); janelas(x, y, 40, 40); R(g, 0xe0553f, x + 17, y - 38, 6, 2); R(g, 0xe0553f, x + 19, y - 40, 2, 6); R(g, 0x1a1410, x + 16, y - 8, 8, 8); R(g, 0xd8d4c8, x + 46, y - 10, 14, 8); R(g, 0xe0553f, x + 52, y - 9, 2, 6); pisca(x + 59, y - 12, 0x5a8aff); break;
    case 'torre': for (let j = 0; j < 8; j++) { const w = 12 - j; R(g, 0x6a6e72, x + 6 + (12 - w) / 2 - 6, y - 8 - j * 8, w, 1); R(g, 0x6a6e72, x + 6 + (12 - w) / 2 - 6, y - 8 - j * 8, 1, 8); R(g, 0x6a6e72, x + 6 + (12 - w) / 2 - 6 + w - 1, y - 8 - j * 8, 1, 8); } R(g, 0x6a6e72, x + 2, y - 8, 20, 8); R(g, 0x383c41, x + 8, y - 6, 8, 6); pisca(x + 11, y - 74, 0xff3a1a); pisca(x + 11, y - 38, 0xff3a1a); R(g, 0x6a6e72, x + 11, y - 78, 1, 6); if (rot) texto(g, 'TORRE', x - 2, y + 4, 0xd0cbb0); break;
    case 'militar': R(g, 0x586048, x, y - 14, 36, 14); R(g, 0x3a4228, x, y - 16, 36, 3); R(g, 0x1a1c14, x + 14, y - 9, 8, 9); for (const dx of [-8, 44]) { R(g, 0x4a5238, x + dx, y - 22, 3, 22); R(g, 0x586048, x + dx - 2, y - 28, 7, 6); luz(x + dx, y - 26, 0xffd890); } R(g, 0x4a3a2a, x + 18, y - 40, 1, 26); R(g, 0xa8322a, x + 19, y - 40, 8, 5); for (let i = -16; i < 54; i += 3) R(g, 0x4a4a46, x + i, y - 4, 1, 4, 0.7); if (rot) texto(g, 'POSTO MILITAR', x - 8, y + 4, 0xd0cbb0); break;
    case 'abrigo7': R(g, 0x4a4d50, x - 14, y - 36, 70, 36); R(g, 0x383c41, x - 14, y - 36, 70, 4); R(g, 0x2a2e33, x + 10, y - 26, 22, 26); R(g, 0x6a6e72, x + 12, y - 24, 18, 24); R(g, 0x2a2e33, x + 21, y - 24, 1, 24); disco(g, 0x2a2e33, x + 21, y - 12, 5); pisca(x + 6, y - 30, 0x5dff9a); pisca(x + 34, y - 30, 0x5dff9a); if (rot) texto(g, 'ABRIGO 7', x + 6, y + 4, 0x8fe36a); break;
    default: R(g, 0x4a4f55, x, y - 24, 26, 24); janelas(x, y, 26, 24);
  }
}

/** ícone do local para o mapa: o marco sem rótulos, recortado ao conteúdo e ajustado a w×h (só no navegador) */
export function desenharIcone(g: G, id: string, w: number, h: number) {
  if (typeof document === 'undefined') return; const oc = document.createElement('canvas'); oc.width = 128; oc.height = 112; const og = oc.getContext('2d'); if (!og) return;
  marco(og, id, 24, 96, 0.3, 0, false); const d = og.getImageData(0, 0, 128, 112).data; let x0 = 128, y0 = 112, x1 = -1, y1 = -1;
  for (let y = 0; y < 112; y++) for (let x = 0; x < 128; x++) if (d[(y * 128 + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return; const bw = x1 - x0 + 1, bh = y1 - y0 + 1, esc = Math.min(w / bw, h / bh, 2), dw = Math.max(1, Math.round(bw * esc)), dh = Math.max(1, Math.round(bh * esc));
  g.clearRect(0, 0, w, h); g.imageSmoothingEnabled = esc < 1; g.drawImage(oc, x0, y0, bw, bh, Math.round((w - dw) / 2), h - dh, dw, dh);
}

// ---------------------------------------------------------------- jipe
type Part = { x: number; y: number; vx: number; vy: number; v: number; vida: number; tam: number; cor: number };
function roda(g: G, cx: number, cy: number, ang: number) {
  disco(g, 0x101012, cx, cy, 4); disco(g, 0x6a6a68, cx, cy, 2);
  for (let k = 0; k < 4; k++) { const a = ang + (k * Math.PI) / 2; R(g, 0x2a2a2c, cx + Math.round(Math.cos(a) * 2.6), cy + Math.round(Math.sin(a) * 2.6), 1, 1); R(g, 0x2a2a2c, cx + Math.round(Math.cos(a) * 1.4), cy + Math.round(Math.sin(a) * 1.4), 1, 1); }
  R(g, 0x2a2a2c, cx, cy, 1, 1);
}
function jipe(g: G, x: number, y: number, e: EstadoViagem, noite: number) {
  const bob = Math.round(Math.sin(e.t * 15) * 0.9 * e.vel) + (e.freio && e.vel > 0.1 ? 1 : 0), bob2 = Math.round(Math.sin(e.t * 15 + 1.7) * 0.9 * e.vel), ang = e.dist * 0.42;
  R(g, 0x000000, x + 2, y + 16, 34, 2, 0.35);
  roda(g, x + 9, y + 13 + bob2, ang); roda(g, x + 28, y + 13 + bob, ang);
  disco(g, 0x1a1c18, x - 1, y + 8 + bob2, 4); disco(g, 0x3a3a38, x - 1, y + 8 + bob2, 2); /* estepe */
  R(g, 0x4a5238, x + 1, y + 5 + bob, 36, 8); R(g, 0x5a6248, x + 1, y + 5 + bob, 36, 2); R(g, 0x3a4228, x + 1, y + 11 + bob, 36, 2); R(g, 0x4a5238, x + 26, y + 3 + bob, 12, 4); /* capô */
  R(g, 0x4a5238, x + 9, y - 3 + bob, 17, 8); R(g, 0x3a4228, x + 9, y - 3 + bob, 17, 1); R(g, 0x1f2a31, x + 11, y - 1 + bob, 6, 5); R(g, 0x1f2a31, x + 18, y - 1 + bob, 5, 5); R(g, 0x6a8a98, x + 12, y - 1 + bob, 2, 1, 0.8); R(g, 0x2a2a2a, x + 9, y - 5 + bob, 17, 1); R(g, 0x2a2a2a, x + 10, y - 5 + bob, 1, 2); R(g, 0x2a2a2a, x + 25, y - 5 + bob, 1, 2); /* para-brisa/teto/rack */
  R(g, 0x2a2a2c, x + 37, y + 9 + bob, 2, 4); R(g, 0x7a7a74, x + 37, y + 9 + bob, 2, 1); /* para-choque */
  R(g, 0xffe9a0, x + 37, y + 5 + bob, 2, 2); R(g, e.freio ? 0xff4a2a : 0xa8322a, x + 1, y + 6 + bob, 2, 2); if (e.freio) R(g, 0xff3a1a, x - 3, y + 5 + bob, 4, 4, 0.25);
  if (noite > 0.3) { for (let k = 0; k < 4; k++) R(g, 0xffe9a0, x + 39, y + 5 + bob + (k - 1), 14 + k * 8, 2, 0.14 * noite); }
}

// ---------------------------------------------------------------- a cena
export function criarCenaViagem(o: OpcViagem) {
  const { w, h } = o, A = localPorId(o.de), B = localPorId(o.para), hz = Math.floor(h * 0.56), estrada0 = Math.floor(h * 0.74), estrada1 = Math.floor(h * 0.9), carX = Math.floor(w * 0.26), carY = Math.floor((estrada0 + estrada1) / 2) - 8, D = Math.max(120, o.total ?? 360);
  const PAR = { longe: 0.14, perto: 0.4, beira: 0.62 }, xb = (par: number) => w * 0.5 + par * D * 0.55, fim = (par: number) => par * D * 1.1 + w + 90; // a fronteira entre os biomas cruza o meio da tela a 55% da viagem
  const faixas = { longe: faixa(A.bioma, B.bioma, 'longe', o.seed, xb(PAR.longe), fim(PAR.longe)), perto: faixa(A.bioma, B.bioma, 'perto', o.seed, xb(PAR.perto), fim(PAR.perto)) };
  const noite = noiteDe(o.hora), [topo0, base0] = ceuEm(o.hora), [escuro, tom] = CLIMA[o.clima], topo = mix(mix(topo0, tom, escuro * 0.8), 0x000000, escuro * 0.25 * (1 - noite)), base = mix(mix(base0, tom, escuro * 0.8), 0x000000, escuro * 0.2 * (1 - noite));
  const solo = ({ ermo: 0x6a604c, base: 0x4c5a30, floresta: 0x3a3a28, cidade: 0x4a4a44, pantano: 0x2f3624, industrial: 0x3a3d3f } as Record<string, number>)[B.bioma] ?? 0x5a5040;
  const estrelas = Array.from({ length: 46 }, (_, i) => [hash3(i, 1, 5) * w, hash3(i, 2, 5) * hz * 0.8, hash3(i, 3, 5)] as const), nuvens = Array.from({ length: 7 }, (_, i) => ({ x: hash3(i, 4, 6) * (w + 80), y: 6 + hash3(i, 5, 6) * hz * 0.45, w: 18 + hash3(i, 6, 6) * 30 }));
  const parts: Part[] = []; let raio = 0, proxRaio = 3 + Math.random() * 4;
  const rng = new Rng(o.seed + '|cena');
  /** desenha a faixa de horizonte (lista contínua) deslocada pelo paralaxe `par` */
  const desenharFaixa = (g: G, lista: Bloco[], par: number, dist: number, yBase: number, cor: number, t: number) => { const off = dist * par; for (const b of lista) { const x = b.x - off; if (x < -100 || x > w + 10) continue; bloco(g, b, Math.round(x), yBase, cor, noite, t, base); } };
  const fora = o.criar?.(128, 112) ?? null; // o marco é pintado fora da tela e desenhado em escala: cresce no horizonte conforme o jipe chega
  const desenharMarco = (g: G, id: string, cx: number, esc: number, t: number, nevoa: number) => {
    if (!fora) { if (esc > 0.9) marco(g, id, Math.round(cx - 40), hz + 2, t, noite); return; }
    const f = fora.g; f.clearRect(0, 0, 128, 112); marco(f, id, 24, 96, t, noite);
    if (nevoa > 0) { f.globalCompositeOperation = 'source-atop'; R(f, mix(base, 0x6a7078, 0.3), 0, 0, 128, 112, Math.min(0.85, nevoa)); f.globalCompositeOperation = 'source-over'; }
    g.drawImage(fora.alvo, 0, 0, 128, 112, Math.round(cx - 64 * esc), hz + 2 - Math.round(96 * esc), Math.round(128 * esc), Math.round(112 * esc));
  };
  return {
    /** desenha um quadro; `parts` guarda poeira e fumaça */
    desenhar(g: G, e: EstadoViagem, dt: number) {
      g.imageSmoothingEnabled = false; const { t, dist, vel } = e, q = Math.min(1, dist / D);
      // céu em faixas
      const N = 10; for (let k = 0; k < N; k++) R(g, mix(topo, base, Math.pow(k / (N - 1), 1.1)), 0, Math.floor((hz * k) / N), w, Math.ceil(hz / N) + 1);
      if (noite > 0.4) for (const [sx, sy, f] of estrelas) if (f > 0.35) R(g, 0xffffff, sx, sy, 1, 1, (0.4 + 0.5 * Math.abs(Math.sin(t * 1.5 + f * 9))) * noite * (1 - escuro));
      // sol / lua
      const hr = ((o.hora % 24) + 24) % 24, dia = hr >= 6 && hr <= 20, u = dia ? (hr - 6) / 14 : (((hr - 20 + 24) % 24) / 10); const ax = w * (0.1 + 0.8 * u), ay = hz * (0.95 - 0.8 * Math.sin(Math.PI * Math.min(1, u)));
      if (dia) { disco(g, 0xf0c060, ax, ay, 4, 1 - escuro * 0.8); disco(g, 0xf0c060, ax, ay, 8, 0.12 * (1 - escuro)); } else { disco(g, 0xd8dccc, ax, ay, 3, 1 - escuro * 0.8); disco(g, base, ax + 2, ay - 1, 2); }
      for (const n of nuvens) { const cx = ((n.x - dist * 0.04) % (w + 80) + w + 80) % (w + 80) - 40, c = mix(base, 0xffffff, 0.25 - noite * 0.2 - escuro * 0.2); R(g, c, cx, n.y, n.w, 3, 0.85); R(g, c, cx + 4, n.y - 2, n.w - 10, 2, 0.85); R(g, mix(c, 0x000000, 0.2), cx + 2, n.y + 3, n.w - 6, 1, 0.8); }
      // horizonte: faixa distante, chão, os marcos (a origem fica para trás, o destino cresce à frente) e a faixa próxima
      const bruma = mix(mix(0x3c4146, base, 0.55), 0x000000, noite * 0.55);
      R(g, mix(solo, base, 0.35), 0, hz, w, h - hz); R(g, bruma, 0, hz - 2, w, 3, 0.6);
      desenharFaixa(g, faixas.longe, PAR.longe, dist, hz, mix(mix(0x4a5058, base, 0.4), 0x000000, noite * 0.55), t);
      R(g, mix(solo, base, 0.15), 0, hz + 2, w, h - hz - 2); R(g, mix(solo, 0x000000, 0.2), 0, hz + 2, w, 1);
      const eo = 1 - Math.min(0.55, q * 1.2), xo = w * 0.3 - q * w * 0.62, ed = 0.38 + 0.62 * Math.pow(q, 1.5), xd = w * (0.92 - 0.3 * Math.pow(q, 0.8));
      if (xo > -70) desenharMarco(g, A.id, xo, eo, t, (1 - eo) * 0.8);
      desenharMarco(g, B.id, xd, ed, t, (1 - ed) * 0.9);
      desenharFaixa(g, faixas.perto, PAR.perto, dist, Math.floor(hz + (estrada0 - hz) * 0.55), mix(mix(0x3a4036, solo, 0.4), 0x000000, noite * 0.6), t);
      // chão e beira da estrada
      for (let k = 0; k < 6; k++) { const gy = hz + 4 + Math.floor((k * (estrada0 - hz - 4)) / 6); R(g, mix(solo, 0x000000, 0.1 + k * 0.03 + noite * 0.3), 0, gy, w, Math.ceil((estrada0 - hz - 4) / 6) + 1); }
      for (let i = 0; i < 22; i++) { const px = (((hash3(i, 1, 9) * (w + 60) - dist * 0.7) % (w + 60)) + w + 60) % (w + 60) - 30, py = hz + 6 + hash3(i, 2, 9) * (estrada0 - hz - 10); R(g, mix(solo, 0x000000, 0.35), px, py, 2 + (i % 3), 1); }
      // objetos da beira (placas, postes, carros abandonados) em paralaxe 0.62
      for (let s = -2; s < Math.ceil(w / 52) + 3; s++) {
        const slot = Math.floor((dist * 0.62) / 52) + s, wx = slot * 52, x = wx - dist * 0.62 + 20, bi = wx < xb(PAR.beira) ? A.bioma : B.bioma, r = hash3(slot, 3, 11), yb = estrada0 - 2;
        if (r < 0.25) bloco(g, { x: 0, w: 8, h: 26, tipo: 'poste', v: slot }, x, yb, 0x2a2e33, noite, t, base);
        else if (r < 0.42) { const km = Math.max(1, Math.round((D - dist) / 40)), tx = `${B.nome.split(' ')[0]} ${km}`.slice(0, 11), bw = larguraTexto(tx) + 4; R(g, 0x3a3d40, x + (bw >> 1), yb - 14, 1, 14); R(g, 0x2a2e33, x, yb - 22, bw, 9); R(g, 0x6a6a64, x, yb - 22, bw, 1); texto(g, tx, x + 2, yb - 19, 0xd0cbb0); }
        else if (r < 0.55 && bi !== 'cidade') bloco(g, { x: 0, w: 14, h: 24, tipo: bi === 'floresta' || bi === 'pantano' ? 'arvore' : 'arvore', v: slot }, x, yb, mix(0x3a3226, 0x000000, noite * 0.5), noite, t, base);
        else if (r < 0.66) { R(g, mix(0x6a5a4a, 0x000000, noite * 0.6), x, yb - 7, 26, 6); R(g, mix(0x4a3a2a, 0x000000, noite * 0.6), x + 6, yb - 11, 12, 5); R(g, 0x101012, x + 3, yb - 3, 4, 3); R(g, 0x101012, x + 19, yb - 3, 4, 3); }
        else if (r < 0.74) bloco(g, { x: 0, w: 10, h: 9, tipo: 'pedra', v: slot }, x, yb, mix(0x5a5a52, 0x000000, noite * 0.5), noite, t, base);
      }
      // asfalto
      R(g, 0x3a3d3f, 0, estrada0 - 3, w, 3); R(g, 0x242729, 0, estrada0, w, estrada1 - estrada0); R(g, 0x2f3235, 0, estrada0, w, 2); R(g, 0x6a6a64, 0, estrada0 - 1, w, 1); R(g, 0x6a6a64, 0, estrada1, w, 1); R(g, mix(solo, 0x000000, 0.3), 0, estrada1 + 1, w, h - estrada1 - 1);
      const meio = Math.floor((estrada0 + estrada1) / 2); for (let x = -((dist % 26)); x < w; x += 26) R(g, 0xc9a52a, x, meio, 14, 1);
      for (let i = 0; i < 18; i++) { const px = (((hash3(i, 5, 12) * (w + 40) - dist) % (w + 40)) + w + 40) % (w + 40) - 20, py = estrada0 + 2 + hash3(i, 6, 12) * (estrada1 - estrada0 - 4); R(g, 0x1a1c1e, px, py, 2 + (i % 4), 1, 0.8); }
      for (let x = 12 - ((dist * 1) % 90); x < w; x += 90) R(g, 0x14161a, x, meio + 4, 6, 3, 0.85);
      // obstáculo do evento (barricada com luzes)
      if (e.obstaculo) { const bx = Math.round(P_PARADA * D + carX + 70 - dist); if (bx > -30 && bx < w + 30) { R(g, 0x000000, bx - 2, estrada1 - 2, 24, 3, 0.3); R(g, 0x4a3a2a, bx, estrada0 - 10, 2, 18); R(g, 0x4a3a2a, bx + 16, estrada0 - 10, 2, 18); R(g, 0x8a6a3a, bx - 2, estrada0 - 6, 22, 3); R(g, 0xd9a02b, bx - 2, estrada0 - 1, 22, 3); R(g, 0x8a6a3a, bx - 2, estrada0 + 4, 22, 3); pisca(g, bx + 8, estrada0 - 14, t); R(g, 0xd9a02b, bx - 8, estrada1 - 6, 4, 6); R(g, 0xe8e0c8, bx - 8, estrada1 - 4, 4, 1); R(g, 0xd9a02b, bx + 26, estrada1 - 6, 4, 6); R(g, 0xe8e0c8, bx + 26, estrada1 - 4, 4, 1); } }
      // fumaça e poeira
      const rate = (vel * 16 + 3) * dt; if (Math.random() < rate) parts.push({ x: carX - 3, y: carY + 11, vx: -vel * 38 - 4 - Math.random() * 4, vy: -7 - Math.random() * 6, v: 0, vida: 0.9 + Math.random() * 0.5, tam: 2, cor: 0x7a7a76 });
      if (vel > 0.15 && Math.random() < vel * 26 * dt) parts.push({ x: carX + 4 + Math.random() * 28, y: carY + 17, vx: -vel * 46 - 6 * Math.random(), vy: -2 - Math.random() * 4, v: 0, vida: 0.5 + Math.random() * 0.4, tam: 1, cor: mix(solo, 0xc9b88a, 0.55) });
      if (e.freio && vel > 0.2 && Math.random() < 40 * dt) parts.push({ x: carX + 30, y: carY + 17, vx: -vel * 60, vy: -3, v: 0, vida: 0.6, tam: 2, cor: mix(solo, 0xc9b88a, 0.55) });
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.v += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.tam += dt * 6; if (p.v >= p.vida || parts.length > 160) parts.splice(i, 1); else R(g, p.cor, p.x, p.y, p.tam, Math.max(1, p.tam * 0.6), 0.5 * (1 - p.v / p.vida)); }
      jipe(g, carX, carY, e, noite);
      // primeiro plano: tufos que passam rápido
      for (let i = 0; i < 10; i++) { const px = (((hash3(i, 7, 13) * (w + 60) - dist * 1.5) % (w + 60)) + w + 60) % (w + 60) - 30; R(g, mix(solo, 0x000000, 0.5 + noite * 0.3), px, estrada1 + 3 + (i % 3) * 2, 4 + (i % 4), 2 + (i % 2)); }
      if (vel > 0.5) for (let i = 0; i < 5; i++) { const px = (((hash3(i, 8, 14) * (w + 60) - dist * 2.4) % (w + 60)) + w + 60) % (w + 60) - 30; R(g, 0xffffff, px, estrada0 + 3 + hash3(i, 9, 14) * (estrada1 - estrada0 - 6), 10, 1, 0.07 * vel); }
      // clima: chuva, névoa, raio
      if (o.clima === 'chuva' || o.clima === 'tempestade' || o.clima === 'acida') { const n = o.clima === 'tempestade' ? 90 : 55, c = o.clima === 'acida' ? 0x9acf6a : 0xaabbc8; for (let i = 0; i < n; i++) { const rx = (hash3(i, 1, 15) * w + t * 40 - e.vel * 60 * t) % w, ry = ((hash3(i, 2, 15) * h + t * 170) % h); R(g, c, ((rx % w) + w) % w, ry, 1, 3, 0.35); } }
      if (o.clima === 'neblina') { R(g, 0xc8ccc8, 0, hz - 8, w, h - hz + 8, 0.18); R(g, 0xc8ccc8, 0, hz + 10, w, 14, 0.12); }
      if (o.clima === 'poeira') R(g, 0xa88548, 0, 0, w, h, 0.12);
      if (o.clima === 'tempestade') { proxRaio -= dt; if (proxRaio < 0) { proxRaio = 4 + rng.range(0, 6); raio = 0.14; } if (raio > 0) { R(g, 0xe8f0ff, 0, 0, w, h, Math.min(0.4, raio * 3)); raio -= dt; } }
      // vinheta
      R(g, 0x000000, 0, 0, w, 3, 0.35); R(g, 0x000000, 0, h - 3, w, 3, 0.35); R(g, 0x000000, 0, 0, 3, h, 0.2); R(g, 0x000000, w - 3, 0, 3, h, 0.2);
    },
  };
  function pisca(g: G, x: number, y: number, t: number) { R(g, Math.sin(t * 7) > 0 ? 0xffa030 : 0x5a3a10, x, y, 3, 3); }
}
export type CenaViagem = ReturnType<typeof criarCenaViagem>;
