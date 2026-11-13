import { chromium, expect } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5180';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  localStorage.setItem('theme', 'dark');
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {} });
});
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route(/\/timer\/src\/Bluetooth\/bluetooth\.ts(?:\?.*)?$/, route => route.fulfill({
  contentType: 'text/javascript',
  body: `export class BluetoothCube {
    connection = null;
    async connect(mac, receive, connected) { window.cubeEvent = receive; this.connection = { deviceName: 'Test cube', capabilities: { facelets: true } }; connected(this.connection); await this.refresh(); }
    async disconnect() { this.connection = null; }
    async refresh() { window.cubeEvent?.({ type: 'FACELETS', facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' }); }
  }`,
}));
try {
  await page.goto(`${base}/timer/`);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('combobox', { name: 'Session', exact: true }).selectOption({ label: '+ Create Session' });
  await expect(page.getByRole('combobox', { name: 'Scrambler', exact: true })).toHaveValue('default');
  await page.getByRole('textbox', { name: 'New session name' }).fill('RU practice');
  await page.getByRole('combobox', { name: 'Scrambler', exact: true }).selectOption('2-gen');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await page.getByRole('button', { name: 'Connect cube', exact: true }).click();
  const moves = page.locator('.scramble-content [aria-label="Original scramble"] .move');
  await expect(moves).toHaveCount(25, { timeout: 30000 });
  expect((await moves.allTextContents()).every(move => /^[RU](2|')?$/.test(move))).toBe(true);
  await page.evaluate(async () => {
    const [{ readSolves, saveSolves }, { SOLVED }] = await Promise.all([import('/timer/src/Data/storage.ts'), import('/timer/src/Core/puzzle.ts')]);
    await saveSolves([...await readSolves(), ...Array.from({ length: 12 }, (_, i) => ({
      version: 1, id: `layout-${i}`, session: 'RU practice', createdAt: new Date(Date.now() - 86400000 * (i + 1)).toISOString(),
      device: 'Fixture', scramble: 'R', startFacelets: SOLVED, duration: 10000 + i * 100, status: 'complete',
      timingBasis: 'host', reason: '', moves: [],
    }))]);
    dispatchEvent(new Event('timer-solves-changed'));
  });
  await expect(page.locator('[aria-label="Solve history"] tbody tr')).toHaveCount(12);
  await expect(page.getByRole('img', { name: 'No previous average' })).toHaveCount(1);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const positions = await moves.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top));
    expect(positions.at(-1)).toBe(positions.at(-2));
    const scroll = page.getByRole('region', { name: 'Scrollable solve history' });
    expect(await scroll.evaluate(node => getComputedStyle(node).overflowX)).toBe('auto');
    expect(await scroll.locator('th, td').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).whiteSpace === 'nowrap'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('combobox', { name: 'Session history', exact: true }).selectOption('Default');
  await expect(page.locator('[aria-label="Solve history"] tbody tr')).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  const easy = await page.evaluate(async () => {
    const { sessionScramble } = await import('/timer/src/Core/scramblers.ts');
    return Promise.all([sessionScramble('easy-cross'), sessionScramble('easy-xcross')]);
  });
  expect(easy.every(scramble => scramble.trim().split(/\s+/).length >= 3)).toBe(true);
  await page.getByRole('link', { name: 'Trainer', exact: true }).click();
  await page.getByRole('button', { name: /PLL Blitz/ }).click();
  await page.getByRole('button', { name: 'Start Blitz', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry case', exact: true })).toBeVisible({ timeout: 10000 });
  const first = await page.locator('.trainer-case-current strong').textContent();
  await page.getByRole('button', { name: 'Retry case', exact: true }).click();
  await expect(page.locator('.trainer-case-current strong')).toHaveText(first);
  for (let i = 0; i < 21; i++) await page.getByRole('button', { name: 'Skip case', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Blitz complete: DNF', exact: true })).toBeVisible();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem('cuberplus-trainer-blitz-v1'))[0]);
  expect(run.dnf).toBe(true);
  expect(run.splits).toHaveLength(22);
  expect(run.splits.every(split => split.dnf)).toBe(true);
  expect(run.splits[0].caseId).toBe(run.splits[1].caseId);
  expect(run.splits[0].retry).toBe(true);
  expect(run.milliseconds).toBeCloseTo(run.splits.reduce((sum, split) => sum + split.milliseconds, 0), 5);
  await page.locator('.trainer-run > summary').click();
  await expect(page.locator('.trainer-run .trainer-splits tbody tr')).toHaveCount(22);
  await expect(page.locator('.trainer-run').getByText(/^Retry - DNF \(/)).toBeVisible();
  await page.getByRole('button', { name: 'Back to drills', exact: true }).click();
  await page.getByRole('button', { name: /Single-case drill/ }).click();
  await expect(page.locator('.trainer-picker details[open]')).toHaveCount(0);
  await expect(page.locator('.trainer-practice[data-case]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toHaveCount(0);
  await page.locator('summary').filter({ hasText: /^F2L cases/ }).click();
  for (const [width, columns] of [[1440, 3], [390, 2]]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.locator('.trainer-case-picker').first().evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(columns);
  }
  await page.getByRole('button', { name: 'Practice F2L 2', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.trainer-practice[data-case]')).toHaveCount(0);
  if (process.env.NOV13_SCREENSHOT) {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.screenshot({ path: process.env.NOV13_SCREENSHOT });
  }
  await page.getByRole('button', { name: 'Practice F2L 3', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.trainer-practice')).toHaveAttribute('data-case', 'F2L-3');
  await expect(page.getByRole('button', { name: 'Stop drill', exact: true })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Retry case', exact: true })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Retry case', exact: true }).click();
  await page.getByRole('button', { name: 'Skip case', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Completed practice attempts' }).locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('.trainer-practice time').first()).toHaveText('now');
  await page.getByRole('button', { name: 'Stop drill', exact: true }).click();
  expect(errors).toEqual([]);
  console.log('November plan: session generators, easy searches, layout, illustrated picker, skip/retry, and relative dates passed.');
} finally {
  await browser.close();
}
