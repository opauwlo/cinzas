// Criaturas em jogo: criação, IA por família (cambalear, matilha, ranged, passivo, colosso, voo, inseto), combate, desmembramento e sprites animados.
import * as ROT from 'rot-js';
import type * as Phaser from 'phaser';
import type { Cena } from '../cena';
import { dirTela, proj, ang } from '../util';
import { ponte } from '../ponte';
import { ARQS, arqDe, FACCOES, type Arq } from '../dados/criaturas';
import { armaDe, ARMAS } from '../dados/itens';
import { Rng } from '../lib/rng';
import { clipesDe, type Quadro } from '../lib/fabrica';
import { useJogo } from '../store';
import { sfx } from '../audio';
import { T, idx, dentro, W, H } from '../zona';
import { mostrarCadaver } from './acoes';
import { registrar, ganharXp, pk, DIF, dif } from './progresso';
import { tensaoDano, tensaoAbate } from './spawn';

import type { Oferta, TipoNpc } from '../dados/npcs';
export type NpcInfo = { tipo: TipoNpc; nome: string; casa: { x: number; y: number }; id: string; falou: boolean; ferido: boolean; estoque?: Oferta[]; rumores?: number };
export type Ent = {
  id: number; sid: number | null; arq: Arq; rec: Record<string, unknown> & { falta?: string[]; arma?: string }; x: number; y: number; z: number; ang: number; hp: number; maxHp: number;
  estado: 'ocioso' | 'investiga' | 'persegue' | 'foge' | 'morto' | 'voando'; alvo: { x: number; y: number } | null; caminho: [number, number][]; tCam: number;
  cd: number; atk: number; atkDur: number; atkOk: boolean; dano: number; morrT: number; tSent: number; semVer: number; vagar: number; kx: number; ky: number; fase: number; dir: number;
  spr: Phaser.GameObjects.Image; som: Phaser.GameObjects.Image; lvl: number; grupo: number; faccao?: number; vivo: boolean; remover?: boolean; ultQ?: Quadro; clip: string;
  tiroCd: number; mult: number; vozT: number; fugaT: number; voaT: number; cadaver?: boolean; alpha: number;
  npc?: NpcInfo; bolha?: Phaser.GameObjects.Text;
};
let EID = 1;

export function multVelocidade(arq: Arq, rec: Ent['rec']) {
  if (arq.modelo !== 'humano' || arq.id === 'rastejador' || arq.id === 'colosso') return 1; const f = rec.falta ?? [], pernas = f.filter(x => x.startsWith('perna')).length; return pernas >= 2 ? 0.4 : pernas === 1 ? 0.65 : 1;
}
export function criarEnt(c: Cena, arqId: string, x: number, y: number, sid: number | null, grupo: number, faccao?: number): Ent {
  const arq = ARQS[arqId], rng = new Rng(`${c.s.seed}|${c.zona.id}|${sid ?? Math.floor(Math.random() * 1e6)}`), rec = arq.rec(rng, faccao) as Ent['rec'];
  const e: Ent = { id: EID++, sid, arq, rec, x, y, z: 0, ang: Math.random() * 6.28, hp: arq.hp * rng.range(0.9, 1.15), maxHp: 0, estado: 'ocioso', alvo: null, caminho: [], tCam: 0, cd: 0, atk: 0, atkDur: 0.5, atkOk: true, dano: 0, morrT: 0, tSent: Math.random(), semVer: 0, vagar: Math.random() * 3, kx: 0, ky: 0, fase: Math.random() * 10, dir: 0,
    spr: c.add.image(0, 0, 'sombra').setAlpha(0), som: c.add.image(0, 0, 'sombra').setAlpha(0), lvl: -1, grupo, faccao, vivo: true, clip: 'parado', tiroCd: 1 + Math.random() * 2, mult: 1, vozT: 2 + Math.random() * 6, fugaT: 0, voaT: 0, alpha: 0 };
  e.maxHp = e.hp; e.mult = multVelocidade(arq, rec); c.ents.push(e); return e;
}
const ehRanged = (e: Ent) => e.arq.ia === 'ranged' && ['pistola', 'escopeta', 'rifle'].includes(e.rec.arma ?? '');

