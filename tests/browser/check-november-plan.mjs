import { chromium, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4175';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
const general = async () => {
  const toggle = page.getByRole('button', { name: 'General', exact: true });
  if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
};
try {
  await page.goto(`${base}/options/`);
  await general();
  await expect(page.getByRole('checkbox', { name: 'Show minutes', exact: true })).toBeChecked();
  const normal = await page.locator('h1').boundingBox();
  await page.getByLabel('Font size', { exact: true }).selectOption('large');
  const large = await page.locator('h1').boundingBox();
  expect(large.height).toBeGreaterThan(normal.height * 1.15);
  await page.getByLabel('Font size', { exact: true }).selectOption('small');
  expect((await page.locator('h1').boundingBox()).height).toBeLessThan(normal.height * .85);
  await page.getByLabel('Font size', { exact: true }).selectOption('normal');
  expect((await page.locator('h1').boundingBox()).height).toBe(normal.height);
  await page.getByRole('button', { name: 'Mistakes', exact: true }).click();
  const choiceMistake = page.getByRole('checkbox', { name: 'F2L: Non-suggested pair', exact: true });
  await choiceMistake.uncheck();
  await page.reload();
  await page.getByRole('button', { name: 'Mistakes', exact: true }).click();
  await expect(choiceMistake).not.toBeChecked();
  await choiceMistake.check();
  await page.getByRole('button', { name: 'Import solves', exact: true }).click();
  await page.getByLabel('Import solve CSV files').setInputFiles([{
    name: 'smart-drill.csv', mimeType: 'text/csv',
    buffer: Buffer.from(readFileSync(join('smartcubeanalyzer', 'public', 'demo', 'cfop-small.csv'), 'utf8').split(/\r?\n/).slice(0, 65).join('\n')),
  }, {
    name: 'long-solve.csv', mimeType: 'text/csv',
    buffer: Buffer.from('id,date,dnf,time,solving_method\nminute-format,2026-11-23 12:00:00 UTC,false,65345,CFOP'),
  }]);
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText(/Imported \d+ solves/, { timeout: 60000 });
  await general();
  await page.getByRole('checkbox', { name: 'Show all sessions', exact: true }).check();
  await page.goto(`${base}/trainer/`);
  await page.getByRole('button', { name: 'Make your own drill' }).click();
  await page.getByRole('button', { name: 'Create smart drill', exact: true }).click();
  const smart = page.getByRole('form', { name: 'Smart drill', exact: true });
  await smart.getByLabel('Choose cases by', { exact: true }).selectOption('slowest');
  await smart.getByLabel('Cases per stage', { exact: true }).fill('1');
  await smart.getByRole('button', { name: 'Generate smart drill', exact: true }).click();
  await expect(page.getByLabel('Training name', { exact: true })).toHaveValue('Smart drill', { timeout: 60000 });
  const selected = await page.locator('.trainer-picker input:checked').evaluateAll(inputs => inputs.map(input => input.value));
  expect(selected).toHaveLength(3);
  expect(new Set(selected.map(key => key.split('-')[0]))).toEqual(new Set(['F2L', 'OLL', 'PLL']));
  await page.getByRole('button', { name: 'Save training', exact: true }).click();
  await expect(page.getByLabel('Saved training', { exact: true })).not.toHaveValue('');
  await page.goto(`${base}/timer/`);
  await expect(page.locator('.timer-recent')).toContainText('1:05.34');
  await page.goto(`${base}/options/`);
  await general();
  await page.getByRole('checkbox', { name: 'Show minutes', exact: true }).uncheck();
  await page.goto(`${base}/timer/`);
  await expect(page.locator('.timer-recent')).toContainText('65.34');
  await page.goto(`${base}/options/`);
  await general();
  await page.getByRole('checkbox', { name: 'Show minutes', exact: true }).check();
  await page.goto(`${base}/timer/`);
  await expect(page.getByText('Try simulated cube', { exact: true })).toBeEnabled({ timeout: 60000 });
  await page.getByText('Try simulated cube', { exact: true }).evaluate(button => button.click());
  const guided = page.getByRole('button', { name: 'Perform guided move', exact: true });
  const simulate = page.getByRole('button', { name: 'Simulate solve', exact: true });
  await expect(guided).toBeEnabled({ timeout: 60000 });
  for (let i = 0; i < 100 && !await simulate.isEnabled(); i++) await guided.click();
  await simulate.click();
  await page.getByRole('button', { name: /^View .+ streak solves$/ }).click();
  await expect(page.getByRole('table', { name: 'Selected solves', exact: true }).locator('tbody tr')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'Close solves', exact: true }).click();
  const setHighlight = async mode => {
    for (const name of ['Dismiss daily streak', 'Dismiss personal best']) {
      const dismiss = page.getByRole('button', { name, exact: true });
      while (await dismiss.count()) await dismiss.first().click();
    }
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    const options = page.locator('dialog.options-dialog[open]');
    await options.getByLabel('Replay highlight', { exact: true }).selectOption(mode);
    await options.getByRole('button', { name: 'Close options', exact: true }).click();
  };
  await setHighlight('current');
  await page.getByRole('button', { name: 'View most recent solve', exact: true }).click();
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay.getByLabel('Replay highlight', { exact: true })).toHaveCount(0);
  const highlighted = async () => replay.locator('twisty-player').evaluate(async player => {
    const object = await player.experimentalCurrentThreeJSPuzzleObject();
    return Object.values(object.pieces).flat().filter(piece => piece.children[0].scale.x > 1.01).length;
  });
  await expect.poll(highlighted).toBeGreaterThan(0);
  await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  await setHighlight('none');
  await page.getByRole('button', { name: 'View most recent solve', exact: true }).click();
  await expect.poll(highlighted).toBe(0);
  await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  await setHighlight('suggested');
  await page.getByRole('button', { name: 'View most recent solve', exact: true }).click();
  await replay.getByRole('slider').press('End');
  await expect.poll(highlighted).toBe(0);
  await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  await page.goto(`${base}/options/`);
  await general();
  await page.getByLabel('Font size', { exact: true }).selectOption('large');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
  expect(errors).toEqual([]);
  console.log('November plan settings, smart drill, and real 3D highlight checks passed.');
} finally { await context.close(); await browser.close(); }
