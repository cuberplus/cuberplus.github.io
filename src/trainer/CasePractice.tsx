import { useCallback, useContext, useEffect, useId, useReducer, useRef, useState, type RefObject } from 'react';
import { PageVisible, SettingsContext, usePageDialog } from '@cuberplus/navigation';
import type { Cube } from '../../timer/src/Core/puzzle';
import { cfopFrame } from '../../timer/src/Analysis/cfop';
import { CubeView } from '../../timer/src/Components/CubeView';
import { cubeConnection, useCubeConnection } from '../../shared/cube/connection';
import { InfoTip } from '../../shared/Components/InfoTip';
import { categories, type AlgorithmCase } from '../database/algorithms';
import { caseKeyLabel, caseLabel, caseNumber } from '../database/caseLabels';
import { getAlgorithms } from '../database/customAlgorithms';
import CaseImage from '../database/CaseImage';
import { DrillCaseImage } from './DrillCaseImage';
import type { BlitzSettings } from './blitz';
import { Practice, readAttempts, readTrainings, saveAttempt, TRAININGS_STORAGE, type CustomTraining, type PracticeAttempt } from './practice';
import { caseKey, findTrainingCase } from './cases';
import { SolutionProgress } from './SolutionProgress';
import { relativeTime } from '../../timer/src/Data/relativeTime';
import { formatMilliseconds } from '../../shared/display';
import { smartDrillCases, type SmartCriterion, type SmartStage } from './smartDrill';
import { dataTask } from '../../shared/workers/dataClient';
import { DrillSettings } from './DrillSettings';
import { TOOLTIPS } from '../../shared/tooltips';
import { DrillTable } from './DrillTable';
import { DrillBackButton } from './DrillBackButton';
import { ActionIcon } from '../../shared/Components/ActionIcon';