// ---------------------------------------------------------------- dano
export function machucarJogador(c: Cena, dano: number, sangra: number, de?: { x: number; y: number }) {
  if (c.morto) return; const st = useJogo.getState(), colete = st.inv.colete ? 0.75 : 1; dano *= colete * (pk(c.s, 'pele') ? 0.85 : 1) * DIF.dano[dif(c.s)]; c.s.hp -= dano; c.tensao = tensaoDano(c.tensao, dano); c.jog.dano = 0.22;
  if (Math.random() < sangra && !c.s.sangra) { c.s.sangra = true; st.toast('Você está sangrando', '#c9561f'); }
  c.texto(c.jog.x, c.jog.y - 0.3, '-' + Math.round(dano), '#d9472b'); c.cameras.main.shake(140, 0.006); sfx.dano(); useJogo.setState({ danoTs: Date.now() });
  if (st.cfg.gore) { const [px, py] = proj(c.jog.x, c.jog.y, 18), dx = de ? c.jog.x - de.x : 0, dy = de ? c.jog.y - de.y : 0, m = Math.hypot(dx, dy) || 1; c.part.sangue(px, py, 18, dx / m, dy / m, 5); }
  if (c.acao) { c.acao = null; st.toast('Interrompido', '#d9a02b'); }
  if (c.s.hp <= 0) c.morrer('Morto por criaturas do ermo');
}
const LIMBS = ['bracoE', 'bracoD', 'pernaE', 'pernaD'];
export function ferir(c: Cena, e: Ent, dano: number, de: number, corta = false) {
  if (!e.vivo) return; const st = useJogo.getState(); e.hp -= dano; c.texto(e.x, e.y - 0.4, String(Math.round(dano))); e.kx = Math.cos(de) * (e.arq.grande ? 1.5 : 5); e.ky = Math.sin(de) * (e.arq.grande ? 1.5 : 5); e.dano = 0.18;
  if (e.arq.hostil || e.arq.ia === 'passivo') { if (e.arq.ia === 'passivo') { e.estado = 'foge'; e.fugaT = 6; } else { e.estado = 'persegue'; e.semVer = 0; e.alvo = { x: c.jog.x, y: c.jog.y }; alertarGrupo(c, e); } }
  if (st.cfg.gore) { const [px, py] = proj(e.x, e.y, 18); c.part.sangue(px, py, 18, Math.cos(de), Math.sin(de), e.arq.modelo === 'inseto' ? 3 : 7); }
  e.lvl = -3; c.time.delayedCall(90, () => { e.lvl = -1; });
  // desmembramento (lâminas) em humanoides
  if (corta && e.arq.modelo === 'humano' && st.cfg.gore && e.arq.id !== 'colosso' && Math.random() < Math.min(0.3, 0.08 + dano / 140)) {
    const falta = (e.rec.falta ?? []).slice(), livres = LIMBS.filter(l => !falta.includes(l)); if (livres.length) { const l = livres[Math.floor(Math.random() * livres.length)]; falta.push(l); e.rec = { ...e.rec, falta }; e.mult = multVelocidade(e.arq, e.rec); const [px, py] = proj(e.x, e.y, 14); c.part.sangue(px, py, 14, Math.cos(de), Math.sin(de), 14); st.toast(l.startsWith('braco') ? 'Braço decepado' : 'Perna decepada', '#c9561f'); registrar(c, 'membros'); }
  }
  if (e.hp <= 0) matar(c, e);
}
function matar(c: Cena, e: Ent) {
  e.vivo = false; e.estado = 'morto'; e.morrT = 0; e.atk = 0; c.s.abates++; c.tensao = tensaoAbate(c.tensao); if (e.sid !== null) c.ze.abatidos.push(e.sid);
  e.bolha?.destroy(); e.bolha = undefined; if (e.npc) { c.ze.npcMortos = [...(c.ze.npcMortos ?? []), e.npc.id]; c.s.traiu = true; c.s.abates--; }
  else registrar(c, 'abate', 1, { arq: e.arq.id }); if (e.arq.id === 'colosso') registrar(c, 'colossos'); if (['saqueador', 'filho', 'miliciano'].includes(e.arq.id)) registrar(c, 'gangue'); ganharXp(c, e.arq.xp, false);
  e.som.setAlpha(0); sfx.voz(e.arq.voz, 0, 0, 0.5); c.cadaveres.push(e); if (c.cadaveres.length > 40) { const o = c.cadaveres.shift()!; o.remover = true; o.spr.destroy(); o.som.destroy(); }
  if (e.arq.drops.length || e.arq.ia === 'passivo') mostrarCadaver(c, e);
}
export function alertarGrupo(c: Cena, e: Ent) { if (e.grupo < 0) return; for (const o of c.ents) if (o !== e && o.vivo && o.grupo === e.grupo && o.arq.hostil && o.estado !== 'persegue' && Math.hypot(o.x - e.x, o.y - e.y) < 16) { o.estado = 'persegue'; o.alvo = { x: c.jog.x, y: c.jog.y }; o.semVer = 0; } }
export function iniciarMorte(c: Cena) { c.jog.morrendo = 0.9; }

