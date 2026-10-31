// Mochila em grade (estilo Resident Evil 4): cada item ocupa células; o ESPAÇO limita, não o peso. Lógica pura + sincronização com o store.
// `inv` (contagens por item) continua sendo a verdade do jogo; `grade` guarda ONDE cada pilha está. reconciliar() mantém os dois iguais.
import { ITENS } from '../dados/itens';
import { useJogo } from '../store';

export type Peca = { id: string; q: number; x: number; y: number; r: 0 | 1 };
export const COLS = 8;
export const LINHAS_BASE = 4;
/** itens que ficam "vestidos" (não ocupam a grade) */
export const EQUIPADO = ['mochila', 'colete'];
const TAM: Record<string, [number, number]> = {
  pe_de_cabra: [1, 3], taco: [1, 3], faca: [1, 2], facao: [1, 3], machado: [2, 3], pistola: [2, 2], escopeta: [4, 2], rifle: [5, 2],
  agua: [1, 2], agua_suja: [1, 2], garrafa: [1, 2], alcool: [1, 2], combustivel: [2, 2], madeira: [2, 1], kit: [2, 1], mascara: [2, 2], lanterna: [1, 2], kit_fogueira: [2, 1], radio: [1, 2],
};
const PILHA: Record<string, number> = {
  sucata: 12, tecido: 12, madeira: 6, enlatado: 4, pao: 4, carne_crua: 4, carne_cozida: 4, legume: 6, semente: 10, bandagem: 6, antirrad: 3, bateria: 4, eletronico: 6, alcool: 3, agua: 2, agua_suja: 2, garrafa: 4, kit: 2, ficha: 99,
};
export const linhasDe = (inv: Record<string, number>) => LINHAS_BASE + (inv.mochila ? 2 : 0);
export const emGrade = (id: string) => !!ITENS[id] && !EQUIPADO.includes(id) && ITENS[id].tipo !== 'municao';
export const tamDe = (id: string, r: 0 | 1 = 0): [number, number] => { const [w, h] = TAM[id] ?? [1, 1]; return r ? [h, w] : [w, h]; };
export const pilhaDe = (id: string) => PILHA[id] ?? 1;
export const total = (g: Peca[], id: string) => g.reduce((s, p) => s + (p.id === id ? p.q : 0), 0);

