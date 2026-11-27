import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5181';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const owner = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const recipient = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const files = new Map(), anonymousReads = [], errors = [];
let sequence = 0;
const respond = async route => {
  const request = route.request(), url = new URL(request.url()), method = request.method();
  const id = url.pathname.match(/\/files\/([^/]+)/)?.[1];
  if (method === 'POST' && url.pathname.endsWith('/files')) {
    const file = { id: `snapshot-${++sequence}`, ...request.postDataJSON(), resourceKey: 'resource-key', public: false };
    files.set(file.id, file); return route.fulfill({ json: file });
  }
  const file = files.get(id);
  if (method === 'GET' && url.pathname.endsWith('/files')) {
    const query = url.searchParams.get('q');
    return route.fulfill({ json: { files: [...files.values()].filter(file =>
      Object.keys(file.appProperties).some(key => query.includes(key))).map(({ id, name, resourceKey }) => ({ id, name, resourceKey })) } });
  }
  if (!file) return route.fulfill({ status: 404, json: { error: 'gone' } });
  if (method === 'PATCH') { file.data = request.postDataJSON(); return route.fulfill({ json: { id } }); }
  if (method === 'POST' && url.pathname.endsWith('/permissions')) {
    expect(request.postDataJSON()).toEqual({ type: 'anyone', role: 'reader', allowFileDiscovery: false });
    file.public = true; return route.fulfill({ json: { id: 'public-permission' } });
  }
  if (method === 'DELETE') { files.delete(id); return route.fulfill({ status: 204 }); }
  if (url.searchParams.get('alt') === 'media') {
    expect(request.headers().cookie).toBeUndefined();
    if (request.headers().authorization) {
      expect(request.headers().authorization).toBe('Bearer browser-publisher-token');
      return route.fulfill({ json: file.data });
    }
    expect(url.searchParams.get('key')).toBe('browser-test-public-key');
    anonymousReads.push(id); return route.fulfill({ status: file.public ? 200 : 403, json: file.data });
  }
  return route.fulfill({ json: { id, name: file.name, resourceKey: file.resourceKey } });
};
for (const context of [owner, recipient]) {
  await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await context.route('https://www.googleapis.com/**', respond);
}
await owner.addInitScript(() => {
  window.google = { accounts: { oauth2: { initTokenClient: options => ({
    requestAccessToken: () => options.callback({ access_token: 'browser-publisher-token', expires_in: 3600, scope: options.scope }),
  }) } } };
});
const page = await owner.newPage(), reader = await recipient.newPage();
const fileAt = url => files.get(new URL(url).searchParams.get('id'));
page.on('pageerror', error => errors.push(error.message)); reader.on('pageerror', error => errors.push(error.message));
async function shot(name) {
  if (!process.env.NOV24_SCREENSHOTS) return;
  mkdirSync(process.env.NOV24_SCREENSHOTS, { recursive: true });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: join(process.env.NOV24_SCREENSHOTS, `${name}.png`) });
}
try {
  await page.goto(base);
  await page.evaluate(async () => {
    const [{ loadCube }, { saveSolves }] = await Promise.all([import('/timer/src/Core/puzzle.ts'), import('/timer/src/Data/storage.ts')]);
    const cube = await loadCube();
    await saveSolves(Array.from({ length: 12 }, (_, index) => ({
      version: 1, id: `fixture-${index + 1}`, session: 'Default', device: 'PRIVATE DEVICE', reason: 'PRIVATE NOTE',
      createdAt: new Date(Date.UTC(2026, 10, 20, 12, index)).toISOString(), scramble: 'R',
      startFacelets: cube.facelets(cube.solved().applyAlg('R')), duration: 12000 + index * 100,
      status: 'complete', timingBasis: 'host',
      moves: [{ move: "R'", elapsed: 0, hostTime: 123456, localTimestamp: 123456, cubeTimestamp: 654321 }],
    })));
  });
  await page.goto(`${base}/timer/?solve=fixture-1`);
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible({ timeout: 60000 });
  await expect(replay.locator('.replay-header').getByRole('button', { name: 'Share', exact: true })).toHaveCount(0);
  expect(await replay.locator('.replay-actions button').allTextContents()).toEqual(['Share', '+2', 'DNF', 'Delete']);
  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const buttons = await replay.locator('.replay-actions button').evaluateAll(elements => elements.map(element => {
      const { x, y, width, height } = element.getBoundingClientRect(); return { x, y, width, height };
    }));
    expect(buttons[0].x).toBeLessThan(buttons[1].x);
    expect(buttons[1].x).toBeLessThan(buttons[2].x);
    expect(buttons[2].x).toBeLessThan(buttons[3].x);
    expect(buttons.every(button => button.y === buttons[0].y), `Replay controls at ${width}px: ${JSON.stringify(buttons)}`).toBe(true);
    expect(await replay.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  await replay.getByRole('button', { name: 'Share', exact: true }).click();
  let sharing = page.getByRole('dialog', { name: /^Share solve/ });
  await expect(sharing.getByText('1 solve selected', { exact: true })).toBeVisible();
  await sharing.getByRole('button', { name: 'Publish to my Google Drive' }).click();
  const link = sharing.getByLabel('Public snapshot link');
  await expect(link).toBeVisible({ timeout: 60000 });
  const singleUrl = await link.inputValue();
  expect(singleUrl).toContain('/share/?id=');
  expect(fileAt(singleUrl).data.format).toBe('cuberplus-share-v2');
  expect(JSON.stringify([...files.values()].map(file => file.data))).not.toMatch(/PRIVATE|fixture-|123456|654321/);
  await reader.goto(singleUrl);
  await expect(reader.getByRole('heading', { name: 'Shared solve', exact: true })).toBeVisible();
  const publicReplay = reader.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(publicReplay).toBeVisible();
  await expect(publicReplay.getByRole('button', { name: 'Play', exact: true })).toBeEnabled();
  await expect(publicReplay.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
  await expect(publicReplay.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
  await expect(publicReplay.getByRole('button', { name: '+2', exact: true })).toHaveCount(0);
  expect(await reader.evaluate(async () => (await indexedDB.databases()).map(db => db.name))).not.toContain('smart-cube-timer');
  await sharing.getByRole('button', { name: 'Revoke link' }).click();
  await expect(sharing.getByRole('status')).toContainText('revoked');
  await reader.reload();
  await expect(reader.getByRole('alert')).toContainText('revoked');
  await sharing.getByRole('button', { name: 'Close sharing' }).click();
  await replay.getByRole('button', { name: 'Close replay' }).click();
  await page.getByRole('button', { name: 'View current Ao5', exact: true }).click();
  const average = page.locator('dialog.average-dialog');
  await expect(average).toBeVisible();
  await average.getByRole('button', { name: 'Share average', exact: true }).click();
  sharing = page.getByRole('dialog', { name: /^Share solves/ });
  await sharing.getByRole('button', { name: 'Publish to my Google Drive' }).click();
  await expect(sharing.getByLabel('Public snapshot link')).toBeVisible({ timeout: 60000 });
  const averageUrl = await sharing.getByLabel('Public snapshot link').inputValue();
  await reader.goto(averageUrl);
  await expect(reader.getByRole('heading', { name: 'Shared average' })).toBeVisible();
  await expect(reader.locator('dialog.average-dialog tbody tr')).toHaveCount(fileAt(averageUrl).data.rows.length);
  const sharedAverage = reader.locator('dialog.average-dialog');
  expect(await sharedAverage.locator('thead th').allTextContents()).toEqual(['Solve', 'Time', 'Turns', 'TPS']);
  await sharedAverage.getByRole('button', { name: 'Time', exact: true }).click();
  await sharedAverage.getByRole('button', { name: 'Time', exact: true }).click();
  await expect(sharedAverage.locator('th[aria-sort="descending"]')).toHaveText('Time');
  for (const width of [1200, 390, 320]) {
    await reader.setViewportSize({ width, height: 900 });
    expect(await reader.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await sharedAverage.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (process.env.NOV24_SCREENSHOTS) {
      mkdirSync(process.env.NOV24_SCREENSHOTS, { recursive: true });
      await reader.screenshot({ path: join(process.env.NOV24_SCREENSHOTS, `shared-average-${width}.png`) });
    }
  }
  await sharedAverage.locator('tbody .average-cell').first().click();
  await expect(publicReplay).toBeVisible();
  await expect(publicReplay.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
  await publicReplay.getByRole('button', { name: 'Close replay' }).click();
  await reader.setViewportSize({ width: 1200, height: 900 });
  expect(fileAt(averageUrl).data.rows.filter(row => row.trimmed)).toHaveLength(2);
  await page.goto(`${base}/analyzer/`);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 120000 });
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  const records = page.getByRole('region', { name: 'Current Records', exact: true });
  const recordCell = records.getByRole('gridcell').filter({ hasText: /^Ao5$/ });
  await recordCell.click();
  await page.locator('dialog.average-dialog').getByRole('button', { name: 'Share average', exact: true }).click();
  sharing = page.getByRole('dialog', { name: /^Share solves/ });
  await expect(sharing.getByText('5 solves selected', { exact: true })).toBeVisible({ timeout: 60000 });
  await sharing.getByRole('button', { name: 'Publish to my Google Drive' }).click();
  await expect(sharing.getByLabel('Public snapshot link')).toBeVisible({ timeout: 60000 });
  const analyzerShare = fileAt(await sharing.getByLabel('Public snapshot link').inputValue()).data;
  expect(analyzerShare.rows.every(row => files.get(analyzerShare.catalogs[row.catalog].id).data.solves[row.solve].moves.length === 1)).toBe(true);
  await page.goto(`${base}/options/`);
  const general = page.getByRole('button', { name: 'General', exact: true });
  if (await general.getAttribute('aria-expanded') === 'false') await general.click();
  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const dots = await page.locator('.theme-dots button').evaluateAll(buttons => buttons.map(button => {
      const box = button.getBoundingClientRect(); return { x: box.x, y: box.y, w: box.width, h: box.height };
    }));
    const counts = [...new Set(dots.map(dot => dot.y))].map(y => dots.filter(dot => dot.y === y).length);
    expect(counts.every(count => count === 3 || count === 6)).toBe(true);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) await shot('theme-mobile');
  }
  await page.getByRole('button', { name: 'Mistakes', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'F2L: Non-suggested pair', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Cloud backup', exact: true }).click();
  await page.getByRole('button', { name: 'Manage Google Drive shared solves' }).click();
  await expect(page.getByRole('button', { name: /^Revoke CuberPlus/ })).toHaveCount(2);
  await page.goto(`${base}/trainer/`);
  await page.locator('.trainer-drill').filter({ hasText: 'Single-case drill' }).click();
  await page.locator('.trainer-category summary').filter({ hasText: 'PLL cases' }).click();
  await page.getByRole('button', { name: 'Practice PLL T', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop drill', exact: true })).toHaveCount(0);
  const back = page.getByRole('button', { name: 'Back to cases', exact: true });
  expect(await back.locator('svg').count()).toBe(1);
  expect(await back.evaluate(button => [button.offsetWidth, button.offsetHeight])).toEqual([44, 44]);
  await back.click();
  await shot('case-picker-mobile');
  await page.goto(`${base}/trainer/?case=PLL-T`);
  await page.evaluate(async () => {
    const { cubeConnection } = await import('/shared/cube/connection.ts');
    cubeConnection.update({ connection: { deviceName: 'Test cube' } });
  });
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeEnabled();
  await page.waitForTimeout(3200);
  await expect(page.getByRole('button', { name: 'Stop drill', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Random pre-AUF' })).toBeEnabled();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop drill', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Stop drill', exact: true }).click();
  const previousCatalogs = new Set([...files.values()].filter(file => file.appProperties.cuberplusCatalog).map(file => file.id));
  const overlap = await page.evaluate(async () => {
    const [{ loadCube }, { makeSnapshot }, drive] = await Promise.all([
      import('/timer/src/Core/puzzle.ts'), import('/src/sharing/snapshot.ts'), import('/src/sharing/drive.ts'),
    ]);
    const cube = await loadCube(), startFacelets = cube.facelets(cube.solved().applyAlg('R'));
    const rows = Array.from({ length: 1001 }, (_, index) => ({
      number: index + 1, time: 12, turns: 1, tps: 1, trimmed: null,
      solve: { version: 1, id: `overlap-${index}`, session: 'PRIVATE SESSION', device: 'PRIVATE DEVICE', reason: 'PRIVATE NOTE',
        createdAt: new Date(Date.UTC(2026, 10, 24) + index * 1000).toISOString(),
        scramble: 'R', startFacelets, duration: 12000, status: 'complete', timingBasis: 'host',
        moves: [{ move: "R'", elapsed: 0, hostTime: 123456, localTimestamp: 123456, cubeTimestamp: 654321 }] },
    }));
    await drive.connectSharing();
    const first = await drive.publishShare(await makeSnapshot(rows.slice(0, 1000), 12, 'average'));
    const next = rows.slice(1); next[0].trimmed = 'best'; next.at(-1).trimmed = 'worst';
    const second = await drive.publishShare(await makeSnapshot(next, 12, 'average'));
    const original = await drive.readShare(first), updated = await drive.readShare(second);
    return {
      originalNumbers: [original.rows.length, original.rows[0].number, original.rows.at(-1).number],
      updatedNumbers: [updated.rows.length, updated.rows[0].number, updated.rows.at(-1).number],
      trims: [updated.rows[0].trimmed, updated.rows.at(-1).trimmed],
    };
  });
  expect(overlap).toEqual({ originalNumbers: [1000, 1, 1000], updatedNumbers: [1000, 2, 1001], trims: ['best', 'worst'] });
  const newCatalogs = [...files.values()].filter(file => file.appProperties.cuberplusCatalog && !previousCatalogs.has(file.id));
  expect(newCatalogs.map(file => Object.keys(file.data.solves).length)).toEqual([1000, 1]);
  expect(JSON.stringify(newCatalogs)).not.toMatch(/PRIVATE|overlap-|123456|654321/);
  await page.goto(`${base}/options/`);
  const sharedOptions = page.getByRole('button', { name: 'Cloud backup', exact: true });
  if (await sharedOptions.getAttribute('aria-expanded') === 'false') await sharedOptions.click();
  await page.getByRole('button', { name: 'Manage Google Drive shared solves' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete all shared data', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'No published snapshots' })).toBeVisible();
  expect(files.size).toBe(0);
  expect(anonymousReads.length).toBeGreaterThanOrEqual(5);
  expect(errors).toEqual([]);
  console.log('Nov 24 Parts 1/2: overlapping ao1000 shares store 1001 solves; immutable results, replay controls, anonymous reads, cleanup, mobile dots and explicit drill start passed.');
} catch (failure) {
  console.error(JSON.stringify({ errors, dialogs: await page.locator('dialog[open]').allTextContents(),
    files: [...files.values()].map(({ id, public: isPublic, data }) => ({ id, public: isPublic, format: data?.format })) }));
  throw failure;
} finally {
  await owner.close(); await recipient.close(); await browser.close();
}
