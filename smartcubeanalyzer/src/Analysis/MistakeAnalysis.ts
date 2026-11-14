import { calculateMovingAverage, calculateMovingStdDev } from '../Helpers/MathHelpers';
import { analyzeMoveMistakes, coreMovesCount, MoveMistake, typicalCaseMoves } from './MoveAnalysis';
import { consolidateMoves, getAufMovesForSolve, tokenizeMoves } from '../Data/CsvParser';
import { Solve, StepName } from '../Models/Types';
import { memoize } from '../Helpers/memoize';

const CASE_MOVES_RULE = 'More than 2 extra core moves versus your typical count for this case and method (5+ examples required). AUF excluded.';
export const MISTAKES = {
    crossMoves: { label: 'Cross: Inefficient solution', rule: 'More than 8 slice turns for the cross. An intentional X-cross can also trigger this.' },
    f2lMoves: { label: 'F2L pair: Inefficient solution', rule: 'More than 12 slice turns for any individual F2L pair.' },
    ollMoves: { label: 'OLL: Inefficient solution', rule: CASE_MOVES_RULE },
    pllMoves: { label: 'PLL: Inefficient solution', rule: CASE_MOVES_RULE },
    f2lPause: { label: 'F2L: Long recognition gap', rule: 'More than 2 seconds before starting any F2L pair.' },
    ollRecognition: { label: 'OLL: Long recognition', rule: 'More than 2 seconds before starting OLL.' },
    pllRecognition: { label: 'PLL: Long recognition', rule: 'More than 2 seconds before starting PLL.' },
    singleUndo: { label: 'Single-move undo', rule: "A move immediately cancelled by its inverse (R R') in the named step or AUF." },
    sequenceUndo: { label: 'Multi-move undo', rule: "Two or more moves immediately undone in reverse (R U U' R') in this step or AUF. The inner single undo isn't counted again." },
    redundantTurns: { label: 'Redundant same-face turns', rule: 'Explicit 3+ quarter turns (U3, U4). Sensor-split turns such as U U are consolidated into U2 before analysis; actual undos are retained.' },
    slowAuf: { label: 'AUF: Slow adjustment', rule: 'More than 0.5 seconds in the post-AUF of a last-layer step. Pre-AUF is excluded.' },
    slowStep: { label: 'Unusually slow', rule: 'This step exceeds its rolling average plus 3 standard deviations, using the selected window. F2L includes outliers in any pair.' },
    slowSolve: { label: 'Unusually slow solve', rule: 'Solve time exceeds its rolling average plus 3 standard deviations, using the selected window.' },
} as const;
export type MistakeKind = keyof typeof MISTAKES;
export interface Mistake { kind: MistakeKind; step?: StepName; auf?: boolean; estimatedSeconds?: number; stepCosts?: Partial<Record<StepName, number>>; }
export interface MistakeSummary { sampleCount: number; windowSize: number; counts: (Mistake & { count: number })[]; }
export const mistakeKey = ({ kind, step, auf }: Mistake) => `${kind}:${step ?? ''}:${auf ? 'auf' : ''}`;
export const mistakeLabel = ({ kind, step, auf }: Mistake) => kind === 'slowStep' ? `Unusually slow ${step}` : `${step ? `${step}${auf ? ' AUF' : ''}: ` : ''}${MISTAKES[kind].label}`;
export function rankedMistakes(solve: Solve): Mistake[] {
    return [...solve.mistakes ?? []].map(mistake => ({ ...mistake, estimatedSeconds: mistake.estimatedSeconds ?? estimateMistakeCost(solve, mistake) }))
        .sort((a, b) => b.estimatedSeconds - a.estimatedSeconds);
}
export function estimateMistakeCost(solve: Solve, { kind, step }: Mistake): number {
        const steps = solve.steps.filter(s => !step || s.name === step);
        const max = (value: (s: Solve['steps'][number]) => number) => Math.max(0, ...steps.map(value));
        const turnTime = solve.executionTime > 0 && solve.turns > 0 ? solve.executionTime / solve.turns : 0.2;
        switch (kind) {
            case 'f2lPause': return max(s => PAIRS.has(s.name) ? s.recognitionTime - 2 : 0);
            case 'ollRecognition': case 'pllRecognition': return max(s => s.name === (kind === 'ollRecognition' ? StepName.OLL : StepName.PLL) ? s.recognitionTime - 2 : 0);
            case 'slowAuf': return max(s => LAST_LAYER.has(s.name) ? s.postAufTime - 0.5 : 0);
            case 'crossMoves': return max(s => s.name === StepName.Cross ? s.turns - 8 : 0) * turnTime;
            case 'f2lMoves': return max(s => PAIRS.has(s.name) ? s.turns - 12 : 0) * turnTime;
            case 'sequenceUndo': return 4 * turnTime;
            case 'singleUndo': return 2 * turnTime;
            case 'ollMoves': case 'pllMoves': return 3 * turnTime;
            case 'redundantTurns': return turnTime;
            default: return Math.max(0, ...steps.map(s => s.time * 0.1));
        }
}
const PAIRS = new Set([StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4]);
const LAST_LAYER = new Set([StepName.OLL, StepName.PLL, StepName.EOLL, StepName.COLL, StepName.EPLL, StepName.CPLL, StepName.CMLL, StepName.ZBLL]);
type MoveFacts = { core: number; issues: MoveMistake[] };
const moveFactsCache = new Map<string, Map<string, MoveFacts>>();
const multiply = Math.imul;
let latest: { context: string; reasons: Pick<Solve, 'mistakes' | 'isMistake'>[] } | undefined;
const moveHash = memoize((moves: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < moves.length; i++) hash = multiply(hash ^ moves.charCodeAt(i), 16777619);
    return hash;
});
function moveFacts(moves: string, auf: Set<string>): MoveFacts {
    const face = String(auf.values().next().value);
    let cache = moveFactsCache.get(face);
    if (!cache) moveFactsCache.set(face, cache = new Map<string, MoveFacts>());
    let facts = cache.get(moves);
    if (!facts) {
        const tokens = tokenizeMoves(consolidateMoves(moves));
        cache.set(moves, facts = { core: coreMovesCount(tokens, auf), issues: analyzeMoveMistakes(tokens, auf) });
    }
    return facts;
}

