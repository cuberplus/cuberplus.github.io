import { cubeastCSV, readSolves } from '../Data/storage';
import { loadCube } from '../Core/puzzle';
import { persistAnalysis, recordAnalysis, solveAnalysis } from './analysis';
import { markMistakes } from '../../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { CalculateWindowSize } from '../../../smartcubeanalyzer/src/Helpers/CubeHelpers';
import { latestSolves } from '../../../shared/statistics/recent';

export async function readTimerData(): Promise<string> {
  const solves = (await readSolves()).filter(solve => !solve.imported);
  return solves.some(solve => solve.status !== 'active') ? cubeastCSV(solves, await loadCube()) : '';
}

export async function readLocalAnalysis(solveLimit = 0) {
  const solves = (await readSolves()).filter(solve => solve.status !== 'active');
  if (!solves.length) return [];
  const cube = await loadCube();
  const recent = latestSolves(solves, solveLimit, solve => Date.parse(solve.createdAt)), selected = new Set(recent);
  const records = recent.map(solve => solveAnalysis(solve, cube));
  markMistakes(records, CalculateWindowSize(records.length));
  await persistAnalysis(recent, records);
  return [...solves.filter(solve => !selected.has(solve)).map(recordAnalysis), ...records].sort((a, b) => a.date.getTime() - b.date.getTime());
}
