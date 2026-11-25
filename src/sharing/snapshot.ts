import type { Solve } from '../../timer/src/Core/engine';
import type { Solve as AnalyzedSolve } from '../../smartcubeanalyzer/src/Models/Types';
import type { AverageRow } from '../../timer/src/Components/AverageDialog';

export type Snapshot = {
  format: 'cuberplus-share-v1'; kind: 'solve' | 'average' | 'collection';
  time: number | 'DNF'; rows: AverageRow<Solve>[];
};
export const MAX_SHARE_BYTES = 32 * 1024 * 1024;
// An allowlist deliberately excludes session/device names, source IDs, notes and caches.
export function publicSolve(solve: Solve, index: number): Solve {
  const id = `shared-${index + 1}`, session = 'Shared';
  const data = solve.imported;
  return {
    version: 1, id, session, device: '', reason: '', createdAt: solve.createdAt,
    scramble: solve.scramble, startFacelets: solve.startFacelets, duration: solve.duration,
    status: solve.status, timingBasis: 'host', inspection: solve.inspection,
    penalty: solve.penalty, penaltyReason: solve.penaltyReason, dnfReason: solve.dnfReason,
    crossOverride: solve.crossOverride,
    moves: solve.moves.map(({ move, elapsed }) => ({ move, elapsed, hostTime: elapsed, localTimestamp: null, cubeTimestamp: null })),
    ...(data ? { imported: {
      id, session, source: data.source, date: solve.createdAt, endDate: data.endDate,
      method: data.method, crossColor: data.crossColor, firstF2LPair: data.firstF2LPair,
      time: data.time, turns: data.turns, tps: data.tps, inspectionTime: data.inspectionTime,
      recognitionTime: data.recognitionTime, executionTime: data.executionTime,
      preAufTime: data.preAufTime, postAufTime: data.postAufTime,
      scramble: solve.scramble, dnf: data.dnf, isCorrupt: data.isCorrupt, isFullStep: data.isFullStep, isMistake: false,
      steps: data.steps.map(({ name, time, turns, tps, moves, case: caseName, recognitionTime, executionTime, preAufTime, postAufTime }) =>
        ({ name, time, turns, tps, moves, case: caseName, recognitionTime, executionTime, preAufTime, postAufTime })),
    } } : {}),
  };
}
export async function makeSnapshot(rows: AverageRow<Solve | AnalyzedSolve>[], time: number | 'DNF', kind: Snapshot['kind']): Promise<Snapshot> {
  const [{ loadCube }, { readSelectedSolves }, { previewSolve }] = await Promise.all([
    import('../../timer/src/Core/puzzle'), import('../../timer/src/Data/storage'), import('../../timer/src/Data/csvImport'),
  ]);
  const cube = await loadCube();
  const ids = rows.flatMap(row => 'version' in row.solve ? [] : [row.solve.id]);
  const saved = ids.length ? await readSelectedSolves(ids) : new Map<string, Solve>();
  const publicRows = rows.map((row, index) => {
    const original = 'version' in row.solve ? row.solve : saved.get(row.solve.id) ?? previewSolve(row.solve, cube);
    if (original.imported?.source === 'timer') throw new Error('This Timer recording is no longer saved locally. Re-import its backup before sharing.');
    const solve = publicSolve(original, index);
    return { solve, number: row.number, time: row.time, turns: row.turns, tps: row.tps, trimmed: row.trimmed, penalty: row.penalty };
  });
  return validateSnapshot({ format: 'cuberplus-share-v1', kind, time, rows: publicRows });
}
export async function singleSnapshot(solve: Solve): Promise<Snapshot> {
  const [{ solveTime }, { turns }] = await Promise.all([import('../../timer/src/Core/engine'), import('../../timer/src/Data/storage')]);
  return makeSnapshot([{
    solve, number: 1, time: solve.status === 'complete' ? solveTime(solve) / 1000 : 'DNF', turns: turns(solve),
    tps: solve.duration > 0 ? turns(solve) * 1000 / solve.duration : null, trimmed: null, penalty: (solve.penalty ?? 0) / 1000,
  }], solve.status === 'complete' ? solveTime(solve) / 1000 : 'DNF', 'solve');
}

export async function validateSnapshot(value: Snapshot): Promise<Snapshot> {
  const nonnegative = (n: number) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const time = (n: number | 'DNF') => n === 'DNF' || nonnegative(n);
  if (!value || value.format !== 'cuberplus-share-v1' || !['solve', 'average', 'collection'].includes(value.kind) ||
      !time(value.time) || !Array.isArray(value.rows) || !value.rows.length || value.rows.length > 10000 ||
      value.kind === 'solve' && value.rows.length !== 1) throw new Error('Not a valid CuberPlus shared snapshot.');
  const numbers = new Set<number>();
  for (const row of value.rows) {
    if (!row || !Number.isSafeInteger(row.number) || row.number < 1 || numbers.has(row.number) || !time(row.time) ||
        !nonnegative(row.turns) || row.tps !== null && !nonnegative(row.tps) ||
        row.penalty !== undefined && !nonnegative(row.penalty) || ![null, 'best', 'worst'].includes(row.trimmed) ||
        !row.solve || row.solve.status === 'active') throw new Error('Invalid shared solve row.');
    numbers.add(row.number);
  }
  const [{ loadCube }, { validateBackupData }] = await Promise.all([import('../../timer/src/Core/puzzle'), import('../../timer/src/Data/storage')]);
  const solves = validateBackupData({ format: 'timer-v1', solves: value.rows.map(row => row.solve) }, await loadCube());
  return { format: value.format, kind: value.kind, time: value.time, rows: value.rows.map((row, index) => ({
    solve: publicSolve(solves[index], index), number: row.number, time: row.time, turns: row.turns, tps: row.tps,
    trimmed: row.trimmed, ...(row.penalty ? { penalty: row.penalty } : {}),
  })) };
}
