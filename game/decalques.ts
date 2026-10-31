// Decalques do chão: detalhes pequenos carimbados sobre o chão assado de cada chunk (manchas de óleo e de queimado, ossos, pedras, capim, folhas, flores,
// remendos e buracos no asfalto, poças, bolhas no pântano…) e marcas ao redor dos objetos (cinza da fogueira, óleo dos carros, ferrugem da sucata).
// Puro: só lê a zona e escreve num buffer RGBA, determinístico pela posição (mesmo mundo = mesmos decalques para todos) e roda em Node nos testes.
import { T, idx, dentro, type Zona } from './zona';
import { hash3 } from './lib/cor';

/** o buffer do chunk e a geometria do losango (passada pelo chão para não haver import circular) */
export type Buf = { d: Uint8ClampedArray; w: number; h: number; ox: number; oy: number; TW: number; TH: number; CH: number };
export type Tipo = 'pedras' | 'capim' | 'capim_verde' | 'rachadura' | 'osso' | 'caveira' | 'queimado' | 'oleo' | 'lata' | 'flor' | 'buraco' | 'rastro' | 'lama' | 'cogumelo' | 'folhas' | 'galho' | 'musgo' | 'bolhas' | 'nenufar' | 'junco' | 'remendo' | 'derrapagem' | 'papel' | 'mato' | 'vidro' | 'ferrugem' | 'poca' | 'sangue' | 'toxico' | 'terra_remexida';
type Pt = (dx: number, dy: number, cor: number, a?: number) => void;
type C = { pt: Pt; rnd: () => number };

/** mancha com a borda irregular: elipse de raios (rx, ry) em pixels de tela */
const mancha = (c: C, ry: number, cor: number, a: number, rx = ry * 2) => { for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) { const q = (dx / (rx + 0.6)) ** 2 + (dy / (ry + 0.6)) ** 2; if (q + (c.rnd() - 0.5) * 0.55 < 1) c.pt(dx, dy, cor, a); } };
const espalha = (c: C, n: number, aberto: number, fecha: (ox: number, oy: number) => void) => { for (let k = 0; k < n; k++) fecha(Math.round((c.rnd() - 0.5) * aberto), Math.round((c.rnd() - 0.5) * (aberto / 3))); };
const pick = <X,>(c: C, l: X[]) => l[Math.floor(c.rnd() * l.length) % l.length];
const mato = (c: C, cores: [number, number]) => { for (let dx = -5; dx <= 5; dx++) if (c.rnd() < 0.5) c.pt(dx, 1, 0x14110e, 0.35); espalha(c, 6 + Math.floor(c.rnd() * 4), 11, (ox, oy) => { const h = 3 + Math.floor(c.rnd() * 3); for (let k = 0; k < h; k++) c.pt(ox + (k > 1 && c.rnd() < 0.5 ? 1 : 0), oy - k, k === h - 1 ? cores[1] : cores[0]); }); };

