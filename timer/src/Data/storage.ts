import { getDnfReason, getPenaltyReasons, solveTime, type Solve } from '../Core/engine';
import { Cube, isMove, movesOf } from '../Core/puzzle';
import { analyzeCFOP, CFOP_STEPS, cfopFrame, cfopTiming, elapsedAt, f2lPair } from '../Analysis/cfop';
import { movingAverages } from '../../../shared/statistics/averages';
import { calendarDay, streakWindows } from '../../../shared/statistics/streaks';
import { validImported } from './csvImport';
import { analysisKey } from '../Analysis/analysis';
import type { KPattern, KTransformation } from 'cubing/kpuzzle';

const database = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open('smart-cube-timer', 2);
  request.onupgradeneeded = event => {
    if (event.oldVersion === 0) request.result.createObjectStore('solves', { keyPath: 'id' });
    else {
      const requestCursor = request.transaction!.objectStore('solves').openCursor();
      requestCursor.onsuccess = () => {
        const cursor = requestCursor.result;
        if (!cursor) return;
        const solve = cursor.value as Solve;
        if ('orientations' in solve) { Reflect.deleteProperty(solve, 'orientations'); cursor.update(solve); }
        cursor.continue();
      };
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('Cannot open local storage.'));
});

async function withSolves<T>(mode: 'readonly' | 'readwrite', action: (store: IDBObjectStore) => T, failure: string): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction('solves', mode);
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error(failure));
      try {
        const result = action(tx.objectStore('solves'));
        tx.oncomplete = () => resolve(result);
      } catch (failure) { tx.abort(); reject(failure); }
    });
  } finally { db.close(); }
}
export function saveSolves(solves: Solve[], derivedOnly: boolean | 'reanalysis' = false): Promise<void> {
  return withSolves('readwrite', store => solves.forEach(solve => {
    if (!derivedOnly) { store.put(solve); return; }
    const request = store.get(solve.id);
    request.onsuccess = () => {
      const current = request.result as Solve | undefined;
      if (current && analysisKey(current) === solve.analysis?.key) store.put({ ...current, analysis: solve.analysis, cfop: solve.cfop ?? current.cfop,
        ...(derivedOnly === 'reanalysis' ? { imported: solve.imported } : {}) });
    };
  }), 'Local save failed.');
}

export function readSolves(batchSize?: number): Promise<Solve[]> {
  return withSolves('readonly', store => {
    const solves: Solve[] = [];
    const next = (after?: string) => {
      const request = store.getAll(after === undefined ? undefined : IDBKeyRange.lowerBound(after, true), batchSize);
      request.onsuccess = () => {
        const items = request.result as Solve[];
        for (const solve of items) solves.push(solve);
        if (batchSize && items.length === batchSize) next(items.at(-1)!.id);
      };
    };
    next();
    return solves;
  }, 'Cannot read local solves.');
}
export async function readSolveIds(): Promise<string[]> {
  const request = await withSolves('readonly', store => store.getAllKeys(), 'Cannot read local solve IDs.');
  return request.result as string[];
}
export async function recoverLocalSolves(cube: Cube, current?: (id: string) => boolean): Promise<Solve[]> {
  const solves = await readSolves(100), active = solves.filter(solve => solve.status === 'active' && !current?.(solve.id));
  if (!active.length) return solves;
  const recovered = validateBackupData(backupData(active), cube);
  await saveSolves(recovered);
  const byId = new Map(recovered.map(solve => [solve.id, solve]));
  return solves.map(solve => byId.get(solve.id) ?? solve);
}

export async function deleteSolve(id: string): Promise<void> {
  await withSolves('readwrite', store => store.delete(id), 'Cannot delete local solve.');
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('timer-solve-deleted', { detail: id }));
}

