import { chromium, expect } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5180';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
const go = name => page.getByRole('link', { name: name === 'Analyzer' ? 'Smartcube Analyzer' : name, exact: true }).click();
const history = page.locator('[aria-label="Solve history"] tbody tr');
const best = page.getByRole('button', { name: 'View best Single', exact: true });
const summary = page.locator('.analysis-context strong');
async function selectSession(name) {
  await page.getByRole('combobox', { name: 'Session history', exact: true }).selectOption(name);
}
async function openFilters() {
  await page.getByRole('button', { name: /^Open filters/ }).click();
  return page.locator('.offcanvas.show').getByRole('group', { name: /^Which Sessions/ });
}
try {
  await page.goto(`${base}/timer/`);
  await page.evaluate(async () => {
    const [{ saveSolves }, { SOLVED }] = await Promise.all([import('/timer/src/Data/storage.ts'), import('/timer/src/Core/puzzle.ts')]);
    await saveSolves(Array.from({ length: 8 }, (_, i) => ({
      version: 1, id: `scope-${i}`, session: i < 3 ? 'Default' : 'Practice',
      createdAt: new Date(Date.UTC(2026, 9, i + 1)).toISOString(), device: 'Scope fixture',
      scramble: 'R', startFacelets: SOLVED, duration: i < 3 ? 1000 : 20000,
      status: 'complete', timingBasis: 'host', reason: '', moves: [],
    })));
    dispatchEvent(new Event('timer-solves-changed'));
  });
  await expect(history).toHaveCount(3);
  await expect(best).toHaveText('1.00');
  await selectSession('Practice');
  await expect(history).toHaveCount(5);
  await expect(best).toHaveText('20.00');
  await expect(page.getByRole('region', { name: 'Recent solves', exact: true }).getByRole('button')).toHaveCount(5);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Show all sessions/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await go('Analyzer');
  await expect(summary).toHaveText('5 / 8 solves', { timeout: 60000 });
  const sessions = await openFilters();
  await expect(sessions).toContainText('Practice');
  await sessions.locator('.dropdown-heading').click();
  await sessions.getByText('Practice', { exact: true }).last().click();
  await sessions.getByText('Default', { exact: true }).click();
  await sessions.locator('.dropdown-heading').click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(summary).toHaveText('3 / 8 solves');
  await go('Timer');
  await expect(best).toHaveText('20.00');
  await go('Analyzer');
  await expect(summary).toHaveText('3 / 8 solves');
  await go('Timer');
  await selectSession('Default');
  await go('Analyzer');
  await expect(summary).toHaveText('3 / 8 solves');
  await go('Timer');
  await selectSession('Practice');
  await go('Analyzer');
  await expect(summary).toHaveText('5 / 8 solves');
  await go('Options');
  await page.getByRole('checkbox', { name: 'Show all sessions', exact: true }).check();
  await go('Analyzer');
  await expect(summary).toHaveText('8 / 8 solves');
  await go('Timer');
  await expect(history).toHaveCount(8);
  await expect(best).toHaveText('1.00');
  await expect(page.getByRole('combobox', { name: 'Session history', exact: true })).toHaveValue('Practice');
  await page.reload();
  await expect(history).toHaveCount(8);
  await expect(best).toHaveText('1.00');
  await selectSession('Practice');
  await expect(history).toHaveCount(5);
  await page.reload();
  await expect(history).toHaveCount(5);
  await expect(best).toHaveText('20.00');
  expect(await page.evaluate(() => localStorage.getItem('selected-session'))).toBe('Practice');
  await go('Analyzer');
  await expect(summary).toHaveText('5 / 8 solves', { timeout: 60000 });
  expect(errors).toEqual([]);
  console.log('Sitewide session scope, Timer records/history/recent, Analyzer overrides, Options, and persistence passed.');
} finally {
  await browser.close();
}
