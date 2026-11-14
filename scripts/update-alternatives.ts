import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import saved from '../src/database/alternatives.json' with { type: 'json' };

const alternatives: Record<string, string[]> = saved;
const normalize = (alg: string) => alg.replace(/2'/g, '2').replace(/\s+/g, ' ').trim();
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
try {
  const page = await browser.newPage();
  await page.goto(process.env['SITE_URL'] ?? 'http://127.0.0.1:5180/');
  const entries = await page.evaluate(async (path) => (await import(path) as typeof import('../src/database/algorithms')).algorithms, '/src/database/algorithms.ts');
  let added = 0;
  for (const category of ['F2L', 'OLL', 'PLL']) {
    const url = `https://speedcubedb.com/a/3x3/${category}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    const groups = (await response.text()).split(/<div class="row singlealgorithm g-0"[^>]*data-alg="([^"]+)"/);
    for (let i = 1; i < groups.length; i += 2) {
      const id = groups[i].replace(new RegExp(`^${category}[_ ]?`), '');
      const key = `${category}-${id}`, entry = entries.find(entry => `${entry.category}-${entry.id}` === key);
      if (!entry) continue;
      const existing = new Set([entry.algorithm, ...alternatives[key]].map(normalize));
      for (const match of groups[i + 1].matchAll(/class="cubedb-ftw-[^"]*"[^>]*data-alg="([^"]+)"/g)) {
        const alg = normalize(match[1].replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
        if (existing.has(alg)) continue;
        alternatives[key].push(alg); existing.add(alg); added++;
      }
    }
  }
  writeFileSync(new URL('../src/database/alternatives.json', import.meta.url), JSON.stringify(alternatives, null, 2) + '\n');
  console.log(`Added ${added} SpeedCubeDB alternatives. Run the timer database tests before accepting them.`);
} finally { await browser.close(); }
