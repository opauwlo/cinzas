// Interações do mundo, itens, fabricação, cozinha, sono, horta, viagem, morte e vitória. Tudo que o jogador "faz" além de andar e lutar.
import type { Cena } from '../cena';
import type { Prop } from '../zona';
import { T, W, idx } from '../zona';
import { ITENS, RECEITAS, COZINHA, COR_RARIDADE, pesoDe, armaDe } from '../dados/itens';
import { custoViagem, localPorId } from '../dados/locais';
import { useJogo, pesoMax, horaStr } from '../store';
import { ponte, type Rapido } from '../ponte';
import { sfx } from '../audio';
import { proj } from '../util';
import { apagarRun } from './salvar';
import type { Ent } from './ia';
import { Rng } from '../lib/rng';
import { cabeNaMochila, sincGrade, adicionar, remover, linhasDe, emGrade } from './grade';
import { EVENTOS_VIAGEM, type Ajuda, type EventoViagem } from '../dados/eventos';
import { registrar, ganharXp, pk, melNivel, escolherPerk, receberContrato, melhorar, airdropColetado } from './progresso';

export type Interativo = { x: number; y: number; r: number; rot: string; dur: number; ruido?: number; alt?: number; /** casas ocupadas pela própria peça [x, y, larg, alt]: não contam como obstáculo */ pegada?: [number, number, number, number]; ok: () => boolean; exec: () => void };
const st = () => useJogo.getState();
const FERR = ['pe_de_cabra', 'machado', 'facao', 'faca', 'taco'];
const toast = (t: string, cor?: string) => st().toast(t, cor);

export function cabe(id: string, qtd = 1) { return cabeNaMochila(id, qtd); }
export function dar(c: Cena, id: string, qtd = 1, quieto = false): boolean {
  const it = ITENS[id]; if (!it) return false;
  if (it.tipo === 'municao') { c.s.balas[it.municaoTipo!] = (c.s.balas[it.municaoTipo!] ?? 0) + it.balas! * qtd; if (!quieto) c.flutuar(`+ ${it.nome}`, COR_RARIDADE[it.raridade]); return true; }
  if (!cabe(id, qtd)) { toast('Mochila cheia', '#c9561f'); return false; }
  const inv = { ...st().inv }; inv[id] = (inv[id] ?? 0) + qtd; useJogo.setState({ inv, grade: emGrade(id) ? adicionar(st().grade, linhasDe(inv), id, qtd).g : st().grade }); if (id === 'lanterna') c.s.lanterna.tem = true; if (!quieto) c.flutuar(`+${qtd > 1 ? qtd + ' ' : ''}${it.nome}`, COR_RARIDADE[it.raridade]); registrar(c, 'col_' + id, qtd); return true;
}
export function tirar(id: string, qtd = 1): boolean { const inv = { ...st().inv }; if ((inv[id] ?? 0) < qtd) return false; inv[id] -= qtd; if (inv[id] <= 0) delete inv[id]; useJogo.setState({ inv, grade: emGrade(id) ? remover(st().grade, id, qtd) : st().grade }); return true; }
const tem = (id: string, q = 1) => (st().inv[id] ?? 0) >= q;
const temFerr = () => FERR.some(f => tem(f));
const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export function iniciarAcao(c: Cena, rot: string, dur: number, fim: () => void, ruido?: number, tipo = 'vasculhar') { if (c.acao || c.morto) return; c.acao = { rotulo: rot, dur, t: 0, fim, ruido, tipo, tk: 0, x: c.alvoInter?.x ?? c.jog.x, y: c.alvoInter?.y ?? c.jog.y }; sfx.saque(); }
/** ritmo da coleta: a cada batida, som + partículas do material (madeira, metal, água, poeira) */
export function ticarAcao(c: Cena, dt: number) {
  const a = c.acao; if (!a?.tipo) return; a.tk = (a.tk ?? 0) + dt; if (a.tk < (a.tipo === 'cortar' ? 0.45 : a.tipo === 'metal' ? 0.4 : 0.55)) return; a.tk = 0;
  const [sx, sy] = proj(a.x ?? c.jog.x, a.y ?? c.jog.y, 14);
  if (a.tipo === 'cortar') { sfx.golpe(); c.part.emitir(5, sx, sy, 10, { vz: 26, esp: 36, g: 190, vida: 0.5, cor: [0x8a6a3a, 0xa88a5a, 0x6a4e28] }); c.cameras.main.shake(60, 0.0025); }
  else if (a.tipo === 'metal') { sfx.acerto(false); c.part.faisca(sx, sy, 10, 5); c.cameras.main.shake(50, 0.002); }
  else if (a.tipo === 'agua') { sfx.beber(); c.part.emitir(3, sx, sy, 6, { vz: 16, esp: 14, g: 120, vida: 0.4, cor: [0x6fa6d6, 0x9ac0c8] }); }
  else { sfx.saque(); c.part.poeira(sx, sy, 3); }
}
const painel = (p: 'bau' | 'craft' | 'cozinha' | 'dormir' | 'mapa') => { sfx.ui('abrir'); useJogo.setState({ painel: p }); };

