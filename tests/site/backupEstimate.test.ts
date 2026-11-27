import { BackupEstimate, estimatedBackupPercent } from '../../src/cloud/backupEstimate';

test('elapsed time advances within the first phase and larger solve sets take proportionally longer', () => {
  const small = new BackupEstimate(100, null, 0).snapshot();
  const large = new BackupEstimate(10000, null, 0).snapshot();
  expect(large.estimatedMs).toBeGreaterThan(small.estimatedMs * 10);
  expect(estimatedBackupPercent(large, 1000)).toBeCloseTo(1000 / large.estimatedMs * 100);
  expect(estimatedBackupPercent(large, 2000)).toBeGreaterThan(estimatedBackupPercent(large, 1000));
});
test('completed phases use measured time, not equal-sized progress steps', () => {
  const estimate = new BackupEstimate(10000, null, 0);
  estimate.remoteCount(10000);
  estimate.advance(30000);
  const progress = estimate.snapshot();
  expect(progress.estimatedMs).toBe(30000 + 1650 + 4300 + 4200);
  expect(estimatedBackupPercent(progress, 30000)).toBeGreaterThan(70);
  expect(progress.complete).toBe(false);
  estimate.advance(32000); estimate.advance(36000);
  expect(estimate.snapshot().estimatedMs).toBe(40200);
});
test('known cloud-only solves and the actual merged count update the remaining estimates', () => {
  const estimate = new BackupEstimate(100, null, 0);
  const initial = estimate.snapshot().estimatedMs;
  estimate.remoteCount(10000);
  expect(estimate.snapshot().estimatedMs).toBeGreaterThan(initial * 10);
  estimate.advance(30000); estimate.advance(31000);
  estimate.mergedCount(10100);
  expect(estimate.snapshot()).toMatchObject({ solveCount: 10100, estimatedMs: 39570 });
});
test('each phase learns its observed timing and scales the next estimate by solve count', () => {
  const estimate = new BackupEstimate(1000, null, 0);
  estimate.remoteCount(1000);
  estimate.advance(8000); estimate.advance(8600); estimate.advance(10000); estimate.advance(13000);
  expect(estimate.snapshot().complete).toBe(true);
  const sameSize = new BackupEstimate(1000, estimate.savedTimings(), 20000);
  expect(sameSize.snapshot().estimatedMs).toBe(13000);
  const larger = new BackupEstimate(2000, estimate.savedTimings(), 20000);
  expect(larger.snapshot().estimatedMs).toBeGreaterThan(13000);
  const smallerLocal = new BackupEstimate(10, estimate.savedTimings(), 20000);
  expect(smallerLocal.snapshot().solveCount).toBe(1000);
});
test('a first upload with no existing remote data does not teach a near-zero validation cost', () => {
  const estimate = new BackupEstimate(10000, null, 0);
  estimate.remoteCount(0);
  estimate.advance(1); estimate.advance(1000); estimate.advance(2000); estimate.advance(3000);
  const next = new BackupEstimate(10, estimate.savedTimings(), 0).snapshot();
  expect(next.solveCount).toBe(10000);
  expect(next.estimatedMs).toBeGreaterThan(31000);
});
test.each(['invalid', '{}', '{"counts":[1],"durations":[1]}', '{"counts":[1,1,1,1],"durations":[-1,2,3,4]}'])(
  'invalid local calibration falls back to initial estimates: %s', saved => {
    expect(new BackupEstimate(100, saved, 0).snapshot()).toEqual(new BackupEstimate(100, null, 0).snapshot());
  },
);
test('overruns and clock resets never imply success; only acknowledged completion reaches 100%', () => {
  const estimate = new BackupEstimate(0, null, 100);
  expect(estimatedBackupPercent(estimate.snapshot(), 0)).toBe(0);
  expect(estimatedBackupPercent(estimate.snapshot(), 1000000)).toBe(99);
  estimate.advance(200); estimate.advance(300); estimate.advance(400); estimate.advance(500);
  expect(estimatedBackupPercent(estimate.snapshot(), 500)).toBe(100);
});
