/** @jest-environment jsdom */
import { beforeAll, expect, test } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { algorithms, casePattern, categories, type Category } from '../../src/database/algorithms';
import { Blitz, blitzPattern, defaultBlitzSettings } from '../../src/trainer/blitz';
import { BlitzCaseImage } from '../../src/trainer/BlitzCaseImage';
import { DrillCaseImage } from '../../src/trainer/DrillCaseImage';
import { Practice } from '../../src/trainer/practice';
import { inverse, loadCube, type Cube } from '../../timer/src/Core/puzzle';

let cube: Cube;
beforeAll(async () => { cube = await loadCube(); Object.defineProperty(globalThis, 'crypto', { value: webcrypto }); });
const colors = ['#ffffff', '#b71234', '#009b48', '#ffd500', '#ff5800', '#0046ad'];
const centers = 'ULFRBD', faces = 'URFDLB', aufs = ['', 'U', 'U2', "U'"];
function expectedFills(category: Category, facelets: string, frame: string, hidePLL = false) {
  const centerPieces = cube.solved().applyAlg(frame).patternData.CENTERS.pieces;
  const palette = [...faces].map(face => colors[faces.indexOf(centers[centerPieces[centers.indexOf(face)]])]);
  const indices = category.endsWith('F2L') ? [0, 2, 1].flatMap(face => Array.from({ length: 9 }, (_, i) => face * 9 + i)) :
    [...Array.from({ length: 9 }, (_, i) => i), ...[45, 9, 18, 36].flatMap(face => [face + 2, face + 1, face])];
  return indices.map(index => hidePLL && category === 'OLL' ? facelets[index] === 'U' ? palette[0] : '#697384' :
    palette[faces.indexOf(facelets[index])]);
}
function image(markup: string, category: Category, id: string) {
  const container = document.createElement('div');
  container.innerHTML = markup;
  expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(`${category} ${id} case`);
  expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 110 110');
  expect(container.querySelector('title')?.textContent).toContain(`${category} ${id} starting position`);
  return Array.from(container.querySelectorAll('rect, polygon'), sticker => sticker.getAttribute('fill'));
}
test.each(['OLL', 'PLL'] as const)('%s Blitz previews use each queued AUF and color frame, including randomized OLL permutation', kind => {
  let seed = 193, draws = 0;
  const random = () => { draws++; return ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); };
  const blitz = new Blitz(cube, kind, random, { ...defaultBlitzSettings, crossColor: 'Random', frontColor: 'Random' });
  blitz.start(0); blitz.tick(3000);
  const sampled = draws, upcoming = blitz.queue.slice(1, 4), setups = JSON.stringify(upcoming);
  const upcomingPatterns = upcoming.map(entry => cube.facelets(blitzPattern(cube, entry)));
  expect(new Set(upcoming.map(entry => `${entry.preAuf}:${entry.postAuf}`)).size).toBe(3);
  expect(blitz.queue.some(entry => entry.crossColor !== 'Yellow' && entry.frontColor !== 'Green')).toBe(true);
  for (const entry of blitz.queue) {
    const pattern = blitzPattern(cube, entry);
    blitz.move('R', blitz.splitAt + 10); blitz.retry(blitz.splitAt + 20);
    expect(cube.facelets(blitz.pattern)).toBe(cube.facelets(pattern));
    expect(JSON.stringify(upcoming)).toBe(setups);
    expect(upcoming.map(entry => cube.facelets(blitzPattern(cube, entry)))).toEqual(upcomingPatterns);
    expect(draws).toBe(sampled);
    for (const hidePLL of [false, true]) {
      const markup = renderToStaticMarkup(createElement(BlitzCaseImage, { cube, kind, ...entry, hidePLL }));
      expect(image(markup, kind, entry.id)).toEqual(expectedFills(kind, cube.facelets(pattern), entry.colorFrame, hidePLL));
    }
    if (blitz.index < blitz.queue.length - 1) {
      expect(cube.facelets(blitz.pattern)).toBe(cube.facelets(pattern));
      blitz.skip(blitz.splitAt + 100);
    }
  }
});
test.each(['single', 'custom'] as const)('%s gives all three previews distinct actual AUFs and never resamples them on advancement or retry', mode => {
  const cases = (mode === 'single' ? ['PLL-T'] : ['OLL-27', 'PLL-T', 'F2L-1'])
    .map(key => algorithms.find(entry => `${entry.category}-${entry.id}` === key)!);
  let draws = 0;
  const random = () => {
    const entry = Math.floor(draws / 4), role = draws++ % 4;
    return role === 0 ? [0, .5, .9, 0][entry % 4] : role === 1 ? entry % 4 / 4 : role === 2 ? (entry + 1) % 4 / 4 : .6;
  };
  const practice = new Practice(cube, cases, mode, { ...defaultBlitzSettings, crossColor: 'White', frontColor: 'Blue' }, 0, random);
  practice.tick(3000);
  const upcoming = practice.queue.slice(1), setups = JSON.stringify(upcoming.map(({ preAuf, postAuf, colorFrame }) => ({ preAuf, postAuf, colorFrame })));
  expect(upcoming.map(({ preAuf, postAuf }) => [preAuf, postAuf])).toEqual([['U', 'U2'], ['U2', "U'"], ["U'", '']]);
  const previews = upcoming.map(queued => {
    const expected = queued.setup
      ? cube.solved().applyAlg(queued.postAuf ? inverse(queued.postAuf) : '').applyAlg(queued.setup).applyAlg(inverse(queued.preAuf))
      : casePattern(cube, `${queued.preAuf} ${queued.algorithm} ${queued.postAuf}`);
    expect(cube.facelets(queued.pattern)).toBe(cube.facelets(expected));
    return image(renderToStaticMarkup(createElement(DrillCaseImage, { cube, ...queued, hidePLL: true })), queued.category, queued.id);
  });
  for (const [index, queued] of upcoming.entries()) {
    practice.skip(practice.splitAt + 100);
    expect(practice.queue[0]).toBe(queued);
    expect(practice.pattern).toBe(queued.pattern);
    const sampled = draws;
    practice.move('R', practice.splitAt + 10); practice.retry(practice.splitAt + 20);
    expect(draws).toBe(sampled);
    expect(practice.pattern).toBe(queued.pattern);
    expect(practice.colorFrame).toBe(queued.colorFrame);
    expect(JSON.stringify(upcoming.map(({ preAuf, postAuf, colorFrame }) => ({ preAuf, postAuf, colorFrame })))).toBe(setups);
    const markup = renderToStaticMarkup(createElement(DrillCaseImage, { cube, ...queued, pattern: practice.pattern, hidePLL: true }));
    expect(image(markup, queued.category, queued.id)).toEqual(previews[index]);
    expect(previews[index]).toEqual(expectedFills(queued.category, cube.facelets(queued.pattern), queued.colorFrame, true));
  }
});
test.each(categories)('%s practice previews render all pre/post AUF combinations and become the identical active pattern', category => {
  const entry = algorithms.find(item => item.category === category)!;
  for (const preAuf of aufs) for (const postAuf of aufs) {
    let draw = 0;
    const random = () => [0, aufs.indexOf(preAuf) / 4, aufs.indexOf(postAuf) / 4, .6][draw++ % 4];
    const practice = new Practice(cube, [entry], 'single', { ...defaultBlitzSettings, crossColor: 'White', frontColor: 'Blue' }, 0, random);
    practice.tick(3000);
    const upcoming = practice.queue.slice(1);
    for (const queued of upcoming) {
      const expected = entry.setup
        ? cube.solved().applyAlg(postAuf ? inverse(postAuf) : '').applyAlg(entry.setup).applyAlg(preAuf ? inverse(preAuf) : '')
        : casePattern(cube, `${preAuf} ${entry.algorithm} ${postAuf}`);
      expect(cube.facelets(queued.pattern)).toBe(cube.facelets(expected));
      for (const hidePLL of [false, true]) {
        const markup = renderToStaticMarkup(createElement(DrillCaseImage, { cube, ...queued, hidePLL }));
        expect(image(markup, category, entry.id)).toEqual(expectedFills(category, cube.facelets(expected), queued.colorFrame, hidePLL));
      }
      practice.skip(practice.splitAt + 100);
      expect(practice.pattern).toBe(queued.pattern);
    }
  }
});
test('alternative single-case solutions and setup-based custom entries keep their actual preview patterns', () => {
  const entry = algorithms.find(item => item.category === 'F2L' && item.options.length > 1)!;
  const practice = new Practice(cube, [entry], 'single', defaultBlitzSettings, 0, () => .3, entry.options[1]);
  const queued = practice.queue[1];
  expect(cube.facelets(queued.pattern)).toBe(cube.facelets(casePattern(cube, `U ${entry.options[1]} U`)));
  expect(image(renderToStaticMarkup(createElement(DrillCaseImage, { cube, ...queued })), entry.category, entry.id))
    .toEqual(expectedFills(entry.category, cube.facelets(queued.pattern), queued.colorFrame));
  const custom = new Practice(cube, algorithms.filter(item => item.setup), 'custom', defaultBlitzSettings, 0, () => .3);
  for (const preview of custom.queue.slice(1)) {
    expect(image(renderToStaticMarkup(createElement(DrillCaseImage, { cube, ...preview })), preview.category, preview.id))
      .toEqual(expectedFills(preview.category, cube.facelets(preview.pattern), preview.colorFrame));
  }
});
