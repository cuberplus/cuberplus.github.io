import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true } });
try {
  const [{ illustrateCases, categories }, { loadCube }, { default: CaseDiagram, CategoryImage }, { algorithmMatcher }] = await Promise.all([
    server.ssrLoadModule('/src/database/algorithms.ts'),
    server.ssrLoadModule('/timer/src/Core/puzzle.ts'),
    server.ssrLoadModule('/src/database/CaseDiagram.tsx'),
    server.ssrLoadModule('/timer/src/Analysis/algorithmMatching.ts'),
  ]) as [typeof import('../src/database/algorithms'), typeof import('../timer/src/Core/puzzle'), typeof import('../src/database/CaseDiagram'), typeof import('../timer/src/Analysis/algorithmMatching')];
  const cube = await loadCube(), cases = illustrateCases(cube), matcher = algorithmMatcher(cube);
  const coreCount = (algorithm: string) => {
    const moves = matcher.outerMoves(algorithm).moves.slice();
    while (moves[0]?.startsWith('U')) moves.shift();
    while (moves.at(-1)?.startsWith('U')) moves.pop();
    return moves.length;
  };
  writeFileSync(new URL('../shared/config/last-layer-moves.json', import.meta.url), JSON.stringify(Object.fromEntries(
    cases.filter(entry => entry.category === 'OLL' || entry.category === 'PLL').map(entry =>
      [`${entry.category}-${entry.id}`, Math.max(...entry.options.map(coreCount))]),
  ), null, 2) + '\n');
  const images = Object.fromEntries(cases.map(({ category, id, facelets, visibleStickers }) =>
    [`${category}-${id}`, { facelets, visibleStickers }]));
  writeFileSync(new URL('../src/database/caseImages.json', import.meta.url), JSON.stringify(images, null, 2) + '\n');
  const directory = new URL('../public/case-images/', import.meta.url);
  mkdirSync(directory, { recursive: true });
  const writeSvg = (key: string, markup: string) => writeFileSync(new URL(`${key}.svg`, directory),
    markup.slice(markup.indexOf('<svg'), markup.lastIndexOf('</svg>') + 6)
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') + '\n');
  for (const image of cases) writeSvg(`${image.category}-${image.id}`, renderToStaticMarkup(createElement(CaseDiagram, image)));
  for (const category of categories) writeSvg(category, renderToStaticMarkup(createElement(CategoryImage, {
    category, example: cases.find(image => image.category === category && image.id === (category === 'PLL' ? 'T' : category === 'Patterns' ? '3' : '')),
  })));
  console.log(`Saved ${cases.length} case images and ${categories.length} category previews.`);
} finally { await server.close(); }
