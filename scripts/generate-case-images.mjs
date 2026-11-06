import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
try {
  const page = await browser.newPage();
  await page.goto(process.env.SITE_URL ?? 'http://127.0.0.1:5180/');
  const images = await page.evaluate(async () => {
    const [{ illustrateCases }, { loadCube }] = await Promise.all([
      import('/src/database/algorithms.ts'), import('/timer/src/puzzle.ts'),
    ]);
    return Object.fromEntries(illustrateCases(await loadCube()).map(({ category, id, facelets, visibleStickers }) =>
      [`${category}-${id}`, { facelets, visibleStickers }]));
  });
  writeFileSync(new URL('../src/database/caseImages.json', import.meta.url), JSON.stringify(images, null, 2) + '\n');
} finally { await browser.close(); }
