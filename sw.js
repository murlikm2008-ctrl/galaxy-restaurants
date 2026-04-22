const CACHE_NAME = "galaxy-owner-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./owner.html",
  "./manifest.json",
  "./app-data.js",
  "./firebase-config.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./owner.html")))
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SHOW_ORDER_ALERT") {
    event.waitUntil(
      self.registration.showNotification(data.title || "Galaxy Restaurant - New Order", {
        body: data.body || "A new order is waiting.",
        tag: "galaxy-order-alert",
        renotify: true,
        requireInteraction: true,
        vibrate: [250, 80, 250, 80, 450],
        data: { url: data.url || "./owner.html" }
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./owner.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.navigate(targetUrl).catch(() => {}).then(() => client.focus());
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return null;
    })
  );
});