export function latestSolves<T>(solves: T[], limit: number, date: (solve: T) => number): T[] {
  return [...solves].sort((a, b) => date(a) - date(b)).slice(limit > 0 ? -limit : 0);
}
