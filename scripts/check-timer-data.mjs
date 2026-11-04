import { createRequire } from 'node:module';
import { join } from 'node:path';

const { chromium, expect } = createRequire(new URL('../timer/package.json', import.meta.url))('@playwright/test');
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const base = 'http://127.0.0.1:4173';

async function database(page, records, removeIds = []) {
  return page.evaluate(({ records, removeIds }) => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('solves', records || removeIds.length ? 'readwrite' : 'readonly');
      const store = tx.objectStore('solves');
      records?.forEach(record => store.put(record));
      removeIds.forEach(id => store.delete(id));
      const read = store.getAll();
      tx.oncomplete = () => { db.close(); resolve(read.result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }), { records, removeIds });
}

async function checkAverage(average, numbers) {
  const table = average.getByRole('table', { name: 'Average solves' });
  const labels = ['Solve', 'Time', 'Turns', 'TPS', 'View'];
  await expect(table.locator('thead th')).toHaveText(labels);
  await expect(table.locator('tbody th')).toHaveText(numbers.map(String));
  await expect(average.locator('s, del')).toHaveCount(0);
  await expect(average.getByText(/chopped solve-time|sorted by|excludes the|times reflect/i)).toHaveCount(0);
  await expect(average.locator('[title^="Excluded "]')).toHaveCount(2);
  for (const [label, index] of [['Time', 1], ['Turns', 2], ['TPS', 3], ['View', 0], ['Solve', 0]]) {
    const header = table.getByRole('columnheader', { name: label, exact: true });
    for (const direction of ['ascending', 'descending']) {
      await header.getByRole('button').click();
      await expect(header).toHaveAttribute('aria-sort', direction);
      const values = await table.locator('tbody tr').evaluateAll((rows, index) => rows.map(row => {
        const text = row.children[index].textContent;
        return text === '--' ? null : text.includes('DNF') ? Infinity : Number(text.match(/[\d.]+/)[0]);
      }), index);
      const reported = values.filter(value => value !== null);
      expect(reported).toEqual([...reported].sort((a, b) => direction === 'ascending' ? a - b : b - a));
      expect((await table.locator('tbody th').allTextContents()).map(Number).sort((a, b) => a - b)).toEqual(numbers);
    }
  }
  await table.getByRole('button', { name: 'Solve', exact: true }).click();
  await expect(table.locator('tbody th')).toHaveText(numbers.map(String));
}

