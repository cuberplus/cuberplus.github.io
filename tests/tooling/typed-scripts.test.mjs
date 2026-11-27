import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { createServer, transformWithEsbuild } from 'vite';
import { IDBFactory } from 'fake-indexeddb';
import { createServer as createSocketServer } from 'node:net';

const updaterURL = new URL('../../scripts/update-alternatives.ts', import.meta.url);
const updater = (await transformWithEsbuild(readFileSync(updaterURL, 'utf8'), updaterURL.pathname, { loader: 'ts' })).code;

test('Discord forwards only source-branch pushes and reports delivery failures', async () => {
  const workflow = readFileSync(new URL('../../.github/workflows/discord-commits.yml', import.meta.url), 'utf8');
  assert.match(workflow, /push:\s+branches: \[main, master\]/);
  assert.match(workflow, /DISCORD_WEBHOOK_URL: \$\{\{ secrets\.DISCORD_WEBHOOK_URL \}\}/);
  const script = workflow.split('script: |')[1], deliveries = [];
  async function notify(ref, { status = 204, deleted = false, configured = true } = {}) {
    const payload = { ref, deleted, commits: [{ id: 'abc123', message: 'Source change' }] };
    const context = createContext({
      context: { ref, payload }, process: { env: configured ? { DISCORD_WEBHOOK_URL: 'https://discord.test/github' } : {} },
      fetch: async (url, init) => { deliveries.push({ url, ...init }); return { ok: status === 204, status }; },
    });
    await runInContext(`(async () => { ${script} })()`, context);
  }
  for (const ref of ['refs/heads/gh-pages', 'refs/heads/feature', 'refs/tags/v1']) await notify(ref);
  await notify('refs/heads/main', { deleted: true });
  assert.equal(deliveries.length, 0);
  for (const ref of ['refs/heads/main', 'refs/heads/master']) await notify(ref);
  assert.equal(deliveries.length, 2);
  assert.equal(deliveries[0].method, 'POST');
  assert.equal(deliveries[0].headers['X-GitHub-Event'], 'push');
  assert.equal(JSON.parse(deliveries[0].body).ref, 'refs/heads/main');
  assert.equal(JSON.parse(deliveries[1].body).ref, 'refs/heads/master');
  await assert.rejects(notify('refs/heads/main', { status: 429 }), /Discord notification failed \(429\)/);
  await assert.rejects(notify('refs/heads/main', { configured: false }), /not configured/);
});

