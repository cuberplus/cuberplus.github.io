import type { Solve } from '../../smartcubeanalyzer/src/Models/Types';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import { markMistakes } from '../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { CalculateWindowSize } from '../../smartcubeanalyzer/src/Helpers/CubeHelpers';
import type { Solve as TimerSolve } from '../../timer/src/Core/engine';
import { latestSolves } from '../statistics/recent';

export type DataProgress = { processed: number; total: number; analyzed: number; skipped: number; failed: number; remainingMs: number | null };
export type DataTask = { type: 'parse'; csv: string; solveLimit?: number } | { type: 'local'; solveLimit?: number } | { type: 'import'; files: File[] } | { type: 'reanalyze' } |
  { type: 'feedback'; solves: TimerSolve[] } | { type: 'mistakes'; ids: string[]; present: string[]; solve: TimerSolve };
export type DataResult = { solves: Solve[] } | { added: number; duplicates: number } | DataProgress | { analysis?: Solve };
const feedback = new Map<string, Solve>();
let revision = 0, latest: { key: string; solves: Solve[] } | undefined;
export async function runDataTask(task: DataTask, progress: (value: DataProgress) => void = () => {}): Promise<DataResult> {
  if (task.type === 'feedback' || task.type === 'mistakes') {
    const { solveAnalysis, persistAnalysis } = await import('../../timer/src/Analysis/analysis');
    if (task.type === 'feedback') {
      const { importedAnalysis } = await import('../../timer/src/Data/csvImport');
      const cube = await (await import('../../timer/src/Core/puzzle')).loadCube();
      for (const solve of task.solves) {
        const analysis = solve.imported ? importedAnalysis(solve) : solveAnalysis(solve, cube);
        analysis.recording = undefined; feedback.set(solve.id, analysis);
      }
      const native = task.solves.filter(solve => !solve.imported);
      if (native.length) await (await import('../../timer/src/Data/storage')).saveSolves(native, true);
      revision++; return {};
    }
    const present = new Set(task.present);
    for (const id of feedback.keys()) if (!present.has(id)) feedback.delete(id);
    task.ids.sort();
    const key = `${revision}:${JSON.stringify(task.ids)}`;
    if (latest?.key !== key) {
      const solves = task.ids.map(id => feedback.get(id)!).sort((a, b) => a.date.getTime() - b.date.getTime());
      latest = { key, solves: markMistakes(solves, 100) };
    }
    const analysis = feedback.get(task.solve.id)!;
    await persistAnalysis([task.solve], [analysis]);
    return { analysis };
  }
  if (task.type === 'reanalyze') return (await import('../../timer/src/Analysis/analysis')).reanalyzeAllSolves(progress);
  if (task.type === 'import') return (await import('../../timer/src/Data/csvImport')).importSolveCSVs(task.files);
  const solves = task.type === 'parse' ? parseCsv(task.csv, ',') : await (await import('../../timer/src/Analysis/analyzer-data')).readLocalAnalysis(task.solveLimit);
  solves.sort((a, b) => a.date.getTime() - b.date.getTime());
  const recent = latestSolves(solves, task.solveLimit ?? 0, solve => solve.date.getTime()), selected = new Set(recent);
  if (task.type === 'parse') markMistakes(recent, CalculateWindowSize(recent.length));
  return { solves: solves.map(solve => selected.has(solve) ? solve : { ...solve, steps: solve.steps.map(step => ({ ...step, moves: '' })), recording: undefined, mistakes: undefined }) };
}
