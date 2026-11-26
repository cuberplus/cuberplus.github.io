import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:5181';
const screenshots = process.env.NOV25_SCREENSHOTS;
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
async function shot(name) {
  if (!screenshots) return;
  mkdirSync(screenshots, { recursive: true });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: join(screenshots, `${name}.png`) });
}
try {
  await page.goto(base);
  const snapshots = await page.evaluate(async () => {
    const [{ parseCsv }, { loadCube }, { previewSolve }, { saveSolves, averageDetails }, { averageSnapshot }, { singleSnapshot }] = await Promise.all([
      import('/smartcubeanalyzer/src/Data/CsvParser.ts'), import('/timer/src/Core/puzzle.ts'), import('/timer/src/Data/csvImport.ts'),
      import('/timer/src/Data/storage.ts'), import('/timer/src/Components/AverageDetails.tsx'), import('/src/sharing/snapshot.ts'),
    ]);
    const cube = await loadCube(), csv = await (await fetch('/analyzer/demo/cfop-small.csv')).text();
    const candidates = parseCsv(csv, ',', true).filter(solve => !solve.dnf && !solve.isCorrupt && solve.time > 12 && solve.time < 20 &&
      solve.steps.filter(step => step.name).length === 7 && solve.steps.every(step => !step.name || step.time > .2));
    const source = candidates.map(solve => previewSolve({ ...solve, steps: solve.steps.filter(step => step.name) }, cube)).find(solve => solve.moves.length > 30);
    if (!source) throw new Error('No representative CFOP recording found.');
    const history = [];
    for (let day = 0; day < 7; day++) for (let attempt = 0; attempt < 3; attempt++) {
      const solve = structuredClone(source), duration = (18 - attempt * 2 + day / 10) * 1000, factor = duration / solve.duration;
      const date = new Date(); date.setDate(date.getDate() - 6 + day); date.setHours(12, attempt, 0, 0);
      solve.id = `nov25-${day}-${attempt}`; solve.session = 'Default'; solve.createdAt = date.toISOString(); solve.duration = duration;
      solve.moves.forEach(turn => { turn.elapsed *= factor; turn.hostTime = turn.elapsed; });
      solve.imported.date = solve.createdAt; solve.imported.endDate = new Date(date.getTime() + duration).toISOString();
      solve.imported.time = duration / 1000;
      for (const step of solve.imported.steps) for (const key of ['time', 'executionTime', 'recognitionTime', 'preAufTime', 'postAufTime', 'extraLookTime']) {
        if (step[key] !== undefined) step[key] *= factor;
      }
      history.push(solve);
    }
    for (const step of history.at(-1).imported.steps) {
      if (['F2L Slot 1', 'F2L Slot 3'].includes(step.name)) step.extraLookTime = Math.min(1.1, step.executionTime / 2);
    }
    await saveSolves(history);
    return {
      single: await singleSnapshot(history.at(-1)),
      average: await averageSnapshot(averageDetails([...history].reverse(), 5), history),
    };
  });
  await context.route('https://www.googleapis.com/drive/v3/files/**', route =>
    route.fulfill({ json: snapshots[new URL(route.request().url()).pathname.split('/').at(-1)] }));
  await page.goto(`${base}/timer/?solve=nov25-6-2`);
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible({ timeout: 60000 });
  await expect(replay.getByRole('button', { name: 'Delete', exact: true }).locator('svg')).toHaveCount(1);
  await replay.locator('.replay-actions').scrollIntoViewIfNeeded();
  await shot('01-solve-actions');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await replay.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const buttons = await replay.locator('.replay-actions button').evaluateAll(elements => elements.map(element => {
      const { x, y } = element.getBoundingClientRect(); return { x, y };
    }));
    expect(buttons.every(button => Math.abs(button.y - buttons[0].y) < 1), `Replay action wrapping at ${width}px: ${JSON.stringify(buttons)}`).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await replay.getByText('Insights', { exact: true }).click();
  await expect(replay.getByText('F2L Slot 1: Extra Look', { exact: true })).toBeVisible();
  await expect(replay.getByText('F2L Slot 3: Extra Look', { exact: true })).toBeVisible();
  await replay.getByRole('region', { name: 'Solve mistakes', exact: true }).scrollIntoViewIfNeeded();
  await shot('12-extra-look-analysis');
  await replay.getByRole('button', { name: 'Close replay' }).click();
  await expect(page.getByRole('button', { name: 'Export CSV', exact: true }).locator('svg')).toHaveCount(1);
  await page.goto(`${base}/analyzer/`);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 120000 });
  await page.getByRole('button', { name: 'Records', exact: true }).click();
  const streaks = page.getByRole('region', { name: 'Longest Daily Streaks', exact: true });
  await streaks.getByRole('row').filter({ hasText: 'Sub-15' }).getByRole('gridcell').nth(1).click();
  const average = page.locator('dialog.average-dialog');
  await expect(average).toBeVisible();
  await expect(average.locator('tbody tr')).toHaveCount(7);
  await expect(average.getByRole('columnheader', { name: 'Date', exact: true })).toBeVisible();
  const dates = await average.locator('tbody time').allTextContents();
  expect(new Set(dates).size).toBe(7);
  expect(dates.every(date => /^[A-Z][a-z]{2} \d{1,2} '\d{2}$/.test(date))).toBe(true);
  const boxes = await average.evaluate(element => {
    const dialog = element.getBoundingClientRect(), button = element.querySelector('.btn-close').getBoundingClientRect();
    return { top: button.top - dialog.top, right: dialog.right - button.right };
  });
  expect(boxes.top).toBeLessThan(35); expect(boxes.right).toBeLessThan(35);
  await shot('02-daily-streak-dates');
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await average.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await shot('03-daily-streak-mobile');
  await page.keyboard.press('Escape');
  await expect(average).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/share/?id=average`);
  await expect(average).toBeVisible();
  await expect(page.locator('main > p')).toHaveCount(0);
  await shot('04-shared-average');
  await average.getByRole('button', { name: 'Close average' }).click();
  await expect(page).toHaveURL(`${base}/timer/`);
  await page.goto(`${base}/share/?id=single`);
  await expect(replay).toBeVisible();
  await expect(replay.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
  await replay.locator('twisty-player').evaluate(async player => {
    await player.experimentalCurrentThreeJSPuzzleObject();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await shot('05-shared-solve');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(`${base}/timer/`);
  await page.goto(`${base}/options/`);
  const general = page.getByRole('button', { name: 'General', exact: true });
  if (await general.getAttribute('aria-expanded') === 'false') await general.click();
  await expect(page.getByRole('checkbox', { name: 'Daily streak reminders', exact: true })).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Enable background notifications' })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Daily streak reminders', exact: true }).scrollIntoViewIfNeeded();
  await shot('06-options-reminders');
  await page.getByRole('button', { name: 'Mistakes', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Extra Look', exact: true })).toBeChecked();
  await page.getByRole('checkbox', { name: 'F2L: Extra Look', exact: true }).scrollIntoViewIfNeeded();
  await shot('07-extra-look-option');
  await page.getByRole('button', { name: 'Import solves', exact: true }).click();
  await page.getByLabel('Import solve CSV files').locator('..').scrollIntoViewIfNeeded();
  await expect(page.getByLabel('Import solve CSV files').locator('..').locator('svg')).toHaveCount(1);
  await shot('08-import-icon');
  await page.goto(`${base}/timer/?help=mac-address`);
  await page.getByRole('button', { name: 'Set up a cube', exact: true }).click();
  await page.getByRole('button', { name: "Find my cube's MAC address", exact: true }).click();
  await expect(page.getByRole('dialog', { name: /^Find your cube/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Edge address' }).locator('svg')).toHaveCount(1);
  await shot('09-copy-icons');
  await page.getByRole('button', { name: 'Close MAC address help' }).click();
  const simulator = page.getByText('Try simulated cube', { exact: true });
  await expect(simulator).toBeEnabled({ timeout: 60000 });
  await simulator.evaluate(button => button.click());
  const guided = page.getByRole('button', { name: 'Perform guided move', exact: true });
  const simulate = page.getByRole('button', { name: 'Simulate solve', exact: true });
  await expect(guided).toBeEnabled({ timeout: 60000 });
  for (let i = 0; i < 100 && !await simulate.isEnabled(); i++) await guided.click();
  await simulate.click();
  await expect(page.getByRole('button', { name: 'Share streak', exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole('button', { name: 'Share PB', exact: true }).first()).toBeVisible();
  if (screenshots) await page.locator('.pb-notifications').screenshot({ path: join(screenshots, '10-notification-actions.png') });
  await page.getByRole('button', { name: 'Share streak', exact: true }).click();
  const sharing = page.getByRole('dialog', { name: /^Share solves/ });
  await expect(sharing.getByText('1 solve selected', { exact: true })).toBeVisible();
  await sharing.getByRole('button', { name: 'Close sharing' }).click();
  await page.getByRole('button', { name: 'Share PB', exact: true }).first().click();
  await expect(page.getByRole('dialog', { name: /^Share solve/ }).getByText(/\d+ solves? selected/)).toBeVisible();
  await page.getByRole('button', { name: 'Close sharing' }).click();
  await page.getByRole('button', { name: /View Sub-.* streak solves/ }).click();
  await expect(average.getByRole('columnheader', { name: 'Date', exact: true })).toBeVisible();
  await shot('11-timer-streak');
  expect(errors).toEqual([]);
  console.log(`Nov 25 workflows passed; screenshots: ${screenshots ?? 'disabled'}`);
} finally { await browser.close(); }
