import { Option } from "../Models/Types";
import { Const } from "../Models/Constants";
import { CrossColor, MethodName, Solve, Step, StepName, StepTotals } from "../Models/Types";
import { calculateMovingAverageChopped } from "./MathHelpers";

export function GetEmptyStep(): Step {
    return { time: 0, executionTime: 0, recognitionTime: 0, preAufTime: 0, postAufTime: 0,
        turns: 0, tps: 0, moves: "", case: "", name: StepName.Cross };
}

export function GetEmptySolve(): Solve {
    return {
        id: "", source: 'cubeast', rawSourceId: "", rawSource: "", time: 0, date: new Date(),
        crossColor: CrossColor.Unknown, scramble: "", tps: 0, recognitionTime: 0, inspectionTime: null,
        executionTime: 0, preAufTime: 0, postAufTime: 0, turns: 0,
        steps: [GetEmptyStep(), GetEmptyStep(), GetEmptyStep(), GetEmptyStep(), GetEmptyStep(), GetEmptyStep(), GetEmptyStep(), GetEmptyStep(), GetEmptyStep()],
        isCorrupt: false, method: MethodName.CFOP, session: "", isMistake: false, isFullStep: true
    };
}

const STEP_TOTAL_KEYS = ['time', 'turns', 'recognitionTime', 'executionTime', 'preAufTime', 'postAufTime'] as const;
export function sumStepTotals(steps: Step[]): StepTotals {
    const totals: StepTotals = { time: 0, turns: 0, recognitionTime: 0, executionTime: 0, preAufTime: 0, postAufTime: 0 };
    for (const step of steps) for (const key of STEP_TOTAL_KEYS) totals[key] += step[key];
    return totals;
}

export function CalculateMostUsedMethod(solves: Solve[]): MethodName {
    const counts = new Map(Object.values(MethodName).map(method => [method, 0]));
    let max = 0, method = MethodName.CFOP;
    for (const solve of solves) {
        if (!counts.has(solve.method)) continue;
        const count = counts.get(solve.method)! + 1;
        counts.set(solve.method, count);
        if (count > max) { method = solve.method; max = count; }
    }
    return method;
}

// If user doesn't have enough solves, choose a smaller window size to show their data
export function CalculateWindowSize(solveCount: number): number {
    return Number.isFinite(solveCount) && solveCount > 0 ? Math.max(5, Math.min(Math.ceil(solveCount / 4), Const.DefaultWindowSize)) : 5;
}

export function CalculateAllSessionOptions(solves: Solve[]): Option[] {
    return [...new Set(solves.map(solve => solve.session || 'Default'))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        .map(session => ({ label: session, value: session }));
}

export function CalculateBenchmarkTimes(solves: Solve[]): { goodTime: number; badTime: number } {
    const times = solves
        .filter(s => !s.isCorrupt && !s.dnf)
        .sort((a, b) => a.date.getTime() - b.date.getTime()).map(s => s.time);
    if (!times.length) return { goodTime: 15, badTime: 20 };
    const averages = times.length >= 100 ? calculateMovingAverageChopped(times, 100, 5) : [];
    const goodTime = Math.floor(times.length >= 100 ? averages.at(-1) ?? times.at(-1)! :
        times.reduce((sum, time) => sum + time, 0) / times.length);
    return { goodTime, badTime: Math.ceil(goodTime * 1.25) };
}