// ---------------------------------------------------------------- ataque do jogador
export function atacarJogador(c: Cena) {
  if (c.cdAtaque > 0 || c.morto || c.acao) return; const J = c.jog, arma = armaDe(c.s.arma);
  if (arma.alvo === 'tiro') {
    const mun = arma.municao!; if ((c.s.balas[mun] ?? 0) <= 0) { if (performance.now() - (J as unknown as { av?: number }).av! > 900 || (J as unknown as { av?: number }).av === undefined) { (J as unknown as { av?: number }).av = performance.now(); sfx.seco(); useJogo.getState().toast('Sem munição', '#d9a02b'); } c.cdAtaque = 0.3; return; }
    c.s.balas[mun]--; c.cdAtaque = arma.cd; J.atk = J.atkDur = 0.2; const n = arma.pelotas ?? 1;
    for (let p = 0; p < n; p++) {
      const a = J.ang + (Math.random() - 0.5) * (n > 1 ? 0.3 : 0.07) * (pk(c.s, 'mira') ? 0.6 : 1), lim = c.obstaculoAte(J.x, J.y, a, arma.alcance); let alvo: Ent | null = null, melhor = lim;
      for (const e of c.ents) { if (!e.vivo) continue; const dx = e.x - J.x, dy = e.y - J.y, pr = dx * Math.cos(a) + dy * Math.sin(a); if (pr < 0 || pr > melhor) continue; const pe = Math.abs(-Math.sin(a) * dx + Math.cos(a) * dy); if (pe < e.arq.raio + 0.14) { alvo = e; melhor = pr; } }
      const fim = alvo ? melhor : lim, [x0, y0] = proj(J.x + Math.cos(a) * 0.8, J.y + Math.sin(a) * 0.8, 18), [x1, y1] = proj(J.x + Math.cos(a) * fim, J.y + Math.sin(a) * fim, 18); c.tracers.push({ x0, y0, x1, y1, t: 0, cor: 0xffe0a0 });
      if (alvo) { ferir(c, alvo, arma.dano * (pk(c.s, 'mira') ? 1.25 : 1), a); sfx.acerto(); c.hitstop = 0.04; }
    }
    c.flash = 0.14; const [fx, fy] = proj(J.x + Math.cos(J.ang) * 0.9, J.y + Math.sin(J.ang) * 0.9, 18); c.clarao.setPosition(Math.round(fx), Math.round(fy)).setVisible(true); const [px, py] = proj(J.x, J.y, 18); c.part.faisca(fx, fy, 14, 5); void px; void py;
    sfx.tiro(arma.id); c.ruido(J.x, J.y, arma.ruido); c.cameras.main.shake(90, arma.id === 'escopeta' ? 0.007 : 0.004);
  } else {
    if (c.s.stamina < arma.custo + 1) { c.cdAtaque = 0.6; return; } c.s.stamina -= arma.custo; c.cdAtaque = arma.cd; J.atk = J.atkDur = Math.min(0.34, arma.cd * 0.85); sfx.swing(); c.ruido(J.x, J.y, arma.ruido);
    const a0 = J.ang; c.time.delayedCall(J.atkDur * 0.45 * 1000, () => {
      let bateu = false; for (const e of c.ents) { if (!e.vivo || e.arq.ia === 'voo') continue; const dx = e.x - J.x, dy = e.y - J.y, d = Math.hypot(dx, dy); if (d < arma.alcance + e.arq.raio && Math.abs(ang(Math.atan2(dy, dx) - a0)) < 1.0 && c.temLOS(J.x, J.y, e.x, e.y)) { ferir(c, e, arma.dano * (0.85 + Math.random() * 0.3) * (pk(c.s, 'forte') ? 1.25 : 1), a0, !!arma.corta); bateu = true; } }
      if (bateu) { sfx.acerto(); c.hitstop = 0.055; c.cameras.main.shake(100, 0.005); }
    });
  }
}