const seconds = (time: number) => `${formatMilliseconds(time)}s`;
export function CasePractice({ cube, mode, initialCase, settings, back, fixedCase = false, changeSettings, optionsDialog }: {
  cube: Cube | null; mode: 'single' | 'custom'; initialCase: string; settings: BlitzSettings; back: () => void; fixedCase?: boolean; changeSettings?: (settings: BlitzSettings) => void; optionsDialog?: RefObject<HTMLDialogElement>;
}) {
  const localOptions = useRef<HTMLDialogElement>(null), options = optionsDialog ?? localOptions;
  usePageDialog(options, false);
  const visible = useContext(PageVisible), { connection } = useCubeConnection();
  const { solveLimit, session, allSessions } = useContext(SettingsContext);
  const [smart, setSmart] = useState(false), [generating, setGenerating] = useState(false);
  const [smartStages, setSmartStages] = useState<SmartStage[]>(['F2L', 'OLL', 'PLL']);
  const [smartCount, setSmartCount] = useState('5'), [criterion, setCriterion] = useState<SmartCriterion>('failed');
  const generation = useRef<ReturnType<typeof dataTask> | null>(null);
  useEffect(() => () => generation.current?.cancel(), []);
  const id = useId();
  const [selected, setSelected] = useState(initialCase), [algorithm, setAlgorithm] = useState('own');
  const heading = useRef<HTMLHeadingElement>(null);
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
  const startPractice = useCallback((cases: AlgorithmCase[], historyId: string, solution: string | null) => {
    if (!cube) return;
    try { drill.current = new Practice(cube, cases, historyId, settings, performance.now(), Math.random, solution); setError(''); render(); }
    catch (failure) { setError((failure as Error).message); }
  }, [cube, settings]);
  useEffect(() => { if (selected && !fixedCase) heading.current?.focus(); }, [selected, fixedCase]);
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
      if (event.type === 'DISCONNECT' || event.type === 'CALIBRATE') { current.phase = 'cancelled'; setError(event.type === 'DISCONNECT' ? 'Cube disconnected. Reconnect and start again.' : 'Cube recalibrated. Start a new drill.'); render(); }
      if (event.type !== 'MOVE' || !active.current) return;
      const attempt = current.move(mode === 'single' ? event.move : cfopFrame(current.cube, current.colorFrame)(event.move), performance.now());
      record(attempt);
      render();
    });
    return unsubscribe;
  }, [mode]);
  const current = drill.current, shown = current?.phase === 'running' ? current.queue[0] : null;
  function record(attempt: PracticeAttempt | null) {
    if (!attempt) return;
    setAttempts(items => [attempt, ...items]);
    try { saveAttempt(attempt); } catch { setUnsaved(items => [...items, attempt]); setError('Timing shown below could not be saved.'); }
  }
  const historyId = mode === 'single' ? `single:${selected}` : trainingId;
  const history = attempts.filter(item => item.trainingId === historyId);
  function storeTrainings(next: CustomTraining[]) {
    try { readTrainings(); localStorage.setItem(TRAININGS_STORAGE, JSON.stringify(next)); setTrainings(next); setError(''); return true; }
    catch { setError('Custom trainings could not be saved. Existing trainings have not changed.'); return false; }
  }
  return <section className="trainer-practice" data-case={shown ? caseKey(shown) : selected || undefined} data-color-frame={current?.colorFrame} data-pre-auf={current?.preAuf} data-post-auf={current?.postAuf}>
    <div className="d-flex align-items-center gap-3 mb-3">
      <DrillBackButton label={mode === 'single' && selected && !fixedCase ? 'Back to cases' : 'Back to drills'} back={() => {
        if (mode !== 'single' || !selected || fixedCase) { back(); return; }
        drill.current = null; setSelected(''); setError('');
      }} />
      <h2 ref={heading} tabIndex={-1} className="mb-0">{mode === 'single' ? entry ? `${caseLabel(entry)} drill` : 'Single-case drill' : 'Make your own drill'} <InfoTip>{TOOLTIPS.casePractice.overview}</InfoTip></h2>
    </div>
    {changeSettings && <dialog ref={options} className="panel options-dialog" aria-labelledby={`${id}-options-title`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 id={`${id}-options-title`} className="mb-0">{mode === 'single' ? entry ? `${caseLabel(entry)} drill` : 'Single-case drill' : 'Custom drill'} options</h2>
        <button type="button" className="btn-close" aria-label="Close options" onClick={() => options.current?.close()} />
      </div>
      <DrillSettings settings={settings} change={changeSettings} disabled={running || generating} fixedInput={mode === 'single'}
        hidePLL={mode === 'single' ? entry?.category === 'OLL' : (editing ? chosen : training?.cases ?? []).some(key => findTrainingCase(key)?.category === 'OLL')} />
    </dialog>}
    <fieldset hidden={running || mode === 'single' && !!entry} disabled={running || generating} className={running || mode === 'single' && entry ? '' : 'd-grid gap-3 mb-3'}>
      <legend className="visually-hidden">Choose practice cases</legend>
      {mode === 'single' ? <>
        <CasePicker selected={[]} single change={key => { setSelected(key); setAlgorithm('own'); }} />
      </> : <>
        <label htmlFor={`${id}-training`}>Saved training</label><select id={`${id}-training`} className="form-select" value={trainingId} onChange={event => { setTrainingId(event.target.value); setEditing(false); }}>
          <option value="">Choose a training</option>{trainings.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-primary" onClick={() => { editingId.current = null; setName(''); setChosen([]); setEditing(true); }}>Create training</button>
          <button className="btn btn-outline-primary" onClick={() => setSmart(value => !value)} aria-expanded={smart}>Create smart drill</button>
          {training && <><button className="btn btn-outline-secondary" onClick={() => { editingId.current = training.id; setName(training.name); setChosen(training.cases); setEditing(true); }}>Edit training</button>
            <button className="btn btn-outline-danger" onClick={() => { if (storeTrainings(trainings.filter(item => item.id !== trainingId))) { setTrainingId(''); setEditing(false); } }}><ActionIcon action="delete" />Delete training</button></>}
        </div>
      </>}
    </fieldset>
    {smart && mode === 'custom' && !running && <form className="card p-3 mb-3 d-grid gap-3" aria-label="Smart drill" onSubmit={event => {
      event.preventDefault(); setGenerating(true); setError('');
      const task = dataTask({ type: 'local', solveLimit, sessions: allSessions ? undefined : [session] }); generation.current = task;
      void task.promise.then(result => {
        if (!('solves' in result)) throw new Error('Solve history could not be loaded.');
        const keys = smartDrillCases(result.solves.filter(solve => allSessions || (solve.session || 'Default') === session).slice(solveLimit ? -solveLimit : 0), smartStages, Number(smartCount), criterion);
        if (!keys.length) throw new Error('No matching case history found. Try Slowest, include another stage, or record more smart-cube solves.');
        editingId.current = null; setName('Smart drill'); setChosen(keys); setEditing(true); setSmart(false);
      }).catch(failure => setError((failure as Error).message)).finally(() => { generation.current = null; setGenerating(false); });
    }}>
      <div className="d-flex align-items-center gap-2"><h3 className="h5 mb-0">Smart drill</h3><InfoTip>{TOOLTIPS.casePractice.smartDrill}</InfoTip></div>
      <fieldset disabled={generating}><legend className="h6">Include stages</legend><div className="d-flex flex-wrap gap-3">
        {(['F2L', 'OLL', 'PLL'] as const).map(stage => <label key={stage} className="form-check"><input className="form-check-input" type="checkbox" checked={smartStages.includes(stage)} onChange={event => setSmartStages(items => event.target.checked ? [...items, stage] : items.filter(item => item !== stage))} />{stage}</label>)}
      </div></fieldset>
      <label>Cases per stage<input className="form-control" type="number" min="1" step="1" required value={smartCount} disabled={generating} onChange={event => setSmartCount(event.target.value)} /></label>
      <label>Choose cases by<select aria-label="Choose cases by" className="form-select" value={criterion} disabled={generating} onChange={event => setCriterion(event.target.value as SmartCriterion)}>
        <option value="failed">Most frequently failed</option><option value="slowest">Slowest</option><option value="both">Both</option>
      </select></label>
      <button className="btn btn-primary" disabled={generating || !smartStages.length}>{generating ? 'Analyzing history...' : 'Generate smart drill'}</button>
    </form>}
    {editing && mode === 'custom' && <form className="card p-3 mb-3" onSubmit={event => {
      event.preventDefault();
      const id = editingId.current ?? crypto.randomUUID(), next = { id, name: name.trim(), cases: chosen };
      if (!next.name || !chosen.length) return;
      if (storeTrainings([...trainings.filter(item => item.id !== id), next])) { setTrainingId(id); setEditing(false); }
    }}>
      <label htmlFor={`${id}-name`}>Training name</label><input id={`${id}-name`} className="form-control mb-3" required maxLength={100} value={name} onChange={event => setName(event.target.value)} />
      <CasePicker selected={chosen} change={key => setChosen(items => items.includes(key) ? items.filter(item => item !== key) : [...items, key])} />
      <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary" disabled={!name.trim() || !chosen.length}>Save training</button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(false)}>Cancel</button></div>
    </form>}
    {(mode === 'custom' || entry) && <div className="card p-3 text-center">
      {running && <div className="trainer-drill-controls">
        {shown && <><button type="button" className="btn btn-outline-secondary" onClick={() => { record(current!.retry(performance.now())); render(); }}>Retry case</button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => { record(current!.skip(performance.now())); render(); }}>Skip case</button></>}
        <button type="button" className="btn btn-danger" onClick={() => { current!.phase = 'cancelled'; render(); }}>Stop drill</button>
        <InfoTip>{TOOLTIPS.casePractice.retryAndSkip}</InfoTip>
      </div>}
      {shown && <>
        {mode === 'single' && <p className="mb-2">Hold your cube with white on top and green in front.</p>}
        {shown.category === 'Patterns' && <div className="trainer-practice-case-image"><DrillCaseImage cube={cube!} category={shown.category} id={shown.id} pattern={shown.target!} colorFrame={shown.colorFrame} /><span>Target pattern</span><InfoTip>Create this pattern from the solved virtual cube. Random pre/post-AUF is not applied to patterns.</InfoTip></div>}
        {settings.caseNames && <h3>{caseLabel(shown)}</h3>}
        <CubeView cube={cube!} facelets={cube!.facelets(current!.pattern)} moves={current!.moves} cross={3} colorFrame={current!.colorFrame} height={230}
          hidePLL={shown.category === 'OLL' && settings.hidePLL} />
        {settings.solutionAlgorithms !== false && <SolutionProgress cube={cube!} start={current!.initialPattern} pattern={current!.pattern} algorithm={current!.solution} />}
        {settings.upcomingCases && <div className="trainer-case-queue" aria-label="Upcoming 3 cases">
          {current!.queue.slice(1, 4).map((item, index) => <div key={index} data-pre-auf={item.preAuf} data-post-auf={item.postAuf} data-color-frame={item.colorFrame}>
            <p>Next {index + 1}</p><DrillCaseImage cube={cube!} category={item.category} id={item.id} pattern={item.target ?? item.pattern}
              colorFrame={item.colorFrame} hidePLL={item.category === 'OLL' && settings.hidePLL} />
            {settings.caseNames && <strong>{caseLabel(item)}</strong>}</div>)}
        </div>}
      </>}
      {!running && entry && <><div className="trainer-practice-case-image"><CaseImage category={entry.category} id={entry.id} /></div>
        <label htmlFor={`${id}-algorithm`}>Solution</label><select id={`${id}-algorithm`} className="form-select" value={algorithm} onChange={event => setAlgorithm(event.target.value)}>
          <option value="own">Use my own solution</option>
          {entry.options.map(alg => <option key={alg} value={alg}>{alg}</option>)}
        </select></>}
      <PracticeClock practice={current} changed={render} />
      {!running && <><p role="status">{!connection ? 'Connect a smart cube above to practice.' : !cube ? 'Loading puzzle tools...' : 'Ready to practice.'}</p>
          <button className="btn btn-primary align-self-center" disabled={!connection || !cube || (mode === 'single' ? !entry : !training) || editing || generating}
            onClick={() => {
              const cases = mode === 'single' ? entry ? [entry] : [] : (training?.cases ?? []).flatMap(key => findTrainingCase(key) ?? []);
              startPractice(cases, historyId, mode === 'single' && algorithm !== 'own' ? algorithm : null);
            }}>Start practice</button></>}
    </div>}
    {error && <p role="alert" className="mt-3">{error}</p>}
    {!!unsaved.length && <button className="btn btn-outline-primary" onClick={() => {
      try { unsaved.forEach(saveAttempt); setUnsaved([]); setError(''); } catch { setError('Timings still could not be saved.'); }
    }}>Retry saving timings</button>}
    {!!history.length && <section className="mt-4"><h3>Practice timings ({history.length})</h3>
      <DrillTable rows={history} rowKey={row => row.id} caption="Completed practice attempts" initialSort={{ column: 'date', ascending: false }} columns={[
        { key: 'case', label: 'Case', value: row => caseKeyLabel(row.caseKey) },
        { key: 'recognition', label: 'Recognition', numeric: true, value: row => row.recognitionMilliseconds, render: row => seconds(row.recognitionMilliseconds) },
        { key: 'execution', label: 'Execution', numeric: true, value: row => row.executionMilliseconds, render: row => seconds(row.executionMilliseconds) },
        { key: 'result', label: 'Result', numeric: true, value: row => row.dnf ? Infinity : row.recognitionMilliseconds + row.executionMilliseconds,
          render: row => row.dnf ? 'DNF' : seconds(row.recognitionMilliseconds + row.executionMilliseconds) },
        { key: 'date', label: 'Date', numeric: true, value: row => Date.parse(row.date),
          render: row => <time dateTime={row.date} title={new Date(row.date).toLocaleString()}>{relativeTime(row.date)}</time> },
      ]} />
    </section>}
  </section>;
}
function CasePicker({ selected, single = false, change }: { selected: string[]; single?: boolean; change: (key: string) => void }) {
  const name = useId();
  return <fieldset className="trainer-picker"><legend className="h6">{single ? 'Case' : 'Cases'}</legend>
    {categories.map(category => <details className="trainer-category" key={category}>
      <summary><CaseImage category={category} id={category === 'PLL' ? 'T' : '1'} /><span>{category} cases ({selected.filter(key => key.startsWith(`${category}-`)).length} selected)</span></summary>
      <div className="trainer-case-picker">{getAlgorithms().filter(item => item.category === category)
        .sort((a, b) => category === 'OF2L' ? Number(caseNumber(a)) - Number(caseNumber(b)) : 0).map(item => {
        const key = caseKey(item);
        if (single) return <button key={key} type="button" className="trainer-case-choice trainer-case-card" aria-label={`Practice ${caseLabel(item)}`} onClick={() => change(key)}>
          <CaseImage category={item.category} id={item.id} /><strong>{caseLabel(item)}</strong>
        </button>;
        return <label key={key} htmlFor={`${name}-${key}`} className="trainer-case-choice">
          <input id={`${name}-${key}`} type="checkbox" name={name} value={key} aria-label={caseLabel(item)}
            checked={selected.includes(key)} onChange={() => change(key)} />
          <span className="trainer-case-card"><CaseImage category={item.category} id={item.id} /><strong>{caseLabel(item)}</strong>
            <svg className="trainer-case-check" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" /><path d="m12 24 8 8 16-17" /></svg>
          </span>
        </label>;
      })}</div>
    </details>)}
  </fieldset>;
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
