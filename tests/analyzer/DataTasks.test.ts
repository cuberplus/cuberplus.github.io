import { expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { runDataTask } from '../../shared/workers/dataTasks';

test('CSV workers classify only the recent window while retaining all record times and restoring older details for All', async () => {
    const csv = readFileSync('smartcubeanalyzer\\public\\demo\\cfop-small.csv', 'utf8');
    const recent = await runDataTask({ type: 'parse', csv, solveLimit: 2 });
    const all = await runDataTask({ type: 'parse', csv, solveLimit: 0 });
    if (!('solves' in recent) || !('solves' in all)) throw new Error('Expected parsed solves');
    expect(recent.solves).toHaveLength(467);
    expect(recent.solves.map(({ id, time, date, dnf }) => ({ id, time, date, dnf })))
        .toEqual(all.solves.map(({ id, time, date, dnf }) => ({ id, time, date, dnf })));
    const older = recent.solves.slice(0, -2);
    expect(older.every(solve => !solve.mistakeContext && !solve.mistakes && !solve.recording && solve.steps.every(step => !step.moves))).toBe(true);
    expect(recent.solves.slice(-2).filter(solve => !solve.isCorrupt && !solve.dnf).every(solve => !!solve.mistakeContext)).toBe(true);
    expect(all.solves.slice(0, -2).some(solve => solve.steps.some(step => !!step.moves))).toBe(true);
    expect(all.solves.filter(solve => !!solve.mistakeContext).length).toBeGreaterThan(2);
});
