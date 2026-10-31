'use client';
import { useEffect } from 'react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Registra o service worker (só em produção) para o jogo abrir offline e ser instalável. */
export default function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    let vivo = true;
    const avisar = (detail: object) => { if (vivo) window.dispatchEvent(new CustomEvent('cinzas:app', { detail })); };
    const mensagem = (e: MessageEvent) => { if (e.data?.tipo === 'OFFLINE_PRONTO') avisar({ offline: true }); };
    navigator.serviceWorker.addEventListener('message', mensagem);
    void navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/`, updateViaCache: 'none' }).then(r => {
      if (r.waiting) avisar({ worker: r.waiting });
      r.active?.postMessage({ tipo: 'ESTADO_OFFLINE' });
      r.addEventListener('updatefound', () => {
        const worker = r.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) avisar({ worker }); });
      });
    }).catch(() => undefined);
    return () => { vivo = false; navigator.serviceWorker.removeEventListener('message', mensagem); };
  }, []);
  return null;
}
