import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const errors = [];
try {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/options/`);
  const options = page.locator('.site-page--options');
  await expect(options.getByRole('link', { name: 'CuberPlus on GitHub' })).toHaveAttribute('href', 'https://github.com/CuberPlus/cuberplus.github.io');
  await expect(options.getByRole('link', { name: 'Join the CuberPlus Discord server' })).toHaveAttribute('href', 'https://discord.gg/ft7tmsSWs');
  for (const name of ['CuberPlus on GitHub', 'Join the CuberPlus Discord server']) {
    const link = options.getByRole('link', { name });
    await expect(link).toHaveText('');
    await expect(link.locator('svg')).toBeVisible();
    await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await link.focus();
    await expect(link).toBeFocused();
  }
  const devNote = options.locator('details').filter({ hasText: 'Dev Note' });
  const devNoteContent = devNote.locator(':scope > div');
  await expect(options.locator('main > section > :last-child > summary')).toHaveText('Dev Note');
  await expect(devNoteContent).toBeHidden();
  await devNote.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(devNote.getByText('Hey! My name is Fifey', { exact: true })).toBeVisible();
  await expect(devNote.locator('strong')).toHaveText('My promise to you is that CuberPlus and all its features will be 100% Free, and will never show advertising. Ever.');
  await page.keyboard.press('Space');
  await expect(devNoteContent).toBeHidden();
  const enabled = options.getByRole('checkbox', { name: 'Enable break reminders', exact: true });
  await expect(enabled).not.toBeChecked();
  await expect(options.getByRole('spinbutton', { name: 'Break length (minutes)', includeHidden: true })).toBeHidden();
  const customize = options.getByText('Customize break reminders', { exact: true });
  await customize.focus();
  await page.keyboard.press('Enter');
  await expect(options.getByRole('spinbutton', { name: 'Break length (minutes)' })).toHaveValue('2');
  await expect(options.getByRole('spinbutton', { name: 'Single-solve slowdown multiplier' })).toHaveValue('2');
  const average = options.getByRole('spinbutton', { name: 'Average window (solves)' });
  await expect(average).toHaveValue('100');
  await expect(options.getByRole('spinbutton', { name: /average window/i })).toHaveCount(1);
  await expect(options.getByRole('spinbutton', { name: 'Completed solves before reminders', includeHidden: true })).toHaveCount(0);
  await average.fill('50');
  await average.press('Tab');
  await page.reload();
  await options.getByText('Customize break reminders', { exact: true }).click();
  await expect(average).toHaveValue('50');
  await average.fill('100');
  await average.press('Tab');
  await customize.click();
  await expect(options.getByRole('spinbutton', { name: 'Break length (minutes)', includeHidden: true })).toBeHidden();
  await enabled.check();
  await enabled.click();
  const warning = options.getByRole('dialog');
  await expect(warning.getByRole('button', { name: 'Keep reminders' })).toBeFocused();
  await warning.getByRole('button', { name: 'Continue to final warning' }).click();
  await expect(warning.getByRole('heading')).toHaveText('Disable break reminders?');
  await warning.getByRole('button', { name: 'Keep reminders' }).click();
  await expect(enabled).toBeChecked();
  await options.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name: 'Timer', exact: true }).click();
  const timer = page.locator('.site-page--timer');
  await expect(timer.getByRole('button', { name: 'Try simulated cube', includeHidden: true })).toBeEnabled();
  await timer.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(timer.getByRole('region', { name: 'Break reminder settings', includeHidden: true })).toHaveCount(0);
  await expect(timer.getByRole('checkbox', { name: 'Enable break reminders', includeHidden: true })).toHaveCount(0);
  const inspectionOptions = timer.locator('summary').filter({ hasText: 'Inspection options' });
  await expect(timer.getByRole('checkbox', { name: 'Minimum required inspection', exact: true, includeHidden: true })).toBeHidden();
  await inspectionOptions.focus();
  await inspectionOptions.press('Enter');
  await timer.getByRole('checkbox', { name: 'Minimum required inspection', exact: true }).check();
  const minimumInspection = timer.getByRole('spinbutton', { name: 'Minimum inspection (seconds)' });
  await expect(minimumInspection).toHaveValue('5');
  await minimumInspection.focus();
  await minimumInspection.press('ControlOrMeta+A');
  await minimumInspection.press('Backspace');
  await expect(minimumInspection).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('timer-minimum-inspection'))).toBe('5');
  await minimumInspection.pressSequentially('10');
  await minimumInspection.press('Tab');
  await expect(minimumInspection).toHaveValue('10');
  expect(await page.evaluate(() => localStorage.getItem('timer-minimum-inspection'))).toBe('10');
  for (const invalid of ['', '0', '61']) {
    await minimumInspection.fill(invalid);
    await minimumInspection.press('Tab');
    await expect(minimumInspection).toHaveValue('10');
    expect(await page.evaluate(() => localStorage.getItem('timer-minimum-inspection'))).toBe('10');
  }
  await minimumInspection.fill('0.5');
  await minimumInspection.press('Tab');
  await expect(minimumInspection).toHaveValue('0.5');
  expect(await page.evaluate(() => localStorage.getItem('timer-minimum-inspection'))).toBe('0.5');
  await minimumInspection.fill('5');
  await minimumInspection.press('Tab');
  const readiness = timer.getByRole('checkbox', { name: 'Show inspection readiness instead of timer' });
  await expect(readiness).not.toBeChecked();
  await readiness.check();
  expect(await page.evaluate(() => localStorage.getItem('timer-inspection-readiness'))).toBe('true');
  await timer.getByRole('button', { name: 'Close options', exact: true }).click();
  const engine = await timer.locator('.cuberplus-page').evaluateHandle(node => {
    let fiber = node[Object.keys(node).find(key => key.startsWith('__reactFiber$'))];
    while (fiber) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const value = hook.memoizedState?.current;
        if (typeof value?.phase === 'string' && typeof value?.turn === 'function') return value;
      }
      fiber = fiber.return;
    }
    throw new Error('Timer engine not found');
  });
  const records = await engine.evaluate(timer => Array.from({ length: 100 }, (_, index) => ({
    version: 1, id: `baseline-${index}`, session: 'Default', createdAt: new Date(Date.now() - (101 - index) * 100000).toISOString(),
    device: 'Browser test', scramble: 'R', startFacelets: timer.cube.facelets(timer.cube.solved().applyAlg('R')),
    duration: 1000, status: 'complete', reason: '', timingBasis: 'host',
    moves: [{ move: "R'", hostTime: 1000, elapsed: 1000, localTimestamp: null, cubeTimestamp: null }],
  })));
  await page.evaluate(records => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('solves', 'readwrite');
      records.forEach(record => tx.objectStore('solves').put(record));
      tx.oncomplete = () => { db.close(); window.dispatchEvent(new Event('timer-solves-changed')); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }), records);
  await expect(timer.locator('[aria-label="Solve history"] tbody tr')).toHaveCount(100);
  const completed = await engine.evaluate(timer => {
    timer.connect('Browser test');
    timer.synchronize(timer.cube.facelets(timer.cube.solved()));
    timer.prepare('R U2');
    for (const [move, hostTime] of [['R', 100], ['U2', 200], ['U2', 1200], ["R'", 6200]]) {
      timer.turn({ move, hostTime, localTimestamp: null, cubeTimestamp: null });
    }
    return timer.result;
  });
  expect(completed.penaltyReason).toBe('Under-inspected');
  expect(completed.duration).toBe(5000);
  await expect(timer.getByRole('heading', { name: 'Time for a break' })).toBeVisible();
  await expect(timer.locator('.timer-panel')).toBeHidden();
  const reminder = timer.locator('[aria-labelledby="break-reminder-title"]');
  await expect(reminder.getByRole('button')).toHaveCount(0);
  await timer.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name: 'Trainer', exact: true }).click();
  await expect(page.locator('.site-page--trainer').getByRole('heading', { name: 'Trainer', exact: true })).toBeVisible();
  await page.locator('.site-page--trainer').getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name: 'Timer', exact: true }).click();
  await expect(timer.getByRole('heading', { name: 'Time for a break' })).toBeVisible();
  await page.reload();
  await expect(timer.getByRole('heading', { name: 'Time for a break' })).toBeVisible();
  await timer.getByRole('button', { name: 'Options', exact: true }).click();
  await inspectionOptions.click();
  await expect(readiness).toBeChecked();
  await timer.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.clock.install();
  await page.clock.fastForward(120001);
  await expect(timer.getByRole('heading', { name: 'Time for a break' })).toHaveCount(0);
  await expect(timer.locator('.timer-panel')).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
  console.log('Timer safeguards: defaults, confirmations, penalty, persistence, navigation, and expiry passed.');
} finally {
  await browser.close();
}
