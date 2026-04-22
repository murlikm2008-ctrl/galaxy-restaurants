const CACHE = 'gmf-owner-v1';
const SHELL = ['owner.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('jsonbin.io') || e.request.url.includes('googleapis')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Show notification from page (via postMessage)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'NEW_ORDER') {
    self.registration.showNotification('🍽️ New Order — Galaxy Mart Foods', {
      body: e.data.body || 'A new order is waiting!',
      icon: 'https://placehold.co/192x192/1a0d05/e8a045?text=GMF',
      badge: 'https://placehold.co/96x96/1a0d05/e8a045?text=GMF',
      vibrate: [300, 100, 300, 100, 600],
      tag: 'new-order-' + Date.now(),
      requireInteraction: true,
      actions: [
        { action: 'view', title: '👁 View Orders' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (var c of list) {
        if (c.url.includes('owner') && 'focus' in c) return c.focus();
      }
      return clients.openWindow('owner.html');
    })
  );
});