// ---------------------------------------------------------------- interativos do mundo
export function montarInterativos(c: Cena) {
  c.interativos = [];
  for (const ps of c.props) {
    const p = ps.p; if (p.rec.n === 'horta') atualizarHorta(c, ps.p);
    for (const it of p.inters) { const cx = p.x + p.w / 2, cy = p.y + p.h / 2, r = 1.55 + (Math.max(p.w, p.h) - 1) * 0.75, alt = p.rec.n === 'carro' ? 24 : p.rec.n === 'fogueira' ? 8 : 34;
      let v: Interativo | null = null;
      switch (it.k) {
        case 'saque': v = { x: cx, y: cy, r, rot: it.rot, dur: it.dur, ruido: it.ruido, alt, ok: () => !it.feito && (p.loot?.length ?? 0) > 0, exec: () => iniciarAcao(c, it.rot.replace('Vasculhar', 'Vasculhando'), it.dur * (pk(c.s, 'catador') ? 0.7 : 1), () => concluirSaque(c, p, it), it.ruido) }; break;
        case 'desmontar': v = { x: cx, y: cy, r, get rot() { return temFerr() ? 'Desmontar carro (sucata ×3–5)' : 'Desmontar carro — precisa de ferramenta'; }, dur: it.dur, ruido: it.ruido, alt, ok: () => !it.feito && !(it.rot.includes('porta-malas')), exec: () => { if (!temFerr()) { toast('Precisa de uma ferramenta: pé de cabra, machado…', '#d9a02b'); sfx.ui('erro'); return; } iniciarAcao(c, 'Desmontando carro', it.dur, () => { it.feito = true; c.ze.desmontados.push(p.id); const n = ri(3, 5); dar(c, 'sucata', n); if (Math.random() < 0.4) dar(c, 'bateria'); if (Math.random() < 0.25) dar(c, 'combustivel'); acharPs(c, p)?.spr.setTint(0x555555); sfx.achado(); }, it.ruido, 'metal'); } }; break;
        case 'rasgar': v = { x: cx, y: cy, r, rot: it.rot, dur: it.dur, alt, ok: () => !it.feito, exec: () => iniciarAcao(c, 'Rasgando', it.dur, () => { it.feito = true; c.ze.rasgados.push(p.id); dar(c, 'tecido', ri(2, 3)); sfx.achado(); }, 3) }; break;
        case 'bau': v = { x: cx, y: cy, r, rot: it.rot, dur: 0, alt, ok: () => true, exec: () => painel('bau') }; break;
        case 'bancada': v = { x: cx, y: cy, r, rot: it.rot, dur: 0, alt, ok: () => true, exec: () => painel('craft') }; break;
        case 'fogueira': v = { x: cx, y: cy, r: r + 0.4, rot: it.rot, dur: 0, alt, ok: () => true, exec: () => painel('cozinha') }; break;
        case 'cama': if (c.zona.id === 'base') v = { x: cx, y: cy, r, rot: 'Dormir', dur: 0, alt, ok: () => true, exec: () => painel('dormir') }; break;
        case 'jipe': v = { x: cx, y: cy, r: r + 0.6, rot: it.rot, dur: 0, alt, ok: () => true, exec: () => painel('mapa') }; break;
        case 'tanque': v = { x: cx, y: cy, r, rot: it.rot, dur: it.dur, alt, ok: () => true, exec: () => { const s = c.s, n = Math.min(Math.floor(s.tanque), st().inv.garrafa ?? 0); if (n <= 0) { toast(s.tanque < 1 ? 'O tanque está vazio. Espere chover.' : 'Precisa de garrafas vazias.', '#d9a02b'); sfx.ui('erro'); return; } iniciarAcao(c, 'Enchendo garrafas', it.dur, () => { for (let i = 0; i < n; i++) { if (!tirar('garrafa')) break; dar(c, 'agua', 1, true); } s.tanque -= n; toast(`+ ${n} água limpa`, '#8fe36a'); sfx.beber(); }); } }; break;
        case 'horta': v = { x: cx, y: cy, r, rot: it.rot, dur: it.dur, alt, ok: () => true, exec: () => cuidarHorta(c, p) }; break;
      }
      if (v) { v.pegada = [p.x, p.y, p.w, p.h]; c.interativos.push(v); }
    }
  }
  for (const fl of c.floras) if (fl.f.cortavel) { const f = fl.f; c.interativos.push({ x: f.x, y: f.y, r: 1.5, get rot() { return (st().inv.machado || c.s.arma === 'machado') ? 'Cortar árvore (madeira ×3–5)' : 'Cortar árvore — precisa de machado'; }, dur: 3.2, ruido: 8, alt: 52, pegada: [Math.floor(f.x), Math.floor(f.y), 1, 1], ok: () => !f.cortada, exec: () => { const mach = st().inv.machado || c.s.arma === 'machado'; if (!mach) { toast('Precisa de um machado.', '#d9a02b'); sfx.ui('erro'); return; } iniciarAcao(c, 'Cortando árvore', 3.2, () => { f.cortada = true; c.ze.cortadas.push(f.id); const i = idx(Math.floor(f.x), Math.floor(f.y)); f.solido = false; c.zona.solido[i] = 0; c.setQ(fl.spr, c.est(c.recToco)); dar(c, 'madeira', ri(3, 5)); sfx.achado(); c.cameras.main.shake(120, 0.004); }, 8, 'cortar'); } }); }
}
const acharPs = (c: Cena, p: Prop) => c.props.find(x => x.p === p);
function concluirSaque(c: Cena, p: Prop, it: { feito?: boolean }) {
  const resto: string[] = []; let raro = false;
  for (const id of p.loot ?? []) { const x = ITENS[id]; if (!x) continue; if (x.tipo !== 'municao' && !cabe(id)) { resto.push(id); continue; } dar(c, id, 1); if (x.raridade === 'raro') raro = true; }
  if (resto.length) toast('Mochila cheia', '#c9561f'); p.loot = resto; if (!resto.length) { p.aberto = true; it.feito = true; c.ze.saqueados.push(p.id); acharPs(c, p)?.spr.setAlpha(0.8); }
  c.s.vasculhados++; if (raro) { sfx.raro(); c.cameras.main.flash(220, 255, 225, 120); } else sfx.achado();
  registrar(c, 'saque', 1, { zona: c.zona.id }); ganharXp(c, raro ? 9 : 3, false); if (pk(c.s, 'catador') && Math.random() < 0.25) dar(c, ['sucata', 'tecido', 'madeira', 'enlatado', 'bandagem'][Math.floor(Math.random() * 5)], 1); if (p.id >= 910000) airdropColetado(c);
}
/** cadáver revistável / esfolável */
export function mostrarCadaver(c: Cena, e: Ent) {
  const animal = e.arq.modelo !== 'humano', rot = animal ? 'Esfolar ' + e.arq.nome.toLowerCase() : 'Revistar ' + e.arq.nome.toLowerCase();
  c.interativos.push({ x: e.x, y: e.y, r: 1.4, rot, dur: 1.8, alt: 8, ok: () => !e.cadaver, exec: () => { if (animal && !tem('faca') && !tem('facao') && !tem('machado')) { toast('Precisa de uma faca para esfolar.', '#d9a02b'); sfx.ui('erro'); return; } iniciarAcao(c, animal ? 'Esfolando' : 'Revistando', 1.8, () => { e.cadaver = true; let n = 0; for (const [id, ch, a, b] of e.arq.drops) if (Math.random() < ch) { dar(c, id, ri(a, b) * (pk(c.s, 'cacador') && id === 'carne_crua' ? 2 : 1)); n++; } if (!n) toast('Nada de útil.', '#8a8573'); else sfx.achado(); }); } });
}
export function aguaInter(c: Cena): Interativo | null {
  const J = c.jog; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = Math.floor(J.x) + dx, y = Math.floor(J.y) + dy; if (c.tipoEm(x, y) === T.AGUA_RASA && Math.hypot(x + 0.5 - J.x, y + 0.5 - J.y) < 1.7) return { x: x + 0.5, y: y + 0.5, r: 1.8, get rot() { return tem('garrafa') ? 'Coletar água (turva)' : 'Coletar água — precisa de garrafa vazia'; }, dur: 1.5, alt: 4, ok: () => true, exec: () => { if (!tem('garrafa')) { toast('Precisa de uma garrafa vazia.', '#d9a02b'); sfx.ui('erro'); return; } iniciarAcao(c, 'Coletando água', 1.5, () => { if (tirar('garrafa')) dar(c, 'agua_suja', 1); sfx.beber(); }, undefined, 'agua'); } }; }
  return null;
}

