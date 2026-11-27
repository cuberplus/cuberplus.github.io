/** @jest-environment jsdom */
import { breakDefaults, breakReason, BREAK_ACTIVE, BREAK_SETTINGS, readBreakSettings, readTimerBreak, validBreakSettings, writeBreakSettings } from '../../timer/src/Core/breakReminder';
import type { Solve } from '../../timer/src/Core/engine';

const settings = { ...breakDefaults, enabled: true };
const solve = (index: number, duration = 10000, session = 'Default'): Solve => ({
  version: 1, id: String(index), session, createdAt: new Date(index * 100000).toISOString(),
  device: 'test', scramble: 'R', startFacelets: '', duration, status: 'complete',
  reason: '', timingBasis: 'host', moves: [],
});
const history = (count = 100) => Array.from({ length: count }, (_, index) => solve(index));
beforeEach(() => localStorage.clear());
test('reminders default off and require 100 prior completed solves in the same session', () => {
  expect(readBreakSettings().enabled).toBe(false);
  expect(breakReason(solve(100, 50000), history(), breakDefaults)).toBeNull();
  expect(breakReason(solve(100, 50000), history(99), settings)).toBeNull();
  expect(breakReason(solve(100, 50000, 'Other'), history(), settings)).toBeNull();
  expect(breakReason(solve(100, 50000, 'Retries'), history().map(item => ({ ...item, session: 'Retries' })), settings)).toBeNull();
  expect(breakReason(solve(100, 50000), history().map(item => ({ ...item, status: 'incomplete' })), settings)).toBeNull();
});
test('single-solve trigger uses the shared prior-100 window, excludes the current solve, and honors the exact 2x boundary', () => {
  expect(breakReason(solve(100, 19999), history(), settings)).toBeNull();
  expect(breakReason(solve(100, 20000), history(), settings)).toContain('2 times your prior-100 average');
  const recent = [...history(88).map(item => ({ ...item, duration: 100000 })), ...history(12).map((_, index) => solve(88 + index))];
  expect(breakReason(solve(100, 20000), recent, settings)).toBeNull();
  expect(breakReason(solve(100, 20000), [...history(), solve(100, 20000)], settings)).toBeNull();
});
test('a streak compares each solve against its own prior-100 mean without counting the candidate in its baseline', () => {
  const previous = [...history(), ...Array.from({ length: 4 }, (_, index) => solve(100 + index, 13000))];
  expect(breakReason(solve(104, 13000), previous, settings)).toContain('5 consecutive solves');
  expect(breakReason(solve(104, 11000), previous, settings)).toBeNull();
  previous[102].duration = 10000;
  expect(breakReason(solve(104, 13000), previous, settings)).toBeNull();
});
test('custom windows, thresholds and penalties affect triggers', () => {
  const previous = history();
  previous[99].duration = 20000;
  expect(breakReason(solve(100, 25000), previous, { ...settings, streakWindow: 1 })).toBeNull();
  expect(breakReason({ ...solve(100, 18000), penalty: 2000 }, history(), settings)).not.toBeNull();
});
test('the shared custom window also controls every streak baseline', () => {
  const previous = [...history(), ...Array.from({ length: 4 }, (_, index) => solve(100 + index, 13000))];
  expect(breakReason(solve(104, 13000), previous, settings)).not.toBeNull();
  expect(breakReason(solve(104, 13000), previous, { ...settings, streakWindow: 1 })).toBeNull();
});
test('reminder text pulls every threshold from the configured values', () => {
  const custom = { ...settings, singleMultiplier: 3, streakWindow: 10, streakCount: 3, streakPercent: 50 };
  expect(breakReason(solve(10, 30000), history(10), custom))
    .toBe('This solve was at least 3 times your prior-10 average.');
  const previous = [...history(10), solve(10, 20000), solve(11, 20000)];
  expect(breakReason(solve(12, 20000), previous, custom))
    .toBe('3 consecutive solves were at least 50% slower than their prior-10 averages.');
});
test('the average window determines the required history, ignoring a saved warmup threshold', () => {
  localStorage.setItem(BREAK_SETTINGS, JSON.stringify({ ...settings, streakWindow: 10, warmup: 100 }));
  const restored = readBreakSettings();
  expect(breakReason(solve(10, 20000), history(9), restored)).toBeNull();
  expect(breakReason(solve(10, 20000), history(10), restored)).toContain('prior-10 average');
  const streak = [...history(10), ...Array.from({ length: 4 }, (_, index) => solve(10 + index, 20000))];
  const streakSettings = { ...restored, singleMultiplier: 10 };
  expect(breakReason(solve(13, 20000), streak.slice(0, -1), streakSettings)).toBeNull();
  expect(breakReason(solve(14, 20000), streak, streakSettings)).toContain('5 consecutive solves');
});
test('previously saved two-window settings retain preferences and use the shared window', () => {
  localStorage.setItem(BREAK_SETTINGS, JSON.stringify({ ...settings, singleWindow: 12, minutes: 3 }));
  const restored = readBreakSettings();
  expect(restored.enabled).toBe(true);
  expect(restored.minutes).toBe(3);
  const previous = history().map((item, index) => ({ ...item, duration: index < 88 ? 100000 : 10000 }));
  expect(breakReason(solve(100, 20000), previous, restored)).toBeNull();
});
test('settings validate, persist, and disable an existing lock only when explicitly saved disabled', () => {
  writeBreakSettings(settings);
  expect(readBreakSettings()).toEqual(settings);
  expect(validBreakSettings({ ...settings, streakWindow: 0 })).toBe(false);
  expect(validBreakSettings({ ...settings, streakCount: 2.5 })).toBe(false);
  localStorage.setItem(BREAK_ACTIVE, JSON.stringify({ until: 2000, solveId: '100', reason: 'Slow solve' }));
  expect(readTimerBreak(1000)?.solveId).toBe('100');
  expect(readTimerBreak(2000)).toBeNull();
  writeBreakSettings({ ...settings, minutes: 3 });
  expect(localStorage.getItem(BREAK_ACTIVE)).not.toBeNull();
  writeBreakSettings(breakDefaults);
  expect(localStorage.getItem(BREAK_ACTIVE)).toBeNull();
  localStorage.setItem(BREAK_SETTINGS, '{"enabled":true}');
  expect(readBreakSettings()).toEqual(breakDefaults);
});
test('session grace defaults to ten minutes, honors its exact boundary, and can be disabled or customized', () => {
  expect(readBreakSettings()).toMatchObject({ graceEnabled: true, graceMinutes: 10 });
  const slow = solve(100, 30000), start = 1000000;
  expect(breakReason(slow, history(), settings, start, start + 599999)).toBeNull();
  expect(breakReason(slow, history(), settings, start, start + 600000)).not.toBeNull();
  expect(breakReason(slow, history(), { ...settings, graceMinutes: 1 }, start, start + 59999)).toBeNull();
  expect(breakReason(slow, history(), { ...settings, graceEnabled: false }, start, start)).not.toBeNull();
  expect(validBreakSettings({ ...settings, graceMinutes: -1 })).toBe(false);
  expect(validBreakSettings({ ...settings, graceEnabled: 'yes' })).toBe(false);
});
test('older saved break settings retain their values while gaining grace defaults', () => {
  const { graceEnabled: _enabled, graceMinutes: _minutes, ...legacy } = settings;
  localStorage.setItem(BREAK_SETTINGS, JSON.stringify({ ...legacy, minutes: 3 }));
  expect(readBreakSettings()).toEqual({ ...settings, minutes: 3 });
});
