// Contratos do rádio: sempre há 3 objetivos curtos e variados com recompensa. Gerados por seed (mesma vida = mesmos contratos).
import type { Cena } from '../cena';
import { LOCAIS } from '../dados/locais';
import { ITENS } from '../dados/itens';
import { Rng } from '../lib/rng';
import { useJogo } from '../store';
import { sfx } from '../audio';

export type TipoContrato = 'abater' | 'saquear' | 'visitar' | 'trazer' | 'fabricar' | 'noites';
export type Contrato = { id: number; tipo: TipoContrato; alvo?: string; zona?: string; qtd: number; prog: number; xp: number; premio: [string, number][]; titulo: string };
export type CtxEvento = { arq?: string; zona?: string };

const GANGUE = ['saqueador', 'filho', 'miliciano'];
const PLURAL: Record<string, [string, string]> = {
  irradiado: ['irradiado', 'irradiados'], corredor: ['corredor', 'corredores'], rastejador: ['rastejador', 'rastejadores'], saqueador: ['saqueador', 'saqueadores'],
  filho: ['Filho do Cinza', 'Filhos do Cinza'], miliciano: ['miliciano', 'milicianos'], cao: ['cão mutante', 'cães mutantes'], lobo: ['lobo faminto', 'lobos famintos'],
  barata: ['barata gigante', 'baratas gigantes'], escorpiao: ['escorpião mutante', 'escorpiões mutantes'], aranha: ['aranha gigante', 'aranhas gigantes'], rato: ['rato gigante', 'ratos gigantes'],
  colosso: ['Colosso', 'Colossos'], gangue: ['membro de gangue', 'membros de gangue'],
};
const pl = (id: string, n: number) => PLURAL[id]?.[n === 1 ? 0 : 1] ?? id;
const nomeItem = (id: string) => ITENS[id]?.nome.toLowerCase() ?? id;

/** o que o jogador tem à mão para entregar (mochila + baú) */
export const temParaEntregar = (id: string) => { const st = useJogo.getState(); return (st.inv[id] ?? 0) + (st.bau[id] ?? 0); };
export const progresso = (c: Contrato) => (c.tipo === 'trazer' ? Math.min(c.qtd, temParaEntregar(c.alvo!)) : Math.min(c.qtd, c.prog));
export const pronto = (c: Contrato) => progresso(c) >= c.qtd;

