// Adolat SDP Service Worker (PWA Mobile App)
const CACHE_NAME = 'adolat-sdp-v1';
const STATIC_ASSETS = [
  '/',
  '/css/style.css',
  '/js/api.js',
  '/murojaat.html',
  '/savol-javob.html',
  '/cabinet.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    // API so'rovlari har doim tarmoq orqali bajariladi
    return fetch(e.request);
  }
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => caches.match('/'));
    })
  );
});
