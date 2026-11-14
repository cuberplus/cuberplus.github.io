import { readFileSync } from 'node:fs';
import { DEMO_DATASETS } from '../smartcubeanalyzer/src/Data/SampleData';
import { parseCsv } from '../smartcubeanalyzer/src/Data/CsvParser';
import { MethodName } from '../smartcubeanalyzer/src/Models/Types';
import { previewSolve } from '../timer/src/Data/csvImport';
import { loadCube } from '../timer/src/Core/puzzle';
import { analyzeCFOP } from '../timer/src/Analysis/cfop';

export async function auditDemoF2l() {
  const cube = await loadCube(), seen = new Map<string, { cases: number; missing: number }>();
  const report = { datasets: [] as { file: string; solves: number; recorded: number; cases: number; missing: number }[],
    uniqueRecordings: 0, uniqueCases: 0, uniqueMissing: 0,
    examples: [] as { file: string; id: string; step: number; cross: number; before: string; after: string; moves: string }[] };
  for (const dataset of DEMO_DATASETS) {
    const records = parseCsv(readFileSync(new URL(`../smartcubeanalyzer/public/${dataset.file}`, import.meta.url), 'utf8'), ',', true);
    const counts = { file: dataset.file, solves: records.length, recorded: 0, cases: 0, missing: 0 };
    for (const record of records) {
      if (record.method !== MethodName.CFOP || !record.recording?.solution) continue;
      const key = `${record.scramble}:${record.recording.solution}`;
      const cached = seen.get(key);
      if (cached) { counts.recorded++; counts.cases += cached.cases; counts.missing += cached.missing; continue; }
      const solve = previewSolve(record, cube);
      if (!solve.moves.length) continue;
      counts.recorded++; report.uniqueRecordings++;
      const analysis = analyzeCFOP(solve, cube);
      const result = { cases: 0, missing: 0 };
      for (let step = 1; step < Math.min(5, analysis.ends.length); step++) {
        const from = analysis.ends[step - 1], to = analysis.ends[step];
        if (from === to) continue;
        result.cases++;
        if (analysis.cases[step]) continue;
        result.missing++;
        if (report.examples.length < 60) {
          const before = cube.parse(solve.startFacelets).applyAlg(solve.moves.slice(0, from).map(move => move.move).join(' '));
          report.examples.push({ file: dataset.file, id: record.id, step, cross: analysis.cross!, before: cube.facelets(before),
            after: cube.facelets(before.applyAlg(solve.moves.slice(from, to).map(move => move.move).join(' '))),
            moves: solve.moves.slice(from, to).map(move => move.move).join(' ') });
        }
      }
      seen.set(key, result); counts.cases += result.cases; counts.missing += result.missing;
      report.uniqueCases += result.cases; report.uniqueMissing += result.missing;
    }
    report.datasets.push(counts);
    console.log(JSON.stringify(counts));
  }
  console.log(JSON.stringify({ uniqueRecordings: report.uniqueRecordings, uniqueCases: report.uniqueCases, uniqueMissing: report.uniqueMissing }));
  return report;
}
