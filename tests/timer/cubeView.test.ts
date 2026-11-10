/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { deserialize, serialize } from 'node:v8';
import { loadCube, locations, SOLVED } from '../../timer/src/Core/puzzle';
import { blitzOrientations } from '../../src/trainer/blitz';
import type { KTransformation } from 'cubing/kpuzzle';
import type { TwistyPlayerConfig } from 'cubing/twisty';

const setup = jest.fn<(value: KTransformation | null) => void>();
const timeline = jest.fn<(value: { animLeaf: { toString(): string }; start: number; end: number }[]) => void>();
const pause = jest.fn();
const stickering = jest.fn<(value: TwistyPlayerConfig['experimentalStickeringMaskOrbits']) => void>();
let timestamps: number[] = [];
const construct = jest.fn<(config: TwistyPlayerConfig) => HTMLElement>(() => {
  const element = Object.assign(document.createElement('div'), {
    experimentalModel: { setupTransformation: { set: setup }, animationTimelineLeavesRequest: { set: timeline } },
    pause,
  });
  Object.defineProperty(element, 'timestamp', { set: (value: number) => timestamps.push(value) });
  Object.defineProperty(element, 'experimentalStickeringMaskOrbits', { set: stickering });
  return element;
});
await jest.unstable_mockModule('cubing/twisty', () => ({ TwistyPlayer: construct }));
const { CubeView } = await import('../../timer/src/Components/CubeView');
const cube = await loadCube();
let root: Root, container: HTMLDivElement, clock: number, nextFrame: number;
let frames: Map<number, FrameRequestCallback>;
beforeEach(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
  setup.mockClear(); timeline.mockClear(); construct.mockClear(); pause.mockClear(); stickering.mockClear(); timestamps = [];
  clock = 0; nextFrame = 0; frames = new Map();
  jest.spyOn(performance, 'now').mockImplementation(() => clock);
  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(callback => {
    frames.set(++nextFrame, callback); return nextFrame;
  });
  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks(); });

async function draw(moves: string[], position = moves.length, animateSeeks = false, speed = 1, start = SOLVED, cross: number | null = null, rotation?: string, playback = false, seekVersion = 0) {
  const facelets = cube.facelets(cube.parse(start).applyAlg(moves.slice(0, position).join(' ')));
  await act(async () => root.render(createElement(CubeView, { cube, facelets, moves, position, animateSeeks, speed, cross, rotation, playback, seekVersion })));
}
function frame(milliseconds = 25) {
  clock += milliseconds;
  const pending = [...frames.values()]; frames.clear();
  pending.forEach(callback => callback(clock));
}

test('hides back-side hint stickers and starts at the supplied snapshot without animating', async () => {
  const start = cube.facelets(cube.solved().applyAlg('F D'));
  await draw(['R', 'U2'], 1, false, 1, start);
  expect(construct.mock.calls[0][0].hintFacelets).toBe('none');
  expect(setup).toHaveBeenLastCalledWith(cube.parse(start).experimentalToTransformation());
  expect(timestamps.at(-1)).toBe(1000);
  expect(frames.size).toBe(0);
});

test('live bursts retain and animate every raw turn, including repeated and opposite-face moves', async () => {
  const moves: string[] = [];
  await draw(moves, 0, true);
  moves.push('R', 'R', 'L');
  await draw(moves, 3, true);
  expect(timeline.mock.calls.at(-1)![0].map(leaf => [leaf.animLeaf.toString(), leaf.start, leaf.end])).toEqual([
    ['R', 0, 1000], ['R', 1000, 2000], ['L', 2000, 3000],
  ]);
  frame(); expect(timestamps.at(-1)).toBe(750);
  // Appending while a turn is in flight must preserve its progress.
  moves.push("U'");
  await draw(moves, 4, true);
  expect(timestamps.at(-1)).toBe(750);
  for (let i = 0; i < 15; i++) frame();
  expect(timestamps.at(-1)).toBe(4000);
  const advancing = timestamps.filter((position, index) => index > 0 && position !== timestamps[index - 1]);
  for (let i = 1; i < advancing.length; i++) expect(advancing[i] - advancing[i - 1]).toBeLessThan(1000);
  expect(frames.size).toBe(0);
  expect(setup).toHaveBeenCalledTimes(1);
});

test('replay animates single forward and backward moves, respects speed, and snaps larger seeks', async () => {
  const moves = ['R', 'U', 'F'];
  await draw(moves, 0);
  await draw(moves, 1);
  frame(); expect(timestamps.at(-1)).toBe(250);
  frame(); frame(); frame(); expect(timestamps.at(-1)).toBe(1000);
  await draw(moves, 0);
  frame(); expect(timestamps.at(-1)).toBe(750);
  frame(); frame(); frame(); expect(timestamps.at(-1)).toBe(0);
  await draw(moves, 1, false, 2);
  frame(); expect(timestamps.at(-1)).toBe(500);
  await draw(moves, 3);
  expect(timestamps.at(-1)).toBe(3000);
  expect(frames.size).toBe(0);
});

