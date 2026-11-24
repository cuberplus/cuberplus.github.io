import { computeCaseFailureStats } from '../../smartcubeanalyzer/src/Analysis/MoveAnalysis';
import { caseSteps, StepName, type Solve } from '../../smartcubeanalyzer/src/Models/Types';
import { databaseCaseKeys } from '../database/algorithms';
import { findTrainingCase } from './cases';
export type SmartStage = 'F2L' | 'OLL' | 'PLL';
export type SmartCriterion = 'slowest' | 'failed' | 'both';
export function smartDrillCases(solves: Solve[], stages: SmartStage[], count: number, criterion: SmartCriterion): string[] {
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('Choose a positive whole number of cases per stage.');
  const valid = solves.filter(solve => !solve.isCorrupt && !solve.dnf && solve.session !== 'Retries');
  return stages.flatMap(stage => {
    const step = StepName[stage], stats = computeCaseFailureStats(valid, step);
    const rows = stats.flatMap(stat => {
      const key = databaseCaseKeys(stage, stat.caseName).find(key => findTrainingCase(key));
      const times = valid.flatMap(solve => caseSteps(solve, step).filter(item => item.case === stat.caseName).map(item => item.time)).filter(Number.isFinite);
      return key && times.length ? [{ key, failures: stat.failureRate, count: stat.failureCount, time: times.reduce((a, b) => a + b, 0) / times.length }] : [];
    });
    const slow = [...rows].sort((a, b) => b.time - a.time || a.key.localeCompare(b.key));
    const failed = [...rows].sort((a, b) => b.failures - a.failures || b.count - a.count || b.time - a.time || a.key.localeCompare(b.key));
    const order = criterion === 'slowest' ? slow : criterion === 'failed' ? failed :
      [...rows].sort((a, b) => (slow.indexOf(a) + failed.indexOf(a)) - (slow.indexOf(b) + failed.indexOf(b)) || b.time - a.time);
    return [...new Set(order.map(row => row.key))].slice(0, count);
  });
}
