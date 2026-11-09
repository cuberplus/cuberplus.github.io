import { cubeastCSV, readSolves } from '../Data/storage';
import { loadCube } from '../Core/puzzle';
import { persistAnalysis, solveAnalysis } from './analysis';
import { markMistakes } from '../../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { CalculateWindowSize } from '../../../smartcubeanalyzer/src/Helpers/CubeHelpers';

export async function readTimerData(): Promise<string> {
  const solves = (await readSolves()).filter(solve => !solve.imported);
  return solves.some(solve => solve.status !== 'active') ? cubeastCSV(solves, await loadCube()) : '';
}

export async function readLocalAnalysis() {
  const solves = (await readSolves()).filter(solve => solve.status !== 'active');
  const cube = await loadCube();
  const records = solves.map(solve => solveAnalysis(solve, cube)).sort((a, b) => a.date.getTime() - b.date.getTime());
  markMistakes(records, CalculateWindowSize(records.length));
  await persistAnalysis(solves, records);
  return records;
}
