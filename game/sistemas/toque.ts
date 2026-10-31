// Movimento por toque (point & click) para jogar com UMA mão, no estilo dos jogos de sobrevivência de celular:
//  - tocar no chão anda até lá (toque duplo = corre); tocar num objeto/NPC vai até ele e interage quando chega;
//  - tocar numa criatura persegue e ataca; o ataque automático fica sempre ligado (cena.jogador).
// O caminho é um A* em 4 direções (rot.js) suavizado em linha reta onde o terreno deixa. Tudo aqui é lógica do mundo, sem UI.
import * as ROT from 'rot-js';
import type * as Phaser from 'phaser';
import type { Cena } from '../cena';
import type { Ent } from './ia';
import type { Interativo } from './acoes';
import { W, H, dentro, idx } from '../zona';
import { proj } from '../util';
import { armaDe } from '../dados/itens';
import { useJogo } from '../store';

export type Toque = {
  rota: [number, number][]; dest: { x: number; y: number } | null; correr: boolean; it: Interativo | null; alvo: Ent | null;
  tRota: number; parado: number; ultX: number; ultY: number; aviso: number; ultTap: { t: number; x: number; y: number }; recalculou: boolean;
};
export const toqueNovo = (): Toque => ({ rota: [], dest: null, correr: false, it: null, alvo: null, tRota: 0, parado: 0, ultX: 0, ultY: 0, aviso: -99, ultTap: { t: -1e9, x: 0, y: 0 }, recalculou: false });
export const modoToque = () => useJogo.getState().cfg.controle === 'toque';
export const toqueAtivo = (c: Cena) => !!(c.toque.dest || c.toque.it || c.toque.alvo);
export function cancelarToque(c: Cena) { const t = c.toque; t.rota = []; t.dest = null; t.it = null; t.alvo = null; t.correr = false; t.parado = 0; t.recalculou = false; }

/** ponto da tela (px CSS relativos ao mundo) → tile no chão */
export function tileDaTela(c: Cena, x: number, y: number): [number, number] {
  const cam = c.cameras.main, wx = cam.scrollX + x / c.esc, wy = cam.scrollY + y / c.esc;
  return [(wx / 16 + wy / 8) / 2, (wy / 8 - wx / 16) / 2];
}
const livreTile = (c: Cena, x: number, y: number) => dentro(x, y) && !c.zona.solido[idx(x, y)];
const aviso = (c: Cena, txt: string) => { if (c.tempo - c.toque.aviso < 1.5) return; c.toque.aviso = c.tempo; useJogo.getState().toast(txt, '#d9a02b'); };

/** A* até o tile (gx, gy); a meta pode ser sólida (objeto). Devolve os centros dos tiles sem o de partida, ou null se não há caminho. */
export function calcularRota(c: Cena, gx: number, gy: number): [number, number][] | null {
  const rota: [number, number][] = [];
  new ROT.Path.AStar(gx, gy, (x, y) => livreTile(c, x, y), { topology: 4 }).compute(Math.floor(c.jog.x), Math.floor(c.jog.y), (x, y) => rota.push([x + 0.5, y + 0.5]));
  if (!rota.length) return null; rota.shift(); return rota;
}
/** o tile livre mais próximo de (x, y) num raio pequeno (para tocar numa árvore, parede ou água funda) */
function tileLivrePerto(c: Cena, x: number, y: number, r = 3): [number, number] | null {
  let melhor: [number, number] | null = null, md = 1e9;
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const tx = x + i, ty = y + j; if (!livreTile(c, tx, ty)) continue; const d = Math.hypot(i, j); if (d < md) { md = d; melhor = [tx, ty]; } }
  return melhor;
}
const linhaLivre = (c: Cena, x0: number, y0: number, x1: number, y1: number) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.25)); for (let i = 1; i <= n; i++) { const t = i / n; if (c.colide(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0.3)) return false; } return true; };
const direcao = (J: { x: number; y: number }, x: number, y: number) => { const d = Math.hypot(x - J.x, y - J.y) || 1; return { dx: (x - J.x) / d, dy: (y - J.y) / d }; };

/** alcance em que o jogador pára de perseguir e deixa o ataque automático trabalhar */
const alcanceAtaque = (c: Cena, e: Ent) => { const a = armaDe(c.s.arma); return a.alvo === 'tiro' ? Math.min(a.alcance, 6.5) * 0.9 : a.alcance * 0.85 + e.arq.raio; };

