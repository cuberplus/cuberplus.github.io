/** @jest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { deserialize, serialize } from 'node:v8';
import { Cube, inverse, loadCube } from '../../timer/src/Core/puzzle';
import type { Solve } from '../../timer/src/Core/engine';
import { SolveTimeline } from '../../timer/src/Components/SolveTimeline';
import { GetEmptySolve } from '../../smartcubeanalyzer/src/Helpers/CubeHelpers';
import { StepName } from '../../smartcubeanalyzer/src/Models/Types';

let cube: Cube, root: Root, container: HTMLDivElement, solve: Solve;
const pll = "R U R' U' R' F R2 U' R' U' R U R' F'", oll = "R U R' U R U2 R'";
const scramble = `${pll} ${oll} R U R' F U F' L U L' B U B' D`;
beforeAll(async () => { cube = await loadCube(); });
beforeEach(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  solve = {
    version: 1, id: 'timeline-fixture', session: 'Test', createdAt: new Date().toISOString(), device: 'Test',
    scramble, startFacelets: cube.facelets(cube.solved().applyAlg(scramble)), duration: 0,
    status: 'active', reason: '', timingBasis: 'host', moves: [],
  };
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
function append(alg: string) {
  alg.split(' ').forEach(move => {
    const elapsed = solve.moves.length * 100;
    solve.moves.push({ move, elapsed, hostTime: elapsed, localTimestamp: elapsed, cubeTimestamp: null });
    solve.duration = elapsed;
  });
}
async function draw(elapsed: number, precision: 2 | 3 = 2, history?: Solve[]) {
  await act(async () => root.render(createElement(SolveTimeline, { cube, solve, elapsed, precision, history, compact: history !== undefined })));
}
const segments = () => Array.from(container.querySelectorAll<HTMLElement>('.trail-segment'));
function imported(id: string, times: number[], createdAt = '2026-01-01T00:00:00.000Z'): Solve {
  const { date, endDate, ...data } = GetEmptySolve();
  return { ...solve, id, createdAt, status: 'complete', duration: times.reduce((sum, time) => sum + time * 1000, 0),
    imported: { ...data, method: 'CFOP', date: date.toISOString(), endDate: endDate?.toISOString(),
      steps: data.steps.slice(0, times.length).map((step, i) => ({ ...step, name: [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.OLL, StepName.PLL][i], time: times[i] })) } };
}
test('compact split colors compare each step against eligible recent history at display precision', async () => {
  solve = imported('current', [1, 2, 3, 4, 5, 6, 7], '2026-02-01T00:00:00.000Z');
  const baseline = imported('baseline', [2, 1, 3.004, 5, 4, 7, 6]);
  const ignored = [solve, { ...baseline, id: 'dnf', status: 'incomplete' as const },
    { ...baseline, id: 'retry', session: 'Retries' }, { ...baseline, id: 'future', createdAt: '2026-03-01T00:00:00.000Z' },
    { ...baseline, id: 'roux', imported: { ...baseline.imported!, method: 'ROUX' } }];
  for (const item of ignored.slice(1)) item.imported = { ...item.imported!, steps: item.imported!.steps.map(step => ({ ...step, time: 100 })) };
  await draw(solve.duration, 2, [...ignored, baseline]);
  const splits = Array.from(container.querySelectorAll<HTMLElement>('.trail-compact > span'));
  expect(splits.map(item => item.dataset.comparison)).toEqual(['faster', 'slower', 'equal', 'faster', 'slower', 'faster', 'slower']);
  expect(splits[0].getAttribute('aria-label')).toContain('average of 2.00s');
  expect(splits.every(item => item.className === `split-${item.dataset.comparison}`)).toBe(true);
});
test('comparisons use at most 1000 eligible solves and omit unavailable splits and active solves', async () => {
  solve = imported('current', [1, 2], '2026-02-01T00:00:00.000Z');
  const recent = Array.from({ length: 1000 }, (_, i) => imported(`old-${i}`, [1]));
  const history = [...recent, imported('beyond-limit', [100, 100])];
  await draw(solve.duration, 2, history);
  expect(container.querySelectorAll('[data-comparison]')).toHaveLength(1);
  expect(container.querySelector('[data-comparison]')?.getAttribute('data-comparison')).toBe('equal');
  solve.status = 'active';
  await draw(solve.duration, 2, history);
  expect(container.querySelector('[data-comparison]')).toBeNull();
});
test('clock ticks advance timings without rescanning the recording, while appended turns invalidate analysis', async () => {
  append('U');
  let reads = 0;
  Object.defineProperty(solve.moves[0], 'move', { enumerable: true, get: () => { reads++; return 'U'; } });
  await draw(150);
  expect(reads).toBeGreaterThan(0);
  reads = 0;
  await draw(250);
  expect(reads).toBe(0);
  expect(segments().at(-1)?.dataset.end).toBe('250');
  append("U' D'");
  await draw(350);
  expect(reads).toBeGreaterThan(0);
  expect(container.querySelector('.trail-duration[data-step="0"][data-status="done"]')).not.toBeNull();
  solve.status = 'incomplete';
  await draw(solve.duration);
  expect(container.querySelector('.trail-tip')).toBeNull();
});
test('imported step timings do not replay the raw recording for redundant CFOP analysis', async () => {
  const { date, endDate, ...data } = GetEmptySolve();
  solve.imported = { ...data, date: date.toISOString(), endDate: endDate?.toISOString() };
  solve.status = 'complete';
  append('U');
  Object.defineProperty(solve.moves[0], 'move', { get: () => { throw new Error('Imported recording should not be replayed.'); } });
  await draw(150);
  expect(container.querySelector('.trail-duration[data-step="0"]')!.textContent).toBe('Cross 0.00s');
});

test('moving tip leaves the old step color intact and separates recognition from execution', async () => {
  append('U');
  await draw(150);
  const crossColor = segments()[0].style.backgroundColor;
  const initialTip = container.querySelector<HTMLElement>('.trail-tip')!.style.left;
  append("U' D'");
  await draw(250);
  expect(container.querySelector<HTMLElement>('.trail-tip')!.style.left).not.toBe(initialTip);
  expect(segments()[0].style.backgroundColor).toBe(crossColor);
  const recognition = segments().find(segment => segment.dataset.step === '1')!;
  expect(recognition.dataset.phase).toBe('recognition');
  expect(recognition.classList.contains('recognition')).toBe(true);
  expect(recognition.style.backgroundColor).not.toBe(crossColor);
  expect(recognition.dataset.start).toBe('200');
  expect(recognition.dataset.end).toBe('250');
  append('B');
  await draw(350, 3);
  const pair = segments().filter(segment => segment.dataset.step === '1');
  expect(pair.map(segment => segment.dataset.phase)).toEqual(['recognition', 'execution']);
  expect(pair[0].style.backgroundColor).toBe(pair[1].style.backgroundColor);
  expect(pair[0].getAttribute('aria-label')).toBe('F2L Pair 1 recognition: 0.100s');
  expect(pair[1].getAttribute('aria-label')).toBe('F2L Pair 1 execution: 0.050s');
  const duration = container.querySelector('.trail-duration[data-step="1"]')!;
  expect(duration.textContent).toBe('F2L 1 0.150s');
  expect(duration.getAttribute('aria-label')).toBe('F2L Pair 1: 0.150s (in progress)');
  expect(duration.getAttribute('title')).toContain('0.100s recognition / 0.050s execution');
  expect(container.querySelector('.trail-duration[data-step="f2l"]')!.textContent).toBe('F2L 0.150s');
});

test.each([100, 100.125])('completed bar partitions the full solve with %sms intervals and honors display precision', async interval => {
  append("U U'");
  append(scramble.split(' ').reverse().map(inverse).join(' '));
  solve.moves.forEach((move, i) => { move.elapsed = move.hostTime = move.localTimestamp = i * interval; });
  solve.duration = solve.moves.at(-1)!.elapsed;
  solve.status = 'complete';
  await draw(solve.duration, 3);
  expect(container.querySelector('.trail-tip')).toBeNull();
  expect(segments().reduce((sum, segment) => sum + Number(segment.dataset.end) - Number(segment.dataset.start), 0)).toBe(Math.round(solve.duration));
  expect(segments().reduce((sum, segment) => sum + parseFloat(segment.style.width), 0)).toBeCloseTo(100, 8);
  expect(new Set(segments().map(segment => segment.dataset.step)).size).toBe(7);
  const labels = Array.from(container.querySelectorAll<HTMLElement>('.trail-duration'));
  expect(labels).toHaveLength(8);
  const major = Array.from(container.querySelectorAll<HTMLElement>('[aria-label="CFOP steps"] .trail-duration'));
  const pairs = Array.from(container.querySelectorAll<HTMLElement>('[aria-label="F2L sub-times"] .trail-duration'));
  expect(major.map(label => label.querySelector('strong')!.textContent)).toEqual(['Cross', 'F2L', 'OLL', 'PLL']);
  expect(pairs.map(label => label.querySelector('strong')!.textContent)).toEqual(['F2L 1', 'F2L 2', 'F2L 3', 'F2L 4']);
  expect(major.reduce((sum, label) => sum + Number(label.dataset.duration), 0)).toBe(Math.round(solve.duration));
  expect(Number(major[1].dataset.duration)).toBe(pairs.reduce((sum, label) => sum + Number(label.dataset.duration), 0));
  const bar = container.querySelector('.solve-trail')!;
  expect(bar.previousElementSibling!.getAttribute('aria-label')).toBe('CFOP steps');
  expect(bar.nextElementSibling!.getAttribute('aria-label')).toBe('F2L sub-times');
  expect(container.querySelector('.trail-duration[data-step="6"]')!.textContent).toMatch(/^PLL \d+\.\d{3}s$/);
  for (const text of ['Base cross', 'Darker:', 'lighter:', "first turn"]) expect(container.textContent).not.toContain(text);
  expect(container.querySelector('.badge')).toBeNull();
  await draw(solve.duration, 2);
  expect(container.querySelector('.trail-duration[data-step="6"]')!.textContent).toMatch(/^PLL \d+\.\d{2}s$/);
});

test('long active solves auto-rescale without dropping time, and unfinished stages stay pending', async () => {
  append("U U' D'");
  await draw(120000);
  const tip = parseFloat(container.querySelector<HTMLElement>('.trail-tip')!.style.left);
  expect(tip).toBeGreaterThan(0); expect(tip).toBeLessThan(100);
  for (const segment of segments()) expect(parseFloat(segment.style.left) + parseFloat(segment.style.width)).toBeLessThanOrEqual(100);
  expect(segments().reduce((sum, segment) => sum + Number(segment.dataset.end) - Number(segment.dataset.start), 0)).toBe(120000);
  solve.status = 'incomplete';
  await draw(solve.duration);
  expect(container.querySelector('.trail-tip')).toBeNull();
  expect(container.querySelector('.trail-duration[data-step="1"][data-status="pending"]')).not.toBeNull();
  expect(container.querySelector('.trail-duration[data-step="6"][data-status="unreached"]')!.textContent).toBe('PLL --');
});

test('all F2L splits, labels and leaders share the same dark purple', async () => {
  append(scramble.split(' ').reverse().map(inverse).join(' '));
  solve.status = 'complete';
  await draw(solve.duration);
  const pairColors = [1, 2, 3, 4].map(i => container.querySelector<HTMLElement>(`.trail-duration[data-step="${i}"]`)!.style.borderTopColor);
  expect(new Set(pairColors).size).toBe(1);
  const purple = pairColors[0], pairSegments = segments().filter(segment => [1, 2, 3, 4].includes(Number(segment.dataset.step)));
  expect(new Set(pairSegments.map(segment => segment.dataset.step)).size).toBe(4);
  expect(pairSegments.every(segment => segment.style.backgroundColor === purple)).toBe(true);
  expect(container.querySelector<HTMLElement>('.trail-duration[data-step="f2l"]')!.style.borderBottomColor).toBe(purple);
  const leaders = Array.from(container.querySelectorAll('[aria-label="F2L sub-times"] line'));
  expect(leaders).toHaveLength(4);
  expect(leaders.every(line => line.getAttribute('stroke') === purple)).toBe(true);
});

test('crowded and zero-time labels remain readable on narrow bars and repack after resizing', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
  let resize!: (width: number) => void;
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: class {
    constructor(callback: ResizeObserverCallback) { resize = width => callback([{ contentRect: { width } } as ResizeObserverEntry], this); }
    observe() {}
    unobserve() {}
    disconnect() {}
  } });
  try {
    append(scramble.split(' ').reverse().map(inverse).join(' '));
    solve.moves.forEach((move, i) => { move.elapsed = i === solve.moves.length - 1 ? 1000 : 0; });
    solve.duration = 1000; solve.status = 'complete';
    await draw(solve.duration, 3);
    await act(async () => resize(240));
    const labels = Array.from(container.querySelectorAll<HTMLElement>('.trail-duration'));
    expect(labels).toHaveLength(8);
    expect(labels.filter(label => label.textContent!.endsWith(' 0.000s'))).toHaveLength(7);
    const banks = Array.from(container.querySelectorAll('.trail-labels'));
    for (const bank of banks) {
      const labels = Array.from(bank.querySelectorAll<HTMLElement>('.trail-duration'));
      for (const row of new Set(labels.map(label => label.style.top))) {
        let edge = 0;
        for (const label of labels.filter(item => item.style.top === row)) {
          const center = parseFloat(label.style.left) / 100 * 240, half = parseFloat(label.style.width) / 2;
          expect(center - half).toBeGreaterThanOrEqual(edge - 0.001);
          expect(center + half).toBeLessThanOrEqual(240.001);
          edge = center + half;
        }
      }
    }
    await act(async () => resize(900));
    for (const bank of banks) expect(new Set(Array.from(bank.querySelectorAll<HTMLElement>('.trail-duration')).map(label => label.style.top)).size).toBe(1);
  } finally {
    if (original) Object.defineProperty(globalThis, 'ResizeObserver', original);
    else Reflect.deleteProperty(globalThis, 'ResizeObserver');
  }
});
