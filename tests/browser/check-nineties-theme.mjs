import { chromium, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem('theme', '90s'));
const page = await context.newPage(), errors = [], report = [];
page.on('pageerror', error => errors.push(error.message));
const corners = 'button:not(.btn-close), input:not([type="radio"]), select, textarea, dialog, .card, .panel, .tool-card, .coming-soon-card, .coming-soon-icon, .tool-features li, .settings-panel, .worksheet-panel, .alert, .database-finder, .analysis-demo, .practice-card, .filter-card';
async function checkPage(route, tool) {
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
  const root = page.locator(`.site-page--${tool}`);
  await expect(root.locator('main h1').first()).toBeVisible({ timeout: 60000 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', '90s');
  await expect(page.locator('body')).toHaveCSS('font-family', /Times New Roman/);
  if (tool === 'smartcubeanalyzer') await expect(root.locator('canvas').first()).toBeVisible({ timeout: 120000 });
  if (tool === 'scrambler') await expect(root.locator('.worksheet tbody tr').first()).toBeAttached({ timeout: 120000 });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const rounded = await root.locator(corners).evaluateAll(elements => elements.filter(element => element.getClientRects().length &&
      getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).borderTopLeftRadius !== '0px')
      .map(element => `${element.tagName}.${element.className}: ${getComputedStyle(element).borderTopLeftRadius}`));
    expect(rounded, `${tool} rounded controls at ${width}px`).toEqual([]);
    const overflow = await root.locator('*').evaluateAll(elements => elements.filter(element => element.getClientRects().length &&
      getComputedStyle(element).visibility !== 'hidden' && element.getBoundingClientRect().right > innerWidth + 1 &&
      !element.closest('.table-responsive, [role="grid"], .offcanvas:not(.show)'))
      .slice(0, 15).map(element => `${element.tagName}.${element.className}: ${Math.round(element.getBoundingClientRect().right)}`));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `${tool} overflow at ${width}px: ${overflow.join(', ')}` }).toBe(true);
    report.push({ tool, width, rounded });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const info = root.locator('.info-tip:visible').first();
  if (await info.count()) {
    await expect(info).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(info).toHaveCSS('border-top-width', '0px');
    await info.scrollIntoViewIfNeeded();
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await info.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator('.tooltip-inner')).toHaveCSS('background-color', 'rgb(255, 255, 225)');
    await expect(tooltip.locator('.tooltip-inner')).toHaveCSS('color', 'rgb(0, 0, 0)');
    await expect(tooltip.locator('.tooltip-inner')).toHaveCSS('border-radius', '0px');
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height);
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
  }
  if (process.env.UX_SCREENSHOT_DIR && !['timer', 'smartcubeanalyzer', 'scrambler'].includes(tool))
    await page.screenshot({ path: join(process.env.UX_SCREENSHOT_DIR, `90s-${tool}.png`), animations: 'disabled', fullPage: tool === 'options' });
  return root;
}
async function pressed(button) {
  await button.click();
  await page.mouse.move(0, 0);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveCSS('border-top-style', 'inset');
  await expect(button).toHaveCSS('background-color', 'rgb(0, 0, 128)');
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
}
try {
  const options = await checkPage('/options/', 'options');
  await options.getByLabel('Import solve CSV files').setInputFiles({
    name: 'theme-solves.csv', mimeType: 'text/csv',
    buffer: Buffer.from(readFileSync(join('smartcubeanalyzer', 'public', 'demo', 'cfop-small.csv'), 'utf8').split(/\r?\n/).slice(0, 4).join('\n')),
  });
  await expect(options.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText('Imported 3 solves', { timeout: 120000 });
  await checkPage('/', 'home');
  const timer = await checkPage('/timer/', 'timer');
  await expect(timer.locator('.timer-onboarding')).toHaveCSS('background-color', 'rgb(232, 232, 232)');
  await expect(timer.locator('.timer-onboarding')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await timer.getByRole('link', { name: 'Options', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Show all sessions', exact: true }).check();
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  const history = timer.getByRole('table', { name: 'Solve history' });
  await expect(history.getByRole('columnheader')).toHaveText(['Solve', 'Time', 'Turns', 'TPS', 'Date']);
  await expect(history.locator('tbody time')).toHaveCount(3);
  await expect(history.locator('tbody time').first()).toContainText(/ago|now/);
  await history.locator('tbody time').first().click();
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible();
  await expect(replay).toHaveCSS('border-radius', '0px');
  await replay.getByText('Solution moves', { exact: true }).click();
  const phase = replay.locator('h3 .replay-case-link').first();
  await expect(phase).toBeVisible();
  await phase.click();
  await expect(page.locator('dialog.case-dialog')).toBeVisible();
  await expect(page.locator('dialog.case-dialog .database-case')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close algorithm case' }).click();
  await expect(phase).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(replay).toHaveCount(0);
  const analyzer = await checkPage('/analyzer/', 'smartcubeanalyzer');
  for (const name of ['Technique', 'Progress', 'Overview'])
    await pressed(analyzer.getByRole('navigation', { name: 'Analysis views' }).getByRole('button', { name, exact: true }));
  await pressed(analyzer.getByRole('button', { name: 'OLL', exact: true }));
  await pressed(analyzer.getByRole('button', { name: 'Full', exact: true }));
  await analyzer.getByRole('button', { name: 'Data', exact: true }).click();
  await expect(analyzer.locator('.dropdown-menu.show')).toHaveCSS('border-radius', '0px');
  await page.keyboard.press('Escape');
  await analyzer.getByRole('button', { name: /^Open filters/ }).click();
  const filters = page.getByRole('dialog', { name: 'Filters', exact: true });
  await expect(filters.locator('.method-select__control')).toHaveCSS('border-radius', '0px');
  await filters.getByRole('button', { name: 'Close', exact: true }).click();
  const trainer = await checkPage('/trainer/', 'trainer');
  for (const kind of ['OLL', 'PLL']) {
    await trainer.getByRole('button', { name: new RegExp(`${kind} Blitz`) }).click();
    await expect(trainer.getByRole('region', { name: `${kind} Blitz drill`, exact: true })).toBeVisible();
    await trainer.locator('.info-tip:visible').first().hover();
    await expect(page.getByRole('tooltip').locator('.tooltip-inner')).toHaveCSS('background-color', 'rgb(255, 255, 225)');
    await page.keyboard.press('Escape');
    await trainer.getByRole('button', { name: 'Back to drills', exact: true }).click();
  }
  const database = await checkPage('/database/', 'database');
  for (const name of ['OLL', 'PLL', 'F2L'])
    await pressed(database.getByRole('navigation', { name: 'Algorithm categories' }).getByRole('button', { name, exact: true }));
  await checkPage('/scrambler/', 'scrambler');
  await page.goto(`${base}/options/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('body')).not.toHaveCSS('font-family', /Times New Roman/);
  await expect(page.locator('.options-page .card')).toHaveCSS('border-radius', '16px');
  expect(errors).toEqual([]);
  if (process.env.UX_SCREENSHOT_DIR) writeFileSync(join(process.env.UX_SCREENSHOT_DIR, '90s-review.json'), JSON.stringify(report, null, 2));
  console.log('90s theme: all seven pages passed at 1440, 390 and 320px; tooltips, pressed states, case links and relative dates passed.');
} finally { await browser.close(); }
