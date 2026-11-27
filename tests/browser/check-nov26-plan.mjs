import { chromium, expect } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5182';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  localStorage.setItem('cuberplus-trainer-settings-v1', JSON.stringify({
    upcomingCases: true, caseNames: true, solutionAlgorithms: true, hidePLL: false,
    randomPreAuf: false, randomPostAuf: false, crossColor: 'White', frontColor: 'Blue',
  }));
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {} });
  window.google = { accounts: { oauth2: { initTokenClient: options => ({
    requestAccessToken: () => options.callback({ access_token: 'settings-test-token', expires_in: 3600, scope: options.scope }),
  }) } } };
});
let sharedFiles = [{ id: 'settings-shared-solve', name: 'Settings test solve' }];
await context.route('https://www.googleapis.com/**', async route => {
  const request = route.request(), url = new URL(request.url());
  expect(request.headers().authorization).toBe('Bearer settings-test-token');
  if (request.method() === 'GET' && url.pathname === '/drive/v3/files') return route.fulfill({ json: { files: sharedFiles } });
  if (request.method() === 'DELETE' && url.pathname === '/drive/v3/files/settings-shared-solve') {
    sharedFiles = []; return route.fulfill({ status: 204 });
  }
  throw new Error(`Unexpected settings request: ${request.method()} ${url.pathname}`);
});
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
async function connectCube() {
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await page.getByRole('button', { name: 'Connect cube', exact: true }).click();
}
await context.route(/\/timer\/src\/Bluetooth\/bluetooth\.ts(?:\?.*)?$/, route => route.fulfill({
  contentType: 'text/javascript',
  body: `export class BluetoothCube {
    async connect(mac, receive, connected) { window.planEvent = receive; connected({ deviceName: 'Plan test cube', capabilities: { facelets: true } }); receive({ type: 'FACELETS', facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' }); }
    async disconnect() {}
    async refresh() {}
  }`,
}));
try {
  await page.goto(`${base}/options/`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Cloud backup', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Backup provider' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Connect Google Drive' }).locator('svg')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /microsoft|onedrive/i })).toHaveCount(0);
  const cloud = page.getByRole('region', { name: /^Cloud backup/ });
  await expect(cloud.getByRole('button', { name: 'Manage Google Drive shared solves', exact: true })).toBeVisible();
  await expect(cloud.getByRole('button', { name: 'Restore backup', exact: true })).toBeVisible();
  await expect(cloud.getByText('Restore and connection settings', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Shared solves', exact: true })).toHaveCount(0);
  await cloud.getByRole('button', { name: 'Connect Google Drive', exact: true }).click();
  await expect(cloud.getByRole('button', { name: 'Back up now', exact: true })).toBeEnabled();
  await expect(cloud.getByRole('button', { name: 'Reconnect Google Drive', exact: true })).toBeVisible();
  await expect(cloud.getByRole('button', { name: 'Restore backup', exact: true })).toBeEnabled();
  await cloud.getByRole('button', { name: 'Manage Google Drive shared solves', exact: true }).click();
  await expect(cloud.getByRole('link', { name: 'Settings test solve', exact: true })).toBeVisible();
  await cloud.getByRole('button', { name: 'Revoke Settings test solve', exact: true }).click();
  await expect(cloud.getByRole('status')).toHaveText('No published snapshots in this account.');
  expect(sharedFiles).toEqual([]);
  await cloud.getByRole('button', { name: 'Disconnect sharing', exact: true }).click();
  await expect(cloud.getByRole('button', { name: 'Delete all shared data', exact: true })).toHaveCount(0);
  await cloud.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await page.getByRole('button', { name: 'Break reminder', exact: true }).click();
  const enabled = page.getByRole('checkbox', { name: 'Enable break reminders', exact: true });
  await expect(page.getByRole('checkbox', { name: 'Start sessions without lockouts' })).toBeDisabled();
  await enabled.check();
  await page.getByText('Customize break reminders', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Start sessions without lockouts' })).toBeChecked();
  const grace = page.getByRole('spinbutton', { name: 'Lockout-free session time (minutes)' });
  await expect(grace).toHaveValue('10');
  await grace.fill('5');
  await grace.blur();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('timer-break-settings')).graceMinutes)).toBe(5);
  const graceToggle = page.getByRole('checkbox', { name: 'Start sessions without lockouts' });
  await graceToggle.uncheck();
  await expect(grace).toBeDisabled();
  expect(await grace.locator('..').evaluate(element => getComputedStyle(element).opacity)).toBe('0.5');
  await expect(page.getByRole('spinbutton', { name: 'Break length (minutes)' })).toBeEnabled();
  await graceToggle.check();
  await expect(grace).toBeEnabled();
  await expect(grace).toHaveValue('5');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const rows = await page.locator('.break-reminder-row').evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect(); return { top: box.top, bottom: box.bottom };
    }));
    expect(rows).toHaveLength(9);
    expect(rows.every((row, i) => !i || row.top >= rows[i - 1].bottom)).toBe(true);
  }
  await enabled.click();
  await page.getByRole('button', { name: 'Continue to final warning', exact: true }).click();
  await page.getByRole('button', { name: 'Disable reminders', exact: true }).click();
  await expect(graceToggle).toBeDisabled();
  await expect(grace).toBeDisabled();
  await page.getByRole('button', { name: 'General', exact: true }).click();
  const general = page.getByRole('region', { name: 'General', exact: true });
  await expect(general.locator('fieldset > legend')).toHaveText(['Appearance', 'Time display', 'History', 'App & reminders']);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const groups = await general.locator('fieldset').evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect(); return { top: box.top, bottom: box.bottom };
    }));
    expect(groups.every((group, i) => group.bottom > group.top && (!i || group.top >= groups[i - 1].bottom))).toBe(true);
    for (const name of ['Font size', 'Highlight aura', 'Time precision', 'Recent solves']) {
      expect((await general.getByRole('combobox', { name, exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(48);
    }
  }
  await page.getByRole('button', { name: 'Aurora theme', exact: true }).click();
  const background = await page.locator('.options-page').evaluate(element => getComputedStyle(element).backgroundImage);
  expect(background).toContain('aurora.jpg');
  const asset = background.match(/url\("([^"]+)"\)/)[1];
  expect((await context.request.get(asset)).ok()).toBe(true);
  const palette = await page.evaluate(async url => {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const sample = (x, y) => `rgb(${Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3).join(', ')})`;
    return { green: sample(704, 824), pink: sample(604, 532) };
  }, asset);
  expect(await page.getByRole('link', { name: 'CuberPlus home' }).evaluate(element => getComputedStyle(element).color)).toBe(palette.green);
  expect(await page.locator('.cuberplus-brand-plus').evaluate(element => getComputedStyle(element).color)).toBe(palette.pink);
  expect(await cloud.getByRole('button', { name: 'Connect Google Drive', exact: true }).evaluate(element => getComputedStyle(element).backgroundColor)).toBe(palette.pink);
  const buttonContrast = await cloud.getByRole('button', { name: 'Connect Google Drive', exact: true }).evaluate(element => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    const luminance = color => {
      context.fillStyle = color; context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map(value => value / 255)
        .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
        .reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
    };
    const style = getComputedStyle(element), text = luminance(style.color), background = luminance(style.backgroundColor);
    return (Math.max(text, background) + .05) / (Math.min(text, background) + .05);
  });
  expect(buttonContrast).toBeGreaterThanOrEqual(4.5);
  await page.emulateMedia({ forcedColors: 'active' });
  expect(await page.getByRole('link', { name: 'CuberPlus home' }).evaluate(element => getComputedStyle(element).webkitTextFillColor)).not.toBe('rgba(0, 0, 0, 0)');
  await page.emulateMedia({ forcedColors: 'none' });
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  expect(await page.locator('.cuberplus-brand-plus').evaluate(element => getComputedStyle(element).color === getComputedStyle(element.parentElement).color)).toBe(true);
  await page.goto(`${base}/database/`);
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  await expect(page.locator('.database-group[open]')).toHaveCount(1);
  await page.locator('.database-property > summary').filter({ hasText: 'Create from solved' }).click();
  await expect(page.locator('.database-case')).toHaveCount(11);
  await expect(page.getByText('Pattern algorithms', { exact: true })).toHaveCount(0);
  await expect(page.locator('.database-case h3').filter({ hasText: /^Patterns / })).toHaveCount(0);
  const updatedPatterns = await page.evaluate(async () => {
    const { algorithms } = await import('/src/database/algorithms.ts');
    return algorithms.filter(entry => entry.category === 'Patterns' && ['1', '2', '3', '7', '9'].includes(entry.id));
  });
  for (const entry of updatedPatterns) {
    await expect(page.locator(`#Patterns-${entry.id} .database-algorithm p`)).toHaveText(entry.options);
    expect(entry.options).toHaveLength(2);
  }
  expect(await page.locator('.database-case-image').evaluateAll(images => images.filter(image => image.tagName === 'IMG').every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto(`${base}/trainer/?case=Patterns-3`);
  await connectCube();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.getByText('Hold your cube with white on top and green in front.', { exact: true })).toBeVisible();
  await expect(page.getByText('Target pattern', { exact: true })).toBeVisible();
  expect(await page.locator('.trainer-practice').getAttribute('data-color-frame')).not.toBe('');
  await page.evaluate(async () => {
    const [{ patternDefinitions }, { loadCube }, { algorithmMatcher }] = await Promise.all([
      import('/src/database/patterns.ts'), import('/timer/src/Core/puzzle.ts'), import('/timer/src/Analysis/algorithmMatching.ts'),
    ]);
    const entry = patternDefinitions.find(entry => entry.id === '3');
    for (const move of algorithmMatcher(await loadCube()).outerMoves(entry.algorithm).moves) window.planEvent({ type: 'MOVE', move });
  });
  await expect(page.getByRole('table', { name: 'Completed practice attempts' }).locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Stop drill', exact: true }).click();
  await page.goto(`${base}/trainer/?case=OLL-27`);
  await connectCube();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.getByText('Hold your cube with white on top and green in front.', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const [{ algorithms }, { loadCube }, { algorithmMatcher }] = await Promise.all([
      import('/src/database/algorithms.ts'), import('/timer/src/Core/puzzle.ts'), import('/timer/src/Analysis/algorithmMatching.ts'),
    ]);
    const entry = algorithms.find(entry => entry.category === 'OLL' && entry.id === '27');
    for (const move of algorithmMatcher(await loadCube()).outerMoves(entry.algorithm).moves) window.planEvent({ type: 'MOVE', move });
  });
  await expect(page.getByRole('table', { name: 'Completed practice attempts' }).locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('.trainer-practice twisty-player')).toBeVisible({ timeout: 10000 });
  const auraCount = await page.locator('.trainer-practice twisty-player').evaluate(async player => {
    const { highlightCubies } = await import('/timer/src/Components/cubeHighlight.ts');
    const object = await player.experimentalCurrentThreeJSPuzzleObject();
    window.restoreHighlights = highlightCubies(object, { CORNERS: [0], EDGES: [0], CENTERS: [0] }, 'color');
    const materials = [];
    object.traverse(node => { if (node.material?.polygonOffset) materials.push(node.material); });
    if (materials.some(material => material.transparent || material.depthWrite || material.polygonOffsetFactor <= 0)) throw new Error('Unstable highlight depth settings');
    return materials.length;
  });
  expect(auraCount).toBeGreaterThan(0);
  const cubeBounds = await page.locator('.trainer-practice twisty-player').boundingBox();
  await page.mouse.move(cubeBounds.x + cubeBounds.width / 2, cubeBounds.y + cubeBounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(cubeBounds.x + cubeBounds.width / 2 + 120, cubeBounds.y + cubeBounds.height / 2 + 60, { steps: 20 });
  await page.mouse.up();
  if (process.env.PLAN_SCREENSHOT) await page.screenshot({ path: process.env.PLAN_SCREENSHOT });
  await page.evaluate(() => window.restoreHighlights());
  await page.goto(`${base}/trainer/`);
  await connectCube();
  await page.getByRole('button', { name: /Make your own drill/ }).click();
  await page.getByRole('button', { name: 'Create training', exact: true }).click();
  await page.getByRole('textbox', { name: 'Training name', exact: true }).fill('Pattern regression');
  await page.locator('.trainer-category > summary').filter({ hasText: 'Patterns cases' }).click();
  const checkerboard = page.getByRole('checkbox', { name: 'Checkerboard', exact: true });
  await page.locator('label.trainer-case-choice').filter({ has: checkerboard }).click();
  await expect(checkerboard).toBeChecked();
  await page.getByRole('button', { name: 'Save training', exact: true }).click();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.getByText('Target pattern', { exact: true })).toBeVisible();
  const colorFrame = await page.locator('.trainer-practice').getAttribute('data-color-frame');
  await page.evaluate(async colorFrame => {
    const [{ loadCube }, { cfopFrame }, { patternDefinitions }, { algorithmMatcher }] = await Promise.all([
      import('/timer/src/Core/puzzle.ts'), import('/timer/src/Analysis/cfop.ts'), import('/src/database/patterns.ts'), import('/timer/src/Analysis/algorithmMatching.ts'),
    ]);
    const cube = await loadCube(), transform = cfopFrame(cube, colorFrame);
    const entry = patternDefinitions.find(entry => entry.id === '3');
    for (const move of algorithmMatcher(cube).outerMoves(entry.algorithm).moves) {
      const face = [...'URFDLB'].find(face => transform(face) === move[0]);
      window.planEvent({ type: 'MOVE', move: face + move.slice(1) });
    }
  }, colorFrame);
  await expect(page.getByRole('table', { name: 'Completed practice attempts' }).locator('tbody tr')).toHaveCount(1);
  const savedTheme = await browser.newContext();
  await savedTheme.addInitScript(() => localStorage.setItem('theme', 'light'));
  const savedPage = await savedTheme.newPage();
  await savedPage.goto(`${base}/options/`);
  await expect(savedPage.locator('html')).toHaveAttribute('data-theme', 'light');
  await savedTheme.close();
  expect(errors).toEqual([]);
  console.log('Nov 26 browser regressions passed.');
} finally {
  await browser.close();
}
