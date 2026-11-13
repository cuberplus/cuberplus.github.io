import { useContext, useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react';
import Navigation, { Footer, PageLocation, PageVisible, SettingsContext, usePageDialog } from '@cuberplus/navigation';
import type { SmartCubeEvent } from 'smartcube-web-bluetooth';
import { cubeConnection, useCubeConnection } from '../../shared/cube/connection';
import { CubeButton, CubePicker } from '../../shared/Components/CubeConnection';
import { PageOptionsButton } from '../../shared/Components/PageOptionsButton';
import { TimerEngine, inspectionPenalty, solveTime, type Solve } from './Core/engine';
import { generateScramble, inverse, loadCube, movesOf, simplifyMoves, SOLVED, type Cube } from './Core/puzzle';
import { averageDetails, backupJSON, cubeastCSV, dailyStreak, deleteSolve, formatTime, newPersonalBests, numberedSolves, personalBestNotifications, readSolves, recoverLocalSolves, saveSolves, sessionStats, solveEndDate, turns, updateSession, validateBackup } from './Data/storage';
import { AverageDetails } from './Components/AverageDetails';
import { CubeView } from './Components/CubeView';
import { Replay } from './Components/Replay';
import { SolveTimeline } from './Components/SolveTimeline';
import { SolveMistakes } from './Components/SolveMistakes';
import { FavoriteOptions } from './Components/FavoriteOptions';
import { useScreenWakeLock } from './Hooks/useScreenWakeLock';
import { InfoTip } from '../../shared/Components/InfoTip';
import { latestSolves } from '../../shared/Components/SolveLimit';
import { SessionPicker } from './Components/SessionPicker';
import { noteCloudSolve } from '../../src/cloud/backup';
import { relativeTime } from './Data/relativeTime';
import { MacAddressHelp } from '../../shared/Components/MacAddressHelp';

const errorText = (error: Error): string => error.message || 'The operation failed.';
const historyColumns = [
  { key: 'number', label: 'Solve' },
  { key: 'duration', label: 'Time' },
  { key: 'turns', label: 'Turns' },
  { key: 'tps', label: 'TPS' },
] as const;
type HistoryColumn = typeof historyColumns[number]['key'];
type HiddenVisuals = { timer: boolean; cube: boolean; progressBar: boolean };

function SolvePenalty({ solve }: { solve: Solve | null | undefined }) {
  if (solve?.status === 'incomplete') return <>{' '}<span className="badge text-bg-danger solve-penalty">DNF</span></>;
  if (solve?.status === 'complete' && solve.penalty) return <>{' '}<span className="badge text-bg-warning solve-penalty">+{solve.penalty / 1000}</span></>;
  return null;
}

export default function App() {
  const address = useContext(PageLocation);
  const visible = useRef(true); visible.current = useContext(PageVisible);
  const trainerActive = /^\/trainer(?:\/|$)/.test(address || location.pathname);
  const acceptingMoves = useRef(!trainerActive);
  acceptingMoves.current = !trainerActive;
  const sharedCube = useCubeConnection();
  useScreenWakeLock();
  const [, render] = useReducer((n: number) => n + 1, 0);
  const [cube, setCube] = useState<Cube | null>(null);
  const [history, setHistory] = useState<Solve[]>([]);
  const [celebrations, setCelebrations] = useState<{ id: string; name: string; time: number; solve: Solve; average: ReturnType<typeof averageDetails> }[]>([]);
  const [streaks, setStreaks] = useState<{ id: string; current: number; best: number }[]>([]);
  const [average, setAverage] = useState<ReturnType<typeof averageDetails>>(null);
  const [historySort, setHistorySort] = useState<{ column: HistoryColumn; direction: 'ascending' | 'descending' }>({ column: 'number', direction: 'descending' });
  const [error, setError] = useState('');
  const [storage, setStorage] = useState('Loading local history...');
  const [historyReady, setHistoryReady] = useState(false), historyLoading = useRef<Promise<void>>(Promise.resolve());
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [demo, setDemo] = useState(false);
  const [battery, setBattery] = useState<number | null>(null);
  const [mac, setMac] = useState(() => { try { return localStorage.getItem('timer-last-cube-mac') ?? ''; } catch { return ''; } });
  const { precision, solveLimit } = useContext(SettingsContext);
  const [overTurnPenalty, setOverTurnPenalty] = useState(() => { try { return localStorage.getItem('timer-over-turn-penalty') === 'true'; } catch { return false; } });
  const [inspection, setInspection] = useState(() => { try { return localStorage.getItem('timer-inspection') === 'true'; } catch { return false; } });
  const [showEveryLongPb, setShowEveryLongPb] = useState(() => { try { return localStorage.getItem('timer-show-every-long-pb') === 'true'; } catch { return false; } });
  const [allSessions, setAllSessions] = useState(() => { try { return localStorage.getItem('timer-all-session-history') === 'true'; } catch { return false; } });
  const [historyNow, setHistoryNow] = useState(Date.now);
  useEffect(() => {
    setHistoryNow(Date.now());
    const clock = setInterval(() => setHistoryNow(Date.now()), 60000);
    return () => clearInterval(clock);
  }, [allSessions]);
  const [hiddenVisuals, setHiddenVisuals] = useState<HiddenVisuals>(() => {
    try {
      const value = JSON.parse(localStorage.getItem('timer-hide-distracting-visuals') ?? 'false') as Partial<HiddenVisuals> | boolean | null;
      const hidden = typeof value === 'object' && value !== null ? value : {};
      return { timer: value === true || hidden.timer === true, cube: value === true || hidden.cube === true, progressBar: value === true || hidden.progressBar === true };
    } catch { return { timer: false, cube: false, progressBar: false }; }
  });
  const [session, setSession] = useState('Default');
  const [historyPage, setHistoryPage] = useState(0);
  const [changingSession, setChangingSession] = useState(false);
  const sessionChange = useRef(false);
  const [createdSessions, setCreatedSessions] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('timer-sessions') ?? '[]') as string[];
      return Array.isArray(saved) ? saved.filter(name => typeof name === 'string' && name.trim() && name.length <= 100) : [];
    } catch { return []; }
  });
  const [replay, setReplay] = useState<Solve | null>(null);
  const engine = useRef<TimerEngine | null>(null);
  const historyRef = useRef<Solve[]>([]);
  const recordChecks = useRef(new Map<string, { solve: Solve; previous: Solve[]; timeout: ReturnType<typeof setTimeout> }>());
  const dailyRecords = useRef<{ date: string; records: string[] } | null>(null);
  const optionsDialog = useRef<HTMLDialogElement>(null);
  const setupDialog = useRef<HTMLDialogElement>(null);
  usePageDialog(optionsDialog, false);
  usePageDialog(setupDialog, false);
  const bluetooth = useRef(cubeConnection.adapter);
  const writes = useRef(Promise.resolve());
  const queuedWrites = useRef(new Map<string, Solve>());
  const pending = useRef(0);
  const failedSaves = useRef(new Set<string>());
  const deletedSolves = useRef(new Set<string>());
  const generation = useRef(0);
  const preparing = useRef(false);
  const resynchronizing = useRef(false);
  const calibrating = useRef(false);
  const queued = useRef<{ event: SmartCubeEvent; hostTime: number }[]>([]);
  const mounted = useRef(true);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const retry = useRef<{ scramble: string; previousSession: string; id?: string } | null>(null);
  const overTurnPenaltyRef = useRef(overTurnPenalty);
  overTurnPenaltyRef.current = overTurnPenalty;
  const inspectionRef = useRef(inspection);
  inspectionRef.current = inspection;
  const showEveryLongPbRef = useRef(showEveryLongPb);
  showEveryLongPbRef.current = showEveryLongPb;
  useEffect(() => {
    const selected = sharedCube.cubes.find(cube => cube.id === sharedCube.selected);
    if (selected) setMac(selected.mac);
  }, [sharedCube.selected, sharedCube.cubes]);

  function updateHistory(items: Solve[]) { historyRef.current = items; setHistory(items); }
  function createSession(name: string) {
    const next = [...new Set([...createdSessions, name])];
    setCreatedSessions(next); setSession(name);
    try { localStorage.setItem('timer-sessions', JSON.stringify(next)); }
    catch { setError('Session created, but its name could not be saved in this browser.'); }
  }
  async function manageSession(name: string | null): Promise<boolean> {
    if (sessionChange.current || !historyReady || engine.current?.phase === 'solving' || retry.current) return false;
    const previous = sessionRef.current;
    if (name === previous) return true;
    if (name !== null && (!name.trim() || name.length > 100 || name === 'Retries' || sessions.includes(name) || name === 'Default')) {
      throw new Error('Choose a unique session name of 1 to 100 characters. Retries is reserved for retry attempts.');
    }
    const affected = new Set(historyRef.current.filter(solve => solve.session === previous).map(solve => solve.id));
    if (name === null && !window.confirm(`Are you sure you want to delete session "${previous}" and its ${affected.size.toLocaleString()} solve${affected.size === 1 ? '' : 's'}? This cannot be undone.`)) return false;
    sessionChange.current = true; setChangingSession(true);
    const task = writes.current.then(async () => {
      if (engine.current?.phase === 'solving' || retry.current) throw new Error('Finish or abort the current solve before changing sessions.');
      const next = [...new Set([...sessions.filter(session => session !== previous), ...(name === null ? [] : [name])])];
      const stored = localStorage.getItem('timer-sessions');
      localStorage.setItem('timer-sessions', JSON.stringify(next));
      try { await updateSession([...affected], name); }
      catch (failure) {
        if (stored === null) localStorage.removeItem('timer-sessions');
        else localStorage.setItem('timer-sessions', stored);
        throw failure;
      }
      const target = name ?? 'Default';
      const relabel = (solve: Solve): Solve => solve.session === previous ? { ...solve, session: target } : solve;
      if (name === null) affected.forEach(id => deletedSolves.current.add(id));
      queuedWrites.current.forEach((solve, id) => queuedWrites.current.set(id, relabel(solve)));
      const timer = engine.current;
      if (timer?.active) timer.active = relabel(timer.active);
      if (timer?.result) timer.result = name === null && affected.has(timer.result.id) ? null : relabel(timer.result);
      recordChecks.current.forEach((check, id) => {
        if (name === null && affected.has(id)) { clearTimeout(check.timeout); recordChecks.current.delete(id); }
        else { check.solve = relabel(check.solve); check.previous = check.previous.filter(solve => name !== null || !affected.has(solve.id)).map(relabel); }
      });
      if (name === null) affected.forEach(id => failedSaves.current.delete(id));
      updateHistory(historyRef.current.filter(solve => name !== null || !affected.has(solve.id)).map(relabel));
      setReplay(current => current && (name !== null || !affected.has(current.id)) ? relabel(current) : null);
      setAverage(null); setCelebrations([]); setStreaks([]);
      setCreatedSessions(next); sessionRef.current = target; setSession(target);
      if (pending.current === 0) setStorage(failedSaves.current.size ? 'Some solves not saved - export a backup now' : 'Saved locally');
      return true;
    });
    writes.current = task.then(() => {}, () => {});
    try { return await task; }
    finally { sessionChange.current = false; setChangingSession(false); }
  }
  function finishRetry() {
    if (!retry.current) return;
    sessionRef.current = retry.current.previousSession;
    setSession(retry.current.previousSession);
    retry.current = null;
  }

  function notificationRecords(records: ReturnType<typeof newPersonalBests>) {
    const now = new Date(), date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const shown = new Set<string>(dailyRecords.current?.date === date ? dailyRecords.current.records : []);
    try {
      const saved = JSON.parse(localStorage.getItem('timer-pb-daily-records') ?? 'null') as typeof dailyRecords.current;
      if (saved?.date === date && Array.isArray(saved.records)) {
        saved.records.forEach(name => { if (name === 'Ao100' || name === 'Ao1000') shown.add(name); });
      }
    } catch { /* Keep the in-memory daily limit when storage is blocked. */ }
    const eligible = personalBestNotifications(records, shown, showEveryLongPbRef.current);
    dailyRecords.current = { date, records: [...shown] };
    try { localStorage.setItem('timer-pb-daily-records', JSON.stringify(dailyRecords.current)); } catch { /* The daily limit still applies until this page is closed. */ }
    return eligible;
  }

  const record = (solve: Solve, notify = true) => {
    if (deletedSolves.current.has(solve.id)) return;
    const copy = structuredClone(solve);
    const previous = historyRef.current, check = recordChecks.current.get(copy.id);
    if (copy.status !== 'active') updateHistory([copy, ...previous.filter(item => item.id !== copy.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    if (copy.status === 'incomplete') setCelebrations(current => current.filter(item => item.solve.id !== copy.id));
    if (!notify) {
      if (check) clearTimeout(check.timeout);
      recordChecks.current.delete(copy.id);
      recordChecks.current.forEach(candidate => { candidate.previous = candidate.previous.map(item => item.id === copy.id ? copy : item); });
      setCelebrations([]);
    } else if (copy.status !== 'active') {
      if (check) check.solve = copy;
      else {
        const timeout = setTimeout(async () => {
          await historyLoading.current;
          const candidate = recordChecks.current.get(copy.id);
          recordChecks.current.delete(copy.id);
          if (!candidate) return;
          const date = solveEndDate(candidate.solve);
          if (!candidate.previous.some(solve => solve.status !== 'active' && solveEndDate(solve).toDateString() === date.toDateString())) {
            const { current, best } = dailyStreak(historyRef.current, date);
            setStreaks(items => [...items, { id: copy.id, current, best }]);
          }
          const personalBests = newPersonalBests(candidate.previous, candidate.solve);
          if (!candidate.previous.some(item => item.id === copy.id && item.status !== 'active')) {
            void writes.current.then(() => {
              if (!failedSaves.current.has(copy.id) && !deletedSolves.current.has(copy.id)) return noteCloudSolve(candidate.solve, personalBests);
            });
          }
          const records = notificationRecords(personalBests);
          if (records.length) {
            const solves = [candidate.solve, ...candidate.previous.filter(item => item.session !== 'Retries' && item.id !== copy.id)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))];
            setCelebrations(current => [...current, ...records.map(record => ({
              ...record, id: `${copy.id}-${record.name}`, solve: candidate.solve,
              average: record.name === 'Single' ? null : averageDetails(solves, Number(record.name.slice(2))),
            }))]);
          }
        }, Math.max(0, 501 - (performance.now() - (copy.moves.at(-1)?.hostTime ?? performance.now()))));
        recordChecks.current.set(copy.id, { solve: copy, previous, timeout });
      }
    }
    const attempt = retry.current;
    if (notify && attempt && copy.session === 'Retries' && copy.scramble === attempt.scramble) {
      if (!attempt.id && !previous.some(item => item.id === copy.id)) attempt.id = copy.id;
      if (attempt.id === copy.id && copy.status !== 'active') finishRetry();
    }
    const queued = queuedWrites.current.has(copy.id);
    queuedWrites.current.set(copy.id, copy);
    if (queued) return;
    pending.current++;
    setStorage('Saving locally...');
    writes.current = writes.current.then(async () => {
      const latest = queuedWrites.current.get(copy.id)!;
      queuedWrites.current.delete(copy.id);
      if (deletedSolves.current.has(copy.id)) return;
      await saveSolves([latest]);
      if (deletedSolves.current.has(copy.id)) await deleteSolve(copy.id);
    }).then(() => {
      pending.current--;
      failedSaves.current.delete(copy.id);
      if (pending.current === 0) setStorage(failedSaves.current.size ? 'Some solves not saved - export a backup now' : 'Saved locally');
    }).catch((failure: Error) => {
      pending.current--;
      failedSaves.current.add(copy.id);
      setStorage('Not saved - export a backup now');
      setError(`Local storage: ${errorText(failure)}`);
    });
  };

  useEffect(() => {
    mounted.current = true; console.info('[Timer Bluetooth] Initializing Timer', { browser: navigator.userAgent, bluetoothAvailable: !!navigator.bluetooth, secureContext: window.isSecureContext });
    const removeSavedSolve = (event: Event) => {
      const detail = (event as CustomEvent<string | string[]>).detail, ids = new Set(Array.isArray(detail) ? detail : [detail]);
      ids.forEach(id => {
        deletedSolves.current.add(id);
        const check = recordChecks.current.get(id);
        if (check) clearTimeout(check.timeout);
        recordChecks.current.delete(id);
        failedSaves.current.delete(id);
      });
      recordChecks.current.forEach(candidate => { candidate.previous = candidate.previous.filter(solve => !ids.has(solve.id)); });
      updateHistory(historyRef.current.filter(solve => !ids.has(solve.id)));
      setReplay(current => current && ids.has(current.id) ? null : current);
      setAverage(null); setCelebrations([]); setStreaks(current => current.filter(streak => !ids.has(streak.id)));
      if (pending.current === 0) setStorage(failedSaves.current.size ? 'Some solves not saved - export a backup now' : 'Saved locally');
    };
    window.addEventListener('timer-solve-deleted', removeSavedSolve);
    const refreshHistory = () => { void readSolves(100).then(items => { if (mounted.current) updateHistory(items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))); }).catch(() => setError('Local history could not be refreshed.')); };
    window.addEventListener('timer-solves-changed', refreshHistory);
    historyLoading.current = loadCube().then(async model => {
      if (!mounted.current) return;
      engine.current = new TimerEngine(model, record, render);
      engine.current.overTurnPenaltyEnabled = overTurnPenaltyRef.current;
      engine.current.inspectionPenaltyEnabled = inspectionRef.current;
      setCube(model); console.info('[Timer Bluetooth] Puzzle loaded; connection controls ready');
      let recovered: Solve[] = [];
      try {
        recovered = await recoverLocalSolves(model, id => engine.current?.active?.id === id || historyRef.current.some(solve => solve.id === id));
        if (mounted.current && pending.current === 0) setStorage('Saved locally');
      } catch (failure) {
        if (mounted.current) {
          setStorage('Local history unavailable');
          setError(failure instanceof Error ? failure.message : 'Cannot load local history.');
        }
      }
      if (!mounted.current) return;
      const merged = new Map([...recovered, ...historyRef.current].map(solve => [solve.id, solve]));
      recordChecks.current.forEach(check => {
        check.previous = [...new Map([...recovered.filter(solve => solve.id !== check.solve.id && !deletedSolves.current.has(solve.id)),
          ...check.previous].map(solve => [solve.id, solve])).values()];
      });
      updateHistory([...merged.values()].filter(solve => solve.status !== 'active' && !deletedSolves.current.has(solve.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setHistoryReady(true);
    }).catch((failure: Error) => { console.error('[Timer Bluetooth] Puzzle initialization failed', failure); setError(errorText(failure)); });
    const interval = setInterval(() => {
      if (visible.current && !document.hidden && (engine.current?.phase === 'solving' || engine.current?.phase === 'ready' && inspectionRef.current)) render();
    }, 30);
    const checks = recordChecks.current;
    const unsubscribe = cubeConnection.onEvent(event => {
      if (!acceptingMoves.current && event.type !== 'DISCONNECT') return;
      const connection = cubeConnection.getSnapshot().connection;
      if (connection && engine.current?.phase === 'disconnected') engine.current.connect(connection.deviceName);
      receive(event);
    });
    return () => { mounted.current = false; unsubscribe(); window.removeEventListener('timer-solve-deleted', removeSavedSolve); window.removeEventListener('timer-solves-changed', refreshHistory); clearInterval(interval); checks.forEach(check => clearTimeout(check.timeout)); checks.clear(); };
  }, []);

  useEffect(() => {
    const timer = engine.current;
    if (!cube || !timer) return;
    if (trainerActive) {
      if (sharedCube.connection && timer.phase !== 'disconnected') { cancelPreparation(); timer.disconnect(); }
      return;
    }
    if (sharedCube.connection && (timer.phase === 'disconnected' || timer.device !== sharedCube.connection.deviceName)) {
      timer.connect(sharedCube.connection.deviceName);
      setDemo(false);
      if (sharedCube.connection.capabilities?.facelets) void bluetooth.current.refresh().catch((failure: Error) => setError(errorText(failure)));
    } else if (!sharedCube.connection && !demo && timer.phase !== 'disconnected') { cancelPreparation(); timer.disconnect(); }
  }, [cube, trainerActive, sharedCube.connection, demo]);

  useEffect(() => {
    if (!cube || !historyReady) return;
    const url = new URL(address || location.href, location.origin);
    if (!/^\/timer(?:\/(?:index\.html)?)?$/.test(url.pathname)) return;
    const id = url.searchParams.get('solve');
    if (id) setReplay(historyRef.current.find(solve => solve.id === id) ?? null);
    const retryId = url.searchParams.get('retry');
    if (retryId) {
      const solve = historyRef.current.find(solve => solve.id === retryId && solve.status !== 'active');
      if (solve) retrySolve(solve); else setError('This solve is no longer saved in Timer.');
    }
  }, [cube, address, historyReady]);

  async function prepareScramble(recover = false, existingScramble = retry.current?.scramble ?? '') {
    const timer = engine.current;
    const allowed = ['synchronizing', 'scrambling', 'ready', 'finished', ...(recover ? ['recovery', 'recovering'] : [])];
    if (!timer || preparing.current || !allowed.includes(timer.phase)) return;
    const token = ++generation.current, initial = timer.facelets;
    preparing.current = true; setBusy(true); setStatus(recover || existingScramble ? 'Finding moves to return the cube to solved...' : 'Generating scramble and setup locally...');
    try {
      const [scramble, setup] = await Promise.all([recover || existingScramble ? Promise.resolve(recover ? '' : existingScramble) : generateScramble(), initial === SOLVED ? Promise.resolve([]) : timer.cube.solution(initial)]);
      if (token !== generation.current) return;
      if (timer.facelets !== initial || !allowed.includes(timer.phase)) throw new Error('Cube changed during preparation. Resynchronize and try again.');
      if (recover) timer.prepareRecovery(setup);
      else timer.prepare(retry.current?.scramble ?? scramble, setup);
      setStatus('');
    } catch (failure) {
      if (token === generation.current) { queued.current = []; setStatus(''); finishRetry(); timer.fail('Scramble preparation failed. Read the cube state to retry.', false); setError(failure instanceof Error ? failure.message : 'Scramble generation failed.'); }
    } finally {
      if (token === generation.current) {
        preparing.current = false; setBusy(false); queued.current.splice(0).forEach(({ event, hostTime }) => receive(event, hostTime));
        if (recover && timer.phase === 'finished') void prepareScramble();
      }
    }
  }

  function cancelPreparation() { generation.current++; preparing.current = false; queued.current = []; setBusy(false); setStatus(''); }

  function receive(event: SmartCubeEvent, hostTime = performance.now()) {
    const timer = engine.current; if (!timer || (event.type === 'FACELETS' && (event.source === 'moves' || calibrating.current))) return;
    const turn = event.type === 'MOVE' ? { move: event.move, hostTime, localTimestamp: event.localTimestamp, cubeTimestamp: event.cubeTimestamp, serial: event.serial } : null;
    try {
      if (preparing.current && (event.type === 'MOVE' || event.type === 'FACELETS')) {
        if (turn) timer.penalizeExtraTurn(turn);
        queued.current.push({ event, hostTime }); return;
      }
      if (turn) {
        timer.session = sessionRef.current.trim() || 'Default';
        timer.turn(turn);
        if (timer.phase === 'finished') void prepareScramble();
        else if (['scrambling', 'recovering'].includes(timer.phase) && timer.recovery.length >= 10) {
          void prepareScramble(timer.phase === 'recovering', timer.scramble);
        }
      } else if (event.type === 'FACELETS') {
        timer.snapshot(event.facelets, event.serial);
        if (timer.phase === 'synchronizing') void prepareScramble(timer.result?.status === 'incomplete');
      } else if (event.type === 'BATTERY') setBattery(event.batteryLevel);
      else if (event.type === 'DISCONNECT') {
        cancelPreparation();
        setBattery(null);
        timer.disconnect();
        finishRetry();
      }
    } catch (failure) {
      console.error('[Timer Bluetooth] Timer rejected a cube event', { event, phase: timer.phase }, failure); timer.fail(failure instanceof Error ? failure.message : 'Invalid cube event.');
    }
    if (timer.phase === 'recovery' && timer.result?.status === 'incomplete' && !resynchronizing.current) void resynchronize();
  }

  function connect() {
    console.info('[Timer Bluetooth] Connect requested', { mac: mac.trim() || null, puzzleReady: !!cube, busy, connecting, connected: !!connected, bluetoothAvailable: !!navigator.bluetooth, secureContext: window.isSecureContext, userActivation: navigator.userActivation?.isActive }); if (!canConnect) { console.warn('[Timer Bluetooth] Connection blocked: check the flags above'); return; }
    setError(''); setConnecting(true); setDemo(false);
    void cubeConnection.connect(mac).then(() => { console.info('[Timer Bluetooth] Timer connected successfully'); setStatus(''); }).catch((failure: Error) => {
      console.error('[Timer Bluetooth] Connection/setup failed', failure); setError(errorText(failure)); setStatus('');
      if (!bluetooth.current.connection) { engine.current?.disconnect(); finishRetry(); }
    }).finally(() => setConnecting(false));
  }

  async function disconnect() {
    cancelPreparation();
    await cubeConnection.disconnect().catch((failure: Error) => setError(errorText(failure)));
    engine.current?.disconnect(); finishRetry(); setDemo(false); setBattery(null);
  }

  async function calibrate() {
    const timer = engine.current; if (!timer || calibrating.current) return; setError('');
    cancelPreparation(); const token = generation.current;
    calibrating.current = true; setBusy(true);
    try {
      await bluetooth.current.calibrate();
      if (!mounted.current || token !== generation.current) return;
      timer.synchronize(SOLVED); await prepareScramble();
    }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Calibration failed.'); }
    finally { calibrating.current = false; if (mounted.current && !preparing.current) setBusy(false); }
  }

  function startDemo() { engine.current?.connect('Simulated 3x3'); setDemo(true); calibrate(); }
  function changeInspection(value: boolean) {
    setInspection(value);
    if (engine.current) engine.current.inspectionPenaltyEnabled = value;
    try { localStorage.setItem('timer-inspection', String(value)); }
    catch { setError('Penalty preference changed, but this browser could not save the preference.'); }
  }
  function changeSolve(solve: Solve) {
    if (engine.current?.result?.id === solve.id) engine.current.result = solve;
    record(solve, false);
    setReplay(solve);
    setAverage(null);
  }
  async function removeSolve(solve: Solve) { await writes.current; await deleteSolve(solve.id); }
  function retrySolve(solve: Solve) {
    const timer = engine.current;
    if (!timer || resynchronizing.current) return;
    if (timer.phase === 'solving') { setError('Finish or abort the current solve before retrying.'); return; }
    retry.current = { scramble: simplifyMoves(movesOf(solve.scramble)).join(' '), previousSession: retry.current?.previousSession ?? sessionRef.current };
    sessionRef.current = 'Retries'; setSession('Retries'); setReplay(null); setAverage(null); setError('');
    if (timer.phase === 'disconnected') timer.message = 'Connect your cube to retry this scramble.';
    else if (['recovery', 'recovering'].includes(timer.phase)) void resynchronize();
    else void prepareScramble();
  }
  function changeOverTurnPenalty(value: boolean) {
    setOverTurnPenalty(value);
    if (engine.current) engine.current.overTurnPenaltyEnabled = value;
    try { localStorage.setItem('timer-over-turn-penalty', String(value)); }
    catch { setError('Penalty preference changed, but this browser could not save the preference.'); }
  }
  function changeHiddenVisuals(value: HiddenVisuals) { setHiddenVisuals(value); try { localStorage.setItem('timer-hide-distracting-visuals', JSON.stringify(value)); } catch { setError('Visual preference changed, but this browser could not save the preference.'); } }
  function changeLongPbNotifications(value: boolean) {
    setShowEveryLongPb(value); showEveryLongPbRef.current = value;
    try { localStorage.setItem('timer-show-every-long-pb', String(value)); }
    catch { setError('PB notification preference changed, but this browser could not save the preference.'); }
  }

  async function resynchronize() {
    const timer = engine.current; if (!timer || resynchronizing.current) return;
    resynchronizing.current = true;
    timer.interrupt('Manual resynchronization.');
    timer.phase = 'synchronizing'; timer.message = 'Requesting a fresh physical cube state...'; render();
    try {
      if (demo) { timer.synchronize(timer.facelets); await prepareScramble(timer.result?.status === 'incomplete'); }
      else await bluetooth.current.refresh();
    } catch (failure) {
      finishRetry();
      timer.fail('Cube state could not be read. Try Read cube state again.', false);
      setError(failure instanceof Error ? failure.message : 'Cube state could not be read.');
    } finally { resynchronizing.current = false; }
  }

  async function importBackup(file?: File) {
    if (!file || !cube) return;
    try {
      const solves = validateBackup(await file.text(), cube);
      await writes.current;
      await saveSolves(solves);
      solves.forEach(solve => deletedSolves.current.delete(solve.id));
      recordChecks.current.forEach(check => clearTimeout(check.timeout)); recordChecks.current.clear(); setCelebrations([]);
      updateHistory((await readSolves()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setStorage('Saved locally'); setError('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Import failed.'); }
  }

  function exportHistory(format: 'json' | 'csv') {
    if (!cube) return;
    const active = engine.current?.active;
    const solves = active && !deletedSolves.current.has(active.id) ? [active, ...historyRef.current.filter(solve => solve.id !== active.id)] : historyRef.current;
    const url = URL.createObjectURL(new Blob([format === 'csv' ? cubeastCSV(solves, cube) : backupJSON(solves)], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `timer-${new Date().toISOString().slice(0, 10)}.${format}`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const timer = engine.current, solve = timer?.active ?? (timer?.result ? history.find(solve => solve.id === timer.result?.id) ?? null : history.find(solve => solve.status !== 'active')), elapsed = timer?.elapsed(performance.now()) ?? 0;
  const inspecting = inspection && timer?.phase === 'ready', inspectionTime = timer?.inspectionElapsed(performance.now()) ?? 0;
  const displayedTime = formatTime(inspecting ? inspectionTime : timer?.active ? elapsed : solve ? solveTime(solve) : elapsed, precision);
  const inspectionStatus = inspectionPenalty(inspectionTime);
  const message = status || timer?.message || 'Loading local puzzle tools...';
  const sessions = useMemo(() => [...new Set([...createdSessions, ...history.map(solve => solve.session)])], [createdSessions, history]);
  const sessionHistory = useMemo(() => history.filter(solve => solve.session === session && solve.status !== 'active'), [history, session]);
  const filtered = useMemo(() => latestSolves(sessionHistory, solveLimit, solve => Date.parse(solve.createdAt)).reverse(), [sessionHistory, solveLimit]);
  const recordHistory = useMemo(() => history.filter(solve => solve.status !== 'active' && solve.session !== 'Retries'), [history]);
  const previousStatistics = useMemo(() => sessionStats(recordHistory.slice(1, 1001)), [recordHistory]);
  const statistics = useMemo(() => sessionStats(recordHistory), [recordHistory]);
  const historyRows = useMemo(() => {
    const numbered = numberedSolves(allSessions ? history : sessionHistory);
    const rows = (solveLimit ? numbered.slice(-solveLimit) : numbered).map(({ solve, number }) => {
      const count = historySort.column === 'turns' || historySort.column === 'tps' ? turns(solve) : 0;
      return { solve, number, duration: solveTime(solve), turns: count, tps: solve.duration > 0 ? count * 1000 / solve.duration : null };
    });
    return rows.sort((a, b) => {
      const left = a[historySort.column], right = b[historySort.column];
      if (left === null || right === null) return left === right ? a.number - b.number : left === null ? 1 : -1;
      return (left - right) * (historySort.direction === 'ascending' ? 1 : -1) || a.number - b.number;
    });
  }, [sessionHistory, history, allSessions, historySort, solveLimit]);
  useEffect(() => setHistoryPage(0), [session, allSessions, historySort, solveLimit]);
  const page = Math.min(historyPage, Math.max(0, Math.ceil(historyRows.length / 100) - 1));
  const historyTable = useMemo(() => <div className="table-responsive"><table className="table align-middle history-table" aria-label="Solve history">
    <thead><tr>{historyColumns.map(column => <th key={column.key} scope="col" aria-sort={historySort.column === column.key ? historySort.direction : undefined}>
      <button className="history-sort" onClick={() => setHistorySort(current => ({
        column: column.key, direction: current.column === column.key && current.direction === 'ascending' ? 'descending' : 'ascending',
      }))}>{column.label}</button>
    </th>)}<th scope="col">Date</th></tr></thead>
    <tbody>{historyRows.slice(page * 100, (page + 1) * 100).map(({ solve, number }) => {
      const count = turns(solve), tps = solve.duration > 0 ? count * 1000 / solve.duration : null;
      return <tr key={solve.id}>
      <td><button className="history-cell" aria-label={`Solve ${number}: open replay`} onClick={() => setReplay(solve)}>{number}</button></td>
      <td><button className="history-cell history-time" aria-label={`Solve ${number}: ${formatTime(solveTime(solve), precision)}s, open replay`} onClick={() => setReplay(solve)}>{formatTime(solveTime(solve), precision)}s<SolvePenalty solve={solve} /></button></td>
      <td><button className="history-cell" aria-label={`Solve ${number}: ${count} turns, open replay`} onClick={() => setReplay(solve)}>{count}</button></td>
      <td><button className="history-cell" aria-label={`Solve ${number}: ${tps === null ? '--' : tps.toFixed(2)} TPS, open replay`} onClick={() => setReplay(solve)}>{tps === null ? '--' : tps.toFixed(2)}</button></td>
      <td><button className="history-cell" aria-label={`Solve ${number}: ${relativeTime(solve.createdAt, historyNow)}, open replay`} onClick={() => setReplay(solve)}><time dateTime={solve.createdAt} title={new Date(solve.createdAt).toLocaleString()}>{relativeTime(solve.createdAt, historyNow)}</time></button></td>
    </tr>; })}</tbody>
  </table></div>, [historyRows, historySort, precision, page, historyNow]);
  const recovering = timer?.phase === 'recovering';
  const setupCount = timer && !recovering ? timer.instructions.length - timer.scramble.trim().split(/\s+/).length : 0;
  const returning = recovering || (timer?.phase === 'scrambling' && timer.progress < setupCount);
  const displayedMoves = returning && timer ? timer.instructions.slice(0, recovering ? undefined : setupCount) : timer?.scramble && !preparing.current ? timer.scramble.split(/\s+/) : [];
  const displayedOffset = returning ? 0 : setupCount;
  const correctionMoves = timer?.phase === 'scrambling' || recovering ? timer.recovery : [];
  const showCorrections = correctionMoves.length > 0 && !preparing.current;
  const solving = timer?.phase === 'solving';
  const hideTimer = solving && hiddenVisuals.timer, hideCube = solving && hiddenVisuals.cube, hideProgressBar = solving && hiddenVisuals.progressBar;
  const allVisualsHidden = hiddenVisuals.timer && hiddenVisuals.cube && hiddenVisuals.progressBar;
  const someVisualsHidden = hiddenVisuals.timer || hiddenVisuals.cube || hiddenVisuals.progressBar;
  const currentMoveClass = timer?.isPartialTurn ? 'current partial' : 'current';
  const connected = timer && timer.phase !== 'disconnected';
  useEffect(() => { if (connected) setupDialog.current?.close(); }, [connected]);
  const canConnect = !!cube && !busy && !connecting && !sharedCube.connecting && !connected && !!navigator.bluetooth && window.isSecureContext;
  const simulate = (move: string) => receive({ type: 'MOVE', timestamp: performance.now(), move, face: 'URFDLB'.indexOf(move[0]), direction: move.endsWith("'") ? 1 : 0, localTimestamp: performance.now(), cubeTimestamp: null });
  return <div className="cuberplus-page">
    <header className="cuberplus-header">
      <Navigation current="timer" />
    </header>
    <main className="container py-4 timer-main">
    <div className="page-heading timer-toolbar">
      <h1 className="route-heading">Timer</h1>
      <div className="page-actions">
        <CubeButton connected={!!connected} open={() => setupDialog.current?.showModal()} />
        <PageOptionsButton open={() => optionsDialog.current?.showModal()} />
      </div>
    </div>
    <dialog ref={setupDialog} className="panel options-dialog" aria-labelledby="cube-setup-title">
      <div className="d-flex justify-content-between align-items-center mb-3"><h2 id="cube-setup-title" className="mb-0">Bluetooth cube setup</h2><button className="btn-close" aria-label="Close cube setup" onClick={() => setupDialog.current?.close()} /></div>
      <form onSubmit={event => { event.preventDefault(); if (canConnect) void connect(); }}>
      <div className="page-actions">
        <CubePicker disabled={!!connected || connecting || sharedCube.connecting} change={setMac} />
        {connected ? <button type="button" className="btn btn-outline-secondary" onClick={() => void disconnect()}>Disconnect</button> :
          <><button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={!canConnect}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M7 7l10 10-5 5V2l5 5L7 17" /></svg>{connecting || sharedCube.connecting ? 'Connecting...' : 'Connect cube'}</button>
          <button type="button" hidden className="btn btn-outline-secondary" disabled={!cube || busy || connecting} onClick={startDemo}>Try simulated cube</button></>}
        {(sharedCube.battery ?? battery) !== null && <span className="badge text-bg-secondary">{sharedCube.battery ?? battery}% battery</span>}
      </div>
      {connected ? <div className="d-grid gap-2 mt-3">
        <button type="button" className="btn btn-outline-secondary" disabled={busy || solving} onClick={() => { setupDialog.current?.close(); void resynchronize(); }}>Read cube state</button>
        <button type="button" className="btn btn-outline-secondary" disabled={busy || solving} onClick={() => { setupDialog.current?.close(); calibrate(); }}>Cube is physically solved - calibrate</button>
      </div> : <div className="mt-3"><label className="d-block">Bluetooth MAC (only if needed)<input className="form-control mt-2" placeholder="AA:BB:CC:DD:EE:FF" value={mac} disabled={connecting} onChange={event => setMac(event.target.value)} /></label><MacAddressHelp /></div>}
      </form>
      {error && <p role="alert" className="text-danger mt-3 mb-0">{error}</p>}
    </dialog>
    <dialog ref={optionsDialog} className="panel options-dialog" aria-labelledby="options-title">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 id="options-title" className="mb-0">Options</h2>
        <button className="btn-close" aria-label="Close options" onClick={() => optionsDialog.current?.close()} />
      </div>
      <SessionPicker value={session} sessions={sessions} disabled={!historyReady || changingSession || timer?.phase === 'solving' || !!retry.current} change={setSession} create={createSession} manage={manageSession} />
      <div className="d-flex align-items-center mt-3"><label className="form-check mb-0"><input type="checkbox" className="form-check-input" aria-describedby="all-session-history-help" checked={allSessions} onChange={event => {
        setAllSessions(event.target.checked);
        try { localStorage.setItem('timer-all-session-history', String(event.target.checked)); } catch { setError('History preference could not be saved in this browser.'); }
      }} /><span className="form-check-label">Show all sessions in history</span></label>
        <InfoTip id="all-session-history-help">Show saved solves from every session. New solves use the selected session; records always use all saved sessions.</InfoTip></div>
      <div className="d-flex align-items-center mt-3"><label className="form-check mb-0"><input type="checkbox" className="form-check-input" aria-describedby="inspection-help" checked={inspection} disabled={timer?.phase === 'solving'} onChange={event => changeInspection(event.target.checked)} /><span className="form-check-label">15-second inspection</span></label>
        <InfoTip id="inspection-help">Count up after scrambling. Starting at 15 seconds adds +2; starting at 17 seconds or later is DNF. +2 penalties stack.</InfoTip></div>
      <div className="d-flex align-items-center mt-3"><label className="form-check mb-0"><input type="checkbox" className="form-check-input" aria-describedby="over-turn-penalty-help" checked={overTurnPenalty} onChange={event => changeOverTurnPenalty(event.target.checked)} /><span className="form-check-label">Extra-turn +2 penalty</span></label>
        <InfoTip id="over-turn-penalty-help">Apply +2 for an extra turn within 0.5 seconds after finishing.</InfoTip></div>
      <FavoriteOptions cube={cube} history={history} />
      <div className="d-flex align-items-center mt-3"><label className="form-check mb-0"><input type="checkbox" className="form-check-input" aria-describedby="long-pb-notifications-help" checked={showEveryLongPb} onChange={event => changeLongPbNotifications(event.target.checked)} /><span className="form-check-label">Notify for every Ao100/Ao1000 PB</span></label>
        <InfoTip id="long-pb-notifications-help">When off, show each of these PB notifications at most once per day.</InfoTip></div>
      <details className="mt-3">
        <summary className="visuals-summary d-flex align-items-center gap-2">
          <input type="checkbox" className="form-check-input m-0" aria-labelledby="hide-visuals-title" aria-describedby="hide-visuals-help" checked={allVisualsHidden} ref={element => { if (element) element.indeterminate = someVisualsHidden && !allVisualsHidden; }} onClick={event => event.stopPropagation()} onChange={event => changeHiddenVisuals({ timer: event.target.checked, cube: event.target.checked, progressBar: event.target.checked })} />
          <span id="hide-visuals-title">Hide distracting visuals</span>
          <span onClick={event => event.preventDefault()}><InfoTip id="hide-visuals-help">Choose which visuals to hide while solving.</InfoTip></span>
        </summary>
        <fieldset className="mt-3 ms-3">
          <legend className="visually-hidden">Visuals hidden while solving</legend>
          <label className="form-check"><input type="checkbox" className="form-check-input" checked={hiddenVisuals.timer} onChange={event => changeHiddenVisuals({ ...hiddenVisuals, timer: event.target.checked })} /><span className="form-check-label">Timer</span></label>
          <label className="form-check"><input type="checkbox" className="form-check-input" checked={hiddenVisuals.cube} onChange={event => changeHiddenVisuals({ ...hiddenVisuals, cube: event.target.checked })} /><span className="form-check-label">Cube</span></label>
          <label className="form-check"><input type="checkbox" className="form-check-input" checked={hiddenVisuals.progressBar} onChange={event => changeHiddenVisuals({ ...hiddenVisuals, progressBar: event.target.checked })} /><span className="form-check-label">Progress bar</span></label>
        </fieldset>
      </details>
      {(error.startsWith('Visual preference changed') || error.startsWith('Penalty preference changed') || error.startsWith('PB notification preference changed')) && <p role="alert" className="text-warning mt-3 mb-0">{error}</p>}
    </dialog>
    {(!navigator.bluetooth || !window.isSecureContext) && <p className="alert alert-info">Bluetooth needs a supported browser and HTTPS or localhost. Try Chrome/Edge on Windows.</p>}
    {error && <div className="alert alert-danger d-flex justify-content-between" role="alert">{error}<button className="btn-close" aria-label="Dismiss error" onClick={() => setError('')} /></div>}
    {!['Saved locally', 'Saving locally...'].includes(storage) && <p className="text-secondary small mb-3">{storage}</p>}
    {!connected && <div className="alert alert-info timer-onboarding"><strong>Connect a smart cube to start timing.</strong><InfoTip>Choose a saved cube in Cube setup, connect, then follow the highlighted scramble. New cube? Add it in Options. Saved solves can be browsed without a connection.</InfoTip><button className="btn btn-primary" onClick={() => setupDialog.current?.showModal()}>Set up a cube</button></div>}
    <section className={`panel timer-panel ${!connected ? 'timer-disconnected ' : ''}${timer?.phase === 'ready' ? 'ready' : ''}`}>
      {retry.current && <p className="small text-secondary" role="status">Retry will be saved in Retries, then return to {retry.current.previousSession || 'Default'}.{' '}
        <button className="btn btn-sm btn-outline-secondary" disabled={busy || solving || resynchronizing.current} onClick={() => { finishRetry(); if (timer?.phase === 'disconnected') timer.message = 'Connect your cube to begin.'; else void prepareScramble(); }}>Cancel retry</button></p>}
      {recovering && <p className="small text-secondary mb-2">Return the cube to solved</p>}
      {returning && !recovering && <p className="small text-secondary mb-2">First solve the current cube</p>}
      <div className={`scramble mb-3${solving ? ' scramble-solving' : ''}`} aria-label="Scramble">
        <div className="scramble-content" aria-hidden={solving}>{timer && displayedMoves.length ? <span role="group" aria-label={returning ? 'Path to solved' : 'Original scramble'}>{displayedMoves.map((move, i) => correctionMoves.length && !timer.completed[i + displayedOffset] ? null :
          <span key={i} className={`move ${timer.completed[i + displayedOffset] ? 'done' : !correctionMoves.length && i + displayedOffset === timer.progress ? currentMoveClass : timer.isPartialMove(i + displayedOffset) ? 'partial' : ''}`} title={timer.isPartialMove(i + displayedOffset) ? 'Partially complete' : undefined}>{move}</span>)}</span>
          : !connected ? <span className="text-secondary">Connect a cube to generate a scramble.</span> : null}
        {showCorrections && <span role="group" aria-label="Correction moves">{correctionMoves.map((move, i) =>
          <span key={i} className={`move correction ${i === 0 ? 'current' : ''}`}>{move}</span>)}</span>}
        </div>
        {solving && <div className="scramble-placeholder text-secondary">
          <span role="status">Scrambles hidden while solving</span>
          <button className="btn btn-sm btn-outline-warning" onClick={() => { timer?.fail('Solve aborted by user.', true, 'solve aborted'); void prepareScramble(true); }}>Abort solve</button>
        </div>}
        <button className={`btn btn-sm btn-outline-secondary scramble-refresh${solving ? ' invisible' : ''}`} aria-label="New scramble" title="New scramble" aria-hidden={solving} disabled={busy || !timer || !['scrambling', 'ready', 'finished'].includes(timer.phase)} onClick={() => { finishRetry(); void prepareScramble(); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M20 6v5h-5M20 11a8 8 0 1 0-2.3 6.7" />
          </svg>
        </button>
      </div>
      <div className={`row g-3 align-items-center timer-hero${hideCube ? ' timer-hero--no-cube' : ''}`}><div className={hideCube ? 'col-12' : 'col-lg-7'}>
      {hideTimer ? <div className="solving-indicator" role="status" aria-label="Solving">
        <span>Solving</span><span className="solving-dots" aria-hidden="true"><span>...</span></span>
      </div> : <>
          <div className="timer-display d-flex align-items-center justify-content-center gap-3">
            <div className="timer-value" style={{ '--time-length': displayedTime.length } as CSSProperties} aria-label={inspecting ? 'Inspection time' : 'Solve time'}>{displayedTime}</div>
            {!inspecting && <SolvePenalty solve={solve} />}
          </div>
          <div className="timer-details">
            {inspecting && <p className={`small mb-0 ${inspectionStatus === 'DNF' ? 'text-danger' : 'text-warning'}`} aria-label="Inspection status">Inspection{inspectionStatus ? `: ${inspectionStatus === 'DNF' ? 'DNF' : '+2'}` : ''}</p>}
            {!(solve?.status === 'incomplete' && message === solve.reason) && !/^(?:Follow the highlighted|Wrong turn\.|Turn .+ once more to complete |Scramble complete\.)/.test(message) && <p className="small mb-0" role="status">{message}</p>}
          </div>
      </>}
      </div>{!hideCube && <div className="col-lg-5">
        {cube && timer && <CubeView cube={cube} facelets={timer.facelets} moves={timer.visualizationMoves} animateSeeks />}
      </div>}</div>
          {!hideProgressBar && cube && solve && <SolveTimeline compact cube={cube} solve={solve} history={history} elapsed={elapsed} precision={precision} open={solve.status === 'active' ? undefined : () => setReplay(history.find(item => item.id === solve.id) ?? solve)} />}
          {cube && solve && solve.status !== 'active' && <div className="timer-feedback"><SolveMistakes cube={cube} solve={solve} history={filtered} brief /></div>}
          {demo && <div className="demo mt-4">
            <p className="text-warning">Simulated cube - not a physical Bluetooth connection</p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              {[...'URFDLB'].flatMap(face => [face, face + "'"]).map(move => <button key={move} className="btn btn-secondary" disabled={busy || !timer || ['synchronizing', 'recovery'].includes(timer.phase)} onClick={() => simulate(move)}>{move}</button>)}
            </div>
            <button className="btn btn-outline-secondary mt-2" disabled={busy || !timer || !['scrambling', 'recovering'].includes(timer.phase)} onClick={() => { if (timer?.nextMove) simulate(timer.nextMove); }}>Perform guided move</button>
            <button className="btn btn-outline-secondary mt-2 ms-2" disabled={busy || !timer || timer.phase !== 'ready'} onClick={() => {
              if (timer?.phase !== 'ready') return;
              const token = generation.current;
              timer.scramble.split(/\s+/).reverse().map(inverse).forEach((move, i) => setTimeout(() => { if (token === generation.current && demo && ['ready', 'solving'].includes(timer.phase)) simulate(move); }, i * 150));
            }}>Simulate solve</button>
          </div>}
    </section>
    <div className="timer-summary mt-3">
    <section className="panel timer-records">
      <div className="table-responsive">
        <table className="table table-sm" aria-label="All-time statistics"><thead><tr><th scope="col">Metric <InfoTip>Records use all saved solves across all sessions, regardless of the recent-solves limit. Retry attempts do not count toward records.</InfoTip></th><th scope="col">Current</th><th scope="col">Best</th></tr></thead>
          <tbody>{statistics.map((stat, index) => <tr key={stat.name}><th scope="row">{stat.name}</th>
            {(['current', 'best'] as const).map(kind => <td key={kind}>{stat[kind] === null ? '--' :
              <button className="stat-link" aria-label={`View ${kind} ${stat.name}`} onClick={() => stat.name === 'Single'
                ? setReplay(recordHistory.find(solve => (solve.status === 'complete' ? solveTime(solve) : 'DNF') === stat[kind]) ?? null)
                : setAverage(averageDetails(recordHistory, Number(stat.name.slice(2)), kind === 'best'))}>{stat[kind] === 'DNF' ? 'DNF' : formatTime(stat[kind] as number, precision)}</button>}
              {kind === 'current' && <MetricTrend current={stat.current} previous={previousStatistics[index].current} />}
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    {!!filtered.length && <section className="panel timer-recent" aria-labelledby="timer-recent-title"><div className="timer-recent-heading"><h2 id="timer-recent-title">Recent solves</h2></div><div className="recent-times">
      {filtered.slice(0, 5).map(solve => {
        const time = solve.status === 'incomplete' ? 'DNF' : formatTime(solveTime(solve), precision);
        return <button key={solve.id} className="btn btn-outline-secondary" aria-label={`Open recent solve: ${time}${time === 'DNF' ? '' : ' seconds'}`} onClick={() => setReplay(solve)}><span style={{ '--time-length': time.length } as CSSProperties}>{time}</span></button>;
      })}
    </div></section>}
    </div>
    <section className="panel mt-3 timer-history" id="timer-history" aria-labelledby="timer-history-title">
      <div className="d-flex justify-content-between flex-wrap gap-2 mb-3"><h2 id="timer-history-title" className="h5">{allSessions ? 'All sessions' : session} history</h2><div className="d-flex gap-2">
        <button className="btn btn-outline-secondary" onClick={() => exportHistory('csv')}>Export CSV</button>
        <button hidden className="btn btn-outline-secondary" onClick={() => exportHistory('json')}>Export JSON</button>
        <label hidden className={`btn btn-outline-secondary mb-0 ${timer?.phase === 'solving' ? 'disabled' : ''}`}>Import JSON<input type="file" className="visually-hidden" accept=".json,application/json" disabled={timer?.phase === 'solving'} onChange={event => { void importBackup(event.target.files?.[0]); event.target.value = ''; }} /></label>
      </div></div>
      {historyTable}
      {!!historyRows.length && <nav className="history-pagination" aria-label="Solve history pages">
        <button className="btn btn-outline-secondary" disabled={page === 0} onClick={() => setHistoryPage(page - 1)}>Previous</button>
        <span role="status">{page * 100 + 1}–{Math.min((page + 1) * 100, historyRows.length)} of {historyRows.length.toLocaleString()} solves</span>
        <button className="btn btn-outline-secondary" disabled={(page + 1) * 100 >= historyRows.length} onClick={() => setHistoryPage(page + 1)}>Next</button>
      </nav>}
      {!historyRows.length && <p className="text-secondary">{allSessions ? 'No saved solves yet.' : 'No solves in this session yet.'} Your data stays on this device.</p>}
    </section>
    {average && <AverageDetails details={average} history={history} precision={precision} view={setReplay} close={() => setAverage(null)} />}
    {cube && replay && <Replay key={replay.id} cube={cube} solve={replay} history={history} precision={precision} change={changeSolve} remove={removeSolve} retry={retrySolve} retryDisabled={solving || resynchronizing.current} close={() => setReplay(null)} />}
    {(!!celebrations.length || !!streaks.length) && <div className="pb-notifications" aria-label="Solve notifications">
      {streaks.map(streak => <div key={streak.id} className="pb-celebration streak-celebration" role="status" aria-label="Daily streak">
        <div className="pb-open">
          <svg width="52" height="64" viewBox="0 0 64 80" aria-hidden="true" focusable="false">
            <g className="streak-flame">
              <path d="M32 5C39 22 52 25 50 39C55 36 57 30 57 30C64 49 53 72 32 72C10 72 0 52 9 35C9 45 17 46 18 36C19 23 30 19 32 5Z" fill="#ff8647" />
              <path d="M32 28C35 39 44 39 45 49C48 47 49 44 49 44C53 59 45 69 32 69C18 69 13 58 18 48C18 54 24 54 25 47C26 39 31 35 32 28Z" fill="#ffd05c" />
              <path d="M32 48C35 54 40 57 39 62C37 70 25 70 24 62C23 57 29 54 32 48Z" fill="#fff0b5" />
              <g fill="#3c2630"><circle cx="24" cy="51" r="2.5" /><circle cx="40" cy="51" r="2.5" /></g>
              <g fill="#f28573"><ellipse cx="19" cy="56" rx="3" ry="1.5" /><ellipse cx="45" cy="56" rx="3" ry="1.5" /></g>
              <path d="M28 57Q32 62 36 57" fill="none" stroke="#3c2630" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g className="streak-embers" fill="#ffd05c"><circle cx="12" cy="24" r="2" /><circle cx="51" cy="16" r="2" /><circle cx="43" cy="7" r="1.5" /></g>
          </svg>
          <span><strong>Congratulations!</strong>
            <span className="d-block">Daily Streak: {streak.current}</span>
            <span className="d-block">Best Streak: {streak.best}</span>
          </span>
        </div>
        <button className="btn btn-sm btn-outline-light pb-dismiss" aria-label="Dismiss daily streak"
          onClick={() => setStreaks(current => current.filter(item => item.id !== streak.id))}>Dismiss</button>
      </div>)}
      {celebrations.map(celebration => <div key={celebration.id} className="pb-celebration" role="status" aria-label="Personal best">
      <button className="pb-open" aria-label={`View PB ${celebration.name}`} onClick={() => {
        if (celebration.average) setAverage(celebration.average);
        else setReplay(celebration.solve);
      }}>
      <svg width="52" height="64" viewBox="0 0 64 80" aria-hidden="true" focusable="false">
        <defs><pattern id={`pb-disco-tiles-${celebration.id}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 0h12v12H0z" fill="#c8ddf5" /><path d="M0 0h6v6H0zM6 6h6v6H6z" fill="#7d8dba" />
          <path d="M0 6h6v6H0z" fill="#b695ef" /><path d="M0 0h12v12H0zM6 0v12M0 6h12" fill="none" stroke="#181f2d" strokeWidth="0.7" />
        </pattern></defs>
        <path d="M32 0v16" stroke="#c8ddf5" strokeWidth="2" />
        <g className="pb-disco-ball"><circle cx="32" cy="40" r="24" fill={`url(#pb-disco-tiles-${celebration.id})`} stroke="#e8edf5" />
          <path d="M21 20c-7 12-7 28 0 40M43 20c7 12 7 28 0 40" fill="none" stroke="#e8edf5" opacity="0.6" /></g>
        <path className="pb-sparkles" d="M9 12v10M4 17h10M56 59v10M51 64h10" fill="none" stroke="#f5b942" strokeWidth="2" />
      </svg>
      <span><strong>New personal best!</strong>
        <span className="d-block">{celebration.name}: {formatTime(celebration.time, precision)}s</span>
      </span>
      </button>
      <button className="btn btn-sm btn-outline-light pb-dismiss" aria-label="Dismiss personal best"
        onClick={() => setCelebrations(current => current.filter(item => item.id !== celebration.id))}>Dismiss</button>
    </div>)}</div>}
    </main>
    <Footer />
  </div>;
}
export function MetricTrend({ current, previous }: { current: number | 'DNF' | null; previous: number | 'DNF' | null }) {
  if (current === null || previous === null) return null;
  const now = current === 'DNF' ? Infinity : current, before = previous === 'DNF' ? Infinity : previous;
  const direction = now < before ? 'faster' : now > before ? 'slower' : 'equal';
  return <svg className={`metric-trend metric-trend--${direction}`} viewBox="0 0 16 16" role="img" aria-label={`${direction === 'equal' ? 'Equal to' : direction === 'faster' ? 'Faster than' : 'Slower than'} previous`}>
    <path d={direction === 'faster' ? 'M1 3h14L8 13Z' : direction === 'slower' ? 'M1 13h14L8 3Z' : 'M1 6h14v4H1Z'} />
  </svg>;
}
