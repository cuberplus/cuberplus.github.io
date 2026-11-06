import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../src/database/alternatives.json', import.meta.url);
const alternatives = JSON.parse(readFileSync(file, 'utf8'));
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
try {
  const page = await browser.newPage();
  await page.goto(process.env.SITE_URL ?? 'http://127.0.0.1:5180/');
  const entries = await page.evaluate(async () => (await import('/src/database/algorithms.ts')).algorithms);
  let added = 0;
  for (const category of ['F2L', 'OLL', 'PLL']) {
    const url = `https://speedcubedb.com/a/3x3/${category}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    const html = await response.text();
    const groups = html.split(/<div class="row singlealgorithm g-0"[^>]*data-alg="([^"]+)"/);
    for (let i = 1; i < groups.length; i += 2) {
      const id = groups[i].replace(new RegExp(`^${category}[_ ]?`), '');
      const key = `${category}-${id}`, entry = entries.find(entry => `${entry.category}-${entry.id}` === key);
      if (!entry) continue;
      const normalize = alg => alg.replace(/2'/g, '2').replace(/\s+/g, ' ').trim();
      const existing = new Set([entry.algorithm, ...alternatives[key]].map(normalize));
      for (const match of groups[i + 1].matchAll(/class="cubedb-ftw-[^"]*"[^>]*data-alg="([^"]+)"/g)) {
        const alg = normalize(match[1].replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
        if (existing.has(alg)) continue;
        alternatives[key].push(alg); existing.add(alg); added++;
      }
    }
  }
  writeFileSync(file, JSON.stringify(alternatives, null, 2) + '\n');
  console.log(`Added ${added} SpeedCubeDB alternatives. Run the timer database tests before accepting them.`);
} finally { await browser.close(); }
