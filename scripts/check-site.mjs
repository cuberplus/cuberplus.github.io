import { chromium, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const APP_VERSION = readFileSync(new URL('../shared/navigation/index.tsx', import.meta.url), 'utf8').match(/APP_VERSION = '([^']+)'/)[1];
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const routes = ['/', '/timer/', '/smartcubeanalyzer/', '/scrambler/'];
const links = [['Home', '/'], ['Timer', '/timer/'], ['Smartcube Analyzer', '/smartcubeanalyzer/'], ['Scrambler', '/scrambler/']];
const errors = [];

try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 1024, 720, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    let reference;
    let footerReference;
    for (const route of routes) {
      await page.goto(`${base}${route}`);
      const nav = page.getByRole('navigation', { name: 'CuberPlus', exact: true });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole('link')).toHaveCount(4);
      for (const [name, href] of links) {
        const link = nav.getByRole('link', { name, exact: true });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', href);
        const box = await link.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('href', route);
      const geometry = await page.locator('.cuberplus-navigation:visible').evaluate(element => {
        const brand = element.querySelector('.cuberplus-brand');
        const style = getComputedStyle(brand);
        const rect = node => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return [x, y, width, height].map(value => Math.round(value * 100) / 100);
        };
        return { brand: rect(brand), font: style.font, icons: [...element.querySelectorAll('nav a')].map(rect) };
      });
      reference ??= geometry;
      expect(geometry).toEqual(reference);
      expect(geometry.brand[0]).toBe(width <= 720 ? 12 : 24);
      expect(geometry.brand[1]).toBe(width <= 720 ? 16 : 20);
      await expect(page.locator('.cuberplus-brand:visible')).toHaveCSS('font-size', '28px');
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 20, 30)');
      await expect(page.locator('.cuberplus-header:visible')).toHaveCSS('background-color', 'rgb(16, 20, 30)');
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#10141e');
      const controls = page.locator('.cuberplus-header-controls, .cuberplus-header > .local-badge');
      if (await controls.count()) {
        const rightInset = await controls.evaluate(element => document.documentElement.clientWidth - element.getBoundingClientRect().right);
        expect(rightInset).toBeCloseTo(width <= 720 ? 12 : 24, 0);
      }
      const panel = page.locator('.tool-card, .settings-panel, .card, .timer-panel').first();
      await expect(panel).toHaveCSS('background-color', 'rgb(24, 31, 45)');
      await expect(panel).toHaveCSS('border-radius', '16px');
      const footer = page.getByRole('contentinfo');
      await expect(footer).toHaveCount(1);
      expect(await footer.textContent()).toBe(`CuberPlus ${APP_VERSION}`);
      await footer.scrollIntoViewIfNeeded();
      const footerGeometry = await footer.evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          center: Math.round(text.x + text.width / 2 - document.documentElement.clientWidth / 2) || 0,
          bottom: Math.round(document.documentElement.scrollHeight - (element.getBoundingClientRect().bottom + scrollY)) || 0,
          font: style.font, color: style.color, padding: style.padding,
          afterContent: element.previousElementSibling.getBoundingClientRect().bottom <= element.getBoundingClientRect().top,
          fillsViewport: document.documentElement.scrollHeight >= innerHeight,
        };
      });
      footerReference ??= footerGeometry;
      expect(footerGeometry).toEqual(footerReference);
      expect(footerGeometry).toMatchObject({ center: 0, bottom: 0, padding: '24px', afterContent: true, fillsViewport: true });
      await page.evaluate(() => scrollTo(0, 0));
      console.log(`PASS matching header and Timer palette: ${route} at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  const cards = page.locator('.tool-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toHaveAttribute('href', '/timer/');
  await expect(cards.first().getByRole('heading', { name: 'Timer', exact: true })).toBeVisible();
  expect(await cards.first().getByRole('img').evaluate(image => image.complete && image.naturalWidth === 1440 && image.naturalHeight === 900)).toBe(true);
  await cards.first().click();
  await expect(page).toHaveURL(`${base}/timer/`);
  await page.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name: 'Home', exact: true }).click();
  for (const [name, route] of [...links.slice(1), links[0]]) {
    await page.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(`${base}${route}`);
  }
  await page.goto(`${base}/timer/`);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.goto(`${base}/smartcubeanalyzer/`);
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(243, 246, 250)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f3f6fa');
  await expect(page.locator('.card').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('contentinfo')).toHaveCSS('color', 'rgb(88, 103, 123)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await page.getByRole('button', { name: 'Demo Data', exact: true }).click();
  const filters = page.getByRole('button', { name: 'Open filters', exact: true });
  await expect(filters).toBeVisible({ timeout: 60000 });
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.locator('.cuberplus-brand:visible')).toHaveCSS('font-size', '28px');
  expect(await filters.evaluate(element => element.closest('.cuberplus-header-controls') !== null)).toBe(true);
  await filters.click();
  await expect(page.locator('.offcanvas.show')).toBeVisible();
  await expect(page.locator('.offcanvas.show')).toHaveCSS('background-color', 'rgb(24, 31, 45)');
  await page.goto(`${base}/scrambler/`);
  await expect(page.getByRole('button', { name: 'Print sheet' })).toBeEnabled({ timeout: 120000 });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.cuberplus-header')).toBeHidden();
  await expect(page.locator('.cuberplus-footer')).toBeHidden();
  await expect(page.locator('.worksheet')).toBeVisible();
  await expect(page.locator('.worksheet-panel')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(errors).toEqual([]);
  console.log('PASS navigation, Timer options, Analyzer themes/charts/filters, and printable Scrambler worksheets');
} finally {
  await browser.close();
}
