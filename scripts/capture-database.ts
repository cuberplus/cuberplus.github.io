import { chromium, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
  const page = await context.newPage();
  await page.goto(`${process.env['SITE_URL'] ?? 'http://127.0.0.1:5180'}/database/`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.database-group > summary').nth(1).click();
  await expect(page.getByRole('img', { name: 'AF2L 1 case', exact: true })).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: fileURLToPath(new URL('../src/Assets/Database.png', import.meta.url)) });
} finally { await browser.close(); }