const CARIMBO: Record<Tipo, (c: C) => void> = {
  pedras: c => espalha(c, 2 + Math.floor(c.rnd() * 3), 14, (ox, oy) => { const g = c.rnd() < 0.4 ? 1 : 0; for (let k = 0; k <= 1 + g; k++) { c.pt(ox + k, oy, k === 0 ? 0xb0a688 : 0x8a8068); c.pt(ox + k, oy + 1, 0x5a5040); } c.pt(ox - 1, oy + 1, 0x14110e, 0.45); for (let k = 0; k <= 2 + g; k++) c.pt(ox + k, oy + 2, 0x14110e, 0.5); if (g) c.pt(ox + 1, oy - 1, 0x8a8068); }),
  capim: c => mato(c, [0x6a6036, 0xa89c60]),
  capim_verde: c => mato(c, [0x4a6a2a, 0x8aae48]),
  rachadura: c => { const sobe = c.rnd() < 0.5 ? -1 : 1; let x = -7, y = 0; for (let k = 0; k < 15; k++) { c.pt(x, y, 0x0a0908, 0.92); if (k % 3 === 1) c.pt(x, y + 1, 0x0a0908, 0.45); x++; if (c.rnd() < 0.5) y += sobe; if ((k === 4 || k === 9) && c.rnd() < 0.7) { c.pt(x, y - sobe, 0x0a0908, 0.8); c.pt(x + 1, y - sobe * 2, 0x0a0908, 0.7); c.pt(x + 2, y - sobe * 2, 0x0a0908, 0.5); } } },
  osso: c => { const s = c.rnd() < 0.5 ? 1 : -1, v = c.rnd() < 0.45; for (let k = -3; k <= 3; k++) c.pt(k * s, 0, 0xe0d8bc); for (const [dx, dy] of [[-4, -1], [-4, 1], [4, -1], [4, 1]]) c.pt(dx * s, dy, 0xe0d8bc); for (let k = -3; k <= 4; k++) c.pt(k * s, 1, 0x3a3224, 0.6); if (v) { for (let k = -2; k <= 2; k++) { c.pt(k * s, 3, 0xcfc6ab); c.pt(k * s, 4, 0x3a3224, 0.5); } c.pt(-3 * s, 2, 0xcfc6ab); c.pt(3 * s, 2, 0xcfc6ab); } },
  caveira: c => { for (const dx of [-1, 0, 1]) c.pt(dx, -1, 0xd8d0b8); c.pt(-1, 0, 0x1a1612); c.pt(0, 0, 0xd8d0b8); c.pt(1, 0, 0x1a1612); for (const dx of [-1, 0, 1]) c.pt(dx, 1, dx === 0 ? 0x2a2418 : 0xb8b098); c.pt(2, 1, 0x14110e, 0.5); c.pt(0, 2, 0x14110e, 0.4); },
  queimado: c => { mancha(c, 3, 0x1a1612, 0.55, 8); mancha(c, 2, 0x0a0806, 0.75, 5); espalha(c, 8, 14, (ox, oy) => c.pt(ox, oy, 0x7a766e, 0.75)); },
  oleo: c => { const ry = c.rnd() < 0.5 ? 3 : 2; mancha(c, ry, 0x0a0b0d, 0.85, ry * 3); c.pt(-2, -1, 0x4a5a6a, 0.8); c.pt(-1, -1, 0x34444f, 0.6); c.pt(3, 0, 0x34444f, 0.5); },
  lata: c => { for (const dy of [0, 1]) { c.pt(0, dy, dy ? 0x6a6a64 : 0xc8c8c0); c.pt(1, dy, dy ? 0x5a5a56 : 0xa8322a); } c.pt(2, 1, 0x14110e, 0.5); c.pt(1, 2, 0x14110e, 0.4); if (c.rnd() < 0.7) { c.pt(-5, 1, 0xd0a030); c.pt(-5, 0, 0xb08a2a); c.pt(-4, 1, 0x14110e, 0.4); } },
  flor: c => espalha(c, 4 + Math.floor(c.rnd() * 4), 13, (ox, oy) => { const cor = pick(c, [0xf0dc60, 0xf0f0e8, 0xe0584a, 0xc078e0]); c.pt(ox, oy + 2, 0x3a5a2a); c.pt(ox, oy + 1, 0x4a7a2a); c.pt(ox, oy, cor); c.pt(ox - 1, oy, cor, 0.7); c.pt(ox + 1, oy, cor, 0.7); c.pt(ox, oy - 1, cor, 0.7); }),
  buraco: c => { mancha(c, 2, 0x07070a, 0.9, 5); for (const dx of [-5, -4, -3, -2]) c.pt(dx, -2 + (dx > -4 ? 0 : 1), 0x6a6e72, 0.65); c.pt(3, 2, 0x6a6e72, 0.4); },
  rastro: c => { for (let k = 0; k < 3; k++) { const oy = k - 1; for (let dx = -4; dx <= 4; dx++) if (c.rnd() < 0.8) c.pt(dx + k * 2 - 2, oy, 0xd0c090, 0.4); } },
  lama: c => { mancha(c, 3, 0x2a2418, 0.6, 8); c.pt(-3, -1, 0x6a6a50, 0.7); c.pt(2, 0, 0x6a6a50, 0.6); c.pt(4, 1, 0x6a6a50, 0.5); },
  cogumelo: c => espalha(c, 2 + Math.floor(c.rnd() * 2), 9, (ox, oy) => { for (const dx of [-1, 0, 1]) c.pt(ox + dx, oy - 1, 0xc0503e); c.pt(ox, oy - 2, 0xc0503e); c.pt(ox - 1, oy - 1, 0xf0e8d0); c.pt(ox, oy, 0xe0d8c0); c.pt(ox, oy + 1, 0xe0d8c0); c.pt(ox + 1, oy + 1, 0x14110e, 0.5); }),
  folhas: c => espalha(c, 9 + Math.floor(c.rnd() * 6), 17, (ox, oy) => { const cor = pick(c, [0xc8782a, 0xd8a838, 0x9a5a1c, 0x8a3a1c, 0xb08a2a, 0x6a3a14]); c.pt(ox, oy, cor); if (c.rnd() < 0.6) c.pt(ox + 1, oy, cor, 0.9); if (c.rnd() < 0.25) c.pt(ox, oy + 1, cor, 0.7); }),
  galho: c => { for (const [dx, dy] of [[-5, 1], [-4, 1], [-3, 0], [-2, 0], [-1, 0], [0, -1], [1, -1], [2, -1], [3, -2]]) { c.pt(dx, dy, 0x3a2a1a); c.pt(dx, dy + 1, 0x14110e, 0.4); } c.pt(0, -2, 0x3a2a1a, 0.9); c.pt(1, -3, 0x3a2a1a, 0.8); c.pt(-3, -1, 0x5a4630, 0.8); c.pt(-1, -1, 0x5a4630, 0.7); },
  musgo: c => { mancha(c, 2 + Math.floor(c.rnd() * 2), 0x3a5a2a, 0.7, 7); espalha(c, 6, 10, (ox, oy) => c.pt(ox, oy, 0x7a9a42, 0.6)); },
  bolhas: c => espalha(c, 1 + Math.floor(c.rnd() * 3), 10, (ox, oy) => { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.pt(ox + dx, oy + dy, 0x9acf6a, 0.7); c.pt(ox, oy, 0xe0ffb0, 0.5); }),
  nenufar: c => { mancha(c, 1, 0x3a6a2a, 1, 3); c.pt(2, 0, 0x2c4a3c, 0.9); if (c.rnd() < 0.4) c.pt(-1, -1, 0xe8c0d0); },
  junco: c => espalha(c, 3, 7, (ox, oy) => { const h = 3 + Math.floor(c.rnd() * 2); for (let k = 0; k < h; k++) c.pt(ox, oy - k, k === h - 1 ? 0x8a7a40 : 0x5a6a3a); }),
  remendo: c => { for (let dy = -2; dy <= 2; dy++) for (let dx = -5; dx <= 5; dx++) c.pt(dx, dy, 0x16181a, 0.6); for (let dx = -5; dx <= 5; dx++) { c.pt(dx, -2, 0x60656b, 0.5); c.pt(dx, 2, 0x050506, 0.5); } },
  derrapagem: c => { for (let k = -5; k <= 5; k++) { if (c.rnd() < 0.85) c.pt(k, 0, 0x0a0a0c, 0.55); if (c.rnd() < 0.85) c.pt(k + 1, 2, 0x0a0a0c, 0.55); } },
  papel: c => espalha(c, 3 + Math.floor(c.rnd() * 3), 15, (ox, oy) => { c.pt(ox, oy, 0xe0dac4, 0.95); c.pt(ox + 1, oy, 0xe0dac4, 0.95); c.pt(ox + 2, oy, 0xcfc9b4, 0.8); c.pt(ox + 1, oy + 1, 0x7a7464, 0.6); c.pt(ox + 2, oy + 1, 0x7a7464, 0.5); }),
  mato: c => espalha(c, 3 + Math.floor(c.rnd() * 3), 14, (ox, oy) => { c.pt(ox, oy - 1, 0x8aba48); c.pt(ox, oy, 0x6a9a3a); c.pt(ox, oy + 1, 0x4a7a2a); if (c.rnd() < 0.6) { c.pt(ox + 1, oy, 0x6a9a3a); c.pt(ox - 1, oy + 1, 0x4a7a2a); } }),
  vidro: c => espalha(c, 5 + Math.floor(c.rnd() * 4), 13, (ox, oy) => { c.pt(ox, oy, 0xd8f0f4, 0.95); if (c.rnd() < 0.6) c.pt(ox + 1, oy, 0x9ac0c8, 0.8); if (c.rnd() < 0.3) c.pt(ox, oy + 1, 0x6a8890, 0.6); }),
  ferrugem: c => { const ox = Math.round((c.rnd() - 0.5) * 6); for (let k = 0; k < 3; k++) c.pt(ox, k - 1, 0x7a3b1c, 0.55 - k * 0.08); c.pt(ox + 1, 0, 0x9a4a22, 0.35); c.pt(ox - 1, -1, 0x4a4d50, 0.7); },
  poca: c => { mancha(c, 2, 0x22303a, 0.9, 6); c.pt(-3, -1, 0x8aa8b8, 0.9); c.pt(-2, -1, 0x6a8898, 0.7); c.pt(2, 0, 0x5a7888, 0.7); c.pt(3, 0, 0x4a6878, 0.5); },
  sangue: c => { mancha(c, 2 + Math.floor(c.rnd() * 2), 0x3a0c08, 0.8, 6); mancha(c, 1, 0x5a1410, 0.6, 3); for (let k = 0; k < 3; k++) c.pt(Math.round((c.rnd() - 0.5) * 12), 3 + k % 2, 0x5a1410, 0.8); },
  toxico: c => { mancha(c, 2, 0x6abf3a, 0.5, 5); mancha(c, 1, 0x2c5a1a, 0.7, 3); c.pt(-2, -1, 0xb7ff4a, 0.6); },
  terra_remexida: c => { mancha(c, 1, 0x2a2218, 0.65, 4); espalha(c, 4, 9, (ox, oy) => c.pt(ox, oy, 0x4a3c28, 0.7)); },
};

