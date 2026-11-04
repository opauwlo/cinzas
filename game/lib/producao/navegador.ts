// Adaptador fino do navegador: relógio de quadros (rAF), latência de toque (web-vitals INP), memória e ciclo de vida da aba.
// Nada aqui roda nos testes de Node; a lógica fica em desempenho.ts, telemetria.ts e index.ts.
import { quadro, telemetria, encerrarSessao, retomarSessao } from './index';

let usos = 0, raf = 0, ultimo = 0;
const passo = (t: number) => { if (ultimo) quadro(t - ultimo); ultimo = t; raf = requestAnimationFrame(passo); };

/** liga o relógio de quadros (contagem de usos: Diag e telemetria podem pedir juntos); devolve quem desliga */
export function medirQuadros(): () => void {
  if (typeof requestAnimationFrame === 'undefined') return () => {};
  if (usos++ === 0) { ultimo = 0; raf = requestAnimationFrame(passo); }
  let ligado = true;
  return () => { if (!ligado) return; ligado = false; if (--usos === 0) { cancelAnimationFrame(raf); ultimo = 0; } };
}

/** INP (Interaction to Next Paint): do toque até a tela responder, em ms. Carrega web-vitals só quando pedem. */
export function observarToque(cb: (ms: number) => void): void {
  import('web-vitals').then(({ onINP }) => onINP(m => cb(Math.round(m.value)), { reportAllChanges: true })).catch(() => { /* sem Event Timing (Safari antigo) */ });
}

/** heap de JS (só Chromium: performance.memory, não padrão) */
export function memoriaJs(): { usadoMb: number; limiteMb: number } | null {
  const m = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  return m ? { usadoMb: Math.round(m.usedJSHeapSize / 1048576), limiteMb: Math.round(m.jsHeapSizeLimit / 1048576) } : null;
}

type TexturaPhaser = { source?: { width?: number; height?: number }[] };
/** estimativa da memória de textura: soma largura × altura × 4 bytes das texturas que o Phaser tem carregadas.
 *  WebGL não informa memória de GPU; isto é um piso (sem mipmaps nem buffers internos do driver). */
export function memoriaTexturas(): { mb: number; texturas: number } | null {
  try {
    const g = (window as unknown as { __cinzas?: { game?: { textures?: { list?: Record<string, TexturaPhaser> } } } }).__cinzas?.game?.textures?.list;
    if (!g) return null;
    let bytes = 0, n = 0;
    for (const [k, t] of Object.entries(g)) { if (k.startsWith('__')) continue; n++; for (const s of t.source ?? []) bytes += (s.width ?? 0) * (s.height ?? 0) * 4; }
    return { mb: Math.round((bytes / 1048576) * 10) / 10, texturas: n };
  } catch { return null; }
}

/** chamar uma vez no app: mede quadros se houver consentimento, fecha a sessão quando a aba some e tenta enviar */
export function ligarProducaoNoNavegador(): () => void {
  if (typeof document === 'undefined') return () => {};
  const tel = telemetria(); let parar: (() => void) | null = tel.consentiu() ? medirQuadros() : null;
  const post = async (url: string, corpo: string) => { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer' }); return r.ok; };
  const vis = () => {
    if (document.hidden) { encerrarSessao(); void tel.enviar(post); }
    else { retomarSessao(); if (tel.consentiu() && !parar) parar = medirQuadros(); }
  };
  document.addEventListener('visibilitychange', vis);
  return () => { document.removeEventListener('visibilitychange', vis); parar?.(); };
}
