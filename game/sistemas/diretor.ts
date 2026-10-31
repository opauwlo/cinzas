// Diretor de eventos da zona: lançamentos de suprimentos, invasões ao abrigo, emboscadas da estrada e saque do baú quando você fica fora.
// Tudo determinístico pela seed + dia (mesma vida = mesmos eventos) e sempre sinalizado ao jogador (sem trapaça).
import * as Phaser from 'phaser';
import type { Cena } from '../cena';
import { W, H, T, idx, dentro, type Prop } from '../zona';
import { dimProp } from '../lib/props';
import { Rng } from '../lib/rng';
import { proj } from '../util';
import { useJogo } from '../store';
import { sfx } from '../audio';
import { ITENS } from '../dados/itens';
import { criarEnt } from './ia';
import { montarInterativos } from './acoes';
import { DIF, dif, melNivel, ganharXp, registrar } from './progresso';
import { tamanhoRaid } from '../dados/balanco';
export { airdropColetado } from './progresso';

const ID_AIRDROP = 910000;
const ABERTO: number[] = [T.TERRA, T.GRAMA, T.FLORESTA, T.ESTRADA, T.CALCADA];
export type Airdrop = { x: number; y: number; prop: Prop; msg: boolean; t: number };
export type Raid = { grupo: number; total: number; resolvido: boolean };
const toast = (t: string, cor?: string) => useJogo.getState().toast(t, cor);
const dia = (c: Cena) => Math.floor(c.s.minutos / 1440) + 1;

/** acha um ponto livre (a pé) numa faixa de distância do jogador */
export function pontoLivre(c: Cena, rng: Rng, dmin: number, dmax: number, tent = 80): [number, number] | null {
  const J = c.jog;
  for (let i = 0; i < tent; i++) {
    const a = rng.f() * Math.PI * 2, r = rng.range(dmin, dmax), x = Math.floor(J.x + Math.cos(a) * r), y = Math.floor(J.y + Math.sin(a) * r);
    if (!dentro(x, y) || x < 3 || y < 3 || x > W - 4 || y > H - 4 || c.solidoEm(x, y) || !ABERTO.includes(c.zona.tipos[idx(x, y)])) continue;
    return [x, y];
  }
  return null;
}
const spawnGrupo = (c: Cena, rng: Rng, arq: string, n: number, perto: [number, number], grupo: number, persegue = false, faccao?: number) => {
  for (let i = 0; i < n; i++) {
    const x = perto[0] + 0.5 + rng.range(-2.5, 2.5), y = perto[1] + 0.5 + rng.range(-2.5, 2.5); if (c.solidoEm(Math.floor(x), Math.floor(y))) continue;
    const e = criarEnt(c, arq, x, y, null, grupo, faccao); if (persegue) { e.estado = 'persegue'; e.alvo = { x: c.jog.x, y: c.jog.y }; e.semVer = 0; }
  }
};

// ---------------------------------------------------------------- ao entrar numa zona
export function iniciarZona(c: Cena) {
  const s = c.s; c.airdrop = null; c.raid = null;
  if (s.emboscada) { const [arq, n] = s.emboscada; s.emboscada = null; const p = pontoLivre(c, new Rng(`${s.seed}|emb|${s.minutos}`), 8, 12); if (p) { spawnGrupo(c, new Rng(`${s.seed}|emb2|${s.minutos}`), arq, n, p, 7000 + (s.minutos | 0) % 900, true); toast('Emboscada! Eles seguiram você.', '#e0553f'); sfx.alarme(); } }
  if (c.zona.id === 'base') saqueioAusente(c); else airdropDaZona(c);
}

