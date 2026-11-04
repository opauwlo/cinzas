'use client';
// Adaptador fino: a fala do rádio numa FITA DE PAPEL TÉRMICO, gramática visual distinta do HUD (que nunca mente).
// Papel claro, tinta térmica falhando em riscas, VT323, borda rasgada embaixo e o rótulo "disseram no rádio":
// o jogador sempre sabe que isto é um PERSONAGEM falando, não o jogo.
import { useSyncExternalStore } from 'react';
import type { EfeitoRadio } from '../../nucleo/contratos';
import { escuta as escutaJogo, type Escuta } from './index';

const LEGENDA: Record<EfeitoRadio, string> = {
  chiado: '[chiado na faixa]',
  vinheta: '[vinheta]',
  vinheta_falha: '[vinheta: a segunda nota falha]',
  interferencia: '[interferência]',
  loop: '[uma tosse, ao fundo]',
};
const PAPEL = '#e6dfc8', TINTA = '#2f2b24', TINTA2 = '#6b6455';
// borda de baixo rasgada em dente de serra (12 dentes)
const RASGO = `polygon(0 0, 100% 0, 100% calc(100% - 6px), ${Array.from({ length: 12 }, (_, i) => `${100 - (i + 0.5) * (100 / 12)}% 100%, ${100 - (i + 1) * (100 / 12)}% calc(100% - 6px)`).join(', ')})`;

export default function RadioBalao({ escuta = escutaJogo }: { escuta?: Escuta }) {
  useSyncExternalStore(escuta.inscrever, escuta.versao, escuta.versao);
  const b = escuta.balao();
  if (!b) return null;
  const avancar = () => escuta.avancar();
  return (
    <div
      role="status" aria-live="polite" aria-label={`Rádio ${b.frequencia}: ${b.fala.quem} disse ${b.fala.texto}`}
      onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); avancar(); }}
      style={{ position: 'absolute', left: '50%', top: 'calc(112px * var(--u) + var(--st))', transform: 'translateX(-50%)', width: 'min(86vw, 360px)', zIndex: 7, pointerEvents: 'auto', cursor: 'pointer', filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.55))' }}
    >
      <style>{`@keyframes escuta-fita { from { transform: translateY(-10px); opacity: .2 } to { transform: none; opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .escuta-fita { animation: none !important } }`}</style>
      <div key={`${b.transmissaoId}:${b.idx}`} className="escuta-fita" style={{ position: 'relative', background: `linear-gradient(90deg, ${PAPEL}, #efe9d6 60%, #d9d1b6)`, color: TINTA, padding: '8px 12px 16px', clipPath: RASGO, animation: 'escuta-fita .32s steps(4) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '16px var(--f-hud)', color: TINTA2, letterSpacing: '.08em', borderBottom: `1px dashed ${TINTA2}`, paddingBottom: 3, marginBottom: 5 }}>
          <svg width="14" height="14" viewBox="0 0 7 7" aria-hidden="true" style={{ shapeRendering: 'crispEdges' }}><path fill={TINTA2} d="M3 2h1v5H3zM2 1h1v1H2zM4 1h1v1H4zM1 0h1v1H1zM5 0h1v1H5zM0 3h1v1H0zM6 3h1v1H6z" /></svg>
          <span>DISSERAM NO RÁDIO</span><span style={{ marginLeft: 'auto' }}>{b.frequencia} · {b.hora} · {b.idx + 1}/{b.total}</span>
        </div>
        <div style={{ font: '700 13px var(--f-ui)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{b.fala.quem}:</div>
        <div style={{ position: 'relative', font: '23px/1.1 var(--f-hud)', marginTop: 2 }}>
          {b.fala.texto}
          {/* riscas da cabeça térmica falhando: a tinta "riscada" que separa o rádio do HUD */}
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `repeating-linear-gradient(0deg, transparent 0 6px, rgba(230,223,200,.6) 6px 7px), repeating-linear-gradient(90deg, transparent 0 37px, rgba(230,223,200,.45) 37px 39px)` }} />
        </div>
        {b.fala.efeito && <div style={{ font: 'italic 400 14px var(--f-txt)', color: TINTA2, marginTop: 3 }}>{LEGENDA[b.fala.efeito]}</div>}
        {b.nota && (
          <div style={{ marginTop: 7, padding: '3px 6px 3px 8px', font: 'italic 400 14px/1.3 var(--f-txt)', color: '#4b4f5c', borderLeft: '2px solid #7d8190', transform: 'rotate(-1.2deg)', background: 'rgba(125,129,144,.12)' }}>
            ✎ {b.nota}
          </div>
        )}
        <div style={{ position: 'absolute', right: 10, bottom: 9, font: '13px var(--f-hud)', color: TINTA2 }}>toque ▸</div>
      </div>
    </div>
  );
}
