'use client';
import { useJogo } from '../game/store';
import { ITENS, COR_RARIDADE } from '../game/dados/itens';
import { ponte } from '../game/ponte';
import { sfx } from '../game/audio';
import Ico from './Ico';
import { Cartao, p } from './Cartao';

/** Conversa e troca com NPCs. Preços sempre à vista (sem pegadinha). */
export function PainelNpc() {
  const d = useJogo(s => s.dialogo); if (!d) return null;
  const linha = (item: string, q: number, preco: number, rot: string, ok: boolean, fn: () => void) => {
    const it = ITENS[item], cor = COR_RARIDADE[it.raridade];
    return (
      <div key={rot + item} className="linha-item" style={{ ['--rc' as string]: cor }}>
        <div className="im"><Ico src={it.icone} n={28} cor={it.tom ?? cor} /></div>
        <div><b>{it.nome}{q > 1 ? ` ×${q}` : ''}</b><small>{preco} ficha{preco > 1 ? 's' : ''}</small></div>
        <button className={`btn peq ${ok ? 'aviso' : ''}`} disabled={!ok} {...p(fn)}>{rot}</button>
      </div>
    );
  };
  return (
    <Cartao titulo={d.nome} larg={520} rodape={<div className="mini">{d.modo === 'troca' ? <>Suas fichas: <b style={{ color: 'var(--ambar)' }}>{d.fichas}</b></> : d.rotulo}</div>}>
      <div className="fala card aco degrau"><p>{d.fala}</p>{d.msg && <div className="msg">{d.msg}</div>}</div>
      {d.modo === 'fala' && (
        <div className="col">
          {d.vende && <button className="btn aviso" {...p(() => ponte.cmd?.npcAgir('trocar'))}>Trocar suprimentos</button>}
          <button className="btn" {...p(() => ponte.cmd?.npcAgir('rumor'))}>Ouvir outro papo</button>
          <button className="btn" {...p(() => { sfx.ui('clique'); ponte.cmd?.npcAgir('sair'); })}>Despedir</button>
        </div>
      )}
      {d.modo === 'troca' && (
        <>
          <div className="card aco"><h3>Comprar</h3>{d.compras.length === 0 && <div className="mini">Acabou o estoque.</div>}{d.compras.map(c => linha(c.item, c.q, c.preco, 'Comprar', d.fichas >= c.preco, () => ponte.cmd?.npcComprar(c.item)))}</div>
          <div className="card aco"><h3>Vender</h3>{d.vendas.length === 0 && <div className="mini">Você não tem nada que ele queira.</div>}{d.vendas.map(v => linha(v.item, v.q, v.preco, 'Vender', true, () => ponte.cmd?.npcVender(v.item)))}</div>
          <button className="btn" {...p(() => ponte.cmd?.npcAgir('rumor'))}>Voltar à conversa</button>
        </>
      )}
    </Cartao>
  );
}