/** voltou ao abrigo depois de muito tempo fora: parte do baú pode ter sumido (a muralha protege) */
function saqueioAusente(c: Cena) {
  const s = c.s; if (s.saiuEm === undefined) return; const fora = (s.minutos - s.saiuEm) / 1440; s.saiuEm = undefined; if (fora < 1) return;
  const rng = new Rng(`${s.seed}|saque|${Math.floor(s.minutos)}`), p = Math.max(0.05, Math.min(0.7, 0.2 + 0.18 * (fora - 1) - 0.12 * melNivel(s, 'muro')));
  if (!rng.chance(p)) return;
  const bau = { ...useJogo.getState().bau }, ids = Object.keys(bau).filter(i => ITENS[i] && !['semente'].includes(i)); if (!ids.length) return; rng.embaralhar(ids); let perdidos = 0;
  for (const id of ids.slice(0, rng.int(1, 3))) { const q = Math.max(1, Math.ceil(bau[id] * rng.range(0.3, 0.6))); bau[id] -= q; perdidos += q; if (bau[id] <= 0) delete bau[id]; }
  s.bau = bau; useJogo.setState({ bau }); toast(`Saquearam o abrigo enquanto você estava fora (−${perdidos} itens). Melhore a muralha!`, '#e0553f');
}

// ---------------------------------------------------------------- lançamento de suprimentos
function airdropDaZona(c: Cena) {
  const s = c.s, d = dia(c), z = c.ze; if (z.airdrop && z.airdrop.dia === d && z.airdrop.coletado) return;
  const rng = new Rng(`${s.seed}|airdrop|${c.zona.id}|${d}`); if (!z.airdrop || z.airdrop.dia !== d) { const forcado = c.devForcar === 'airdrop'; c.devForcar = forcado ? null : c.devForcar; if (!forcado && !rng.chance(0.34)) { z.airdrop = { dia: d, x: -1, y: -1, coletado: true }; return; } const pt = pontoLivre(c, rng, 22, 42); if (!pt) { z.airdrop = { dia: d, x: -1, y: -1, coletado: true }; return; } z.airdrop = { dia: d, x: pt[0], y: pt[1], coletado: false }; }
  if (z.airdrop.coletado || z.airdrop.x < 0) return;
  const comuns = ['municao', 'cartucho', 'bandagem', 'kit', 'antirrad', 'combustivel', 'bateria', 'eletronico', 'enlatado', 'agua', 'combustivel'], loot: string[] = [];
  for (let i = 0; i < rng.int(3, 5); i++) loot.push(rng.pick(comuns)); if (rng.chance(0.35)) loot.push(rng.pick(['pistola', 'escopeta', 'rifle', 'machado']));
  const rec = { tipo: 'prop' as const, n: 'caixote_militar', v: 2, d: 0.3, o: 0 as const, sem: 424242 }, [w, h] = dimProp(rec.n, 0), { x, y } = z.airdrop;
  const p: Prop = { id: ID_AIRDROP, rec, x, y, w, h, solido: true, inters: [{ k: 'saque', rot: 'Abrir suprimentos lançados', dur: 2.8, ruido: 7 }], loot, aberto: false, luz: { r: 7, cor: 0xff5a30, f: 0.25, noite: false } };
  const q = c.est(rec), [sx, sy] = proj(x + w / 2, y + h / 2), spr = c.img(sx, sy, q).setDepth((x + y + (w + h) / 2) * 10 - (w + h) * 4);
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) c.zona.solido[idx(i, j)] = 1;
  c.zona.props.push(p); c.props.push({ p, spr, rast: { spr, i: idx(x, y), lvl: -1 } });
  c.luzes.push({ x: x + w / 2, y: y + h / 2, r: 7, cor: 0xff5a30, f: 0.25, noite: false, glow: c.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(89000).setTint(0xff5a30).setAlpha(0) });
  montarInterativos(c); c.airdrop = { x: x + w / 2, y: y + h / 2, prop: p, msg: false, t: 0 };
  // guardiões: a fumaça atraiu gente
  const g = 9000 + (d % 50), perigo = c.bioma.inimigos.length ? c.bioma.inimigos : [['irradiado', 1] as [string, number]];
  if (c.bioma.gangues > 0 || ['cidade', 'industrial'].includes(c.bioma.id)) spawnGrupo(c, rng, 'saqueador', rng.int(2, 3), [x, y], g, false, 0); else spawnGrupo(c, rng, rng.peso(perigo), rng.int(3, 4), [x, y], g);
}
/** fumaça de sinalização (por quadro) */
export function desenharBeacon(c: Cena, dt: number) {
  const a = c.airdrop; if (!a) return; a.t += dt; if (a.t < 0.07) return; a.t = 0;
  const [sx, sy] = proj(a.x, a.y); c.part.emitir(2, sx, sy, 10, { vz: 46, esp: 5, g: -26, vida: 2.6, cor: [0xff4a2a, 0xff7a3a, 0xa03020, 0x6a2a20], tam: 2 });
}
/** seta de direção para o HUD (null se não há alvo) */
export function setaAirdrop(c: Cena) {
  const a = c.airdrop; if (!a || a.prop.aberto) return null; const [ax, ay] = proj(a.x, a.y), [jx, jy] = proj(c.jog.x, c.jog.y);
  return { dx: (ax - jx) * c.esc, dy: (ay - jy) * c.esc, d: Math.round(Math.hypot(a.x - c.jog.x, a.y - c.jog.y)) };
}

