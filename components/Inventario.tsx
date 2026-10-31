'use client';
import { useJogo, pesoInv, PESO_MAX } from '../game/store';
import { ITENS, COR_RARIDADE } from '../game/itens';
import { ponte } from '../game/ponte';

export default function Inventario() {
  const s = useJogo(); const peso = pesoInv(s.inv);
  const ids = Object.keys(s.inv).sort((a, b) => ['raro', 'incomum', 'comum'].indexOf(ITENS[a].raridade) - ['raro', 'incomum', 'comum'].indexOf(ITENS[b].raridade));
  const acao = (id: string) => { const it = ITENS[id]; if (it.tipo === 'arma') return s.arma === id ? 'Equipado' : 'Equipar'; if (id === 'mascara') return s.mascara ? 'Tirar' : 'Colocar'; if (id === 'lanterna') return s.lanterna.ligada ? 'Apagar' : 'Acender'; if (it.tipo === 'especial') return 'Sintonizar'; return 'Usar'; };
  return (
    <div className="tela sobre" onPointerDown={e => e.stopPropagation()}>
      <div className="col">
        <h1 className="titulo m">Mochila</h1>
        <div className="card">
          <div className="mini" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Peso</span><b>{peso.toFixed(1)} / {PESO_MAX} kg</b></div>
          <div className="peso"><i style={{ width: `${Math.min(100, peso / PESO_MAX * 100)}%`, background: peso > PESO_MAX * 0.85 ? 'linear-gradient(90deg,#ff7a52,#ff3d12)' : undefined }} /></div>
          <div className="mini" style={{ marginTop: 8 }}>Arma: <b style={{ color: 'var(--osso)' }}>{s.arma ? ITENS[s.arma].nome : 'Punhos'}</b> · Munição: <b style={{ color: 'var(--osso)' }}>{s.municao}</b> · Máscara: <b style={{ color: 'var(--osso)' }}>{s.mascara ? 'sim' : 'não'}</b></div>
        </div>
        <div className="col" style={{ maxHeight: '52dvh', overflowY: 'auto' }}>
          {ids.length === 0 && <div className="card mini">Mochila vazia. Vasculhe geladeiras, armários e porta-malas.</div>}
          {ids.map(id => { const it = ITENS[id]; return (
            <div key={id} className="inv-item" style={{ ['--rc' as string]: COR_RARIDADE[it.raridade] }}>
              <div className="im"><img src={it.icone} alt="" /></div>
              <div><b>{it.nome}{s.inv[id] > 1 ? ` ×${s.inv[id]}` : ''}</b><small>{it.desc}</small></div>
              <div className="bt2">
                <button className="cap ouro" disabled={s.arma === id} onPointerDown={() => { ponte.cmd?.usarItem(id); if (it.tipo === 'comida' || it.tipo === 'bebida' || it.tipo === 'cura') useJogo.setState({ invAberto: false }); }}>{acao(id)}</button>
                <button className="cap vidro" onPointerDown={() => ponte.cmd?.largar(id)}>Largar</button>
              </div>
            </div>); })}
        </div>
        <button className="cap vidro grande" onPointerDown={() => useJogo.setState({ invAberto: false })}>Fechar</button>
      </div>
    </div>
  );
}
