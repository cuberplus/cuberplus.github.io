import { cubeastCSV, readSolves } from './storage';
import { loadCube } from './puzzle';

export async function readTimerData(): Promise<string> {
  const solves = await readSolves();
  return solves.some(solve => solve.status !== 'active') ? cubeastCSV(solves, await loadCube()) : '';
}
