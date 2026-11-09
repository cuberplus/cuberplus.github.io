import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const errors = [];
async function expectSpaced(moves) {
  const boxes = await moves.evaluateAll(elements => elements.map(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const { left, right, top } = range.getBoundingClientRect();
    return { left, right, top };
  }));
  expect(boxes.length).toBeGreaterThan(1);
  expect(boxes.slice(1).every((box, i) => box.top > boxes[i].top || box.left > boxes[i].right)).toBe(true);
  await expect(moves.first()).toHaveCSS('display', 'inline-block');
}
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/timer/`);
    if (width === 390) {
      await page.evaluate(async () => { await navigator.serviceWorker.ready; });
      await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toBe(`${base}/sw.js`);
      await context.setOffline(true);
      await page.reload();
    }
    const simulator = page.getByText('Try simulated cube', { exact: true });
    await expect(simulator).toBeEnabled({ timeout: 60000 });
    const accent = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--cp-accent)';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    await simulator.evaluate(button => button.click());
    const guided = page.getByRole('button', { name: 'Perform guided move', exact: true });
    await expect(guided).toBeEnabled({ timeout: 60000 });
    // Seed a double turn deterministically; all turns below go through the UI.
    await page.locator('.site-page--timer .cuberplus-page').evaluate(node => {
      let fiber = node[Object.keys(node).find(key => key.startsWith('__reactFiber$'))];
      while (fiber) {
        for (let hook = fiber.memoizedState; hook; hook = hook.next) {
          const value = hook.memoizedState?.current;
          if (typeof value?.prepare === 'function' && typeof value?.turn === 'function') {
            value.prepare('R2 U F');
            return;
          }
        }
        fiber = fiber.return;
      }
      throw new Error('Timer engine not found');
    });
    const original = page.getByRole('group', { name: 'Original scramble', exact: true });
    const corrections = page.getByRole('group', { name: 'Correction moves', exact: true });
    const route = page.getByRole('group', { name: 'Path to solved', exact: true });
    await expect(original.locator('.move')).toHaveText(['R2', 'U', 'F']);
    await expectSpaced(original.locator('.move'));
    await expect(original.locator('.current')).toHaveCSS('background-color', 'rgb(101, 211, 176)');
    await page.getByRole('button', { name: 'R', exact: true }).click();
    await expect(original.locator('.current.partial')).toHaveText('R2');
    await expect(original.locator('.partial')).toHaveCSS('background-color', 'rgb(245, 185, 66)');
    await page.getByRole('button', { name: 'R', exact: true }).click();
    await expect(original.locator('.done')).toHaveText('R2');
    await expect(original.locator('.done')).toHaveCSS('color', accent);
    await page.getByRole('button', { name: 'F', exact: true }).click();
    await expect(original.locator('.move')).toHaveText(['R2']);
    await expect(original.locator('.done')).toHaveCSS('color', accent);
    await expect(corrections.locator('.move')).toHaveText(["F'"]);
    await expect(corrections.locator('.current')).toHaveCSS('background-color', 'rgb(220, 53, 69)');
    await guided.click();
    await expect(corrections).toHaveCount(0);
    await expect(original.locator('.move')).toHaveText(['R2', 'U', 'F']);
    await expect(original.locator('.current')).toHaveText('U');
    // Ten off-track moves must still replace the scramble with a real solver route.
    for (let i = 0; i < 9; i++) await page.getByRole('button', { name: i % 2 ? 'D' : 'L', exact: true }).click();
    await expect(corrections.locator('.move')).toHaveCount(9);
    await expectSpaced(corrections.locator('.move'));
    await page.getByRole('button', { name: 'D', exact: true }).click();
    await expect(guided).toBeEnabled({ timeout: 60000 });
    await expect(route).toBeVisible();
    await expect(original).toHaveCount(0);
    await expect(corrections).toHaveCount(0);
    await expectSpaced(route.locator('.move'));
    await guided.click();
    await expect(route.locator('.done').first()).toHaveCSS('color', accent);
    const remaining = await route.locator('.move').allTextContents();
    const completed = await route.locator('.done').allTextContents();
    const next = await route.locator('.current').innerText();
    await page.getByRole('button', { name: 'RL'.includes(next[0]) ? 'F' : 'R', exact: true }).click();
    await expect(route.locator('.move')).toHaveText(completed);
    await expect(route.locator('.done').first()).toHaveCSS('color', accent);
    await expect(corrections.locator('.current')).toHaveCSS('background-color', 'rgb(220, 53, 69)');
    await guided.click();
    await expect(route.locator('.move')).toHaveText(remaining);
    await expect(route.locator('.current')).toHaveText(next);
    const simulate = page.getByRole('button', { name: 'Simulate solve', exact: true });
    for (let i = 0; i < 100 && !await simulate.isEnabled(); i++) await guided.click();
    await expect(simulate).toBeEnabled();
    await expect(route).toHaveCount(0);
    await expect(original.locator('.done')).toHaveText(['R2', 'U', 'F']);
    for (const move of await original.locator('.done').all()) await expect(move).toHaveCSS('color', accent);
    await context.close();
    console.log(`PASS scramble spacing, partial/completed colors, corrections and recovery at ${width}px${width === 390 ? ' (offline PWA)' : ''}`);
  }
  expect(errors).toEqual([]);
} finally {
  await browser.close();
}
