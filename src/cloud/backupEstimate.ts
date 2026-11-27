export type BackupProgress = { startedAt: number; estimatedMs: number; solveCount: number; complete: boolean };
type Timing = { counts: number[]; durations: number[] };
// Download/validation, local read, preparation/compression, and upload.
const overhead = [1000, 150, 300, 1200];
const perSolve = [3, 0.15, 0.4, 0.3];
const predicted = (stage: number, count: number) => overhead[stage] + perSolve[stage] * count;

export class BackupEstimate {
  private readonly previous: Timing | null;
  private readonly counts: number[];
  private readonly durations: number[] = [];
  private readonly startedAt: number;
  private stageStartedAt: number;
  private stage = 0;
  constructor(localCount: number, saved: string | null, now = performance.now()) {
    let previous: Timing | null = null;
    try {
      const value = JSON.parse(saved ?? 'null') as Timing | null;
      if (value && [value.counts, value.durations].every(items => Array.isArray(items) && items.length === 4 &&
          items.every(item => Number.isFinite(item) && item >= 0))) previous = value;
    } catch { /* Missing or invalid timing history uses the initial estimates. */ }
    this.previous = previous;
    const count = Math.max(localCount, previous?.counts[3] ?? 0);
    this.counts = [count, localCount, count, count];
    this.startedAt = this.stageStartedAt = now;
  }
  remoteCount(count: number): void {
    this.counts[0] = count;
    this.mergedCount(Math.max(count, this.counts[1]));
  }
  localCount(count: number): void { this.counts[1] = count; }
  mergedCount(count: number): void { this.counts[2] = this.counts[3] = count; }
  advance(now = performance.now()): void {
    this.durations.push(now - this.stageStartedAt);
    this.stageStartedAt = now; this.stage++;
  }
  snapshot(): BackupProgress {
    let estimatedMs = this.durations.reduce((sum, duration) => sum + duration, 0);
    for (let stage = this.stage; stage < 4; stage++) {
      const scale = this.previous && this.previous.counts[stage] > 0
        ? this.previous.durations[stage] / predicted(stage, this.previous.counts[stage]) : 1;
      estimatedMs += Math.max(100, predicted(stage, this.counts[stage]) * scale);
    }
    return { startedAt: this.startedAt, estimatedMs, solveCount: this.counts[3], complete: this.stage === 4 };
  }
  savedTimings(): string { return JSON.stringify({ counts: this.counts, durations: this.durations }); }
}

export function estimatedBackupPercent(progress: BackupProgress, now = performance.now()): number {
  return progress.complete ? 100 : Math.min(99, Math.max(0, (now - progress.startedAt) / progress.estimatedMs * 100));
}
