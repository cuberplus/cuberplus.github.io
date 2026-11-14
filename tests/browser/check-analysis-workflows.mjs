import { chromium, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext();
await context.addInitScript(() => {
  localStorage.setItem('theme', 'dark');
  localStorage.setItem('timer-all-session-history', 'true');
});
const page = await context.newPage(), errors = [], timings = {};
page.on('pageerror', error => errors.push(error.message));
try {
  const start = performance.now();
  await page.goto(`${base}/analyzer/`);
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Options', exact: true })).toBeVisible();
  timings['Navigate during analyzer loading'] = Math.round(performance.now() - start);
  await page.getByRole('link', { name: 'Smartcube Analyzer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Data', exact: true })).toBeEnabled({ timeout: 120000 });
  await expect(page.locator('canvas').first()).toBeVisible();
  timings['Initial full-data analyzer load including navigation'] = Math.round(performance.now() - start);
  console.log('Initial analyzer loaded:', timings);
  const records = page.getByRole('region', { name: 'Current Records', exact: true });
  await records.scrollIntoViewIfNeeded();
  await expect(records.getByRole('columnheader').first()).toBeVisible();
  const headers = await records.getByRole('columnheader').evaluateAll(nodes => nodes.map(node => {
    const { x, y, width, height } = node.getBoundingClientRect();
    return { x, y, width, height };
  }));
  expect(headers.length).toBeGreaterThan(1);
  expect(headers.every(header => header.width > 20 && header.height > 16 && Math.abs(header.y - headers[0].y) < 1)).toBe(true);
  expect(headers.slice(1).every((header, index) => header.x >= headers[index].x + headers[index].width - 1)).toBe(true);
  await page.getByRole('button', { name: 'F2L', exact: true }).click();
  await page.getByRole('button', { name: 'Cases', exact: true }).click();
  const caseButton = page.locator('.algo-case-link').first();
  await expect(caseButton).toBeVisible({ timeout: 30000 });
  await expect(caseButton.locator('img,svg')).toHaveCount(1);
  await caseButton.click();
  await expect(page.locator('dialog.case-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close algorithm case' }).click();
  console.log('F2L case images and modal passed.');
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  const bytes = readFileSync(join('smartcubeanalyzer', 'public', 'demo', 'demo-solves.csv'));
  const input = page.getByLabel('Import solve CSV files');
  const status = page.locator('[aria-labelledby="import-heading"]').getByRole('status');
  for (const duplicate of [false, true]) {
    const began = performance.now();
    await input.setInputFiles({ name: 'full.csv', mimeType: 'text/csv', buffer: bytes });
    await expect(status).toContainText(duplicate ? 'Imported 0 solves; skipped 21793 duplicates.' : 'Imported 21793 solves; skipped 0 duplicates.', { timeout: 240000 });
    timings[duplicate ? 'Full duplicate import' : 'Full import'] = Math.round(performance.now() - began);
    console.log(duplicate ? 'Full duplicate import' : 'Full import', Math.round(performance.now() - began), 'ms');
  }
  await page.getByRole('link', { name: 'Smartcube Analyzer', exact: true }).click();
  await expect(page.getByText('21793 saved solves are not loaded.', { exact: false })).toBeVisible();
  await expect(page.locator('.algo-case-link').first()).toBeVisible();
  for (const label of ['First saved-data analysis', 'Cached saved-data analysis']) {
    const began = performance.now();
    await page.getByRole('button', { name: 'Data', exact: true }).click();
    await page.getByRole('button', { name: 'My saved solves', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Data', exact: true })).toBeEnabled({ timeout: 240000 });
    await expect(page.locator('canvas').first()).toBeVisible();
    timings[label] = Math.round(performance.now() - began);
    console.log(label, timings[label], 'ms');
  }
  expect(errors).toEqual([]);
  expect(timings['Full import']).toBeLessThan(20000);
  expect(timings['Full duplicate import']).toBeLessThan(15000);
  expect(timings['First saved-data analysis']).toBeLessThan(25000);
  expect(timings['Cached saved-data analysis']).toBeLessThan(15000);
  console.table(timings);
  console.log('Analysis workflows passed.');
} finally {
  await context.close();
  await browser.close();
}
