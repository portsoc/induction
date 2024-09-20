const CACHE_NAME = 'induction-tt-v1.5';

// Use the install event to pre-cache all initial resources.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    cache.addAll([
      './',
      'index.html',
      'index.js',
      'style.css',
      'data/data.json',
      'logo.svg',
    ]);
  })());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    }),
  );
});