export async function updateSession(ids: string[], name: string | null): Promise<void> {
  if (!ids.length) return;
  await withSolves('readwrite', store => ids.forEach(id => {
    if (name === null) { store.delete(id); return; }
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result) store.put({ ...request.result as Solve, session: name });
    };
  }), 'Session changes could not be saved.');
  if (name === null && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('timer-solve-deleted', { detail: ids }));
  }
}

const finite = (n: number): boolean => typeof n === 'number' && Number.isFinite(n);
const text = (s: string, max = 1000): boolean => typeof s === 'string' && s.length <= max;
const solveTextFields = [['id', 100], ['device', 200], ['createdAt', 100], ['scramble', 1000], ['startFacelets', 54], ['reason', 1000]] as const;

// Compact tuples retain the raw data without repeating field names per sample.
type BackupTurn = [move: string, elapsed: number, hostTime: number, localTimestamp: number | null, cubeTimestamp: number | null, serial?: number];
type BackupSolve = Omit<Solve, 'moves' | 'analysis' | 'cfop'> & { moves: BackupTurn[] };
export type BackupEnvelope = { format: string; solves: { id: string }[] };

function unpackSolve(solve: BackupSolve): Solve {
  if (!solve || typeof solve !== 'object' || !Array.isArray(solve.moves)) throw new Error('Invalid solve record in backup.');
  return {
    ...solve,
    moves: solve.moves.map(turn => {
      if (!Array.isArray(turn) || (turn.length !== 5 && turn.length !== 6)) throw new Error('Invalid move timeline.');
      const [move, elapsed, hostTime, localTimestamp, cubeTimestamp, serial] = turn;
      return { move, elapsed, hostTime, localTimestamp, cubeTimestamp, ...(turn.length === 6 ? { serial } : {}) };
    }),
  };
}

