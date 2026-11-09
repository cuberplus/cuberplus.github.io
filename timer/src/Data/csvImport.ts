import { parseCsv, parseRecordedMoves, tokenizeMoves } from '../../../smartcubeanalyzer/src/Data/CsvParser';
import { CrossColor, MethodName, StepName, type Solve as AnalyzedSolve } from '../../../smartcubeanalyzer/src/Models/Types';
import { solveTime, type Solve } from '../Core/engine';
import { readSolves, saveSolves } from './storage';
import { loadCube, movesOf, isMove, SOLVED, type Cube } from '../Core/puzzle';
import { algorithmMatcher } from '../Analysis/algorithmMatching';
import type { KPattern } from 'cubing/kpuzzle';

function rebuildRecording(solve: Solve, recording: AnalyzedSolve['recording'], cube: Cube, applyMoves: (pattern: KPattern, moves: string[]) => KPattern): void {
  const scramble = movesOf(solve.scramble);
  if (!recording?.solution || !scramble.length || scramble.some(move => !isMove(move))) return;
  try {
    const times = recording.timestamps === undefined ? null : tokenizeMoves(recording.timestamps).map(Number);
    const tokens = times === null ? parseRecordedMoves(recording.solution, true)
      : tokenizeMoves(recording.solution).map((move, index) => ({ move, timestamp: times[index] }));
    if (!tokens.length || tokens.length !== (times?.length ?? tokenizeMoves(recording.solution).length) ||
      tokens.some(turn => !Number.isFinite(turn.timestamp) || turn.timestamp < 0 || turn.timestamp > solve.duration + 1)) return;
    const moves: Solve['moves'] = [];
    const record = (move: string, index: number) => {
      const hostTime = tokens[index].timestamp;
      // Some exports have inverted timestamps: retain them without reversing recorded turns.
      moves.push({ move, elapsed: Math.max(moves.at(-1)?.elapsed ?? 0, hostTime), hostTime, localTimestamp: null, cubeTimestamp: null });
    };
    if (tokens.every(turn => isMove(turn.move))) tokens.forEach((turn, index) => record(turn.move.replace("2'", '2'), index));
    else algorithmMatcher(cube).outerMoves(tokens.map(turn => turn.move).join(' '), record);
    const start = applyMoves(cube.solved(), scramble);
    const finished = cube.equals(applyMoves(start, moves.map(turn => turn.move)), cube.solved());
    if (!moves.length || (!finished && (solve.status === 'complete' || !solve.imported?.dnf))) return;
    solve.startFacelets = cube.facelets(start);
    solve.moves = moves;
    if (!finished) solve.dnfReason = 'solve interrupted';
  } catch { /* Invalid or ambiguous recordings remain analysis-only imports. */ }
}

export const sourceLabel = (solve: Solve): string => solve.imported?.source === 'cubeast' ? 'Cubeast (imported)' : solve.imported?.source === 'acubemy' ? 'Acubemy (imported)' : 'CuberPlus';
export function importedAnalysis(solve: Solve): AnalyzedSolve {
  const data = solve.imported!;
  return { ...data, id: solve.id, date: new Date(solve.createdAt), endDate: data.endDate ? new Date(data.endDate) : undefined,
    time: solveTime(solve) / 1000, dnf: solve.status !== 'complete', session: solve.session };
}

