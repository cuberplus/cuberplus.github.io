import { calculateMovingAverage, calculateMovingStdDev } from '../Helpers/MathHelpers';
import { analyzeMoveMistakes, coreMovesCount, typicalCaseMoves } from './MoveAnalysis';
import { consolidateMoves, countMovesExcludingRotations, getAufMovesForSolve, tokenizeMoves } from '../Data/CsvParser';
import { Solve, StepName } from '../Models/Types';
import { memoize } from '../Helpers/memoize';
import lastLayerMoves from '../../../shared/config/last-layer-moves.json';

import { MISTAKES } from '../../../shared/mistakes';
export { MISTAKES } from '../../../shared/mistakes';
export type MistakeKind = keyof typeof MISTAKES;
export interface Mistake { kind: MistakeKind; step?: StepName; auf?: boolean; estimatedSeconds?: number; stepCosts?: Partial<Record<StepName, number>>; }
export interface MistakeSummary { sampleCount: number; windowSize: number; counts: (Mistake & { count: number })[]; }
export const mistakeKey = ({ kind, step, auf }: Mistake) => `${kind}:${step ?? ''}:${auf ? 'auf' : ''}`;
export const mistakeLabel = ({ kind, step, auf }: Mistake) => kind === 'slowStep' ? `Unusually slow ${step}` : `${step ? `${step}${auf ? ' AUF' : ''}: ` : ''}${step && kind.startsWith('extraLook') ? 'Extra Look' : MISTAKES[kind].label}`;
export function rankedMistakes(solve: Solve): Mistake[] {
    const reasons = solve.mistakes ?? [], costs = reasons.some(m => m.estimatedSeconds === undefined) ? markMistakes([{ ...solve, mistakeContext: undefined }], 5)[0].mistakes : reasons;
    return reasons.map(mistake => ({ ...mistake, estimatedSeconds: mistake.estimatedSeconds ?? costs?.find(cost => mistakeKey(cost) === mistakeKey(mistake))?.estimatedSeconds ?? 0 }))
        .sort((a, b) => b.estimatedSeconds - a.estimatedSeconds);
}
const PAIRS = new Set([StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4]);
const LAST_LAYER = new Set([StepName.OLL, StepName.PLL, StepName.EOLL, StepName.COLL, StepName.EPLL, StepName.CPLL, StepName.CMLL, StepName.ZBLL]);
const turningPace = (step: Solve['steps'][number], core: number, extraLook = 0, auf = false) => {
    const aufTurns = LAST_LAYER.has(step.name) ? Math.max(0, countMovesExcludingRotations(consolidateMoves(step.moves)) - core) : 0;
    const aufTime = LAST_LAYER.has(step.name) ? step.preAufTime + step.postAufTime : 0;
    return Math.max(0, auf ? aufTime : step.executionTime - extraLook - aufTime) / Math.max(1, auf ? aufTurns : step.turns - aufTurns);
};
const factsForFace = memoize((face: string) => memoize((moves: string) => {
    const tokens = tokenizeMoves(consolidateMoves(moves)), auf = new Set([face, `${face}'`]);
    return { core: coreMovesCount(tokens, auf), issues: analyzeMoveMistakes(tokens, auf) };
}));
const moveFacts = (moves: string, auf: Set<string>) => factsForFace(String(auf.values().next().value))(moves);
const multiply = Math.imul;
let latest: { context: string; reasons: Pick<Solve, 'mistakes' | 'isMistake'>[] } | undefined;
const moveHash = memoize((moves: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < moves.length; i++) hash = multiply(hash ^ moves.charCodeAt(i), 16777619);
    return hash;
});
type Moments = { count: number; sum: number; squares: number };
function pauseCosts(solves: Solve[], windowSize: number): number[][][] {
    const costs = solves.map(solve => solve.steps.map(() => [0, 0, 0]));
    const histories = new Map<string, Moments & { batches: Moments[] }>(), limit = Math.max(5, Number.isFinite(windowSize) ? Math.floor(windowSize) : 5);
    for (const { solve, index } of solves.map((solve, index) => ({ solve, index })).sort((a, b) => a.solve.date.getTime() - b.solve.date.getTime() || a.solve.id.localeCompare(b.solve.id))) {
        const pending: { history: Moments & { batches: Moments[] }; batch: Moments }[] = [];
        solve.steps.forEach((step, stepIndex) => {
            if (!(step.time > 0) || !(step.turns > 0)) return;
            const readings = [step.case !== 'Solved' && step.recognitionTime <= step.time ? [step.recognitionTime] : [],
                step.turnGaps ?? [], step.postAufTime <= step.executionTime && step.postAufTime > 0 ? [step.postAufTime] : []];
            readings.forEach((raw, metric) => {
                const values = raw.filter(value => Number.isFinite(value) && value >= 0 && (metric !== 1 || value <= step.executionTime));
                if (!values.length) return;
                const key = `${solve.method}:${step.name}:${metric}`, history = histories.get(key) ?? { count: 0, sum: 0, squares: 0, batches: [] };
                histories.set(key, history);
                if (history.batches.length >= 5) {
                    const mean = history.sum / history.count;
                    const threshold = mean + 2 * Math.sqrt(Math.max(0, (history.squares - history.sum * mean) / (history.count - 1)));
                    costs[index][stepIndex][metric] = values.reduce((loss, value) => loss + (value > threshold + 8 * Number.EPSILON * Math.max(1, threshold) ? value - mean : 0), 0);
                }
                if (!pending.some(item => item.history === history)) pending.push({ history, batch: { count: values.length, sum: values.reduce((a, b) => a + b, 0), squares: values.reduce((a, b) => a + b * b, 0) } });
            });
        });
        // Score every step before learning from this solve, including duplicate step records.
        for (const { history, batch } of pending) {
            history.batches.push(batch);
            const expired = history.batches.at(-limit - 1);
            for (const field of ['count', 'sum', 'squares'] as const) history[field] += batch[field] - (expired?.[field] ?? 0);
        }
    }
    return costs;
}

