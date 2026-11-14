import { describe, expect, jest, test } from '@jest/globals';
import { memoize } from '../../smartcubeanalyzer/src/Helpers/memoize';

describe('shared analysis memoization', () => {
    test.each([0, false, '', null])('retains cached falsy result %s', value => {
        const compute = jest.fn(() => value);
        const cached = memoize(compute);
        expect(cached('moves')).toBe(value);
        expect(cached('moves')).toBe(value);
        expect(compute).toHaveBeenCalledTimes(1);
    });

    test('keeps keys distinct and returns cached results by identity', () => {
        const compute = jest.fn((key: string) => ({ key }));
        const cached = memoize(compute);
        const first = cached('U');
        expect(cached('R')).not.toBe(first);
        expect(cached('U')).toBe(first);
        expect(compute).toHaveBeenCalledTimes(2);
    });

    test('retries failed computations without caching the error', () => {
        const compute = jest.fn<() => number>()
            .mockImplementationOnce(() => { throw new Error('incomplete input'); })
            .mockReturnValue(2);
        const cached = memoize(compute);
        expect(() => cached('moves')).toThrow('incomplete input');
        expect(cached('moves')).toBe(2);
        expect(cached('moves')).toBe(2);
        expect(compute).toHaveBeenCalledTimes(2);
    });
});