// ---------------------------------------------------------------- IA
function seguir(c: Cena, e: Ent, vel: number, dt: number) {
  if (!e.alvo) return; const adx = e.alvo.x - e.x, ady = e.alvo.y - e.y, ad = Math.hypot(adx, ady), r = Math.min(e.arq.raio, 0.42);
  if (ad < 0.5 && e.estado !== 'persegue') { e.alvo = null; if (e.estado === 'investiga') e.estado = 'ocioso'; return; }
  let tx = e.alvo.x, ty = e.alvo.y; const direto = ad < 6 && c.temLOS(e.x, e.y, e.alvo.x, e.alvo.y);
  if (!direto) {
    e.tCam -= dt; if ((!e.caminho.length || e.tCam <= 0) && c.pathBudget > 0) { c.pathBudget--; e.tCam = 0.7; const cam: [number, number][] = []; new ROT.Path.AStar(Math.floor(e.alvo.x), Math.floor(e.alvo.y), (x, y) => dentro(x, y) && !c.zona.solido[idx(x, y)], { topology: 8 }).compute(Math.floor(e.x), Math.floor(e.y), (x, y) => cam.push([x, y])); cam.shift(); e.caminho = cam; }
    if (e.caminho.length) { tx = e.caminho[0][0] + 0.5; ty = e.caminho[0][1] + 0.5; if (Math.hypot(tx - e.x, ty - e.y) < 0.3) e.caminho.shift(); }
  }
  const a = Math.atan2(ty - e.y, tx - e.x); e.ang += ang(a - e.ang) * Math.min(1, dt * 9); const sx = Math.cos(a) * vel * dt, sy = Math.sin(a) * vel * dt;
  if (!c.colide(e.x + sx, e.y, r)) e.x += sx; if (!c.colide(e.x, e.y + sy, r)) e.y += sy; e.fase += vel * dt * 1.6;
  const d = c.tipoEm(Math.floor(e.x), Math.floor(e.y)); if (d === T.PORTA) c.abrirPorta(idx(Math.floor(e.x), Math.floor(e.y)));
}
function fugir(c: Cena, e: Ent, vel: number, dt: number) {
  const dx = e.x - c.jog.x, dy = e.y - c.jog.y, m = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx) + Math.sin(c.tempo + e.id) * 0.5; e.ang += ang(a - e.ang) * Math.min(1, dt * 10);
  const sx = Math.cos(e.ang) * vel * dt, sy = Math.sin(e.ang) * vel * dt, r = Math.min(e.arq.raio, 0.42); if (!c.colide(e.x + sx, e.y, r)) e.x += sx; if (!c.colide(e.x, e.y + sy, r)) e.y += sy; e.fase += vel * dt * 1.6; void m;
}
function iniciarAtaque(e: Ent, dur: number) { e.atk = e.atkDur = dur; e.atkOk = false; }

