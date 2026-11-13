import { chromium, expect } from '@playwright/test';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5180';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
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
    async connect(mac, receive, connected) { this.connection = { deviceName: 'Practice test cube', capabilities: { facelets: true } }; connected(this.connection); receive({ type: 'FACELETS', facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' }); }
    async disconnect() { this.connection = null; }
    async refresh() {}
  }`,
}));
await page.route('**/timer/src/Core/engine.ts*', async route => {
  const response = await route.fetch(), body = await response.text();
  await route.fulfill({ response, body: body.replace('this.record = record;', 'this.record = record; globalThis.testTimer = this;') });
});
try {
  await page.goto(`${base}/options/`);
  await page.getByLabel('Import solve CSV files').setInputFiles(join('smartcubeanalyzer', 'public', 'demo', 'cfop-small.csv'));
  await expect(page.locator('[aria-labelledby="import-heading"]').getByRole('status')).toContainText('Imported 467 solves', { timeout: 120000 });
  await page.goto(`${base}/trainer/?case=F2L-1`);
  await expect(page.getByRole('heading', { name: /F2L 1 drill/ })).toBeVisible();
  await expect(page.locator('.trainer-practice')).toHaveAttribute('data-case', 'F2L-1');
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const importedSession = await page.evaluate(async () => {
    const { readSolves } = await import('/timer/src/Data/storage.ts');
    return (await readSolves())[0].session;
  });
  await page.getByRole('combobox', { name: 'Session', exact: true }).selectOption(importedSession);
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Show all sessions', exact: true }).check();
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  const history = page.getByRole('table', { name: 'Solve history' });
  await expect(page.getByText('Full history', { exact: true })).toHaveCount(0);
  await expect(history.getByRole('columnheader')).toHaveText(['Solve', 'Time', 'Turns', 'TPS', 'Date']);
  const trends = page.locator('.metric-trend');
  await expect(trends).toHaveCount(4);
  expect(await trends.evaluateAll(nodes => nodes.every(node => node.getAttribute('aria-label')?.includes('previous')))).toBe(true);
  await page.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
  await page.getByText('Try simulated cube', { exact: true }).evaluate(button => button.click());
  await page.evaluate(async () => {
    const { SOLVED } = await import('/timer/src/Core/puzzle.ts');
    const timer = globalThis.testTimer;
    timer.connect('Test cube'); timer.synchronize(SOLVED); timer.prepare('R U2');
    const start = performance.now();
    ['R', 'U2', 'U2', "R'"].forEach((move, index) => timer.turn({ move, hostTime: start + index * 1000, localTimestamp: start + index * 1000, cubeTimestamp: null }));
  });
  await expect(page.locator('.timer-feedback')).toBeVisible();
  await expect(page.locator('.timer-feedback')).not.toContainText('Analyzing solve mistakes', { timeout: 30000 });
  await expect(page.getByRole('button', { name: 'Dismiss personal best', exact: true }).first()).toBeVisible();
  const notifications = page.getByRole('button', { name: /^Dismiss (personal best|daily streak)$/ });
  while (await notifications.count()) await notifications.first().click();
  await expect(page.locator('.trail-compact [data-comparison]')).toHaveCount(7);
  expect(await page.locator('.trail-compact [data-comparison]').evaluateAll(nodes => nodes.every(node =>
    ['faster', 'slower', 'equal'].includes(node.dataset.comparison) && node.getAttribute('aria-label').includes('recent 1000')))).toBe(true);
  expect(await page.locator('.timer-feedback').evaluate(node => node.previousElementSibling.classList.contains('timer-timeline'))).toBe(true);
  for (const width of [1440, 1024, 960, 768, 720, 640, 576, 575, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.timer-feedback')).toBeVisible();
    await expect(page.locator('.timer-hero twisty-player')).toBeVisible();
    const cubeSize = await page.locator('.timer-hero twisty-player').boundingBox();
    expect(cubeSize.height).toBeLessThanOrEqual(160);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `Timer overflow at ${width}px` }).toBe(true);
    expect(await page.locator('.timer-records table').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThan(width <= 720 ? 12.8 : 16);
    const recent = page.getByRole('region', { name: 'Recent solves', exact: true });
    await expect(recent).toBeVisible();
    await expect(recent.getByRole('button')).toHaveCount(5);
    const { recordsBox, recentBox, buttons } = await page.evaluate(() => {
      const bounds = node => { const { x, y, width, height } = node.getBoundingClientRect(); return { x, y, width, height }; };
      return { recordsBox: bounds(document.querySelector('.timer-records')), recentBox: bounds(document.querySelector('.timer-recent')),
        buttons: [...document.querySelectorAll('.timer-recent button')].map(bounds) };
    });
    if (width > 575) {
      expect(recentBox.x).toBeGreaterThanOrEqual(recordsBox.x + recordsBox.width);
      expect(Math.abs(recentBox.y - recordsBox.y)).toBeLessThan(1);
      expect(Math.abs(recentBox.height - recordsBox.height)).toBeLessThan(1);
      expect(buttons.every((button, index) => Math.abs(button.x - buttons[0].x) < 1 &&
        (!index || button.y >= buttons[index - 1].y + buttons[index - 1].height))).toBe(true);
    } else {
      expect(recentBox.y).toBeGreaterThanOrEqual(recordsBox.y + recordsBox.height);
      expect(buttons.every(button => Math.abs(button.y - buttons[0].y) < 1 && button.height >= 44)).toBe(true);
    }
  }
  await page.getByRole('region', { name: 'Recent solves', exact: true }).getByRole('button').first().click();
  await expect(page.getByRole('dialog', { name: 'Solve replay', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close replay', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Show all sessions', exact: true }).uncheck();
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  await expect(history.getByRole('columnheader')).toHaveText(['Solve', 'Time', 'Turns', 'TPS', 'Date']);
  await page.getByRole('link', { name: 'Options', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Show all sessions', exact: true }).check();
  await page.getByRole('link', { name: 'Timer', exact: true }).click();
  let linked = false;
  for (let index = 1; index < 12 && !linked; index++) {
    await history.locator('tbody tr').nth(index).locator('td button').first().click();
    const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
    await expect(replay.locator('.replay-scramble')).toBeVisible();
    expect(await replay.locator('.replay-scramble').evaluate(node => node.tagName)).toBe('DIV');
    const insights = replay.locator('details').filter({ has: page.locator('summary', { hasText: /^Insights/ }) });
    expect(await insights.getAttribute('open')).toBeNull();
    await insights.locator('summary').click();
    await expect(replay.getByRole('region', { name: 'Solve mistakes', exact: true })).not.toContainText('Analyzing solve mistakes', { timeout: 30000 });
    const link = replay.locator('[aria-label="Solve mistakes"] button.btn-link:not(.info-tip)').first();
    if (await link.count()) {
      const address = page.url();
      await link.click();
      const practice = page.locator('.mistake-practice-dialog');
      await expect(practice).toBeVisible();
      await expect(practice.locator('.trainer-practice[data-case]')).toBeVisible();
      await expect(practice.getByRole('button', { name: 'Back to cases', exact: true })).toHaveCount(0);
      await expect(practice.locator('.trainer-picker')).not.toBeVisible();
      await expect(practice.getByRole('button', { name: 'Start practice', exact: true })).toBeDisabled();
      expect(page.url()).toBe(address);
      await practice.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
      const setup = practice.getByRole('dialog', { name: /^Bluetooth cube setup/ });
      await expect(setup).toBeVisible();
      await setup.getByRole('button', { name: 'Connect cube', exact: true }).click();
      await expect(setup).not.toBeVisible();
      await expect(practice.getByRole('button', { name: 'Stop drill', exact: true })).toBeVisible();
      await practice.getByRole('button', { name: 'Bluetooth cube setup', exact: true }).click();
      await expect(setup).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(setup).not.toBeVisible();
      await expect(practice).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(practice).toHaveCount(0);
      await expect(replay).toBeVisible();
      await expect(link).toBeFocused();
      await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
      linked = true;
    } else await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  }
  expect(linked).toBe(true);

  await page.goto(`${base}/analyzer/`);
  const data = page.getByRole('button', { name: 'Data', exact: true });
  await expect(data).toBeEnabled({ timeout: 60000 });
  const phases = page.getByRole('group', { name: 'Solve phase', exact: true });
  await expect(phases.getByRole('button')).toHaveText(['Full', 'Cross+1', 'F2L', 'OLL', 'PLL']);
  expect(await phases.evaluate(node => parseFloat(getComputedStyle(node).borderTopWidth))).toBeGreaterThan(0);
  for (const width of [1440, 720, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await data.click();
    const modal = page.getByRole('dialog', { name: 'Load analysis data', exact: true });
    await expect(modal.getByRole('button', { name: 'Close data', exact: true })).toBeFocused();
    await expect(modal.getByLabel('CSV files', { exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'My saved solves', exact: true })).toBeVisible();
    const bounds = await modal.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(data).toBeFocused();
    const navigation = page.getByRole('navigation', { name: 'Analysis views', exact: true });
    if (width >= 720) expect(new Set(await navigation.getByRole('button').evaluateAll(nodes => nodes.map(node => node.offsetTop))).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await data.click();
  const modal = page.getByRole('dialog', { name: 'Load analysis data', exact: true });
  const demos = modal.locator('details').filter({ has: page.locator('summary', { hasText: /^Demo data$/ }) });
  expect(await demos.getAttribute('open')).toBeNull();
  const help = modal.locator('details').filter({ has: page.locator('summary', { hasText: /^CSV help$/ }) });
  await help.locator('summary').click();
  await expect(help.getByRole('heading', { name: 'From Cubeast', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await phases.getByRole('button', { name: 'F2L', exact: true }).click();
  await page.getByRole('button', { name: 'Cases', exact: true }).click();
  const practice = page.getByRole('region', { name: 'Algorithm Practice', exact: true });
  await expect(practice.getByRole('columnheader')).toHaveText(['Case', 'Failure %', 'Avg Time (s)', 'Failed', 'Total', 'Avg Moves', 'Expected', 'Avg Wasted']);
  expect(await practice.getByRole('columnheader').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth + 1))).toBe(true);
  expect(await practice.locator('.algo-case-link').evaluateAll(nodes => nodes.length > 0 && nodes.every(node => node.scrollWidth <= node.clientWidth + 1))).toBe(true);
  expect(await practice.locator('.chart-heading').evaluate(node => parseFloat(getComputedStyle(node).paddingLeft))).toBeGreaterThan(0);
  expect(await practice.locator('.chart-heading h2 > span').evaluate(node => parseFloat(getComputedStyle(node).marginLeft))).toBeLessThanOrEqual(2);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/database/`);
  await expect(page.getByRole('heading', { name: 'Algorithm database', exact: true })).toBeVisible();
  async function swipe(selector, vertical = false) {
    await page.locator(selector).first().evaluate((target, vertical) => {
      const touch = (x, y) => new Touch({ identifier: 1, target, clientX: x, clientY: y });
      target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touch(250, 300)] }));
      if (vertical) target.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [touch(240, 350)] }));
      target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, changedTouches: [touch(100, 305)] }));
    }, vertical);
  }
  await swipe('.database-main', true);
  await expect(page).toHaveURL(`${base}/database/`);
  await swipe('.database-group > summary');
  await expect(page).toHaveURL(`${base}/database/`);
  await swipe('.database-main');
  await expect(page).toHaveURL(`${base}/options/`);
  expect(errors).toEqual([]);
  console.log('PASS compact timer, visible worst feedback, matching history columns, accessible trends, replay training links, and Database swipe guards');
} finally {
  await context.close();
  await browser.close();
}
