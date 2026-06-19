const CACHE_NAME = "accu-roster-pwa-v14";
const APP_SHELL = [
  "./?v=14",
  "./index.html?v=14",
  "./styles.css?v=14",
  "./config.js?v=14",
  "./app.js?v=14",
  "./manifest.webmanifest?v=14",
  "./icons/rostar-icon-180.png?v=14",
  "./icons/rostar-icon-192.png?v=14",
  "./icons/rostar-icon-512.png?v=14",
  "./icons/rostar-thumbnail.png?v=14",
  "./icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        if (event.request.mode === "navigate") return caches.match("./?v=14");
        return caches.match(event.request).then(cached => cached || caches.match("./?v=14"));
      })
  );
});