export function atualizarEnt(c: Cena, e: Ent, dt: number, noite: number) {
  const J = c.jog, arq = e.arq, dx = J.x - e.x, dy = J.y - e.y, dist = Math.hypot(dx, dy);
  if (!e.vivo) { e.morrT += dt; return; }
  e.dano = Math.max(0, e.dano - dt); e.cd -= dt; e.tiroCd -= dt; e.vozT -= dt; if (e.atk > 0) e.atk -= dt;
  if (e.kx || e.ky) { const sx = e.kx * dt, sy = e.ky * dt, r = Math.min(arq.raio, 0.42); if (!c.colide(e.x + sx, e.y, r)) e.x += sx; if (!c.colide(e.x, e.y + sy, r)) e.y += sy; e.kx *= 0.82; e.ky *= 0.82; if (Math.abs(e.kx) < 0.05) e.kx = e.ky = 0; }
  // voz ocasional
  if (e.vozT <= 0 && dist < 24 && arq.hostil) { e.vozT = (e.estado === 'persegue' ? 2.5 : 8) + Math.random() * 6; const [sxx] = proj(e.x, e.y), [jx] = proj(J.x, J.y); sfx.voz(arq.voz, dist, Math.max(-1, Math.min(1, (sxx - jx) / 120)), e.estado === 'persegue' ? 1 : 0.6); }
  const mult = e.mult;
  // ---- voo (corvo)
  if (arq.ia === 'voo') {
    if (e.estado !== 'voando' && (dist < 5 || (c.s.minutos % 1 < 0.001 && false))) { e.estado = 'voando'; e.voaT = 0; }
    if (e.estado === 'voando') { e.voaT += dt; e.z = Math.min(46, e.z + 40 * dt); const a = Math.atan2(-dy, -dx) + Math.sin(e.voaT * 2) * 0.4; e.x += Math.cos(a) * 3.2 * dt; e.y += Math.sin(a) * 3.2 * dt; e.ang = a; e.fase += dt * 9; if (e.voaT > 5) { e.remover = true; e.spr.destroy(); e.som.destroy(); } }
    return;
  }
  // ---- NPC (mascate, sobrevivente, viajante)
  if (arq.ia === 'npc' && e.npc) { atualizarNpc(c, e, dt); return; }
  // ---- passivo (caça)
  if (arq.ia === 'passivo') {
    if (e.estado !== 'foge' && dist < arq.visao * (c.ambient < 0.4 ? 0.5 : 1) * (ponte_corre() ? 1.3 : 1) && c.temLOS(e.x, e.y, J.x, J.y)) { e.estado = 'foge'; e.fugaT = 5; }
    if (e.estado === 'foge') { e.fugaT -= dt; fugir(c, e, arq.corre * mult, dt); if (e.fugaT <= 0 || dist > 22) e.estado = 'ocioso'; return; }
    e.vagar -= dt; if (e.vagar <= 0) { e.vagar = 3 + Math.random() * 5; if (Math.random() < 0.6) { const tx = Math.floor(e.x + (Math.random() - 0.5) * 8), ty = Math.floor(e.y + (Math.random() - 0.5) * 8); if (dentro(tx, ty) && !c.solidoEm(tx, ty)) { e.alvo = { x: tx + 0.5, y: ty + 0.5 }; e.caminho = []; } else e.alvo = null; } else e.alvo = null; }
    if (e.alvo) seguir(c, e, arq.vel * 0.7, dt); return;
  }
  // ---- percepção (hostis)
  e.tSent -= dt;
  if (e.tSent <= 0) {
    e.tSent = 0.25 + Math.random() * 0.15; const mp = ponte_furtivo() ? 0.5 : ponte_corre() ? 1.3 : 1, alc = arq.visao * (1 - noite * 0.35) * mp * c.clima.visibilidade;
    if (!c.morto && dist < alc && c.temLOS(e.x, e.y, J.x, J.y)) { if (e.estado !== 'persegue') { e.tCam = 0; alertarGrupo(c, e); } e.estado = 'persegue'; e.alvo = { x: J.x, y: J.y }; e.semVer = 0; }
    else if (e.estado === 'persegue') { e.semVer += 0.3; if (e.semVer > 6) { e.estado = 'investiga'; e.caminho = []; } }
  }
  // ---- fuga por pouca vida (humanos)
  if (e.estado === 'foge') { e.fugaT -= dt; fugir(c, e, arq.corre, dt); if (e.fugaT <= 0) e.estado = 'persegue'; return; }
  if ((arq.ia === 'ranged' || arq.ia === 'melee_humano') && e.hp < e.maxHp * 0.22 && Math.random() < dt * 0.6 && e.estado === 'persegue') { e.estado = 'foge'; e.fugaT = 5; return; }
  const noiteMult = 1 + noite * 0.25; let vel = arq.vel * noiteMult * mult * (e.estado === 'persegue' ? 1 : 0.5); if (e.estado === 'persegue') vel = Math.max(vel, arq.corre * (arq.id === 'corredor' ? 1 : 0.6 + noite * 0.4) * mult * (arq.ia === 'cambalear' && arq.id !== 'corredor' ? 0.85 : 1));
  if (e.estado === 'ocioso') { e.vagar -= dt; if (e.vagar <= 0) { e.vagar = 2 + Math.random() * 4; if (Math.random() < 0.55) { const tx = Math.floor(e.x + (Math.random() - 0.5) * 7), ty = Math.floor(e.y + (Math.random() - 0.5) * 7); if (dentro(tx, ty) && !c.solidoEm(tx, ty)) { e.alvo = { x: tx + 0.5, y: ty + 0.5 }; e.caminho = []; e.tCam = 0; } } else e.alvo = null; } }
  // ---- ranged: mantém distância e atira
  if (ehRanged(e) && e.estado === 'persegue' && !c.morto) {
    const arma = ARMAS[e.rec.arma ?? 'pistola'] ?? ARMAS.pistola, alvoDist = arma.id === 'escopeta' ? 3.5 : arma.id === 'rifle' ? 8 : 5.5;
    const viu = c.temLOS(e.x, e.y, J.x, J.y); e.ang += ang(Math.atan2(dy, dx) - e.ang) * Math.min(1, dt * 10);
    if (dist > alvoDist + 2 || !viu) { e.alvo = { x: J.x, y: J.y }; seguir(c, e, vel, dt); } else if (dist < alvoDist - 1.5) { fugir(c, e, arq.vel * 1.2, dt); } else { e.fase += dt * 0.5; }
    if (viu && dist < 12 && e.tiroCd <= 0 && e.atk <= 0) { iniciarAtaque(e, 0.4); e.tiroCd = (arma.id === 'escopeta' ? 2.2 : arma.id === 'rifle' ? 1.8 : 1.4) + Math.random() * 0.8; }
    if (e.atk > 0 && !e.atkOk && e.atk < e.atkDur * 0.5) { e.atkOk = true; const p = Math.max(0.2, Math.min(0.8, 0.85 - dist * 0.06)) * (c.s.hp > 0 ? 1 : 0), [x0, y0] = proj(e.x, e.y, 18); const hit = Math.random() < p, a = Math.atan2(dy, dx), fim = hit ? dist : dist + 2; const [x1, y1] = proj(e.x + Math.cos(a) * fim, e.y + Math.sin(a) * fim, 18); c.tracers.push({ x0, y0, x1, y1, t: 0, cor: 0xffb070 }); const [sxx] = proj(e.x, e.y), [jx] = proj(J.x, J.y); sfx.tiroInimigo(dist, Math.max(-1, Math.min(1, (sxx - jx) / 120))); c.ruido(e.x, e.y, 14); if (hit) machucarJogador(c, arq.dano * (arma.id === 'escopeta' ? 1.7 : arma.id === 'rifle' ? 1.4 : 1) * (0.8 + Math.random() * 0.4), 0.1, e); }
    return;
  }
  // ---- corpo a corpo (zumbis, matilha, humanos corpo a corpo, insetos, colosso)
  if (e.alvo) seguir(c, e, e.atk > 0 ? vel * 0.2 : vel, dt);
  const alc = arq.alcance * (arq.grande ? 1 : 1);
  if (!c.morto && e.estado === 'persegue' && dist < alc && e.cd <= 0 && e.atk <= 0) { iniciarAtaque(e, arq.ia === 'colosso' ? 0.9 : 0.45); e.cd = arq.cd; e.ang = Math.atan2(dy, dx); if (arq.ia === 'colosso') sfx.voz('colosso', dist, 0, 1); }
  if (e.atk > 0 && !e.atkOk && e.atk < e.atkDur * 0.5) {
    e.atkOk = true;
    if (arq.ia === 'colosso') { c.cameras.main.shake(260, 0.012); const [px, py] = proj(e.x + Math.cos(e.ang) * 1.5, e.y + Math.sin(e.ang) * 1.5); c.part.poeira(px, py, 14); if (dist < 2.6) { machucarJogador(c, arq.dano * (0.8 + Math.random() * 0.4), 0.3, e); J.x += Math.cos(e.ang) * 0.4; J.y += Math.sin(e.ang) * 0.4; } }
    else if (dist < alc * 1.5) machucarJogador(c, arq.dano * (0.8 + Math.random() * 0.4), arq.modelo === 'quad' ? 0.35 : arq.id === 'escorpiao' ? 0.5 : 0.08, e);
  }
}
/** NPC: fica perto de casa, olha para o jogador, foge de hostis (e de quem o ataca; atacar NPC queima a reputação) */
function atualizarNpc(c: Cena, e: Ent, dt: number) {
  const J = c.jog, n = e.npc!, arq = e.arq, dist = Math.hypot(J.x - e.x, J.y - e.y);
  if (e.dano > 0 && !n.ferido) { n.ferido = true; c.s.traiu = true; c.s.st!.npcFerido = (c.s.st!.npcFerido ?? 0) + 1; useJogo.getState().toast(`Você atacou ${n.nome}. Os mascates vão ficar sabendo.`, '#e0553f'); }
  let ax = 0, ay = 0, ameaca = false;
  if (n.ferido) { ax = J.x; ay = J.y; ameaca = true; }
  else for (const o of c.ents) if (o.vivo && o.arq.hostil && Math.abs(o.x - e.x) < 9 && Math.abs(o.y - e.y) < 9 && Math.hypot(o.x - e.x, o.y - e.y) < 8) { ax = o.x; ay = o.y; ameaca = true; break; }
  if (ameaca) { e.estado = 'foge'; e.fugaT = 3; }
  if (e.estado === 'foge') {
    e.fugaT -= dt; e.ang += ang(Math.atan2(e.y - ay, e.x - ax) - e.ang) * Math.min(1, dt * 10); e.alvo = null;
    const sx = Math.cos(e.ang) * arq.corre * dt, sy = Math.sin(e.ang) * arq.corre * dt, r = Math.min(arq.raio, 0.42); if (!c.colide(e.x + sx, e.y, r)) e.x += sx; if (!c.colide(e.x, e.y + sy, r)) e.y += sy; e.fase += arq.corre * dt * 1.6;
    if (e.fugaT <= 0 && !ameaca) e.estado = 'ocioso'; bolhaNpc(c, e, dist); return;
  }
  if (dist < 6 && c.temLOS(e.x, e.y, J.x, J.y)) e.ang += ang(Math.atan2(J.y - e.y, J.x - e.x) - e.ang) * Math.min(1, dt * 5);
  const raio = n.tipo === 'acampado' ? 1.6 : n.tipo === 'mascate' ? 4 : 12;
  e.vagar -= dt;
  if (e.vagar <= 0) {
    e.vagar = n.tipo === 'viajante' ? 5 + Math.random() * 6 : 4 + Math.random() * 6;
    if (dist < 3.5 && n.tipo !== 'viajante') e.alvo = null;
    else if (Math.random() < (n.tipo === 'acampado' ? 0.3 : 0.7)) { const tx = Math.floor(n.casa.x + (Math.random() - 0.5) * 2 * raio), ty = Math.floor(n.casa.y + (Math.random() - 0.5) * 2 * raio); if (dentro(tx, ty) && !c.solidoEm(tx, ty) && c.zona.tipos[idx(tx, ty)] !== T.PORTA) { e.alvo = { x: tx + 0.5, y: ty + 0.5 }; e.caminho = []; e.tCam = 0; } }
    else e.alvo = null;
  }
  if (e.alvo) seguir(c, e, arq.vel * (n.tipo === 'viajante' ? 1.1 : 0.8), dt);
  bolhaNpc(c, e, dist);
}
/** "…" sobre quem ainda não conversou, enquanto você está por perto */
function bolhaNpc(c: Cena, e: Ent, dist: number) {
  const n = e.npc!, quer = !n.falou && !n.ferido && dist < 9;
  if (quer && !e.bolha) e.bolha = c.add.text(0, 0, '…', { fontFamily: 'VT323, monospace', fontSize: '22px', color: '#ffe9a0', stroke: '#0a0908', strokeThickness: 4 }).setOrigin(0.5).setDepth(95500);
  if (e.bolha) { if (!quer) { e.bolha.destroy(); e.bolha = undefined; } else { const [px, py] = proj(e.x, e.y, 62 + Math.sin(c.tempo * 3 + e.id) * 2); e.bolha.setPosition(Math.round(px), Math.round(py)); } }
}
const ponte_corre = () => ponte.entrada.correr;
const ponte_furtivo = () => ponte.entrada.furtivo;

