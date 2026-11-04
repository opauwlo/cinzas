// Geiger direcional (Plano GOTY S3): mesma escala de hoje (18 cpm de fundo + 900 por unidade de taxa) e um `pan`
// que puxa os cliques para o lado da TELA onde a taxa sobe. Tela isométrica: tela x ∝ (x − y), tela y ∝ (x + y).
import type { CampoRadiacao, LeituraGeiger } from '../../nucleo/contratos';

export const CPM_FUNDO = 18, CPM_POR_TAXA = 900;
/** gradiente (taxa por casa) a partir do qual o pan vai inteiro para um lado */
export const GRAD_PAN_CHEIO = 0.03;
export const nivelDe = (cpm: number): 0 | 1 | 2 | 3 => (cpm > 400 ? 3 : cpm > 180 ? 2 : cpm > 60 ? 1 : 0); // os limiares de SonsVisuais (Hud.tsx)

/**
 * `extra` é a taxa que não vem do campo (pó azul na roupa): soma nos cliques mas não aponta para lado nenhum —
 * quando o perigo está em você, o som vem do centro.
 */
export function leituraGeiger(campo: CampoRadiacao, x: number, y: number, extra = 0): LeituraGeiger {
  const taxa = campo.amostra(x, y), cpm = CPM_FUNDO + (taxa + extra) * CPM_POR_TAXA;
  const gx = (campo.amostra(x + 1.5, y) - campo.amostra(x - 1.5, y)) / 3, gy = (campo.amostra(x, y + 1.5) - campo.amostra(x, y - 1.5)) / 3, m = Math.hypot(gx, gy);
  let pan = 0;
  if (m > 1e-4) pan = ((gx - gy) / Math.SQRT2 / m) * Math.min(1, m / GRAD_PAN_CHEIO) * (taxa / Math.max(1e-6, taxa + Math.max(0, extra)));
  return { cpm, pan: Math.max(-1, Math.min(1, pan)), nivel: nivelDe(cpm) };
}

/** seta das legendas de som (◀ ▶) a partir do pan; '' quando não há lado claro */
export const setaPan = (pan: number) => (pan <= -0.35 ? '◀' : pan >= 0.35 ? '▶' : '');
