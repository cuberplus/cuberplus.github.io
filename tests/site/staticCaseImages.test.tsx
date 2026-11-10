import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import CaseImage, { CategoryImage } from '../../src/database/CaseImage';
import { algorithms, categories } from '../../src/database/algorithms';

afterEach(cleanup);
test('every catalog case and collapsed-category preview has a saved SVG', () => {
  for (const name of [...algorithms.map(entry => `${entry.category}-${entry.id}`), ...categories]) {
    const svg = readFileSync(resolve('public', 'case-images', `${name}.svg`), 'utf8');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 110 110"');
    expect(svg).not.toContain('<!--');
  }
});
test('database renders saved images rather than generating SVG geometry at runtime', () => {
  const view = render(<><CaseImage category="OLL" id="27" /><CategoryImage category="F2L" /></>);
  expect(screen.getByRole('img', { name: 'OLL 27 case' }).getAttribute('src')).toBe('/case-images/OLL-27.svg');
  expect(view.container.querySelector('svg')).toBeNull();
  expect(view.container.querySelector('img[alt=""]')!.getAttribute('src')).toBe('/case-images/F2L.svg');
});
