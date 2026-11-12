import { parseCsv } from '../../../smartcubeanalyzer/src/Data/CsvParser';
import type { Solve as Analysis } from '../../../smartcubeanalyzer/src/Models/Types';
import type { Cube } from '../Core/puzzle';
import { solveTime, type Solve } from '../Core/engine';
import { cubeastCSV, readSolves, saveSolves, turns } from '../Data/storage';
import { importedAnalysis, validImported } from '../Data/csvImport';
import { loadCube, SOLVED } from '../Core/puzzle';
import type { DataProgress } from '../../../shared/workers/dataTasks';
import { MISTAKES } from '../../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { CrossColor, MethodName, StepName } from '../../../smartcubeanalyzer/src/Models/Types';
import { analyzeCFOP, cfopKey, recordingKey } from './cfop';
import { completedF2LCross } from '../../../shared/cube/f2l';
import { COLORS } from '../../../scrambler/src/cube/cube';

export const ANALYSIS_VERSION = 2;
export const analysisKey = (solve: Solve) => JSON.stringify([solve.crossOverride, solve.status, solve.penalty, solve.duration, solve.session, solve.inspection, solve.createdAt, solve.timingBasis, solve.startFacelets, recordingKey(solve)]);
const serialize = ({ date, endDate, ...data }: Analysis): NonNullable<Solve['imported']> => ({ ...data, date: date.toISOString(), endDate: endDate?.toISOString() });
const restore = (data: NonNullable<Solve['imported']>): Analysis => ({ ...data, date: new Date(data.date), endDate: data.endDate ? new Date(data.endDate) : undefined });
export function validAnalysis(solve: Solve): boolean {
  const cached = solve.analysis, data = cached?.data;
  return !!cached && cached.version === ANALYSIS_VERSION && cached.key === analysisKey(solve) && !!data &&
    ['cubeast', 'acubemy', 'timer'].includes(data.source) &&
    validImported({ ...solve, createdAt: data.date, moves: [], startFacelets: SOLVED, imported: { ...data, steps: data.steps?.filter(step => step?.name || step?.moves || step?.time), source: data.source === 'timer' ? 'cubeast' : data.source } }) &&
    (data.mistakes === undefined || Array.isArray(data.mistakes) && data.mistakes.every(mistake => mistake &&
      Object.hasOwn(MISTAKES, mistake.kind) && (mistake.step === undefined || Object.values(StepName).includes(mistake.step)) &&
      (mistake.estimatedSeconds === undefined || Number.isFinite(mistake.estimatedSeconds) && mistake.estimatedSeconds >= 0)));
}

export function solveAnalysis(solve: Solve, cube: Cube): Analysis {
  const key = analysisKey(solve);
  // CSV interchange rounds milliseconds and dates; local statistics must retain Timer's original precision, including older caches.
  const timing = { time: solveTime(solve) / 1000, date: new Date(solve.createdAt), inspectionTime: solve.inspection === undefined ? null : solve.inspection / 1000 };
  if (solve.analysis?.version === ANALYSIS_VERSION && solve.analysis.key === key) return { ...restore(solve.analysis.data), ...timing };
  const data = solve.imported ? importedAnalysis(solve) : { ...parseCsv(cubeastCSV([solve], cube), ',')[0], ...timing, source: 'timer' as const, rawSource: 'timer', isCorrupt: false };
  if (!solve.imported) solve.cfop = { ...analyzeCFOP(solve, cube), version: 1, key: cfopKey(solve) };
  rememberAnalysis(solve, data);
  return data;
}