export const validateBackup = (json: string, cube: Cube): Solve[] => validateBackupData(JSON.parse(json) as BackupEnvelope, cube);
export function validateBackupData(value: BackupEnvelope, cube: Cube): Solve[] {
  const backup = value as { format: 'timer-v1'; solves: Solve[] } | { format: 'timer-v2'; solves: BackupSolve[] };
  if (!backup || typeof backup !== 'object' || !['timer-v1', 'timer-v2'].includes(backup.format) || !Array.isArray(backup.solves)) throw new Error('Not a Timer JSON backup.');
  const solves = backup.format === 'timer-v2' ? backup.solves.map(unpackSolve) : backup.solves.map(solve => ({ ...solve }));
  const ids = new Set<string>();
  const transformations = new Map<string, KTransformation>();
  const apply = (pattern: KPattern, algorithm: string): KPattern => {
    let transformation = transformations.get(algorithm);
    if (!transformation) {
      transformation = cube.puzzle.algToTransformation(algorithm);
      if (transformations.size >= 256) transformations.delete(transformations.keys().next().value!);
      transformations.set(algorithm, transformation);
    }
    return pattern.applyTransformation(transformation);
  };
  return solves.map(solve => {
    if (!solve || typeof solve !== 'object' || solve.version !== 1 ||
        !solveTextFields.every(([key, max]) => text(solve[key], max)) || !solve.id || ids.has(solve.id) ||
        !text(solve.session, / - (Acubemy|Cubeast)$/.test(solve.session) ? 110 : 100) ||
        (solve.appVersion !== undefined && !text(solve.appVersion, 100)) ||
        !Number.isFinite(Date.parse(solve.createdAt)) ||
        (!solve.imported && (!movesOf(solve.scramble).length || movesOf(solve.scramble).some(move => !isMove(move)))) ||
        !finite(solve.duration) || solve.duration < 0 ||
        (solve.inspection !== undefined && (!finite(solve.inspection) || solve.inspection < 0)) ||
        (solve.penalty !== undefined && (!finite(solve.penalty) || solve.penalty <= 0)) ||
        (solve.penaltyReason !== undefined && (!text(solve.penaltyReason, 100) || !solve.penalty)) ||
        (solve.dnfReason !== undefined && (!['solve interrupted', 'solve aborted', 'inspection', 'manual'].includes(solve.dnfReason) ||
          solve.status === 'complete' || (solve.status === 'active' && solve.dnfReason !== 'inspection'))) ||
        !['active', 'complete', 'incomplete'].includes(solve.status) ||
        !['host', 'device-fit'].includes(solve.timingBasis) ||
        (solve.crossOverride !== undefined && (!Number.isInteger(solve.crossOverride) || solve.crossOverride < 0 || solve.crossOverride > 5)) ||
        !Array.isArray(solve.moves)) throw new Error('Invalid solve record in backup.');
    const reasons = getPenaltyReasons(solve);
    if (reasons.some(reason => !['over-turn', 'inspection', 'manual'].includes(reason)) || new Set(reasons).size !== reasons.length ||
        reasons.length * 2000 !== (solve.penalty ?? 0)) throw new Error('Invalid solve record in backup.');
    ids.add(solve.id);
    // Older backups may contain caches; derive them lazily from the preserved recording/source.
    delete solve.analysis; delete solve.cfop;
    if (solve.imported) {
      if (!validImported(solve)) throw new Error('Invalid imported solve record in backup.');
      if (!solve.moves.length) return { ...solve };
    }
    const pattern = cube.parse(solve.startFacelets);
    if (!cube.equals(pattern, apply(cube.solved(), solve.scramble))) throw new Error('Solve start does not match its scramble.');
    solve.moves.forEach((move, i) => {
      if (!move || typeof move !== 'object' || !text(move.move, 3) || !isMove(move.move) ||
          !finite(move.hostTime) || !finite(move.elapsed) || move.elapsed < 0 ||
          (move.localTimestamp !== null && !finite(move.localTimestamp)) ||
          (move.cubeTimestamp !== null && !finite(move.cubeTimestamp)) ||
          (move.serial !== undefined && (!Number.isInteger(move.serial) || move.serial < 0)) ||
          (i === 0 ? !solve.imported && move.elapsed !== 0 : move.elapsed < solve.moves[i - 1].elapsed) ||
          (solve.imported && move.elapsed > solve.duration + 1)) throw new Error('Invalid move timeline.');
    });
    if ((solve.status === 'complete' || solve.dnfReason === 'manual') && (!solve.moves.length || !cube.isSolved(apply(pattern, solve.moves.map(move => move.move).join(' '))))) throw new Error('Completed solve does not end solved.');
    const restored: Solve = solve.status === 'active' ? { ...solve, status: 'incomplete', reason: 'Interrupted attempt recovered from backup.', dnfReason: solve.dnfReason ?? 'solve interrupted' } : { ...solve };
    Reflect.deleteProperty(restored, 'orientations');
    if (restored.penalty === 2000) restored.penaltyReason ??= 'over-turn';
    if (restored.status === 'incomplete') restored.dnfReason = getDnfReason(restored);
    return restored;
  });
}

export const backupData = (solves: Solve[]) => ({
  format: 'timer-v2',
  solves: solves.map(({ version, appVersion, id, session, createdAt, device, scramble, startFacelets, duration, inspection, penalty, penaltyReason, dnfReason, status, reason, timingBasis, moves, imported, crossOverride }): BackupSolve => ({
    version, appVersion, id, session, createdAt, device, scramble, startFacelets, duration, inspection, penalty, penaltyReason, dnfReason, status, reason, timingBasis, imported, crossOverride,
    moves: moves.map(({ move, elapsed, hostTime, localTimestamp, cubeTimestamp, serial }): BackupTurn =>
      serial === undefined ? [move, elapsed, hostTime, localTimestamp, cubeTimestamp] : [move, elapsed, hostTime, localTimestamp, cubeTimestamp, serial]),
  })),
});
export const backupJSON = (solves: Solve[], settings?: Record<string, string | null | undefined>): string =>
  JSON.stringify({ ...backupData(solves), ...(settings === undefined ? {} : { settings }) });
