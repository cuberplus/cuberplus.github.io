import { AverageDialog, AverageRow } from '../../../timer/src/AverageDialog';
import '../../../timer/src/AverageDialog.css';
import { calculateAverage } from '../Helpers/MathHelpers';
import { Solve } from '../Helpers/Types';
import { useContext } from 'react';
import { SettingsContext } from '@cuberplus/navigation';

export function AverageModal({ solves, numbers, percentage, title, close, view }: {
    solves: Solve[]; numbers: number[]; percentage: number; title?: string; close: () => void; view: (solve: Solve) => void;
}) {
    const { precision } = useContext(SettingsContext);
    const trim = Math.min(Math.floor((solves.length - 1) / 2), Math.ceil(solves.length * percentage / 100));
    const ranked = solves.map((solve, index) => ({ solve, index })).sort((a, b) => (a.solve.dnf ? Infinity : a.solve.time) - (b.solve.dnf ? Infinity : b.solve.time) || a.index - b.index);
    const average = calculateAverage(ranked.slice(trim, solves.length - trim).map(({ solve }) => solve.dnf ? Infinity : solve.time));
    const rows: AverageRow<Solve>[] = ranked.map(({ solve, index }, rank) => ({
        solve, number: numbers[index], time: solve.dnf ? 'DNF' : solve.time,
        turns: solve.turns, tps: Number.isFinite(solve.tps) ? solve.tps : null,
        trimmed: rank < trim ? 'best' : rank >= solves.length - trim ? 'worst' : null,
    }));
    return <AverageDialog rows={rows} time={Number.isFinite(average) ? average : 'DNF'} precision={precision} close={close} view={view} title={title} />;
}