export function validImported(solve: Solve): boolean {
  const data = solve.imported;
  const number = (value: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const text = (value: string, max = 1000) => typeof value === 'string' && value.length <= max;
  return !!data && ['cubeast', 'acubemy'].includes(data.source) && text(data.id, 100) && !!data.id &&
    text(data.rawSourceId ?? '', 100) && text(data.rawSource ?? '', 100) &&
    text(data.date, 100) && Number.isFinite(Date.parse(data.date)) && data.date === solve.createdAt &&
    (data.endDate === undefined || (text(data.endDate, 100) && Number.isFinite(Date.parse(data.endDate)))) &&
    Object.values(MethodName).includes(data.method) && Object.values(CrossColor).includes(data.crossColor) &&
    text(data.scramble) && data.scramble === solve.scramble && text(data.session, 100) && text(data.firstF2LPair ?? '', 100) &&
    ['isCorrupt', 'isFullStep', 'isMistake'].every(key => typeof data[key as 'isCorrupt'] === 'boolean') &&
    (data.dnf === undefined || typeof data.dnf === 'boolean') &&
    [data.time, data.tps, data.turns, data.recognitionTime, data.executionTime, data.preAufTime, data.postAufTime].every(number) &&
    (data.inspectionTime === null || number(data.inspectionTime)) &&
    Array.isArray(data.steps) && data.steps.length <= 9 && data.steps.every(step => !!step &&
      Object.values(StepName).includes(step.name) && text(step.moves, 10000) && text(step.case, 200) &&
      [step.time, step.executionTime, step.recognitionTime, step.preAufTime, step.postAufTime, step.turns, step.tps].every(number)) &&
    (solve.moves.length > 0 || solve.startFacelets === SOLVED) && solve.status !== 'active';
}

export async function importSolveCSVs(files: File[]): Promise<{ added: number; duplicates: number }> {
  const parsed = (await Promise.all(files.map(async file => {
    const csv = (await file.text()).replace(/^\uFEFF/, ''), header = csv.slice(0, csv.indexOf('\n') < 0 ? csv.length : csv.indexOf('\n')).trim();
    if (!header.startsWith('solve_id,date,total_time') && (!header.split(',').includes('id') || !header.split(',').includes('date') ||
      !header.split(',').some(column => ['time', 'solving_time'].includes(column)))) throw new Error(`${file.name}: not a Cubeast or Acubemy CSV.`);
    return parseCsv(csv, ',', true);
  }))).flat();
  if (!parsed.length) throw new Error('No solves found in the selected CSV files.');
  const existing = new Map((await readSolves()).map(solve => [solve.id, solve])), added = new Map<string, Solve>(), upgraded = new Map<string, Solve>();
  const cube = await loadCube();
  const transforms = new Map([...'URFDLB'].flatMap(face => ['', '2', "'", "2'"].map(suffix =>
    [face + suffix, cube.puzzle.moveToTransformation(face + suffix)] as const)));
  const applyMoves = (pattern: KPattern, moves: string[]) => moves.reduce((state, move) => state.applyTransformation(transforms.get(move)!), pattern);
  let duplicates = 0;
  for (const data of parsed) {
    const id = `${data.source}:${data.rawSourceId || data.id}`;
    if (existing.get(id)?.moves.length || added.has(id)) { duplicates++; continue; }
    const { date, endDate, recording, ...analysis } = data;
    if (endDate && !Number.isFinite(endDate.getTime())) throw new Error(`Invalid ${data.source} solve ${data.id}. No solves were imported.`);
    analysis.steps = analysis.steps.filter(step => step.name || step.moves || step.case ||
      [step.time, step.turns, step.tps, step.recognitionTime, step.executionTime, step.preAufTime, step.postAufTime].some(value => value !== 0));
    const solve: Solve = {
      version: 1, id, session: data.session || 'Default', createdAt: Number.isFinite(date.getTime()) ? date.toISOString() : '',
      device: data.source === 'cubeast' ? 'Cubeast' : 'Acubemy', scramble: data.scramble, startFacelets: SOLVED,
      duration: data.time * 1000, inspection: data.inspectionTime === null ? undefined : data.inspectionTime * 1000,
      status: data.dnf ? 'incomplete' : 'complete', dnfReason: data.dnf ? 'manual' : undefined,
      reason: '', timingBasis: 'host', moves: [],
      imported: { ...analysis, date: Number.isFinite(date.getTime()) ? date.toISOString() : '', endDate: endDate?.toISOString() },
    };
    if (id.length > 100 || !validImported(solve)) throw new Error(`Invalid ${data.source} solve ${data.id || '(missing ID)'}. No solves were imported.`);
    if (existing.has(id) || added.has(id)) {
      duplicates++;
      const previous = existing.get(id);
      if (previous?.imported && !previous.moves.length && previous.scramble === solve.scramble && !upgraded.has(id)) {
        const updated = { ...previous };
        rebuildRecording(updated, recording, cube, applyMoves);
        if (updated.moves.length) upgraded.set(id, updated);
      }
      continue;
    }
    rebuildRecording(solve, recording, cube, applyMoves);
    added.set(id, solve);
  }
  await saveSolves([...added.values(), ...upgraded.values()]);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('timer-solves-changed'));
  return { added: added.size, duplicates };
}