async function clickChartPoint(page, title, datasetIndex = 0, index = -1) {
  const canvas = page.getByRole('region', { name: title, exact: true }).locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  const point = await canvas.evaluate((canvas, { datasetIndex, index }) => {
    let fiber = canvas[Object.keys(canvas).find(key => key.startsWith('__reactFiber$'))];
    while (fiber) {
      for (let hook = fiber.memoizedState; hook; hook = hook.next) {
        const chart = hook.memoizedState?.current;
        if (chart?.canvas !== canvas) continue;
        const data = chart.data.datasets[datasetIndex].data;
        const at = typeof index === 'string' ? chart.data.labels.indexOf(index) : index < 0 ? data.length + index : index;
        if (at < 0) throw new Error(`Missing chart point ${index}`);
        return { ...chart.getDatasetMeta(datasetIndex).data[at].getCenterPoint(true), value: data[at], label: chart.data.labels?.[at] };
      }
      fiber = fiber.return;
    }
    throw new Error('Chart instance not found');
  }, { datasetIndex, index });
  await canvas.click({ position: { x: point.x, y: point.y } });
  return point;
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(`Browser error: ${error.message}`); });
  await page.goto(`${base}/smartcubeanalyzer/`);
  const load = page.getByRole('button', { name: 'Display My Stats!', exact: true });
  const demo = page.getByRole('button', { name: 'Demo Data', exact: true });
  const choose = page.getByRole('button', { name: 'Choose CSV File', exact: true });
  const displayCsv = page.getByRole('button', { name: 'Display CSV Stats', exact: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const boxes = await Promise.all([load, demo, choose, displayCsv].map(control => control.boundingBox()));
    const [timerBox, demoBox, chooseBox, csvBox] = boxes;
    expect(boxes.every(box => box && box.x >= 0 && box.x + box.width <= width)).toBe(true);
    expect(timerBox.y).toBe(demoBox.y);
    expect(chooseBox.y).toBe(csvBox.y);
    expect(chooseBox.y).toBeGreaterThanOrEqual(timerBox.y + timerBox.height);
    expect(demoBox.x).toBeGreaterThan(timerBox.x);
    expect(csvBox.x).toBeGreaterThan(chooseBox.x);
    expect(await demo.evaluate(button => getComputedStyle(button).backgroundColor)).toBe('rgb(13, 110, 253)');
    expect(await load.evaluate(button => getComputedStyle(button).backgroundColor)).toBe('rgb(45, 128, 112)');
  }
  await expect(page.getByText('Read saved Timer solves', { exact: false })).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load.click();
  await expect(page.getByRole('alert')).toContainText('No saved Timer solves found');

  const chooserEvent = page.waitForEvent('filechooser');
  await choose.click();
  await (await chooserEvent).setFiles({
    name: 'my-solves.csv', mimeType: 'text/csv',
    buffer: Buffer.from('id,date,dnf,time,solving_method\ncsv,2026-01-01 00:00:00 UTC,false,12000,CFOP'),
  });
  await expect(choose).toContainText('my-solves.csv');
  await displayCsv.click();
  await expect(page.getByRole('button', { name: 'Open filters', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(await database(page)).toEqual([]);

  await page.goto(`${base}/timer/`);
  const simulator = page.getByText('Try simulated cube', { exact: true });
  await expect(simulator).toBeEnabled({ timeout: 60000 });
  await simulator.evaluate(button => button.click());
  const guided = page.getByRole('button', { name: 'Perform guided move', exact: true });
  const solve = page.getByRole('button', { name: 'Simulate solve', exact: true });
  await expect(guided).toBeEnabled({ timeout: 60000 });
  for (let i = 0; i < 100 && !await solve.isEnabled(); i++) await guided.click();
  await expect(solve).toBeEnabled();
  await solve.click();
  await expect(page.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(1, { timeout: 30000 });
  await page.waitForTimeout(1000);
  const [seed] = await database(page);
  expect(seed.status).toBe('complete');
  const modalSamples = [10000, 2000, 12000, 3000, 4000].map((duration, i) => ({
    ...seed, id: i ? `shared-modal-${i}` : seed.id, duration, penalty: i === 1 ? 2000 : undefined,
    penaltyReason: i === 1 ? 'over-turn' : undefined,
    createdAt: new Date(Date.now() - (10 - i) * 60000).toISOString(),
    moves: [...seed.moves, ...Array.from({ length: i * 2 }, (_, index) => ({ ...seed.moves[0], move: index % 2 ? "R'" : 'R' }))]
      .map((move, index, moves) => ({ ...move, elapsed: duration * index / (moves.length - 1) })),
  }));
  await database(page, modalSamples);
  await page.reload();
  await page.getByRole('button', { name: 'View current Ao5', exact: true }).click();
  const timerAverage = page.locator('dialog.average-dialog');
  await expect(timerAverage).toBeVisible();
  await checkAverage(timerAverage, [1, 2, 3, 4, 5]);
  const timerStyle = await timerAverage.evaluate(dialog => {
    const style = getComputedStyle(dialog);
    return [style.backgroundColor, style.color, style.padding, style.borderRadius, getComputedStyle(dialog.querySelector('h2')).fontSize];
  });
  await page.getByRole('button', { name: 'Close average', exact: true }).click();
  await database(page, [seed], modalSamples.slice(1).map(solve => solve.id));
  const session = 'Practice, "Summer"\nEvening [';
  const samples = [12000, 14000, 16000, 18000, 20000, 22000].map((duration, i) => ({
    ...seed, id: i === 0 ? seed.id : `timer-data-${i}`, duration,
    penalty: i === 2 ? 2000 : undefined, session: i % 2 ? 'Other' : session,
    createdAt: new Date(Date.now() - (10 - i) * 60000).toISOString(),
    moves: seed.moves.map(move => {
      const elapsed = move.elapsed * duration / seed.duration;
      return { ...move, elapsed, hostTime: 1000 + elapsed, localTimestamp: 1000 + elapsed, cubeTimestamp: null };
    }),
  }));
  samples.push({ ...samples[0], id: 'timer-data-dnf', status: 'incomplete', reason: 'Stopped, "early"' });
  samples.push({ ...samples[0], id: 'timer-data-active', status: 'active' });
  const before = await database(page, samples);
  await page.goto(`${base}/smartcubeanalyzer/`);
  await load.click();
  const filters = page.getByRole('button', { name: 'Open filters', exact: true });
  await expect(filters).toBeVisible({ timeout: 60000 });
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.locator('.clickable-grid').getByRole('gridcell', { name: '12.000', exact: true })).toBeVisible();
  expect(await database(page)).toEqual(before);
  await filters.click();
  await expect(page.getByText('Showing 7 / 7 solves', { exact: false })).toBeVisible();
  const sessions = page.locator('.offcanvas.show .card').filter({ has: page.getByRole('heading', { name: /Which Sessions/ }) });
  await sessions.locator('.dropdown-heading').click();
  expect(await sessions.textContent()).toContain(session);
  await sessions.locator('.dropdown-heading').click();
  const sources = page.locator('.offcanvas.show .card').filter({ has: page.getByRole('heading', { name: /^Source/ }) });
  await sources.locator('.dropdown-heading').click();
  await sources.getByText('Timer', { exact: true }).click();
  await expect(page.getByText('Showing 0 / 7 solves', { exact: false })).toBeVisible();
  await sources.getByText('Timer', { exact: true }).click();
  await expect(page.getByText('Showing 7 / 7 solves', { exact: false })).toBeVisible();
  await page.locator('.offcanvas.show .btn-close').click();

  const updated = await database(page, [{ ...samples[1], id: 'timer-data-new', createdAt: new Date().toISOString() }]);
  await load.click();
  await expect(load).toBeEnabled();
  await filters.click();
  await expect(page.getByText('Showing 8 / 8 solves', { exact: false })).toBeVisible();
  await page.locator('.offcanvas.show .btn-close').click();
  expect(await database(page)).toEqual(updated);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(load).toBeVisible();
    const box = await load.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  let popups = 0;
  page.on('popup', () => popups++);
  await page.locator('.clickable-grid').getByRole('gridcell', { name: '12.000', exact: true }).click();
  const replay = page.getByRole('dialog', { name: 'Solve replay', exact: true });
  await expect(replay).toBeVisible({ timeout: 60000 });
  await expect(page.getByLabel('Solve ID', { exact: true })).toContainText(seed.id);
  await page.getByRole('button', { name: 'Next move', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Replay move', exact: true })).toHaveValue('1');
  await page.keyboard.press('Escape');
  await expect(replay).toHaveCount(0);
  await expect(page).toHaveURL(`${base}/smartcubeanalyzer/`);
  expect(popups).toBe(0);
  expect(await database(page)).toEqual(updated);
  for (const [width, theme] of [[1440, 'dark'], [320, 'light']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole('button', { name: theme === 'dark' ? 'Dark' : 'Light', exact: true }).click();
    const selected = await clickChartPoint(page, 'Average Time');
    const average = page.getByRole('dialog', { name: `Ao5: ${Number(selected.value).toFixed(3)}s`, exact: true });
    await expect(average).toBeVisible();
    await expect(average).toHaveCSS('opacity', '1');
    await expect(average.getByRole('table', { name: 'Average solves' }).locator('tbody tr')).toHaveCount(5);
    await checkAverage(average, Array.from({ length: 5 }, (_, i) => Number(selected.label) - 4 + i));
    expect(await average.evaluate(dialog => dialog.getBoundingClientRect().width <= innerWidth)).toBe(true);
    if (theme === 'dark') {
      expect(await average.evaluate(dialog => {
        const style = getComputedStyle(dialog);
        return [style.backgroundColor, style.color, style.padding, style.borderRadius, getComputedStyle(dialog.querySelector('h2')).fontSize];
      })).toEqual(timerStyle);
      await average.locator('tbody button').first().click();
      await expect(replay).toBeVisible();
      await page.getByRole('button', { name: 'Next move', exact: true }).click();
      await page.getByRole('button', { name: 'Close replay', exact: true }).click();
      await expect(replay).toHaveCount(0);
      await expect(average).toBeVisible();
      await average.getByRole('button', { name: 'Close average', exact: true }).click();
    } else {
      if (process.env.CUBERPLUS_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.CUBERPLUS_SCREENSHOT_DIR, 'analyzer-average-mobile.png'), animations: 'disabled' });
      await page.keyboard.press('Escape');
    }
    await expect(average).toHaveCount(0);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const record = await clickChartPoint(page, 'History of Records', 1);
  await expect(page.getByRole('dialog', { name: `Ao5: ${record.value.y.toFixed(3)}s`, exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await database(page)).toEqual(updated);
  await page.evaluate(id => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('solves', 'readwrite');
      tx.objectStore('solves').delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
    };
  }), seed.id);
  await page.locator('.clickable-grid').getByRole('gridcell', { name: '12.000', exact: true }).click();
  await expect(replay.getByRole('alert')).toHaveText('This solve is no longer saved in Timer.');
  await page.getByRole('button', { name: 'Close replay', exact: true }).click();
  await expect(replay).toHaveCount(0);
  await expect(page).toHaveURL(`${base}/smartcubeanalyzer/`);
  expect(popups).toBe(0);
  expect(errors).toEqual([]);
  const csvChooser = page.waitForEvent('filechooser');
  await choose.click();
  await (await csvChooser).setFiles({
    name: 'numbered-solves.csv', mimeType: 'text/csv',
    buffer: Buffer.from('id,date,dnf,time,solving_method\n' + Array.from({ length: 80 }, (_, i) =>
      `numbered-${i},${new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString().replace('T', ' ').replace('.000Z', ' UTC')},false,${12000 + i * 100},CFOP`).join('\n')),
  });
  await displayCsv.click();
  await filters.click();
  await page.locator('#autoWindowSize').press('Space');
  await page.locator('#windowSize').fill('5');
  await page.locator('.offcanvas.show .btn-close').click();
  const numberedPoint = await clickChartPoint(page, 'Average Time', 0, '73');
  const numberedAverage = page.getByRole('dialog', { name: `Ao5: ${Number(numberedPoint.value).toFixed(3)}s`, exact: true });
  await expect(numberedAverage.locator('tbody th')).toHaveText(['69', '70', '71', '72', '73']);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
  console.log('PASS shared Timer/Analyzer averages: sortable Solve/Time/Turns/TPS/View, real chart solve numbers 69-73, preserved chop colors without strikethrough, identical dialog styling, inline replay, readonly loading, Escape, light/dark and mobile');
} finally {
  await browser.close();
}
