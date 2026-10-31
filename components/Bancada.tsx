'use client';
import { useState } from 'react';
import { useJogo } from '../game/store';
import { ITENS, RECEITAS, COR_RARIDADE } from '../game/dados/itens';
import { COLS, linhasDe, tamDe, livres, emGrade } from '../game/sistemas/grade';
import { ponte } from '../game/ponte';
import Ico from './Ico';
import { Cartao, p } from './Cartao';

type Filtro = 'prontas' | 'todas' | 'armas' | 'cura' | 'material';
const FILTROS: [Filtro, string][] = [['todas', 'Todas'], ['prontas', 'Prontas'], ['armas', 'Armas'], ['cura', 'Cura'], ['material', 'Outros']];

/** Bancada em cartões: o que dá para fazer agora sobe para o topo; ingredientes com ícone e contagem; o resultado cai direto na grade da mochila. */
export function Bancada() {
  const s = useJogo(), nb = s.mel.bancada ?? 0, [filtro, setFiltro] = useState<Filtro>('todas'), lv = livres(s.grade, linhasDe(s.inv));
  const lista = RECEITAS.map(r => { const trava = (r.nivel ?? 0) > nb, pronta = !trava && r.entra.every(([i, n]) => (s.inv[i] ?? 0) >= n); return { r, trava, pronta, it: ITENS[r.sai[0]] }; })
    .filter(x => filtro === 'todas' || (filtro === 'prontas' ? x.pronta : filtro === 'armas' ? x.it.tipo === 'arma' || x.it.tipo === 'municao' : filtro === 'cura' ? x.it.tipo === 'cura' : !['arma', 'municao', 'cura'].includes(x.it.tipo)))
    .sort((a, b) => Number(b.pronta) - Number(a.pronta) || Number(a.trava) - Number(b.trava));
  return (
    <Cartao titulo={`Bancada${nb ? ' nv ' + (nb + 1) : ''}`} larg={560}
      rodape={<div style={{ display: 'grid', gap: 6 }}><button className="btn aviso" {...p(() => useJogo.setState({ painel: 'melhorias' }))}>Melhorias do abrigo</button><div className="mini">Espaço livre na mochila: <b style={{ color: lv <= 3 ? 'var(--sangue2)' : 'var(--fosf)' }}>{lv}</b>. O item pronto vai direto para a grade.</div></div>}>
      <div className="abas">{FILTROS.map(([k, n]) => <button key={k} className={`btn aba ${filtro === k ? 'on' : ''}`} {...p(() => setFiltro(k))}>{n}</button>)}</div>
      {lista.length === 0 && <div className="card mini aco">Nada por aqui. Junte materiais nas viagens.</div>}
      <div className="cartoes-craft">
        {lista.map(({ r, trava, pronta, it }) => {
          const [w, h] = tamDe(r.sai[0]), cor = COR_RARIDADE[it.raridade];
          return (
            <div key={r.id} className={`craft-card ${pronta ? 'pronta' : ''} ${trava ? 'trava' : ''}`} style={{ ['--rc' as string]: trava ? '#3a3d42' : cor }}>
              <div className="cc-topo"><div className="im"><Ico src={it.icone} n={30} cor={trava ? '#565c64' : it.tom ?? cor} /></div><div><b>{r.nome}{r.sai[1] > 1 ? ` ×${r.sai[1]}` : ''}</b><small>{emGrade(r.sai[0]) ? `ocupa ${w}×${h}` : 'não ocupa espaço'}</small></div></div>
              {trava ? <div className="mini">Requer bancada nível {(r.nivel ?? 0) + 1}</div> : <div className="pips">{r.entra.map(([i, n]) => { const ok = (s.inv[i] ?? 0) >= n; return <span key={i} className={`pip ${ok ? 'ok' : 'falta'}`}><Ico src={ITENS[i].icone} n={14} cor={ok ? '#8fe36a' : '#e0553f'} />{s.inv[i] ?? 0}/{n}</span>; })}</div>}
              <button className={`btn peq ${pronta ? 'aviso' : ''}`} disabled={!pronta} {...p(() => ponte.cmd?.craft(r.id))}>{trava ? 'Travado' : pronta ? 'Fabricar' : 'Faltam materiais'}</button>
            </div>
          );
        })}
      </div>
    </Cartao>
  );
}
void COLS;
