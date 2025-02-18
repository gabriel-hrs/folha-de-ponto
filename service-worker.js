const cacheName = 'meuapp-cache-v1';
const filesToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css', // Adicione seu arquivo CSS
  '/app.js', // Adicione seu arquivo JS
  '/icon-192x192.png', // Adicione seus ícones
  '/icon-512x512.png'
];

// Instalar o Service Worker e armazenar arquivos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => {
        return cache.addAll(filesToCache);
      })
  );
});

// Responder a solicitações com arquivos do cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Atualizar o Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [cacheName];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (!cacheWhitelist.includes(cache)) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Evento de Push Notification
self.addEventListener('push', function(event) {
    const options = {
        body: event.data ? event.data.text() : 'Notificação de saída!',
        icon: '/icon-192x192.png',
        vibrate: [200, 100, 200],
    };

    event.waitUntil(
        self.registration.showNotification('Hora de sair!', options)
    );
});
