import { chromium, expect } from '@playwright/test';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4177';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
const navigation = () => page.getByRole('navigation', { name: 'CuberPlus', exact: true });
async function visit(name) {
  const menu = page.getByRole('button', { name: /^Menu/ });
  if (await menu.isVisible() && await menu.getAttribute('aria-expanded') === 'false') await menu.click();
  await navigation().getByRole('link', { name, exact: true }).click();
  await expect(page.locator('[class^="site-page--"]:not([hidden]) main h1').first()).toBeFocused();
}
async function geometry() {
  return page.evaluate(() => {
    const root = document.documentElement, heading = document.querySelector('[class^="site-page--"]:not([hidden]) main h1');
    const { x, y, width, height } = heading.getBoundingClientRect();
    return { width: root.scrollWidth, height: root.scrollHeight, scrollY, heading: [x, y, width, height] };
  });
}
async function tooltip(trigger) {
  await trigger.scrollIntoViewIfNeeded();
  const before = await geometry();
  await trigger.hover();
  const tip = page.getByRole('tooltip');
  await expect(tip).toBeVisible();
  expect(await geometry()).toEqual(before);
  await tip.hover();
  await page.waitForTimeout(200);
  await expect(tip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
  expect(await geometry()).toEqual(before);
}
try {
  await page.goto(`${base}/options/`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Import solve CSV files').setInputFiles(join('smartcubeanalyzer', 'public', 'demo', 'cfop-small.csv'));
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText('Imported 467 solves', { timeout: 120000 });
  for (const width of [1440, 1024, 720, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ['Timer', 'Smartcube Analyzer', 'Trainer', 'Scrambler', 'Database', 'Options']) {
      await visit(name);
      const heading = page.locator('[class^="site-page--"]:not([hidden]) main h1').first();
      await expect(heading).toHaveCSS('font-size', '24px');
      expect((await heading.boundingBox()).x, `${name} heading inset at ${width}px`).toBe(width <= 720 ? 12 : 24);
      const header = page.locator('[class^="site-page--"]:not([hidden]) .cuberplus-header');
      expect(await header.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (['Timer', 'Trainer', 'Scrambler'].includes(name)) {
        const options = page.locator('[class^="site-page--"]:not([hidden]) .page-heading > .page-actions > .page-options-button');
        const box = await options.boundingBox(), title = await heading.boundingBox();
        expect(box.x + box.width).toBe(width - (width <= 720 ? 12 : 24));
        expect(Math.abs(box.y + box.height / 2 - title.y - title.height / 2)).toBeLessThan(1);
      }
      await expect(header.getByRole('button', { name: /Connect cube|Help|Filters|Options/ })).toHaveCount(0);
      const menu = page.getByRole('button', { name: /^Menu/ });
      if (width <= 1100) {
        await expect(menu).toHaveAttribute('aria-expanded', 'false');
        await menu.click();
        for (const link of await navigation().getByRole('link').all()) {
          const box = await link.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
        }
        await page.keyboard.press('Escape');
        await expect(menu).toBeFocused();
        await expect(menu).toHaveAttribute('aria-expanded', 'false');
      }
    }
    console.log(`PASS consistent headings, page margins, and non-scrolling navigation at ${width}px`);
  }
  await tooltip(page.locator('.solve-limit .info-tip'));
  await page.getByRole('combobox', { name: 'Recent solves', exact: true }).selectOption('25000');
  expect(await page.evaluate(() => localStorage.getItem('recent-solve-limit'))).toBe('25000');
  await visit('Trainer');
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /^Bluetooth cube setup/ }).getByRole('button', { name: 'Connect cube', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close cube setup', exact: true })).toBeFocused();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Bluetooth cube setup', exact: true })).toBeFocused();
  await visit('Scrambler');
  await expect(page.getByRole('dialog', { name: 'Set your challenge', exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Set your challenge', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await visit('Smartcube Analyzer');
  await expect(page.locator('.site-page--smartcubeanalyzer canvas').first()).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole('combobox', { name: 'Recent solves', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open filters', exact: true })).toHaveClass(/btn-primary/);
  await tooltip(page.locator('.analysis-context .info-tip'));
  await page.getByRole('button', { name: 'OLL', exact: true }).click();
  await expect(page.getByRole('button', { name: 'OLL', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Cases', exact: true }).click();
  const practice = page.getByRole('region', { name: 'Algorithm Practice', exact: true });
  await expect(practice).toBeVisible({ timeout: 60000 });
  const caseButton = practice.locator('.algo-case-link').first();
  await expect(caseButton).toBeVisible();
  expect(await caseButton.evaluate(button => parseFloat(getComputedStyle(button).paddingRight))).toBeGreaterThanOrEqual(12);
  await page.getByRole('button', { name: 'Cross+1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Overview', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Explore chart data', { exact: true })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/timer/`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.timer-toolbar select')).toHaveCount(0);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Options', exact: true }).getByRole('combobox', { name: 'Session', exact: true });
  await expect(picker).toBeEnabled();
  const sessions = await picker.locator('option').evaluateAll(options => options.map(option => option.value));
  await picker.selectOption(sessions.find(value => value !== 'Default' && !value.startsWith('__create__')));
  const selectedSession = await picker.inputValue();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  const history = page.locator('.timer-history');
  await expect(history).toHaveJSProperty('tagName', 'SECTION');
  await expect(history.locator('summary')).toHaveCount(0);
  await expect(history.getByRole('table', { name: 'Solve history' })).toBeVisible();
  await expect(page.locator('.recent-times button')).toHaveCount(5);
  expect(await page.locator('.recent-times button').allTextContents()).toEqual(expect.arrayContaining([expect.stringMatching(/^[\d:.]+$/)]));
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  const setup = page.getByRole('dialog', { name: 'Bluetooth cube setup', exact: true });
  await expect(setup.getByRole('button', { name: 'Connect cube', exact: true })).toBeVisible();
  await setup.getByRole('button', { name: 'Close cube setup', exact: true }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const options = page.getByRole('dialog', { name: 'Options', exact: true });
  await tooltip(options.locator('.info-tip').first());
  await expect(options).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(options).not.toBeVisible();
  await page.getByText('Try simulated cube', { exact: true }).evaluate(button => button.click());
  await expect(page.getByRole('button', { name: 'Perform guided move', exact: true })).toBeEnabled({ timeout: 60000 });
  await page.locator('.demo').evaluate(node => { node.hidden = true; });
  await expect(page.locator('.timer-panel')).not.toHaveClass(/timer-disconnected/);
  await expect(page.getByRole('img', { name: 'Live 3x3 cube state', exact: true })).toBeVisible();
  await expect(page.locator('.trail-compact')).toBeVisible();
  expect(await page.locator('.recent-times').evaluate(node => node.getBoundingClientRect().bottom)).toBeLessThanOrEqual(844);
  await expect(page.locator('.trail-compact strong')).toHaveCount(7);
  if (process.env.UX_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.UX_SCREENSHOT_DIR, 'timer-refined-390.png'), animations: 'disabled' });
  await page.locator('.timer-recent a').click();
  await expect(history).toHaveAttribute('open', '');
  await expect(page.getByRole('combobox', { name: 'Recent solves', exact: true })).toHaveCount(0);
  await page.evaluate(() => scrollTo(0, 0));
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await picker.selectOption({ label: '+ Create Session' });
  const form = options.locator('.session-picker form');
  await expect(form.getByRole('textbox', { name: 'New session name', exact: true })).toBeFocused();
  expect(await form.evaluate(node => node.getBoundingClientRect().right)).toBeLessThanOrEqual(320);
  await form.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await visit('Options');
  await page.getByRole('combobox', { name: 'Time precision', exact: true }).selectOption('3');
  await visit('Timer');
  await page.evaluate(session => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('solves', 'readwrite'), store = tx.objectStore('solves'), read = store.getAll();
      read.onsuccess = () => store.put({ ...read.result.find(solve => solve.status === 'complete'), id: 'long-time-layout', session, duration: 123456, createdAt: new Date().toISOString() });
      tx.oncomplete = () => { db.close(); window.dispatchEvent(new Event('timer-solves-changed')); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }), selectedSession);
  await expect(page.getByLabel('Solve time', { exact: true })).toHaveText('123.456');
  expect(await page.locator('.timer-display').evaluate(display => {
    const time = display.querySelector('.timer-value');
    return time.getBoundingClientRect().width <= display.clientWidth;
  })).toBe(true);
  for (const button of await page.locator('.recent-times button').all()) {
    expect(await button.evaluate(button => {
      const range = document.createRange(); range.selectNodeContents(button);
      return range.getBoundingClientRect().width <= button.clientWidth;
    })).toBe(true);
  }
  expect(errors).toEqual([]);
  console.log('PASS stable tooltips, preset/view selection, scope controls, compact Timer, and mobile session creation');
} finally {
  await context.close();
  await browser.close();
}
