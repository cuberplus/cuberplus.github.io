import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { PageVisible, SettingsContext, usePageDialog } from '@cuberplus/navigation';
import type { Cube } from '../../timer/src/Core/puzzle';
import { CubeView } from '../../timer/src/Components/CubeView';
import { InfoTip } from '../../shared/Components/InfoTip';
import { formatMilliseconds } from '../../shared/display';
import { relativeTime } from '../../timer/src/Data/relativeTime';
import { ORIENTATION_CAMERA, defaultOrientationSettings, edgeName, orientationCard, orientationStagePieces, orientationStages, orientationStats, ORIENTATION_SETTINGS, readOrientationAttempts, saveOrientationAttempt, type OrientationAttempt, type OrientationCard, type OrientationSettings, type OrientationStage } from './orientation';
import { OrientationCaseImage } from './OrientationCaseImage';
import { cubeConnection } from '../../shared/cube/connection';
import { adjacentColors, cubeColors } from './blitz';
import { TOOLTIPS } from '../../shared/tooltips';
import { DrillTable } from './DrillTable';
import { DrillBackButton } from './DrillBackButton';

const noMoves: string[] = [];
function readSettings(): OrientationSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(ORIENTATION_SETTINGS) ?? '{}') as OrientationSettings;
    const settings: OrientationSettings = { stage: Object.hasOwn(orientationStages, saved.stage) ? saved.stage : 'scrambled', gray: saved.gray === true,
      topColor: [...cubeColors, 'Random'].includes(saved.topColor) ? saved.topColor : 'White',
      frontColor: [...cubeColors, 'Random'].includes(saved.frontColor) ? saved.frontColor : 'Green' };
    if (settings.topColor !== 'Random' && settings.frontColor !== 'Random' && !adjacentColors(settings.topColor, settings.frontColor)) {
      settings.topColor = 'White'; settings.frontColor = 'Green';
    }
    return settings;
  } catch { return { ...defaultOrientationSettings }; }
}
export function OrientationFlashcards({ cube, back, optionsDialog }: { cube: Cube | null; back: () => void; optionsDialog?: RefObject<HTMLDialogElement> }) {
  const colorsId = useId();
  const localOptions = useRef<HTMLDialogElement>(null), options = optionsDialog ?? localOptions;
  usePageDialog(options, false);
  const visible = useContext(PageVisible), { precision } = useContext(SettingsContext);
  const [settings, setSettings] = useState(readSettings), [card, setCard] = useState<OrientationCard | null>(null);
  const [attempts, setAttempts] = useState<OrientationAttempt[]>([]), [unsaved, setUnsaved] = useState<OrientationAttempt[]>([]);
  const [feedback, setFeedback] = useState<OrientationAttempt | null>(null), [review, setReview] = useState<OrientationAttempt | null>(null);
  const [error, setError] = useState(''), [ready, setReady] = useState(false);
  const started = useRef<number | null>(null), locked = useRef(true), next = useRef<ReturnType<typeof setTimeout>>();
  const activeCard = useRef<HTMLDivElement>(null), reviewCard = useRef<HTMLElement>(null);
  const answerRef = useRef<(answer: boolean) => void>(() => {});
  const cardReady = useCallback(() => { started.current = performance.now(); locked.current = false; setReady(true); }, [card?.id]);
  const stop = useCallback(() => {
    clearTimeout(next.current); locked.current = true; started.current = null; setCard(null); setFeedback(null); setReady(false);
  }, []);
  useEffect(() => {
    try { setAttempts(readOrientationAttempts()); } catch (failure) { setError((failure as Error).message); }
    return () => clearTimeout(next.current);
  }, []);
  useEffect(() => { if (!visible) stop(); }, [visible, stop]);
  useEffect(() => cubeConnection.onEvent(event => {
    if (event.type === 'MOVE' && (event.move === 'U' || event.move === "U'")) answerRef.current(event.move === 'U');
  }), []);
  useEffect(() => {
    const pause = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, [stop]);
  const stats = useMemo(() => orientationStats(attempts), [attempts]);
  const recent = useMemo(() => [...attempts].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 20), [attempts]);
  const time = (milliseconds: number) => `${formatMilliseconds(milliseconds, precision)}s`;
  function showNext() {
    if (!cube) return;
    locked.current = true; started.current = null; setReady(false); setFeedback(null); setCard(orientationCard(cube, settings.stage, Math.random, settings));
  }
  answerRef.current = answer => {
    if (!card || !visible || document.hidden || locked.current || started.current === null) return;
    locked.current = true;
    const attempt: OrientationAttempt = { ...card, date: new Date().toISOString(), gray: settings.gray, answer, correct: answer === card.oriented,
      milliseconds: Math.max(0, performance.now() - started.current) };
    setFeedback(attempt); setAttempts(items => [attempt, ...items]);
    try { saveOrientationAttempt(attempt); } catch { setUnsaved(items => [...items, attempt]); setError('Your result is shown, but could not be saved.'); }
    next.current = setTimeout(showNext, 700);
  };
  const answer = useCallback((value: boolean) => answerRef.current(value), []);
  function changeSettings(value: typeof settings) {
    setSettings(value);
    try { localStorage.setItem(ORIENTATION_SETTINGS, JSON.stringify(value)); } catch { setError('Flashcard options changed, but could not be saved.'); }
  }
  return <section className="orientation-flashcards">
    <div className="d-flex align-items-center gap-3 mb-3">
      <DrillBackButton back={back} />
      <h2 className="mb-0">Orientation Flashcards <InfoTip>{TOOLTIPS.orientationFlashcards.overview}</InfoTip></h2>
    </div>
    <dialog ref={options} className="panel options-dialog orientation-options" aria-labelledby={`${colorsId}-options-title`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 id={`${colorsId}-options-title`} className="mb-0">Orientation Flashcards options</h2>
        <button type="button" className="btn-close" aria-label="Close options" onClick={() => options.current?.close()} />
      </div>
    <fieldset disabled={!!card} className="d-grid gap-3"><legend className="visually-hidden">Flashcard options</legend>
      <label>Cube state<select aria-label="Cube state" className="form-select" value={settings.stage} onChange={event => changeSettings({ ...settings, stage: event.target.value as OrientationStage })}>
        {Object.entries(orientationStages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      {(['topColor', 'frontColor'] as const).map(key => {
        const other = settings[key === 'topColor' ? 'frontColor' : 'topColor'];
        return <div key={key}>
          <label htmlFor={`${colorsId}-${key}`}>{key === 'topColor' ? 'Top color' : 'Front color'}</label>
          <select id={`${colorsId}-${key}`} name={key} className="form-select" value={settings[key]}
            onChange={event => changeSettings({ ...settings, [key]: event.target.value as OrientationSettings['topColor'] })}>
            {([...cubeColors, 'Random'] as const).map(color => <option key={color}
              disabled={color !== 'Random' && other !== 'Random' && !adjacentColors(color, other)}>{color}</option>)}
          </select>
        </div>;
      })}
      <div className="d-flex align-items-center gap-2"><label className="form-check mb-0"><input type="checkbox" className="form-check-input" checked={settings.gray} onChange={event => changeSettings({ ...settings, gray: event.target.checked })} />Gray out irrelevant stickers</label>
        <InfoTip>{TOOLTIPS.orientationFlashcards.grayStickers}</InfoTip></div>
    </fieldset>
    </dialog>
    {!card ? <button className="btn btn-primary" disabled={!cube} onClick={() => {
      showNext(); requestAnimationFrame(() => activeCard.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
    }}>{cube ? 'Start flashcards' : 'Loading cube...'}</button> :
      <div className="card p-3" ref={activeCard}>
        <div className="orientation-answers">
          <button className="btn btn-outline-primary" disabled={!ready || !!feedback} onClick={() => answer(true)}>Oriented (U) <span aria-hidden="true">&larr;</span></button>
          <button className="btn btn-outline-primary" disabled={!ready || !!feedback} onClick={() => answer(false)}><span aria-hidden="true">&rarr;</span> Not oriented (U')</button>
        </div>
        <div className="orientation-swipe-area">
          <SwipeCard key={card.id} cube={cube!} card={card} gray={settings.gray} ready={cardReady} answer={answer} disabled={!ready || !!feedback} direction={feedback ? feedback.answer ? 'left' : 'right' : null} />
          <div className="orientation-feedback" role="status" aria-live="polite" aria-atomic="true">
            {feedback && <div className={`alert ${feedback.correct ? 'alert-success' : 'alert-danger'} mb-0`}>
              <strong>{feedback.correct ? 'Correct' : 'Incorrect'}</strong> &mdash; {time(feedback.milliseconds)}
              {!feedback.correct && <span className="d-block">This edge is {feedback.oriented ? 'oriented' : 'not oriented'}.</span>}
            </div>}
          </div>
        </div>
        <button className="btn btn-outline-secondary align-self-center mt-3" onClick={stop}>Stop flashcards</button>
      </div>}
    {error && <p role="alert" className="mt-3">{error}</p>}
    {!!unsaved.length && <button className="btn btn-outline-primary" onClick={() => {
      try { unsaved.forEach(saveOrientationAttempt); setUnsaved([]); setError(''); } catch { setError('Results still could not be saved. Existing saved results have not changed.'); }
    }}>Retry saving flashcards</button>}
    {!!attempts.length && <section className="mt-4"><h3>Flashcard statistics</h3>
      <p>{attempts.filter(attempt => attempt.correct).length}/{attempts.length} correct ({Math.round(attempts.filter(attempt => attempt.correct).length / attempts.length * 100)}%) &middot; Average {time(attempts.reduce((sum, attempt) => sum + attempt.milliseconds, 0) / attempts.length)}</p>
      <article className="card p-3" aria-label="Case statistics">
        <h4 className="h5">Case statistics <InfoTip>{TOOLTIPS.orientationFlashcards.caseStatistics}</InfoTip></h4>
        <DrillTable rows={stats} rowKey={row => row.key} caption="Case statistics" initialSort={{ column: 'accuracy', ascending: true }} columns={[
          { key: 'stage', label: 'State', value: row => orientationStages[row.stage] },
          { key: 'position', label: 'Position', value: row => edgeName(row.position), render: row => <div className="d-flex align-items-center gap-2"><OrientationCaseImage cube={cube} card={row} gray /><span>{edgeName(row.position)}</span></div> },
          { key: 'oriented', label: 'Orientation', value: row => row.oriented ? 'Oriented' : 'Not oriented' },
          { key: 'count', label: 'Attempts', numeric: true, value: row => row.count },
          { key: 'accuracy', label: 'Accuracy', numeric: true, value: row => row.accuracy, render: row => `${Math.round(row.accuracy * 100)}%` },
          { key: 'average', label: 'Average', numeric: true, value: row => row.average, render: row => time(row.average) },
        ]} />
      </article>
      <article className="card p-3 mt-3" aria-label="Recent answers">
        <h4 className="h5">Recent answers <InfoTip>{TOOLTIPS.orientationFlashcards.recentAnswers(Math.min(20, attempts.length))}</InfoTip></h4>
        <DrillTable rows={recent} rowKey={row => row.id} caption="Recent answers" initialSort={{ column: 'date', ascending: false }} columns={[
          { key: 'date', label: 'When', numeric: true, value: row => Date.parse(row.date), render: row => <time dateTime={row.date} title={new Date(row.date).toLocaleString()}>{relativeTime(row.date)}</time> },
          { key: 'stage', label: 'State', value: row => orientationStages[row.stage] },
          { key: 'position', label: 'Edge', value: row => edgeName(row.position), render: row => <div className="d-flex align-items-center gap-2"><OrientationCaseImage cube={cube} card={row} gray /><span>{edgeName(row.position)}</span><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => {
            setReview(row); requestAnimationFrame(() => reviewCard.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
          }}>Review case</button></div> },
          { key: 'answer', label: 'Answer', value: row => row.answer ? 'Oriented' : 'Not oriented' },
          { key: 'correct', label: 'Result', value: row => row.correct ? 'Correct' : 'Incorrect' },
          { key: 'milliseconds', label: 'Time', numeric: true, value: row => row.milliseconds, render: row => time(row.milliseconds) },
        ]} />
      </article>
    </section>}
    {review && cube && <section className="card p-3 mt-3" aria-label="Recorded flashcard" ref={reviewCard}>
      <div className="d-flex justify-content-between align-items-center"><h3>Recorded case: {edgeName(review.position)}</h3><button className="btn-close" aria-label="Close recorded case" onClick={() => setReview(null)} /></div>
      <CardCube key={review.id} cube={cube} card={review} gray={review.gray} />
      <p>{review.oriented ? 'Oriented' : 'Not oriented'} &middot; {review.correct ? 'Correct' : 'Incorrect'} in {time(review.milliseconds)}</p>
    </section>}
  </section>;
}
function CardCube({ cube, card, gray, ready }: { cube: Cube; card: OrientationCard; gray: boolean; ready?: () => void }) {
  const frame = useMemo(() => cube.solved().applyAlg(card.colorFrame ?? '').patternData, [cube, card.colorFrame]);
  const highlight = useMemo(() => ({ EDGES: [frame['EDGES'].pieces[card.edge]] }), [frame, card.edge]);
  const coloredPieces = useMemo(() => ({
    EDGES: orientationStagePieces[card.stage].EDGES?.map(piece => frame['EDGES'].pieces[piece]),
    CORNERS: orientationStagePieces[card.stage].CORNERS?.map(piece => frame['CORNERS'].pieces[piece]),
  }), [frame, card.stage]);
  return <div className="orientation-cube"><CubeView cube={cube} facelets={card.facelets} moves={noMoves} rotation="" colorFrame={card.colorFrame ?? ''} highlight={highlight} focusEdge={gray ? highlight.EDGES[0] : undefined} coloredPieces={gray ? coloredPieces : undefined} camera={ORIENTATION_CAMERA} ready={ready} height={300} /></div>;
}
function SwipeCard({ cube, card, gray, ready, answer, disabled, direction }: {
  cube: Cube; card: OrientationCard; gray: boolean; ready: () => void; answer: (value: boolean) => void; disabled: boolean; direction: 'left' | 'right' | null;
}) {
  const track = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null), mouse = useRef<number | null>(null);
  const enabled = useRef(!disabled); enabled.current = !disabled;
  useEffect(() => {
    const scroller = track.current!, item = content.current!;
    scroller.scrollLeft = scroller.clientWidth;
    const observer = new IntersectionObserver(entries => {
      const entry = entries.at(-1)!;
      if (enabled.current && entry.intersectionRatio < .2) answer(entry.boundingClientRect.x < scroller.getBoundingClientRect().x);
    }, { root: scroller, threshold: [.2] });
    observer.observe(item);
    const resize = new ResizeObserver(() => { if (enabled.current) scroller.scrollLeft = scroller.clientWidth; });
    resize.observe(scroller);
    return () => { observer.disconnect(); resize.disconnect(); };
  }, [answer]);
  useEffect(() => {
    if (!direction || !track.current) return;
    track.current.scrollTo({ left: direction === 'left' ? track.current.clientWidth * 2 : 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [direction]);
  return <div ref={track} className="orientation-track" data-no-swipe tabIndex={-1} aria-label="Swipe left for oriented or right for not oriented"
    onPointerDown={event => { if (event.pointerType === 'mouse') { mouse.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); } }}
    onPointerCancel={() => { mouse.current = null; }}
    onPointerUp={event => {
      if (mouse.current !== null && enabled.current && Math.abs(event.clientX - mouse.current) >= 60) answer(event.clientX < mouse.current);
      mouse.current = null;
    }}>
    <div aria-hidden="true" />
    <div ref={content} className="orientation-card"><CardCube cube={cube} card={card} gray={gray} ready={ready} /></div>
    <div aria-hidden="true" />
  </div>;
}
