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
    async connect(mac, receive, connected) { window.trainerEvent = receive; this.connection = { deviceName: 'GAN 356 i Carry', capabilities: { facelets: true } }; connected(this.connection); receive({ type: 'FACELETS', facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' }); }
    async disconnect() { this.connection = null; }
    async refresh() { window.trainerEvent?.({ type: 'FACELETS', facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' }); }
  }`,
}));
async function finishCase(kind) {
  const label = await page.locator('.trainer-case-current strong').textContent();
  const auf = await page.locator('.trainer-case-current').getAttribute('data-auf');
  const preAuf = await page.locator('.trainer-case-current').getAttribute('data-pre-auf');
  const postAuf = await page.locator('.trainer-case-current').getAttribute('data-post-auf');
  const colorFrame = await page.locator('.trainer-case-current').getAttribute('data-color-frame');
  await page.evaluate(async ({ kind, label, auf, preAuf, postAuf, colorFrame }) => {
    const [{ algorithms }, { loadCube }, { cfopFrame }, { blitzPattern }] = await Promise.all([
      import('/src/database/algorithms.ts'), import('/timer/src/Core/puzzle.ts'), import('/timer/src/Analysis/cfop.ts'), import('/src/trainer/blitz.ts'),
    ]);
    const cube = await loadCube(), entry = algorithms.find(entry => `${entry.category} ${entry.id}` === label);
    let pattern = blitzPattern(cube, { ...entry, auf, preAuf: preAuf ?? undefined, postAuf: postAuf ?? undefined });
    const moves = await cube.solution(cube.facelets(pattern));
    for (const move of moves) {
      const face = [...'URFDLB'].find(face => cfopFrame(cube, colorFrame)(face) === move[0]);
      window.trainerEvent({ type: 'MOVE', move: face + move.slice(1) });
      pattern = pattern.applyMove(move);
      if (kind === 'OLL' && [...cube.facelets(pattern).slice(0, 9)].every(face => face === 'U') &&
        ['EDGES', 'CORNERS'].every(orbit => pattern.patternData[orbit].pieces.every((piece, i) =>
          i < 4 || piece === i && pattern.patternData[orbit].orientation[i] === 0))) break;
    }
  }, { kind, label, auf, preAuf, postAuf, colorFrame });
}
try {
  await page.goto(`${base}/trainer/`);
  await expect(page.getByRole('button', { name: /OLL Blitz/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /PLL Blitz/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Options', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: /OLL Blitz/ }).click();
  const options = page.locator('.site-page--trainer').getByRole('dialog');
  await expect(page.getByLabel('Upcoming cases', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(options).toHaveAccessibleName('OLL Blitz options');
  await expect(options.getByLabel('Upcoming cases', { exact: true })).toBeEnabled();
  await expect(options.getByLabel('Hide PLL stickers', { exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await expect(options).toBeHidden();
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await page.getByRole('button', { name: 'Connect cube', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Blitz', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Start Blitz', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('3');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  for (const label of ['Upcoming cases', 'Case names shown', 'Cross color', 'Front color', 'Hide PLL stickers']) {
    await expect(options.getByLabel(label, { exact: true })).toBeDisabled();
  }
  await page.keyboard.press('Escape');
  await expect(options).toBeHidden();
  await expect(page.locator('.trainer-case-queue svg')).toHaveCount(3, { timeout: 10000 });
  expect(await page.locator('.trainer-case-queue svg').evaluateAll(images => images.map(image => {
    const fills = new Set([...image.querySelectorAll('rect')].map(sticker => sticker.getAttribute('fill')));
    return fills.size === 2 && fills.has('#697384');
  }))).toEqual([true, true, true]);
  await expect(page.getByRole('img', { name: 'Live 3x3 cube state' })).toBeVisible();
  const firstPlayer = await page.locator('twisty-player').elementHandle();
  await page.evaluate(async () => {
    const { Cube } = await import('/timer/src/Core/puzzle.ts');
    const facelets = Cube.prototype.facelets;
    window.idleCubeCalculations = 0;
    Cube.prototype.facelets = function (...args) {
      window.idleCubeCalculations++;
      return facelets.apply(this, args);
    };
    window.restoreCubeProbe = () => { Cube.prototype.facelets = facelets; };
  });
  const timeBefore = await page.getByRole('timer').textContent();
  await expect(page.getByRole('timer')).not.toHaveText(timeBefore);
  expect(await page.evaluate(() => window.idleCubeCalculations)).toBe(0);
  await page.evaluate(() => window.restoreCubeProbe());
  const first = await page.locator('.trainer-case-current strong').textContent();
  await finishCase('OLL');
  await expect(page.locator('.trainer-case-current strong')).not.toHaveText(first);
  await expect(page.getByText('Case 2 of 57', { exact: true })).toBeVisible();
  expect(await firstPlayer.evaluate(element => element === document.querySelector('twisty-player'))).toBe(true);
  await finishCase('OLL');
  await expect(page.getByText('Case 3 of 57', { exact: true })).toBeVisible();
  expect(await firstPlayer.evaluate(element => element === document.querySelector('twisty-player'))).toBe(true);
  if (process.env.TRAINER_SCREENSHOT) {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: process.env.TRAINER_SCREENSHOT });
  }
  await page.getByRole('button', { name: 'Give up', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('cuberplus-trainer-blitz-v1'))).toBeNull();
  await page.getByRole('button', { name: 'Back to drills', exact: true }).click();
  await page.getByRole('button', { name: /PLL Blitz/ }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(options).toHaveAccessibleName('PLL Blitz options');
  await expect(options.getByLabel('Hide PLL stickers', { exact: true })).toHaveCount(0);
  await expect(options.getByLabel('Cross color', { exact: true })).toHaveValue('Yellow');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Start Blitz', exact: true }).click();
  await expect(page.locator('.trainer-case-current')).toBeVisible({ timeout: 10000 });
  for (let i = 0; i < 21; i++) {
    await expect(page.getByText(`Case ${i + 1} of 21`, { exact: true })).toBeVisible();
    await finishCase('PLL');
  }
  await expect(page.getByRole('region', { name: 'Blitz result' })).toBeVisible();
  const results = await page.evaluate(() => JSON.parse(localStorage.getItem('cuberplus-trainer-blitz-v1')));
  expect(results).toHaveLength(1);
  expect(results[0].splits).toHaveLength(21);
  expect(results[0].settings).toEqual({ upcomingCases: true, caseNames: true, hidePLL: false, crossColor: 'Yellow', frontColor: 'Green' });
  expect(results[0].splits.every(split => ['', 'U', 'U2', "U'"].includes(split.auf))).toBe(true);
  expect(results[0].splits.every(split => ['', 'U', 'U2', "U'"].includes(split.preAuf) && ['', 'U', 'U2', "U'"].includes(split.postAuf))).toBe(true);
  expect(new Set(results[0].splits.map(split => split.caseId)).size).toBe(21);
  expect(results[0].splits.reduce((sum, split) => sum + split.milliseconds, 0)).toBeCloseTo(results[0].milliseconds, 5);
  expect(results[0].splits.every(split => Number.isFinite(split.recognitionMilliseconds) && split.recognitionMilliseconds >= 0 &&
    Number.isFinite(split.executionMilliseconds) && split.executionMilliseconds >= 0 &&
    Math.abs(split.recognitionMilliseconds + split.executionMilliseconds - split.milliseconds) < .001)).toBe(true);
  const result = page.getByRole('region', { name: 'Blitz result' });
  await expect(result).toHaveClass(/card/);
  await expect(result.locator('tbody svg')).toHaveCount(21);
  for (const setup of await result.locator('.trainer-case-setup > summary').all()) await setup.click();
  await expect(result.getByText(/^Pre-AUF:/)).toHaveCount(21);
  await expect(result.getByText(/^Post-AUF:/)).toHaveCount(21);
  const timingTotals = ['recognitionMilliseconds', 'executionMilliseconds'].map(key =>
    `${(results[0].splits.reduce((sum, split) => sum + split[key], 0) / 1000).toFixed(2)}s`);
  expect(await result.locator('dl[aria-label="Timing breakdown"] dd').allTextContents()).toEqual(timingTotals);
  await result.getByRole('button', { name: 'Split' }).click();
  await expect(result.getByRole('columnheader', { name: 'Split' })).toHaveAttribute('aria-sort', 'ascending');
  await result.getByRole('button', { name: 'Split' }).click();
  await expect(result.getByRole('columnheader', { name: 'Split' })).toHaveAttribute('aria-sort', 'descending');
  await result.getByRole('button', { name: 'Order' }).click();
  await expect(result.getByRole('columnheader', { name: 'Order' })).toHaveAttribute('aria-sort', 'ascending');
  expect(await result.locator('tbody tr td:first-child').allTextContents()).toEqual(Array.from({ length: 21 }, (_, i) => String(i + 1)));
  expect(await result.locator('tbody tr td:nth-child(3)').allTextContents()).toEqual(results[0].splits.map(split => `${(split.recognitionMilliseconds / 1000).toFixed(2)}s`));
  expect(await result.locator('tbody tr td:nth-child(4)').allTextContents()).toEqual(results[0].splits.map(split => `${(split.executionMilliseconds / 1000).toFixed(2)}s`));
  expect(await result.locator('tbody svg').evaluateAll(images => images.map(image => image.getAttribute('aria-label'))))
    .toEqual(results[0].splits.map(split => `PLL ${split.caseId} case`));
  await result.getByRole('button', { name: 'Order' }).click();
  expect(await result.locator('tbody tr td:first-child').allTextContents()).toEqual(Array.from({ length: 21 }, (_, i) => String(21 - i)));
  // The same connection remains active when changing tools.
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await expect(page.locator('.site-page--timer').getByRole('button', { name: 'Disconnect', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close cube setup', exact: true }).click();
  await page.getByRole('link', { name: 'Trainer', exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await expect(page.locator('.site-page--trainer').getByRole('button', { name: 'Disconnect', exact: true })).toBeVisible();
  await page.locator('.site-page--trainer').getByRole('button', { name: 'Disconnect', exact: true }).click();
  await page.getByRole('button', { name: 'Close cube setup', exact: true }).click();
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await page.locator('.site-page--timer').getByRole('button', { name: 'Connect cube', exact: true }).click();
  await page.getByRole('link', { name: 'Trainer', exact: true }).click();
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await expect(page.locator('.site-page--trainer').getByRole('button', { name: 'Disconnect', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close cube setup', exact: true }).click();
  await page.getByRole('button', { name: 'Back to drills', exact: true }).click();
  await page.getByRole('button', { name: /OLL Blitz/ }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Front color', { exact: true }).selectOption('Random');
  await page.getByLabel('Cross color', { exact: true }).selectOption('Random');
  await page.getByLabel('Hide PLL stickers', { exact: true }).check();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.getByRole('button', { name: 'Start Blitz', exact: true }).click();
  await expect(page.getByText('Case 1 of 57', { exact: true })).toBeVisible({ timeout: 10000 });
  const countGrayStickers = () => page.locator('.site-page--trainer twisty-player').evaluate(async player => {
    const mask = await player.experimentalModel.twistySceneModel.stickeringMask.get();
    return Object.values(mask.orbits).flatMap(orbit => orbit.pieces).flatMap(piece => piece?.facelets ?? []).filter(sticker => sticker === 'ignored').length;
  });
  await expect.poll(countGrayStickers).toBe(12);
  await expect(page.locator('.trainer-case-current svg rect[fill="#697384"]').first()).toBeVisible();
  await finishCase('OLL');
  await expect(page.getByText('Case 2 of 57', { exact: true })).toBeVisible();
  await expect.poll(countGrayStickers).toBe(12);
  await page.getByRole('button', { name: 'Give up', exact: true }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Cross color', { exact: true }).selectOption('Yellow');
  await page.getByLabel('Front color', { exact: true }).selectOption('Green');
  await page.getByLabel('Upcoming cases', { exact: true }).uncheck();
  await page.getByLabel('Case names shown', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.getByRole('button', { name: 'Start Blitz', exact: true }).click();
  await expect(page.getByText('Case 1 of 57', { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.trainer-case-queue')).toHaveCount(0);
  await page.getByRole('button', { name: 'Give up', exact: true }).click();
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  const myCubes = page.getByRole('region', { name: 'My cubes', exact: true });
  await myCubes.locator('.saved-cube > summary').filter({ hasText: 'GAN 356 i Carry' }).click();
  await expect(myCubes.getByLabel('Name for GAN 356 i Carry', { exact: true })).toBeVisible();
  await myCubes.getByText('Add a cube', { exact: true }).click();
  await myCubes.getByLabel('New cube name', { exact: true }).fill('Travel cube');
  await myCubes.getByLabel('MAC (if required)', { exact: true }).fill('11:22:33:44:55:66');
  await myCubes.getByRole('button', { name: 'Save cube', exact: true }).click();
  await myCubes.locator('.saved-cube > summary').filter({ hasText: 'Travel cube' }).click();
  await expect(myCubes.getByLabel('Name for Travel cube', { exact: true })).toBeVisible();
  await myCubes.getByRole('button', { name: 'Forget Travel cube', exact: true }).click();
  await expect(myCubes.getByLabel('Name for Travel cube', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Trainer', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Blitz history', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /OLL Blitz/ }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByLabel('Upcoming cases', { exact: true })).not.toBeChecked();
  await expect(page.getByLabel('Case names shown', { exact: true })).not.toBeChecked();
  await expect(page.getByLabel('Hide PLL stickers', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Cross color', { exact: true })).toHaveValue('Yellow');
  await expect(page.getByLabel('Front color', { exact: true })).toHaveValue('Green');
  await page.evaluate(() => {
    history.pushState(null, '', '/timer/');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('.site-page--trainer .trainer-settings')).not.toHaveAttribute('open', '');
  await page.getByRole('link', { name: 'Trainer', exact: true }).click();
  await expect(options).toBeHidden();
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await page.getByRole('button', { name: 'Connect cube', exact: true }).click();
  await page.getByRole('button', { name: 'Start Blitz', exact: true }).click();
  await page.evaluate(() => window.trainerEvent({ type: 'DISCONNECT' }));
  await expect(page.getByRole('alert')).toContainText('Blitz cancelled');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cuberplus-trainer-blitz-v1')).length)).toBe(1);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(options).toBeVisible();
    await expect(options.getByLabel('Upcoming cases', { exact: true })).toBeEnabled();
    const bounds = await options.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Close options', exact: true }).click();
  }
  await page.evaluate(async () => {
    const [{ Blitz }, { loadCube }] = await Promise.all([import('/src/trainer/blitz.ts'), import('/timer/src/Core/puzzle.ts')]);
    const blitz = new Blitz(await loadCube(), 'OLL');
    const run = { id: 'oll-results-preview', kind: 'OLL', date: new Date().toISOString(), milliseconds: 3000,
      settings: { ...blitz.settings, hidePLL: false },
      splits: blitz.queue.slice(0, 3).map((entry, index) => ({ caseId: entry.id, milliseconds: 1000, auf: entry.auf, colorFrame: entry.colorFrame,
        crossColor: entry.crossColor, frontColor: entry.frontColor, permutation: entry.permutation,
        recognitionMilliseconds: [250, 500, 125][index], executionMilliseconds: 1000 - [250, 500, 125][index] })) };
    const legacy = { ...run, id: 'legacy-oll-results', milliseconds: 6000, splits: run.splits.map(({ caseId }) => ({ caseId, milliseconds: 2000 })) };
    const runs = JSON.parse(localStorage.getItem('cuberplus-trainer-blitz-v1'));
    localStorage.setItem('cuberplus-trainer-blitz-v1', JSON.stringify([run, legacy, ...runs]));
  });
  await page.reload();
  const ollHistory = page.locator('.trainer-run').filter({ has: page.locator('.trainer-run-time', { hasText: '3.00s' }) });
  await ollHistory.locator(':scope > summary').click();
  await expect(ollHistory.locator('tbody svg')).toHaveCount(3);
  expect(await ollHistory.locator('tbody svg rect').evaluateAll(stickers => new Set(stickers.map(sticker => sticker.getAttribute('fill'))).size)).toBe(2);
  await expect(ollHistory.locator('tbody svg rect[fill="#697384"]').first()).toBeVisible();
  await ollHistory.getByRole('button', { name: 'Order' }).click();
  expect(await ollHistory.locator('tbody tr td:first-child').allTextContents()).toEqual(['1', '2', '3']);
  expect(await ollHistory.locator('dl[aria-label="Timing breakdown"] dd').allTextContents()).toEqual(['0.88s', '2.13s']);
  await ollHistory.getByRole('button', { name: 'Recognition' }).click();
  expect(await ollHistory.locator('tbody tr td:first-child').allTextContents()).toEqual(['3', '1', '2']);
  await ollHistory.getByRole('button', { name: 'Recognition' }).click();
  expect(await ollHistory.locator('tbody tr td:first-child').allTextContents()).toEqual(['2', '1', '3']);
  await ollHistory.getByRole('button', { name: 'Execution', exact: true }).click();
  expect(await ollHistory.locator('tbody tr td:first-child').allTextContents()).toEqual(['2', '1', '3']);
  const legacyHistory = page.locator('.trainer-run').filter({ has: page.locator('.trainer-run-time', { hasText: '6.00s' }) });
  await legacyHistory.locator(':scope > summary').click();
  expect(await legacyHistory.locator('dl[aria-label="Timing breakdown"] dd').allTextContents()).toEqual(['Not recorded', 'Not recorded']);
  expect(await legacyHistory.locator('tbody tr td:nth-child(3)').allTextContents()).toEqual(['Not recorded', 'Not recorded', 'Not recorded']);
  expect(await legacyHistory.locator('tbody tr td:nth-child(4)').allTextContents()).toEqual(['Not recorded', 'Not recorded', 'Not recorded']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  console.log('PASS OLL/PLL workflows, Options, legal OLL randomization, gray stickers, timing breakdowns, result sorting, legacy results and mobile layout');
} finally { await context.close(); await browser.close(); }
