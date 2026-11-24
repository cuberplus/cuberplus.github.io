import { locations, randomStagePattern, SOLVED, type Cube } from '../../timer/src/Core/puzzle';
import type { PieceSelection } from '../../timer/src/Analysis/f2lSuggestions';
import { blitzOrientations, type CubeColor } from './blitz';

export const ORIENTATION_ATTEMPTS = 'cuberplus-orientation-attempts-v1';
export const ORIENTATION_SETTINGS = 'cuberplus-orientation-settings-v1';
export const ORIENTATION_CAMERA = { latitude: 35, longitude: 25 };
const visibleEdges = [0, 1, 8]; // UF, UR and FR expose both stickers from the fixed camera.
export const orientationStages = { scrambled: 'Scrambled', 'cross-solved': 'Cross solved', 'f2l-solved': 'F2L solved' } as const;
export type OrientationStage = keyof typeof orientationStages;
export interface OrientationSettings { stage: OrientationStage; gray: boolean; topColor: CubeColor | 'Random'; frontColor: CubeColor | 'Random' }
export const defaultOrientationSettings: OrientationSettings = { stage: 'scrambled', gray: false, topColor: 'White', frontColor: 'Green' };
export const orientationStagePieces: Record<OrientationStage, PieceSelection> = {
  scrambled: {},
  'cross-solved': { EDGES: [4, 5, 6, 7] },
  'f2l-solved': { EDGES: [4, 5, 6, 7, 8, 9, 10, 11], CORNERS: [4, 5, 6, 7] },
};
export interface OrientationCard {
  id: string; stage: OrientationStage; facelets: string; edge: number; position: number; oriented: boolean; caseKey: string; colorFrame?: string;
}
export interface OrientationAttempt extends OrientationCard {
  date: string; answer: boolean; correct: boolean; milliseconds: number; gray: boolean;
}
export const edgeName = (position: number) => locations.EDGES[position].map(index => SOLVED[index]).join('');
export function orientationCard(cube: Cube, stage: OrientationStage, random = Math.random,
  colors: Pick<OrientationSettings, 'topColor' | 'frontColor'> = defaultOrientationSettings): OrientationCard {
  let pattern = randomStagePattern(cube, stage, random);
  if (visibleEdges.every(i => pattern.patternData['EDGES'].pieces[i] === i && !pattern.patternData['EDGES'].orientation[i])) pattern = pattern.applyMove('U');
  const data = pattern.patternData['EDGES'];
  const candidates = visibleEdges.filter(i => data.pieces[i] !== i || data.orientation[i]);
  const position = candidates[Math.floor(random() * candidates.length)], edge = data.pieces[position], facelets = cube.facelets(pattern);
  const opposite: Record<CubeColor, CubeColor> = { White: 'Yellow', Yellow: 'White', Red: 'Orange', Orange: 'Red', Green: 'Blue', Blue: 'Green' };
  const frames = blitzOrientations(cube).filter(frame => (colors.topColor === 'Random' || frame.crossColor === opposite[colors.topColor]) &&
    (colors.frontColor === 'Random' || frame.frontColor === colors.frontColor));
  if (!frames.length) throw new Error('Top and front colors must be adjacent.');
  const colorFrame = frames[Math.floor(random() * frames.length)].colorFrame;
  return { id: crypto.randomUUID(), stage, facelets, edge, position, oriented: data.orientation[position] === 0, colorFrame,
    caseKey: `${facelets}:${edge}${colorFrame ? `:${colorFrame}` : ''}` };
}
export function readOrientationAttempts(): OrientationAttempt[] {
  const saved = JSON.parse(localStorage.getItem(ORIENTATION_ATTEMPTS) ?? '[]') as OrientationAttempt[];
  if (!Array.isArray(saved) || saved.some(item => !item || typeof item.id !== 'string' || typeof item.caseKey !== 'string' ||
    !Object.hasOwn(orientationStages, item.stage) || !/^[URFDLB]{54}$/.test(item.facelets) || !Number.isFinite(Date.parse(item.date)) ||
    ![item.edge, item.position].every(n => Number.isInteger(n) && n >= 0 && n < 12) ||
    ![item.oriented, item.answer, item.correct, item.gray].every(n => typeof n === 'boolean') ||
    item.correct !== (item.answer === item.oriented) || !Number.isFinite(item.milliseconds) || item.milliseconds < 0 ||
    (item.colorFrame !== undefined && (typeof item.colorFrame !== 'string' || !/^(?:[xz](?:2|')?)?(?: ?y(?:2|')?)?$/.test(item.colorFrame)))))
    throw new Error('Saved flashcard results could not be read. Existing results have not been overwritten.');
  return saved;
}
export function saveOrientationAttempt(attempt: OrientationAttempt): void {
  localStorage.setItem(ORIENTATION_ATTEMPTS, JSON.stringify([attempt, ...readOrientationAttempts().filter(item => item.id !== attempt.id)]));
}
export function orientationStats(attempts: OrientationAttempt[]) {
  const groups = new Map<string, OrientationAttempt[]>();
  for (const attempt of attempts) {
    const key = `${attempt.stage}:${attempt.position}:${attempt.oriented}`;
    groups.set(key, [...groups.get(key) ?? [], attempt]);
  }
  return [...groups].map(([key, rows]) => ({ key, ...rows.reduce((latest, row) => Date.parse(row.date) > Date.parse(latest.date) ? row : latest), count: rows.length, accuracy: rows.filter(row => row.correct).length / rows.length,
    average: rows.reduce((sum, row) => sum + row.milliseconds, 0) / rows.length })).sort((a, b) => a.accuracy - b.accuracy || b.average - a.average);
}
