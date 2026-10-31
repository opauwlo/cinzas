// Service worker do CINZAS: abre offline depois da primeira visita.
// Estratégia: cache-first para arquivos estáticos (têm hash no nome), rede-primeiro para a página (para pegar versões novas).
const VERSAO = 'cinzas-v1';
const RAIZ = new URL('./', self.location).pathname; // ex.: "/" ou "/cinzas/"

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(VERSAO).then(c => c.addAll([RAIZ, RAIZ + 'manifest.webmanifest', RAIZ + 'pwa/icon-192.png']).catch(() => undefined)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', ev => {
  const req = ev.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== self.location.origin) return;
  const pagina = req.mode === 'navigate' || req.destination === 'document';
  if (pagina) {
    ev.respondWith(fetch(req).then(r => { const copia = r.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); return r; }).catch(() => caches.match(req).then(r => r || caches.match(RAIZ))));
    return;
  }
  ev.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const copia = r.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); } return r; })));
});