/** Toque no mundo (modo uma mão). Devolve true se o toque virou ação. */
export function tocarToque(c: Cena, x: number, y: number): boolean {
  const t = c.toque, J = c.jog, cam = c.cameras.main, wx = cam.scrollX + x / c.esc, wy = cam.scrollY + y / c.esc, raio = 44 / c.esc, agora = performance.now();
  const duplo = agora - t.ultTap.t < 380 && Math.hypot(x - t.ultTap.x, y - t.ultTap.y) < 56; t.ultTap = { t: agora, x, y };
  // 1) objeto interativo (cofre, árvore, NPC, jipe…) sob o dedo
  let it: Interativo | null = null, md = 1e9;
  for (const o of c.interativos) { if (!o.ok()) continue; const [sx, sy] = proj(o.x, o.y, (o.alt ?? 30) * 0.5), d = Math.hypot(sx - wx, sy - wy); if (d < raio && d < md && Math.hypot(o.x - J.x, o.y - J.y) < 70) { md = d; it = o; } }
  if (it) return irAoObjeto(c, it, duplo);
  // 2) criatura viva (inimigo ou caça)
  let alvo: Ent | null = null; md = 1e9;
  for (const e of c.ents) { if (!e.vivo || e.npc || e.arq.ia === 'voo') continue; const [sx, sy] = proj(e.x, e.y, 14), d = Math.hypot(sx - wx, sy - wy); if (d < raio * 0.95 && d < md) { md = d; alvo = e; } }
  if (alvo) { cancelarToque(c); t.alvo = alvo; t.correr = duplo; t.tRota = 0; return true; }
  // 3) chão
  const [gx, gy] = tileDaTela(c, x, y), tx = Math.max(0, Math.min(W - 1, Math.floor(gx))), ty = Math.max(0, Math.min(H - 1, Math.floor(gy)));
  const alvoTile = livreTile(c, tx, ty) ? [tx, ty] as [number, number] : tileLivrePerto(c, tx, ty); if (!alvoTile) { aviso(c, 'Não dá para chegar lá.'); return false; }
  const rota = calcularRota(c, alvoTile[0], alvoTile[1]); if (!rota) { aviso(c, 'Não dá para chegar lá.'); return false; }
  cancelarToque(c); t.rota = rota; t.dest = { x: alvoTile[0] + 0.5, y: alvoTile[1] + 0.5 }; t.correr = duplo; return true;
}
function irAoObjeto(c: Cena, it: Interativo, duplo: boolean): boolean {
  const t = c.toque, J = c.jog;
  if (Math.hypot(it.x - J.x, it.y - J.y) <= it.r * 0.9 && c.alcancavel(it)) { cancelarToque(c); c.alvoInter = it; if (!c.acao) it.exec(); return true; }
  const rota = calcularRota(c, Math.floor(it.x), Math.floor(it.y)); if (!rota) { aviso(c, 'Não dá para chegar lá.'); return false; }
  cancelarToque(c); t.it = it; t.rota = rota; t.correr = duplo; return true;
}

/** direção (mundo) em que o jogador deve andar neste quadro, ou null se está parado. Chega, interage e limpa sozinho. */
export function passoToque(c: Cena, dt: number): { dx: number; dy: number } | null {
  const t = c.toque, J = c.jog; if (!toqueAtivo(c)) return null;
  if (t.alvo) {
    const e = t.alvo; if (!e.vivo || e.remover) { cancelarToque(c); return null; }
    const d = Math.hypot(e.x - J.x, e.y - J.y), arma = armaDe(c.s.arma);
    if (d <= alcanceAtaque(c, e) && (arma.alvo === 'melee' || c.temLOS(J.x, J.y, e.x, e.y))) { t.rota = []; return null; } // chegou: o ataque automático cuida
    t.tRota -= dt; if (t.tRota <= 0 || !t.rota.length) { t.tRota = 0.5; const r = calcularRota(c, Math.floor(e.x), Math.floor(e.y)); if (!r) { aviso(c, 'Não dá para chegar até ele.'); cancelarToque(c); return null; } t.rota = r; }
  } else if (t.it) {
    const it = t.it; if (!it.ok()) { cancelarToque(c); return null; }
    if (Math.hypot(it.x - J.x, it.y - J.y) <= it.r * 0.9 && c.alcancavel(it)) { cancelarToque(c); c.alvoInter = it; if (!c.acao) it.exec(); return null; }
  } else if (t.dest && Math.hypot(t.dest.x - J.x, t.dest.y - J.y) < 0.28) { cancelarToque(c); return null; }
  const rota = t.rota; while (rota.length && Math.hypot(rota[0][0] - J.x, rota[0][1] - J.y) < 0.3) rota.shift();
  if (!rota.length) { if (t.alvo) return null; if (t.it) return direcao(J, t.it.x, t.it.y); cancelarToque(c); return null; }
  let k = 0; for (let i = Math.min(rota.length - 1, 7); i > 0; i--) if (linhaLivre(c, J.x, J.y, rota[i][0], rota[i][1])) { k = i; break; } if (k > 0) rota.splice(0, k);
  // travou? recalcula uma vez; se continuar travado, desiste
  t.parado += dt; if (Math.hypot(J.x - t.ultX, J.y - t.ultY) > 0.1) { t.parado = 0; t.ultX = J.x; t.ultY = J.y; }
  else if (t.parado > 1.1) { t.parado = 0; if (t.recalculou) { aviso(c, 'Parei: algo bloqueia o caminho.'); cancelarToque(c); return null; } t.recalculou = true; const g = t.alvo ?? t.it ?? t.dest, r = g ? calcularRota(c, Math.floor(g.x), Math.floor(g.y)) : null; if (!r) { cancelarToque(c); return null; } t.rota = r; }
  return direcao(J, rota[0][0], rota[0][1]);
}

/** marcador no chão: anel verde no destino, anel vermelho na criatura perseguida, anel laranja no objeto */
export function desenharToque(c: Cena, g: Phaser.GameObjects.Graphics) {
  const t = c.toque; if (!toqueAtivo(c)) return;
  const anel = (x: number, y: number, cor: number, r0: number) => { const p = 0.5 + 0.5 * Math.sin(c.tempo * 7), r = r0 + p * 2, [sx, sy] = proj(x, y, 0); g.lineStyle(2, cor, 0.9); g.strokeEllipse(Math.round(sx), Math.round(sy), Math.round(r * 2), Math.round(r)); g.lineStyle(1, 0x050506, 0.7); g.strokeEllipse(Math.round(sx), Math.round(sy), Math.round(r * 2 + 4), Math.round(r + 2)); };
  if (t.alvo?.vivo) anel(t.alvo.x, t.alvo.y, 0xe0553f, 8); else if (t.it) anel(t.it.x, t.it.y, 0xf09a50, 9); else if (t.dest) anel(t.dest.x, t.dest.y, t.correr ? 0xf09a50 : 0x8fe36a, 6);
}