test('replay turns finish in 80 ms and preserve immediate manual seeking', async () => {
  const moves = ['R', 'U', 'F'];
  await draw(moves, 0, false, 1, SOLVED, null, undefined, true);
  await draw(moves, 1, false, 1, SOLVED, null, undefined, true);
  frame(40); expect(timestamps.at(-1)).toBe(500);
  frame(40); expect(timestamps.at(-1)).toBe(1000);
  await draw(moves, 3, false, 1, SOLVED, null, undefined, true, 1);
  expect(timestamps.at(-1)).toBe(3000);
  expect(frames.size).toBe(0);
  await draw(moves, 0, false, 1, SOLVED, null, undefined, true, 2);
  expect(timestamps.at(-1)).toBe(0);
  expect(frames.size).toBe(0);
});

test('dense playback accelerates queued turns without snapping or skipping a whole move', async () => {
  const moves = ['R', 'R', 'L', 'U', 'F', 'D', 'B', 'U'];
  await draw(moves, 0, false, 1, SOLVED, null, undefined, true);
  await draw(moves, 4, false, 1, SOLVED, null, undefined, true);
  expect(timestamps.at(-1)).toBe(0);
  frame(16); expect(timestamps.at(-1)).toBe(800);
  await draw(moves, 8, false, 1, SOLVED, null, undefined, true);
  expect(timestamps.at(-1)).toBe(800);
  const animated = [timestamps.at(-1)!];
  for (let i = 0; i < 25 && frames.size; i++) {
    frame(16);
    animated.push(timestamps.at(-1)!);
  }
  expect(animated.at(-1)).toBe(8000);
  for (let i = 1; i < animated.length; i++) {
    expect(animated[i] - animated[i - 1]).toBeGreaterThan(0);
    expect(animated[i] - animated[i - 1]).toBeLessThan(1000);
  }
  expect(frames.size).toBe(0);
});

test.each(['x2', 'z', "x'", '', "z'", 'x'])('cross face %#: preserves sticker colors and every replay position with rotation "%s"', async rotation => {
  const moves = ['R', 'U', 'F2', "L'", 'B', 'D2'];
  const start = cube.facelets(cube.solved().applyAlg([...moves].reverse().map(move => move.includes('2') ? move : move.endsWith("'") ? move[0] : `${move}'`).join(' ')));
  const cross = ['x2', 'z', "x'", '', "z'", 'x'].indexOf(rotation);
  await draw(moves, 0, false, 1, start, cross);
  const initial = setup.mock.calls.at(-1)![0]!.toKPattern();
  expect(initial.patternData.CENTERS.pieces[5]).toBe('ULFRBD'.indexOf('URFDLB'[cross]));
  const displayed = timeline.mock.calls.at(-1)![0].map(leaf => leaf.animLeaf.toString());
  for (let i = 0; i <= moves.length; i++) {
    const actual = initial.applyAlg(displayed.slice(0, i).join(' '));
    const expected = cube.parse(start).applyAlg(moves.slice(0, i).join(' ')).applyAlg(rotation);
    expect(actual.patternData).toEqual(expected.patternData);
  }
  await draw(moves, 1, false, 2, start, cross);
  frame(); expect(timestamps.at(-1)).toBe(500);
  await draw(moves, moves.length, false, 1, start, cross);
  expect(timestamps.at(-1)).toBe(moves.length * 1000);
  await draw(moves, moves.length, false, 1, start, null);
  expect(setup.mock.calls.at(-1)![0]!.toKPattern().patternData).toEqual(cube.parse(start).patternData);
  expect(timeline.mock.calls.at(-1)![0].map(leaf => leaf.animLeaf.toString())).toEqual(moves);
});

test('changing replay yaw resets the setup and keeps every animated position in the same frame', async () => {
  const moves = ['R', 'U2', "B'", 'D', 'F', "L'"];
  const start = cube.facelets(cube.solved().applyAlg('F R2 U L B2'));
  for (const tilt of ['', 'x2', 'z', "z'", 'x', "x'"]) for (const yaw of ['', 'y', 'y2', "y'"]) {
    const rotation = `${tilt} ${yaw}`.trim();
    await draw(moves, 2, false, 1, start, null, rotation);
    const initial = setup.mock.calls.at(-1)![0]!.toKPattern();
    const displayed = timeline.mock.calls.at(-1)![0].map(leaf => leaf.animLeaf.toString());
    for (let end = 0; end <= moves.length; end++) {
      expect(initial.applyAlg(displayed.slice(0, end).join(' ')).patternData)
        .toEqual(cube.parse(start).applyAlg(moves.slice(0, end).join(' ')).applyAlg(rotation).patternData);
    }
    expect(timestamps.at(-1)).toBe(2000);
  }
});