export function getMistakeMap(values: number[], windowSize: number): boolean[] {
    const average = calculateMovingAverage(values, windowSize), stdDev = calculateMovingStdDev(values, windowSize);
    return values.map((value, i) => value > average[Math.max(0, i - windowSize)] + 3 * stdDev[Math.max(0, i - windowSize)]);
}

export function markMistakes(solves: Solve[], windowSize: number, prepared = false): Solve[] {
    const valid = solves.filter(s => !s.isCorrupt && !s.dnf);
    // Only freshly worker-analyzed, unchanged datasets may bypass content hashing.
    const preparedContext = valid[0]?.mistakeContext;
    if (prepared && preparedContext?.startsWith(`7:${windowSize}:`) && valid.every(s => s.mistakeContext === preparedContext && s.mistakes)) return solves;
    let hash = 2166136261;
    for (const solve of valid) {
        const key = `${solve.id}:${solve.time}:${solve.method}:${solve.source}:${solve.date.getTime()}:${solve.crossColor}:${solve.executionTime}:${solve.turns}:${JSON.stringify(solve.pairChoices)}:${solve.steps.map(s => `${s.name},${s.case},${s.time},${s.turns},${s.recognitionTime},${s.executionTime},${s.preAufTime},${s.postAufTime},${moveHash(JSON.stringify(s.turnGaps ?? []))},${moveHash(s.moves)}`).join(';')}`;
        for (let i = 0; i < key.length; i++) hash = multiply(hash ^ key.charCodeAt(i), 16777619);
    }
    const context = `7:${windowSize}:${hash}`;
    if (valid.every(solve => solve.mistakeContext === context && solve.mistakes)) return solves;
    if (latest?.context === context) {
        valid.forEach((solve, i) => Object.assign(solve, latest!.reasons[i], { mistakeContext: context })); return solves;
    }
    const pauses = pauseCosts(valid, windowSize);
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
            const mistake = { kind, step, auf, estimatedSeconds: Math.min(solve.time, Math.max(0, cost ?? 0)) };
            const key = mistakeKey(mistake), previous = reasons.get(key);
            const stepCosts = { ...previous?.stepCosts };
            if (actualStep) stepCosts[actualStep] = (stepCosts[actualStep] ?? 0) + mistake.estimatedSeconds;
            reasons.set(key, { ...mistake, stepCosts, estimatedSeconds: Math.min(solve.time, (previous?.estimatedSeconds ?? 0) + mistake.estimatedSeconds) });
        };
        if (slowSolves[i]) add('slowSolve', undefined, undefined, solve.time - (average[Math.max(0, i - windowSize)] ?? solve.time));
        slowSteps.forEach(({ actualStep, step, map, times, average }) => { if (map[i]) add('slowStep', step, undefined, times[i] - (average[Math.max(0, i - windowSize)] ?? times[i]), actualStep); });
        const auf = getAufMovesForSolve(solve);
        for (const choice of solve.pairChoices ?? []) { const step = solve.steps.findIndex(s => s.name === choice.step), current = solve.steps[step]; add('f2lChoice', choice.step, false, current ? Math.min(current.executionTime, choice.wastedMoves * turningPace(current, 0, pauses[i][step][1])) : 0); }
        for (const [stepIndex, current] of solve.steps.entries()) {
            const { name, turns, moves, case: caseName, executionTime } = current, [recognitionLoss, extraLook, aufLoss] = pauses[i][stepIndex];
            const pair = PAIRS.has(name), ll = LAST_LAYER.has(name), extraLookKind = pair || name === StepName.F2L ? 'extraLookF2l' : name === StepName.Cross ? 'extraLookCross' : name === StepName.OLL ? 'extraLookOll' : name === StepName.PLL ? 'extraLookPll' : undefined;
            const facts = moveFacts(moves, auf), turnTime = turningPace(current, facts.core, extraLook);
            const recognitionKind = pair ? 'f2lPause' : name === StepName.OLL ? 'ollRecognition' : name === StepName.PLL ? 'pllRecognition' : undefined;
            if (recognitionKind && recognitionLoss > 0) add(recognitionKind, undefined, undefined, recognitionLoss, name);
            if (extraLookKind && extraLook > 0) add(extraLookKind, name, false, Math.min(executionTime, extraLook));
            if (name === StepName.Cross && Number.isFinite(turns) && turns > 8) add('crossMoves', undefined, undefined, (turns - 8) * turnTime, name);
            if (pair && Number.isFinite(turns) && turns > 12) add('f2lMoves', undefined, undefined, (turns - 12) * turnTime, name);
            const baseline = thresholds.get(`${solve.method}:${name}:${caseName}`), fallback = solve.method === 'CFOP' ? lastLayerMoves[`${name}-${caseName}` as keyof typeof lastLayerMoves] : undefined;
            const expected = baseline !== undefined ? baseline - 2 : fallback, undone = facts.issues.filter(issue => !issue.auf && issue.kind === 'sequenceUndo' && issue.wastedMoves >= 6).reduce((sum, issue) => sum + issue.wastedMoves, 0);
            const incorrect = (name === StepName.OLL || name === StepName.PLL) && caseName !== 'Solved' && (undone > 0 || expected !== undefined && facts.core > expected + 2);
            if (incorrect) add(name === StepName.OLL ? 'ollMoves' : 'pllMoves', undefined, undefined, Math.min(executionTime, Math.max(undone, facts.core - (expected ?? facts.core)) * turnTime), name);
            if (ll && aufLoss > 0) add('slowAuf', undefined, undefined, aufLoss, name);
            for (const issue of facts.issues) if (!incorrect || issue.auf || issue.kind !== 'sequenceUndo') add(issue.kind, name, ll && issue.auf, Math.min(executionTime, issue.wastedMoves * turningPace(current, facts.core, extraLook, ll && issue.auf)));
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
export function summarizeMistakes(solves: Solve[], windowSize: number, disabled: string[] = []): MistakeSummary {
    const recent = mistakeWindow(solves, windowSize);
    const counts = new Map<string, Mistake & { count: number }>();
    (Object.keys(MISTAKES) as MistakeKind[]).filter(kind => !kind.startsWith('extraLook') && !['slowStep', 'singleUndo', 'sequenceUndo', 'redundantTurns'].includes(kind))
        .forEach(kind => counts.set(mistakeKey({ kind }), { kind, count: 0 }));
    for (const solve of recent) {
        const unique = new Map((solve.mistakes ?? []).map(mistake => [mistakeKey(mistake), mistake]));
        unique.forEach(({ kind, step, auf }, key) => counts.set(key, { kind, step, auf, count: (counts.get(key)?.count ?? 0) + 1 }));
    }
    return { sampleCount: recent.length, windowSize: Number.isFinite(windowSize) ? Math.max(0, Math.floor(windowSize)) : 0, counts: Array.from(counts.values()).filter(item => !disabled.includes(item.kind)).sort((a, b) => b.count - a.count) };
}
