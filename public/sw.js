const VERSION = 'scan-count-pad-v5';
const SHELL = ['/offline.html', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/art/counting-bay.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const indexResponse = await fetch('/index.html', { cache: 'reload' });
    const html = await indexResponse.clone().text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
    await Promise.all([...SHELL, ...builtAssets].map(async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not precache ${url}`);
      await cache.put(url, response);
    }));
    await cache.put('/index.html', indexResponse.clone());
    await cache.put('/', indexResponse);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(async () => (await caches.match(event.request, { ignoreVary: true })) || (await caches.match('/index.html', { ignoreVary: true })) || caches.match('/offline.html', { ignoreVary: true })));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(VERSION).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
