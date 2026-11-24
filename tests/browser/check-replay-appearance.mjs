import { chromium, expect } from '@playwright/test';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
async function setFontSize(size) {
  await page.goto(`${base}/options/`);
  await page.getByRole('button', { name: 'General', exact: true }).click();
  await page.getByLabel('Font size', { exact: true }).selectOption(size);
}
try {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const sizes = {};
    for (const size of ['normal', 'small', 'large']) {
      await setFontSize(size);
      await page.goto(`${base}/timer/`);
      const scramble = page.locator('.timer-panel > .scramble');
      await expect(scramble).toBeVisible();
      sizes[size] = await scramble.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
      expect(await scramble.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    expect(sizes.small).toBeLessThan(sizes.normal);
    expect(sizes.large / sizes.normal).toBeGreaterThanOrEqual(1.25);
  }
  await setFontSize('normal');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/timer/`);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByLabel('Replay highlight', { exact: true })).toHaveValue('current');
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  const simulator = page.getByText('Try simulated cube', { exact: true });
  await expect(simulator).toBeEnabled({ timeout: 60000 });
  await simulator.evaluate(button => button.click());
  const guided = page.getByRole('button', { name: 'Perform guided move', exact: true });
  const simulate = page.getByRole('button', { name: 'Simulate solve', exact: true });
  await expect(guided).toBeEnabled({ timeout: 60000 });
  for (let i = 0; i < 100 && !await simulate.isEnabled(); i++) await guided.click();
  await simulate.click();
  const latest = page.getByRole('button', { name: 'View most recent solve', exact: true });
  await expect(latest).toBeVisible({ timeout: 60000 });
  await latest.click();
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const spacing = await replay.locator('summary').evaluateAll(summaries => summaries
      .filter(summary => ['Solution moves', 'Insights', 'Analysis settings'].includes(summary.textContent))
      .map(summary => {
        const section = summary.closest('.replay-section');
        const style = getComputedStyle(section), heading = getComputedStyle(summary);
        return {
          gap: style.marginTop,
          padding: style.paddingTop,
          headingPadding: heading.paddingBlock,
          dividerGap: summary.getBoundingClientRect().top - section.getBoundingClientRect().top,
        };
      }));
    expect(spacing).toHaveLength(3);
    expect(spacing[0]).toEqual(spacing[1]);
    expect(spacing[2]).toEqual(spacing[1]);
    expect(parseFloat(spacing[1].padding)).toBeGreaterThan(0);
    expect(await replay.evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
  }
  await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
  expect(errors).toEqual([]);
  console.log('Replay section spacing, default highlighting, and responsive scramble font scaling passed.');
} finally {
  await browser.close();
}
