import { chromium, expect } from '@playwright/test';
import { gzipSync, gunzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';

const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const solved = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
const solve = (id, duration) => ({
  version: 1, appVersion: '1.1.5', id, session: 'Practice', createdAt: '2026-11-05T00:00:00.000Z',
  device: 'Synthetic test cube', scramble: "R R'", startFacelets: solved, duration,
  status: 'complete', reason: '', timingBasis: 'host',
  moves: [
    { move: 'R', elapsed: 0, hostTime: 1000, localTimestamp: 1000, cubeTimestamp: null },
    { move: "R'", elapsed: duration, hostTime: 1000 + duration, localTimestamp: 1000 + duration, cubeTimestamp: null },
  ],
});
const pack = solves => ({
  format: 'timer-v2',
  solves: solves.map(({ moves, ...record }) => ({ ...record, moves: moves.map(turn => [turn.move, turn.elapsed, turn.hostTime, turn.localTimestamp, turn.cubeTimestamp]) })),
});
let remote = {
  format: 'cuberplus-cloud-v1', savedAt: '2026-11-05T00:00:00.000Z',
  timer: pack([solve('shared', 12000), solve('cloud-only', 15000), solve('cloud-only', 15000)]),
  settings: { theme: 'light' },
};
let uploaded, uploads = 0;
const errors = [], cspErrors = [];
try {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
  const transferUrl = 'https://my.microsoftpersonalcontent.com/personal/synthetic-transfer';
  const transfers = [];
  await context.route('https://my.microsoftpersonalcontent.com/**', async route => {
    const request = route.request();
    const headers = {
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-range',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(request.headers().authorization).toBeUndefined();
    transfers.push(request.method());
    if (request.method() === 'PUT') expect(request.postData()).toBe('synthetic-bytes');
    return route.fulfill({ status: request.method() === 'PUT' ? 201 : 200, headers, body: 'synthetic-bytes' });
  });
  await context.route('https://accounts.google.com/gsi/client', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.google = { accounts: { oauth2: { initTokenClient: options => ({
      requestAccessToken: () => options.callback({
        access_token: 'synthetic-browser-test-token', expires_in: 3600,
        scope: 'https://www.googleapis.com/auth/drive.appdata'
      })
    }) } } };`,
  }));
  await context.route('https://www.googleapis.com/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const headers = {
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type,if-match,x-upload-content-type',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,OPTIONS', 'Access-Control-Expose-Headers': 'ETag,Location',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(request.headers().authorization).toBe('Bearer synthetic-browser-test-token');
    if (url.pathname === '/drive/v3/files') return route.fulfill({ headers, json: { files: [{ id: 'test-backup' }] } });
    if (url.pathname === '/drive/v3/files/test-backup') return route.fulfill({
      headers: { ...headers, ETag: `"revision-${uploads}"` }, contentType: 'application/gzip', body: gzipSync(JSON.stringify(remote)),
    });
    if (url.pathname === '/upload/drive/v3/files/test-backup') {
      expect(request.method()).toBe('PATCH');
      expect(request.headers()['if-match']).toBe(`"revision-${uploads}"`);
      return route.fulfill({ headers: { ...headers, Location: 'https://www.googleapis.com/upload/test-session' }, json: {} });
    }
    if (url.pathname === '/upload/test-session') {
      uploaded = JSON.parse(gunzipSync(request.postDataBuffer()).toString());
      remote = uploaded; uploads++;
      return route.fulfill({ headers, json: { id: 'test-backup' } });
    }
    throw new Error(`Unexpected cloud request: ${request.method()} ${request.url()}`);
  });
  const page = await context.newPage();
  page.on('pageerror', failure => errors.push(failure.message));
  page.on('console', event => { if (/Content Security Policy|violates.*directive/.test(event.text())) cspErrors.push(event.text()); });
  await page.goto(`${base}/options/`);
  expect(await page.evaluate(async url => {
    const download = await (await fetch(url)).text();
    const upload = await fetch(url, { method: 'PUT', headers: { 'Content-Range': 'bytes 0-14/15' }, body: 'synthetic-bytes' });
    return [download, upload.status];
  }, transferUrl)).toEqual(['synthetic-bytes', 201]);
  expect(transfers).toEqual(['GET', 'PUT']);
  await expect(page.getByRole('heading', { name: /^Cloud backup/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect Google Drive' })).toBeEnabled();
  await page.evaluate(async solves => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('smart-cube-timer', 2);
      request.onupgradeneeded = () => request.result.createObjectStore('solves', { keyPath: 'id' });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, transaction = db.transaction('solves', 'readwrite');
        solves.forEach(solve => transaction.objectStore('solves').put(solve));
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      };
    });
    localStorage.setItem('cuberplus-database-favorites', '["F2L-1:R U2 R\'"]');
    localStorage.setItem('cuberplus-custom-algorithms', '{"F2L-1":["F R U R\' U\' F\'"]}');
    localStorage.setItem('unrelated-secret', 'synthetic-do-not-back-up');
  }, [solve('shared', 10000), solve('local-only', 18000)]);
  await page.getByRole('button', { name: 'Connect Google Drive' }).click();
  await expect(page.getByRole('button', { name: 'Back up now' })).toBeEnabled();
  await page.getByRole('button', { name: 'Back up now' }).click();
  await expect(page.locator('aside[role="status"]')).toContainText('Backed up 3 solves');
  expect(uploads).toBe(1);
  expect(uploaded.timer.solves.map(solve => solve.id).sort()).toEqual(['cloud-only', 'local-only', 'shared']);
  expect(uploaded.timer.solves.find(solve => solve.id === 'shared').duration).toBe(10000);
  expect(uploaded.settings['cuberplus-database-favorites']).toContain('F2L-1');
  expect(uploaded.settings['cuberplus-custom-algorithms']).toContain('F2L-1');
  expect(uploaded.settings).not.toHaveProperty('unrelated-secret');
  remote = {
    ...uploaded, timer: pack([solve('shared', 9000), solve('cloud-only', 15000), solve('restored', 20000), solve('shared', 8000)]),
    settings: { ...uploaded.settings, theme: 'dark', 'timer-time-precision': '3', 'timer-sessions': '["Cloud practice"]' },
  };
  await page.getByText('Restore and connection settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Time precision' })).toHaveValue('3');
  const readHistory = (target = page) => target.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('smart-cube-timer', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, read = db.transaction('solves').objectStore('solves').getAll();
      read.onsuccess = () => { db.close(); resolve(read.result); };
      read.onerror = () => { db.close(); reject(read.error); };
    };
  }));
  let history = await readHistory();
  expect(history.map(solve => solve.id).sort()).toEqual(['cloud-only', 'local-only', 'restored', 'shared']);
  expect(history.find(solve => solve.id === 'shared').duration).toBe(8000);
  expect(await page.evaluate(() => localStorage.getItem('timer-sessions'))).toBe('["Cloud practice"]');
  await page.getByRole('button', { name: 'Connect Google Drive' }).click();
  await page.getByText('Restore and connection settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Connect Google Drive' })).toBeEnabled();
  history = await readHistory();
  expect(history).toHaveLength(4);
  await page.getByRole('checkbox', { name: /every 100 solves/ }).check();
  await page.getByRole('checkbox', { name: 'Back up after a PB', exact: true }).check();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /every 100 solves/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Back up after a PB', exact: true })).toBeChecked();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Connect Google Drive' })).toBeVisible();
  }
  await page.getByText('Restore and connection settings', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Backup provider' }).selectOption('microsoft');
  await expect(page.getByRole('button', { name: 'Connect Microsoft OneDrive' })).toBeEnabled();
  await expect(page.getByText(/Microsoft OneDrive is not configured/)).toHaveCount(0);
  const sessionSettings = {
    'timer-sessions': '["Empty training"]',
    'timer-session-scramblers': '{"Empty training":"2-gen"}',
    'selected-session': 'Empty training',
  };
  await page.evaluate(settings => Object.entries(settings).forEach(([key, value]) => localStorage.setItem(key, value)), sessionSettings);
  await page.goto(`${base}/timer/`);
  await expect(page.locator('#history-session')).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('button').filter({ hasText: /^Export JSON$/ }).dispatchEvent('click'),
  ]);
  const contents = await readFile(await download.path());
  const manual = JSON.parse(contents.toString());
  expect(manual.settings).toMatchObject(sessionSettings);
  for (const key of ['unrelated-secret', 'timer-pb-daily-records', 'cuberplus-cloud-provider', 'cuberplus-cloud-progress']) {
    expect(manual.settings).not.toHaveProperty(key);
  }
  const restoredContext = await browser.newContext(), restoredPage = await restoredContext.newPage();
  restoredPage.on('pageerror', failure => errors.push(failure.message));
  await restoredPage.goto(`${base}/timer/`);
  await expect(restoredPage.locator('#history-session')).toBeEnabled();
  await restoredPage.evaluate(() => localStorage.setItem('cuberplus-cloud-provider', 'google'));
  await Promise.all([
    restoredPage.waitForEvent('load'),
    restoredPage.locator('input[type="file"]').setInputFiles({ name: 'complete-backup.json', mimeType: 'application/json', buffer: contents }),
  ]);
  expect(await restoredPage.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(sessionSettings))).toEqual(sessionSettings);
  expect(await restoredPage.evaluate(() => localStorage.getItem('cuberplus-cloud-provider'))).toBe('google');
  await expect(restoredPage.getByRole('combobox', { name: 'Session history', exact: true })).toHaveValue('Empty training');
  const restoredSolves = await readHistory(restoredPage);
  expect(restoredSolves.map(solve => solve.id).sort()).toEqual(['cloud-only', 'local-only', 'restored', 'shared']);
  expect(restoredSolves.every(solve => solve.moves.length === 2)).toBe(true);
  await restoredContext.close();
  expect(errors).toEqual([]);
  expect(cspErrors).toEqual([]);
  console.log('Backup browser regressions passed: cloud merge/restore, repeated restore, manual JSON round-trip into a fresh browser, empty-session generators, recordings, excluded state, responsive layout and provider setup.');
} finally {
  await browser.close();
}
