import { chromium, expect } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, hasTouch: true });
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
    async connect(mac, receive, connected) { window.trainerEvent = receive; this.connection = { deviceName: 'Test smart cube', capabilities: {} }; connected(this.connection); }
    async disconnect() { this.connection = null; }
  }`,
}));
const attempts = () => page.evaluate(() => JSON.parse(localStorage.getItem('cuberplus-orientation-attempts-v1') ?? '[]'));
const oriented = () => page.getByRole('button', { name: /^Oriented/ });
async function options(change) {
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: /options$/ });
  await change(dialog);
  await dialog.getByRole('button', { name: 'Close options', exact: true }).click();
}
async function openFlashcards() {
  await page.goto(`${base}/trainer/`);
  await page.getByRole('button', { name: /Orientation Flashcards$/ }).click();
  await page.getByRole('button', { name: 'Start flashcards', exact: true }).click();
  await expect(oriented()).toBeEnabled({ timeout: 30000 });
}
async function highlighted() {
  return page.locator('.orientation-card twisty-player').evaluate(async player => {
    const object = await player.experimentalCurrentThreeJSPuzzleObject();
    return Object.entries(object.pieces).flatMap(([orbit, pieces]) => pieces.flatMap((piece, index) => {
      if (piece.children[0].scale.x <= 1.01) return [];
      return [{ orbit, index, color: piece.children[0].material.color.getHexString(), scale: piece.children[0].scale.x,
        children: piece.children.filter(child => child.visible).length }];
    }));
  });
}
async function fixedCamera(player = page.locator('.orientation-card twisty-player')) {
  await expect.poll(() => player.evaluate(async element => {
    const { latitude, longitude } = await element.experimentalModel.twistySceneModel.orbitCoordinates.get();
    return { latitude, longitude };
  })).toEqual({ latitude: 35, longitude: 25 });
}
async function stageMask(stage, player = page.locator('.orientation-card twisty-player')) {
  await expect.poll(() => player.evaluate(async (element, stage) => {
    const object = await element.experimentalCurrentThreeJSPuzzleObject();
    const focused = object.pieces.EDGES.findIndex(piece => piece.children[0].scale.x > 1.01);
    const mask = await element.experimentalModel.twistySceneModel.stickeringMask.get();
    return ['EDGES', 'CORNERS'].every(orbit => mask.orbits[orbit].pieces.every((piece, index) => {
      const expected = (orbit === 'EDGES' && index === focused) || (stage !== 'scrambled' && index >= 4 &&
        (stage === 'f2l-solved' || (orbit === 'EDGES' && index < 8))) ? 'regular' : 'ignored';
      return piece.facelets.every(sticker => sticker === expected);
    }));
  }, stage)).toBe(true);
}
try {
  await page.goto(`${base}/options/`);
  await page.getByRole('button', { name: 'General', exact: true }).click();
  await expect(page.getByLabel('Highlight aura', { exact: true })).toHaveValue('black');
  await page.getByLabel('Highlight aura', { exact: true }).selectOption('white');
  await page.getByRole('button', { name: 'Mistakes', exact: true }).click();
  const group = page.getByRole('checkbox', { name: 'Long recognition', exact: true });
  await group.uncheck();
  for (const name of ['F2L: Long recognition gap', 'OLL: Long recognition', 'PLL: Long recognition'])
    await expect(page.getByRole('checkbox', { name, exact: true })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'PLL: Long recognition', exact: true }).check();
  expect(await group.evaluate(input => input.indeterminate)).toBe(true);
  await group.check();
  const favorites = page.getByRole('group', { name: /^Mark non-favorite algs as mistakes/ });
  const favoriteGroup = favorites.getByRole('checkbox', { name: 'Mark non-favorite algs as mistakes', exact: true });
  await expect(favorites).toHaveClass(/border/);
  await favoriteGroup.check();
  await favorites.getByRole('checkbox', { name: 'OLL', exact: true }).uncheck();
  expect(await favoriteGroup.evaluate(input => input.indeterminate)).toBe(true);
  await expect(favorites.getByRole('checkbox', { name: /^F2L/ })).toBeVisible();
  await expect(favorites.getByRole('checkbox', { name: 'PLL', exact: true })).toBeVisible();
  if (process.env.OPTIONS_SCREENSHOT) await favorites.screenshot({ path: process.env.OPTIONS_SCREENSHOT });
  await openFlashcards();
  await fixedCamera();
  if (process.env.FLASHCARD_SCREENSHOT) await page.screenshot({ path: process.env.FLASHCARD_SCREENSHOT });
  await expect.poll(highlighted).toEqual([{ orbit: 'EDGES', index: expect.any(Number), color: 'ffffff', scale: 1.1, children: 5 }]);
  const track = page.locator('.orientation-track');
  const rect = await track.boundingBox();
  await page.mouse.move(rect.x + rect.width * .7, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * .3, rect.y + rect.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await attempts()).length).toBe(1);
  const first = (await attempts())[0];
  expect(first.answer).toBe(true);
  expect(first.correct).toBe(first.oriented);
  expect(first.milliseconds).toBeGreaterThan(0);
  expect(first.facelets).toHaveLength(54);
  expect([0, 1, 8]).toContain(first.position);
  await expect(page.locator('.orientation-feedback')).toContainText(first.correct ? 'Correct' : 'Incorrect');
  await expect(oriented()).toBeDisabled();
  await page.waitForTimeout(1100);
  await expect(oriented()).toBeEnabled();
  await fixedCamera();
  expect(await attempts()).toHaveLength(1);
  const nextRect = await track.boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: nextRect.x + nextRect.width * .1, y: nextRect.y + nextRect.height / 2 }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: nextRect.x + nextRect.width * (.1 + .85 * i / 12), y: nextRect.y + nextRect.height / 2 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await attempts()).length).toBe(2);
  expect((await attempts())[0].answer).toBe(false);
  expect(new URL(page.url()).pathname).toBe('/trainer/');
  await page.getByRole('button', { name: 'Stop flashcards', exact: true }).click();
  for (const stage of ['cross-solved', 'f2l-solved']) {
    await options(async dialog => {
      await dialog.getByLabel('Cube state', { exact: true }).selectOption(stage);
      await dialog.getByRole('checkbox', { name: 'Gray out irrelevant stickers', exact: true }).check();
    });
    await page.getByRole('button', { name: 'Start flashcards', exact: true }).click();
    await expect(oriented()).toBeEnabled();
    await fixedCamera();
    await stageMask(stage);
    await oriented().click();
    const result = (await attempts())[0];
    expect(result.stage).toBe(stage); expect(result.gray).toBe(true);
    expect([0, 1, 8]).toContain(result.position);
    await page.getByRole('button', { name: 'Stop flashcards', exact: true }).click();
  }
  await page.reload();
  await page.getByRole('button', { name: /Orientation Flashcards$/ }).click();
  await options(async dialog => {
    await expect(dialog.getByLabel('Cube state', { exact: true })).toHaveValue('f2l-solved');
    await expect(dialog.getByRole('checkbox', { name: 'Gray out irrelevant stickers', exact: true })).toBeChecked();
  });
  await expect(page.getByRole('heading', { name: 'Flashcard statistics', exact: true })).toBeVisible();
  expect(await attempts()).toHaveLength(4);
  const saved = await attempts();
  const examples = [...new Map([...saved].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .map(attempt => [`${attempt.stage}:${attempt.position}:${attempt.oriented}`, attempt])).values()];
  for (const name of ['Case statistics', 'Recent answers']) {
    const card = page.getByRole('article', { name, exact: true });
    await expect(card).toHaveClass(/card/);
    await expect(card.getByRole('table', { name, exact: true })).toBeVisible();
    await expect(card.locator('thead button')).toHaveCount(6);
    const previews = card.locator('tbody svg[role="img"]');
    const expected = name === 'Case statistics' ? examples : saved;
    await expect(previews).toHaveCount(expected.length);
    const images = await previews.evaluateAll(images => images.map(image => ({
      facelets: image.dataset.facelets, highlighted: image.querySelectorAll('[data-highlighted]').length,
      stickers: image.querySelectorAll('polygon').length, grayed: image.querySelectorAll('polygon[fill="#697384"]').length,
    })));
    expect(images.every(image => image.stickers === 27 && image.highlighted === 2 && image.grayed > 0)).toBe(true);
    expect(images.map(image => image.facelets).sort()).toEqual(expected.map(attempt => attempt.facelets).sort());
  }
  const swipeHelp = page.getByRole('heading', { name: /^Orientation Flashcards/ }).locator('.info-tip');
  await swipeHelp.focus();
  await expect(page.getByRole('tooltip')).toContainText('Swipe left for oriented, right for not oriented');
  await page.keyboard.press('Escape');
  if (process.env.STATS_SCREENSHOT) await page.screenshot({ path: process.env.STATS_SCREENSHOT, fullPage: true });
  const recentTable = page.getByRole('table', { name: 'Recent answers', exact: true });
  const timeSort = recentTable.getByRole('button', { name: 'Time', exact: true });
  await timeSort.click();
  await expect(recentTable.locator('th').last()).toHaveAttribute('aria-sort', 'ascending');
  const times = () => recentTable.locator('tbody tr td:last-child').allTextContents().then(values => values.map(value => Number.parseFloat(value)));
  expect(await times()).toEqual([...(await times())].sort((a, b) => a - b));
  await timeSort.press('Enter');
  await expect(recentTable.locator('th').last()).toHaveAttribute('aria-sort', 'descending');
  expect(await times()).toEqual([...(await times())].sort((a, b) => b - a));
  await expect(timeSort).toBeFocused();
  await options(dialog => dialog.getByLabel('Cube state', { exact: true }).selectOption('scrambled'));
  await recentTable.getByRole('row').filter({ hasText: 'F2L solved' }).getByRole('button', { name: 'Review case', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Recorded flashcard', exact: true })).toBeVisible();
  await fixedCamera(page.getByRole('region', { name: 'Recorded flashcard', exact: true }).locator('twisty-player'));
  await stageMask('f2l-solved', page.getByRole('region', { name: 'Recorded flashcard', exact: true }).locator('twisty-player'));
  await page.getByRole('button', { name: 'Close recorded case', exact: true }).click();
  await page.getByRole('button', { name: 'Start flashcards', exact: true }).click();
  await expect(oriented()).toBeEnabled();
  await page.getByRole('article', { name: 'Recent answers', exact: true }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  expect(await attempts()).toHaveLength(4);
  await oriented().scrollIntoViewIfNeeded();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByRole('button', { name: 'Start flashcards', exact: true })).toBeVisible();
  await page.evaluate(() => { delete document.hidden; });
  await page.getByRole('button', { name: 'Back to drills', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Blitz history', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Make your own drill$/ }).click();
  await options(async dialog => {
    await dialog.getByRole('checkbox', { name: 'Random pre-AUF', exact: true }).uncheck();
    await dialog.getByRole('checkbox', { name: 'Random post-AUF', exact: true }).uncheck();
    await expect(dialog.getByRole('checkbox', { name: /Hide PLL/ })).toHaveCount(0);
    await expect(dialog.getByLabel('Cube state')).toHaveCount(0);
  });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cuberplus-trainer-settings-v1')))).toMatchObject({ randomPreAuf: false, randomPostAuf: false });
  await page.goto(`${base}/options/`);
  await page.getByRole('button', { name: 'General', exact: true }).click();
  await page.getByLabel('Highlight aura', { exact: true }).selectOption('color');
  await openFlashcards();
  await expect.poll(async () => (await highlighted())[0]?.children).toBe(5);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await expect(oriented()).toBeVisible();
  }
  await page.evaluate(() => localStorage.setItem('cuberplus-trainer-blitz-v1', JSON.stringify(['OLL', 'PLL'].map(kind => ({
    id: `${kind}-history-check`, kind, date: '2026-11-23T12:00:00Z', milliseconds: 8000, splits: [],
  })))));
  await page.goto(`${base}/trainer/`);
  for (const kind of ['OLL', 'PLL']) {
    await expect(page.getByRole('heading', { name: 'Blitz history', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: new RegExp(`${kind} Blitz$`) }).click();
    await expect(page.getByRole('heading', { name: 'Blitz history', exact: true })).toBeVisible();
    await expect(page.locator('.trainer-run')).toHaveCount(1);
    await expect(page.locator('.trainer-run-kind')).toContainText(`${kind} Blitz`);
    await page.getByRole('button', { name: 'Back to drills', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Blitz history', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await page.getByRole('button', { name: 'Connect cube', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bluetooth cube setup', exact: true })).toContainText('Test smart cube');
  const closeSetup = page.getByRole('button', { name: 'Close cube setup', exact: true });
  if (await closeSetup.isVisible()) await closeSetup.click();
  await page.getByRole('button', { name: /Orientation Flashcards$/ }).click();
  const turn = move => page.evaluate(move => window.trainerEvent({ type: 'MOVE', move }), move);
  await turn('U');
  expect(await attempts()).toHaveLength(4);
  await page.getByRole('button', { name: 'Start flashcards', exact: true }).click();
  await expect(oriented()).toBeEnabled();
  await expect(oriented()).toContainText('(U)');
  await expect(page.locator('.orientation-answers button').last()).toContainText("(U')");
  await turn('R'); await turn('U2');
  expect(await attempts()).toHaveLength(4);
  await turn('U'); await turn('U');
  await expect.poll(async () => (await attempts()).length).toBe(5);
  expect((await attempts())[0].answer).toBe(true);
  await expect(oriented()).toBeEnabled();
  await turn("U'");
  await expect.poll(async () => (await attempts()).length).toBe(6);
  expect((await attempts())[0].answer).toBe(false);
  await page.getByRole('button', { name: 'Stop flashcards', exact: true }).click();
  await page.evaluate(() => window.trainerEvent({ type: 'DISCONNECT', timestamp: performance.now() }));
  await expect(page.getByText('Cube disconnected.', { exact: true })).toHaveCount(0);
  await options(async dialog => {
    await expect(dialog.getByRole('checkbox', { name: 'Random pre-AUF' })).toHaveCount(0);
    await dialog.getByLabel('Top color', { exact: true }).selectOption('Red');
    await dialog.getByLabel('Front color', { exact: true }).selectOption('Blue');
  });
  await page.getByRole('button', { name: 'Start flashcards', exact: true }).click();
  await expect(oriented()).toBeEnabled();
  await fixedCamera();
  const target = (await highlighted())[0].index;
  await oriented().click();
  const colored = (await attempts())[0];
  const frame = await page.evaluate(async colorFrame => {
    const { loadCube } = await import('/timer/src/Core/puzzle.ts');
    const cube = await loadCube(), pattern = cube.solved().applyAlg(colorFrame);
    return { centers: pattern.patternData.CENTERS.pieces.map(piece => 'ULFRBD'[piece]), edges: pattern.patternData.EDGES.pieces };
  }, colored.colorFrame);
  expect(frame.centers[0]).toBe('R'); expect(frame.centers[2]).toBe('B');
  expect(target).toBe(frame.edges[colored.edge]);
  await page.getByRole('button', { name: 'Stop flashcards', exact: true }).click();
  const previews = page.getByRole('table', { name: 'Recent answers' }).locator('svg').filter({ has: page.locator('title') });
  const recorded = previews.locator(`[data-facelet="4"]`).first();
  await expect(recorded).toHaveAttribute('fill', '#b71234');
  await options(dialog => dialog.getByLabel('Top color', { exact: true }).selectOption('Random'));
  await expect(recorded).toHaveAttribute('fill', '#b71234');
  expect(errors).toEqual([]);
  console.log('Flashcards, always-gray previews, smart-cube U/U-prime answers, stage masks, sorting, gestures, mobile and scoped Blitz history passed.');
} catch (error) {
  console.error(await page.evaluate(() => ({
    errors: document.querySelector('[role="alert"]')?.textContent,
    feedback: document.querySelector('.orientation-feedback')?.textContent,
    attempts: JSON.parse(localStorage.getItem('cuberplus-orientation-attempts-v1') ?? '[]').length,
    track: document.querySelector('.orientation-track')?.getBoundingClientRect().toJSON(),
    scroll: window.scrollY,
  })));
  throw error;
} finally { await context.close(); await browser.close(); }