// Ignore sub-nanosecond rounding noise in rolling sums.
const improves = (time: number, best: number | null): boolean => best === null || time < best - 1e-6;
const averageValue = (solve: Solve): number => solve.status === 'complete' ? solveTime(solve) : Infinity;
const averageResult = (time: number | null): number | 'DNF' | null => time === Infinity ? 'DNF' : time;
function rollingAverages(values: number[], count: number): { current: number | null; best: number | null; bestStart: number } {
  if (values.length < count || count < 3) return { current: null, best: null, bestStart: 0 };
  const averages = movingAverages(values, count);
  let bestStart = 0;
  averages.forEach((time, index) => { if (improves(time, averages[bestStart])) bestStart = index; });
  return { current: averages[0], best: averages[bestStart], bestStart };
}
export const average = (solves: Solve[], count: number): number | 'DNF' | null => averageResult(rollingAverages(solves.filter(s => s.status !== 'active').slice(0, count).map(averageValue), count).current);
export function numberedSolves(solves: Solve[]): { solve: Solve; number: number }[] {
  return solves.filter(solve => solve.status !== 'active').map(solve => ({ solve, date: Date.parse(solve.createdAt) }))
    .sort((a, b) => a.date - b.date || a.solve.id.localeCompare(b.solve.id))
    .map(({ solve }, index) => ({ solve, number: index + 1 }));
}
export function averageDetails(solves: Solve[], count: number, best = false): {
  time: number | 'DNF'; solves: { solve: Solve; trimmed: 'best' | 'worst' | null }[];
} | null {
  const finished = solves.filter(solve => solve.status !== 'active' && (!best || solve.session !== 'Retries'));
  const stats = rollingAverages((best ? finished : finished.slice(0, count)).map(averageValue), count);
  if (stats.current === null) return null;
  const start = best ? stats.bestStart : 0, window = finished.slice(start, start + count);
  const ranked = window.map((solve, index) => ({ index, time: averageValue(solve) })).sort((a, b) => a.time - b.time || a.index - b.index);
  const trim = Math.ceil(count / 20), trimmed = new Map<number, 'best' | 'worst'>();
  ranked.slice(0, trim).forEach(item => trimmed.set(item.index, 'best'));
  ranked.slice(-trim).forEach(item => trimmed.set(item.index, 'worst'));
  return {
    time: average(window, count)!,
    solves: window.map((solve, index) => ({ solve, trimmed: trimmed.get(index) ?? null })).reverse(),
  };
}
export function sessionStats(solves: Solve[]): { name: string; current: number | 'DNF' | null; best: number | 'DNF' | null }[] {
  const finished = solves.filter(s => s.status !== 'active'), values = finished.map(averageValue), latest = finished[0];
  const records = finished.every(solve => solve.session !== 'Retries') ? values : finished.filter(solve => solve.session !== 'Retries').map(averageValue);
  return [
    { name: 'Single', current: !latest ? null : latest.status === 'complete' ? solveTime(latest) : 'DNF', best: averageResult(records.length ? records.reduce((best, value) => Math.min(best, value), Infinity) : null) },
    ...[5, 12, 100, 1000].map(count => {
      const { current, best } = rollingAverages(values, count);
      return { name: `Ao${count}`, current: averageResult(current), best: averageResult(records === values ? best : rollingAverages(records, count).best) };
    }),
  ];
}
export function newPersonalBests(previous: Solve[], solve: Solve): { name: string; time: number }[] {
  if (solve.status === 'active' || solve.session === 'Retries') return [];
  const session = previous.filter(item => item.session !== 'Retries' && item.id !== solve.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const before = sessionStats(session), finished = [solve, ...session.filter(item => item.status !== 'active')];
  const current = [solve.status === 'complete' ? solveTime(solve) : 'DNF', ...[5, 12, 100, 1000].map(count => average(finished.slice(0, count), count))];
  return before.flatMap((stat, i) => {
    const time = current[i];
    return typeof time === 'number' && improves(time, typeof stat.best === 'number' ? stat.best : null) ? [{ name: stat.name, time }] : [];
  });
}
export function personalBestNotifications(records: ReturnType<typeof newPersonalBests>, shown: Set<string>, showEveryLongPb = false): ReturnType<typeof newPersonalBests> {
  return records.filter(record => {
    if (record.name !== 'Ao100' && record.name !== 'Ao1000') return true;
    if (shown.has(record.name) && !showEveryLongPb) return false;
    shown.add(record.name);
    return true;
  });
}
export const solveEndDate = (solve: Solve): Date => new Date(solve.imported?.endDate ?? Date.parse(solve.createdAt) + (solve.moves.at(-1)?.elapsed ?? solve.duration));
export function dailyStreak(solves: Solve[], date = new Date()): { current: number; best: number; hasToday: boolean } {
  const today = calendarDay(date), days = solves.filter(solve => solve.status !== 'active').map(solve => calendarDay(solveEndDate(solve)));
  const { current, best } = streakWindows(days, today);
  return { current: current.length, best: best.length, hasToday: days.includes(today) };
}
export const turns = (solve: Solve): number => solve.imported?.turns ?? solve.moves.reduce((n, move) => n + (move.move.includes('2') ? 2 : 1), 0);
export const formatTime = (milliseconds: number, precision: 2 | 3 = 2): string => (milliseconds / 1000).toFixed(precision);

const cubeastColumns = 'id,date,dnf,time,solving_method,device_name,device_model,device_color_scheme,user,one_turn_away_two_second_penalty,inspection_two_second_penalty,inspection_time,timer_time,missing_turn,solution,timer,description,session_name,session_ruleset,scramble,scramble_provider,ruleset,share_views,share_likes,share_comments,analysis_version,solution_rotation,pickup_time,putdown_time,solving_time,slice_turns,face_turns,quarter_turns,turns_per_second,total_recognition_time,total_execution_time,turns_after_solution,steps_skipped'.split(',').concat(
  Array.from({ length: 9 }, (_, i) => 'name,moves,recorded_moves,skipped,has_turns,time,recognition_time,execution_time,cumulative_time,slice_turns,face_turns,quarter_turns,turns_per_second'.split(',').map(field => `step_${i}_${field}`)).flat(),
  Array.from({ length: 9 }, (_, i) => `step_${i}_case`),
  'first_f2l_pair', 'manual_two_second_penalty', 'penalty_reason', 'dnf_reason', 'cuberplus_version', 'solve_end_date', 'cuberplus_source',
);
const csvCell = (value: string | number | boolean): string => /[",\r\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value);
export function cubeastCSV(solves: Solve[], cube: Cube): string {
  const rows = solves.filter(solve => solve.status !== 'active').map(solve => {
    const duration = solve.status === 'complete' ? Math.round(solve.duration) : '', penalties = getPenaltyReasons(solve);
    const analysis = analyzeCFOP(solve, cube), frame = cfopFrame(cube, analysis.cross ?? 3);
    const values: Record<string, string | number | boolean> = {
      id: solve.id, cuberplus_version: solve.appVersion ?? '', date: new Date(solve.createdAt).toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
      solve_end_date: solveEndDate(solve).toISOString(),
      dnf: solve.status !== 'complete', time: solve.status === 'complete' ? Math.round(solveTime(solve)) : '', timer_time: duration, solving_time: duration,
      one_turn_away_two_second_penalty: penalties.includes('over-turn'), inspection_two_second_penalty: penalties.includes('inspection'),
      manual_two_second_penalty: penalties.includes('manual'), penalty_reason: penalties.join(', '), dnf_reason: solve.status === 'incomplete' ? getDnfReason(solve) : '',
      inspection_time: solve.inspection === undefined ? '' : Math.round(solve.inspection),
      device_name: solve.device, session_name: solve.session, scramble: solve.scramble, scramble_provider: 'random_state',
      first_f2l_pair: f2lPair(analysis.pairs[0], analysis.cross),
      solution: solve.moves.map((move, i) => `${move.move}[${Math.round(elapsedAt(solve, i + 1))}]`).join(' '),
      timer: 'cube', solving_method: 'CFOP', solution_rotation: analysis.cross === null ? '' : ['DB', 'LU', 'BU', 'UF', 'RU', 'FU'][analysis.cross], description: solve.reason, slice_turns: solve.moves.length, face_turns: solve.moves.length,
      quarter_turns: turns(solve), turns_per_second: solve.duration > 0 ? (solve.moves.length * 1000 / solve.duration).toFixed(2) : '',
    };
    if (solve.imported) {
      const data = solve.imported;
      Object.assign(values, { id: data.rawSourceId || data.id, cuberplus_source: data.source, solving_method: data.method,
        time: Math.round(solveTime(solve)), timer_time: Math.round(solve.duration), solving_time: Math.round(solve.duration),
        quarter_turns: data.turns, face_turns: data.turns, slice_turns: data.turns, turns_per_second: data.tps,
        total_recognition_time: data.recognitionTime * 1000, total_execution_time: data.executionTime * 1000, first_f2l_pair: data.firstF2LPair ?? '' });
      let cumulative = 0;
      data.steps.forEach((step, i) => {
        cumulative += step.time * 1000;
        Object.entries({ name: step.name, moves: step.moves, case: step.case, time: step.time * 1000, recognition_time: step.recognitionTime * 1000,
          execution_time: step.executionTime * 1000, cumulative_time: cumulative, slice_turns: step.turns, face_turns: step.turns, quarter_turns: step.turns,
          turns_per_second: step.tps, skipped: !step.time && !step.turns, has_turns: step.turns > 0 }).forEach(([field, value]) => { values[`step_${i}_${field}`] = value; });
      });
    } else CFOP_STEPS.forEach((name, i) => {
      const start = analysis.ends[i - 1] ?? 0, end = analysis.ends[i];
      values[`step_${i}_name`] = name; if (end === undefined) return;
      const moves = solve.moves.slice(start, end), { end: cumulative, time, recognition, execution } = cfopTiming(solve, analysis.ends, i);
      const step: Record<string, string | number | boolean> = {
        moves: moves.map(move => frame(move.move)).join(' '), recorded_moves: moves.map((move, j) => `${frame(move.move)}[${Math.round(elapsedAt(solve, start + j + 1))}]`).join(' '),
        case: analysis.cases[i], skipped: start === end, has_turns: moves.length > 0, time, cumulative_time: cumulative,
        recognition_time: recognition, execution_time: execution, slice_turns: moves.length, face_turns: moves.length,
        quarter_turns: turns({ ...solve, moves }), turns_per_second: time > 0 ? (moves.length * 1000 / time).toFixed(2) : '',
      };
      Object.entries(step).forEach(([field, value]) => { values[`step_${i}_${field}`] = value; });
    });
    values['steps_skipped'] = solve.imported ? solve.imported.steps.filter(step => !step.time && !step.turns).length : analysis.ends.filter((end, i) => end === (analysis.ends[i - 1] ?? 0)).length;
    if (!solve.imported) {
      values['total_recognition_time'] = analysis.ends.reduce((sum, _, i) => sum + Number(values[`step_${i}_recognition_time`]), 0);
      values['total_execution_time'] = analysis.ends.reduce((sum, _, i) => sum + Number(values[`step_${i}_execution_time`]), 0);
    }
    return cubeastColumns.map(column => csvCell(values[column] ?? '')).join(',');
  });
  return [cubeastColumns.join(','), ...rows, ''].join('\r\n');
}
