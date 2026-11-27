/** @jest-environment jsdom */
import React from 'react';
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { MistakeChart } from '../../smartcubeanalyzer/src/Components/MistakeChart';
import { MISTAKES, MistakeKind, markMistakes, mistakeLabel, rankedMistakes, summarizeMistakes } from '../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { consolidateMoves, countMovesExcludingRotations, parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import { analyzeMoveMistakes, coreMovesCount } from '../../smartcubeanalyzer/src/Analysis/MoveAnalysis';
import { CrossColor, MethodName, Solve, Step, StepName } from '../../smartcubeanalyzer/src/Models/Types';
import { FilterPanel } from '../../smartcubeanalyzer/src/Components/FilterPanel';
import { makeCfopSteps, makeSolve, makeSolves, makeStep } from './testUtils';

const classify = (steps: Step[]) => markMistakes([makeSolve({ steps })], 5)[0].mistakes?.map(m => m.kind);
const caseSolve = (name: StepName, moves = "R U R'", overrides: Partial<Solve> = {}) =>
    makeSolve({ steps: [makeStep(name, 3, { case: 'test case', moves })], ...overrides });
const withPriorPauses = (solve: Solve, timing: Partial<Step> = {}, count = 5): Solve[] => [
    ...Array.from({ length: count }, (_, i) => makeSolve({
        ...solve, id: `prior-${i}`, date: new Date(solve.date.getTime() - (count - i) * 1000),
        mistakes: undefined, mistakeContext: undefined,
        steps: solve.steps.map(step => ({ ...step, case: '', turnGaps: [.1], ...timing })),
    })),
    solve,
];

