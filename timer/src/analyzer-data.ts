import { cubeastCSV, readSolves } from './storage';
import { loadCube } from './puzzle';
import { parseCsv } from '../../smartcubeanalyzer/src/Helpers/CsvParser';
import { importedAnalysis } from './csvImport';

export async function readTimerData(): Promise<string> {
  const solves = (await readSolves()).filter(solve => !solve.imported);
  return solves.some(solve => solve.status !== 'active') ? cubeastCSV(solves, await loadCube()) : '';
}

export async function readLocalAnalysis() {
  const solves = (await readSolves()).filter(solve => solve.status !== 'active');
  const native = solves.filter(solve => !solve.imported);
  return [...(native.length ? parseCsv(cubeastCSV(native, await loadCube()), ',').map(solve => ({ ...solve, source: 'timer' as const, rawSource: 'timer' })) : []),
    ...solves.filter(solve => solve.imported).map(importedAnalysis)];
}