export function recordAnalysis(solve: Solve): Analysis {
  const cached = solve.imported ? importedAnalysis(solve) : solve.analysis?.data ? restore(solve.analysis.data) : undefined;
  const count = cached?.turns ?? turns(solve);
  return {
    id: solve.id, source: 'timer', crossColor: CrossColor.Unknown, scramble: solve.scramble,
    tps: solve.duration > 0 ? count * 1000 / solve.duration : 0, turns: count, inspectionTime: null,
    recognitionTime: 0, executionTime: 0, preAufTime: 0, postAufTime: 0,
    isCorrupt: false, method: MethodName.CFOP, isMistake: false, isFullStep: true,
    ...cached, time: solveTime(solve) / 1000, date: new Date(solve.createdAt), session: solve.session,
    endDate: cached?.endDate ?? new Date(Date.parse(solve.createdAt) + (solve.moves.at(-1)?.elapsed ?? solve.duration)),
    dnf: solve.status === 'incomplete', steps: cached?.steps.map(step => ({ ...step, moves: '' })) ?? [],
    recording: undefined, mistakes: undefined,
  };
}

export function rememberAnalysis(solve: Solve, data: Analysis): void {
  solve.analysis = { version: ANALYSIS_VERSION, key: analysisKey(solve), data: serialize(data) };
}

export async function persistReplayAnalysis(solve: Solve, cube: Cube): Promise<void> {
  const key = cfopKey(solve);
  if (!solve.moves.length || solve.status === 'active' || solve.cfop?.key === key) return;
  const updated: Solve = { ...solve, cfop: { ...analyzeCFOP(solve, cube), version: 1, key } };
  solveAnalysis(updated, cube);
  await saveSolves([updated], true);
  solve.cfop = updated.cfop;
}

export function reanalyzeSolve(solve: Solve, cube: Cube, crossOverride: number | undefined): Solve {
  const updated: Solve = { ...solve, crossOverride, analysis: undefined, cfop: undefined };
  if (updated.imported?.method === MethodName.CFOP && updated.moves.length) {
    const recording: Solve = { ...updated, imported: undefined, crossOverride: crossOverride ?? completedF2LCross(updated.scramble,
      updated.moves.map(move => move.move).join(' '), COLORS.indexOf(updated.imported.crossColor as typeof COLORS[number])) };
    const data = solveAnalysis(recording, cube);
    updated.cfop = { ...recording.cfop!, key: cfopKey(updated) };
    const original = restore(updated.imported);
    updated.imported = serialize({ ...original, ...data, steps: data.steps.filter(step => step.name), id: original.id, date: original.date, endDate: original.endDate,
      inspectionTime: original.inspectionTime, source: original.source, rawSourceId: original.rawSourceId, rawSource: original.rawSource });
  } else if (updated.imported) {
    updated.imported = { ...updated.imported, mistakes: undefined, mistakeContext: undefined };
  }
  solveAnalysis(updated, cube);
  return updated;
}

export async function reanalyzeAllSolves(progress: (value: DataProgress) => void): Promise<DataProgress> {
  const solves = await readSolves(), start = performance.now();
  const result: DataProgress = { processed: 0, total: solves.length, analyzed: 0, skipped: 0, failed: 0, remainingMs: null };
  progress({ ...result });
  const cube = await loadCube();
  let batch: Solve[] = [];
  for (const solve of solves) {
    if (solve.status === 'active' || !solve.moves.length || solve.imported && solve.imported.method !== MethodName.CFOP) result.skipped++;
    else {
      try { batch.push(reanalyzeSolve(solve, cube, solve.crossOverride)); result.analyzed++; }
      catch { result.failed++; }
    }
    result.processed++;
    if (result.processed % 50 === 0 || result.processed === result.total) {
      await saveSolves(batch, 'reanalysis'); batch = [];
      result.remainingMs = (performance.now() - start) / result.processed * (result.total - result.processed);
      progress({ ...result });
    }
  }
  return { ...result, remainingMs: 0 };
}

export async function persistAnalysis(solves: Solve[], records: Analysis[]): Promise<void> {
  const byId = new Map(records.map(record => [record.id, record]));
  const changed = solves.filter(solve => {
    const record = byId.get(solve.id);
    if (!record) return false;
    const previous = JSON.stringify(solve.analysis);
    rememberAnalysis(solve, record);
    return previous !== JSON.stringify(solve.analysis);
  });
  if (changed.length) await saveSolves(changed, true);
}
