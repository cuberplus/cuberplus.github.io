/// <reference lib="webworker" />
export {};
declare const self: ServiceWorkerGlobalScope;
declare const __PRECACHE__: string[];
const CACHE = 'cuberplus-__CACHE_VERSION__';
const PRECACHE = __PRECACHE__;
const page = /^\/(?:(?:timer|smartcubeanalyzer|scrambler|database|trainer|options)\/?)?(?:index\.html)?$/;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    await cache.addAll(PRECACHE.filter(file => !file.startsWith('/case-images/')));
    for (const file of PRECACHE.filter(file => file.startsWith('/case-images/'))) await cache.add(file);
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Other open tabs can still need chunks from the previous build.
    if ((await self.clients.matchAll({ includeUncontrolled: true })).length <= 1) {
      await Promise.all((await caches.keys()).filter(key => key.startsWith('cuberplus-') && key !== CACHE).map(key => caches.delete(key)));
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') void self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range')) return;
  if (request.mode === 'navigate' && page.test(url.pathname)) {
    event.respondWith(fetch(request).catch(async () => (await (await caches.open(CACHE)).match('/index.html')) ?? Response.error()));
  } else if (/\.(?:js|css|wasm|png|jpe?g|gif|svg|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request, { ignoreVary: true })) ?? (await caches.match(request, { ignoreVary: true })) ?? fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(cache.put(request, copy).catch(() => {}));
      }
      return response;
    })));
  }
});
