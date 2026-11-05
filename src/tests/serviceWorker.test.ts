/** @jest-environment node */
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transpileModule, ModuleKind } from 'typescript';

type WorkerEvent = { request?: Request; data?: string; waitUntil(work: Promise<void>): void; respondWith(response: Promise<Response>): void };
function worker(clients = 1) {
  const handlers = new Map<string, (event: WorkerEvent) => void>(), entries = new Map<string, Response>();
  const cache = {
    addAll: jest.fn(async (_urls: string[]) => {}),
    match: jest.fn(async (request: Request | string, _options?: CacheQueryOptions) => entries.get(typeof request === 'string' ? request : new URL(request.url).pathname)?.clone()),
    put: jest.fn(async (request: Request, response: Response) => { entries.set(new URL(request.url).pathname, response); }),
  };
  const caches = { open: jest.fn(async () => cache), match: jest.fn(async (_request: Request, _options?: CacheQueryOptions) => undefined), keys: jest.fn(async () => ['cuberplus-old', 'unrelated']), delete: jest.fn(async () => true) };
  const scope = { addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler), location: { origin: 'https://cuberplus.com' }, clients: { matchAll: async () => Array.from({ length: clients }), claim: jest.fn(async () => {}) }, skipWaiting: jest.fn() };
  const fetch = jest.fn(async (_request: Request) => new Response('network'));
  const code = transpileModule(readFileSync('src/service-worker.ts', 'utf8'), { compilerOptions: { module: ModuleKind.ESNext } }).outputText.replace('export {};', '').replace('__CACHE_VERSION__', 'test').replace('__PRECACHE__', JSON.stringify(['/index.html', '/assets/app.js']));
  runInNewContext(code, { self: scope, caches, fetch, URL, Response });
  async function fire(name: string, payload: Partial<WorkerEvent> = {}) {
    const pending: Promise<void>[] = [];
    let response: Promise<Response> | undefined;
    handlers.get(name)!({ ...payload, waitUntil: work => pending.push(work), respondWith: work => { response = work; } });
    const result = await response;
    await Promise.all(pending);
    return result;
  }
  const request = (path: string, mode = 'navigate', method = 'GET', range = false) => ({ url: new URL(path, scope.location.origin).href, mode, method, headers: new Headers(range ? { range: 'bytes=0-10' } : {}) }) as Request;
  return { fire, entries, cache, caches, scope, fetch, request };
}
test('installation precaches the full build without skipping a waiting update', async () => {
  const app = worker();
  await app.fire('install');
  expect(app.cache.addAll).toHaveBeenCalledWith(['/index.html', '/assets/app.js']);
  expect(app.scope.skipWaiting).not.toHaveBeenCalled();
  await app.fire('message', { data: 'SKIP_WAITING' });
  expect(app.scope.skipWaiting).toHaveBeenCalledTimes(1);
});
test.each(['/', '/timer/', '/timer/index.html', '/smartcubeanalyzer/', '/scrambler/', '/database/', '/database/index.html'])('offline navigation to %s returns the cached single-app shell', async path => {
  const app = worker();
  app.entries.set('/index.html', new Response('offline shell'));
  app.fetch.mockRejectedValue(new Error('Offline'));
  expect(await (await app.fire('fetch', { request: app.request(path) }))!.text()).toBe('offline shell');
});
test('hashed worker assets are cached, but failed responses, external requests, range requests and writes are not', async () => {
  const app = worker();
  expect(await (await app.fire('fetch', { request: app.request('/assets/solver.js', 'cors') }))!.text()).toBe('network');
  app.fetch.mockRejectedValue(new Error('Offline'));
  expect(await (await app.fire('fetch', { request: app.request('/assets/solver.js', 'cors') }))!.text()).toBe('network');
  expect(app.fetch).toHaveBeenCalledTimes(1);
  app.fetch.mockResolvedValue(new Response('Not found', { status: 404 }));
  await app.fire('fetch', { request: app.request('/assets/missing.js', 'cors') });
  expect(app.entries.has('/assets/missing.js')).toBe(false);
  app.fetch.mockClear();
  for (const request of [app.request('https://example.com/app.js', 'cors'), app.request('/assets/app.js', 'cors', 'POST'), app.request('/assets/app.js', 'cors', 'GET', true), app.request('/unrelated.html')]) {
    expect(await app.fire('fetch', { request })).toBeUndefined();
  }
  expect(app.fetch).not.toHaveBeenCalled();
});
test('activation retains previous chunks for other open tabs and never deletes unrelated caches', async () => {
  const multiple = worker(2);
  await multiple.fire('activate');
  expect(multiple.caches.delete).not.toHaveBeenCalled();
  const single = worker();
  await single.fire('activate');
  expect(single.caches.delete).toHaveBeenCalledTimes(1);
  expect(single.caches.delete).toHaveBeenCalledWith('cuberplus-old');
  expect(single.scope.clients.claim).toHaveBeenCalled();
});
test('preloaded static modules work offline when the server varies its response by Origin', async () => {
  const app = worker();
  app.cache.match.mockImplementation(async (request, options) => {
    if (options?.ignoreVary && new URL((request as Request).url).pathname === '/assets/app.js') return new Response('cached module');
    return undefined;
  });
  app.fetch.mockRejectedValue(new Error('Offline'));
  expect(await (await app.fire('fetch', { request: app.request('/assets/app.js', 'cors') }))!.text()).toBe('cached module');
  expect(app.fetch).not.toHaveBeenCalled();
});
