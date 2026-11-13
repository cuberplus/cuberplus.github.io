import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePageDialog } from '@cuberplus/navigation';

const columns = [
  { key: 'number', label: 'Solve' }, { key: 'time', label: 'Time' },
  { key: 'turns', label: 'Turns' }, { key: 'tps', label: 'TPS' },
] as const;
type Column = typeof columns[number]['key'];
const format = (value: number | 'DNF', precision: 2 | 3) => value === 'DNF' ? value : `${value.toFixed(precision)}s`;

export interface AverageRow<T> {
  solve: T;
  number: number;
  time: number | 'DNF'; // Seconds, normalized by each app's adapter.
  turns: number;
  tps: number | null;
  trimmed: 'best' | 'worst' | null;
  penalty?: number;
}

export function AverageDialog<T>({ rows, time, precision, view, close, title }: {
  rows: AverageRow<T>[];
  time: number | 'DNF';
  precision: 2 | 3;
  view: (solve: T) => void;
  close: () => void;
  title?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const [sort, setSort] = useState<{ column: Column; direction: 'ascending' | 'descending' }>({ column: 'number', direction: 'ascending' });
  usePageDialog(dialog);
  const dismiss = () => { dialog.current?.close(); close(); };
  const ordered = useMemo(() => [...rows].sort((a, b) => {
    const left = a[sort.column], right = b[sort.column];
    if (left === null || right === null) return left === right ? a.number - b.number : left === null ? 1 : -1;
    const x = left === 'DNF' ? Infinity : left, y = right === 'DNF' ? Infinity : right;
    return (x === y ? 0 : x < y ? -1 : 1) * (sort.direction === 'ascending' ? 1 : -1) || a.number - b.number;
  }), [rows, sort]);
  const tableRows = useMemo(() => ordered.map(row => {
    const value = format(row.time, precision);
    const field = (content: ReactNode, label: string) =>
      <button className="average-cell" aria-label={`Solve ${row.number}${label ? `: ${label}` : ''}, open replay`} onClick={() => view(row.solve)}>{content}</button>;
    return <tr key={row.number} onClick={event => {
      if ((event.target as HTMLElement).closest('button')) return;
      event.currentTarget.querySelector('button')?.focus();
      view(row.solve);
    }}>
      <th scope="row">{field(row.number, '')}</th>
      <td>{field(<>{row.trimmed ? <span className={`average-trimmed-${row.trimmed}`} title={`Excluded ${row.trimmed}`} aria-label={`Excluded ${row.trimmed}: ${value}`}>({value})</span> : value}
        {!!row.penalty && <span className="badge text-bg-warning ms-1">+{row.penalty}</span>}
      </>, `${row.trimmed ? `(${value})` : value}${row.penalty ? ` +${row.penalty}` : ''}${row.trimmed ? `, excluded ${row.trimmed}` : ''}`)}</td>
      <td>{field(row.turns, `${row.turns} turns`)}</td><td>{field(row.tps === null ? '--' : row.tps.toFixed(2), `${row.tps === null ? '--' : row.tps.toFixed(2)} TPS`)}</td>
    </tr>;
  }), [ordered, precision, view]);
  return <dialog ref={dialog} className="panel average-dialog" aria-labelledby={heading} onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
      <h2 id={heading}>{title ?? `Ao${rows.length}: ${format(time, precision)}`}</h2>
      <button autoFocus className="btn-close" aria-label={`Close ${title ? 'solves' : 'average'}`} onClick={dismiss} />
    </div>
    <div className="table-responsive" tabIndex={0} role="region" aria-labelledby={heading}>
      <table className="table table-sm align-middle average-clickable" aria-label={title ? 'Selected solves' : 'Average solves'}>
        <thead><tr>{columns.map(({ key, label }) => <th key={key} scope="col" aria-sort={sort.column === key ? sort.direction : undefined}>
          <button className="history-sort" onClick={() => setSort({ column: key, direction: sort.column === key && sort.direction === 'ascending' ? 'descending' : 'ascending' })}>{label}</button>
        </th>)}</tr></thead>
        <tbody>{tableRows}</tbody>
      </table>
    </div>
  </dialog>;
}
