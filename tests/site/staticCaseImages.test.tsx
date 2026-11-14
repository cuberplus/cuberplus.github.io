import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import CaseImage, { CategoryImage } from '../../src/database/CaseImage';
import { algorithms, categories } from '../../src/database/algorithms';
import { applyMoves, FACES, inverseMoves, parseAlgorithm, solvedCube, stickers } from '../../scrambler/src/cube/cube';

afterEach(cleanup);
test('every catalog case and collapsed-category preview has a saved SVG', () => {
  expect(readdirSync(resolve('public', 'case-images')).filter(name => /^OF2L-\d+\.svg$/.test(name)).sort()).toEqual(
    algorithms.filter(entry => entry.category === 'OF2L').map(entry => `OF2L-${entry.id}.svg`).sort());
  for (const name of [...algorithms.map(entry => `${entry.category}-${entry.id}`), ...categories]) {
    const svg = readFileSync(resolve('public', 'case-images', `${name}.svg`), 'utf8');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    if (!/^(?:F2L|AF2L|OF2L)-/.test(name)) expect(svg).toContain('viewBox="0 0 110 110"');
    expect(svg).not.toContain('<!--');
  }
});
test('all F2L-family assets float only target-piece faces and keep every sticker fully visible', () => {
  const container = document.createElement('div');
  const bounds = (element: Element) => {
    const points = Array.from(element.querySelectorAll('polygon')).flatMap(tile =>
      tile.getAttribute('points')!.split(' ').map(point => point.split(',').map(Number)));
    return { left: Math.min(...points.map(point => point[0])), right: Math.max(...points.map(point => point[0])),
      top: Math.min(...points.map(point => point[1])), bottom: Math.max(...points.map(point => point[1])) };
  };
  for (const entry of algorithms.filter(entry => entry.category.endsWith('F2L'))) {
    const pair = entry.pair ?? 4;
    const state = applyMoves(solvedCube(), inverseMoves(parseAlgorithm(entry.featured![0])));
    const target = stickers(state).filter((_, i) => i < 24 ? Math.floor(i / 2) === pair + 4 :
      i < 48 && Math.floor((i - 24) / 3) === pair);
    const expected = [4, 5, 3].filter(face => target.some(sticker => sticker.face === face)).map(face => FACES[face]);
    container.innerHTML = readFileSync(resolve('public', 'case-images', `${entry.category}-${entry.id}.svg`), 'utf8');
    const svg = container.querySelector('svg')!, floating = Array.from(svg.querySelectorAll('[data-mirrored-face]'));
    expect(floating.map(face => face.getAttribute('data-mirrored-face'))).toEqual(expected);
    const physical = document.createElement('g');
    for (const face of svg.querySelectorAll('[data-visible-face]')) physical.appendChild(face.cloneNode(true));
    const cube = bounds(physical), whole = bounds(svg);
    const [x, y, width, height] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    expect(whole.left).toBeGreaterThan(x); expect(whole.right).toBeLessThan(x + width);
    expect(whole.top).toBeGreaterThan(y); expect(whole.bottom).toBeLessThan(y + height);
    for (const face of floating) {
      expect(face.querySelectorAll('polygon')).toHaveLength(9);
      const box = bounds(face), name = face.getAttribute('data-mirrored-face');
      if (name === 'L') expect(box.right).toBeLessThan(cube.left - 4);
      if (name === 'B') expect(box.left).toBeGreaterThan(cube.right + 4);
      if (name === 'D') expect(box.top).toBeGreaterThan(cube.bottom + 4);
    }
    for (let i = 0; i < floating.length; i++) for (let j = i + 1; j < floating.length; j++) {
      const a = bounds(floating[i]), b = bounds(floating[j]);
      expect(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top).toBe(true);
    }
  }
});
test('database renders saved images rather than generating SVG geometry at runtime', () => {
  const view = render(<><CaseImage category="OLL" id="27" /><CategoryImage category="F2L" /></>);
  expect(screen.getByRole('img', { name: 'OLL 27 case' }).getAttribute('src')).toBe('/case-images/OLL-27.svg');
  expect(view.container.querySelector('svg')).toBeNull();
  expect(view.container.querySelector('img[alt=""]')!.getAttribute('src')).toBe('/case-images/F2L.svg');
});
test('saved-image layout adds floating-face sizing only when a target piece is hidden', () => {
  const view = render(<CaseImage category="F2L" id="1" />);
  expect(screen.getByRole('img').classList.contains('database-case-image--mirrored')).toBe(false);
  view.rerender(<CaseImage category="OF2L" id="12" />);
  expect(screen.getByRole('img').classList.contains('database-case-image--mirrored')).toBe(true);
  expect(screen.getByRole('img').getAttribute('aria-description')).toContain('Floating mirrored faces');
});