export function getMistakeMap(values: number[], windowSize: number): boolean[] {
    const average = calculateMovingAverage(values, windowSize), stdDev = calculateMovingStdDev(values, windowSize);
    return values.map((value, i) => value > average[Math.max(0, i - windowSize)] + 3 * stdDev[Math.max(0, i - windowSize)]);
}

export function markMistakes(solves: Solve[], windowSize: number, prepared = false): Solve[] {
    const valid = solves.filter(s => !s.isCorrupt && !s.dnf);
    // Only freshly worker-analyzed, unchanged datasets may bypass content hashing.
    const preparedContext = valid[0]?.mistakeContext;
    if (prepared && preparedContext?.startsWith(`3:${windowSize}:`) && valid.every(s => s.mistakeContext === preparedContext && s.mistakes)) return solves;
    let hash = 2166136261;
    for (const solve of valid) {
        const key = `${solve.id}:${solve.time}:${solve.method}:${solve.source}:${solve.date.getTime()}:${solve.crossColor}:${solve.executionTime}:${solve.turns}:${solve.steps.map(s => `${s.name},${s.case},${s.time},${s.turns},${s.recognitionTime},${s.executionTime},${s.postAufTime},${moveHash(s.moves)}`).join(';')}`;
        for (let i = 0; i < key.length; i++) hash = multiply(hash ^ key.charCodeAt(i), 16777619);
    }
    const context = `3:${windowSize}:${hash}`;
    if (valid.every(solve => solve.mistakeContext === context && solve.mistakes)) return solves;
    if (latest?.context === context) {
        valid.forEach((solve, i) => Object.assign(solve, latest!.reasons[i], { mistakeContext: context }));
        return solves;
    }
    const examples = new Map<string, number[]>();
    const stepTimes = new Map<StepName, number[]>();
    for (const [i, solve] of valid.entries()) {
        const seen = new Set<StepName>();
        for (const { name, case: caseName, moves, time } of solve.steps) {
            if (!seen.has(name)) {
                if (!stepTimes.has(name)) stepTimes.set(name, new Array<number>(valid.length).fill(0));
                stepTimes.get(name)![i] = time ?? 0; seen.add(name);
            }
            if ((name !== StepName.OLL && name !== StepName.PLL) || !caseName || caseName === 'Solved' || !moves) continue;
            const key = `${solve.method}:${name}:${caseName}`;
            if (!examples.has(key)) examples.set(key, []);
            examples.get(key)!.push(moveFacts(moves, getAufMovesForSolve(solve)).core);
        }
    }
    const thresholds = new Map<string, number>();
    examples.forEach((values, key) => { if (values.length >= 5) thresholds.set(key, typicalCaseMoves(values.sort((a, b) => a - b)) + 2); });
    const slowSolves = getMistakeMap(valid.map(s => s.time), windowSize);
    const average = calculateMovingAverage(valid.map(s => s.time), windowSize);
    const slowSteps = Array.from(stepTimes, ([actualStep, times]) => ({ actualStep, step: PAIRS.has(actualStep) ? StepName.F2L : actualStep, times, average: calculateMovingAverage(times, windowSize), map: getMistakeMap(times, windowSize) }));
    valid.forEach((solve, i) => {
        const reasons = new Map<string, Mistake>();
        const add = (kind: MistakeKind, step?: StepName, auf?: boolean, cost?: number, actualStep = step) => {
            const mistake = { kind, step, auf, estimatedSeconds: 0 };
            mistake.estimatedSeconds = Math.min(solve.time, Math.max(0, cost ?? estimateMistakeCost(solve, mistake)));
            const key = mistakeKey(mistake), previous = reasons.get(key);
            const stepCosts = { ...previous?.stepCosts };
            if (actualStep) stepCosts[actualStep] = (stepCosts[actualStep] ?? 0) + mistake.estimatedSeconds;
            reasons.set(key, { ...mistake, stepCosts, estimatedSeconds: Math.min(solve.time, (previous?.estimatedSeconds ?? 0) + mistake.estimatedSeconds) });
        };
        if (slowSolves[i]) add('slowSolve', undefined, undefined, solve.time - (average[Math.max(0, i - windowSize)] ?? solve.time));
        slowSteps.forEach(({ actualStep, step, map, times, average }) => { if (map[i]) add('slowStep', step, undefined, times[i] - (average[Math.max(0, i - windowSize)] ?? times[i]), actualStep); });
        const auf = getAufMovesForSolve(solve);
        for (const { name, turns, moves, case: caseName, recognitionTime, time, postAufTime, executionTime } of solve.steps) {
            const pair = PAIRS.has(name), ll = LAST_LAYER.has(name);
            const turnTime = executionTime > 0 && turns > 0 ? executionTime / turns : 0.2;
            if (name === StepName.Cross && Number.isFinite(turns) && turns > 8) add('crossMoves', undefined, undefined, (turns - 8) * turnTime, name);
            if (pair && Number.isFinite(turns) && turns > 12) add('f2lMoves', undefined, undefined, (turns - 12) * turnTime, name);
            if (Number.isFinite(recognitionTime) && recognitionTime > 2 && recognitionTime <= time) {
                if (pair) add('f2lPause', undefined, undefined, recognitionTime - 2, name);
                if (name === StepName.OLL) add('ollRecognition', undefined, undefined, recognitionTime - 2, name);
                if (name === StepName.PLL) add('pllRecognition', undefined, undefined, recognitionTime - 2, name);
            }
            const threshold = thresholds.get(`${solve.method}:${name}:${caseName}`);
            const facts = moveFacts(moves, auf);
            if (threshold !== undefined && moves && facts.core > threshold) add(name === StepName.OLL ? 'ollMoves' : 'pllMoves', undefined, undefined, (facts.core - threshold + 2) * turnTime, name);
            if (ll && Number.isFinite(postAufTime) && postAufTime > 0.5 && postAufTime <= executionTime) add('slowAuf', undefined, undefined, postAufTime - 0.5, name);
            for (const issue of facts.issues) add(issue.kind, name, ll && issue.auf, issue.wastedMoves * turnTime);
        }
        solve.mistakes = Array.from(reasons.values());
        solve.isMistake = reasons.size > 0;
        solve.mistakeContext = context;
    });
    latest = { context, reasons: valid.map(({ mistakes, isMistake }) => ({ mistakes, isMistake })) }; return solves;
}