/** o que cada tipo de chão ganha (probabilidade por tile; no máximo um decalque aleatório por tile) */
const TABELA: Partial<Record<number, [Tipo, number][]>> = {
  [T.TERRA]: [['pedras', 0.05], ['capim', 0.06], ['rachadura', 0.05], ['osso', 0.012], ['caveira', 0.004], ['queimado', 0.012], ['oleo', 0.006], ['lata', 0.012], ['flor', 0.008], ['buraco', 0.01]],
  [T.AREIA]: [['pedras', 0.02], ['osso', 0.01], ['capim', 0.02], ['rastro', 0.03]],
  [T.GRAMA]: [['flor', 0.08], ['capim_verde', 0.06], ['pedras', 0.015], ['lama', 0.02], ['cogumelo', 0.008]],
  [T.FLORESTA]: [['folhas', 0.14], ['galho', 0.04], ['cogumelo', 0.015], ['pedras', 0.01], ['musgo', 0.03]],
  [T.LAMA]: [['bolhas', 0.06], ['pedras', 0.01], ['galho', 0.02], ['folhas', 0.03]],
  [T.AGUA_RASA]: [['nenufar', 0.05], ['bolhas', 0.03], ['junco', 0.03]],
  [T.ESTRADA]: [['remendo', 0.015], ['buraco', 0.012], ['oleo', 0.012], ['derrapagem', 0.012], ['rachadura', 0.04], ['lata', 0.006]],
  [T.LINHA_H]: [['oleo', 0.008], ['rachadura', 0.03]], [T.LINHA_V]: [['oleo', 0.008], ['rachadura', 0.03]],
  [T.CALCADA]: [['papel', 0.04], ['mato', 0.05], ['rachadura', 0.03], ['vidro', 0.015], ['oleo', 0.006]],
  [T.CONCRETO]: [['oleo', 0.02], ['ferrugem', 0.02], ['rachadura', 0.04], ['poca', 0.01], ['papel', 0.015], ['sangue', 0.006]],
  [T.METAL]: [['ferrugem', 0.05], ['oleo', 0.03], ['sangue', 0.004], ['lata', 0.01]],
  [T.AZULEJO]: [['papel', 0.03], ['vidro', 0.014], ['sangue', 0.012], ['poca', 0.008], ['rachadura', 0.03]],
  [T.ENTULHO]: [['pedras', 0.05], ['osso', 0.01], ['papel', 0.02], ['queimado', 0.02]],
  [T.RUINA]: [['pedras', 0.04], ['queimado', 0.02], ['papel', 0.015]],
};
/** multiplicadores por bioma (o Ermo tem mais ossos, a cidade mais papel e vidro, a refinaria mais óleo e ferrugem…) */
const MULT: Record<string, Partial<Record<Tipo, number>>> = {
  ermo: { osso: 2, caveira: 2, queimado: 1.5, pedras: 1.3 }, floresta: { folhas: 1.4, cogumelo: 1.5, osso: 1.2 },
  cidade: { papel: 1.8, vidro: 2, oleo: 1.5, sangue: 1.5, buraco: 1.6, remendo: 1.5 }, industrial: { oleo: 3, ferrugem: 2.5, queimado: 2, poca: 2, sangue: 0.5, osso: 0.3, caveira: 0.3, flor: 0 },
  pantano: { bolhas: 1.8, nenufar: 1.8, cogumelo: 2, osso: 1.3, folhas: 1.5 }, base: { flor: 2, capim: 1.4, osso: 0.1, caveira: 0, sangue: 0 },
};
/** marcas ao redor dos objetos: o chão mostra o que aconteceu ali */
const CONTEXTO: Record<string, Tipo[]> = { fogueira: ['queimado'], poco: ['lama'], sucata_pilha: ['oleo', 'ferrugem'], carro: ['oleo'], caminhao: ['oleo'], barril: ['oleo'], tambor_toxico: ['toxico'], gerador: ['oleo'], bomba: ['oleo'], cruz: ['terra_remexida'], tanque: ['oleo'] };
/** tipos de chão onde nunca há decalque aleatório */
const SEM_DECALQUE = new Set<number>([T.PAREDE, T.JANELA, T.PORTA, T.MADEIRA, T.AGUA_FUNDA]);

