/** @jest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { KPattern } from 'cubing/kpuzzle';
import { SolutionProgress } from '../../src/trainer/SolutionProgress';
import { algorithmMatcher } from '../../timer/src/Analysis/algorithmMatching';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';

let cube: Cube, root: Root, container: HTMLDivElement;
beforeAll(async () => { cube = await loadCube(); });
beforeEach(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function draw(start: KPattern, pattern: KPattern, algorithm: string) {
  await act(async () => root.render(createElement(SolutionProgress, { cube, start, pattern, algorithm })));
}
const done = () => container.querySelectorAll('.move.done').length;
test('a half turn highlights only when complete, and wrong turns recover after undo', async () => {
  const start = cube.solved(), algorithm = "R2 U R'";
  await draw(start, start, algorithm); expect(done()).toBe(0);
  await draw(start, start.applyAlg('R'), algorithm); expect(done()).toBe(0);
  await draw(start, start.applyAlg('R2'), algorithm); expect(done()).toBe(1);
  await draw(start, start.applyAlg('R2 F'), algorithm); expect(done()).toBe(0);
  await draw(start, start.applyAlg("R2 F F' U"), algorithm); expect(done()).toBe(2);
  expect(container.querySelector('[aria-current="step"]')?.textContent).toBe("R'");
  await draw(start, start.applyAlg(algorithm), algorithm); expect(done()).toBe(3);
  const next = start.applyAlg('F');
  await draw(next, next, algorithm); expect(done()).toBe(0);
});
test.each(["y R U R' y' F", "r U r' M2 U", "(R U R' U')2"])('physical moves track displayed notation for %s', async algorithm => {
  const start = cube.solved(), checkpoints: { pattern: KPattern; index: number }[] = [];
  let pattern = start;
  algorithmMatcher(cube).outerMoves(algorithm, (move, index) => {
    pattern = pattern.applyMove(move); checkpoints.push({ pattern, index });
  });
  for (const checkpoint of checkpoints) {
    await draw(start, checkpoint.pattern, algorithm);
    const next = checkpoints.find(item => item.index > checkpoint.index);
    if (next && checkpoints.filter(item => item.index === checkpoint.index).at(-1) !== checkpoint) continue;
    expect(done()).toBeGreaterThanOrEqual(checkpoint.index + 1);
  }
  expect(done()).toBe(container.querySelectorAll('.move').length);
});
