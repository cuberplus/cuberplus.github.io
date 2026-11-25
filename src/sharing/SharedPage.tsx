import { useContext, useEffect, useState } from 'react';
import Navigation, { Footer, PageLocation, SettingsContext } from '@cuberplus/navigation';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';
import { Replay } from '../../timer/src/Components/Replay';
import { AverageDialog } from '../../timer/src/Components/AverageDialog';
import { formatSeconds } from '../../shared/display';
import { readShare } from './drive';
import type { Snapshot } from './snapshot';
import type { Solve } from '../../timer/src/Core/engine';
import { ShareButton } from './ShareButton';
import '../../timer/src/CSS/AverageDialog.css';

export default function SharedPage() {
  const address = useContext(PageLocation), { precision } = useContext(SettingsContext);
  const [data, setData] = useState<{ snapshot: Snapshot; cube: Cube } | null>(null), [error, setError] = useState('');
  const [solve, setSolve] = useState<Solve | null>(null), [average, setAverage] = useState(false);
  const query = new URLSearchParams(address.split('?')[1] ?? location.search);
  const id = query.get('id') ?? '', resourceKey = query.get('resourceKey') ?? undefined;
  useEffect(() => {
    const abort = new AbortController();
    setData(null); setError(''); setSolve(null); setAverage(false);
    void Promise.all([readShare({ id, resourceKey }, abort.signal), loadCube()]).then(([snapshot, cube]) => {
      if (!abort.signal.aborted) setData({ snapshot, cube });
    }).catch(failure => { if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load shared solves.'); });
    return () => abort.abort();
  }, [id, resourceKey]);
  const snapshot = data?.snapshot;
  return <div className="cuberplus-page"><header className="cuberplus-header"><Navigation current="share" /></header>
    <main className="container py-4"><h1>Shared {snapshot?.kind === 'solve' ? 'solve' : snapshot?.kind === 'average' ? 'average' : 'solves'}</h1>
      {!data && !error && <p role="status">Loading shared snapshot...</p>}
      {error && <p role="alert">{error}</p>}
      {snapshot && <>
        <p>Read-only snapshot &middot; {snapshot.rows.length} {snapshot.rows.length === 1 ? 'solve' : 'solves'}</p>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {snapshot.kind === 'average' && <button className="btn btn-outline-primary" onClick={() => setAverage(true)}>Ao{snapshot.rows.length}: {snapshot.time === 'DNF' ? 'DNF' : `${formatSeconds(snapshot.time, precision)}s`}</button>}
          <ShareButton label={snapshot.kind === 'average' ? 'Share average' : snapshot.kind === 'solve' ? 'Share solve' : 'Share solves'} load={async () => snapshot} />
        </div>
        <div className="table-responsive"><table className="table align-middle"><caption>Shared solves</caption><thead><tr><th>Solve</th><th>Time</th><th>Scramble</th></tr></thead>
          <tbody>{snapshot.rows.map(row => <tr key={row.number}><td><button className="btn btn-link" onClick={() => setSolve(row.solve)}>Solve {row.number}</button></td>
            <td>{row.trimmed ? '(' : ''}{row.time === 'DNF' ? 'DNF' : `${formatSeconds(row.time, precision)}s`}{row.trimmed ? ')' : ''}</td>
            <td className="text-break">{row.solve.scramble}</td></tr>)}</tbody></table></div>
        {average && <AverageDialog rows={snapshot.rows} time={snapshot.time} precision={precision} view={setSolve} close={() => setAverage(false)}
          share={<ShareButton label="Share average" load={async () => snapshot} />} />}
        {solve && data && <Replay key={solve.id} cube={data.cube} solve={solve} history={snapshot.rows.map(row => row.solve)} close={() => setSolve(null)} readOnly precision={precision} />}
      </>}
    </main><Footer />
  </div>;
}
