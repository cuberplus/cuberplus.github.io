import { useId } from 'react';
import { InfoTip } from './InfoTip';

export { DEFAULT_SOLVE_LIMIT } from '../navigation/settings';
export { latestSolves } from '../statistics/recent';
export function SolveLimit({ value, change }: { value: number; change: (limit: number) => void }) {
  const id = useId();
  return <div className="solve-limit">
    <label htmlFor={id}>Recent solves</label>
    <select id={id} className="form-select" value={value} onChange={event => change(Number(event.target.value))}>
      {[1000, 2500, 5000, 10000, 25000, 50000, 100000, 0].map(limit => <option key={limit} value={limit}>{limit ? `Latest ${limit.toLocaleString()}` : 'All solves'}</option>)}
    </select>
    <InfoTip>Limits detailed analysis and history across the site. Analyzer filters apply within this recent window. Records and personal bests always use all saved solves, without analysis filters. Increase the limit or choose All solves to analyze older results. Nothing is deleted; exports stay complete.</InfoTip>
  </div>;
}
