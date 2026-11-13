import { chromium, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark');
});
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
async function screenshot(name) {
  if (process.env.UX_SCREENSHOT_DIR) {
    if (new URL(page.url()).pathname === '/timer/') await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.screenshot({ path: join(process.env.UX_SCREENSHOT_DIR, `${name}.png`), animations: 'disabled', fullPage: new URL(page.url()).pathname === '/options/' });
  }
}
async function noOverflow() {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function optionsSpacing() {
  const sections = page.locator('.options-page .card > .settings-section');
  await expect(sections).toHaveCount(4);
  const spacing = await sections.evaluateAll(sections => sections.map(section => {
    const style = getComputedStyle(section), heading = section.querySelector('h3');
    const headingStyle = getComputedStyle(heading);
    return {
      padding: [style.paddingTop, style.paddingBottom], margin: [style.marginTop, style.marginBottom],
      heading: [headingStyle.fontSize, headingStyle.marginTop, headingStyle.marginBottom],
      inset: heading.getBoundingClientRect().top - section.getBoundingClientRect().top - parseFloat(style.borderTopWidth),
    };
  }));
  for (const section of spacing) {
    expect(section.padding).toEqual(['24px', '24px']);
    expect(section.margin).toEqual(['0px', '0px']);
    expect(section.heading).toEqual(spacing[0].heading);
    expect(section.inset).toBeCloseTo(24, 0);
  }
  const general = sections.first();
  expect(await general.evaluate(section => [...section.children].every(child =>
    child.getBoundingClientRect().right <= section.getBoundingClientRect().right))).toBe(true);
}
async function mobile(check) {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await check();
    await noOverflow();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
try {
  await page.goto(`${base}/options/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '90s theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(192, 192, 192)');
  await expect(page.locator('body')).toHaveCSS('font-family', /Times New Roman/);
  await expect(page.locator('.options-page .card')).toHaveCSS('border-radius', '0px');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '90s theme', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await optionsSpacing();
  await screenshot('options-90s');
  await mobile(async () => {
    await expect(page.getByRole('button', { name: 'Next theme' })).toBeVisible();
    await optionsSpacing();
  });
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('body')).not.toHaveCSS('font-family', /Times New Roman/);
  const cubes = page.getByRole('region', { name: 'My cubes', exact: true });
  await expect(cubes.getByLabel('New cube name', { exact: true })).toBeHidden();
  await cubes.getByText('Add a cube', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await cubes.getByLabel('New cube name', { exact: true }).fill('Travel cube');
  await cubes.getByLabel('MAC (if required)', { exact: true }).fill('11:22:33:44:55:66');
  await cubes.getByRole('button', { name: 'Save cube', exact: true }).click();
  await expect(cubes.getByLabel('Name for Travel cube', { exact: true })).toBeHidden();
  await cubes.locator('.saved-cube > summary').click();
  await cubes.getByLabel('Name for Travel cube', { exact: true }).fill('Renamed cube');
  await expect(cubes.locator('.saved-cube > summary')).toHaveText('Renamed cube');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await cubes.locator('.saved-cube > summary').click();
  await expect(cubes.getByLabel('MAC for Renamed cube', { exact: true })).toHaveValue('11:22:33:44:55:66');
  await cubes.getByRole('button', { name: 'Forget Renamed cube', exact: true }).click();
  await expect(cubes.locator('.saved-cube')).toHaveCount(0);
  const cloud = page.getByRole('region', { name: /^Cloud backup/ });
  await expect(cloud.getByRole('button', { name: 'Restore backup', exact: true })).toBeHidden();
  await cloud.getByText('Restore and connection settings', { exact: true }).click();
  await expect(cloud.getByRole('button', { name: 'Restore backup', exact: true })).toBeDisabled();
  await expect(cloud.getByRole('checkbox', { name: 'Back up every 100 solves' })).toBeVisible();
  await mobile(async () => {
    await expect(cloud.getByRole('combobox', { name: 'Backup provider', exact: true })).toBeVisible();
    await optionsSpacing();
    await screenshot(`options-dark-${page.viewportSize().width}`);
  });
  await cloud.getByText('Restore and connection settings', { exact: true }).click();
  await screenshot('options-dark');
  await page.getByLabel('Import solve CSV files').setInputFiles({
    name: 'ux-solves.csv', mimeType: 'text/csv',
    buffer: Buffer.from(readFileSync(join('smartcubeanalyzer', 'public', 'demo', 'cfop-small.csv'), 'utf8').split(/\r?\n/).slice(0, 4).join('\n')),
  });
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText('Imported 3 solves', { timeout: 60000 });
  await page.goto(`${base}/timer/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Show all sessions', exact: true }).check();
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  const history = page.getByRole('table', { name: 'Solve history', exact: true });
  await expect(history.getByRole('columnheader')).toHaveText(['Solve', 'Time', 'Turns', 'TPS', 'Date']);
  await expect(history.getByRole('button', { name: 'View', exact: true })).toHaveCount(0);
  await history.getByRole('button', { name: 'Time', exact: true }).click();
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  let firstId;
  for (let column = 0; column < 6; column++) {
    const field = history.locator('tbody tr').first().locator('td button').nth(column);
    await expect(field).not.toHaveCSS('text-decoration-line', 'underline');
    await field.focus();
    await page.keyboard.press(column % 2 ? 'Space' : 'Enter');
    await expect(replay).toBeVisible({ timeout: 60000 });
    const id = await replay.getByLabel('Solve ID', { exact: true }).textContent();
    firstId ??= id;
    expect(id).toBe(firstId);
    await expect(replay.getByRole('heading', { name: 'Solve replay', exact: true })).toBeVisible();
    await expect(replay.locator('button.move').first()).toBeHidden();
    if (column === 0) {
      await screenshot('replay-dark');
      await mobile(async () => {
        expect(await replay.evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
        await expect(replay.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
      });
      await page.setViewportSize({ width: 320, height: 1000 });
      await screenshot('replay-dark-mobile');
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await page.keyboard.press('Escape');
    await expect(replay).toHaveCount(0);
    await expect(field).toBeFocused();
  }
  await mobile(async () => {
    const field = history.locator('tbody tr').first().locator('td button').first();
    await field.click();
    await expect(replay).toBeVisible();
    await page.keyboard.press('Escape');
  });
  await page.evaluate(() => localStorage.setItem('cuberplus-trainer-blitz-v1', JSON.stringify([
    { id: 'oll-best', kind: 'OLL', date: '2026-01-03T12:00:00Z', milliseconds: 3000, settings: { upcomingCases: true, caseNames: true, hidePLL: false, crossColor: 'Yellow', frontColor: 'Green' },
      splits: [{ caseId: '1', milliseconds: 1000, recognitionMilliseconds: 250, executionMilliseconds: 750, preAuf: 'U', postAuf: '' }, { caseId: '2', milliseconds: 2000, recognitionMilliseconds: 500, executionMilliseconds: 1500 }] },
    { id: 'oll-legacy', kind: 'OLL', date: '2026-01-02T12:00:00Z', milliseconds: 6000, splits: [{ caseId: '1', milliseconds: 6000 }] },
    { id: 'pll-best', kind: 'PLL', date: '2026-01-01T12:00:00Z', milliseconds: 5000, splits: [{ caseId: 'T', milliseconds: 5000 }] },
  ])));
  await page.goto(`${base}/trainer/`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.trainer-run')).toHaveCount(3);
  await expect(page.locator('.trainer-best')).toHaveCount(2);
  const run = page.locator('.trainer-run').first();
  await run.locator(':scope > summary').focus();
  await page.keyboard.press('Space');
  await expect(run).toHaveAttribute('open', '');
  await expect(run.getByRole('region', { name: 'OLL case splits', exact: true })).toHaveAttribute('tabindex', '0');
  await run.getByRole('button', { name: /^Split/ }).click();
  await expect(run.locator('tbody tr td:first-child')).toHaveText(['1', '2']);
  await run.getByRole('button', { name: /^Split/ }).click();
  await expect(run.locator('tbody tr td:first-child')).toHaveText(['2', '1']);
  await expect(run.getByText('Pre-AUF: U', { exact: true })).toBeHidden();
  await run.locator('.trainer-case-setup > summary').click();
  await expect(run.getByText('Pre-AUF: U', { exact: true })).toBeVisible();
  await screenshot('blitz-history-dark');
  await mobile(async () => {
    await expect(run.getByRole('region', { name: 'OLL case splits', exact: true })).toBeVisible();
  });
  await page.setViewportSize({ width: 320, height: 1000 });
  await screenshot('blitz-history-dark-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: /PLL Blitz/ }).click();
  await expect(page.locator('.trainer-run')).toHaveCount(1);
  await expect(page.locator('.trainer-run-kind')).toContainText('PLL Blitz');
  await page.goto(`${base}/database/`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Automatically find favorites', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Add your own algorithm', exact: true })).toBeHidden();
  await page.getByText('Algorithm tools', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Automatically find favorites', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Un-Favorite All', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add your own algorithm', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Algorithm', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close add algorithm', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Algorithm', exact: true })).toHaveCount(0);
  await mobile(async () => {
    await expect(page.getByRole('button', { name: 'Learn algorithms from solves', exact: true })).toBeVisible();
  });
  await screenshot('database-dark');
  expect(errors).toEqual([]);
  console.log('PASS 90s persistence, Options, every history field and keyboard focus, replay disclosures, Blitz summaries/sorting, Algorithm tools, and 320/390px layouts');
} finally {
  await context.close();
  await browser.close();
}
