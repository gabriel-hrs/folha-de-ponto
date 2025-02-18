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