export function gerarContrato(c: Cena): Contrato {
  const s = c.s, id = s.nContratos ?? 0, rng = new Rng(`${s.seed}|contrato|${id}`), nv = s.nivel ?? 1, ativos = new Set((s.contratos ?? []).map(x => x.tipo));
  s.nContratos = id + 1;
  const zonas = LOCAIS.filter(l => l.id !== 'base' && l.id !== 'abrigo7' && (s.descobertos.includes(l.id) || l.perigo <= 2 + Math.floor(nv / 3)));
  const lista: [TipoContrato, number][] = [['abater', 5], ['saquear', 3], ['trazer', 3], ['visitar', 2], ['fabricar', 2], ['noites', ativos.has('noites') ? 0 : 1]];
  for (const e of lista) if (ativos.has(e[0]) && e[0] !== 'abater') e[1] *= 0.35;
  const tipo = rng.peso(lista.filter(e => e[1] > 0)), esc = 1 + nv * 0.12; let ct: Contrato;
  switch (tipo) {
    case 'abater': {
      const pool: [string, number, number, number][] = [['irradiado', 6, 10, 4], ['corredor', 3, 5, 5], ['rastejador', 2, 4, 5], ['cao', 3, 5, 4], ['rato', 5, 9, 3], ['barata', 5, 9, 3], ['escorpiao', 2, 4, 5], ['saqueador', 2, 4, 7], ['gangue', 4, 7, 6]];
      if (nv >= 3) pool.push(['lobo', 2, 4, 6], ['aranha', 2, 3, 6], ['miliciano', 2, 3, 9]); if (nv >= 6) pool.push(['colosso', 1, 1, 70]);
      const [alvo, a, b, v] = rng.pick(pool), qtd = alvo === 'colosso' ? 1 : Math.max(2, Math.round(rng.int(a, b) * Math.min(1.8, esc)));
      ct = { id, tipo, alvo, qtd, prog: 0, xp: Math.round(25 + qtd * v), premio: [], titulo: `Abata ${qtd} ${pl(alvo, qtd)}` }; break;
    }
    case 'saquear': {
      const z = rng.pick(zonas), qtd = Math.round(rng.int(4, 7) * Math.min(1.5, esc));
      ct = { id, tipo, zona: z.id, qtd, prog: 0, xp: 30 + qtd * 7, premio: [], titulo: `Vasculhe ${qtd} contêineres em ${z.nome}` }; break;
    }
    case 'visitar': {
      const novos = zonas.filter(l => !s.descobertos.includes(l.id)), z = rng.pick(novos.length ? novos : zonas);
      ct = { id, tipo, zona: z.id, qtd: 1, prog: 0, xp: 40 + z.perigo * 12, premio: [], titulo: `Chegue a ${z.nome}` }; break;
    }
    case 'trazer': {
      const pool: [string, number, number][] = [['sucata', 4, 8], ['madeira', 4, 8], ['tecido', 3, 6], ['alcool', 2, 3], ['carne_cozida', 2, 4], ['bateria', 1, 2], ['eletronico', 1, 2], ['agua', 2, 4]];
      const [alvo, a, b] = rng.pick(pool), qtd = rng.int(a, b);
      ct = { id, tipo, alvo, qtd, prog: 0, xp: 28 + qtd * 9, premio: [], titulo: `Entregue ${qtd}× ${nomeItem(alvo)} no abrigo` }; break;
    }
    case 'fabricar': { const qtd = rng.int(2, 4); ct = { id, tipo, qtd, prog: 0, xp: 25 + qtd * 10, premio: [], titulo: `Fabrique ${qtd} itens na bancada` }; break; }
    default: { ct = { id, tipo: 'noites', qtd: 1, prog: 0, xp: 60, premio: [], titulo: 'Sobreviva a mais uma noite' }; }
  }
  const dificil = Math.min(1.6, 1 + (ct.xp - 40) / 120), pool: [string, number][] = [['municao', 6], ['bandagem', 2], ['enlatado', 2], ['agua', 2], ['combustivel', 1], ['tecido', 3], ['sucata', 4], ['antirrad', 1]];
  const n = rng.chance(0.4) ? 2 : 1; ct.premio = Array.from({ length: n }, () => { const [i, q] = rng.pick(pool); return [i, Math.max(1, Math.round(q * dificil))] as [string, number]; });
  if (rng.chance(0.3) && !ct.premio.some(p => p[0] === 'combustivel')) ct.premio.push(['combustivel', 1]);
  return ct;
}

/** mantém sempre 3 contratos ativos (depois do primeiro saque) */
export function garantirContratos(c: Cena) {
  const s = c.s; if ((s.objIdx ?? 0) < 1 && s.vasculhados < 1) return; s.contratos ??= []; let mudou = false;
  while (s.contratos.length < 3) { s.contratos.push(gerarContrato(c)); mudou = true; }
  if (mudou) useJogo.setState({ contratos: [...s.contratos] });
}

/** avisa os contratos de que algo aconteceu; marca como prontos e avisa o jogador */
export function avancarContratos(c: Cena, k: string, n = 1, ctx: CtxEvento = {}) {
  const s = c.s; let mudou = false;
  for (const ct of s.contratos ?? []) {
    if (ct.tipo === 'trazer' || pronto(ct)) continue; const antes = ct.prog;
    if (ct.tipo === 'abater' && k === 'abate' && ctx.arq && (ct.alvo === ctx.arq || (ct.alvo === 'gangue' && GANGUE.includes(ctx.arq)))) ct.prog += n;
    else if (ct.tipo === 'saquear' && k === 'saque' && ctx.zona === ct.zona) ct.prog += n;
    else if (ct.tipo === 'visitar' && k === 'visita' && ctx.zona === ct.zona) ct.prog = ct.qtd;
    else if (ct.tipo === 'fabricar' && k === 'fabricados') ct.prog += n;
    else if (ct.tipo === 'noites' && k === 'noites') ct.prog += n;
    if (ct.prog !== antes) { mudou = true; if (pronto(ct)) { useJogo.getState().toast('Contrato cumprido: ' + ct.titulo, '#8fe36a'); sfx.ui('ok'); } }
  }
  if (mudou) useJogo.setState({ contratos: [...(s.contratos ?? [])] });
}
