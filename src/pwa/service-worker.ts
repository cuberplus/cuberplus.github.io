/// <reference lib="webworker" />
import type { Solve } from '../../timer/src/Core/engine';
export {};
declare const self: ServiceWorkerGlobalScope;
declare const __PRECACHE__: string[];
const CACHE = 'cuberplus-__CACHE_VERSION__';
const PRECACHE = __PRECACHE__;
const page = /^\/(?:(?:timer|analyzer|smartcubeanalyzer|scrambler|database|trainer|options)\/?)?(?:index\.html)?$/;
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
      await Promise.all((await caches.keys()).filter(key => key.startsWith('cuberplus-') && key !== CACHE && key !== 'cuberplus-preferences').map(key => caches.delete(key)));
    }
    await self.clients.claim();
  })());
});
async function remindStreak() {
  const now = new Date();
  if (now.getHours() < 18 || Notification.permission !== 'granted') return;
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  const today = day(now), settings = await caches.open('cuberplus-preferences');
  if (await (await settings.match('/streak-reminders/enabled'))?.text() !== 'true' ||
      await (await settings.match('/streak-reminders/last-day'))?.text() === String(today)) return;
  const best = new Map<number, number>();
  let hasToday = false;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer');
    request.onupgradeneeded = () => request.transaction?.abort();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('solves'), cursor = tx.objectStore('solves').openCursor();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = tx.onerror = () => { db.close(); reject(tx.error); };
      cursor.onsuccess = () => {
        const row = cursor.result;
        if (!row) return;
        const solve = row.value as Solve;
        if (solve.status !== 'active') {
          const date = day(new Date(solve.imported?.endDate ?? Date.parse(solve.createdAt) + (solve.moves.at(-1)?.elapsed ?? solve.duration)));
          if (date === today) hasToday = true;
          if (solve.status === 'complete' && solve.session !== 'Retries') {
            const time = solve.duration + (solve.penalty ?? 0);
            best.set(date, Math.min(time, best.get(date) ?? Infinity));
          }
        }
        row.continue();
      };
    };
  });
  if (hasToday) return;
  for (const target of [5, 7, 10, 15, 20, 30, 60]) {
    let length = 0;
    for (let date = today - 1; (best.get(date) ?? Infinity) < target * 1000; date--) length++;
    if (!length) continue;
    await settings.put('/streak-reminders/last-day', new Response(String(today)));
    await self.registration.showNotification(`Your ${length} day sub-${target} streak is about to end!`, {
      tag: 'streak-reminder', icon: '/icon-192.png', data: { url: '/timer/' },
    });
    break;
  }
}
let reminderCheck = Promise.resolve();
self.addEventListener('periodicsync', event => {
  const sync = event as ExtendableEvent & { tag: string };
  if (sync.tag === 'streak-reminder') sync.waitUntil(reminderCheck = reminderCheck.catch(() => {}).then(remindStreak));
});
self.addEventListener('notificationclick', event => {
  if (event.notification.tag !== 'streak-reminder') return;
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate('/timer/'); await existing.focus(); }
    else await self.clients.openWindow('/timer/');
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