// ---------------------------------------------------------------- horta
const estagioHorta = (c: Cena, id: number) => { const t = c.ze.hortas[id]; return t === undefined ? 0 : Math.min(3, 1 + Math.floor((c.s.minutos - t) / (1440 * 0.5 / (1 + 0.35 * melNivel(c.s, 'horta'))))); };
export function atualizarHorta(c: Cena, p: Prop) { const e = estagioHorta(c, p.id), r = { ...p.rec, v: e }, q = c.est(r); const s = acharPs(c, p); if (s) { c.setQ(s.spr, q); } }
function cuidarHorta(c: Cena, p: Prop) {
  const e = estagioHorta(c, p.id);
  if (e === 0) { if (!tem('semente')) { toast('Precisa de sementes.', '#d9a02b'); sfx.ui('erro'); return; } iniciarAcao(c, 'Plantando', 1.2, () => { tirar('semente'); c.ze.hortas[p.id] = c.s.minutos; atualizarHorta(c, p); toast('Plantado. Colha em ~12 horas.', '#8fe36a'); sfx.saque(); }); }
  else if (e >= 3) { iniciarAcao(c, 'Colhendo', 1.2, () => { delete c.ze.hortas[p.id]; dar(c, 'legume', 3 + melNivel(c.s, 'horta')); if (Math.random() < 0.7) dar(c, 'semente', 1); registrar(c, 'colhidos'); ganharXp(c, 4, false); atualizarHorta(c, p); sfx.achado(); }); }
  else toast(`Crescendo… (${Math.round(((c.s.minutos - c.ze.hortas[p.id]) / (1440 * 1.5 / (1 + 0.35 * melNivel(c.s, 'horta')))) * 100)}%)`, '#8a8573');
}
export function tickHortas(c: Cena) { for (const s of c.props) if (s.p.rec.n === 'horta') { const e = estagioHorta(c, s.p.id); if (s.p.rec.v !== e) atualizarHorta(c, s.p); } }