// ---------------------------------------------------------------- invasão ao abrigo (à noite, a partir do dia 2)
export function atualizarDiretor(c: Cena, _dt: number) {
  const s = c.s; if (c.morto) return; void _dt;
  if (c.airdrop && !c.airdrop.msg) { c.airdrop.msg = true; c.time.delayedCall(2500, () => { if (c.airdrop) { toast('Rádio: suprimentos lançados! Siga a fumaça vermelha.', '#e0b83a'); sfx.sinal(); } }); }
  if (c.zona.id !== 'base') return;
  const h = c.hora(), d = dia(c);
  if (c.raid && !c.raid.resolvido) {
    const vivos = c.ents.filter(e => e.vivo && e.grupo === c.raid!.grupo);
    for (const e of vivos) { e.estado = 'persegue'; e.alvo = { x: c.jog.x, y: c.jog.y }; e.semVer = 0; }
    if (!vivos.length) { c.raid.resolvido = true; toast('Invasão repelida! O abrigo está a salvo.', '#8fe36a'); sfx.raro(); ganharXp(c, 40 + 8 * d); registrar(c, 'raids'); s.balas.municao = (s.balas.municao ?? 0) + 4; useJogo.setState({ balas: { ...s.balas } }); }
    return;
  }
  const forcar = c.devForcar === 'raid';
  if (c.raid || (!forcar && (d < 2 || s.raidDia === d || h < 21.5 || h >= 23.5))) return;
  s.raidDia = d; const rng = new Rng(`${s.seed}|raid|${d}`); if (!forcar && !rng.chance(DIF.chanceRaid[dif(s)])) return; c.devForcar = null;
  toast('Rádio: movimento suspeito ao norte do abrigo. Prepare-se!', '#e0b83a'); sfx.sinal();
  c.time.delayedCall(forcar ? 1200 : 9000, () => {
    if (c.zona.id !== 'base' || c.morto) return;
    const n = tamanhoRaid(d, melNivel(s, 'muro'), dif(s)), grupo = 8000 + d;
    const tipos: [string, number][] = d < 4 ? [['irradiado', 5], ['corredor', 2]] : d < 7 ? [['irradiado', 4], ['corredor', 3], ['saqueador', 2]] : [['irradiado', 3], ['corredor', 3], ['saqueador', 3], ['filho', 2]];
    const base = pontoLivre(c, rng, 26, 34) ?? pontoLivre(c, rng, 20, 40); if (!base) return;
    for (let i = 0; i < n; i++) { const a = rng.peso(tipos); spawnGrupo(c, rng, a, 1, base, grupo, true, a === 'saqueador' ? 0 : a === 'filho' ? 1 : undefined); }
    if (d >= 8 && rng.chance(0.3)) spawnGrupo(c, rng, 'colosso', 1, base, grupo, true);
    c.raid = { grupo, total: n, resolvido: false }; toast('ALARME! Invasores no portão!', '#e0553f'); sfx.alarme(); c.cameras.main.flash(180, 90, 12, 8);
  });
}