describe('specific mistake reasons', () => {
    test.each([
        [StepName.Cross, 'extraLookCross'], [StepName.F2L_1, 'extraLookF2l'], [StepName.F2L_2, 'extraLookF2l'],
        [StepName.F2L_3, 'extraLookF2l'], [StepName.F2L_4, 'extraLookF2l'], [StepName.OLL, 'extraLookOll'], [StepName.PLL, 'extraLookPll'],
    ])('detects an extra look within %s from recorded timestamps', (name, kind) => {
        const solves = parseCsv(`id,date,dnf,time,solving_method,step_0_name,step_0_recorded_moves\nextra,2026-11-25 12:00:00 UTC,false,12000,CFOP,${name},R[0] F[100] L[200] B[3300] R[3400]`, ',');
        markMistakes(withPriorPauses(solves[0]), 5);
        const mistake = solves[0].mistakes!.find(mistake => mistake.kind === kind)!;
        expect(mistake.step).toBe(name);
        expect(mistake.estimatedSeconds).toBeCloseTo(3);
        expect(mistakeLabel(mistake)).toBe(`${name}: Extra Look`);
        expect(summarizeMistakes(solves, 5, [kind]).counts.some(item => item.kind === kind)).toBe(false);
    });
    test('keeps extra looks in different F2L pairs distinct in solve analysis and charts', () => {
        const solve = makeSolve({ steps: [
            makeStep(StepName.Cross, 4, { turnGaps: [1.1] }),
            makeStep(StepName.F2L_1, 4, { turnGaps: [1.6] }),
            makeStep(StepName.F2L_3, 5, { turnGaps: [2.1] }),
        ] });
        markMistakes(withPriorPauses(solve), 5);
        const extraLooks = rankedMistakes(solve).filter(mistake => mistake.kind.startsWith('extraLook'));
        expect(extraLooks.map(mistakeLabel)).toEqual(['F2L Slot 3: Extra Look', 'F2L Slot 1: Extra Look', 'Cross: Extra Look']);
        expect(extraLooks[0].stepCosts).toEqual({ [StepName.F2L_3]: 2 });
        const enabled = summarizeMistakes([solve], 5, ['extraLookF2l']).counts.filter(mistake => mistake.kind.startsWith('extraLook'));
        expect(enabled.map(mistakeLabel)).toEqual(['Cross: Extra Look']);
    });
    test.each([
        'R[3000] F[3100] L[3200] B[3300]',
        'R[0] F[100] L[2100] B[2200]',
        'R[0] F[100] L[200] B[300]',
        'U[0] U[100] U[200] R[3500] F[3600] L[3700]',
        'R[0] F[100] L[200] U[3500]',
    ])('extra looks exclude initial recognition, short sequences, threshold ties, setup and final AUF: %s', moves => {
        const solves = parseCsv(`id,date,dnf,time,solving_method,step_0_name,step_0_recorded_moves\nno-extra,2026-11-25 12:00:00 UTC,false,12000,CFOP,PLL,${moves}`, ',');
        markMistakes(withPriorPauses(solves[0]), 5);
        expect(solves[0].mistakes!.some(mistake => mistake.kind.startsWith('extraLook'))).toBe(false);
    });
    test('fresh prepared classification is retained, but a changed window or mixed context is recalculated', () => {
        const solves = makeSolves(20).map(solve => ({ ...solve, steps: [makeStep(StepName.Cross, 1)] }));
        solves.at(-1)!.steps[0].time = 100;
        markMistakes(solves, 5);
        const expected = JSON.stringify(solves);
        const reasons = solves.at(-1)!.mistakes;
        markMistakes(solves, 5, true);
        expect(JSON.stringify(solves)).toBe(expected);
        expect(solves.at(-1)!.mistakes).toBe(reasons);
        markMistakes(solves, 10, true);
        expect(solves[0].mistakeContext).toMatch(/^8:10:/);
        const combined = [...solves, ...markMistakes(makeSolves(5), 10)];
        const reference = JSON.parse(JSON.stringify(combined)) as Solve[];
        reference.forEach(solve => { solve.date = new Date(solve.date); });
        markMistakes(combined, 10, true);
        markMistakes(reference, 10);
        expect(combined).toEqual(reference);
    });
    test('slow steps have separate stage labels and multiple F2L pair outliers count once per solve', () => {
        const names = [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.PLL];
        const solves = makeSolves(20).map(solve => ({ ...solve, steps: names.map(name => makeStep(name, 1)) }));
        solves.at(-1)!.steps.forEach(step => { step.time = 100; });
        markMistakes(solves, 5);
        const mistakes = solves.at(-1)!.mistakes!.filter(mistake => mistake.kind === 'slowStep');
        expect(mistakes.map(mistakeLabel)).toEqual(['Unusually slow Cross', 'Unusually slow F2L', 'Unusually slow PLL']);
        expect(summarizeMistakes(solves, 5).counts.filter(mistake => mistake.kind === 'slowStep').map(({ step, count }) => ({ step, count })))
            .toEqual([{ step: StepName.Cross, count: 1 }, { step: StepName.F2L, count: 1 }, { step: StepName.PLL, count: 1 }]);
    });
    test('retains reasons rather than only a boolean, and clears old reasons on recalculation', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.Cross, 2, { turns: 9 })] });
        markMistakes([solve], 5);
        expect(solve.mistakes?.map(m => m.kind)).toEqual(['crossMoves']);
        expect(solve.isMistake).toBe(true);
        solve.steps[0].turns = 8;
        markMistakes([solve], 5);
        expect(solve.mistakes).toEqual([]);
        expect(solve.isMistake).toBe(false);
    });

    test('rolling step baselines use the first duplicate, fill missing steps, and refresh after edits', () => {
        const solves = makeSolves(20).map(solve => ({ ...solve, steps: [makeStep(StepName.Cross, 1)] }));
        const last = solves.at(-1)!;
        last.steps.push(makeStep(StepName.Cross, 1000));
        markMistakes(solves, 5);
        expect(last.mistakes?.some(mistake => mistake.kind === 'slowStep')).toBe(false);
        last.steps[0].time = 1000;
        markMistakes(solves, 5);
        expect(last.mistakes?.some(mistake => mistake.kind === 'slowStep')).toBe(true);
        last.steps = [makeStep(StepName.F2L_1, 100)];
        markMistakes(solves, 5);
        expect(last.mistakes?.some(mistake => mistake.kind === 'slowStep')).toBe(true);
        last.steps = [];
        markMistakes(solves, 5);
        expect(last.mistakes?.some(mistake => mistake.kind === 'slowStep')).toBe(false);
    });

    test('uses strict, explicit cross and per-pair move thresholds and deduplicates pair mistakes', () => {
        expect(classify([
            makeStep(StepName.Cross, 2, { turns: 8 }),
            makeStep(StepName.F2L_1, 3, { turns: 12 }),
        ])).toEqual([]);
        expect(classify([
            makeStep(StepName.Cross, 2, { turns: 9 }),
            makeStep(StepName.F2L_1, 3, { turns: 13 }),
            makeStep(StepName.F2L_2, 3, { turns: 14 }),
        ])).toEqual(['crossMoves', 'f2lMoves']);
        expect(classify(makeCfopSteps().map(s => ({ ...s, turns: Infinity })))).toEqual([]);
    });

    test.each([StepName.OLL, StepName.PLL])('learns extra %s moves per case, with tolerance and at least five observations', name => {
        const base = makeSolves(4).map((_, i) => caseSolve(name, "R U R'", { id: `base-${i}` }));
        const extra = caseSolve(name, "R U R' F U F' R U R'", { id: 'extra' });
        markMistakes([...base.slice(0, 3), extra], 5);
        expect(extra.mistakes?.map(m => m.kind)).not.toContain(name === StepName.OLL ? 'ollMoves' : 'pllMoves');
        markMistakes([...base, extra], 5);
        expect(extra.mistakes?.map(m => m.kind)).toContain(name === StepName.OLL ? 'ollMoves' : 'pllMoves');
        const atTolerance = caseSolve(name, "R U R' F R", { id: 'tolerance' });
        markMistakes([...base, atTolerance], 5);
        expect(atTolerance.mistakes?.map(m => m.kind)).not.toContain(name === StepName.OLL ? 'ollMoves' : 'pllMoves');
    });

    test('does not contaminate case baselines with missing moves, skips, or another method', () => {
        const base = makeSolves(4).map(() => caseSolve(StepName.OLL));
        const extra = caseSolve(StepName.OLL, "R U R' F U F' R U R'");
        const missing = makeSolves(10).map(() => caseSolve(StepName.OLL, ''));
        markMistakes([...base.slice(0, 3), ...missing, extra], 5);
        expect(extra.mistakes?.map(m => m.kind)).not.toContain('ollMoves');
        extra.method = MethodName.CFOP_2OLL;
        markMistakes([...base, extra], 5);
        expect(extra.mistakes?.map(m => m.kind)).not.toContain('ollMoves');
        extra.method = MethodName.CFOP;
        extra.steps[0].case = 'Solved';
        markMistakes([...base, extra], 5);
        expect(extra.mistakes?.map(m => m.kind)).not.toContain('ollMoves');
    });

    test('excludes AUF when comparing case move counts', () => {
        const base = makeSolves(4).map(() => caseSolve(StepName.PLL));
        const extraAuf = caseSolve(StepName.PLL, "U U U R U R' U U U");
        markMistakes([...base, extraAuf], 5);
        expect(extraAuf.mistakes?.map(m => m.kind)).not.toContain('pllMoves');
    });

    test.each([
        [StepName.F2L_1, 'f2lPause'], [StepName.F2L_4, 'f2lPause'],
        [StepName.OLL, 'ollRecognition'], [StepName.PLL, 'pllRecognition'],
    ])('labels long recognition for %s without confusing execution with recognition', (name, kind) => {
        const check = (time: number, recognitionTime: number) => {
            const solve = makeSolve({ steps: [makeStep(name, time, { recognitionTime })] });
            markMistakes(withPriorPauses(solve, { recognitionTime: 2 }), 5);
            return solve.mistakes?.map(m => m.kind);
        };
        expect(check(10, 2)).not.toContain(kind);
        expect(check(10, 2.01)).toContain(kind);
        expect(check(1, 2.01)).not.toContain(kind);
    });

    test('detects inverse moves, treating rotations, invalid tokens and different faces as barriers', () => {
        expect(analyzeMoveMistakes(['U', "U'", 'R2', 'R2']).map(m => m.kind)).toEqual(['singleUndo', 'singleUndo']);
        expect(analyzeMoveMistakes(['U2', 'R2', 'x', "x'", 'R', "L'"])).toEqual([]);
        expect(analyzeMoveMistakes(['R', 'x', "R'"])).toEqual([]);
        expect(analyzeMoveMistakes(['R', '???', "R'"])).toEqual([]);
        expect(analyzeMoveMistakes(['Rw', "Rw'", 'M', "M'"]).map(m => m.kind)).toEqual(['singleUndo', 'singleUndo']);
    });

    test('reused wide tokens respect each AUF face and changed recordings', () => {
        const tokens = ['Rw', "Rw'"];
        expect(analyzeMoveMistakes(tokens, new Set(['r']))).toEqual([{ kind: 'singleUndo', auf: true, wastedMoves: 2 }]);
        expect(analyzeMoveMistakes(tokens)).toEqual([{ kind: 'singleUndo', auf: false, wastedMoves: 2 }]);
        tokens[1] = '???';
        expect(analyzeMoveMistakes(tokens)).toEqual([]);
        tokens[1] = "Rw'";
        expect(analyzeMoveMistakes(tokens, new Set(['r']))).toEqual([{ kind: 'singleUndo', auf: true, wastedMoves: 2 }]);
        expect(analyzeMoveMistakes(['R' + '9'.repeat(400), "R'"])).toEqual([]);
    });

    test('distinguishes AUF/internal undos, attributes them to their step, and deduplicates each kind', () => {
        const solve = makeSolve({ steps: [
            makeStep(StepName.PLL, 3, { moves: "U U' R U R' U U'" }),
            makeStep(StepName.OLL, 3, { moves: "R U U' F" }),
            makeStep(StepName.F2L_1, 3, { moves: "U U'" }),
        ] });
        markMistakes([solve], 5);
        expect(solve.mistakes).toMatchObject([
            { kind: 'singleUndo', step: StepName.PLL, auf: true },
            { kind: 'singleUndo', step: StepName.OLL, auf: false },
            { kind: 'singleUndo', step: StepName.F2L_1, auf: false },
        ]);
        expect(classify([makeStep(StepName.PLL, 3, { moves: "U U'" })])).toEqual(['singleUndo']);
    });

    test('counts maximal inverse sequences as multi-move undos, without also tagging their nested single undo', () => {
        expect(analyzeMoveMistakes(['R', 'U', "U'", "R'"])).toEqual([{ kind: 'sequenceUndo', auf: false, wastedMoves: 4 }]);
        expect(analyzeMoveMistakes(['R', 'U', 'F', "F'", "U'", "R'"])).toEqual([{ kind: 'sequenceUndo', auf: false, wastedMoves: 6 }]);
        expect(analyzeMoveMistakes(['R', "R'", 'R', "R'"])).toEqual([
            { kind: 'singleUndo', auf: false, wastedMoves: 2 }, { kind: 'singleUndo', auf: false, wastedMoves: 2 },
        ]);
        expect(classify([makeStep(StepName.Cross, 3, { moves: "R U U' R' F F'" })])).toEqual(['sequenceUndo', 'singleUndo']);
        expect(classify([makeStep(StepName.PLL, 3, { moves: "U U U' U'" })])).toContain('sequenceUndo');
    });

    test.each(['U3', 'U4', "U3'", 'U8', 'Rw3'])('flags explicit redundant turning: %s', moves => {
        expect(classify([makeStep(StepName.PLL, 3, { moves })])).toContain('redundantTurns');
    });

    test.each([
        ['U U', 'U2'], ["R' R'", 'R2'], ['U U2', "U'"], ['R R2', "R'"],
        ['Rw Rw', 'Rw2'], ['U U U', "U'"], ["U' U2'", 'U'], ["R U U' R'", "R U U' R'"],
        ["U U' U2", "U U' U2"], ["R R R'", "R R R'"],
        ["R x R", "R x R"], ['R ??? R', 'R ??? R'],
    ])('consolidates %s into %s without discarding undo evidence or crossing barriers', (raw, expected) => {
        expect(consolidateMoves(raw)).toBe(expected);
        expect(consolidateMoves(consolidateMoves(raw))).toBe(expected);
        expect(classify([makeStep(StepName.PLL, 3, { moves: raw })])).not.toContain('redundantTurns');
    });
    test.each([4, 5, 6, 7, 8, 10, 12])('a run of %i same-direction turns is not converted into a fictitious undo', count => {
        const raw = Array(count).fill('R').join(' '), consolidated = consolidateMoves(raw);
        expect(consolidated).toBe(`R${count}`);
        expect(consolidateMoves(consolidated)).toBe(consolidated);
        expect(countMovesExcludingRotations(consolidated)).toBe(count);
        expect(coreMovesCount(`U4 ${consolidated} U10'`)).toBe(count);
        const solve = makeSolve({ steps: [makeStep(StepName.Cross, 4, { moves: raw, turns: count, executionTime: 2 })] });
        markMistakes([solve], 5);
        expect(solve.mistakes?.map(m => m.kind)).toEqual([...(count > 8 ? ['crossMoves'] : []), 'redundantTurns']);
        expect(solve.mistakes![0].estimatedSeconds).toBeLessThanOrEqual(2);
    });
    test('known last-layer cases can flag a likely incorrect algorithm without five personal examples', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.OLL, 5, { case: '27', moves: "R U R' U R U2 R' F R U R' U' F'", turns: 13 })] });
        markMistakes([solve], 5);
        expect(solve.mistakes?.map(m => m.kind)).toContain('ollMoves');
        const unknown = makeSolve({ steps: [{ ...solve.steps[0], case: 'unknown' }] });
        markMistakes([unknown], 5);
        expect(unknown.mistakes?.map(m => m.kind)).not.toContain('ollMoves');
    });
    test('an undone algorithm attempt is attributed to the last-layer algorithm rather than its nested undo', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.PLL, 5, { moves: "R U F F' U' R' L D L'", turns: 9, executionTime: 3 })] });
        markMistakes([solve], 5);
        expect(solve.mistakes?.map(m => m.kind)).toEqual(['pllMoves']);
        expect(solve.mistakes![0].estimatedSeconds).toBeCloseTo(2);
    });
    test('time loss uses active step turning pace without charging recognition, extra looks or AUF twice', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.PLL, 10, {
            moves: "U R R' F U F' U", turns: 7, executionTime: 8, recognitionTime: 2,
            preAufTime: 1, postAufTime: 1, turnGaps: [4.1],
        })] });
        markMistakes(withPriorPauses(solve), 5);
        expect(solve.mistakes!.find(m => m.kind === 'singleUndo')?.estimatedSeconds).toBeCloseTo(.8);
        expect(solve.mistakes!.find(m => m.kind === 'extraLookPll')?.estimatedSeconds).toBeCloseTo(4);
    });
    test('AUF undos use measured AUF pace and timing edits invalidate cached estimates', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.PLL, 10, {
            moves: "U U' R F U U'", turns: 6, executionTime: 10, recognitionTime: 0,
            preAufTime: 1, postAufTime: 1,
        })] });
        markMistakes([solve], 5);
        expect(solve.mistakes!.find(m => m.kind === 'singleUndo' && m.auf)?.estimatedSeconds).toBeCloseTo(2);
        solve.steps[0].preAufTime = 3;
        markMistakes([solve], 5);
        expect(solve.mistakes!.find(m => m.kind === 'singleUndo' && m.auf)?.estimatedSeconds).toBeCloseTo(4);
    });

    test('ranks the biggest actionable mistake by estimated impact without mutating stored reasons', () => {
        const solve = makeSolve({
            executionTime: 10, turns: 50,
            steps: [makeStep(StepName.Cross, 3, { turns: 9 }), makeStep(StepName.F2L_1, 8, { recognitionTime: 6 })],
            mistakes: [{ kind: 'slowSolve', estimatedSeconds: 0.1 }, { kind: 'crossMoves' }, { kind: 'f2lPause', estimatedSeconds: 4 }],
        });
        const original = [...solve.mistakes!];
        expect(rankedMistakes(solve).map(item => item.kind)).toEqual(['f2lPause', 'crossMoves', 'slowSolve']);
        expect(solve.mistakes).toEqual(original);
        expect(rankedMistakes(makeSolve())).toEqual([]);
        expect(rankedMistakes(makeSolve({ mistakes: [{ kind: 'f2lPause' }] }))[0].estimatedSeconds).toBe(0);
    });

    test('keeps a normal U2 clean and assigns redundant AUF turns to the correct stage', () => {
        expect(classify([makeStep(StepName.PLL, 3, { moves: 'U2' })])).toEqual([]);
        const solve = makeSolve({ steps: [makeStep(StepName.PLL, 3, { moves: "U4 R U R'" })] });
        markMistakes([solve], 5);
        expect(solve.mistakes).toContainEqual(expect.objectContaining({ kind: 'redundantTurns', step: StepName.PLL, auf: true }));
    });

    test('uses the legacy Acubemy AUF face, not an assumed U face', () => {
        const solve = makeSolve({
            source: 'acubemy', date: new Date('2025-01-01'), crossColor: CrossColor.White,
            steps: [makeStep(StepName.PLL, 3, { moves: "D D' R U R'" })],
        });
        markMistakes([solve], 5);
        expect(solve.mistakes).toMatchObject([{ kind: 'singleUndo', step: StepName.PLL, auf: true }]);
        solve.date = new Date('2026-01-01');
        markMistakes([solve], 5);
        expect(solve.mistakes).toMatchObject([{ kind: 'singleUndo', step: StepName.PLL, auf: false }]);
    });

    test('compares only post-AUF with personal history, independently of pre-AUF', () => {
        const check = (timing: Partial<Step>) => {
            const solve = makeSolve({ steps: [makeStep(StepName.PLL, 3, timing)] });
            markMistakes(withPriorPauses(solve, { postAufTime: .5 }), 5);
            return solve.mistakes?.map(m => m.kind);
        };
        expect(check({ preAufTime: 1 })).toEqual([]);
        expect(check({ preAufTime: .3, postAufTime: .21 })).toEqual([]);
        expect(check({ preAufTime: 1, postAufTime: .5 })).toEqual([]);
        expect(check({ postAufTime: .51 })).toEqual(['slowAuf']);
        expect(check({ preAufTime: NaN, postAufTime: .51 })).toEqual(['slowAuf']);
        expect(MISTAKES.slowAuf.rule).toContain('Pre-AUF is excluded');
    });

    test('flags slow post-AUF only for plausible last-layer timings', () => {
        const check = (name: StepName, timing: Partial<Step>, time = 3) => {
            const solve = makeSolve({ steps: [makeStep(name, time, timing)] });
            markMistakes(withPriorPauses(solve, { postAufTime: .5 }), 5);
            return solve.mistakes?.map(m => m.kind);
        };
        expect(check(StepName.OLL, { postAufTime: .51 })).toEqual(['slowAuf']);
        expect(check(StepName.Cross, { postAufTime: 1 })).toEqual([]);
        for (const postAufTime of [Infinity, NaN, -1]) {
            expect(check(StepName.PLL, { postAufTime })).toEqual([]);
        }
        expect(check(StepName.PLL, { executionTime: .5, postAufTime: .51 })).toEqual([]);
        expect(check(StepName.PLL, { postAufTime: 1 }, 0)).toEqual([]);
    });

    test('retains specific timing-outlier reasons, including steps missing from the first solve', () => {
        const data = [...makeSolves(20), makeSolve({
            id: 'slow', time: 500,
            steps: [makeStep(StepName.OLL, 300, { recognitionTime: 0 })],
        })];
        markMistakes(data, 5);
        expect(data[data.length - 1].mistakes?.map(m => m.kind)).toEqual(expect.arrayContaining(['slowSolve', 'slowStep']));
        const missing = [...makeSolves(20, { steps: [] }), makeSolve({ steps: [makeStep(StepName.OLL, 300)] })];
        markMistakes(missing, 5);
        expect(missing[missing.length - 1].mistakes?.map(m => m.kind)).toContain('slowStep');
    });

    test('no move or recognition data does not invent specific errors or a late-cross diagnosis', () => {
        const solve = makeSolve({ steps: makeCfopSteps().map(s => ({ ...s, turns: 0, time: 0, moves: '', recognitionTime: 0 })) });
        markMistakes([solve], 5);
        expect(solve.mistakes).toEqual([]);
        expect(solve.isMistake).toBe(false);
        expect(markMistakes([], 5)).toEqual([]);
    });

    test('keeps the cleanliness filter consistent with the detailed list', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.Cross, 2, { turns: 9 })] });
        expect(markMistakes([solve], 5)[0].isMistake).toBe(true);
        expect(solve.mistakes?.map(m => m.kind)).toContain('crossMoves');
        expect(FilterPanel.compressSolves([solve], [StepName.Cross])[0].mistakes).toEqual(solve.mistakes);
    });
    test('estimates undo and recognition losses from actual timing and reuses valid results', () => {
        const solve = makeSolve({ time: 20, steps: [
            makeStep(StepName.PLL, 5, { turns: 10, executionTime: 3, recognitionTime: 2, moves: "R U U' R' F" }),
            makeStep(StepName.F2L_1, 7, { recognitionTime: 6, executionTime: 1 }),
        ] });
        const data = withPriorPauses(solve, { recognitionTime: 2 });
        markMistakes(data, 5);
        const reasons = solve.mistakes;
        expect(reasons!.find(m => m.kind === 'sequenceUndo')!.estimatedSeconds).toBeCloseTo(1.2);
        expect(rankedMistakes(solve)[0]).toMatchObject({ kind: 'f2lPause', estimatedSeconds: 4 });
        markMistakes(data, 5);
        expect(solve.mistakes).toBe(reasons);
        solve.steps[0].executionTime = 6;
        markMistakes(data, 5);
        expect(solve.mistakes!.find(m => m.kind === 'sequenceUndo')!.estimatedSeconds).toBeCloseTo(2.4);
    });
});

