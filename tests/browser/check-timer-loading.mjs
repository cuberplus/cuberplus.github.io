import { chromium, expect } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
try {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/timer/src/Data/storage.ts*', async route => {
    const response = await route.fetch(), body = await response.text();
    const delayed = body.replace(/(export async function recoverLocalSolves\([^)]*\) \{)/,
      '$1\nawait new Promise(resolve => setTimeout(resolve, 3000));');
    expect(delayed).not.toBe(body);
    await route.fulfill({ response, body: delayed });
  });
  await page.route('**/timer/src/Core/engine.ts*', async route => {
    const response = await route.fetch(), body = await response.text();
    const exposed = body.replace('this.record = record;', 'this.record = record; globalThis.testTimer = this;');
    expect(exposed).not.toBe(body);
    await route.fulfill({ response, body: exposed });
  });
  await page.goto(`${base}/options/`);
  await page.evaluate(async () => {
    const [{ TimerEngine }, { loadCube, SOLVED }, { saveSolves }] = await Promise.all([
      import('/timer/src/Core/engine.ts'), import('/timer/src/Core/puzzle.ts'), import('/timer/src/Data/storage.ts'),
    ]);
    const timer = new TimerEngine(await loadCube(), () => {}, () => {});
    timer.connect('Test cube'); timer.synchronize(SOLVED); timer.prepare('R U2');
    ['R', 'U2', 'U2', "R'"].forEach((move, i) => timer.turn({ move, hostTime: i * 100, localTimestamp: i * 100, cubeTimestamp: null }));
    globalThis.baseline = { ...timer.result, id: 'loading-baseline', createdAt: '2026-01-01T00:00:00.000Z' };
    await saveSolves([baseline, { ...baseline, id: 'to-delete' }]);
  });
  await page.goto(`${base}/timer/?solve=loading-baseline`);
  await expect(page.getByText('Try simulated cube', { exact: true })).toBeEnabled();
  await expect(page.getByRole('dialog', { name: 'Solve replay', exact: true })).toHaveCount(0);
  await page.evaluate(async () => {
    const { readSolves, deleteSolve } = await import('/timer/src/Data/storage.ts');
    const baseline = (await readSolves()).find(solve => solve.id === 'loading-baseline');
    const solve = { ...baseline, id: 'recorded-while-loading', duration: 300000, createdAt: new Date().toISOString(),
      moves: baseline.moves.map((move, i) => ({ ...move, elapsed: i * 300000, hostTime: performance.now() - 300000 + i * 300000 })) };
    globalThis.testTimer.record(solve);
    await deleteSolve('to-delete');
  });
  await expect(page.getByRole('dialog', { name: 'Solve replay', exact: true })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Close replay', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(2);
  await expect(page.getByLabel('Personal best', { exact: true })).toHaveCount(0);
  const ids = await page.evaluate(async () => (await (await import('/timer/src/Data/storage.ts')).readSolves()).map(solve => solve.id));
  expect(ids.sort()).toEqual(['loading-baseline', 'recorded-while-loading']);
  await page.evaluate(async () => {
    const { readSolves, saveSolves } = await import('/timer/src/Data/storage.ts');
    const [solve] = await readSolves();
    await saveSolves([{ ...solve, id: 'other-session', session: 'Other - Cubeast', duration: 10000 }]);
    dispatchEvent(new Event('timer-solves-changed'));
  });
  const table = page.getByRole('table', { name: 'Solve history' }), session = page.getByRole('combobox', { name: 'Session history', exact: true });
  await expect(session.locator('option')).toHaveText(['Default', 'Other - Cubeast']);
  await expect(table.locator('tbody tr')).toHaveCount(2);
  const notifications = page.getByRole('button', { name: /^Dismiss (personal best|daily streak)$/ });
  while (await notifications.count()) await notifications.first().click();
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  const allSessions = page.getByRole('checkbox', { name: 'Show all sessions', exact: true });
  await expect(allSessions).not.toBeChecked(); await allSessions.check();
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(3);
  await expect(table.getByRole('columnheader', { name: 'Date', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'Session', exact: true })).toHaveCount(0);
  await session.selectOption('Other - Cubeast');
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'View current Single', exact: true })).toHaveText('10.00');
  await page.getByText('Try simulated cube', { exact: true }).evaluate(button => button.click());
  await expect(page.getByRole('button', { name: 'Perform guided move', exact: true })).toBeEnabled();
  await page.evaluate(() => testTimer.prepare('R'));
  await page.getByRole('button', { name: 'Perform guided move', exact: true }).click();
  await page.getByRole('button', { name: "R'", exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(2);
  expect(await page.evaluate(async () => {
    const solves = await (await import('/timer/src/Data/storage.ts')).readSolves();
    return solves.find(solve => !['loading-baseline', 'recorded-while-loading', 'other-session'].includes(solve.id))?.session;
  })).toBe('Other - Cubeast');
  await page.goto(`${base}/timer/?retry=loading-baseline`);
  await expect(page.getByText('Try simulated cube', { exact: true })).toBeEnabled();
  await expect(page.getByText('This solve is no longer saved in Timer.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Connect your cube to retry this scramble.', { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(2);
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Show all sessions', exact: true })).not.toBeChecked();
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Solve history' }).getByRole('columnheader', { name: 'Session', exact: true })).toHaveCount(0);
  await page.goto(`${base}/timer/`);
  await expect(page.getByText('Try simulated cube', { exact: true })).toBeEnabled();
  const activeId = await page.evaluate(() => {
    const timer = globalThis.testTimer;
    timer.session = localStorage.getItem('selected-session') ?? 'Default';
    timer.connect('Test cube'); timer.prepare('R');
    let time = performance.now();
    timer.turn({ move: 'R', hostTime: time, localTimestamp: time, cubeTimestamp: null });
    time = performance.now();
    timer.turn({ move: 'U', hostTime: time, localTimestamp: time, cubeTimestamp: null });
    return timer.active.id;
  });
  await expect(page.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(2, { timeout: 10000 });
  expect(await page.evaluate(async id => (await (await import('/timer/src/Data/storage.ts')).readSolves()).find(solve => solve.id === id)?.status, activeId)).toBe('active');
  await page.evaluate(() => {
    for (const move of ["U'", "R'"]) {
      const time = performance.now();
      globalThis.testTimer.turn({ move, hostTime: time, localTimestamp: time, cubeTimestamp: null });
    }
  });
  await expect(page.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(3);
  await page.goto(`${base}/database/`);
  const other = page.locator('.database-group').filter({ has: page.locator(':scope > summary').filter({ hasText: 'Other F2L' }) });
  await other.locator(':scope > summary').click();
  const summaries = other.locator('.database-property > summary');
  await expect(summaries).toHaveCount(2);
  await expect(summaries.nth(0)).toContainText('Oriented edge');
  await expect(summaries.nth(1)).toContainText('Unoriented edge');
  for (const summary of await summaries.all()) await summary.click();
  await expect(other.locator('.database-case')).toHaveCount(26);
  expect(errors).toEqual([]);
  console.log('Passed: responsive startup, concurrent saves/deletions, replay/retry, all-session history and persistence, recording destination, PB history, and Other F2L groups.');
} finally {
  await browser.close();
}