// ---------------------------------------------------------------- itens
function efeitoItem(c: Cena, id: string) {
  const it = ITENS[id], s = c.s; if (!tirar(id)) return;
  if (it.fome) s.fome = Math.min(100, s.fome + it.fome); if (it.sede) s.sede = Math.min(100, s.sede + it.sede); if (it.hp) s.hp = Math.min(s.maxHp, s.hp + it.hp * (pk(s, 'enfermeiro') && it.tipo === 'cura' ? 1.5 : 1)); if (it.estanca) s.sangra = false;
  if (it.rad) s.rad = Math.max(0, Math.min(100, s.rad + it.rad)); if (it.bateria) s.lanterna.bat = Math.min(100, s.lanterna.bat + it.bateria); if (it.combustivel) s.combustivel += it.combustivel;
  (it.tipo === 'bebida' ? sfx.beber : it.tipo === 'cura' ? sfx.curar : sfx.comer)(); toast(it.nome + ' usado', '#8fe36a');
}
export function usarItem(c: Cena, id: string) {
  const it = ITENS[id]; if (!it || !tem(id)) return;
  if (it.tipo === 'arma') { c.s.arma = id; toast(it.nome + ' equipado'); sfx.ui('ok'); return; }
  if (id === 'mascara') return tocarMascara(c); if (id === 'lanterna') return lanterna(c);
  if (id === 'colete' || id === 'mochila') { toast(id === 'colete' ? 'O colete já está equipado.' : 'A mochila já está equipada.'); return; }
  if (it.tipo === 'especial') { toast('Sinal fraco… o Abrigo 7 está no mapa.', '#8fe36a'); return; }
  if (id === 'kit_fogueira') { if (c.interior) { toast('Não dá para acender fogueira aqui dentro.', '#d9a02b'); return; } iniciarAcao(c, 'Acendendo fogueira', 1.6, () => { tirar('kit_fogueira'); c.criarFogueira(Math.floor(c.jog.x), Math.floor(c.jog.y)); toast('Fogueira acesa', '#e0b83a'); sfx.achado(); }); return; }
  if (id === 'bateria' && !c.s.lanterna.tem) { toast('Precisa de uma lanterna'); return; }
  if (it.tipo === 'material' && !it.bateria && !it.combustivel) { toast(it.nome + ' serve para fabricar na bancada.'); return; }
  if (id === 'combustivel') { iniciarAcao(c, 'Abastecendo o jipe', 1.2, () => efeitoItem(c, id)); return; }
  iniciarAcao(c, 'Usando ' + it.nome.toLowerCase(), 1.0, () => efeitoItem(c, id));
}
function usarRapido(c: Cena, k: Rapido) {
  const tm = (id: string) => tem(id); let id: string | undefined; const s = c.s;
  if (k === 'agua') id = tm('agua') ? 'agua' : tm('agua_suja') ? 'agua_suja' : undefined;
  if (k === 'comida') id = ['carne_cozida', 'enlatado', 'pao', 'legume', 'carne_crua'].find(tm);
  if (k === 'curar') id = s.sangra ? ['bandagem', 'kit'].find(tm) : s.hp < s.maxHp ? ['bandagem', 'kit'].find(tm) : undefined;
  if (k === 'antirrad') id = tm('antirrad') ? 'antirrad' : undefined;
  if (!id) { toast({ agua: 'Sem água', comida: 'Sem comida', curar: s.sangra || s.hp < s.maxHp ? 'Sem curativos' : 'Saúde cheia', antirrad: 'Sem antirrad' }[k], '#d9a02b'); sfx.ui('erro'); return; }
  usarItem(c, id);
}
function trocarArma(c: Cena) { const inv = st().inv, ciclo = ['taco', 'pe_de_cabra', 'faca', 'facao', 'machado', 'pistola', 'escopeta', 'rifle'].filter(i => inv[i]); const lista: (string | null)[] = [...ciclo, null]; const i = lista.indexOf(c.s.arma); c.s.arma = lista[(i + 1) % lista.length]; toast(c.s.arma ? ITENS[c.s.arma].nome : 'Punhos'); sfx.ui('clique'); }
function lanterna(c: Cena) { const l = c.s.lanterna; if (!tem('lanterna')) { toast('Sem lanterna', '#d9a02b'); return; } l.tem = true; if (l.bat <= 0) { toast('Bateria descarregada', '#d9a02b'); return; } l.ligada = !l.ligada; sfx.ui('clique'); }
function tocarMascara(c: Cena) { if (!tem('mascara')) { toast('Sem máscara', '#d9a02b'); return; } c.s.mascara = !c.s.mascara; toast(c.s.mascara ? 'Máscara colocada' : 'Máscara removida'); sfx.ui('clique'); }

