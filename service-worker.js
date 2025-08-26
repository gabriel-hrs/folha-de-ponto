// service-worker.js
const CACHE = 'meuapp-cache-v5'; // <-- troque quando mudar a lista

const filesToCache = [
  './',
  './index.html',
  './ponto-de-saida.html',
  './ponto-mensal.html',
  './manifest.json',
  './main.js',
  './firebase-config.js',
  './icon-192x192.png',
  './icon-512x512.png',
  // './favicon.ico', // habilite só se o arquivo existir de verdade
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(filesToCache);
    } catch (err) {
      console.error('[SW] Falha no cache.addAll:', err);
      // tenta adicionar 1 a 1 para identificar o culpado
      for (const url of filesToCache) {
        try { await cache.add(url); }
        catch (e) { console.error('[SW] Falhou ao adicionar:', url, e); }
      }
    }
  })());
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignora métodos != GET e esquemas não http(s)
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  // Ignora chrome-extension e outros domínios
  if (!url.origin.includes(self.location.origin)) {
    // ainda assim deixa a rede responder
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const fresh = await fetch(request);
      if (fresh && fresh.status === 200) {
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch {
      return cached || Response.error();
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => (n === CACHE ? null : caches.delete(n))));
    await self.clients.claim();
  })());
});

// Push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Notificação de saída!',
    icon: './icon-192x192.png',
    badge: './icon-192x192.png',
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification('Hora de sair!', options));
});
