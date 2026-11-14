import type { KPattern } from 'cubing/kpuzzle';
import { casePattern, type AlgorithmCase } from '../database/algorithms';
import { caseKey } from './cases';
import { inverse, isMove, type Cube } from '../../timer/src/Core/puzzle';
import { normalized } from '../../timer/src/Analysis/cases';
import { aufMoves, blitzOrientations, type BlitzSettings } from './blitz';

export const PRACTICE_STORAGE = 'cuberplus-trainer-practice-v1';
export const TRAININGS_STORAGE = 'cuberplus-trainer-custom-v1';
export interface CustomTraining { id: string; name: string; cases: string[] }
export interface PracticeAttempt {
  id: string; date: string; trainingId: string; caseKey: string; algorithm: string | null;
  recognitionMilliseconds: number; executionMilliseconds: number;
  dnf?: boolean;
}
interface PracticeCase extends AlgorithmCase {
  preAuf: string; postAuf: string; solution: string; pattern: KPattern; colorFrame: string;
}
export function readTrainings(): CustomTraining[] {
  const saved = JSON.parse(localStorage.getItem(TRAININGS_STORAGE) ?? '[]') as CustomTraining[];
  if (!Array.isArray(saved) || saved.some(item => !item || typeof item.id !== 'string' || typeof item.name !== 'string' ||
    !Array.isArray(item.cases) || !item.cases.length || item.cases.some(key => typeof key !== 'string'))) throw new Error('Saved custom trainings could not be read.');
  return saved;
}
export function readAttempts(): PracticeAttempt[] {
  const saved = JSON.parse(localStorage.getItem(PRACTICE_STORAGE) ?? '[]') as PracticeAttempt[];
  if (!Array.isArray(saved) || saved.some(item => !item || typeof item.id !== 'string' || typeof item.caseKey !== 'string' ||
    typeof item.trainingId !== 'string' || !Number.isFinite(Date.parse(item.date)) || (item.dnf !== undefined && typeof item.dnf !== 'boolean') ||
    ![item.recognitionMilliseconds, item.executionMilliseconds].every(time => Number.isFinite(time) && time >= 0))) throw new Error('Saved practice timings could not be read.');
  return saved;
}
export function saveAttempt(attempt: PracticeAttempt) {
  localStorage.setItem(PRACTICE_STORAGE, JSON.stringify([attempt, ...readAttempts().filter(item => item.id !== attempt.id)]));
}
export class Practice {
  readonly queue: PracticeCase[] = [];
  phase: 'countdown' | 'running' | 'cancelled' = 'countdown';
  countdownAt: number;
  splitAt = 0;
  firstMoveAt: number | null = null;
  pattern: KPattern;
  initialPattern: KPattern;
  solution = '';
  preAuf = '';
  postAuf = '';
  moves: string[] = [];
  colorFrame = '';
  private preservedPairs: number[] = [];
  private readonly frames: ReturnType<typeof blitzOrientations>;
  constructor(readonly cube: Cube, readonly cases: AlgorithmCase[], readonly trainingId: string,
    readonly settings: BlitzSettings, now: number, readonly random = Math.random, readonly algorithm: string | null = null) {
    if (!cases.length) throw new Error('Choose at least one case.');
    this.frames = blitzOrientations(cube).filter(frame =>
      (settings.crossColor === 'Random' || frame.crossColor === settings.crossColor) &&
      (settings.frontColor === 'Random' || frame.frontColor === settings.frontColor));
    if (!this.frames.length) throw new Error('Cross and front colors must be adjacent.');
    this.countdownAt = now;
    this.initialPattern = this.pattern = cube.solved();
    this.fillQueue();
  }
  private fillQueue() {
    while (this.queue.length < 4) {
      const entry = this.cases[Math.floor(this.random() * this.cases.length)];
      const preAuf = this.settings.randomPreAuf !== false ? aufMoves[Math.floor(this.random() * 4)] : '';
      const postAuf = this.settings.randomPostAuf !== false ? aufMoves[Math.floor(this.random() * 4)] : '';
      const solution = [preAuf, this.algorithm ?? entry.algorithm, postAuf].filter(Boolean).join(' ');
      const pattern = !this.algorithm && entry.setup
        ? this.cube.solved().applyAlg(postAuf ? inverse(postAuf) : '').applyAlg(entry.setup).applyAlg(preAuf ? inverse(preAuf) : '')
        : casePattern(this.cube, solution);
      this.queue.push({ ...entry, preAuf, postAuf, solution, pattern,
        colorFrame: this.frames[Math.floor(this.random() * this.frames.length)].colorFrame });
    }
  }
  tick(now: number) {
    if (this.phase !== 'countdown' || now - this.countdownAt < 3000) return;
    this.phase = 'running'; this.splitAt = now; this.loadCase();
  }
  private loadCase() {
    const entry = this.queue[0];
    this.preAuf = entry.preAuf; this.postAuf = entry.postAuf; this.solution = entry.solution;
    this.initialPattern = this.pattern = entry.pattern;
    this.preservedPairs = [4, 5, 6, 7].filter(pair => this.pairSolved(this.pattern, pair));
    this.colorFrame = entry.colorFrame;
    this.moves = []; this.firstMoveAt = null;
  }
  private pairSolved(pattern: KPattern, corner: number) {
    return (['CORNERS', 'EDGES'] as const).every((orbit, i) => {
      const index = i ? [8, 9, 11, 10][corner - 4] : corner, data = pattern.patternData[orbit];
      return data.pieces[index] === index && !data.orientation[index];
    });
  }
  move(move: string, now: number): PracticeAttempt | null {
    if (this.phase !== 'running' || !isMove(move)) return null;
    this.firstMoveAt ??= now;
    this.pattern = this.pattern.applyMove(move); this.moves.push(move);
    const entry = this.queue[0], pattern = normalized(this.cube, this.pattern, '');
    const cross = [4, 5, 6, 7].every(i => pattern.patternData['EDGES'].pieces[i] === i && !pattern.patternData['EDGES'].orientation[i]);
    const pairs = [4, 5, 6, 7].every(pair => this.pairSolved(pattern, pair));
    const done = entry.category === 'PLL' ? this.cube.isSolved(pattern) :
      entry.category === 'OLL' ? cross && pairs && this.cube.facelets(pattern).slice(0, 9) === 'UUUUUUUUU' :
      entry.category === 'F2L' ? cross && pairs :
        cross && [...this.preservedPairs, entry.pair ?? 4].every(pair => this.pairSolved(pattern, pair));
    if (!done) return null;
    return this.finishAttempt(now);
  }
  skip(now: number): PracticeAttempt | null {
    return this.phase === 'running' ? this.finishAttempt(now, true) : null;
  }
  retry(now: number): PracticeAttempt | null {
    return this.phase === 'running' ? this.finishAttempt(now, true, true) : null;
  }
  private finishAttempt(now: number, dnf = false, retry = false): PracticeAttempt {
    const entry = this.queue[0], firstMoveAt = this.firstMoveAt ?? now;
    const attempt = { id: crypto.randomUUID(), date: new Date().toISOString(), trainingId: this.trainingId, caseKey: caseKey(entry),
      algorithm: this.algorithm, recognitionMilliseconds: Math.max(0, firstMoveAt - this.splitAt),
      executionMilliseconds: Math.max(0, now - firstMoveAt), ...(dnf && { dnf: true }) };
    this.splitAt = now;
    if (retry) { this.pattern = this.initialPattern; this.moves = []; this.firstMoveAt = null; }
    else { this.queue.shift(); this.fillQueue(); this.loadCase(); }
    return attempt;
  }
}
