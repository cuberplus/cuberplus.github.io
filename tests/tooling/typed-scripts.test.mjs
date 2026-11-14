import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { createServer, transformWithEsbuild } from 'vite';

const updaterURL = new URL('../../scripts/update-alternatives.ts', import.meta.url);
const updater = (await transformWithEsbuild(readFileSync(updaterURL, 'utf8'), updaterURL.pathname, { loader: 'ts' })).code;

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
  const server = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: true, open: false }, logLevel: 'silent' });
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
