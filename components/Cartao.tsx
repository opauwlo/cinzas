'use client';
import { useJogo } from '../game/store';
import { sfx } from '../game/audio';

export const fechar = () => { sfx.ui('clique'); useJogo.setState({ painel: null }); };
/** botão que reage ao toque imediatamente (sem esperar o clique) e não deixa o toque cair no mundo */
export const p = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); fn(); } });

/** moldura padrão dos painéis. `fixo` = sem botão de fechar (decisões que precisam ser resolvidas) */
export function Cartao({ titulo, children, rodape, larg, fixo }: { titulo: string; children: React.ReactNode; rodape?: React.ReactNode; larg?: number; fixo?: boolean }) {
  return (
    <div className="ov" onPointerDown={e => e.stopPropagation()}>
      <div className="cartao aco degrau" style={larg ? { width: `min(100%, ${larg}px)` } : undefined}>
        <h2><span>{titulo}</span>{!fixo && <button className="btn peq" {...p(fechar)}>Fechar</button>}</h2>
        <div className="corpo">{children}</div>{rodape ?? <span />}
      </div>
    </div>
  );
}
