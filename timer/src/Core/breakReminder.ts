import type { Solve } from './engine';
import type { BackupValue } from '../../../src/cloud/backupSettings';

export const BREAK_SETTINGS = 'timer-break-settings';
export const BREAK_ACTIVE = 'timer-break-active';
export const BREAK_CHANGED = 'timer-break-changed';
export const breakDefaults = {
  enabled: false, drills: true, minutes: 2, graceEnabled: true, graceMinutes: 10,
  singleMultiplier: 2, streakWindow: 100, streakCount: 5, streakPercent: 20,
};
export type BreakSettings = typeof breakDefaults;
export type TimerBreak = { until: number; solveId: string; reason: string };
export const breakRanges = {
  minutes: [0.1, 120],
  graceMinutes: [0, 120],
  singleMultiplier: [1.1, 10], streakWindow: [1, 1000], streakCount: [2, 100], streakPercent: [1, 500],
} as const;
export function validBreakSettings(value: BackupValue | undefined): value is BreakSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as BreakSettings;
  return typeof settings.enabled === 'boolean' && typeof settings.drills === 'boolean' &&
    (settings.graceEnabled === undefined || typeof settings.graceEnabled === 'boolean') &&
    Object.entries(breakRanges).every(([key, [min, max]]) => {
      const number = settings[key as keyof typeof breakRanges];
      return key === 'graceMinutes' && number === undefined || Number.isFinite(number) && number >= min && number <= max &&
        (['minutes', 'graceMinutes', 'singleMultiplier', 'streakPercent'].includes(key) || Number.isInteger(number));
    });
}
export function readBreakSettings(): BreakSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(BREAK_SETTINGS) ?? 'null') as Partial<BreakSettings> | null;
    return validBreakSettings(saved) ? { ...breakDefaults, ...saved } : { ...breakDefaults };
  } catch { return { ...breakDefaults }; }
}
export function readTimerBreak(now = Date.now()): TimerBreak | null {
  try {
    const saved = JSON.parse(localStorage.getItem(BREAK_ACTIVE) ?? 'null') as TimerBreak | null;
    return saved && Number.isFinite(saved.until) && saved.until > now &&
      typeof saved.solveId === 'string' && typeof saved.reason === 'string' ? saved : null;
  } catch { return null; }
}
export function writeBreakSettings(settings: BreakSettings): void {
  if (!validBreakSettings(settings)) throw new Error('Choose valid break reminder settings.');
  localStorage.setItem(BREAK_SETTINGS, JSON.stringify(settings));
  if (!settings.enabled) localStorage.removeItem(BREAK_ACTIVE);
  window.dispatchEvent(new Event(BREAK_CHANGED));
}
export function breakReason(solve: Solve, history: Solve[], settings: BreakSettings, sessionStartedAt?: number, now = Date.now()): string | null {
  if (!settings.enabled || solve.status !== 'complete' || solve.session === 'Retries' ||
      settings.graceEnabled && sessionStartedAt !== undefined && now - sessionStartedAt < settings.graceMinutes * 60000 ||
      history.some(previous => previous.id === solve.id && previous.status !== 'active')) return null;
  const previous = history.filter(item => item.id !== solve.id && item.session === solve.session && item.status === 'complete')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (previous.length < settings.streakWindow) return null;
  const solveTime = (item: Solve) => item.duration + (item.penalty ?? 0);
  const mean = (solves: Solve[]) => solves.reduce((sum, item) => sum + solveTime(item), 0) / solves.length;
  const singleAverage = mean(previous.slice(0, settings.streakWindow));
  if (singleAverage > 0 && solveTime(solve) >= singleAverage * settings.singleMultiplier) {
    return `This solve was at least ${settings.singleMultiplier} times your prior-${settings.streakWindow} average.`;
  }
  const recent = [solve, ...previous.slice(0, settings.streakCount - 1)];
  if (previous.length < settings.streakWindow + settings.streakCount - 1) return null;
  if (recent.every((item, index) => {
    const baseline = mean(previous.slice(index, index + settings.streakWindow));
    return baseline > 0 && solveTime(item) >= baseline * (1 + settings.streakPercent / 100);
  })) return `${settings.streakCount} consecutive solves were at least ${settings.streakPercent}% slower than their prior-${settings.streakWindow} averages.`;
  return null;
}
