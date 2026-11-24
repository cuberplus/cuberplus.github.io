import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

type Column<Row> = { key: string; label: string; numeric?: boolean; value: (row: Row) => string | number; render?: (row: Row) => ReactNode };
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
export function DrillTable<Row>({ rows, columns, caption, rowKey, initialSort }: {
  rows: Row[]; columns: Column<Row>[]; caption: string; rowKey: (row: Row) => string; initialSort: { column: string; ascending: boolean };
}) {
  const id = useId(), table = useRef<HTMLTableElement>(null);
  const [sort, setSort] = useState(initialSort), [announcement, setAnnouncement] = useState('');
  const selected = columns.find(column => column.key === sort.column)!;
  const sorted = [...rows].sort((a, b) => {
    const first = selected.value(a), second = selected.value(b);
    return (typeof first === 'number' && typeof second === 'number' ? first - second : collator.compare(String(first), String(second))) * (sort.ascending ? 1 : -1);
  });
  const choose = useCallback((column: Column<Row>) => {
    const ascending = sort.column === column.key ? !sort.ascending : true;
    setSort({ column: column.key, ascending });
    setAnnouncement(`Sorted by ${column.label}, ${ascending ? 'ascending' : 'descending'}, ${rows.length} rows`);
  }, [sort, rows.length]);
  useEffect(() => {
    const element = table.current!;
    const command = (event: Event & { command?: string; source?: HTMLElement | null }) => {
      if (event.command !== '--sort') return;
      const column = columns.find(column => column.key === event.source?.dataset['column']);
      if (column) choose(column);
    };
    element.addEventListener('command', command);
    return () => element.removeEventListener('command', command);
  }, [choose, columns]);
  return <>
    <div className="table-responsive drill-grid" role="region" aria-labelledby={`${id}-caption`} tabIndex={0}>
      <table className="table mb-0" id={id} ref={table}>
        <caption className="visually-hidden" id={`${id}-caption`}>{caption}</caption>
        <thead><tr>{columns.map(column => <th key={column.key} scope="col" data-type={column.numeric ? 'number' : 'text'}
          aria-sort={sort.column === column.key ? sort.ascending ? 'ascending' : 'descending' : undefined}>
          <button type="button" className="trainer-sort" data-column={column.key} {...{ commandfor: id, command: '--sort' }}
            onClick={() => { if (!('commandForElement' in HTMLButtonElement.prototype)) choose(column); }}>
            {column.label}<span className="drill-sort-direction" aria-hidden="true" />
          </button>
        </th>)}</tr></thead>
        <tbody>{sorted.map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.key}>{column.render ? column.render(row) : column.value(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <span role="status" className="visually-hidden">{announcement}</span>
  </>;
}
