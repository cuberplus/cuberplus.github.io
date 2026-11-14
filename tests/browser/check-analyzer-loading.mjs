import { chromium, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('timer-all-session-history', 'true');
    window.analyzerReads = 0;
    window.historyReads = 0;
    const WorkerClass = window.Worker, getAll = IDBObjectStore.prototype.getAll;
    window.Worker = class extends WorkerClass {
      postMessage(task, ...args) {
        if (task?.type === 'parse' || task?.type === 'local') window.analyzerReads++;
        return super.postMessage(task, ...args);
      }
    };
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'solves') window.historyReads++;
      return getAll.apply(this, args);
    };
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/analyzer/`);
  await expect(page.getByRole('button', { name: 'Data', exact: true })).toBeEnabled({ timeout: 120000 });
  await page.getByRole('button', { name: 'PLL', exact: true }).click();
  await page.getByRole('button', { name: 'Cases', exact: true }).click();
  await expect(page.locator('.algo-case-link').first()).toBeVisible({ timeout: 60000 });
  // One local read and one demo parse, without a session synchronization reload.
  expect(await page.evaluate(() => window.analyzerReads)).toBe(2);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const phase of ['PLL', 'F2L', 'OLL']) {
      await page.getByRole('button', { name: phase, exact: true }).click();
      await expect(page.locator('[role="gridcell"].algo-case-cell').first()).toBeVisible({ timeout: 60000 });
      for (const end of [false, true]) {
        await page.getByRole('grid').evaluate((grid, end) => { grid.scrollTop = end ? grid.scrollHeight : 0; }, end);
        await expect.poll(() => page.locator('.algo-case-cell').evaluateAll(cells => cells.filter(cell =>
          cell.scrollWidth > cell.clientWidth + 1 || [...cell.querySelectorAll('button')].some(button => button.scrollWidth > button.clientWidth + 1)
        ).map(cell => cell.textContent))).toEqual([]);
      }
      await expect(page.locator('.algo-case-cell').first()).toHaveCSS('padding-inline-start', '4px');
    }
  }
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.analyzerReads)).toBe(2);
  await page.goto(`${base}/options/`);
  const [header, ...rows] = readFileSync(join('smartcubeanalyzer', 'public', 'demo', 'acubemy.csv'), 'utf8').split(/\r?\n/).slice(0, 33);
  const csv = header + '\n' + Array.from({ length: 600 }, (_, i) => rows[i % rows.length].replace(/^[^,]*/, `browser-${i}`)).join('\n');
  await page.getByLabel('Import solve CSV files').setInputFiles({ name: 'acubemy.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  const progress = page.getByRole('dialog', { name: 'Importing solves', exact: true });
  await expect(progress).toBeVisible();
  await expect(progress.getByLabel('Import progress')).toBeVisible();
  await expect(progress.getByRole('status')).toContainText(/Reading CSV|\/ 600 solves|Saving imported/);
  await expect(progress).toBeHidden({ timeout: 120000 });
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText('Imported 600 solves; skipped 0 duplicates.');
  const saved = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, read = db.transaction('solves').objectStore('solves').getAll();
      read.onsuccess = () => { db.close(); resolve(read.result.find(solve => solve.moves.length && solve.status === 'complete')); };
      read.onerror = () => { db.close(); reject(read.error); };
    };
  }));
  expect(saved).toBeTruthy();
  await page.goto(`${base}/analyzer/`);
  await expect(page.getByRole('button', { name: 'Data', exact: true })).toBeEnabled({ timeout: 120000 });
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  const link = page.getByRole('grid').last().getByRole('gridcell').filter({ hasText: /^\d/ }).first();
  await expect(link).toBeVisible({ timeout: 60000 });
  const reads = await page.evaluate(() => window.historyReads);
  await link.click();
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay.locator('.replay-header')).toBeVisible();
  expect(await page.evaluate(() => window.historyReads)).toBe(reads);
  await expect(replay.getByLabel('Solve mistakes')).toHaveCount(0);
  await replay.getByText('Insights', { exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.historyReads)).toBeGreaterThan(reads);
  await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  expect(errors).toEqual([]);
  console.log('Analyzer loading, import progress, deferred replay history, and mobile case columns passed.');
} finally {
  await browser.close();
}
