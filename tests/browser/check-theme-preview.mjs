import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
try {
  for (const touch of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch });
    await context.addInitScript(() => localStorage.setItem('theme', 'aurora'));
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(`${base}/options/`);
      const general = page.getByRole('button', { name: 'General', exact: true });
      if (await general.getAttribute('aria-expanded') === 'false') await general.click();
      const preview = page.locator('.theme-preview');
      await page.getByRole('button', { name: 'Inferno theme', exact: true }).click();
      await expect(preview).toHaveAttribute('data-theme', 'inferno');
      const image = await preview.evaluate(element => getComputedStyle(element).backgroundImage.match(/url\("([^"]+)"\)/)?.[1]);
      expect(image).toBeTruthy();
      await page.evaluate(source => new Promise((resolve, reject) => {
        const image = new Image(); image.onload = () => resolve(); image.onerror = reject; image.src = source;
      }), image);
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        if (process.env.UX_SCREENSHOT_DIR) {
          mkdirSync(process.env.UX_SCREENSHOT_DIR, { recursive: true });
          await page.locator('.theme-carousel').screenshot({
            path: join(process.env.UX_SCREENSHOT_DIR, `inferno-${touch ? 'touch' : 'mouse'}-${width}.png`),
          });
        }
        const art = await preview.evaluate(element => {
          const style = getComputedStyle(element);
          return { size: style.backgroundSize.split(',').map(value => value.trim()),
            repeat: style.backgroundRepeat.split(',').map(value => value.trim()),
            position: style.backgroundPosition.split(',').map(value => value.trim()) };
        });
        expect(art.size[2], `Inferno image at ${width}px (${touch ? 'touch' : 'mouse'})`).toBe('cover');
        expect(art.repeat[2]).toBe('no-repeat');
        expect(art.position[2]).toBe('50% 50%');
        const controls = await page.locator('.theme-dots button').evaluateAll(elements => elements.map(element => {
          const { x, right, y } = element.getBoundingClientRect(); return { x, right, y };
        }));
        const bounds = await preview.boundingBox();
        expect(controls.every(control => control.x >= bounds.x && control.right <= bounds.x + bounds.width)).toBe(true);
        const rows = [...new Set(controls.map(control => control.y))].map(y => controls.filter(control => control.y === y).length);
        expect(rows.every(count => count === 3 || count === 6)).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      await page.getByRole('button', { name: 'Next theme', exact: true }).click();
      await expect(preview).not.toHaveAttribute('data-theme', 'inferno');
      await expect(preview).not.toHaveCSS('background-size', /cover/);
      await page.getByRole('button', { name: 'Previous theme', exact: true }).click();
      await expect(preview).toHaveAttribute('data-theme', 'inferno');
      await expect(page.getByRole('button', { name: 'Inferno theme', exact: true })).toHaveAttribute('aria-pressed', 'true');
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  }
  console.log('Inferno preview fills its slide without tiling at 1440, 768, 390 and 320px with mouse and touch controls.');
} finally { await browser.close(); }
