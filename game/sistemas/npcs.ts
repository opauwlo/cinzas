// NPCs vivos no mundo: onde nascem, como conversam e como trocam (fichas). Regras puras em dados/npcs.ts; aqui fica o que toca a cena.
import type { Cena } from '../cena';
import { useJogo, type DialogoUI } from '../store';
import { ITENS } from '../dados/itens';
import { precoCompra, precoVenda } from '../dados/balanco';
import { planejarNpcs, falaDe, estoqueMascate, vendavel, ROTULO_NPC, type TipoNpc } from '../dados/npcs';
import { OBJETIVOS } from '../dados/objetivos';
import { localPorId } from '../dados/locais';
import { Rng } from '../lib/rng';
import { sfx } from '../audio';
import { criarEnt, type Ent } from './ia';
import { dar, tirar, cabe, ganchos, montarInterativos, type Interativo } from './acoes';
import { pontoLivre } from './diretor';
import { ganharXp, registrar } from './progresso';

const st = () => useJogo.getState();
const diaDe = (c: Cena) => Math.floor(c.s.minutos / 1440) + 1;

/** cria um NPC no ponto dado (usado pelo planejamento e pelos testes) */
export function criarNpc(c: Cena, tipo: TipoNpc, x: number, y: number, nome: string): Ent {
  const e = criarEnt(c, 'npc_' + tipo, x, y, null, -1); e.npc = { tipo, nome, casa: { x, y }, id: `${c.zona.id}:${tipo}`, falou: false, ferido: false }; return e;
}
/** o que fala "Falar com X" (posição segue o NPC) */
export function interativoNpc(c: Cena, e: Ent): Interativo {
  return { get x() { return e.x; }, get y() { return e.y; }, r: 2.2, get rot() { return `Falar com ${e.npc!.nome}`; }, dur: 0, alt: 46, ok: () => e.vivo && e.estado !== 'foge' && !e.npc!.ferido, exec: () => abrirDialogo(c, e) };
}

/** decide e cria os NPCs desta zona neste dia (sem repetir os que já estão ou foram mortos) */
export function popularNpcs(c: Cena) {
  const s = c.s, dia = diaDe(c), loc = localPorId(c.zona.id); c.npcDia = dia;
  const planos = planejarNpcs(s.seed, c.zona.id, loc.perigo, dia), rng = new Rng(`${s.seed}|npcpos|${c.zona.id}|${dia}`); let criou = false;
  for (const p of planos) {
    const id = `${c.zona.id}:${p.tipo}`; if ((c.ze.npcMortos ?? []).includes(id) || c.ents.some(x => x.npc?.id === id && x.vivo)) continue;
    const base = c.zona.id === 'base', [dmin, dmax] = p.tipo === 'acampado' ? [16, 34] : p.tipo === 'mascate' ? (base ? [5, 9] : [8, 20]) : [12, 30];
    const pt = pontoLivre(c, rng, dmin, dmax); if (!pt) continue;
    criarNpc(c, p.tipo, pt[0] + 0.5, pt[1] + 0.5, p.nome); criou = true;
    if (p.tipo === 'acampado' && !c.solidoEm(pt[0] + 1, pt[1])) c.criarFogueira(pt[0] + 1, pt[1], false); // fogueira dele, só visual e para cozinhar
  }
  if (criou) montarInterativos(c);
}
/** a cada segundo: virou o dia? o mascate do abrigo vai embora e (se for dia dele) chega outro */
export function tickNpcs(c: Cena) {
  if (c.npcDia === diaDe(c)) return;
  if (c.zona.id === 'base') for (const e of c.ents) if (e.npc && e.vivo) { e.vivo = false; e.remover = true; e.bolha?.destroy(); e.spr.destroy(); e.som.destroy(); }
  popularNpcs(c);
}

