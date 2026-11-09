import type { Solve } from '../../smartcubeanalyzer/src/Models/Types';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import { markMistakes } from '../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { CalculateWindowSize } from '../../smartcubeanalyzer/src/Helpers/CubeHelpers';

export type DataTask = { type: 'parse'; csv: string } | { type: 'local' } | { type: 'import'; files: File[] };
export type DataResult = { solves: Solve[] } | { added: number; duplicates: number };
export async function runDataTask(task: DataTask): Promise<DataResult> {
  if (task.type === 'import') return (await import('../../timer/src/Data/csvImport')).importSolveCSVs(task.files);
  const solves = task.type === 'parse' ? parseCsv(task.csv, ',') : await (await import('../../timer/src/Analysis/analyzer-data')).readLocalAnalysis();
  solves.sort((a, b) => a.date.getTime() - b.date.getTime());
  markMistakes(solves, CalculateWindowSize(solves.length));
  return { solves };
}