test('trainer color frame changes sticker colors without rotating the case or its Bluetooth moves', async () => {
  const moves = ['R', 'U', "R'"], start = cube.solved().applyAlg("R U' R'");
  const facelets = cube.facelets(start.applyAlg(moves.join(' ')));
  await act(async () => root.render(createElement(CubeView, { cube, facelets, moves, cross: 3, colorFrame: 'z2' })));
  const initial = setup.mock.calls.at(-1)![0]!.toKPattern();
  const expected = cube.solved().applyAlg('z2').applyTransformation(start.experimentalToTransformation()!);
  expect(initial.patternData).toEqual(expected.patternData);
  expect(timeline.mock.calls.at(-1)![0].map(leaf => leaf.animLeaf.toString())).toEqual(moves);
  for (let i = 0; i <= moves.length; i++) {
    expect(initial.applyAlg(moves.slice(0, i).join(' ')).patternData)
      .toEqual(expected.applyAlg(moves.slice(0, i).join(' ')).patternData);
  }
});
test('OLL mask grays only the twelve PLL stickers in all color frames, without recreating the player', async () => {
  const moves: string[] = [];
  for (const { colorFrame } of blitzOrientations(cube)) {
    await act(async () => root.render(createElement(CubeView, { cube, facelets: SOLVED, moves, colorFrame, hidePLL: true })));
    const mask = stickering.mock.calls.at(-1)![0]!;
    if (typeof mask === 'string') throw new Error('Expected per-sticker masking');
    const frame = cube.solved().applyAlg(colorFrame).patternData;
    const topColor = 'ULFRBD'[frame.CENTERS.pieces[0]];
    let gray = 0;
    for (const orbit of ['EDGES', 'CORNERS'] as const) {
      mask.orbits[orbit].pieces.forEach((piece, id) => {
        piece!.facelets.forEach((sticker, index) => {
          const topPiece = frame[orbit].pieces.slice(0, 4).includes(id);
          const color = SOLVED[locations[orbit][id][index]];
          expect(sticker).toBe(topPiece && color !== topColor ? 'ignored' : 'regular');
          if (sticker === 'ignored') gray++;
        });
      });
    }
    expect(gray).toBe(12);
  }
  expect(construct).toHaveBeenCalledTimes(1);
});
test('gray stickers follow animated turns and can be restored without resetting the cube', async () => {
  const moves: string[] = [], start = cube.solved().applyAlg("R U' R'");
  await act(async () => root.render(createElement(CubeView, { cube, facelets: cube.facelets(start), moves, hidePLL: true, animateSeeks: true })));
  const mask = stickering.mock.calls.at(-1)![0];
  moves.push('R');
  await act(async () => root.render(createElement(CubeView, { cube, facelets: cube.facelets(start.applyMove('R')), moves, hidePLL: true, animateSeeks: true })));
  frame(25);
  expect(timestamps.at(-1)).toBe(250);
  expect(stickering).toHaveBeenCalledTimes(1);
  expect(stickering.mock.calls.at(-1)![0]).toBe(mask);
  await act(async () => root.render(createElement(CubeView, { cube, facelets: cube.facelets(start.applyMove('R')), moves, hidePLL: false, animateSeeks: true })));
  const restored = stickering.mock.calls.at(-1)![0]!;
  if (typeof restored === 'string') throw new Error('Expected per-sticker masking');
  expect(Object.values(restored.orbits).flatMap(orbit => orbit.pieces).flatMap(piece => piece?.facelets ?? []).every(sticker => sticker === 'regular')).toBe(true);
  expect(construct).toHaveBeenCalledTimes(1);
  expect(setup).toHaveBeenCalledTimes(1);
  frame(25);
  expect(timestamps.at(-1)).toBe(500);
});

test('resynchronization cancels stale animation, and a delayed frame cannot skip a whole turn', async () => {
  const moves: string[] = [];
  await draw(moves, 0, true);
  moves.push('R', 'U');
  await draw(moves, 2, true);
  frame(2000); expect(timestamps.at(-1)).toBe(950);
  const start = cube.facelets(cube.solved().applyMove('F'));
  await draw([], 0, true, 1, start);
  expect(timestamps.at(-1)).toBe(0);
  expect(setup).toHaveBeenLastCalledWith(cube.parse(start).experimentalToTransformation());
  expect(frames.size).toBe(0);
});
test('fast live turns catch up without accumulating a fixed ten-turn-per-second backlog', async () => {
  const moves: string[] = [];
  await draw(moves, 0, true);
  for (let i = 0; i < 20; i++) {
    moves.push(['R', 'U', "R'", "U'"][i % 4]);
    await draw(moves, moves.length, true);
    frame(25);
  }
  for (let i = 0; i < 20 && frames.size; i++) frame(25);
  expect(timestamps.at(-1)).toBe(20000);
  expect(frames.size).toBe(0);
  expect(setup).toHaveBeenCalledTimes(1);
});

test('unmount cancels the animation and removes the player', async () => {
  const moves: string[] = [];
  await draw(moves, 0, true);
  moves.push('R');
  await draw(moves, 1, true);
  expect(frames.size).toBe(1);
  await act(async () => root.unmount());
  expect(frames.size).toBe(0);
  expect(pause).toHaveBeenCalled();
  expect(container.children).toHaveLength(0);
});
