export const calendarDay = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;

export function streakWindows(days: number[], today = calendarDay(new Date())): { current: number[]; best: number[] } {
  const sorted = [...new Set(days)].filter(day => day <= today).sort((a, b) => a - b);
  let start = 0, bestStart = 0, bestLength = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) start = i;
    if (i - start + 1 >= bestLength) { bestStart = start; bestLength = i - start + 1; }
  }
  return { current: (sorted.at(-1) ?? -Infinity) >= today - 1 ? sorted.slice(start) : [],
    best: sorted.slice(bestStart, bestStart + bestLength) };
}
