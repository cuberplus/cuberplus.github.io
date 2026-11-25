import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
await context.addInitScript(() => {
  localStorage.setItem('theme', 'dark');
  const attempts = [
    { id: 'a', date: '2026-11-24T12:00:00Z', recognitionMilliseconds: 9000, executionMilliseconds: 10000 },
    { id: 'b', date: '2026-11-22T12:00:00Z', recognitionMilliseconds: 11000, executionMilliseconds: 1000 },
    { id: 'c', date: '2026-11-23T12:00:00Z', recognitionMilliseconds: 2000, executionMilliseconds: 500, dnf: true },
  ].map(row => ({ ...row, caseKey: 'PLL-T', trainingId: 'single:PLL-T', algorithm: null }));
  localStorage.setItem('cuberplus-trainer-practice-v1', JSON.stringify(attempts));
});
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`${process.env.SITE_URL ?? 'http://127.0.0.1:5173'}/timer/`);
  await page.evaluate(async () => {
    const [{ default: React }, { default: ReactDOM }, { PracticeDialog }, { loadCube }] = await Promise.all([
      import('/node_modules/.vite/deps/react.js'), import('/node_modules/.vite/deps/react-dom_client.js'),
      import('/src/trainer/PracticeDialog.tsx'), import('/timer/src/Core/puzzle.ts'),
    ]);
    const host = document.createElement('div'); document.body.append(host);
    const root = ReactDOM.createRoot(host), cube = await loadCube();
    root.render(React.createElement(PracticeDialog, { cube, caseKey: 'PLL-T', close: () => { root.unmount(); host.remove(); } }));
  });
  const dialog = page.getByRole('dialog', { name: 'Practice PLL T', exact: true });
  await expect(dialog).toBeVisible();
  await page.evaluate(async () => {
    const { cubeConnection } = await import('/shared/cube/connection.ts');
    cubeConnection.update({ connection: { deviceName: 'Test cube' } });
  });
  const start = dialog.getByRole('button', { name: 'Start practice', exact: true });
  await expect(start).toBeEnabled();
  await page.waitForTimeout(3200);
  await expect(dialog.getByRole('button', { name: 'Stop drill', exact: true })).toHaveCount(0);
  await expect(dialog.locator('.trainer-practice-case-image')).toBeVisible();
  await dialog.getByRole('button', { name: 'Options', exact: true }).click();
  const options = page.getByRole('dialog', { name: 'PLL T drill options', exact: true });
  await expect(options.getByRole('checkbox', { name: 'Random pre-AUF' })).toBeEnabled();
  await options.getByRole('checkbox', { name: 'Random pre-AUF' }).uncheck();
  await options.getByRole('button', { name: 'Close options', exact: true }).click();
  await start.click();
  await expect(dialog.getByRole('button', { name: 'Stop drill', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Stop drill', exact: true }).click();
  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const image = dialog.locator('.trainer-practice-case-image img');
    await expect(image).toBeVisible();
    const box = await image.boundingBox(), parent = await image.locator('..').boundingBox();
    expect(Math.abs(box.x + box.width / 2 - parent.x - parent.width / 2)).toBeLessThan(1);
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  const table = dialog.getByRole('table', { name: 'Completed practice attempts' });
  const values = column => table.locator(`tbody tr td:nth-child(${column})`).allTextContents();
  const recognition = table.getByRole('button', { name: 'Recognition', exact: true });
  await recognition.click();
  expect(await values(2)).toEqual(['2.00s', '9.00s', '11.00s']);
  await recognition.press('Enter');
  expect(await values(2)).toEqual(['11.00s', '9.00s', '2.00s']);
  await expect(recognition).toBeFocused();
  await table.getByRole('button', { name: 'Execution', exact: true }).click();
  expect(await values(3)).toEqual(['0.50s', '1.00s', '10.00s']);
  await table.getByRole('button', { name: 'Result', exact: true }).click();
  expect(await values(4)).toEqual(['12.00s', '19.00s', 'DNF']);
  await table.getByRole('button', { name: 'Date', exact: true }).click();
  expect(await table.locator('time').evaluateAll(times => times.map(time => time.dateTime))).toEqual([
    '2026-11-22T12:00:00Z', '2026-11-23T12:00:00Z', '2026-11-24T12:00:00Z',
  ]);
  if (process.env.PRACTICE_SCREENSHOT) await page.screenshot({ path: process.env.PRACTICE_SCREENSHOT });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log('Mistake practice waits for explicit Start with a connected cube and allows changing settings; image centers on desktop/mobile and timing headers sort correctly.');
} finally { await context.close(); await browser.close(); }
