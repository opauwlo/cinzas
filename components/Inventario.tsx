'use client';
import { useJogo, pesoInv, PESO_MAX } from '../game/store';
import { ITENS, COR_RARIDADE } from '../game/itens';
import { ponte } from '../game/ponte';
import Ico from './Ico';

export default function Inventario() {
  const s = useJogo(); const peso = pesoInv(s.inv);
  const ids = Object.keys(s.inv).sort((a, b) => ['raro', 'incomum', 'comum'].indexOf(ITENS[a].raridade) - ['raro', 'incomum', 'comum'].indexOf(ITENS[b].raridade));
  const acao = (id: string) => { const it = ITENS[id]; if (it.tipo === 'arma') return s.arma === id ? 'Equipado' : 'Equipar'; if (id === 'mascara') return s.mascara ? 'Tirar' : 'Colocar'; if (id === 'lanterna') return s.lanterna.ligada ? 'Apagar' : 'Acender'; if (it.tipo === 'especial') return 'Sintonizar'; return 'Usar'; };
  return (
    <div className="tela sobre" onPointerDown={e => e.stopPropagation()}>
      <div className="col">
        <h1 className="titulo m">Mochila</h1>
        <div className="card aco degrau">
          <div className="mini" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Peso</span><b>{peso.toFixed(1)} / {PESO_MAX} kg</b></div>
          <div className="seg" style={{ ['--p' as string]: `${Math.min(100, peso / PESO_MAX * 100)}%`, ['--c' as string]: peso > PESO_MAX * 0.85 ? 'var(--sangue2)' : 'var(--fosf)' }}><i /></div>
          <div className="mini" style={{ marginTop: 8 }}>Arma: <b style={{ color: 'var(--osso)' }}>{s.arma ? ITENS[s.arma].nome : 'Punhos'}</b> · Munição: <b style={{ color: 'var(--osso)' }}>{s.municao}</b> · Máscara: <b style={{ color: 'var(--osso)' }}>{s.mascara ? 'sim' : 'não'}</b></div>
        </div>
        <div className="col" style={{ maxHeight: '52dvh', overflowY: 'auto' }}>
          {ids.length === 0 && <div className="card mini aco">Mochila vazia. Vasculhe geladeiras, armários e porta-malas.</div>}
          {ids.map(id => { const it = ITENS[id]; return (
            <div key={id} className="inv-item" style={{ ['--rc' as string]: COR_RARIDADE[it.raridade] }}>
              <div className="im"><Ico src={it.icone} n={28} cor={COR_RARIDADE[it.raridade]} /></div>
              <div><b>{it.nome}{s.inv[id] > 1 ? ` ×${s.inv[id]}` : ''}</b><small>{it.desc}</small></div>
              <div className="bt2">
                <button className="btn aviso" disabled={s.arma === id} onPointerDown={() => { ponte.cmd?.usarItem(id); if (it.tipo === 'comida' || it.tipo === 'bebida' || it.tipo === 'cura') useJogo.setState({ invAberto: false }); }}>{acao(id)}</button>
                <button className="btn" onPointerDown={() => ponte.cmd?.largar(id)}>Largar</button>
              </div>
            </div>); })}
        </div>
        <button className="btn grande" onPointerDown={() => useJogo.setState({ invAberto: false })}>Fechar</button>
      </div>
    </div>
  );
}
