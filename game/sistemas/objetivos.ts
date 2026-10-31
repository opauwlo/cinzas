// Campanha em atos: confere os objetivos a cada segundo, paga XP/itens, mostra o banner "Objetivo cumprido" e libera o sinal do Abrigo 7.
import type { Cena } from '../cena';
import { useJogo } from '../store';
import { OBJETIVOS, OBJ_VER, type Objetivo } from '../dados/objetivos';
import { ITENS } from '../dados/itens';
import { sfx } from '../audio';
import { ganharXp, registrar } from './progresso';
import { dar } from './acoes';

let bid = 1;
/** faixa grande no centro por 3 s (objetivo cumprido, descoberta…) */
export function anunciar(titulo: string, sub: string, extra = '') {
  const id = bid++; useJogo.setState({ banner: { id, titulo, sub, extra } }); setTimeout(() => { if (useJogo.getState().banner?.id === id) useJogo.setState({ banner: null }); }, 3100);
}
export const objetivoAtual = (idx: number) => OBJETIVOS[Math.min(idx, OBJETIVOS.length - 1)];

function darOuBau(c: Cena, item: string, q: number) {
  if (!ITENS[item]) return; if (dar(c, item, q, true)) return;
  const bau = { ...useJogo.getState().bau }; bau[item] = (bau[item] ?? 0) + q; useJogo.setState({ bau }); c.s.bau = bau;
}
export function avancarObjetivos(c: Cena) {
  const s = c.s, inv = useJogo.getState().inv;
  if (inv.radio && !s.sabeAbrigo) { // o sinal do rádio vale em qualquer ponto da campanha
    s.sabeAbrigo = true; if (!s.descobertos.includes('abrigo7')) s.descobertos.push('abrigo7'); useJogo.setState({ sabeAbrigo: true, descobertos: [...s.descobertos] });
    useJogo.getState().toast('Sinal do Abrigo 7 captado', '#8fe36a'); registrar(c, 'radio'); ganharXp(c, 60);
  }
  const silencioso = s.objVer !== OBJ_VER, cumpridos: Objetivo[] = []; // saves antigos: recontar sem pagar de novo
  if (silencioso) s.objIdx = 0; // a lista de passos mudou: recomeça a conta do zero, em silêncio
  while (s.objIdx < OBJETIVOS.length - 1) { const o = OBJETIVOS[s.objIdx]; if (o.valor(s, inv) < o.meta) break; cumpridos.push(o); s.objIdx++; }
  s.objVer = OBJ_VER;
  if (cumpridos.length && !silencioso) {
    let xp = 0; const itens: string[] = [];
    for (const o of cumpridos) { xp += o.xp; ganharXp(c, o.xp, false); for (const [i, q] of o.premio ?? []) { darOuBau(c, i, q); itens.push(`${q}× ${ITENS[i]?.nome ?? i}`); } }
    const ult = cumpridos[cumpridos.length - 1], prox = objetivoAtual(s.objIdx);
    anunciar('Objetivo cumprido', ult.titulo + (cumpridos.length > 1 ? ` (+${cumpridos.length - 1})` : ''), `+${xp} XP${itens.length ? ' · ' + itens.join(', ') : ''}`); sfx.conquista(); useJogo.getState().toast('Próximo: ' + prox.titulo, '#e0b83a');
  }
  const atual = objetivoAtual(s.objIdx);
  useJogo.setState({ objIdx: s.objIdx, objVal: atual.valor(s, useJogo.getState().inv) });
}
