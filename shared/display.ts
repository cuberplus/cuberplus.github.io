export type FontSize = 'small' | 'normal' | 'large';
export const readOption = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
let minutes = readOption('show-minutes') !== 'false';
export const setTimeDisplay = (value: boolean) => { minutes = value; };
export function formatSeconds(seconds: number, precision = 2, showMinutes = minutes): string {
  if (!Number.isFinite(seconds)) return seconds === Infinity ? 'DNF' : '--';
  const rounded = Math.abs(seconds).toFixed(precision), value = Number(rounded);
  const sign = seconds < 0 ? '-' : '';
  return showMinutes && value >= 60
    ? `${sign}${Math.floor(value / 60)}:${(value % 60).toFixed(precision).padStart(precision + 3, '0')}`
    : sign + rounded;
}
export const formatMilliseconds = (milliseconds: number, precision = 2, showMinutes = minutes) => formatSeconds(milliseconds / 1000, precision, showMinutes);
export function compareDurationText(left: string, right: string): number | undefined {
  if ((!left.includes(':') && !right.includes(':')) || ![left, right].every(value => /^-?(?:\d+:)?\d+(?:\.\d+)?$/.test(value))) return undefined;
  const seconds = (value: string) => {
    const parts = value.replace('-', '').split(':').map(Number);
    return (value.startsWith('-') ? -1 : 1) * (parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0]);
  };
  return seconds(left) - seconds(right);
}
