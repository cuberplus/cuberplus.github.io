import { useMemo } from 'react';
import { solveTime, type Solve } from '../Core/engine';
import { averageDetails, numberedSolves, turns } from '../Data/storage';
import { AverageDialog, type AverageRow } from './AverageDialog';
import { ShareButton } from '../../../src/sharing/ShareButton';
import { makeSnapshot } from '../../../src/sharing/snapshot';

export function AverageDetails({ details, history, precision, view, close, title }: {
  details: NonNullable<ReturnType<typeof averageDetails>>;
  history: Solve[];
  precision: 2 | 3;
  view: (solve: Solve) => void;
  close: () => void;
  title?: string;
}) {
  const rows = useMemo(() => {
    const numbers = new Map(numberedSolves(history)
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
  const time = details.time === 'DNF' ? 'DNF' : details.time / 1000;
  return <AverageDialog rows={rows} time={time} precision={precision} view={view} close={close} title={title}
    share={<ShareButton label={title ? 'Share solves' : 'Share average'} load={() => makeSnapshot(rows, time, title ? 'collection' : 'average')} />} />;
}