// ---------------------------------------------------------------- sprite animado
export function atualizarSpr(c: Cena, e: Ent, dt: number, noite: number) {
  const ix = Math.min(W - 1, Math.max(0, Math.floor(e.x))), iy = Math.min(H - 1, Math.max(0, Math.floor(e.y))), i = idx(ix, iy), J = c.jog, d = Math.hypot(e.x - J.x, e.y - J.y); if (e.remover) return;
  const luz = c.luzFrame[i], vis = e.vivo ? (luz > 0.4 ? 1 : 0) : (luz > 0.25 || c.lmA[i] < 0.8 ? 1 : 0); e.alpha += (vis - e.alpha) * Math.min(1, dt * 12); e.spr.setAlpha(e.alpha);
  if (d > 40 || e.alpha < 0.02 && d > 20) { e.spr.setVisible(false); e.som.setVisible(false); return; } e.spr.setVisible(true); e.som.setVisible(true);
  const modelo = e.arq.modelo, cl = e.arq.clipes, cm = clipesDe(modelo); let clip = cl.parado, f = 0;
  const falta = e.rec.falta ?? [], pernas = falta.filter(x => x.startsWith('perna')).length, andar = pernas >= 2 && e.arq.id !== 'rastejador' ? 'rastejar' : pernas === 1 && modelo === 'humano' && e.arq.id !== 'rastejador' ? 'mancar' : cl.andar;
  if (!e.vivo) { clip = cl.morrer; const n = cm[clip]?.n ?? 1; f = Math.min(n - 1, Math.floor(e.morrT / 0.13)); }
  else if (e.dano > 0.05) { clip = cl.dano; f = 0; }
  else if (e.atk > 0) { clip = ehRanged(e) ? 'atirar' : cl.golpear; if (!cm[clip]) clip = cl.golpear; const n = cm[clip]?.n ?? 1; f = Math.min(n - 1, Math.floor((1 - e.atk / e.atkDur) * n)); }
  else if (e.estado === 'voando') { clip = cl.correr ?? cl.andar; f = Math.floor(e.fase) % (cm[clip]?.n ?? 1); }
  else { const mov = e.alvo !== null || e.estado === 'persegue' || e.estado === 'foge'; if (mov) { const corre = e.estado === 'persegue' || e.estado === 'foge'; clip = corre && cl.correr && pernas === 0 ? cl.correr : andar; if (e.arq.id === 'corredor' && !corre) clip = 'cambalear'; f = Math.floor(e.fase) % (cm[clip]?.n ?? 4); } else { clip = cl.parado; f = Math.floor(c.tempo * 1.2 + e.id) % (cm[clip]?.n ?? 1); } }
  e.dir = e.vivo || !e.ultQ ? dirTela(e.ang) : e.dir; e.clip = clip;
  const q = c.fab.pedir(modelo, e.rec as object, clip, e.dir, f, d) ?? (e.ultQ && c.textures.exists(e.ultQ.key) ? e.ultQ : null);
  if (q) { if (q !== e.ultQ) { c.setQ(e.spr, q); if (c.fab.quadros.get(q.key) === q) e.ultQ = q; } } else { e.spr.setAlpha(0); }
  const [px, py] = proj(e.x, e.y, e.z); e.spr.setPosition(Math.round(px), Math.round(py)).setDepth((e.x + e.y) * 10 + (e.vivo ? 0 : -3000));
  const [gx, gy] = proj(e.x, e.y); const esc = e.arq.grande ? 1.6 : e.arq.modelo === 'inseto' || e.arq.id === 'rato' ? 0.6 : 1; c.sombra(e.som, gx, gy, (e.x + e.y) * 10 - 5, esc, e.vivo ? e.alpha * (1 - Math.min(0.7, e.z / 60)) : 0);
  const l = Math.round(c.lmA[i] * 12); if (e.lvl !== -3 && l !== e.lvl) { e.lvl = l; e.spr.clearTint(); if (l > 0) e.spr.setTint(c.tom(l / 12, noite)); } else if (e.lvl === -3) e.spr.setTint(0xff5a40);
}
void arqDe; void FACCOES;
