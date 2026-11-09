import { parseCsv } from '../../../smartcubeanalyzer/src/Data/CsvParser';
import type { Solve as Analysis } from '../../../smartcubeanalyzer/src/Models/Types';
import type { Cube } from '../Core/puzzle';
import type { Solve } from '../Core/engine';
import { cubeastCSV, saveSolves } from '../Data/storage';
import { importedAnalysis, validImported } from '../Data/csvImport';
import { SOLVED } from '../Core/puzzle';
import { MISTAKES } from '../../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { StepName } from '../../../smartcubeanalyzer/src/Models/Types';
import { analyzeCFOP, cfopKey, recordingKey } from './cfop';

export const ANALYSIS_VERSION = 1;
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
  if (solve.analysis?.version === ANALYSIS_VERSION && solve.analysis.key === key) return restore(solve.analysis.data);
  const data = solve.imported ? importedAnalysis(solve) : { ...parseCsv(cubeastCSV([solve], cube), ',')[0], source: 'timer' as const, rawSource: 'timer', isCorrupt: false };
  if (!solve.imported) solve.cfop = { ...analyzeCFOP(solve, cube), version: 1, key: cfopKey(solve) };
  rememberAnalysis(solve, data);
  return data;
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
  if (updated.imported && updated.moves.length) {
    const recording: Solve = { ...updated, imported: undefined };
    const data = solveAnalysis(recording, cube);
    updated.cfop = recording.cfop;
    updated.imported = serialize({ ...data, source: updated.imported.source, rawSourceId: updated.imported.rawSourceId, rawSource: updated.imported.rawSource });
  } else if (updated.imported) {
    updated.imported = { ...updated.imported, mistakes: undefined, mistakeContext: undefined };
  }
  solveAnalysis(updated, cube);
  return updated;
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
