import { chromium, expect } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
const tip = page.getByRole('tooltip');
async function fitsViewport() {
  await expect.poll(() => tip.evaluate(element => {
    const box = element.getBoundingClientRect();
    return box.left >= 0 && box.top >= 0 && box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1;
  })).toBe(true);
}
async function dismiss() {
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
}
try {
  await page.goto(`${base}/trainer/`);
  await page.getByRole('button', { name: /Orientation Flashcards$/ }).click();
  const trigger = page.getByRole('heading', { name: /^Orientation Flashcards/ }).locator('.info-tip');
  for (const [width, height, zoom] of [[1200, 900, 1], [320, 240, 1], [390, 320, 1.2], [320, 240, .8]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(zoom => { document.body.style.zoom = String(zoom); }, zoom);
    await trigger.scrollIntoViewIfNeeded();
    const geometry = () => page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight, scrollY]);
    const before = await geometry();
    await trigger.focus();
    await trigger.hover();
    await expect(tip).toBeVisible();
    await fitsViewport();
    expect(await trigger.evaluate(element => {
      const box = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    })).toBe(true);
    expect(await geometry()).toEqual(before);
    expect(await tip.evaluate(element => element.matches(':popover-open'))).toBe(true);
    const content = tip.locator('.info-tooltip-content');
    await tip.hover();
    await page.waitForTimeout(200);
    await expect(tip).toBeVisible();
    if (height < 400) {
      expect(await content.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
      await trigger.press('ArrowDown');
      await expect(content).toBeFocused();
      await content.press('End');
      await expect.poll(() => content.evaluate(element => element.scrollTop + element.clientHeight >= element.scrollHeight - 1)).toBe(true);
      await fitsViewport();
    }
    if (process.env.TOOLTIP_SCREENSHOT && zoom === 1.2) await page.screenshot({ path: process.env.TOOLTIP_SCREENSHOT });
    await dismiss();
    console.log(`PASS tooltip ${width}x${height}, font scale ${zoom}`);
  }
  await page.evaluate(() => { document.body.style.zoom = ''; });
  await page.setViewportSize({ width: 390, height: 400 });
  await page.goto(`${base}/timer/`);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Options', exact: true });
  const modalTrigger = dialog.locator('.info-tip').first();
  await modalTrigger.focus();
  await modalTrigger.hover();
  await expect(tip).toBeVisible();
  await fitsViewport();
  expect(await tip.evaluate(element => !!element.closest('dialog') && element.matches(':popover-open'))).toBe(true);
  expect(await tip.evaluate(element => {
    const box = element.querySelector('.tooltip-inner').getBoundingClientRect();
    return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await dismiss();
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/options/`);
    await page.getByRole('button', { name: 'General', exact: true }).click();
    const control = page.getByLabel('Time precision', { exact: true });
    const heading = page.getByRole('button', { name: 'General', exact: true });
    const inputBox = await control.boundingBox(), headingBox = await heading.boundingBox();
    expect(inputBox.x - headingBox.x).toBeGreaterThanOrEqual(width > 768 ? 47 : 23);
    expect(inputBox.width).toBeLessThanOrEqual(384);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const section = page.locator('.settings-section').filter({ has: page.getByRole('button', { name: 'Break reminder', exact: true }) });
    const help = section.locator('.settings-heading .info-tip');
    for (const expanded of [false, true]) {
      if (expanded) await section.getByRole('button', { name: 'Break reminder', exact: true }).click();
      await help.scrollIntoViewIfNeeded();
      const geometry = () => page.locator('.settings-section').evaluateAll(sections => sections.map(section => {
        const box = section.getBoundingClientRect(); return { top: box.top + scrollY, height: box.height };
      }));
      const before = await geometry();
      await help.hover();
      await expect(tip).toBeVisible();
      expect(await geometry()).toEqual(before);
      await dismiss();
    }
    if (process.env.OPTIONS_LAYOUT_SCREENSHOT && width === 1200) await page.screenshot({ path: process.env.OPTIONS_LAYOUT_SCREENSHOT, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 400 });
  await page.goto(`${base}/trainer/`);
  await page.getByRole('button', { name: /Orientation Flashcards$/ }).click();
  await page.evaluate(() => { HTMLElement.prototype.showPopover = undefined; });
  await trigger.focus();
  await trigger.hover();
  await expect(tip).toBeVisible();
  await fitsViewport();
  await dismiss();
  expect(errors).toEqual([]);
  console.log('Tooltips fit short/mobile viewports and font scales, remain hoverable, scroll fully, escape modal clipping and retain a manual fallback.');
} finally {
  await context.close();
  await browser.close();
}