describe('personal pause baselines', () => {
    const pauseReasons = (solve: Solve) => solve.mistakes?.filter(m => ['f2lPause', 'ollRecognition', 'pllRecognition', 'slowAuf'].includes(m.kind) || m.kind.startsWith('extraLook'));

    test('waits for five prior valid stage samples without fixed-second fallback', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.PLL, 20, { recognitionTime: 8, postAufTime: 5, turnGaps: [5] })] });
        for (const count of [0, 4]) {
            markMistakes(withPriorPauses(solve, { recognitionTime: .2, postAufTime: .1 }, count), 5);
            expect(pauseReasons(solve)).toEqual([]);
        }
        markMistakes(withPriorPauses(solve, { recognitionTime: .2, postAufTime: .1 }), 5);
        expect(pauseReasons(solve)?.map(m => m.kind)).toEqual(['pllRecognition', 'extraLookPll', 'slowAuf']);
        expect(solve.mistakes!.find(m => m.kind === 'pllRecognition')!.estimatedSeconds).toBeCloseTo(7.8);
    });

    test('uses average plus two sample standard deviations, charges above average, and excludes threshold ties', () => {
        const threshold = .5 + 2 * Math.sqrt(.005);
        const solve = makeSolve({ steps: [makeStep(StepName.OLL, 10, { recognitionTime: threshold })] });
        const data = withPriorPauses(solve, { recognitionTime: .5 });
        [.4, .5, .5, .5, .6].forEach((value, i) => { data[i].steps[0].recognitionTime = value; });
        markMistakes(data, 5);
        expect(pauseReasons(solve)).toEqual([]);
        solve.steps[0].recognitionTime = .65;
        markMistakes(data, 5);
        expect(solve.mistakes!.find(m => m.kind === 'ollRecognition')!.estimatedSeconds).toBeCloseTo(.15);
        solve.steps[0].recognitionTime = 2;
        data.slice(0, 5).forEach(item => { item.steps[0].recognitionTime = 3; });
        markMistakes(data, 5);
        expect(pauseReasons(solve)).toEqual([]);
    });

    test('a two-second mid-OLL pause uses the normal inter-move gap, not a two-second allowance', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.OLL, 4, {
            case: '27', moves: "R U R' U R U2 R' F U F' U F U2 F'", turns: 14,
            recognitionTime: 0, executionTime: 4, turnGaps: [.1, .1, 2, .1],
        })] });
        markMistakes(withPriorPauses(solve), 5);
        expect(solve.mistakes!.find(m => m.kind === 'extraLookOll')!.estimatedSeconds).toBeCloseTo(1.9);
        expect(solve.mistakes!.find(m => m.kind === 'ollMoves')!.estimatedSeconds).toBeCloseTo(1.05);
    });

    test.each([StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.OLL, StepName.PLL])('Extra Look uses prior stage maxima and a stricter three-SD threshold in %s', name => {
        const maxima = [.4, .5, .5, .5, .6], mean = .5, sd = Math.sqrt(.005);
        const solve = makeSolve({ steps: [makeStep(name, 10, { recognitionTime: 0, turnGaps: [.1, mean + 2.5 * sd] })] });
        const data = withPriorPauses(solve, { recognitionTime: 0 });
        maxima.forEach((value, i) => { data[i].steps[0].turnGaps = [...Array(20).fill(.1), value]; });
        const looks = () => solve.mistakes!.filter(m => m.kind.startsWith('extraLook'));
        markMistakes(data, 5);
        expect(looks()).toEqual([]);
        solve.steps[0].turnGaps = [mean + 3 * sd];
        markMistakes(data, 5);
        expect(looks()).toEqual([]);
        solve.steps[0].turnGaps = [.1, .8, 1];
        markMistakes(data, 5);
        expect(looks()).toHaveLength(1);
        expect(looks()[0].estimatedSeconds).toBeCloseTo((.8 - mean) + (1 - mean));
        data.slice(0, 5).forEach(item => { item.steps[0].turnGaps = item.steps[0].turnGaps!.slice(-1); });
        markMistakes(data, 5);
        expect(looks()[0].estimatedSeconds).toBeCloseTo(.8);
    });

    test('a normal longest gap is not an Extra Look even with many fast moves, while recognition and final AUF keep two-SD rules', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.PLL, 10, {
            recognitionTime: .5 + 2.5 * Math.sqrt(.005), postAufTime: .5 + 2.5 * Math.sqrt(.005), turnGaps: [.1, .5],
        })] });
        const data = withPriorPauses(solve);
        [.4, .5, .5, .5, .6].forEach((value, i) => {
            Object.assign(data[i].steps[0], { recognitionTime: value, postAufTime: value, turnGaps: [...Array(20).fill(.1), value] });
        });
        markMistakes(data, 5);
        expect(pauseReasons(solve)?.map(m => m.kind)).toEqual(['pllRecognition', 'slowAuf']);
        data.forEach(item => { item.mistakeContext = '7:5:old'; item.mistakes = [{ kind: 'extraLookPll', estimatedSeconds: 100 }]; });
        markMistakes(data, 5, true);
        expect(solve.mistakeContext).toMatch(/^8:5:/);
        expect(pauseReasons(solve)?.map(m => m.kind)).toEqual(['pllRecognition', 'slowAuf']);
    });

    test('Extra Look follows the selected recent stage-longest samples', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.OLL, 10, { turnGaps: [1] })] });
        const data = withPriorPauses(solve, { turnGaps: [.1, 3] }, 10);
        data.slice(5, 10).forEach(item => { item.steps[0].turnGaps = [.1, .2]; });
        markMistakes(data, 10);
        expect(solve.mistakes!.some(m => m.kind.startsWith('extraLook'))).toBe(false);
        markMistakes(data, 5);
        expect(solve.mistakes!.find(m => m.kind === 'extraLookOll')!.estimatedSeconds).toBeCloseTo(.8);
    });

    test('pause fingerprints detect in-place gap reordering and sub-millisecond edits without stale costs', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.Cross, 10, { turnGaps: [.2, .8] })] });
        const data = withPriorPauses(solve);
        markMistakes(data, 5);
        const original = solve.mistakeContext;
        solve.steps[0].turnGaps!.reverse();
        markMistakes(data, 5);
        expect(solve.mistakeContext).not.toBe(original);
        const reordered = solve.mistakeContext;
        solve.steps[0].turnGaps![0] += 1e-10;
        markMistakes(data, 5);
        expect(solve.mistakeContext).not.toBe(reordered);
        expect(solve.mistakes!.find(m => m.kind === 'extraLookCross')!.estimatedSeconds).toBeCloseTo(.8 + 1e-10, 12);
    });

    test('uses only prior chronological samples and leaves the input order untouched', () => {
        const solve = makeSolve({ id: 'target', steps: [makeStep(StepName.OLL, 10, { recognitionTime: 2 })] });
        const data = withPriorPauses(solve, { recognitionTime: .2 });
        const future = makeSolve({ id: 'future', date: new Date(solve.date.getTime() + 1000), steps: [makeStep(StepName.OLL, 10, { recognitionTime: 9 })] });
        const shuffled = [future, solve, ...data.slice(0, -1).reverse()], before = shuffled.map(s => s.id);
        markMistakes(shuffled, 5);
        expect(solve.mistakes!.find(m => m.kind === 'ollRecognition')!.estimatedSeconds).toBeCloseTo(1.8);
        expect(shuffled.map(s => s.id)).toEqual(before);
        expect(data.slice(0, -1).every(s => !pauseReasons(s)?.length)).toBe(true);
    });

    test.each(['method', 'step', 'dnf', 'corrupt', 'skipped', 'missing', 'duplicates'])('does not fill warmup with another method/stage or invalid samples: %s', scenario => {
        const solve = makeSolve({ steps: [makeStep(StepName.OLL, 10, { recognitionTime: 4, turnGaps: [4] })] });
        const data = withPriorPauses(solve, { recognitionTime: .2 });
        data.slice(0, -1).forEach(item => {
            if (scenario === 'method') item.method = MethodName.Roux;
            if (scenario === 'step') item.steps[0].name = StepName.PLL;
            if (scenario === 'dnf') item.dnf = true;
            if (scenario === 'corrupt') item.isCorrupt = true;
            if (scenario === 'skipped') { item.steps[0].case = 'Solved'; item.steps[0].turns = 0; }
            if (scenario === 'missing') { item.steps[0].recognitionTime = NaN; item.steps[0].turnGaps = undefined; }
        });
        const input = scenario === 'duplicates' ? [{ ...data[0], steps: Array(5).fill(data[0].steps[0]) }, solve] : data;
        markMistakes(input, 5);
        expect(pauseReasons(solve)).toEqual([]);
    });

    test('follows the most recent stage samples in the selected window', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.OLL, 10, { recognitionTime: 1 })] });
        const data = withPriorPauses(solve, { recognitionTime: 3 }, 10);
        data.slice(5, 10).forEach(s => { s.steps[0].recognitionTime = .2; });
        markMistakes(data, 10);
        expect(pauseReasons(solve)).toEqual([]);
        markMistakes(data, 5);
        expect(solve.mistakes!.find(m => m.kind === 'ollRecognition')!.estimatedSeconds).toBeCloseTo(.8);
    });

    test('handles normal zero-variance gaps and invalid timings, and refreshes edited pause data and legacy caches', () => {
        const solve = makeSolve({ steps: [makeStep(StepName.PLL, 10, { recognitionTime: .1, turnGaps: [.1, .1] })] });
        const data = withPriorPauses(solve);
        markMistakes(data, 5);
        expect(pauseReasons(solve)).toEqual([]);
        solve.steps[0].turnGaps = [.1, .8, NaN, Infinity, -1, 100];
        markMistakes(data, 5);
        expect(solve.mistakes!.find(m => m.kind === 'extraLookPll')!.estimatedSeconds).toBeCloseTo(.7);
        data.forEach(s => { s.mistakeContext = '6:5:old'; s.mistakes = [{ kind: 'pllRecognition', estimatedSeconds: 100 }]; });
        markMistakes(data, 5, true);
        expect(solve.mistakeContext).toMatch(/^8:5:/);
        expect(solve.mistakes!.some(m => m.kind === 'pllRecognition')).toBe(false);
    });
});

