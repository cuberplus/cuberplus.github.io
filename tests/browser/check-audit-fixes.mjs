import { chromium, expect } from '@playwright/test';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4177';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
const page = await context.newPage(), errors = [], logs = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.text().startsWith('[Analyzer]')) logs.push(message.text()); });
const active = tool => page.locator(`.site-page--${tool}`);
async function visit(tool, name) {
  await page.getByRole('navigation', { name: 'CuberPlus' }).getByRole('link', { name, exact: true }).click();
  await expect(active(tool)).toBeVisible();
  await expect(active(tool).locator('main h1').first()).toBeFocused();
}
async function mobile(tool) {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    if (tool === 'analyzer') {
      expect(await page.locator('canvas').first().evaluate(canvas => canvas.closest('.card').getBoundingClientRect().top)).toBeLessThan(400);
      const grid = page.getByRole('region', { name: 'Current Records', exact: true }).getByRole('grid');
      await grid.scrollIntoViewIfNeeded();
      await expect(grid.getByRole('columnheader').first()).toBeVisible();
      if (process.env.UX_SCREENSHOT_DIR) await grid.screenshot({ path: join(process.env.UX_SCREENSHOT_DIR, `fixes-records-${width}.png`) });
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (tool === 'database') {
      const categories = await page.getByRole('navigation', { name: 'Algorithm categories' }).boundingBox();
      const count = await page.locator('.database-finder [aria-live="polite"]').boundingBox();
      expect(count.x).toBeGreaterThanOrEqual(categories.x + categories.width);
      expect(Math.abs(count.y + count.height / 2 - categories.y - categories.height / 2)).toBeLessThan(2);
    }
    if (tool === 'timer') {
      await expect(page.locator('#timer-history')).toHaveJSProperty('tagName', 'SECTION');
      await expect(page.locator('#timer-history summary')).toHaveCount(0);
      await expect(page.getByRole('table', { name: 'Solve history' })).toBeVisible();
    }
    if (process.env.UX_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.UX_SCREENSHOT_DIR, `fixes-${tool}-${width}.png`), animations: 'disabled', fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
try {
  await page.goto(`${base}/options/`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Import solve CSV files').setInputFiles(join('smartcubeanalyzer', 'public', 'demo', 'cfop-small.csv'));
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText('Imported', { timeout: 120000 });
  await visit('smartcubeanalyzer', 'Smartcube Analyzer');
  await expect(page).toHaveURL(`${base}/analyzer/`);
  await expect(active('smartcubeanalyzer').locator('canvas').first()).toBeVisible({ timeout: 60000 });
  await expect.poll(() => logs.length).toBe(1);
  expect(logs[0]).toMatch(/Loaded in [\d.]+ ms \(Saved solves, 467 solves\)/);
  await expect(active('smartcubeanalyzer').locator('.dashboard section.card')).toHaveCount(4);
  await expect(active('smartcubeanalyzer').locator('.analyzer-controls')).toHaveCount(0);
  await expect(active('smartcubeanalyzer').locator('.analysis-summary')).not.toContainText(/CFOP|Window/);
  const data = page.getByRole('button', { name: 'Data', exact: true });
  await data.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'My saved solves', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(data).toBeFocused();
  await expect(page.getByRole('button', { name: /^View data:/ })).toHaveCount(0);
  const records = page.getByRole('region', { name: 'Current Records', exact: true });
  await records.locator('[role="grid"] [tabindex="0"]').first().focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(records.getByRole('gridcell', { name: 'Ao100', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open filters' }).click();
  const filters = page.getByRole('dialog', { name: 'Filters' });
  await expect(filters.getByRole('combobox', { name: 'Which Method?' })).toBeVisible();
  await filters.getByText('Cases and solve quality', { exact: true }).click();
  await expect(filters.getByRole('spinbutton', { name: 'Solve Times minimum' })).toBeVisible();
  await filters.getByRole('spinbutton', { name: 'Solve Times minimum' }).fill('10');
  await expect(active('smartcubeanalyzer').locator('.analysis-summary')).toContainText('Edit filters (1)');
  await filters.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await filters.getByRole('button', { name: 'Close', exact: true }).click();
  await mobile('analyzer');
  expect(logs).toHaveLength(1);
  await visit('timer', 'Timer');
  const timer = active('timer');
  await timer.getByRole('button', { name: 'Options', exact: true }).click();
  const picker = timer.getByRole('combobox', { name: 'Session', exact: true });
  await expect(picker).toBeEnabled();
  const sessions = await picker.locator('option').evaluateAll(options => options.map(option => option.value));
  const session = sessions.find(value => value !== 'Default' && !value.startsWith('__create__')) ?? 'Default';
  await picker.selectOption(session);
  await timer.getByRole('button', { name: 'Close options', exact: true }).click();
  const rows = timer.getByRole('table', { name: 'Solve history' }).locator('tbody tr');
  await expect(rows).toHaveCount(100);
  const first = await rows.first().innerText();
  await timer.getByRole('navigation', { name: 'Solve history pages' }).getByRole('button', { name: 'Next' }).click();
  await expect(rows).toHaveCount(100);
  expect(await rows.first().innerText()).not.toBe(first);
  await timer.getByRole('button', { name: 'Next', exact: true }).click();
  await timer.getByRole('button', { name: 'Next', exact: true }).click();
  await timer.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(rows).toHaveCount(67);
  await expect(timer.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await mobile('timer');
  await visit('trainer', 'Trainer');
  await expect(page.getByText('Choose an OLL or PLL drill', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /OLL Blitz/ }).click();
  await expect(page.getByRole('button', { name: 'Start Blitz', exact: true })).toBeDisabled();
  await expect(page.locator('#blitz-prerequisite')).toHaveText('Connect a smart cube above to start Blitz.');
  await mobile('trainer');
  await visit('database', 'Database');
  await page.getByRole('searchbox').fill('PLL-T');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toHaveAttribute('id', 'PLL-T');
  await page.getByRole('button', { name: 'Favorite PLL T algorithm 1', exact: true }).click();
  await page.getByRole('searchbox').fill('favorite PLL-T');
  await expect(page.locator('.database-algorithm')).toHaveCount(1);
  for (const query of ['J perm', 'PLL J', 'PLL-J']) {
    await page.getByRole('searchbox').fill(query);
    await expect(page.getByRole('article')).toHaveCount(2);
    expect(await page.getByRole('article').evaluateAll(cases => cases.map(entry => entry.id))).toEqual(['PLL-Ja', 'PLL-Jb']);
  }
  await mobile('database');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'OLL', exact: true }).click();
  await expect(page.locator('.database-group')).toHaveCount(1);
  await visit('scrambler', 'Scrambler');
  await expect(page.locator('.worksheet tbody tr').first()).toBeAttached({ timeout: 120000 });
  await page.setViewportSize({ width: 390, height: 900 });
  const practice = page.getByRole('article', { name: 'Practice scramble 1', exact: true });
  await expect(practice).toBeVisible();
  await expect(practice.locator('.solution')).toBeHidden();
  await practice.getByText('Reveal answer', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(practice.locator('.solution')).toBeVisible();
  await mobile('scrambler');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.worksheet')).toBeVisible();
  await expect(page.locator('.practice-cards')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.locator('.columns-menu > summary').click();
  for (const column of await page.locator('.columns-menu input[type="checkbox"]').all()) await column.uncheck();
  await expect(page.getByText('Choose a column above to display your worksheet.', { exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: /^Practice scramble / })).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const legacy of ['/smartcubeanalyzer/', '/smartcubeanalyzer', '/smartcubeanalyzer/index.html']) {
    await page.goto(`${base}${legacy}?source=legacy#records`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(`${base}/analyzer/?source=legacy#records`);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('link', { name: 'Smartcube Analyzer', exact: true })).toHaveAttribute('href', '/analyzer/');
  }
  expect(errors).toEqual([]);
  console.log('Audit fixes: keyboard, data, pagination, finding tools, mobile practice and printing passed.');
} finally {
  await context.close();
  await browser.close();
}