// ---------------------------------------------------------------- viagem, sono, morte, vitória
type Custo = { horas: number; combustivel: number };
export type EvPend = { dest: string; custo: Custo; ev: EventoViagem };
/** ferramentas que os eventos de viagem usam (tudo passa pelo mesmo caminho do jogo) */
function ajuda(c: Cena): Ajuda {
  const guarda = (id: string, q: number) => { if (dar(c, id, q, true)) return; const bau = { ...st().bau }; bau[id] = (bau[id] ?? 0) + q; useJogo.setState({ bau }); c.s.bau = bau; toast('Mochila cheia: ' + ITENS[id].nome + ' foi para o baú', '#d9a02b'); };
  return {
    dar: (id, q = 1) => { if (ITENS[id]) guarda(id, q); }, tirar: (id, q = 1) => tirar(id, q), tem: (id, q = 1) => tem(id, q), tempo: min => c.avancar(min, 0.6),
    dano: hp => { c.s.hp = Math.max(1, c.s.hp - hp); useJogo.setState({ hp: c.s.hp }); }, rad: v => { c.s.rad = Math.min(100, c.s.rad + v); c.s.radMax = Math.max(c.s.radMax, c.s.rad); },
    comb: n => { c.s.combustivel = Math.max(0, c.s.combustivel + n); }, xp: n => ganharXp(c, n, false), sorte: p => Math.random() < p,
  };
}
export function viajar(c: Cena, dest: string) {
  const loc = localPorId(dest), cur = c.s.zonaId; if (dest === cur || c.trava) return;
  if (loc.requer && !tem(loc.requer)) { toast('Você ainda não captou o sinal do Abrigo 7.', '#d9a02b'); sfx.ui('erro'); return; }
  const custo = custoViagem(cur, dest, pk(c.s, 'mecanico')); if (c.s.combustivel < custo.combustivel) { toast(`Combustível insuficiente (${custo.combustivel} necessário).`, '#c9561f'); sfx.ui('erro'); return; }
  c.trava = true; useJogo.setState({ painel: null });
  const rng = new Rng(`${c.s.seed}|ev|${Math.floor(c.s.minutos)}|${dest}`), dia = Math.floor(c.s.minutos / 1440) + 1;
  const forca = c.devEv, semEv = (globalThis as { __semEventos?: boolean }).__semEventos === true; c.devEv = null;
  if (dest !== 'abrigo7' && (forca || (!semEv && rng.chance(0.45)))) {
    const lista = EVENTOS_VIAGEM.filter(e => e.id !== c.s.ultEv && (e.min ?? 0) <= dia);
    if (lista.length || forca) {
      const ev = (forca && EVENTOS_VIAGEM.find(e => e.id === forca)) || rng.pick(lista); c.s.ultEv = ev.id; c.evPend = { dest, custo, ev }; sfx.sinal();
      useJogo.setState({ painel: 'evento', evento: { titulo: ev.titulo, txt: ev.txt, opcoes: ev.opcoes.map(o => ({ rot: o.rot, ok: !o.req || tem(o.req[0], o.req[1]), dica: o.dica })), resultado: null } }); return;
    }
  }
  concluirViagem(c, dest, custo);
}
function eventoEscolher(c: Cena, i: number) {
  const p = c.evPend, ev = st().evento; if (!p || !ev || ev.resultado !== null) return; const op = p.ev.opcoes[i]; if (!op) return;
  if (op.req && !tem(op.req[0], op.req[1])) { toast('Você não tem o que precisa para isso.', '#d9a02b'); sfx.ui('erro'); return; }
  const r = op.res(ajuda(c)); if (r.emboscada) c.s.emboscada = r.emboscada; sfx.ui('ok'); useJogo.setState({ evento: { ...ev, resultado: r.txt, cor: r.cor }, hp: c.s.hp });
}
function eventoFim(c: Cena) { const p = c.evPend; if (!p) return; c.evPend = null; useJogo.setState({ painel: null, evento: null }); concluirViagem(c, p.dest, p.custo); }
function concluirViagem(c: Cena, dest: string, custo: Custo) {
  const cur = c.s.zonaId; c.scene.resume(); if (cur === 'base') c.s.saiuEm = c.s.minutos;
  c.s.combustivel -= custo.combustivel; c.avancar(custo.horas * 60, 0.6); c.s.viajou = true;
  if (!c.s.descobertos.includes(dest)) { c.s.descobertos.push(dest); ganharXp(c, 20, false); }
  registrar(c, 'viagens'); registrar(c, 'visita', 1, { zona: dest });
  c.ze.ultima = c.s.minutos; c.s.inv = { ...st().inv }; c.s.bau = { ...st().bau };
  if (dest === 'abrigo7') { c.cameras.main.fadeOut(600, 5, 4, 6); c.time.delayedCall(700, () => executarVitoria(c)); return; }
  c.salvar(); sfx.ui('ok'); c.cameras.main.fadeOut(450, 5, 4, 6);
  c.time.delayedCall(500, () => { c.s.px = undefined; c.s.py = undefined; c.scene.restart({ run: c.s, zonaId: dest, esc: c.esc }); });
}
function dormir(c: Cena, horas: number) {
  if (c.zona.id !== 'base') { toast('Só dá para dormir no abrigo.', '#d9a02b'); return; }
  const s = c.s; useJogo.setState({ painel: null }); c.scene.resume(); c.cameras.main.fadeOut(500, 5, 4, 6);
  c.time.delayedCall(600, () => { const cm = melNivel(s, 'cama'); c.avancar(horas * 60, 0.45); s.hp = Math.min(s.maxHp, s.hp + horas * 6 * [1, 1.5, 2][cm]); if (cm >= 1) s.sangra = false; if (cm >= 2) s.rad = Math.max(0, s.rad - 15); s.stamina = 100; c.salvar(); c.cameras.main.fadeIn(600, 5, 4, 6); toast(`Dormiu ${horas}h. Agora são ${horaStr(s.minutos)}.`, '#8fe36a'); });
}
export function executarMorte(c: Cena, causa: string) {
  if (c.morto) return; c.morto = true; sfx.morte(); c.iniciarMorte(); c.cameras.main.fadeOut(1100, 20, 0, 0); apagarRun(); useJogo.setState({ temSave: false });
  const J = c.jog, dist = 0;
  c.time.delayedCall(1300, () => { c.sincronizar(); const dias = Math.floor(c.s.minutos / 1440) + 1; useJogo.setState({ resumo: { causa, dias, hora: horaStr(c.s.minutos), abates: c.s.abates, vasculhados: c.s.vasculhados, radMax: Math.round(c.s.radMax), vitoria: false, distAbrigo: dist + Math.round(Math.hypot(J.x - 48, J.y - 85) * 0) + 143, nivel: c.s.nivel, contratos: c.s.st?.contratos ?? 0, conquistas: [...c.novasConquistas] }, tela: 'morte', acao: null, painel: null }); });
}
export function executarVitoria(c: Cena) {
  if (c.vitoria) return; c.vitoria = true; c.morto = true; registrar(c, 'vitoria'); sfx.vitoria(); apagarRun(); useJogo.setState({ temSave: false });
  c.sincronizar(); const dias = Math.floor(c.s.minutos / 1440) + 1; useJogo.setState({ resumo: { causa: 'Chegou ao Abrigo 7', dias, hora: horaStr(c.s.minutos), abates: c.s.abates, vasculhados: c.s.vasculhados, radMax: Math.round(c.s.radMax), vitoria: true, distAbrigo: 0, nivel: c.s.nivel, contratos: c.s.st?.contratos ?? 0, conquistas: [...c.novasConquistas] }, tela: 'vitoria', acao: null, painel: null });
}