describe('recent mistake counts', () => {
    test('uses exactly the selected recent sliding window, and excludes corrupt solves', () => {
        const data = Array.from({ length: 12 }, (_, i) => makeSolve({
            id: String(i), date: new Date(2024, 0, 1, 0, 0, i),
            mistakes: i < 2 ? [{ kind: 'crossMoves' }] : [{ kind: 'singleUndo', step: StepName.PLL, auf: true }],
        }));
        const before = data.map(s => s.id);
        const summary = summarizeMistakes(data.slice().reverse(), 10);
        expect(summary.sampleCount).toBe(10);
        expect(summary.counts.find(r => r.kind === 'crossMoves')?.count).toBe(0);
        expect(summary.counts[0]).toEqual({ kind: 'singleUndo', step: StepName.PLL, auf: true, count: 10 });
        expect(data.map(s => s.id)).toEqual(before);
        const corrupt = makeSolve({ isCorrupt: true, date: new Date('2030-01-01'), mistakes: [{ kind: 'crossMoves' }] });
        expect(summarizeMistakes([...data, corrupt], 10)).toEqual(summary);
        expect(summarizeMistakes(data, 12).counts.find(r => r.kind === 'crossMoves')?.count).toBe(2);
        expect(summarizeMistakes(data, 0).sampleCount).toBe(0);
        expect(summarizeMistakes(data, Infinity).sampleCount).toBe(0);
        expect(summarizeMistakes(data, 100).sampleCount).toBe(12);
    });

    test('counts each type once per solve, allows overlapping types, and keeps zero-count categories', () => {
        const summary = summarizeMistakes([
            makeSolve({ mistakes: [{ kind: 'crossMoves' }, { kind: 'crossMoves' }, { kind: 'f2lMoves' }] }),
            makeSolve({ mistakes: [{ kind: 'f2lMoves' }] }),
            makeSolve(),
        ], 10);
        expect(summary.sampleCount).toBe(3);
        expect(summary.counts[0]).toEqual({ kind: 'f2lMoves', count: 2 });
        expect(summary.counts.find(r => r.kind === 'crossMoves')?.count).toBe(1);
        expect(summary.counts).toHaveLength(Object.keys(MISTAKES).length - 8);
        expect(summary.counts.some(row => row.kind === 'slowStep' && !row.step)).toBe(false);
        expect(summarizeMistakes([], 10).counts.every(row => row.count === 0)).toBe(true);
    });

    test('keeps single/multi undos in different steps and AUF contexts as separate chart rows', () => {
        const summary = summarizeMistakes([makeSolve({ mistakes: [
            { kind: 'singleUndo', step: StepName.Cross },
            { kind: 'singleUndo', step: StepName.F2L_1 },
            { kind: 'sequenceUndo', step: StepName.F2L_1 },
            { kind: 'singleUndo', step: StepName.PLL, auf: true },
            { kind: 'singleUndo', step: StepName.PLL, auf: false },
        ] })], 5);
        expect(summary.counts.filter(r => r.count === 1)).toHaveLength(5);
    });

    test('renders a ranked, accessible count chart with visible counts and documented rules', () => {
        render(<MistakeChart summary={summarizeMistakes([makeSolve({ mistakes: [{ kind: 'singleUndo', step: StepName.PLL, auf: true }] })], 5)} />);
        expect(screen.getByRole('region', { name: 'Mistakes' })).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Mistakes in the last 1 solve' })).toBeTruthy();
        expect(screen.getByRole('listitem', { name: 'PLL AUF: Single-move undo: 1 of 1 solves' })).toBeTruthy();
        expect(screen.getByText('1')).toBeTruthy();
        expect(screen.getByText('How mistakes are detected')).toBeTruthy();
        const label = screen.getByRole('button', { name: 'About PLL AUF: Single-move undo' });
        expect(label.textContent).toBe('PLL AUF: Single-move undo ⓘ');
        expect(label.classList.contains('text-decoration-none')).toBe(true);
    });

    test('uses capitalized names and distinguishes possible algorithm mistakes from inefficient early steps', () => {
        for (const kind of ['crossMoves', 'f2lMoves'] as const) {
            expect(MISTAKES[kind].label).toMatch(/: Inefficient solution$/);
        }
        for (const kind of ['ollMoves', 'pllMoves'] as const) expect(MISTAKES[kind].label).toContain('Possible incorrect');
        for (const { label } of Object.values(MISTAKES)) {
            expect(label).not.toMatch(/extra moves/i);
            expect(label.split(': ').pop()).toMatch(/^[A-Z]/);
        }
    });

    test('scales bars to the most frequent mistake while preserving solve counts', () => {
        render(<MistakeChart summary={{ windowSize: 1000, sampleCount: 10, counts: [
            { kind: 'crossMoves', count: 4 },
            { kind: 'f2lMoves', count: 2 },
            { kind: 'ollMoves', count: 0 },
        ] }} />);
        expect(screen.getAllByRole('progressbar', { hidden: true }).map(bar => bar.getAttribute('aria-valuenow')))
            .toEqual(['100', '50', '0']);
        for (const row of screen.getAllByRole('listitem')) {
            expect(row.innerHTML).toContain('--bs-progress-bar-bg: rgb(255, 99, 132)');
        }
        expect(screen.getByText('4')).toBeTruthy();
        expect(screen.getByText('2')).toBeTruthy();
        expect(screen.queryByText(/\d+ \/ \d+/)).toBeNull();
        expect(screen.queryByText(/Selected sliding window:/)).toBeNull();
    });

    test('keeps zero-count bars empty when no mistakes were detected', () => {
        render(<MistakeChart summary={summarizeMistakes([], 100)} />);
        expect(screen.getAllByRole('progressbar', { hidden: true }).every(bar => bar.getAttribute('aria-valuenow') === '0')).toBe(true);
    });

    test('clicking a bar selects its exact mistake and keeps zero-count bars disabled', () => {
        const select = jest.fn();
        render(<MistakeChart summary={{ windowSize: 5, sampleCount: 2, counts: [
            { kind: 'singleUndo', step: StepName.PLL, auf: true, count: 1 },
            { kind: 'crossMoves', count: 0 },
        ] }} select={select} />);
        fireEvent.click(screen.getByRole('button', { name: 'View solves with PLL AUF: Single-move undo' }));
        expect(select).toHaveBeenCalledWith({ kind: 'singleUndo', step: StepName.PLL, auf: true, count: 1 });
        const empty = screen.getByRole('button', { name: 'View solves with Cross: Inefficient solution' });
        expect(empty.getAttribute('disabled')).not.toBeNull();
        fireEvent.click(empty);
        expect(select).toHaveBeenCalledTimes(1);
    });

    test('starts compact and lets the user expand to full height and collapse again', () => {
        render(<MistakeChart summary={summarizeMistakes([], 100)} />);
        const content = screen.getByRole('group', { name: 'Mistakes details' });
        const expand = screen.getByRole('button', { name: 'Expand' });
        expect(expand.getAttribute('aria-expanded')).toBe('false');
        expect(expand.getAttribute('aria-controls')).toBe(content.id);
        expect(content.classList.contains('ratio-4x3')).toBe(true);
        fireEvent.click(expand);
        const collapse = screen.getByRole('button', { name: 'Collapse' });
        expect(collapse.getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByRole('button', { name: 'About Cross: Inefficient solution' })).toBeTruthy();
        fireEvent.click(collapse);
        expect(screen.getByRole('button', { name: 'Expand' }).getAttribute('aria-expanded')).toBe('false');
    });

    test.each(Object.keys(MISTAKES) as MistakeKind[])('explains %s in a concise, keyboard-accessible tooltip', async kind => {
        const mistake = { kind, step: kind === 'slowStep' ? StepName.PLL : undefined };
        render(<MistakeChart summary={{ windowSize: 5, sampleCount: 1, counts: [{ ...mistake, count: 1 }] }} />);
        const button = screen.getByRole('button', { name: `About ${mistakeLabel(mistake)}` });
        expect(screen.queryByRole('tooltip')).toBeNull();
        fireEvent.focus(button);
        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip.textContent).toBe(MISTAKES[kind].rule);
        expect(tooltip.textContent!.split(/\s+/).length).toBeLessThanOrEqual(35);
        fireEvent.blur(button);
    });

    test('provides distinct tooltip targets for the same mistake in different steps', async () => {
        render(<MistakeChart summary={{ windowSize: 5, sampleCount: 1, counts: [
            { kind: 'singleUndo', step: StepName.Cross, count: 1 },
            { kind: 'singleUndo', step: StepName.PLL, auf: true, count: 1 },
        ] }} />);
        fireEvent.mouseOver(screen.getByText('PLL AUF: Single-move undo ⓘ'));
        expect((await screen.findByRole('tooltip')).id).toBe('mistake-singleUndo:PLL:auf');
    });
});
