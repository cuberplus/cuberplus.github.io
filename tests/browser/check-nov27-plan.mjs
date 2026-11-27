import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5182';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  const snapshots = await page.evaluate(async () => {
    const [{ parseCsv }, { loadCube }, { previewSolve }, { saveSolves }, { singleSnapshot }] = await Promise.all([
      import('/smartcubeanalyzer/src/Data/CsvParser.ts'), import('/timer/src/Core/puzzle.ts'),
      import('/timer/src/Data/csvImport.ts'), import('/timer/src/Data/storage.ts'), import('/src/sharing/snapshot.ts'),
    ]);
    const cube = await loadCube(), csv = await (await fetch('/analyzer/demo/cfop-small.csv')).text();
    const candidate = parseCsv(csv, ',', true).find(solve => !solve.dnf && !solve.isCorrupt && solve.time > 12 && solve.time < 20 &&
      solve.steps.filter(step => step.name).length === 7 && solve.steps.every(step => !step.name || step.time > .2));
    if (!candidate) throw new Error('No representative CFOP fixture found.');
    const solve = previewSolve({ ...candidate, steps: candidate.steps.filter(step => step.name) }, cube);
    solve.id = 'nov27-owned';
    await saveSolves([solve]);
    const single = await singleSnapshot(solve);
    return { single, average: { ...single, kind: 'average' }, collection: { ...single, kind: 'collection' } };
  });
  await context.route('https://www.googleapis.com/drive/v3/files/**', route =>
    route.fulfill({ json: snapshots[new URL(route.request().url()).pathname.split('/').at(-1)] }));
  await page.goto(`${base}/timer/?solve=nov27-owned`);
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible({ timeout: 60000 });
  await expect(replay.getByRole('button', { name: 'Share', exact: true })).toHaveCount(1);
  for (const kind of ['single', 'average', 'collection']) {
    await page.goto(`${base}/share/?id=${kind}`);
    if (kind !== 'single') {
      const table = page.getByRole('table', { name: kind === 'collection' ? 'Selected solves' : 'Average solves' });
      await expect(table).toBeVisible();
      await table.getByRole('button', { name: /Solve 1: \d+ turns, open replay/ }).click();
    }
    await expect(replay).toBeVisible({ timeout: 60000 });
    await expect(replay.getByRole('button', { name: 'Share', exact: true })).toHaveCount(0);
    await expect(replay.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
    await expect(replay.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await replay.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    if (process.env.NOV27_SCREENSHOTS && kind === 'single') {
      mkdirSync(process.env.NOV27_SCREENSHOTS, { recursive: true });
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await replay.locator('.replay-recording').scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(process.env.NOV27_SCREENSHOTS, 'received-solve-mobile.png') });
    }
  }
  expect(errors).toEqual([]);
  console.log('Nov 27 browser regressions passed: own solves remain shareable; received singles, averages and collections cannot be re-shared; responsive replay preserved.');
} finally { await browser.close(); }