// ---------------------------------------------------------------- comandos da UI
export function instalarComandos(c: Cena) {
  ponte.ref = c; ponte.cmd = {
    interagir: () => { if (c.acao || c.morto) return; let a = c.alvoInter; if (!a || !a.ok() || !c.alcancavel(a)) a = c.alvoProx(); if (a) a.exec(); },
    usarRapido: k => usarRapido(c, k), usarItem: id => usarItem(c, id), largar: (id, n = 1) => { if (tirar(id, Math.min(n, st().inv[id] ?? 0))) { toast(ITENS[id].nome + ' largado'); sfx.ui('clique'); } },
    trocarArma: () => trocarArma(c), lanterna: () => lanterna(c), tocarMascara: () => tocarMascara(c),
    pausar: p => { try { if (!c.sys?.isActive() && !c.sys?.isPaused()) return; if (p) c.scene.pause(); else c.scene.resume(); } catch { /* cena já destruída */ } },
    tocarMundo: (x, y) => {
      const cam = c.cameras.main, wx = cam.scrollX + x / c.esc, wy = cam.scrollY + y / c.esc;
      for (const it of c.interativos) { if (!it.ok()) continue; const d = Math.hypot(it.x - c.jog.x, it.y - c.jog.y); if (d > it.r || !c.alcancavel(it)) continue; const [sx, sy] = proj(it.x, it.y, (it.alt ?? 30) * 0.5); if (Math.hypot(sx - wx, sy - wy) < 44 / c.esc) { c.alvoInter = it; it.exec(); return true; } }
      return false;
    },
    craft: id => {
      const r = RECEITAS.find(q => q.id === id); if (!r) return; if ((r.nivel ?? 0) > melNivel(c.s, 'bancada')) { toast('Melhore a bancada para fabricar isto.', '#d9a02b'); sfx.ui('erro'); return; } const inv = st().inv; if (r.entra.some(([i, n]) => (inv[i] ?? 0) < n)) { toast('Faltam materiais.', '#d9a02b'); sfx.ui('erro'); return; }
      const [si, sn] = r.sai; const cp = ITENS[si].tipo === 'municao' || !emGrade(si) || (() => { let g = st().grade; for (const [i, n] of r.entra) if (emGrade(i)) g = remover(g, i, n); return adicionar(g, linhasDe(inv), si, sn).resto === 0; })(); if (!cp) { toast('Sem espaço na mochila: organize ou largue algo.', '#c9561f'); sfx.ui('erro'); return; }
      for (const [i, n] of r.entra) tirar(i, n); dar(c, si, sn); c.s.craftou = true; c.avancar(10, 1); sfx.ui('ok'); sfx.achado(); registrar(c, 'fabricados'); ganharXp(c, 5, false);
    },
    cozinhar: id => { const r = COZINHA.find(q => q.id === id); if (!r) return; if (!tirar(r.de)) { toast('Falta ' + ITENS[r.de].nome.toLowerCase() + '.', '#d9a02b'); sfx.ui('erro'); return; } dar(c, r.para, 1); c.avancar(15, 1); sfx.comer(); registrar(c, 'cozinhados'); ganharXp(c, 2, false); },
    dormir: h => dormir(c, h),
    bauMover: (id, qtd, paraBau) => {
      const inv = { ...st().inv }, bau = { ...st().bau }; let grade = st().grade;
      if (paraBau) { const n = Math.min(qtd, inv[id] ?? 0); if (!n) return; inv[id] -= n; if (inv[id] <= 0) delete inv[id]; bau[id] = (bau[id] ?? 0) + n; if (emGrade(id)) grade = remover(grade, id, n); }
      else { let n = Math.min(qtd, bau[id] ?? 0); while (n > 0 && !cabeNaMochila(id, n)) n--; if (!n) { toast('Sem espaço na mochila.', '#c9561f'); sfx.ui('erro'); return; } bau[id] -= n; if (bau[id] <= 0) delete bau[id]; inv[id] = (inv[id] ?? 0) + n; if (emGrade(id)) grade = adicionar(grade, linhasDe(inv), id, n).g; }
      useJogo.setState({ inv, bau, grade }); sfx.ui('clique'); c.s.inv = inv; c.s.bau = bau;
    },
    viajar: d => viajar(c, d), salvar: () => c.salvar(), atacarBotao: () => { ponte.entrada.tap++; },
    eventoEscolher: i => eventoEscolher(c, i), eventoFim: () => eventoFim(c), escolherPerk: id => escolherPerk(c, id), receberContrato: id => receberContrato(c, id), melhorar: id => melhorar(c, id),
  };
  void armaDe; void W;
}
