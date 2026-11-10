import { chromium, expect } from '@playwright/test';
import { join } from 'node:path';

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const recordings = solves => solves.map(({ analysis, cfop, ...solve }) => solve);

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
  await expect(average.locator('.btn-close')).toHaveCSS('background-size', '16px 16px');
  expect(await average.locator('.btn-close').evaluate(button => {
    const box = button.getBoundingClientRect(); return [box.width, box.height];
  })).toEqual([32, 32]);
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

async function dismissCelebrations(page) {
  for (const name of ['Dismiss personal best', 'Dismiss daily streak']) {
    const buttons = page.getByRole('button', { name, exact: true });
    while (await buttons.count()) await buttons.last().click();
  }
}

async function clickChartPoint(page, title, datasetIndex = 0, index = -1) {
  await expect(page.getByRole('button', { name: 'Display My Stats!', exact: true })).toBeEnabled({ timeout: 60000 });
  const canvas = page.getByRole('region', { name: title, exact: true }).locator('canvas');
  await expect(async () => { await canvas.scrollIntoViewIfNeeded(); }).toPass({ timeout: 15000 });
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
  await page.goto(`${base}/options/`);
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await page.getByRole('combobox', { name: 'Time precision' }).selectOption('3');
  await page.goto(`${base}/smartcubeanalyzer/`);
  const load = page.getByRole('button', { name: 'Display My Stats!', exact: true });
  const demo = page.getByRole('button', { name: 'Demo Data', exact: true });
  const choose = page.getByRole('button', { name: 'Choose CSV File', exact: true });
  const displayCsv = page.getByRole('button', { name: 'Display CSV Stats', exact: true });
  await expect(load).toBeEnabled({ timeout: 60000 });
  await expect(displayCsv).toHaveCount(0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const boxes = await Promise.all([load, demo, choose].map(control => control.boundingBox()));
    const [timerBox, demoBox, chooseBox] = boxes;
    expect(boxes.every(box => box && box.x >= 0 && box.x + box.width <= width)).toBe(true);
    expect(timerBox.y).toBe(demoBox.y);
    expect(chooseBox.y).toBeGreaterThanOrEqual(timerBox.y + timerBox.height);
    expect(demoBox.x).toBeGreaterThan(timerBox.x);
    expect(await demo.evaluate(button => getComputedStyle(button).backgroundColor)).toBe('rgb(13, 110, 253)');
    expect(await load.evaluate(button => getComputedStyle(button).backgroundColor)).toBe('rgb(45, 128, 112)');
  }
  await expect(page.getByText('Read saved Timer solves', { exact: false })).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load.click();
  await expect(page.getByRole('alert').filter({ hasText: 'No saved CuberPlus solves found' })).toBeVisible();

  const chooserEvent = page.waitForEvent('filechooser');
  await choose.click();
  await (await chooserEvent).setFiles([{
    name: 'my-solves.csv', mimeType: 'text/csv',
    buffer: Buffer.from('id,date,dnf,time,solving_method\ncsv,2026-01-01 00:00:00 UTC,false,12000,CFOP'),
  }, {
    name: 'mixed-methods.csv', mimeType: 'text/csv',
    buffer: Buffer.from('id,date,time,solving_method\nblank,2026-01-02 00:00:00 UTC,13000,\nunknown,2026-01-03 00:00:00 UTC,14000,Custom\nroux,2026-01-04 00:00:00 UTC,15000,Roux'),
  }, {
    name: 'acubemy.csv', mimeType: 'text/csv',
    buffer: Buffer.from('solve_id,date,total_time,analysis_type\nacubemy,2026-01-05T00:00:00Z,16000,CFOP'),
  }]);
  await expect(choose).toContainText('my-solves.csv');
  await expect(page.getByRole('button', { name: 'Open filters', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open filters', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Showing 3 \/ 5 solves/ })).toBeVisible();
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
  await expect(page.locator('.trail-tip')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(1, { timeout: 30000 });
  await expect(page.locator('.trail-tip')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Solve mistakes', exact: true })).toContainText(/Worst mistake:|No clear mistakes detected/);
  await page.waitForTimeout(1000);
  const [seed] = await database(page);
  expect(seed.status).toBe('complete');
  expect(seed.appVersion).toMatch(/^\d+\.\d+\.\d+$/);
  await expect(guided).toBeEnabled({ timeout: 30000 });
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
  await expect(page.getByRole('region', { name: 'First F2L Pair', exact: true }).locator('canvas')).toBeVisible();
  await expect(page.locator('.clickable-grid').getByRole('gridcell', { name: '12.000', exact: true })).toBeVisible();
  const analyzed = await database(page);
  expect(analyzed.every(solve => solve.analysis)).toBe(true);
  expect(recordings(analyzed)).toEqual(recordings(before));
  await filters.click();
  await expect(page.getByText('Showing 7 / 7 solves', { exact: false })).toBeVisible();
  const sessions = page.locator('.offcanvas.show .card').filter({ has: page.getByRole('heading', { name: /Which Sessions/ }) });
  await sessions.locator('.dropdown-heading').click();
  expect(await sessions.textContent()).toContain(session);
  await sessions.locator('.dropdown-heading').click();
  const sources = page.locator('.offcanvas.show .card').filter({ has: page.getByRole('heading', { name: /^Source/ }) });
  await sources.locator('.dropdown-heading').click();
  await sources.getByText('CuberPlus', { exact: true }).click();
  await expect(page.getByText('Showing 0 / 7 solves', { exact: false })).toBeVisible();
  await sources.getByText('CuberPlus', { exact: true }).click();
  await expect(page.getByText('Showing 7 / 7 solves', { exact: false })).toBeVisible();
  await page.locator('.offcanvas.show .btn-close').click();

  const updated = await database(page, [{ ...samples[1], id: 'timer-data-new', createdAt: new Date().toISOString() }]);
  await load.click();
  await expect(load).toBeEnabled();
  await filters.click();
  await expect(page.getByText('Showing 8 / 8 solves', { exact: false })).toBeVisible();
  await page.locator('.offcanvas.show .btn-close').click();
  expect(recordings(await database(page))).toEqual(recordings(updated));
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
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const header = replay.locator('.replay-header');
    await expect(header.locator('a, button')).toHaveText(['', '+2', 'DNF', 'Delete']);
    await expect(replay.locator('.replay-scramble a, .replay-scramble button')).toHaveText(['Retry']);
    await expect(header.getByRole('button', { name: 'Close replay' })).toBeVisible();
    await expect(header).not.toContainText(/Solve replay|complete|host timing|quarter turns/i);
    await expect(header.getByLabel('Solve time', { exact: true })).toHaveText('12.000s');
    expect(await header.getByLabel('Solve time', { exact: true }).evaluate(time =>
      parseFloat(getComputedStyle(time).fontSize) > parseFloat(getComputedStyle(time.parentElement).fontSize))).toBe(true);
    const inspection = header.getByLabel('Inspection time', { exact: true });
    const turns = inspection.locator('xpath=preceding-sibling::span');
    await expect(turns).toHaveText(/^\d+ turns$/);
    const [turnBox, inspectionBox] = await Promise.all([turns.boundingBox(), inspection.boundingBox()]);
    expect(inspectionBox.x).toBeGreaterThan(turnBox.x + turnBox.width);
    expect(Math.abs(inspectionBox.y - turnBox.y)).toBeLessThan(5);
    expect(await replay.evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(replay.getByRole('region', { name: 'Solve mistakes', exact: true })).toBeVisible();
  const footer = replay.locator(':scope > :last-child');
  await expect(footer.getByLabel('Solve ID', { exact: true })).toContainText(seed.id);
  await expect(footer.getByLabel('Solve source', { exact: true })).toHaveText('CuberPlus');
  expect(await replay.evaluate(dialog => {
    const mistakes = dialog.querySelector('[aria-label="Solve mistakes"]');
    const rerun = [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Re-run analysis');
    const id = dialog.querySelector('[aria-label="Solve ID"]');
    return !!(mistakes.compareDocumentPosition(rerun) & Node.DOCUMENT_POSITION_FOLLOWING)
      && !!(rerun.compareDocumentPosition(id) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  await expect(replay).not.toContainText('Ranked by estimated impact');
  const mistakeInfo = replay.getByRole('region', { name: 'Solve mistakes', exact: true }).getByRole('button', { name: /^About / }).first();
  if (await mistakeInfo.count()) {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await mistakeInfo.click();
      await expect(replay.getByRole('tooltip')).toBeVisible();
      await page.getByRole('button', { name: 'Next move', exact: true }).focus();
      await expect(replay.getByRole('tooltip')).toHaveCount(0);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await expect(replay.getByLabel('Solution orientation', { exact: true })).toHaveCount(0);
  const initialRotation = replay.getByLabel('Initial rotation', { exact: true });
  if (await initialRotation.count()) await expect(replay.getByRole('group', { name: 'Cross solution', exact: true }).locator('.move').first()).toHaveAttribute('aria-label', 'Initial rotation');
  await expect(page.getByLabel('Solve ID', { exact: true })).toContainText(seed.id);
  await page.getByRole('button', { name: 'Next move', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Replay move', exact: true })).toHaveAttribute('aria-valuenow', '1');
  await page.keyboard.press('Escape');
  await expect(replay).toHaveCount(0);
  await expect(page).toHaveURL(`${base}/smartcubeanalyzer/`);
  expect(popups).toBe(0);
  expect(recordings(await database(page))).toEqual(recordings(updated));
  for (const [width, theme] of [[1440, 'dark'], [320, 'dark'], [320, 'light']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name: 'Options', exact: true }).click();
    await page.getByRole('button', { name: `${theme[0].toUpperCase() + theme.slice(1)} theme`, exact: true }).click();
    await page.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name: 'Smartcube Analyzer', exact: true }).click();
    const selected = await clickChartPoint(page, 'Average Time');
    const average = page.getByRole('dialog', { name: `Ao5: ${Number(selected.value).toFixed(3)}s`, exact: true });
    await expect(average).toBeVisible();
    await expect(average).toHaveCSS('opacity', '1');
    await expect(average.getByRole('table', { name: 'Average solves' }).locator('tbody tr')).toHaveCount(5);
    await checkAverage(average, Array.from({ length: 5 }, (_, i) => Number(selected.label) - 4 + i));
    expect(await average.evaluate(dialog => dialog.getBoundingClientRect().width <= innerWidth)).toBe(true);
    if (theme === 'dark') {
      if (width === 320 && process.env.CUBERPLUS_SCREENSHOT_DIR) {
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await page.screenshot({ path: join(process.env.CUBERPLUS_SCREENSHOT_DIR, 'analyzer-average-mobile.png'), animations: 'disabled' });
      }
      if (width === 1440) expect(await average.evaluate(dialog => {
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
      await page.keyboard.press('Escape');
    }
    await expect(average).toHaveCount(0);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const record = await clickChartPoint(page, 'History of Records', 1);
  await expect(page.getByRole('dialog', { name: `Ao5: ${record.value.y.toFixed(3)}s`, exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(recordings(await database(page))).toEqual(recordings(updated));
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
    buffer: Buffer.from('id,date,dnf,time,solving_method,solution_rotation,first_f2l_pair,step_0_name,step_0_slice_turns\n' + Array.from({ length: 80 }, (_, i) =>
      `numbered-${i},${new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString().replace('T', ' ').replace('.000Z', ' UTC')},false,${12000 + i * 100},CFOP,DB,${i % 2 ? 'Orange/Blue' : 'Red/Green'},Cross,${i % 2 ? 7 : 9}`).join('\n')),
  });
  await expect(choose).toContainText('numbered-solves.csv');
  await filters.click();
  await page.locator('#autoWindowSize').press('Space');
  await page.locator('#windowSize').fill('5');
  await page.locator('.offcanvas.show .btn-close').click();
  const numberedPoint = await clickChartPoint(page, 'Average Time', 0, '73');
  const numberedAverage = page.getByRole('dialog', { name: `Ao5: ${Number(numberedPoint.value).toFixed(3)}s`, exact: true });
  await expect(numberedAverage.locator('tbody th')).toHaveText(['69', '70', '71', '72', '73']);
  await page.keyboard.press('Escape');
  const pairPoint = await clickChartPoint(page, 'First F2L Pair', 0, '73');
  expect(pairPoint.value).toBe(60);
  const pairAverage = page.getByRole('dialog', { name: /Red \/ Green first pair \(3 solves\)/ });
  await expect(pairAverage).toBeVisible();
  await expect(pairAverage.getByRole('button', { name: 'Close solves', exact: true })).toHaveCSS('background-size', '16px 16px');
  await expect(pairAverage.locator('tbody th')).toHaveText(['69', '71', '73']);
  await page.keyboard.press('Escape');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole('region', { name: 'Mistakes', exact: true }).getByRole('button', { name: 'View solves with Cross: Inefficient solution', exact: true }).click();
    const mistakes = page.getByRole('dialog', { name: 'Cross: Inefficient solution (2 solves)', exact: true });
    await expect(mistakes).toBeVisible();
    await expect(mistakes.locator('tbody th')).toHaveText(['77', '79']);
    await page.keyboard.press('Escape');
  }
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
    const penaltyPage = await context.newPage();
    penaltyPage.on('pageerror', error => errors.push(error.message));
    await penaltyPage.clock.install();
    await penaltyPage.goto(`${base}/timer/`);
    await expect(penaltyPage.getByText('Try simulated cube', { exact: true })).toBeEnabled({ timeout: 60000 });
    await database(penaltyPage, [{ ...seed, duration: 10000, session: 'Default', penalty: 4000, penaltyReason: 'inspection, over-turn' }]);
    await penaltyPage.reload();
    await penaltyPage.getByRole('button', { name: 'Options', exact: true }).click();
    const inspection = penaltyPage.getByRole('checkbox', { name: '15-second inspection', exact: true });
    await expect(inspection).not.toBeChecked();
    await inspection.check();
    await penaltyPage.reload();
    await penaltyPage.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(inspection).toBeChecked();
    await penaltyPage.getByRole('button', { name: 'Close options', exact: true }).click();
    await penaltyPage.getByRole('button', { name: 'View', exact: true }).click();
    let replay = penaltyPage.getByRole('dialog', { name: 'Solve replay', exact: true });
    await replay.getByRole('button', { name: '+2', exact: true }).click();
    await expect(replay.getByLabel('Penalty reason', { exact: true })).toHaveText('+6 reasons: inspection, over-turn, manual');
    await replay.getByRole('button', { name: 'DNF', exact: true }).click();
    await expect(replay.getByLabel('Penalty reason', { exact: true }).first()).toHaveText('DNF reason: manual');
    await expect.poll(async () => (await database(penaltyPage))[0]).toMatchObject({ status: 'incomplete', dnfReason: 'manual', penalty: 6000 });
    await penaltyPage.reload();
    await penaltyPage.getByRole('button', { name: 'View', exact: true }).click();
    replay = penaltyPage.getByRole('dialog', { name: 'Solve replay', exact: true });
    await expect(replay.getByRole('button', { name: 'DNF', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(replay.getByRole('button', { name: '+2', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await replay.getByRole('button', { name: 'DNF', exact: true }).click();
    await replay.getByRole('button', { name: '+2', exact: true }).click();
    await expect(replay.getByLabel('Penalty reason', { exact: true })).toHaveText('+4 reasons: inspection, over-turn');
    await replay.getByRole('button', { name: 'Close replay', exact: true }).click();
    await expect(penaltyPage.getByRole('button', { name: 'View current Single', exact: true })).toHaveText('14.00');
    await penaltyPage.getByText('Try simulated cube', { exact: true }).evaluate(button => button.click());
    const guided = penaltyPage.getByRole('button', { name: 'Perform guided move', exact: true });
    const simulate = penaltyPage.getByRole('button', { name: 'Simulate solve', exact: true });
    for (const [milliseconds, count, reason] of [[15000, 2, '+2'], [17000, 3, 'DNF']]) {
      await expect(guided).toBeEnabled({ timeout: 60000 });
      for (let i = 0; i < 100 && !await simulate.isEnabled(); i++) await guided.click();
      await expect(simulate).toBeEnabled();
      await penaltyPage.clock.fastForward(milliseconds);
      await expect(penaltyPage.getByLabel('Inspection status', { exact: true })).toHaveText(`Inspection: ${reason}`);
      await simulate.click();
      await expect(penaltyPage.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(count, { timeout: 30000 });
      await expect.poll(async () => (await database(penaltyPage)).filter(solve => solve.id !== seed.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0])
        .toMatchObject(reason === '+2' ? { status: 'complete', penalty: 2000, penaltyReason: 'inspection' } : { status: 'incomplete', dnfReason: 'inspection' });
      const latest = (await database(penaltyPage)).filter(solve => solve.id !== seed.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      expect(latest).toMatchObject(reason === '+2' ? { status: 'complete', penalty: 2000, penaltyReason: 'inspection' } : { status: 'incomplete', dnfReason: 'inspection' });
      expect(latest.inspection).toBeGreaterThanOrEqual(milliseconds);
    }
    await penaltyPage.getByRole('button', { name: 'Options', exact: true }).click();
    await inspection.uncheck();
    const session = penaltyPage.getByRole('combobox', { name: 'Session', exact: true }).first();
    await session.selectOption({ label: '+ Create Session' });
    await penaltyPage.getByRole('textbox', { name: 'New session name', exact: true }).fill('Practice');
    await penaltyPage.getByRole('button', { name: 'Create', exact: true }).click();
    await penaltyPage.getByRole('button', { name: 'Close options', exact: true }).click();
    const original = (await database(penaltyPage)).find(solve => solve.id === seed.id);
    await dismissCelebrations(penaltyPage);
    await penaltyPage.locator('.site-page--timer').getByRole('link', { name: 'Smartcube Analyzer', exact: true }).click();
    await penaltyPage.getByRole('button', { name: 'Display My Stats!', exact: true }).click();
    await penaltyPage.locator('.clickable-grid').getByRole('gridcell', { name: '14.00', exact: true }).click();
    replay = penaltyPage.getByRole('dialog', { name: 'Solve replay', exact: true });
    await expect(replay.getByRole('link', { name: 'Retry', exact: true })).toHaveAttribute('href', `/timer/?retry=${encodeURIComponent(seed.id)}`);
    await replay.getByRole('link', { name: 'Retry', exact: true }).click();
    await expect(penaltyPage).toHaveURL(new RegExp(`/timer/\\?retry=${encodeURIComponent(seed.id)}$`));
    await expect(replay).toHaveCount(0);
    await expect(penaltyPage.getByText('Retry will be saved in Retries, then return to Practice.', { exact: false })).toBeVisible();
    await expect(guided).toBeEnabled({ timeout: 60000 });
    for (let i = 0; i < 150 && !await simulate.isEnabled(); i++) await guided.click();
    await expect(simulate).toBeEnabled();
    await simulate.click();
    await expect.poll(async () => (await database(penaltyPage)).filter(solve => solve.session === 'Retries' && solve.status === 'complete'), { timeout: 30000 }).toHaveLength(1);
    let attempts = (await database(penaltyPage)).filter(solve => solve.session === 'Retries');
    expect(attempts[0]).toMatchObject({ scramble: original.scramble, status: 'complete' });
    expect(attempts[0].id).not.toBe(original.id);
    expect(recordings([(await database(penaltyPage)).find(solve => solve.id === seed.id)])).toEqual(recordings([original]));
    await penaltyPage.clock.fastForward(501);
    await dismissCelebrations(penaltyPage);
    await penaltyPage.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(session).toHaveValue('Practice');
    await expect(session).toBeEnabled();
    await session.selectOption('Retries');
    await penaltyPage.getByRole('button', { name: 'Close options', exact: true }).click();
    await penaltyPage.getByRole('table', { name: 'Solve history' }).getByRole('button', { name: 'View', exact: true }).click();
    replay = penaltyPage.getByRole('dialog', { name: 'Solve replay', exact: true });
    await replay.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(guided).toBeEnabled({ timeout: 60000 });
    for (let i = 0; i < 150 && !await simulate.isEnabled(); i++) await guided.click();
    await simulate.click();
    await expect.poll(async () => (await database(penaltyPage)).filter(solve => solve.session === 'Retries' && solve.status === 'complete'), { timeout: 30000 }).toHaveLength(2);
    await penaltyPage.reload();
    attempts = (await database(penaltyPage)).filter(solve => solve.session === 'Retries');
    expect(attempts).toHaveLength(2);
    expect(attempts.every(solve => solve.scramble === original.scramble && solve.status === 'complete')).toBe(true);
    await penaltyPage.goto(`${base}/timer/`);
    await penaltyPage.getByRole('button', { name: 'Options', exact: true }).click();
    await session.selectOption('Retries');
    await penaltyPage.getByRole('button', { name: 'Close options', exact: true }).click();
    await penaltyPage.getByRole('table', { name: 'Solve history' }).getByRole('button', { name: 'View', exact: true }).first().click();
    replay = penaltyPage.getByRole('dialog', { name: 'Solve replay', exact: true });
    await expect(replay.locator('.replay-header a, .replay-header button')).toHaveText(['', '+2', 'DNF', 'Delete']);
    await expect(replay.locator('.replay-scramble a, .replay-scramble button')).toHaveText(['Retry']);
    const deletedId = await replay.getByLabel('Solve ID', { exact: true }).locator('span').textContent();
    const beforeDelete = await database(penaltyPage);
    penaltyPage.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Are you sure you want to delete this solve? This cannot be undone.');
      await dialog.dismiss();
    });
    await replay.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(replay).toBeVisible();
    expect(recordings(await database(penaltyPage))).toEqual(recordings(beforeDelete));
    penaltyPage.once('dialog', dialog => dialog.accept());
    await replay.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(replay).toHaveCount(0);
    expect(recordings(await database(penaltyPage))).toEqual(recordings(beforeDelete.filter(solve => solve.id !== deletedId)));
    await expect(penaltyPage.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(1);
    await penaltyPage.getByRole('button', { name: 'Options', exact: true }).click();
    await session.selectOption('Default');
    await penaltyPage.getByRole('button', { name: 'Close options', exact: true }).click();
    await expect(penaltyPage.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(3);
    await penaltyPage.locator('.site-page--timer').getByRole('link', { name: 'Smartcube Analyzer', exact: true }).click();
    await penaltyPage.getByRole('button', { name: 'Display My Stats!', exact: true }).click();
    await penaltyPage.locator('.clickable-grid').getByRole('gridcell', { name: '14.00', exact: true }).click();
    await expect(replay.locator('.replay-header a, .replay-header button')).toHaveText(['', '+2', 'DNF', 'Delete']);
    await expect(replay.locator('.replay-scramble a, .replay-scramble button')).toHaveText(['Retry']);
    penaltyPage.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Are you sure you want to delete this solve? This cannot be undone.');
      await dialog.accept();
    });
    await replay.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(replay).toHaveCount(0);
    await expect(penaltyPage.locator('.clickable-grid').getByRole('gridcell', { name: '14.00', exact: true })).toHaveCount(0);
    expect(recordings(await database(penaltyPage))).toEqual(recordings(beforeDelete.filter(solve => solve.id !== deletedId && solve.id !== seed.id)));
    await penaltyPage.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name: 'Timer', exact: true }).click();
    await expect(penaltyPage.getByRole('table', { name: 'Solve history' }).locator('tbody tr')).toHaveCount(2);
    await penaltyPage.reload();
    expect((await database(penaltyPage)).some(solve => solve.id === deletedId || solve.id === seed.id)).toBe(false);
    await context.close();
  }
  expect(errors).toEqual([]);
  console.log('PASS desktop/mobile Timer and Analyzer retry: same scramble, separate persisted attempts in retries, original unchanged and previous session restored');
  console.log('PASS desktop/mobile Delete before Retry: persisted individual deletion from Timer and Analyzer, refreshed charts and mounted Timer history, other solves preserved');
  console.log('PASS desktop/mobile inspection count-up, automatic +2/DNF, stacked manual penalties, reasons, persistence and undo');
  console.log('PASS shared Timer/Analyzer averages: sortable Solve/Time/Turns/TPS/View, real chart solve numbers 69-73, preserved chop colors without strikethrough, identical dialog styling, inline replay, readonly loading, Escape, light/dark and mobile');
} finally {
  await browser.close();
}
