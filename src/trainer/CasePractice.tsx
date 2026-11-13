import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { PageVisible } from '@cuberplus/navigation';
import type { Cube } from '../../timer/src/Core/puzzle';
import { cfopFrame } from '../../timer/src/Analysis/cfop';
import { CubeView } from '../../timer/src/Components/CubeView';
import { cubeConnection, useCubeConnection } from '../../shared/cube/connection';
import { InfoTip } from '../../shared/Components/InfoTip';
import { categories } from '../database/algorithms';
import { getAlgorithms } from '../database/customAlgorithms';
import CaseImage from '../database/CaseImage';
import type { BlitzSettings } from './blitz';
import { Practice, readAttempts, readTrainings, saveAttempt, TRAININGS_STORAGE, type CustomTraining, type PracticeAttempt } from './practice';
import { caseKey, findTrainingCase } from './cases';
import { SolutionProgress } from './SolutionProgress';

const seconds = (time: number) => `${(time / 1000).toFixed(2)}s`;
export function CasePractice({ cube, mode, initialCase, settings, back }: {
  cube: Cube | null; mode: 'single' | 'custom'; initialCase: string; settings: BlitzSettings; back: () => void;
}) {
  const visible = useContext(PageVisible), { connection } = useCubeConnection();
  const [selected, setSelected] = useState(initialCase || 'F2L-1'), [algorithm, setAlgorithm] = useState('own');
  const [trainings, setTrainings] = useState<CustomTraining[]>([]), [trainingId, setTrainingId] = useState('');
  const [name, setName] = useState(''), [chosen, setChosen] = useState<string[]>([]), [editing, setEditing] = useState(false);
  const editingId = useRef<string | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]), [error, setError] = useState('');
  const [unsaved, setUnsaved] = useState<PracticeAttempt[]>([]);
  const drill = useRef<Practice | null>(null), active = useRef(visible);
  const [, render] = useReducer((n: number) => n + 1, 0);
  active.current = visible;
  const entry = findTrainingCase(selected), training = trainings.find(item => item.id === trainingId);
  const running = !!drill.current && drill.current.phase !== 'cancelled';
  useEffect(() => {
    try { setTrainings(readTrainings()); setAttempts(readAttempts()); } catch (failure) { setError((failure as Error).message); }
  }, []);
  useEffect(() => {
    if (!visible && drill.current) { drill.current.phase = 'cancelled'; render(); }
  }, [visible]);
  useEffect(() => {
    const unsubscribe = cubeConnection.onEvent(event => {
      const current = drill.current;
      if (!current) return;
      if (event.type === 'DISCONNECT') { current.phase = 'cancelled'; setError('Cube disconnected. Reconnect and start again.'); render(); }
      if (event.type !== 'MOVE' || !active.current) return;
      const attempt = current.move(cfopFrame(current.cube, current.colorFrame)(event.move), performance.now());
      if (attempt) {
        setAttempts(items => [attempt, ...items]);
        try { saveAttempt(attempt); } catch { setUnsaved(items => [...items, attempt]); setError('Timing shown below could not be saved.'); }
      }
      render();
    });
    return unsubscribe;
  }, []);
  const current = drill.current, shown = current?.phase === 'running' ? current.queue[0] : null;
  const historyId = mode === 'single' ? `single:${selected}` : trainingId;
  const history = attempts.filter(item => item.trainingId === historyId);
  function storeTrainings(next: CustomTraining[]) {
    try { readTrainings(); localStorage.setItem(TRAININGS_STORAGE, JSON.stringify(next)); setTrainings(next); setError(''); return true; }
    catch { setError('Custom trainings could not be saved. Existing trainings have not changed.'); return false; }
  }
  return <section className="trainer-practice" data-case={shown ? caseKey(shown) : undefined} data-color-frame={current?.colorFrame} data-pre-auf={current?.preAuf} data-post-auf={current?.postAuf}>
    <div className="d-flex align-items-center gap-3 mb-3">
      <button className="btn btn-outline-secondary" aria-label="Back to drills" onClick={back}>Back</button>
      <h2 className="mb-0">{mode === 'single' ? 'Single-case drill' : 'Make your own drill'} <InfoTip>Smart-cube turns control the displayed virtual case. Do not scramble or reset your physical cube between cases. Recognition runs until your first turn; execution ends when the case is solved. Practice repeats until you stop, saving each completed attempt.</InfoTip></h2>
    </div>
    <fieldset disabled={running} className="d-grid gap-3 mb-3">
      <legend className="visually-hidden">Choose practice cases</legend>
      {mode === 'single' ? <>
        <label htmlFor="practice-case">Case</label><select id="practice-case" className="form-select" value={selected} onChange={event => { setSelected(event.target.value); setAlgorithm('own'); }}>
          {categories.map(category => <optgroup key={category} label={category}>{getAlgorithms().filter(item => item.category === category).map(item =>
            <option key={caseKey(item)} value={caseKey(item)}>{item.category} {item.id}</option>)}</optgroup>)}
        </select>
        <label htmlFor="practice-algorithm">Solution</label><select id="practice-algorithm" className="form-select" value={algorithm} onChange={event => setAlgorithm(event.target.value)}>
          <option value="own">Use my own solution</option>
          {entry?.options.map(alg => <option key={alg} value={alg}>{alg}</option>)}
        </select>
      </> : <>
        <label htmlFor="custom-training">Saved training</label><select id="custom-training" className="form-select" value={trainingId} onChange={event => { setTrainingId(event.target.value); setEditing(false); }}>
          <option value="">Choose a training</option>{trainings.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-primary" onClick={() => { editingId.current = null; setName(''); setChosen([]); setEditing(true); }}>Create training</button>
          {training && <><button className="btn btn-outline-secondary" onClick={() => { editingId.current = training.id; setName(training.name); setChosen(training.cases); setEditing(true); }}>Edit training</button>
            <button className="btn btn-outline-danger" onClick={() => { if (storeTrainings(trainings.filter(item => item.id !== trainingId))) { setTrainingId(''); setEditing(false); } }}>Delete training</button></>}
        </div>
      </>}
    </fieldset>
    {editing && mode === 'custom' && <form className="card p-3 mb-3" onSubmit={event => {
      event.preventDefault();
      const id = editingId.current ?? crypto.randomUUID(), next = { id, name: name.trim(), cases: chosen };
      if (!next.name || !chosen.length) return;
      if (storeTrainings([...trainings.filter(item => item.id !== id), next])) { setTrainingId(id); setEditing(false); }
    }}>
      <label htmlFor="training-name">Training name</label><input id="training-name" className="form-control mb-3" required maxLength={100} value={name} onChange={event => setName(event.target.value)} />
      {categories.map(category => <details className="mb-3" key={category}><summary>{category} cases ({chosen.filter(key => key.startsWith(`${category}-`)).length} selected)</summary>
        <div className="trainer-case-picker">{getAlgorithms().filter(item => item.category === category).map(item => {
          const key = caseKey(item);
          return <label key={key} className="form-check"><input className="form-check-input" type="checkbox" checked={chosen.includes(key)}
            onChange={event => setChosen(items => event.target.checked ? [...items, key] : items.filter(item => item !== key))} />{item.category} {item.id}</label>;
        })}</div>
      </details>)}
      <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary" disabled={!name.trim() || !chosen.length}>Save training</button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(false)}>Cancel</button></div>
    </form>}
    <div className="card p-3 text-center">
      {shown && <>
        {settings.caseNames && <h3>{shown.category} {shown.id}</h3>}
        <CubeView cube={cube!} facelets={cube!.facelets(current!.pattern)} moves={current!.moves} cross={3} colorFrame={current!.colorFrame} height={230}
          hidePLL={shown.category === 'OLL' && settings.hidePLL} />
        {settings.solutionAlgorithms !== false && <SolutionProgress cube={cube!} start={current!.initialPattern} pattern={current!.pattern} algorithm={current!.solution} />}
        {settings.upcomingCases && <div className="trainer-case-queue" aria-label="Upcoming 3 cases">
          {current!.queue.slice(1, 4).map((item, index) => <div key={index}><p>Next {index + 1}</p><CaseImage category={item.category} id={item.id} />
            {settings.caseNames && <strong>{item.category} {item.id}</strong>}</div>)}
        </div>}
      </>}
      <PracticeClock practice={current} changed={render} />
      {running ? <button className="btn btn-outline-danger align-self-center" onClick={() => { current!.phase = 'cancelled'; render(); }}>Stop practice</button> :
        <><p role="status">{!connection ? 'Connect a smart cube above to practice.' : !cube ? 'Loading puzzle tools...' : 'Ready to practice.'}</p>
          <button className="btn btn-primary align-self-center" disabled={!connection || !cube || (mode === 'single' ? !entry : !training) || editing}
            onClick={() => {
              const cases = mode === 'single' ? entry ? [entry] : [] : (training?.cases ?? []).flatMap(key => findTrainingCase(key) ?? []);
              try { drill.current = new Practice(cube!, cases, historyId, settings, performance.now(), Math.random, mode === 'single' && algorithm !== 'own' ? algorithm : null); setError(''); render(); }
              catch (failure) { setError((failure as Error).message); }
            }}>Start practice</button></>}
    </div>
    {error && <p role="alert" className="mt-3">{error}</p>}
    {!!unsaved.length && <button className="btn btn-outline-primary" onClick={() => {
      try { unsaved.forEach(saveAttempt); setUnsaved([]); setError(''); } catch { setError('Timings still could not be saved.'); }
    }}>Retry saving timings</button>}
    {!!history.length && <section className="mt-4"><h3>Practice timings ({history.length})</h3>
      <div className="table-responsive"><table className="table"><caption className="visually-hidden">Completed practice attempts</caption>
        <thead><tr>{['Case', 'Recognition', 'Execution', 'Date'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{history.map(attempt => <tr key={attempt.id}><td>{attempt.caseKey.replace('-', ' ')}</td><td>{seconds(attempt.recognitionMilliseconds)}</td>
          <td>{seconds(attempt.executionMilliseconds)}</td><td><time dateTime={attempt.date}>{new Date(attempt.date).toLocaleString()}</time></td></tr>)}</tbody>
      </table></div>
    </section>}
  </section>;
}
function PracticeClock({ practice, changed }: { practice: Practice | null; changed: () => void }) {
  const visible = useContext(PageVisible), [, render] = useReducer((n: number) => n + 1, 0), phase = practice?.phase;
  useEffect(() => {
    if (!visible || !practice || phase === 'cancelled') return;
    const interval = setInterval(() => {
      const before = practice.phase;
      practice.tick(performance.now()); render();
      if (before !== practice.phase) changed();
    }, 40);
    return () => clearInterval(interval);
  }, [practice, phase, visible, changed]);
  return <div className="trainer-clock" role="timer" aria-label="Practice time">{phase === 'countdown'
    ? Math.max(1, 3 - Math.floor((performance.now() - practice!.countdownAt) / 1000))
    : seconds(phase === 'running' ? performance.now() - practice!.splitAt : 0)}</div>;
}
