import { useContext, useEffect, useState } from 'react';
import Navigation, { Footer, PageLocation, SettingsContext } from '@cuberplus/navigation';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';
import { Replay } from '../../timer/src/Components/Replay';
import { AverageDialog } from '../../timer/src/Components/AverageDialog';
import { readShare } from './drive';
import type { Snapshot } from './snapshot';
import type { Solve } from '../../timer/src/Core/engine';
import { ShareButton } from './ShareButton';
import '../../timer/src/CSS/AverageDialog.css';

export default function SharedPage() {
  const address = useContext(PageLocation), { precision } = useContext(SettingsContext);
  const [data, setData] = useState<{ snapshot: Snapshot; cube: Cube } | null>(null), [error, setError] = useState('');
  const [solve, setSolve] = useState<Solve | null>(null);
  const query = new URLSearchParams(address.split('?')[1] ?? location.search);
  const id = query.get('id') ?? '', resourceKey = query.get('resourceKey') ?? undefined;
  useEffect(() => {
    const abort = new AbortController();
    setData(null); setError(''); setSolve(null);
    void Promise.all([readShare({ id, resourceKey }, abort.signal), loadCube()]).then(([snapshot, cube]) => {
      if (!abort.signal.aborted) setData({ snapshot, cube });
    }).catch(failure => { if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load shared solves.'); });
    return () => abort.abort();
  }, [id, resourceKey]);
  const snapshot = data?.snapshot;
  const close = () => { history.pushState(null, '', '/timer/'); window.dispatchEvent(new PopStateEvent('popstate')); };
  return <div className="cuberplus-page"><header className="cuberplus-header"><Navigation current="share" /></header>
    <main className="container py-4"><h1 className="visually-hidden">Shared {snapshot?.kind === 'solve' ? 'solve' : snapshot?.kind === 'average' ? 'average' : 'solves'}</h1>
      {!data && !error && <p role="status">Loading shared snapshot...</p>}
      {error && <p role="alert">{error}</p>}
      {snapshot && <>
        {snapshot.kind !== 'solve' ? <AverageDialog rows={snapshot.rows} time={snapshot.time} precision={precision} view={setSolve} close={close}
            title={snapshot.kind === 'collection' ? 'Shared solves' : undefined}
            share={<ShareButton label="Share average" load={async () => snapshot} />} />
          : data && <Replay key={snapshot.rows[0].solve.id} cube={data.cube} solve={snapshot.rows[0].solve} history={snapshot.rows.map(row => row.solve)} close={close} readOnly precision={precision} />}
        {solve && data && <Replay key={solve.id} cube={data.cube} solve={solve} history={snapshot.rows.map(row => row.solve)} close={() => setSolve(null)} readOnly precision={precision} />}
      </>}
    </main><Footer />
  </div>;
}