export function mistakeWindow(solves: Solve[], windowSize: number): Solve[] {
    const size = Number.isFinite(windowSize) ? Math.max(0, Math.floor(windowSize)) : 0;
    return size ? solves.filter(s => !s.isCorrupt).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-size) : [];
}
export function summarizeMistakes(solves: Solve[], windowSize: number): MistakeSummary {
    const recent = mistakeWindow(solves, windowSize);
    const counts = new Map<string, Mistake & { count: number }>();
    (Object.keys(MISTAKES) as MistakeKind[]).filter(kind => !['slowStep', 'singleUndo', 'sequenceUndo', 'redundantTurns'].includes(kind))
        .forEach(kind => counts.set(mistakeKey({ kind }), { kind, count: 0 }));
    for (const solve of recent) {
        const unique = new Map((solve.mistakes ?? []).map(mistake => [mistakeKey(mistake), mistake]));
        unique.forEach(({ kind, step, auf }, key) => counts.set(key, { kind, step, auf, count: (counts.get(key)?.count ?? 0) + 1 }));
    }
    return { sampleCount: recent.length, windowSize: Number.isFinite(windowSize) ? Math.max(0, Math.floor(windowSize)) : 0, counts: Array.from(counts.values()).sort((a, b) => b.count - a.count) };
}
