import { useId } from 'react';
import { InfoTip } from './InfoTip';
import { TOOLTIPS } from '../tooltips';

export { DEFAULT_SOLVE_LIMIT } from '../navigation/settings';
export { latestSolves } from '../statistics/recent';
export function SolveLimit({ value, change }: { value: number; change: (limit: number) => void }) {
  const id = useId();
  return <div className="solve-limit">
    <label htmlFor={id}>Recent solves</label>
    <select id={id} className="form-select" value={value} onChange={event => change(Number(event.target.value))}>
      {[1000, 2500, 5000, 10000, 25000, 50000, 100000, 0].map(limit => <option key={limit} value={limit}>{limit ? `Latest ${limit.toLocaleString()}` : 'All solves'}</option>)}
    </select>
    <InfoTip>{TOOLTIPS.solveLimit.overview}</InfoTip>
  </div>;
}
