import { chromium, expect } from '@playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
async function screenshot(name) {
  if (process.env.UPDATE_SCREENSHOTS) {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.screenshot({ path: join('src', 'Assets', `${name}.png`) });
  }
}
try {
  await page.goto(`${base}/scrambler/`);
  await expect(page.getByLabel('Move metric')).toHaveValue('QTM');
  await expect(page.getByLabel('Minimum turns')).toHaveValue('4');
  await expect(page.getByLabel('Maximum turns')).toHaveValue('8');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('button', { name: /Generate worksheet/ })).toBeEnabled({ timeout: 240000 });
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await screenshot('Scrambler');
  await page.goto(`${base}/timer/`);
  await expect(page.getByText('Try simulated cube', { exact: true })).toBeEnabled({ timeout: 60000 });
  await page.getByText('Try simulated cube', { exact: true }).evaluate(button => button.click());
  const guided = page.getByRole('button', { name: 'Perform guided move', exact: true });
  const simulate = page.getByRole('button', { name: 'Simulate solve', exact: true });
  await expect(guided).toBeEnabled({ timeout: 60000 });
  for (let i = 0; i < 100 && !await simulate.isEnabled(); i++) await guided.click();
  await simulate.click();
  const latest = page.getByRole('button', { name: 'View most recent solve', exact: true });
  await expect(latest).toBeVisible({ timeout: 60000 });
  await latest.click();
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible();
  await expect(replay.locator('.replay-scramble').getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(replay.getByLabel('Solve date', { exact: true })).toBeVisible();
  await replay.getByText('Recording details', { exact: true }).click();
  await expect(replay.getByLabel('Solve source', { exact: true })).toHaveText('CuberPlus');
  const closeSize = await replay.getByRole('button', { name: 'Close replay' }).evaluate(button => {
    const style = getComputedStyle(button), box = button.getBoundingClientRect();
    return [box.width, box.height, style.backgroundSize];
  });
  expect(closeSize).toEqual([32, 32, '16px 16px']);
  await expect(replay.locator('input[type=range]')).toHaveCount(0);
  const penalty = replay.getByRole('button', { name: '+2', exact: true });
  await penalty.click(); await expect(penalty).toHaveAttribute('aria-pressed', 'true');
  await penalty.click(); await expect(penalty).toHaveAttribute('aria-pressed', 'false');
  const dnf = replay.getByRole('button', { name: 'DNF', exact: true });
  await dnf.click(); await expect(dnf).toHaveAttribute('aria-pressed', 'true');
  await dnf.click(); await expect(dnf).toHaveAttribute('aria-pressed', 'false');
  await replay.getByRole('slider').press('End');
  expect(Number(await replay.getByRole('slider').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  await replay.getByRole('slider').press('Home');
  await expect(replay.getByRole('slider')).toHaveAttribute('aria-valuenow', '0');
  await replay.getByText('Solution moves', { exact: true }).click();
  const caseButton = replay.locator('button[aria-label$=" case"]').first();
  if (await caseButton.count()) {
    await caseButton.click();
    const modal = page.locator('dialog.case-dialog');
    await expect(modal.locator('.database-case')).toHaveCount(1);
    await page.evaluate(() => document.documentElement.dataset.theme = 'aurora');
    await expect(modal.locator('.cuberplus-page')).toHaveCSS('background-image', 'none');
    await expect(modal.locator('.database-group > summary')).toBeHidden();
    expect(await modal.getByRole('button', { name: 'Close algorithm case' }).evaluate(button => {
      const style = getComputedStyle(button), box = button.getBoundingClientRect();
      return [box.width, box.height, style.backgroundSize];
    })).toEqual(closeSize);
    await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
    await modal.getByRole('button', { name: 'Close algorithm case' }).click();
    await expect(replay).toBeVisible();
  }
  await replay.getByRole('button', { name: 'Close replay' }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Extra-turn +2 penalty', exact: true })).not.toBeChecked();
  const favorites = page.locator('summary').filter({ hasText: 'Mark non-favorite algs as mistakes' });
  await expect(favorites.getByRole('button')).toBeVisible();
  expect(await favorites.evaluate(element => element.parentElement.open)).toBe(false);
  await favorites.locator('input').check();
  expect(await favorites.evaluate(element => element.parentElement.open)).toBe(false);
  await favorites.getByRole('button').click();
  expect(await favorites.evaluate(element => element.parentElement.open)).toBe(false);
  await favorites.locator('span#favorite-mistakes-title').click();
  expect(await favorites.evaluate(element => element.parentElement.open)).toBe(true);
  const summary = page.locator('summary').filter({ hasText: 'Hide distracting visuals' });
  await expect(summary.getByRole('button')).toBeVisible();
  await summary.getByRole('button').focus();
  await expect(page.locator('#hide-visuals-help')).toContainText('Choose which visuals to hide while solving.');
  await summary.getByRole('button').click();
  expect(await summary.evaluate(element => element.parentElement.open)).toBe(false);
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.goto(`${base}/options/`);
  const files = [
    { name: 'cubeast.csv', mimeType: 'text/csv', buffer: Buffer.from('id,date,dnf,time,solving_method\nsame,2026-01-01 00:00:00 UTC,false,12000,CFOP') },
    { name: 'acubemy.csv', mimeType: 'text/csv', buffer: Buffer.from('solve_id,date,total_time,analysis_type\nsame,2026-01-02T00:00:00Z,14000,CFOP') },
  ];
  await page.getByLabel('Import solve CSV files').setInputFiles(files);
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText('Imported 2 solves; skipped 0 duplicates.');
  await page.getByLabel('Import solve CSV files').setInputFiles(files);
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText('Imported 0 solves; skipped 2 duplicates.');
  await page.getByLabel('Import solve CSV files').setInputFiles(['cfop-small.csv', 'acubemy.csv'].map(name => ({
    name, mimeType: 'text/csv',
    buffer: Buffer.from(readFileSync(join('smartcubeanalyzer', 'public', 'demo', name), 'utf8').split(/\r?\n/).slice(0, 33).join('\n')),
  })));
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText(/Imported \d+ solves; skipped \d+ duplicates./, { timeout: 60000 });
  const recordings = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, read = db.transaction('solves').objectStore('solves').getAll();
      read.onerror = () => { db.close(); reject(read.error); };
      read.onsuccess = () => { db.close(); resolve(read.result.filter(solve => solve.imported && solve.moves.length).map(solve => ({ id: solve.id, source: solve.imported.source }))); };
    };
  }));
  for (const source of ['cubeast', 'acubemy']) {
    const solve = recordings.find(solve => solve.source === source);
    expect(solve).toBeDefined();
    await page.goto(`${base}/timer/?solve=${encodeURIComponent(solve.id)}`);
    await expect(replay).toBeVisible({ timeout: 60000 });
    await expect(replay.getByRole('img', { name: 'Live 3x3 cube state' })).toBeVisible();
    await replay.getByText('Recording details', { exact: true }).click();
    await expect(replay.getByLabel('Solve source', { exact: true })).toContainText(source === 'cubeast' ? 'Cubeast (imported)' : 'Acubemy (imported)');
    await replay.getByText('Solution moves', { exact: true }).click();
    await expect(replay.locator('button.move').first()).toBeVisible();
    await replay.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(async () => {
      expect(await replay.locator('.solve-trail .trail-tip').evaluate(tip => parseFloat(tip.style.left))).toBeGreaterThan(0);
    }).toPass();
    await replay.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await replay.locator('.solve-trail .trail-tip').evaluate(tip => tip.style.left);
    await page.waitForTimeout(100);
    expect(await replay.locator('.solve-trail .trail-tip').evaluate(tip => tip.style.left)).toBe(paused);
    await replay.getByRole('slider').press('End');
    const end = Number(await replay.getByRole('slider').getAttribute('aria-valuenow'));
    expect(end).toBeGreaterThan(0);
    await replay.getByRole('slider').press('Home');
    await expect(replay.getByRole('slider')).toHaveAttribute('aria-valuenow', '0');
    await replay.locator('button.move').last().click();
    await expect(replay.getByRole('slider')).toHaveAttribute('aria-valuenow', String(end));
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await replay.evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
      await expect(replay.locator('.replay-scramble').getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await replay.getByRole('button', { name: 'Close replay' }).click();
    await expect(page.getByRole('table', { name: 'Solve history' }).getByRole('columnheader')).toHaveText(['Solve', 'Time', 'Turns', 'TPS', 'Date']);
  }
  await page.goto(`${base}/analyzer/`);
  await expect(page.getByRole('button', { name: 'Data', exact: true })).toBeEnabled({ timeout: 60000 });
  await expect(page.locator('canvas').first()).toBeVisible();
  const fastest = page.locator('.clickable-grid');
  await expect(fastest.getByRole('columnheader').nth(0)).toContainText('Time');
  await expect(fastest.getByRole('columnheader').nth(1)).toContainText('Full Step');
  await expect(fastest.getByRole('columnheader')).toHaveCount(4);
  for (const header of await fastest.getByRole('columnheader').all()) {
    await header.click(); await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await header.click(); await expect(header).toHaveAttribute('aria-sort', 'descending');
  }
  await page.goto(`${base}/database/#PLL-T`);
  const favorite = page.getByRole('button', { name: 'Favorite PLL T algorithm 1', exact: true });
  await favorite.click();
  await page.getByText('Algorithm tools', { exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Un-Favorite All', exact: true }).click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await screenshot('Database');
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('solves', 'readwrite'), store = tx.objectStore('solves'), read = store.getAll();
      read.onsuccess = () => {
        const original = read.result.find(solve => !solve.imported && solve.moves.length > 1);
        if (!original) { tx.abort(); return; }
        store.put({ ...original, id: 'continuous-cursor', duration: 10000, timingBasis: 'host',
          moves: original.moves.map((move, index) => {
            const elapsed = index ? 5000 + index / (original.moves.length - 1) * 5000 : 0;
            return { ...move, elapsed, hostTime: elapsed, localTimestamp: null, cubeTimestamp: null };
          }) });
        const burst = Math.min(8, original.moves.length - 1);
        store.put({ ...original, id: 'dense-animation', duration: 10000, timingBasis: 'host',
          moves: original.moves.map((move, index) => {
            const elapsed = index < burst ? 0 : 10000;
            return { ...move, elapsed, hostTime: elapsed, localTimestamp: null, cubeTimestamp: null };
          }) });
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error ?? new Error('No native recording for cursor regression.')); };
    };
  }));
  await page.goto(`${base}/timer/?solve=continuous-cursor`);
  await expect(replay).toBeVisible();
  await replay.getByRole('button', { name: 'Play', exact: true }).click();
  const tip = replay.locator('.solve-trail .trail-tip');
  const samples = await tip.evaluate(async tip => {
    const samples = [];
    for (let frame = 0; frame < 20; frame++) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const trail = tip.parentElement.getBoundingClientRect(), box = tip.getBoundingClientRect();
      const expected = parseFloat(tip.style.left) / 100 * trail.width;
      samples.push({ expected, painted: box.left + box.width / 2 - trail.left,
        visible: document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2) === tip });
    }
    return samples;
  });
  expect(samples.at(-1).expected - samples[0].expected).toBeGreaterThan(5);
  for (const sample of samples) {
    expect(Math.abs(sample.painted - sample.expected)).toBeLessThan(1);
    expect(sample.visible).toBe(true);
  }
  await expect(replay.getByRole('slider')).toHaveAttribute('aria-valuenow', '1');
  await replay.getByRole('button', { name: 'Pause', exact: true }).click();
  const pausedCursor = await tip.evaluate(tip => tip.getBoundingClientRect().left);
  await page.waitForTimeout(100);
  expect(await tip.evaluate(tip => tip.getBoundingClientRect().left)).toBe(pausedCursor);
  await page.goto(`${base}/timer/?solve=dense-animation`);
  await expect(replay).toBeVisible();
  const player = replay.locator('twisty-player');
  await player.evaluate(player => {
    player.replaySamples = [];
    const request = player.experimentalModel.timestampRequest, set = request.set.bind(request);
    request.set = value => {
      if (typeof value === 'number') player.replaySamples.push(value);
      return set(value);
    };
  });
  await replay.getByRole('slider').press('End');
  const moveCount = Number(await replay.getByRole('slider').getAttribute('aria-valuenow'));
  await replay.getByRole('slider').press('Home');
  await expect.poll(() => player.evaluate(player => player.experimentalModel.timestampRequest.get())).toBe(0);
  await replay.getByRole('combobox', { name: 'Replay speed' }).selectOption('4');
  await player.evaluate(player => { player.replaySamples = []; });
  await replay.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(replay.getByRole('button', { name: 'Play', exact: true })).toBeVisible({ timeout: 10000 });
  await expect.poll(() => player.evaluate(player => player.experimentalModel.timestampRequest.get()), { timeout: 10000 }).toBe(moveCount * 1000);
  const rendered = await player.evaluate(player => player.replaySamples.filter((value, index, values) => !index || value !== values[index - 1]));
  expect(rendered.some(value => value > 0 && value < 1000)).toBe(true);
  for (let i = 1; i < rendered.length; i++) {
    expect(rendered[i] - rendered[i - 1]).toBeGreaterThan(0);
    expect(rendered[i] - rendered[i - 1]).toBeLessThan(1000);
  }
  await player.evaluate(player => { player.replaySamples = []; });
  await replay.getByRole('slider').press('Home');
  await expect.poll(() => player.evaluate(player => player.experimentalModel.timestampRequest.get())).toBe(0);
  expect(await player.evaluate(player => player.replaySamples[0])).toBe(0);
  expect(errors).toEqual([]);
  console.log('Solve workflows passed.');
} finally {
  await context.close();
  await browser.close();
}