// ---------------------------------------------------------------- conversa e troca
function lista(c: Cena, e: Ent) {
  const n = e.npc!, s = st(), compras = (n.estoque ?? []).filter(o => o.q > 0).map(o => ({ item: o.item, q: o.q, preco: precoCompra(o.item) }));
  const vendas = Object.keys(s.inv).filter(id => vendavel(id) && precoVenda(id) > 0 && !(s.arma === id && (s.inv[id] ?? 0) <= 1)).map(id => ({ item: id, q: s.inv[id], preco: precoVenda(id) }));
  return { compras, vendas, fichas: s.inv.ficha ?? 0 };
}
function montar(c: Cena, e: Ent, modo: 'fala' | 'troca', fala: string, msg = ''): DialogoUI {
  const n = e.npc!, l = lista(c, e);
  return { npcId: e.id, nome: n.nome, rotulo: ROTULO_NPC[n.tipo], fala, modo, fichas: l.fichas, compras: modo === 'troca' ? l.compras : [], vendas: modo === 'troca' ? l.vendas : [], msg, vende: n.tipo === 'mascate' && !c.s.traiu };
}
function falar(c: Cena, e: Ent): string {
  const n = e.npc!, s = c.s, obj = OBJETIVOS[Math.min(s.objIdx, OBJETIVOS.length - 1)], rng = new Rng(`${s.seed}|fala|${e.id}|${n.rumores ?? 0}|${Math.floor(s.minutos / 30)}`);
  return falaDe(n.tipo, { hora: c.hora(), clima: c.clima.tipo, objId: obj.id, dia: diaDe(c), nivel: s.nivel ?? 1, zonaId: c.zona.id, traiu: !!s.traiu, raidRecente: !!c.raid && !c.raid.resolvido }, rng);
}
export function abrirDialogo(c: Cena, e: Ent) {
  const n = e.npc!, s = c.s; let msg = '';
  if (n.tipo === 'mascate') n.estoque ??= estoqueMascate(new Rng(`${s.seed}|loja|${n.id}|${diaDe(c)}`), diaDe(c));
  if (!n.falou) {
    n.falou = true; ganharXp(c, 10, false); registrar(c, 'npc'); e.bolha?.destroy(); e.bolha = undefined;
    if (n.tipo === 'acampado' && !s.traiu) { const it = new Rng(`${s.seed}|presente|${n.id}`).pick(['bandagem', 'enlatado', 'agua']); if (!dar(c, it, 1, true)) { const bau = { ...st().bau }; bau[it] = (bau[it] ?? 0) + 1; useJogo.setState({ bau }); s.bau = bau; } msg = `${n.nome} deu a você: ${ITENS[it].nome}.`; }
  }
  sfx.ui('abrir'); useJogo.setState({ painel: 'dialogo', dialogo: montar(c, e, 'fala', falar(c, e), msg) });
}
const alvoNpc = (c: Cena) => { const d = st().dialogo; return d ? c.ents.find(x => x.id === d.npcId && x.vivo) ?? null : null; };
function agir(c: Cena, acao: 'trocar' | 'rumor' | 'sair') {
  const e = alvoNpc(c); if (acao === 'sair' || !e) { useJogo.setState({ painel: null, dialogo: null }); return; }
  const n = e.npc!;
  if (acao === 'rumor') { n.rumores = (n.rumores ?? 0) + 1; sfx.ui('clique'); useJogo.setState({ dialogo: montar(c, e, 'fala', falar(c, e)) }); return; }
  if (c.s.traiu || n.tipo !== 'mascate') { sfx.ui('erro'); useJogo.setState({ dialogo: montar(c, e, 'fala', falar(c, e), 'Ele não negocia com você.') }); return; }
  sfx.ui('ok'); useJogo.setState({ dialogo: montar(c, e, 'troca', 'Fichas por suprimentos, suprimentos por fichas. Sem pegadinha: os preços estão à vista.') });
}
function comprar(c: Cena, item: string) {
  const e = alvoNpc(c); if (!e || !e.npc!.estoque || c.s.traiu) return; const o = e.npc!.estoque.find(x => x.item === item && x.q > 0), preco = precoCompra(item), d = st().dialogo!;
  const fim = (msg: string, ok = false) => { sfx.ui(ok ? 'ok' : 'erro'); useJogo.setState({ dialogo: montar(c, e, 'troca', d.fala, msg) }); };
  if (!o) return fim('Acabou.'); if ((st().inv.ficha ?? 0) < preco) return fim('Fichas insuficientes.'); if (!cabe(item, 1)) return fim('Sem espaço na mochila: organize ou largue algo.');
  tirar('ficha', preco); dar(c, item, 1, true); o.q--; registrar(c, 'trocas'); fim(`Comprou ${ITENS[item].nome} por ${preco} ficha${preco > 1 ? 's' : ''}.`, true);
}
function vender(c: Cena, item: string) {
  const e = alvoNpc(c); if (!e || c.s.traiu) return; const preco = precoVenda(item), d = st().dialogo!;
  const fim = (msg: string, ok = false) => { sfx.ui(ok ? 'ok' : 'erro'); useJogo.setState({ dialogo: montar(c, e, 'troca', d.fala, msg) }); };
  if (!vendavel(item) || preco <= 0 || (st().inv[item] ?? 0) < 1) return fim('Não dá para vender isso.');
  tirar(item, 1); if (!dar(c, 'ficha', preco, true)) { dar(c, item, 1, true); return fim('Sem espaço para as fichas.'); }
  registrar(c, 'trocas'); fim(`Vendeu ${ITENS[item].nome} por ${preco} ficha${preco > 1 ? 's' : ''}.`, true);
}
ganchos.npc = interativoNpc; ganchos.cmd = { agir, comprar, vender };