async function updateAlternatives(status = 200) {
  const saved = { 'F2L-1': [" U2' "], 'OLL-1': [], 'PLL-T': [] };
  const writes = [], visits = [], requests = [], messages = [];
  let closed = false;
  const entries = [
    { category: 'F2L', id: '1', algorithm: 'R2' },
    { category: 'OLL', id: '1', algorithm: 'F' },
    { category: 'PLL', id: 'T', algorithm: 'R' },
  ];
  const page = {
    goto: async url => { visits.push(url); },
    evaluate: async (_fn, path) => { assert.equal(path, '/src/database/algorithms.ts'); return entries; },
  };
  const context = createContext({
    URL, process: { platform: 'linux', env: { SITE_URL: 'http://site.test/' } },
    console: { log: message => { messages.push(message); } },
    fetch: async url => {
      requests.push(url);
      return {
        ok: status === 200, status,
        text: async () => `
          <div class="row singlealgorithm g-0" data-alg="F2L_1">
            <div class="cubedb-ftw-1" data-alg="R2&#39;"></div>
            <div class="cubedb-ftw-2" data-alg="U2"></div>
            <div class="cubedb-ftw-3" data-alg=" R &apos;  U "></div>
            <div class="cubedb-ftw-4" data-alg="R &#39; U"></div>
          <div class="row singlealgorithm g-0" data-alg="F2L_999">
            <div class="cubedb-ftw-1" data-alg="B"></div>`,
      };
    },
  });
  const modules = new Map([
    ['@playwright/test', { chromium: { launch: async () => ({
      newPage: async () => page, close: async () => { closed = true; },
    }) } }],
    ['node:fs', { writeFileSync: (file, contents) => { writes.push({ file: file.href, contents }); } }],
    ['../src/database/alternatives.json', { default: saved }],
  ]);
  const script = new SourceTextModule(updater, {
    context, initializeImportMeta: meta => { meta.url = updaterURL.href; },
  });
  await script.link(specifier => {
    const exports = modules.get(specifier);
    assert.ok(exports, `Unexpected dependency: ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  let error;
  try { await script.evaluate(); } catch (failure) { error = failure; }
  return { saved, writes, visits, requests, messages, closed, error };
}

test('typed updater preserves normalization, deduplication, output and browser cleanup', async () => {
  const result = await updateAlternatives();
  assert.equal(result.error, undefined);
  assert.deepEqual(result.saved['F2L-1'], [" U2' ", "R ' U"]);
  assert.deepEqual(result.visits, ['http://site.test/']);
  assert.equal(result.requests.length, 3);
  assert.equal(result.writes.length, 1);
  assert.equal(result.writes[0].file, new URL('../../src/database/alternatives.json', import.meta.url).href);
  assert.equal(result.writes[0].contents, JSON.stringify(result.saved, null, 2) + '\n');
  assert.match(result.messages[0], /^Added 1 SpeedCubeDB alternatives/);
  assert.equal(result.closed, true);
});

test('typed updater closes its browser without writing on HTTP failures', async () => {
  const result = await updateAlternatives(503);
  assert.match(result.error.message, /https:\/\/speedcubedb.com\/a\/3x3\/F2L: 503/);
  assert.equal(result.closed, true);
  assert.deepEqual(result.writes, []);
});

test('Vite serves an isolated, synchronous classic theme asset at the original URL', async () => {
  const socket = createSocketServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true, open: false }, logLevel: 'silent' });
  try {
    await server.listen();
    const url = new URL('/analyzer/theme-init.js?cache=off', server.resolvedUrls.local[0]);
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/javascript/);
    const script = await response.text();
    const stylesheet = await fetch(new URL('/analyzer/react-data-grid.css?cache=off', url));
    const packaged = readFileSync(new URL('../../node_modules/react-data-grid/lib/styles.css', import.meta.url));
    assert.equal(stylesheet.status, 200);
    assert.match(stylesheet.headers.get('content-type'), /text\/css/);
    assert.deepEqual(Buffer.from(await stylesheet.arrayBuffer()), packaged);
    const assets = [], plugin = server.config.plugins.find(plugin => plugin.name === 'cuberplus-pages-and-offline');
    assert.equal(typeof plugin.generateBundle, 'function');
    plugin.generateBundle.call({ emitFile: asset => assets.push(asset) });
    assert.equal(assets.length, 1);
    assert.equal(assets[0].fileName, 'analyzer/react-data-grid.css');
    assert.deepEqual(assets[0].source, packaged);
    const attributes = new Map(), metadata = new Map(), listeners = [];
    const context = createContext({
      localStorage: { getItem: () => 'dark' },
      document: {
        documentElement: { setAttribute: (name, value) => attributes.set(name, value) },
        querySelector: () => ({ setAttribute: (name, value) => metadata.set(name, value) }),
      },
      window: { addEventListener: (type, callback) => listeners.push({ type, callback }) },
    });

    runInContext(script, context);
    assert.equal(attributes.get('data-theme'), 'dark');
    assert.equal(attributes.get('data-bs-theme'), 'dark');
    assert.equal(metadata.get('content'), '#10141e');
    assert.equal(runInContext('typeof colors + ":" + typeof theme', context), 'undefined:undefined');
    assert.equal(listeners[0].type, 'error');
    assert.doesNotMatch(script, /\b(?:import|export|eval)\s*[(\s{]/);
  } finally { await server.close(); }
});

const workerURL = new URL('../../src/pwa/service-worker.ts', import.meta.url);
    const serviceWorker = (await transformWithEsbuild(readFileSync(workerURL, 'utf8'), workerURL.pathname, { loader: 'ts', format: 'iife' })).code;
    async function reminderWorker({ hour = 19, enabled = true, permission = 'granted', solves = [], seeded = true } = {}) {
      const indexedDB = new IDBFactory(), handlers = new Map(), entries = new Map(), notifications = [], visits = [];
      let now = new Date(2026, 10, 25, hour);
      if (seeded) await new Promise((resolve, reject) => {
        const request = indexedDB.open('smart-cube-timer', 2);
        request.onupgradeneeded = () => request.result.createObjectStore('solves', { keyPath: 'id' });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result, tx = db.transaction('solves', 'readwrite');
          solves.forEach(solve => tx.objectStore('solves').put(solve));
          tx.oncomplete = () => { db.close(); resolve(); };
        };
      });
      entries.set('/streak-reminders/enabled', new Response(String(enabled)));
      const context = createContext({
        URL, Response, indexedDB, __PRECACHE__: [], Notification: { permission },
        Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } },
        caches: { open: async () => ({ match: async key => entries.get(key)?.clone(), put: async (key, response) => entries.set(key, response) }) },
        self: {
          location: { origin: 'https://cuberplus.test' },
          addEventListener: (name, handler) => handlers.set(name, handler),
          registration: { showNotification: async (title, options) => notifications.push({ title, options }) },
          clients: { matchAll: async () => [], openWindow: async url => visits.push(url) },
        },
      });
      runInContext(serviceWorker, context);
      return {
        notifications, visits, entries,
        setDate: date => { now = date; },
        async sync(count = 1) {
          const promises = [];
          for (let i = 0; i < count; i++) handlers.get('periodicsync')({ tag: 'streak-reminder', waitUntil: promise => promises.push(promise) });
          await Promise.all(promises);
        },
        async click() {
          let promise;
          handlers.get('notificationclick')({ notification: { tag: 'streak-reminder', close() {} }, waitUntil: value => { promise = value; } });
          await promise;
        },
      };
    }
    const streakRecording = (day, duration = 9000, overrides = {}) => ({
      id: `day-${day}`, createdAt: new Date(2026, 10, day, 12).toISOString(),
      duration, status: 'complete', session: 'Default', moves: [], ...overrides,
    });
    test('closed-app background checks notify once per local day across concurrent wakeups and worker restarts', async () => {
      const solves = [streakRecording(23), streakRecording(24), streakRecording(24, 9500, { id: 'slower' })];
      const worker = await reminderWorker({ solves });
      await worker.sync(3);
      assert.equal(worker.notifications.length, 1);
      assert.equal(worker.notifications[0].title, 'Your 2 day sub-10 streak is about to end!');
      await worker.click();
      assert.deepEqual(worker.visits, ['/timer/']);
      const restarted = await reminderWorker({ solves });
      restarted.entries.set('/streak-reminders/last-day', worker.entries.get('/streak-reminders/last-day').clone());
      await restarted.sync();
      assert.equal(restarted.notifications.length, 0);
      restarted.setDate(new Date(2026, 10, 26, 19));
      await restarted.sync();
      assert.equal(restarted.notifications.length, 0, 'an already broken streak must not notify');
    });
    test('background reminders honor today, attempts, retries, penalties, completion dates, opt-out and permission', async () => {
      const yesterday = streakRecording(24);
      for (const options of [
        { solves: [yesterday, streakRecording(25)] },
        { solves: [yesterday, streakRecording(25, 1000, { status: 'incomplete', session: 'Retries' })] },
        { solves: [streakRecording(24, 9000, { session: 'Retries' })] },
        { solves: [yesterday], enabled: false },
        { solves: [yesterday], permission: 'denied' },
        { solves: [yesterday], hour: 17 },
      ]) {
        const worker = await reminderWorker(options);
        await worker.sync();
        assert.equal(worker.notifications.length, 0, JSON.stringify(options));
      }
      const active = await reminderWorker({ solves: [yesterday, streakRecording(25, 1000, { status: 'active' })] });
      await active.sync();
      assert.equal(active.notifications.length, 1);
      const unset = await reminderWorker({ solves: [yesterday] });
      unset.entries.delete('/streak-reminders/enabled');
      await unset.sync();
      assert.equal(unset.notifications.length, 0, 'reminders require an explicit opt-in');
      const penalized = await reminderWorker({ solves: [streakRecording(24, 9000, { penalty: 2000 })] });
      await penalized.sync();
      assert.match(penalized.notifications[0].title, /sub-15/);
      const midnight = await reminderWorker({ solves: [streakRecording(24, 9000, {
        createdAt: new Date(2026, 10, 24, 23, 59, 59).toISOString(),
      })] });
      await midnight.sync();
      assert.equal(midnight.notifications.length, 0);
    });
