const format = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
const units = [['year', 365 * 86400], ['month', 30 * 86400], ['week', 7 * 86400], ['day', 86400], ['hour', 3600], ['minute', 60]] as const;

export function relativeTime(date: string, now = Date.now()): string {
  const seconds = (now - Date.parse(date)) / 1000;
  if (!Number.isFinite(seconds)) return '--';
  const unit = units.find(([, duration]) => seconds >= duration);
  return unit ? format.format(-Math.floor(seconds / unit[1]), unit[0]) : 'now';
}
