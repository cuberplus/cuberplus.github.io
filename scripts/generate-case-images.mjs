import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true } });
try {
  const [{ illustrateCases, categories }, { loadCube }, { default: CaseDiagram, CategoryImage }] = await Promise.all([
    server.ssrLoadModule('/src/database/algorithms.ts'),
    server.ssrLoadModule('/timer/src/Core/puzzle.ts'),
    server.ssrLoadModule('/src/database/CaseDiagram.tsx'),
  ]);
  const images = Object.fromEntries(illustrateCases(await loadCube()).map(({ category, id, facelets, visibleStickers }) =>
    [`${category}-${id}`, { facelets, visibleStickers }]));
  writeFileSync(new URL('../src/database/caseImages.json', import.meta.url), JSON.stringify(images, null, 2) + '\n');
  const directory = new URL('../public/case-images/', import.meta.url);
  mkdirSync(directory, { recursive: true });
  for (const [key, image] of Object.entries(images)) {
    const [category, id] = key.split('-');
    const svg = renderToStaticMarkup(createElement(CaseDiagram, { category, id, ...image }));
    writeFileSync(new URL(`${key}.svg`, directory), svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') + '\n');
  }
  for (const category of categories) {
    const preview = renderToStaticMarkup(createElement(CategoryImage, { category, example: category === 'PLL' ? images['PLL-T'] : undefined }));
    const svg = preview.slice(preview.indexOf('<svg'), preview.lastIndexOf('</svg>') + 6);
    writeFileSync(new URL(`${category}.svg`, directory), svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') + '\n');
  }
  console.log(`Saved ${Object.keys(images).length} case images and ${categories.length} category previews.`);
} finally { await server.close(); }
