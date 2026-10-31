// Manifesto gerado a partir da exportação exata por tools/offline.mjs.
importScripts('./offline-assets.js');
const RAIZ = new URL('./', self.location).pathname;
const PREFIXO = `cinzas:${RAIZ}:`;
const CACHE = PREFIXO + self.__CINZAS_VERSION;
const urls = self.__CINZAS_ASSETS.map(p => RAIZ + p);
const pronto = async () => !!(await (await caches.open(CACHE)).match(RAIZ + '__offline_pronto'));
const avisar = async () => {
  if (!(await pronto())) return;
  for (const client of await self.clients.matchAll({ includeUncontrolled: true })) client.postMessage({ tipo: 'OFFLINE_PRONTO' });
};
self.addEventListener('install', ev => {
  ev.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (let i = 0; i < urls.length; i += 8) await cache.addAll(urls.slice(i, i + 8));
    await cache.put(RAIZ + '__offline_pronto', new Response('ok'));
  })());
});
self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    await self.clients.claim();
    await Promise.all((await caches.keys()).filter(k => (k.startsWith(PREFIXO) || (RAIZ === '/' && k === 'cinzas-v1')) && k !== CACHE).map(k => caches.delete(k)));
    await avisar();
  })());
});
self.addEventListener('message', ev => {
  if (ev.data?.tipo === 'ATUALIZAR') { void self.skipWaiting(); return; }
  if (ev.data?.tipo === 'ESTADO_OFFLINE') ev.waitUntil(avisar());
});
self.addEventListener('fetch', ev => {
  const req = ev.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(RAIZ)) return;
  ev.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (req.mode === 'navigate') {
      try { return await fetch(req); }
      catch { return (await cache.match(url.pathname)) || (await cache.match(RAIZ)) || Response.error(); }
    }
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && (url.pathname.includes('/_next/static/') || url.pathname.includes('/icons/'))) ev.waitUntil(cache.put(req, res.clone()));
    return res;
  })());
});
