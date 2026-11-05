import { AUF_MOVES, ROTATIONS, getAufMovesForSolve, tokenizeMoves } from "./CsvParser";
import { AufInefficiency, CaseStats, getStep, MoveAnalysisResult, RedundantPair, Solve, SolveEfficiency, Step, StepName } from "./Types";

/**
 * Parses a single move token into its face (including wide-move prefix)
 * and a mod-4 quarter-turn value.
 * Returns null for rotations (x, y, z) or unrecognised tokens.
 */
type ParsedToken = { face: string; quarterTurns: number };

const MOVE_TOKEN_RE = /^([RLUDFBrludfbMESxyz]w?)(2'|3'?|'|2)?$/;
const SUFFIX_QUARTER_TURNS: { [suffix: string]: number } = { "": 1, "'": 3, "2": 2, "2'": 2, "3": 3, "3'": 3 };

/** The move vocabulary is tiny and repeats across every solve, so parsed tokens are memoised. */
const MOVE_TOKEN_CACHE = new Map<string, ParsedToken | null>();
function parseMoveToken(token: string): ParsedToken | null {
    const cached = MOVE_TOKEN_CACHE.get(token);
    if (cached !== undefined) return cached;
    const m = token.match(MOVE_TOKEN_RE);
    const parsed = m ? { face: m[1], quarterTurns: SUFFIX_QUARTER_TURNS[m[2] ?? ""] } : null;
    MOVE_TOKEN_CACHE.set(token, parsed);
    return parsed;
}

export type MoveMistake = { kind: 'singleUndo' | 'sequenceUndo' | 'redundantTurns'; auf: boolean };
/** Maximal contiguous inverse sequences are one episode; rotations/unknown tokens are barriers. */
export function analyzeMoveMistakes(tokens: string[], auf: Set<string> = AUF_MOVES): MoveMistake[] {
    const moves = tokens.map(token => {
        const match = /^([RLUDFBrludfbMES]w?)(\d+)?(')?$/.exec(token);
        if (!match) return null;
        const count = Number(match[2] ?? 1);
        return Number.isFinite(count) ? { face: match[1].endsWith('w') ? match[1][0].toLowerCase() : match[1], count,
            turns: (count % 4) * (match[3] ? 3 : 1) % 4 } : null;
    });
    const face = auf.values().next().value;
    let prefix = 0, suffix = moves.length - 1;
    while (prefix < moves.length && moves[prefix]?.face === face) prefix++;
    while (suffix >= 0 && moves[suffix]?.face === face) suffix--;
    const inAuf = (left: number, right: number) => right < prefix || left > suffix;
    const inverse = (left: number, right: number) => moves[left] && moves[right] && moves[left]!.turns > 0
        && moves[left]!.face === moves[right]!.face && (moves[left]!.turns + moves[right]!.turns) % 4 === 0;
    const issues: MoveMistake[] = [];
    let consumed = -1;
    for (let i = 1; i < moves.length; i++) {
        if (i - 1 <= consumed || !inverse(i - 1, i)) continue;
        let left = i - 1, right = i;
        while (left > consumed + 1 && right + 1 < moves.length && inverse(left - 1, right + 1)) { left--; right++; }
        issues.push({ kind: right - left > 1 ? 'sequenceUndo' : 'singleUndo', auf: inAuf(left, right) });
        consumed = right;
        i = right;
    }
    moves.forEach((move, i) => {
        if (!move) return;
        if (move.count >= 3 || move.count === 0) issues.push({ kind: 'redundantTurns', auf: inAuf(i, i) });
    });
    return issues;
}

export function analyzeStepMoves(movesString: string, _aufMoves: Set<string> = AUF_MOVES): MoveAnalysisResult {
    const tokens = tokenizeMoves(movesString);
    type ParsedMove = ParsedToken & { originalIdx: number };
    const simplified: ParsedMove[] = [];
    const redundantPairs: RedundantPair[] = [];
    let originalTurns = 0;
    tokens.forEach((token, endIdx) => {
        const move = parseMoveToken(token);
        if (!move) return;
        originalTurns++;
        const prev = simplified.at(-1);
        if (prev?.face === move.face) {
            redundantPairs.push({ startIdx: prev.originalIdx, endIdx, moves: tokens.slice(prev.originalIdx, endIdx + 1).join(" ") });
            prev.quarterTurns = (prev.quarterTurns + move.quarterTurns) % 4;
            if (!prev.quarterTurns) simplified.pop();
        } else {
            simplified.push({ ...move, originalIdx: endIdx });
        }
    });
    return { originalTurns, simplifiedTurns: simplified.length, wastedMoves: originalTurns - simplified.length, redundantPairs };
}

function countAufMoves(tokens: string[], direction: 'leading' | 'trailing', aufMoves: Set<string> = AUF_MOVES): number {
    let count = 0;
    for (const token of direction === 'leading' ? tokens : tokens.slice().reverse()) {
        if (!aufMoves.has(token)) break;
        count++;
    }
    return count;
}

function isRotationOrAuf(t: string, aufMoves: Set<string> = AUF_MOVES): boolean {
    return ROTATIONS.has(t.toLowerCase()) || aufMoves.has(t);
}

export function coreMovesCount(movesString: string | string[], aufMoves: Set<string> = AUF_MOVES): number {
    const tokens = typeof movesString === 'string' ? tokenizeMoves(movesString) : movesString;
    let start = 0;
    while (start < tokens.length && isRotationOrAuf(tokens[start], aufMoves)) start++;
    let end = tokens.length - 1;
    while (end >= start && isRotationOrAuf(tokens[end], aufMoves)) end--;
    let count = 0;
    for (let i = start; i <= end; i++) {
        if (!ROTATIONS.has(tokens[i].toLowerCase())) count++;
    }
    return count;
}

/** Returns median (p50) of sorted array. */
function median(sorted: number[]): number {
    const mid = Math.floor(sorted.length / 2);
    return !sorted.length ? 0 : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Returns the lowest mode (smallest value that appears most often), or null if all values have the same frequency. */
function lowestMode(sorted: number[]): number | null {
    const counts: { [value: number]: number } = {};
    for (const v of sorted) counts[v] = (counts[v] ?? 0) + 1;
    const maxCount = Math.max(...Object.values(counts));
    return maxCount > 1 ? sorted.find(value => counts[value] === maxCount)! : null;
}

export function typicalCaseMoves(sorted: number[]): number {
    return lowestMode(sorted) ?? median(sorted);
}

export function computeCaseFailureStats(
    solves: Solve[],
    stepName: StepName
): CaseStats[] {
    type CaseInstance = { solveId: string; coreMoves: number; totalTurns: number; stepTime: number };
    const caseMap: { [caseName: string]: CaseInstance[] } = {};

    for (const solve of solves) {
        const step = getStep(solve, stepName);
        if (!step || !step.case) continue;
        const caseName = step.case;
        const core = coreMovesCount(step.moves, getAufMovesForSolve(solve));
        caseMap[caseName] ??= [];
        caseMap[caseName].push({ solveId: solve.id, coreMoves: core, totalTurns: step.turns, stepTime: step.time });
    }
    const results: CaseStats[] = [];
    for (const [caseName, instances] of Object.entries(caseMap)) {
        if (caseName === "Solved") continue;
        const moveCounts = instances.map(i => i.coreMoves).sort((a, b) => a - b);
        const expectedMovesBase = typicalCaseMoves(moveCounts), expectedMoves = expectedMovesBase + 2;
        const avgMoves = moveCounts.reduce((a, b) => a + b, 0) / moveCounts.length;
        const avgStepTime = instances.reduce((sum, i) => sum + i.stepTime, 0) / instances.length;
        const taggedInstances = instances.map(inst => ({
            solveId: inst.solveId, turns: inst.totalTurns, failed: inst.coreMoves > expectedMoves && inst.stepTime > avgStepTime,
        }));
        const failureCount = taggedInstances.filter(i => i.failed).length;
        results.push({
            caseName, totalCount: instances.length, failureCount, failureRate: failureCount / instances.length * 100,
            avgMoves, expectedMovesBase, expectedMoves, instances: taggedInstances,
        });
    }
    return results.sort((a, b) => b.failureRate - a.failureRate);
}

export function computeAufInefficiency(step: Step): AufInefficiency {
    const tokens = tokenizeMoves(step.moves);
    const preAufMoves = countAufMoves(tokens, 'leading');
    const postAufMoves = countAufMoves(tokens, 'trailing');
    const totalAufTime = step.preAufTime + step.postAufTime;
    return { preAufMoves, postAufMoves, totalAufTime, isHighCost: preAufMoves + postAufMoves > 2 || totalAufTime > 0.5 };
}

/** Lazily-built, per-CaseStats set of the solve ids that failed, so lookups are O(1) instead of a scan. */
const failedSolveIdsCache = new WeakMap<CaseStats, Set<string>>();
function failedSolveIds(stats: CaseStats): Set<string> {
    let ids = failedSolveIdsCache.get(stats);
    if (!ids) failedSolveIdsCache.set(stats, ids = new Set(stats.instances.filter((i) => i.failed).map((i) => i.solveId)));
    return ids;
}

/** Move strings repeat heavily across solves, so the two turn counts are memoised by step moves. */
const STEP_TURN_CACHE = new Map<string, { original: number; simplified: number }>();
function stepTurnCounts(moves: string): { original: number; simplified: number } {
    let counts = STEP_TURN_CACHE.get(moves);
    if (!counts) {
        const { originalTurns, simplifiedTurns } = analyzeStepMoves(moves);
        STEP_TURN_CACHE.set(moves, counts = { original: originalTurns, simplified: simplifiedTurns });
    }
    return counts;
}

export function computeSolveEfficiency(
    solve: Solve,
    ollCaseStats?: Map<string, CaseStats>,
    pllCaseStats?: Map<string, CaseStats>
): SolveEfficiency {
    let totalOriginal = 0, totalSimplified = 0;
    for (const step of solve.steps) {
        if (!step.moves) continue;
        const counts = stepTurnCounts(step.moves);
        totalOriginal += counts.original;
        totalSimplified += counts.simplified;
    }

    const failed = (name: StepName, cases?: Map<string, CaseStats>) => {
        const step = getStep(solve, name), stats = step?.case ? cases?.get(step.case) : undefined;
        return stats ? failedSolveIds(stats).has(solve.id) : false;
    };
    return { moveEfficiency: totalOriginal > 0 ? totalSimplified / totalOriginal : 1,
        hadOllFailure: failed(StepName.OLL, ollCaseStats), hadPllFailure: failed(StepName.PLL, pllCaseStats) };
}
