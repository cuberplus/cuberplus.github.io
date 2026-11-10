import { KPattern } from 'cubing/kpuzzle';
import { algorithms, casePattern, type AlgorithmCase } from '../database/algorithms';
import { type Cube, isMove } from '../../timer/src/Core/puzzle';

export type BlitzKind = 'OLL' | 'PLL';
export const cubeColors = ['White', 'Red', 'Green', 'Yellow', 'Orange', 'Blue'] as const;
export type CubeColor = typeof cubeColors[number];
export interface BlitzSettings { upcomingCases: boolean; caseNames: boolean; hidePLL: boolean; crossColor: CubeColor | 'Random'; frontColor: CubeColor | 'Random' }
export const defaultBlitzSettings: BlitzSettings = { upcomingCases: true, caseNames: true, hidePLL: false, crossColor: 'Yellow', frontColor: 'Green' };
interface PLLPermutation { edges: number[]; corners: number[] }
export interface BlitzCase extends AlgorithmCase { auf: string; preAuf?: string; postAuf?: string; colorFrame: string; crossColor: CubeColor; frontColor: CubeColor; permutation?: PLLPermutation }
export interface BlitzSplit { caseId: string; milliseconds: number; recognitionMilliseconds?: number; executionMilliseconds?: number; auf?: string; preAuf?: string; postAuf?: string; colorFrame?: string; crossColor?: CubeColor; frontColor?: CubeColor; permutation?: PLLPermutation }
export interface BlitzRun { id: string; kind: BlitzKind; date: string; milliseconds: number; splits: BlitzSplit[]; settings?: BlitzSettings }
export const BLITZ_STORAGE = 'cuberplus-trainer-blitz-v1';
export const BLITZ_SETTINGS_STORAGE = 'cuberplus-trainer-settings-v1';
const aufMoves = ['', 'U', 'U2', "U'"];
const centerFaces = 'ULFRBD';
const opposite = (a: CubeColor, b: CubeColor) => Math.abs(cubeColors.indexOf(a) - cubeColors.indexOf(b)) === 3;
export const adjacentColors = (cross: CubeColor, front: CubeColor) => cross !== front && !opposite(cross, front);
function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
const parity = (pieces: number[]) => pieces.reduce((sum, piece, i) => sum + pieces.slice(i + 1).filter(next => next < piece).length, 0) % 2;
function randomPLL(random: () => number): PLLPermutation {
  const edges = shuffle([0, 1, 2, 3], random), corners = shuffle([0, 1, 2, 3], random);
  if (parity(edges) !== parity(corners)) [edges[0], edges[1]] = [edges[1], edges[0]];
  return { edges, corners };
}
export function blitzPattern(cube: Cube, entry: { algorithm: string; auf?: string; preAuf?: string; postAuf?: string; permutation?: PLLPermutation }): KPattern {
  const pattern = entry.preAuf !== undefined ? casePattern(cube, `${entry.preAuf} ${entry.algorithm} ${entry.postAuf ?? ''}`) :
    casePattern(cube, entry.algorithm).applyAlg(entry.auf ?? '');
  if (!entry.permutation) return pattern;
  const data = { ...pattern.patternData };
  for (const [orbit, pieces] of [['EDGES', entry.permutation.edges], ['CORNERS', entry.permutation.corners]] as const) {
    data[orbit] = { ...data[orbit], pieces: [...pieces, ...data[orbit].pieces.slice(4)] };
  }
  return new KPattern(cube.puzzle, data);
}
function validPermutation(permutation: PLLPermutation): boolean {
  return !!permutation && [permutation.edges, permutation.corners].every(pieces =>
    Array.isArray(pieces) && pieces.length === 4 && pieces.every(Number.isInteger) && [...pieces].sort().join() === '0,1,2,3') &&
    parity(permutation.edges) === parity(permutation.corners);
}
function validSplitTiming({ milliseconds, recognitionMilliseconds: recognition, executionMilliseconds: execution }: BlitzSplit): boolean {
  return recognition === undefined && execution === undefined ||
    typeof recognition === 'number' && Number.isFinite(recognition) && recognition >= 0 &&
    typeof execution === 'number' && Number.isFinite(execution) && execution >= 0 &&
    Math.abs(recognition + execution - milliseconds) < .001;
}
export function readBlitzSettings(): BlitzSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(BLITZ_SETTINGS_STORAGE) ?? '{}') as Partial<BlitzSettings> | null;
    if (!saved) return { ...defaultBlitzSettings };
    const settings: BlitzSettings = {
      upcomingCases: typeof saved.upcomingCases === 'boolean' ? saved.upcomingCases : true,
      caseNames: typeof saved.caseNames === 'boolean' ? saved.caseNames : true,
      hidePLL: typeof saved.hidePLL === 'boolean' ? saved.hidePLL : false,
      crossColor: saved.crossColor && [...cubeColors, 'Random'].includes(saved.crossColor) ? saved.crossColor : 'Yellow',
      frontColor: saved.frontColor && [...cubeColors, 'Random'].includes(saved.frontColor) ? saved.frontColor : 'Green',
    };
    if (settings.crossColor !== 'Random' && settings.frontColor !== 'Random' && !adjacentColors(settings.crossColor, settings.frontColor)) {
      settings.crossColor = 'Yellow'; settings.frontColor = 'Green';
    }
    return settings;
  } catch { return { ...defaultBlitzSettings }; }
}
export function blitzOrientations(cube: Cube) {
  return ['', 'x', 'x2', "x'", 'z', "z'"].flatMap(tilt => ['', 'y', 'y2', "y'"].map(yaw => {
    const colorFrame = `${tilt} ${yaw}`.trim(), centers = cube.solved().applyAlg(colorFrame).patternData.CENTERS.pieces;
    return { colorFrame, crossColor: cubeColors['URFDLB'.indexOf(centerFaces[centers[5]])], frontColor: cubeColors['URFDLB'.indexOf(centerFaces[centers[2]])] };
  }));
}
export class Blitz {
  readonly queue: BlitzCase[];
  readonly settings: BlitzSettings;
  index = 0;
  phase: 'ready' | 'countdown' | 'running' | 'complete' | 'cancelled' = 'ready';
  countdownAt = 0;
  startedAt = 0;
  splitAt = 0;
  firstMoveAt: number | null = null;
  finishedAt = 0;
  splits: BlitzSplit[] = [];
  pattern: KPattern;
  moves: string[] = [];
  constructor(readonly cube: Cube, readonly kind: BlitzKind, random = Math.random, settings = defaultBlitzSettings) {
    this.settings = { ...settings };
    const orientations = blitzOrientations(cube).filter(frame =>
      (settings.crossColor === 'Random' || settings.crossColor === frame.crossColor) &&
      (settings.frontColor === 'Random' || settings.frontColor === frame.frontColor));
    if (!orientations.length) throw new Error('Cross and front colors must be adjacent.');
    this.queue = shuffle(algorithms.filter(entry => entry.category === kind && entry.id !== 'Solved').map(entry => {
      const auf = aufMoves[Math.floor(random() * 4)], orientation = orientations[Math.floor(random() * orientations.length)];
      return { ...entry, auf, ...orientation, ...(kind === 'OLL' ? { permutation: randomPLL(random) } :
        { preAuf: auf, postAuf: aufMoves[Math.floor(random() * 4)] }) };
    }), random);
    this.pattern = cube.solved();
  }
  start(now: number) { this.phase = 'countdown'; this.countdownAt = now; }
  tick(now: number) {
    if (this.phase !== 'countdown' || now - this.countdownAt < 3000) return;
    this.phase = 'running'; this.startedAt = this.splitAt = now;
    this.loadCase();
  }
  private loadCase() {
    const entry = this.queue[this.index];
    this.pattern = blitzPattern(this.cube, entry);
    this.moves = [];
    this.firstMoveAt = null;
  }
  move(move: string, now: number): boolean {
    if (this.phase !== 'running' || !isMove(move)) return false;
    this.firstMoveAt ??= now;
    this.pattern = this.pattern.applyMove(move);
    this.moves.push(move);
    const data = this.pattern.patternData;
    const f2l = (['EDGES', 'CORNERS'] as const).every(orbit => data[orbit].pieces.every((piece, i) =>
      i < 4 || piece === i && data[orbit].orientation[i] === 0));
    const done = this.kind === 'PLL' ? this.cube.isSolved(this.pattern) :
      f2l && [...this.cube.facelets(this.pattern).slice(0, 9)].every(face => face === 'U');
    if (!done) return false;
    const { id: caseId, auf, preAuf, postAuf, colorFrame, crossColor, frontColor, permutation } = this.queue[this.index];
    const milliseconds = Math.max(0, now - this.splitAt), recognitionMilliseconds = Math.min(milliseconds, Math.max(0, this.firstMoveAt - this.splitAt));
    this.splits.push({ caseId, auf, preAuf, postAuf, colorFrame, crossColor, frontColor, permutation, milliseconds, recognitionMilliseconds, executionMilliseconds: milliseconds - recognitionMilliseconds });
    this.splitAt = now;
    if (++this.index === this.queue.length) { this.phase = 'complete'; this.finishedAt = now; }
    else this.loadCase();
    return true;
  }
  elapsed(now: number) { return this.phase === 'complete' ? this.finishedAt - this.startedAt : this.phase === 'running' ? now - this.startedAt : 0; }
  result(): BlitzRun {
    if (this.phase !== 'complete') throw new Error('Finish every case before saving a Blitz result.');
    return { id: crypto.randomUUID(), kind: this.kind, date: new Date().toISOString(), milliseconds: this.elapsed(this.finishedAt), splits: [...this.splits], settings: { ...this.settings } };
  }
}
export function readBlitzRuns(): BlitzRun[] {
  const saved = JSON.parse(localStorage.getItem(BLITZ_STORAGE) ?? '[]') as BlitzRun[];
  if (!Array.isArray(saved) || saved.some(run => !run || typeof run.id !== 'string' || !['OLL', 'PLL'].includes(run.kind) ||
    !Number.isFinite(Date.parse(run.date)) || !Number.isFinite(run.milliseconds) || run.milliseconds < 0 ||
    !Array.isArray(run.splits) || run.splits.some(split => !split || typeof split.caseId !== 'string' ||
      !Number.isFinite(split.milliseconds) || split.milliseconds < 0 || (split.auf !== undefined && !aufMoves.includes(split.auf)) ||
      (split.preAuf !== undefined && !aufMoves.includes(split.preAuf)) || (split.postAuf !== undefined && !aufMoves.includes(split.postAuf)) ||
      ((split.preAuf === undefined) !== (split.postAuf === undefined)) ||
      !validSplitTiming(split) ||
      (split.colorFrame !== undefined && (typeof split.colorFrame !== 'string' || !/^(?:[xz](?:2|')?)?(?: ?y(?:2|')?)?$/.test(split.colorFrame))) ||
      (split.crossColor !== undefined && !cubeColors.includes(split.crossColor)) ||
      (split.frontColor !== undefined && !cubeColors.includes(split.frontColor)) ||
      (split.permutation !== undefined && !validPermutation(split.permutation))) ||
    (run.settings !== undefined && (!run.settings || typeof run.settings.upcomingCases !== 'boolean' || typeof run.settings.caseNames !== 'boolean' ||
      (run.settings.hidePLL !== undefined && typeof run.settings.hidePLL !== 'boolean') ||
      ![...cubeColors, 'Random'].includes(run.settings.crossColor) || ![...cubeColors, 'Random'].includes(run.settings.frontColor))))) throw new Error('Saved Blitz results could not be read.');
  return saved;
}
export function saveBlitzRun(run: BlitzRun) {
  const runs = readBlitzRuns();
  localStorage.setItem(BLITZ_STORAGE, JSON.stringify([run, ...runs.filter(saved => saved.id !== run.id)]));
}
