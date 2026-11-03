'use client';
import { useEffect, useId, useRef } from 'react';
import { useJogo } from '../game/store';
import { sfx } from '../game/audio';

export const fechar = () => { sfx.ui('clique'); useJogo.setState({ painel: null }); };
/** Ativa ao soltar: rolar uma lista não fabrica, compra ou descarta por acidente. */
export const p = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), onClick: (e: React.MouseEvent) => { e.stopPropagation(); fn(); } });

/** moldura padrão dos painéis. `fixo` = sem botão de fechar (decisões que precisam ser resolvidas); `embaixo` = card no pé da tela, deixando a cena de cima à mostra (evento na estrada) */
export function Cartao({ titulo, children, rodape, larg, fixo, embaixo }: { titulo: string; children: React.ReactNode; rodape?: React.ReactNode; larg?: number; fixo?: boolean; embaixo?: boolean }) {
  const id = useId(), ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const teclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !fixo) { e.preventDefault(); fechar(); }
      if (e.key !== 'Tab') return;
      const lista = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, a[href], [tabindex="0"]') ?? [])];
      const primeiro = lista[0], ultimo = lista.at(-1);
      if (!primeiro) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === ref.current)) { e.preventDefault(); ultimo?.focus(); }
      else if (!e.shiftKey && (document.activeElement === ultimo || document.activeElement === ref.current)) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener('keydown', teclado);
    return () => { document.removeEventListener('keydown', teclado); if (antes?.isConnected) antes.focus(); };
  }, [fixo]);
  return (
    <div className={embaixo ? 'ov embaixo' : 'ov'} onPointerDown={e => e.stopPropagation()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className="cartao aco degrau" style={larg ? { width: `min(100%, ${larg}px)` } : undefined}>
        <h2 id={id}><span>{titulo}</span>{!fixo && <button className="btn peq" {...p(fechar)}>Fechar</button>}</h2>
        <div className="corpo">{children}</div>{rodape ?? <span />}
      </div>
    </div>
  );
}