export type Relatorio = { n: number; px: number; porTipo: Partial<Record<Tipo, number>> };

/** carimba os decalques do chunk (cx, cy) no buffer já com o chão pintado; devolve quantos e quantos pixels mexeram */
export function decalques(m: Zona, cx: number, cy: number, b: Buf): Relatorio {
  const rel: Relatorio = { n: 0, px: 0, porTipo: {} };
  const losango = (px: number, py: number) => Math.abs(px + 0.5 - b.TW / 2) / (b.TW / 2) + Math.abs(py + 0.5 - b.TH / 2) / (b.TH / 2) <= 0.96;
  const carimbar = (tipo: Tipo, x: number, y: number, cx0: number, cy0: number, sem: number) => {
    const lx = (x - y) * (b.TW / 2) - b.ox - b.TW / 2, ly = (x + y) * (b.TH / 2) - b.oy; let s = (Math.floor(hash3(x, y, sem) * 2147483647) | 1) >>> 0 || 1;
    const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
    const pt: Pt = (dx, dy, cor, a = 1) => {
      const px = cx0 + dx, py = cy0 + dy; if (px < 0 || py < 0 || px >= b.TW || py >= b.TH || !losango(px, py)) return;
      const X = lx + px, Y = ly + py; if (X < 0 || Y < 0 || X >= b.w || Y >= b.h) return; const o = (Y * b.w + X) * 4; if (b.d[o + 3] !== 255) return;
      b.d[o] = b.d[o] * (1 - a) + ((cor >> 16) & 255) * a; b.d[o + 1] = b.d[o + 1] * (1 - a) + ((cor >> 8) & 255) * a; b.d[o + 2] = b.d[o + 2] * (1 - a) + (cor & 255) * a; rel.px++;
    };
    CARIMBO[tipo]({ pt, rnd }); rel.n++; rel.porTipo[tipo] = (rel.porTipo[tipo] ?? 0) + 1;
  };
  const mult = MULT[m.bioma] ?? {};
  for (let j = 0; j < b.CH; j++) for (let i = 0; i < b.CH; i++) {
    const x = cx * b.CH + i, y = cy * b.CH + j; if (!dentro(x, y)) continue; const t = m.tipos[idx(x, y)]; if (SEM_DECALQUE.has(t) || m.rad[idx(x, y)] > 0.55) continue;
    const lista = TABELA[t]; if (!lista) continue; const f = hash3(x, y, 101); let acc = 0;
    for (const [tipo, p] of lista) { acc += p * (mult[tipo] ?? 1); if (f < acc) { carimbar(tipo, x, y, Math.round(b.TW / 2 + (hash3(x, y, 102) - 0.5) * 10), Math.round(b.TH / 2 + (hash3(x, y, 103) - 0.5) * 5), 104); break; } }
  }
  // marcas ao redor dos objetos (na frente deles, onde o sprite não cobre)
  for (const p of m.props) {
    const lista = CONTEXTO[p.rec.n]; if (!lista) continue;
    const alvos: [number, number][] = [[p.x + p.w, p.y + Math.floor(p.h / 2)], [p.x + Math.floor(p.w / 2), p.y + p.h], [Math.floor(p.x + p.w / 2), Math.floor(p.y + p.h / 2)]];
    lista.forEach((tipo, k) => { const [tx, ty] = alvos[k % alvos.length]; if (!dentro(tx, ty) || Math.floor(tx / b.CH) !== cx || Math.floor(ty / b.CH) !== cy || SEM_DECALQUE.has(m.tipos[idx(tx, ty)])) return; carimbar(tipo, tx, ty, Math.round(b.TW / 2 + (hash3(tx, ty, 105) - 0.5) * 6), Math.round(b.TH / 2 + (hash3(tx, ty, 106) - 0.5) * 3), 107 + k); });
    if (p.rec.n === 'fogueira' || p.rec.n === 'carro') { const [tx, ty] = alvos[2]; if (dentro(tx, ty) && Math.floor(tx / b.CH) === cx && Math.floor(ty / b.CH) === cy && !SEM_DECALQUE.has(m.tipos[idx(tx, ty)])) carimbar(p.rec.n === 'fogueira' ? 'queimado' : 'oleo', tx, ty, 16, 8, 120); }
  }
  return rel;
}
