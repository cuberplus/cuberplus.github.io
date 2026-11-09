import { useMemo } from 'react';
import { solveTime, type Solve } from '../Core/engine';
import { averageDetails, numberedSolves, turns } from '../Data/storage';
import { AverageDialog, type AverageRow } from './AverageDialog';

export function AverageDetails({ details, history, precision, view, close }: {
  details: NonNullable<ReturnType<typeof averageDetails>>;
  history: Solve[];
  precision: 2 | 3;
  view: (solve: Solve) => void;
  close: () => void;
}) {
  const rows = useMemo(() => {
    const numbers = new Map(numberedSolves(history.filter(solve => solve.session === details.solves[0].solve.session))
      .map(({ solve, number }) => [solve.id, number]));
    return details.solves.map(({ solve, trimmed }): AverageRow<Solve> => {
      const count = turns(solve);
      return {
        solve, trimmed, number: numbers.get(solve.id)!,
        time: solve.status === 'complete' ? solveTime(solve) / 1000 : 'DNF',
        turns: count, tps: solve.duration > 0 ? count * 1000 / solve.duration : null,
        penalty: solve.status === 'complete' ? (solve.penalty ?? 0) / 1000 : 0,
      };
    });
  }, [details, history]);
  return <AverageDialog rows={rows} time={details.time === 'DNF' ? 'DNF' : details.time / 1000} precision={precision} view={view} close={close} />;
}