function mapa(g: Peca[], linhas: number, ignorar = -1) {
  const m = new Uint8Array(COLS * linhas);
  g.forEach((p, i) => { if (i === ignorar) return; const [w, h] = tamDe(p.id, p.r); for (let y = p.y; y < p.y + h; y++) for (let x = p.x; x < p.x + w; x++) if (x >= 0 && y >= 0 && x < COLS && y < linhas) m[y * COLS + x] = 1; });
  return m;
}
/** a peça `id` (girada ou não) cabe com o canto em (x, y)? `ignorar` = índice da peça que está sendo movida */
export function cabeEm(g: Peca[], linhas: number, id: string, x: number, y: number, r: 0 | 1, ignorar = -1) {
  const [w, h] = tamDe(id, r); if (x < 0 || y < 0 || x + w > COLS || y + h > linhas) return false; const m = mapa(g, linhas, ignorar);
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m[j * COLS + i]) return false; return true;
}
export function acharLivre(g: Peca[], linhas: number, id: string): { x: number; y: number; r: 0 | 1 } | null {
  const [w0, h0] = tamDe(id, 0), m = mapa(g, linhas);
  const tenta = (r: 0 | 1) => { const [w, h] = tamDe(id, r); for (let y = 0; y + h <= linhas; y++) for (let x = 0; x + w <= COLS; x++) { let ok = true; for (let j = y; j < y + h && ok; j++) for (let i = x; i < x + w; i++) if (m[j * COLS + i]) { ok = false; break; } if (ok) return { x, y, r }; } return null; };
  return tenta(0) ?? (w0 !== h0 ? tenta(1) : null);
}
/** soma `q` de `id`: completa pilhas existentes e abre pilhas novas onde couber. `resto` > 0 = não coube tudo. */
export function adicionar(g0: Peca[], linhas: number, id: string, q: number): { g: Peca[]; resto: number } {
  const g = g0.map(p => ({ ...p })), cap = pilhaDe(id); let resto = q;
  for (const p of g) { if (p.id !== id || resto <= 0) continue; const d = Math.min(resto, cap - p.q); if (d > 0) { p.q += d; resto -= d; } }
  while (resto > 0) { const lugar = acharLivre(g, linhas, id); if (!lugar) break; const d = Math.min(resto, cap); g.push({ id, q: d, ...lugar }); resto -= d; }
  return { g, resto };
}
export function remover(g0: Peca[], id: string, q: number): Peca[] {
  const g = g0.map(p => ({ ...p })); let falta = q;
  for (let i = g.length - 1; i >= 0 && falta > 0; i--) { if (g[i].id !== id) continue; const d = Math.min(falta, g[i].q); g[i].q -= d; falta -= d; }
  return g.filter(p => p.q > 0);
}
/** iguala a grade ao inventário: tira o que sobrou, põe o que faltou (`excesso` = não coube) */
export function reconciliar(g0: Peca[], inv: Record<string, number>, linhas: number): { g: Peca[]; excesso: Record<string, number> } {
  let g = g0.filter(p => emGrade(p.id) && p.q > 0 && cabeEm(g0.filter(o => o !== p), linhas, p.id, p.x, p.y, p.r)); // descarta o que saiu do tabuleiro (ex.: perdeu a mochila)
  const excesso: Record<string, number> = {}, ids = new Set<string>([...g.map(p => p.id), ...Object.keys(inv).filter(emGrade)]);
  for (const id of ids) {
    const quer = emGrade(id) ? (inv[id] ?? 0) : 0, tem = total(g, id);
    if (tem > quer) g = remover(g, id, tem - quer);
    else if (tem < quer) { const r = adicionar(g, linhas, id, quer - tem); g = r.g; if (r.resto > 0) excesso[id] = r.resto; }
  }
  return { g, excesso };
}
export function mover(g: Peca[], linhas: number, i: number, x: number, y: number, r: 0 | 1): Peca[] | null {
  const p = g[i]; if (!p || !cabeEm(g, linhas, p.id, x, y, r, i)) return null; return g.map((o, k) => (k === i ? { ...o, x, y, r } : o));
}
/** gira a peça `i` no lugar; se não couber, procura outro lugar já girada */
export function girar(g: Peca[], linhas: number, i: number): Peca[] | null {
  const p = g[i]; if (!p) return null; const [w, h] = tamDe(p.id, 0); if (w === h) return null; const r: 0 | 1 = p.r ? 0 : 1;
  if (cabeEm(g, linhas, p.id, p.x, p.y, r, i)) return g.map((o, k) => (k === i ? { ...o, r } : o));
  const sem = g.filter((_, k) => k !== i), lugar = (() => { const t = (rr: 0 | 1) => { const [ww, hh] = tamDe(p.id, rr), m = mapa(sem, linhas); for (let y = 0; y + hh <= linhas; y++) for (let x = 0; x + ww <= COLS; x++) { let ok = true; for (let j = y; j < y + hh && ok; j++) for (let k = x; k < x + ww; k++) if (m[j * COLS + k]) { ok = false; break; } if (ok) return { x, y }; } return null; }; return t(r); })();
  return lugar ? g.map((o, k) => (k === i ? { ...o, ...lugar, r } : o)) : null;
}
/** arruma tudo: junta pilhas iguais e reempacota as maiores primeiro */
export function organizar(g: Peca[], linhas: number): Peca[] {
  const por: Record<string, number> = {}; for (const p of g) por[p.id] = (por[p.id] ?? 0) + p.q;
  const ids = Object.keys(por).sort((a, b) => { const [wa, ha] = tamDe(a), [wb, hb] = tamDe(b); return wb * hb - wa * ha || a.localeCompare(b); });
  let novo: Peca[] = []; for (const id of ids) { const r = adicionar(novo, linhas, id, por[id]); novo = r.g; if (r.resto > 0) return g; } return novo;
}
export const livres = (g: Peca[], linhas: number) => COLS * linhas - g.reduce((s, p) => { const [w, h] = tamDe(p.id, p.r); return s + w * h; }, 0);

// ---------------------------------------------------------------- ligação com o store (a UI e o jogo leem daqui)
const st = () => useJogo.getState();
/** cabe `qtd` de `id` na mochila agora? */
export function cabeNaMochila(id: string, qtd = 1): boolean { if (!emGrade(id)) return true; const s = st(); return adicionar(s.grade, linhasDe(s.inv), id, qtd).resto === 0; }
/** depois de mexer em `inv` por fora: reconcilia a grade; o que não couber vai para o baú (devolve o que foi) */
export function sincGrade(): Record<string, number> {
  const s = st(), { g, excesso } = reconciliar(s.grade, s.inv, linhasDe(s.inv)), mudou = JSON.stringify(g) !== JSON.stringify(s.grade);
  const ids = Object.keys(excesso);
  if (!ids.length) { if (mudou) useJogo.setState({ grade: g }); return {}; }
  const inv = { ...s.inv }, bau = { ...s.bau }; for (const id of ids) { inv[id] -= excesso[id]; if (inv[id] <= 0) delete inv[id]; bau[id] = (bau[id] ?? 0) + excesso[id]; }
  useJogo.setState({ grade: g, inv, bau }); return excesso;
}
export function aplicarGrade(g: Peca[] | null) { if (g) useJogo.setState({ grade: g }); }
export function moverPeca(i: number, x: number, y: number, r: 0 | 1): boolean { const s = st(), g = mover(s.grade, linhasDe(s.inv), i, x, y, r); if (!g) return false; useJogo.setState({ grade: g }); return true; }
export function girarPeca(i: number): boolean { const s = st(), g = girar(s.grade, linhasDe(s.inv), i); if (!g) return false; useJogo.setState({ grade: g }); return true; }
export function organizarMochila() { const s = st(); useJogo.setState({ grade: organizar(s.grade, linhasDe(s.inv)) }); }
