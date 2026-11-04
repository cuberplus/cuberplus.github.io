import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const errors = [];
async function database(page, records) {
  return page.evaluate(records => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('solves', records ? 'readwrite' : 'readonly'), store = tx.objectStore('solves');
      records?.forEach(record => store.put(record));
      const read = store.getAll();
      tx.oncomplete = () => { db.close(); resolve(read.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }), records);
}
async function visit(page, name) {
  await page.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('link', { name, current: 'page', exact: true })).toBeVisible();
}
async function engine(page) {
  return page.locator('.site-page--timer .cuberplus-page').evaluateHandle(node => {
    let fiber = node[Object.keys(node).find(key => key.startsWith('__reactFiber$'))];
    while (fiber) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const value = hook.memoizedState?.current;
        if (typeof value?.phase === 'string' && typeof value?.turn === 'function') return value;
      }
      fiber = fiber.return;
    }
    throw new Error('Timer engine not found');
  });
}
async function clickPoint(page, title, label) {
  const canvas = page.getByRole('region', { name: title, exact: true }).locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  const point = await canvas.evaluate((node, label) => {
    let fiber = node[Object.keys(node).find(key => key.startsWith('__reactFiber$'))];
    while (fiber) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const chart = hook.memoizedState?.current;
        if (chart?.canvas !== node) continue;
        const index = label === undefined ? chart.data.labels.length - 1 : chart.data.labels.findIndex(value => String(value) === String(label));
        if (index < 0) throw new Error(`Missing chart label ${label}`);
        return { ...chart.getDatasetMeta(0).data[index].getCenterPoint(true), value: chart.data.datasets[0].data[index] };
      }
      fiber = fiber.return;
    }
    throw new Error('Chart not found');
  }, label);
  await canvas.click({ position: { x: point.x, y: point.y } });
  return point.value;
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  let initializations = 0, popups = 0;
  page.on('console', message => { if (message.text().includes('Initializing Timer')) initializations++; });
  page.on('popup', () => popups++);
  await page.goto(base);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toBe(`${base}/sw.js`);
  const registration = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const manifest = await (await fetch('/manifest.webmanifest')).json();
    return { scope: registration.scope, start: manifest.start_url, manifestScope: manifest.scope };
  });
  expect(registration).toEqual({ scope: `${base}/`, start: '/', manifestScope: '/' });
  await visit(page, 'Timer');
  const simulator = page.getByText('Try simulated cube', { exact: true });
  await expect(simulator).toBeEnabled({ timeout: 60000 });
  await simulator.evaluate(button => button.click());
  const guided = page.getByRole('button', { name: 'Perform guided move', exact: true });
  const simulate = page.getByRole('button', { name: 'Simulate solve', exact: true });
  await expect(guided).toBeEnabled({ timeout: 60000 });
  for (let i = 0; i < 100 && !await simulate.isEnabled(); i++) await guided.click();
  await expect(simulate).toBeEnabled();
  const originalEngine = await engine(page);
  await visit(page, 'Home');
  await page.locator('.site-page--timer button').filter({ hasText: /^Simulate solve$/ }).evaluate(button => button.click());
  await expect.poll(async () => (await database(page)).filter(solve => solve.status === 'complete').length, { timeout: 30000 }).toBe(1);
  const [seed] = await database(page);
  await visit(page, 'Smartcube Analyzer');
  await page.getByRole('button', { name: 'Display My Stats!', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Daily Fastest Solve', exact: true })).toBeVisible({ timeout: 60000 });
  await visit(page, 'Scrambler');
  await expect(page.getByRole('button', { name: 'Print sheet' })).toBeEnabled({ timeout: 120000 });
  await visit(page, 'Timer');
  expect(await page.evaluate(({ before, after }) => before === after, { before: originalEngine, after: await engine(page) })).toBe(true);
  expect(initializations).toBe(1);
  await expect(page.getByRole('button', { name: 'Disconnect', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(1);
  console.log('PASS Timer engine/connection survives all tools and records a solve while hidden');

  const samples = Array.from({ length: 12 }, (_, i) => ({
    ...seed, id: `drilldown-${i}`, duration: [12000, 12999, 13000, 14000, 15000][i % 5], penalty: undefined,
    createdAt: new Date(Date.now() - (12 - i) * 60000).toISOString(),
    moves: seed.moves.map(move => ({ ...move, elapsed: move.elapsed * [12000, 12999, 13000, 14000, 15000][i % 5] / seed.duration })),
  }));
  await database(page, samples);
  await visit(page, 'Smartcube Analyzer');
  await page.getByRole('button', { name: 'Display My Stats!', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'drilldown-11', exact: true }).first()).toBeAttached();
  const count = await clickPoint(page, 'Count of Solves by How Long They Took', 12);
  const list = page.getByRole('dialog', { name: `12s to <13s (${count} solves)`, exact: true });
  await expect(list).toBeVisible();
  await expect(list.locator('tbody tr')).toHaveCount(count);
  const solveId = await list.locator('tbody tr').first().getAttribute('data-solve-id');
  await list.getByRole('button', { name: /^View solve / }).first().click();
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible({ timeout: 60000 });
  if (solveId) await expect(replay.getByLabel('Solve ID', { exact: true })).toContainText(solveId);
  await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  await list.getByRole('button', { name: 'Close solves', exact: true }).click();
  await clickPoint(page, 'Daily Fastest Solve');
  await expect(replay).toBeVisible({ timeout: 60000 });
  await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  await page.getByRole('button', { name: 'Open filters', exact: true }).click();
  await expect(page.locator('.offcanvas.show')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('link', { name: 'Timer', current: 'page', exact: true })).toBeVisible();
  await expect(page.locator('.offcanvas.show:visible')).toHaveCount(0);
  expect(popups).toBe(0);
  console.log('PASS histogram → solve list → inline replay, daily best replay, and hidden filter dialogs');

  await context.setOffline(true);
  const offline = await context.newPage();
  offline.on('pageerror', error => errors.push(error.message));
  offline.on('requestfailed', request => { if (new URL(request.url()).origin === base) errors.push(`${request.url()}: ${request.failure()?.errorText}`); });
  for (const [route, name] of [['/', 'Home'], ['/timer/', 'Timer'], ['/smartcubeanalyzer/', 'Smartcube Analyzer'], ['/scrambler/', 'Scrambler'], ['/options/', 'Options']]) {
    await offline.goto(`${base}${route}`);
    await expect(offline.getByRole('link', { name, current: 'page', exact: true })).toBeVisible();
    if (name === 'Timer') await expect(offline.getByText('Try simulated cube', { exact: true })).toBeEnabled({ timeout: 60000 });
    if (name === 'Smartcube Analyzer') {
      await offline.getByRole('button', { name: 'Display My Stats!', exact: true }).click();
      await expect(offline.getByRole('region', { name: 'Daily Fastest Solve', exact: true })).toBeVisible({ timeout: 60000 });
    }
    if (name === 'Scrambler') await expect(offline.getByRole('button', { name: 'Print sheet' })).toBeEnabled({ timeout: 120000 });
  }
  console.log('PASS root-scoped PWA serves every route, local solve analysis and Scrambler generation offline');
  expect(errors).toEqual([]);
} catch (error) {
  if (errors.length) console.error('Browser errors:', errors);
  throw error;
} finally {
  await browser.close();
}
