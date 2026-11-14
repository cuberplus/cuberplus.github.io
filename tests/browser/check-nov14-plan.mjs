import { chromium, expect } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5194';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  localStorage.setItem('theme', 'dark');
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {} });
});
const page = await context.newPage(), errors = [], external = [];
page.on('pageerror', error => errors.push(error.message));
context.on('page', popup => { if (popup !== page) external.push(popup); });
await page.route(/\/timer\/src\/Bluetooth\/bluetooth\.ts(?:\?.*)?$/, route => route.fulfill({
  contentType: 'text/javascript',
  body: `export class BluetoothCube {
    connection = null;
    async connect(mac, receive, connected) { window.cubeEvent = receive; this.connection = { deviceName: 'Test cube', capabilities: { facelets: true, reset: true } }; connected(this.connection); await this.refresh(); }
    async disconnect() { this.connection = null; }
    async refresh() { window.readCount = (window.readCount || 0) + 1; window.cubeEvent?.({ type: 'FACELETS', facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' }); }
    async calibrate() { window.resetCount = (window.resetCount || 0) + 1; }
  }`,
}));
await page.route(/\/timer\/src\/Core\/scramblers\.ts(?:\?.*)?$/, route => route.fulfill({
  contentType: 'text/javascript',
  body: `export const scramblers = { default: 'Random state (default)' }; export const SESSION_SCRAMBLERS = 'test-scramblers'; export const readSessionScramblers = () => ({}); export const sessionScramble = async () => 'R U2';`,
}));
const move = async notation => page.evaluate(move => window.cubeEvent({
  type: 'MOVE', timestamp: performance.now(), move, face: 'URFDLB'.indexOf(move[0]),
  direction: move.endsWith("'") ? 1 : 0, localTimestamp: performance.now(), cubeTimestamp: null,
}), notation);
try {
  await page.goto(`${base}/options/`);
  await expect(page.getByRole('link', { name: 'Join the CuberPlus Discord server' })).toHaveAttribute('href', 'https://discord.gg/ft7tmsSWs');
  await page.goto(`${base}/timer/`);
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await page.getByRole('button', { name: 'Connect cube', exact: true }).click();
  await expect(page.locator('.scramble-content [aria-label="Original scramble"] .move')).toHaveCount(2, { timeout: 30000 });
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  const setup = page.getByRole('dialog', { name: 'Bluetooth cube setup', exact: true });
  await expect(setup.getByRole('button', { name: 'Read cube state', exact: true })).toBeVisible();
  await setup.getByRole('button', { name: 'Close cube setup', exact: true }).click();
  const guidance = page.locator('.scramble-content [aria-label="Original scramble"] .move');
  await expect(guidance).toHaveCount(2, { timeout: 30000 });
  await move('R'); await move('U2'); await move('F');
  await expect(page.getByRole('button', { name: 'Abort solve', exact: true })).toBeVisible();
  for (const notation of ['R', "R'", 'R', "R'", 'R', "R'"]) await move(notation);
  await expect.poll(() => page.evaluate(() => window.resetCount)).toBe(1);
  await expect.poll(() => page.evaluate(async () => {
    const { readSolves } = await import('/timer/src/Data/storage.ts');
    return (await readSolves()).map(solve => [solve.status, solve.dnfReason]);
  })).toEqual([['incomplete', 'solve aborted']]);
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await setup.getByRole('button', { name: "Recalibrate as solved ((R R') x3)", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.resetCount)).toBe(2);
  await page.getByRole('link', { name: 'Trainer', exact: true }).click();
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  const trainerSetup = page.getByRole('dialog', { name: /Bluetooth cube setup/ });
  await trainerSetup.getByRole('button', { name: 'Read cube state', exact: true }).click();
  await trainerSetup.getByRole('button', { name: "Recalibrate as solved ((R R') x3)", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.resetCount)).toBe(3);
  await trainerSetup.getByRole('button', { name: 'Close cube setup', exact: true }).click();
  await page.goto(`${base}/database/#OF2L-1`);
  await expect(page.locator('#OF2L-1 .database-algorithm')).toHaveCount(3);
  await expect(page.locator('#OF2L-1').getByText('R/U preferred', { exact: true })).toBeVisible();
  const mirrored = await page.request.get(`${base}/case-images/OF2L-12.svg`);
  expect(await mirrored.text()).toContain('data-mirrored-face="B"');
  for (const key of ['F2L-1', 'AF2L-1']) {
    await page.goto(`${base}/database/#${key}`);
    const entry = page.locator(`#${key}`);
    await expect(entry.locator('.database-algorithm')).toHaveCount(3);
    await expect(entry.locator('.badge')).toHaveText(['Shortest', 'R/U preferred', 'Alternative']);
    await entry.getByRole('button', { name: /^Show all/ }).click();
    expect(await entry.locator('.database-algorithm').count()).toBeGreaterThan(3);
    await entry.locator('.database-algorithm').nth(3).locator('.database-star').click();
    await entry.getByRole('button', { name: /^Show fewer/ }).click();
    await expect(entry.locator('.badge')).toHaveText(['Shortest', 'R/U preferred', 'Alternative']);
  }
  await expect(page.getByText('Generated solutions', { exact: true })).toHaveCount(0);
  await page.locator('.database-tools > summary').click();
  await expect(page.getByRole('button', { name: 'Remove all custom algorithms' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Re-validate all custom algorithms' })).toBeDisabled();

  await page.getByRole('searchbox').fill('F2L');
  await expect(page.locator('.database-case')).toHaveCount(170);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const columns = await page.locator('.database-case--f2l').evaluateAll(rows => rows.map(row => ({
      name: row.querySelector('h3').getBoundingClientRect().x,
      algorithm: row.querySelector('.database-algorithm p').getBoundingClientRect().x,
    })));
    expect(new Set(columns.map(column => column.name))).toHaveProperty('size', 1);
    expect(new Set(columns.map(column => column.algorithm))).toHaveProperty('size', 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('searchbox').fill('Other F2L');
  await expect(page.locator('.database-case')).toHaveCount(75);
  await expect(page.locator('.database-algorithms h3')).toHaveText(Array.from({ length: 75 }, (_, i) => `Other F2L ${i + 1}`));
  expect(await page.locator('.database-case').evaluateAll(rows => rows.map(row => row.id))).toEqual(
    Array.from({ length: 75 }, (_, i) => `OF2L-${i + 1}`));
  const stable = page.locator('#OF2L-12');
  const numberedTitle = await stable.locator('h3').textContent();
  expect(numberedTitle).toBe('Other F2L 12');
  await stable.locator('.database-star').first().click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cuberplus-database-favorites')).some(id => id.startsWith('OF2L-12:')))).toBe(true);
  await page.goto(`${base}/database/#OF2L-12`);
  await expect(stable.locator('h3')).toHaveText(numberedTitle);
  await expect(stable.locator('.database-star').first()).toHaveAttribute('aria-pressed', 'true');
  await page.goto(`${base}/trainer/?case=OF2L-12`);
  const practiceLabel = numberedTitle.replace('Other F2L', 'OF2L');
  await expect(page.getByRole('heading', { name: new RegExp(`^${practiceLabel} drill`) })).toBeVisible();
  await expect(page.getByRole('img', { name: `${practiceLabel} case`, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to cases', exact: true }).click();
  await page.locator('.trainer-picker > details > summary').filter({ hasText: /^OF2L cases/ }).click();
  await expect(page.locator('.trainer-case-choice[aria-label^="Practice OF2L "]')).toHaveText(
    Array.from({ length: 75 }, (_, i) => `OF2L ${i + 1}`));

  const analysis = await context.newPage();
  analysis.on('pageerror', error => errors.push(error.message));
  await analysis.goto(`${base}/analyzer/`);
  await analysis.getByRole('button', { name: 'Data', exact: true }).click();
  await analysis.getByText('Demo data', { exact: true }).click();
  await analysis.getByRole('button', { name: /^CFOP Small/ }).click();
  await expect(analysis.getByRole('button', { name: 'Records', exact: true })).toBeVisible({ timeout: 60000 });
  await analysis.getByRole('button', { name: 'Records', exact: true }).click();
  const fastest = analysis.locator('.clickable-grid .rdg-row:not([aria-rowindex="1"]) .rdg-cell').first();
  await expect(fastest).toBeVisible({ timeout: 60000 });
  await fastest.click();
  const replay = analysis.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible();
  await expect(replay.getByRole('button', { name: 'Play', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(replay.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
  await expect(replay.getByRole('button', { name: '+2', exact: true })).toHaveCount(0);
  await expect(replay.getByRole('button', { name: 'DNF', exact: true })).toHaveCount(0);
  await expect(replay.getByRole('link', { name: 'Retry', exact: true })).toHaveCount(0);
  await replay.locator('summary').filter({ hasText: /^Analysis settings$/ }).click();
  await replay.getByRole('combobox', { name: 'Base cross color' }).selectOption('0');
  await replay.getByRole('button', { name: 'Re-run analysis', exact: true }).click();
  await expect(replay.getByRole('combobox', { name: 'Base cross color' })).toHaveValue('0');
  await replay.locator('summary').filter({ hasText: /^Insights$/ }).click();
  await expect(replay.locator('[aria-label="Solve mistakes"]')).not.toContainText('Analyzing solve mistakes', { timeout: 30000 });
  await expect(replay.locator('[aria-label="Solve mistakes"]')).not.toContainText('could not be assessed');
  expect(await analysis.evaluate(async () => (await (await import('/timer/src/Data/storage.ts')).readSolves()).length)).toBe(1);
  await replay.getByRole('button', { name: 'Next move', exact: true }).click();
  await expect(replay.locator('.replay-position')).toContainText(/^1\//);
  await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  expect(external).toHaveLength(1); // The only new page is the analysis tab created above.
  expect(errors).toEqual([]);
  console.log('November 14 plan: cube gesture/controls, aborted solve, Discord, F2L, and temporary native replay passed.');
} catch (failure) { console.error(errors); throw failure; }
finally { await browser.close(); }
