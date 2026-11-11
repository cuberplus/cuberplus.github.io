import { Const } from "../Models/Constants";
import { GetEmptySolve } from "../Helpers/CubeHelpers";
import { Solve, CrossColor, MethodName, Step, StepName } from "../Models/Types";
import { firstF2LPair } from '../../../shared/cube/f2l';
import { COLORS } from '../../../scrambler/src/cube/cube';

export const AUF_MOVES = new Set(['U', "U'", 'U2', "U2'", "U3", "U3'"]);
export const ROTATIONS = new Set(['x', 'y', 'z'].flatMap(face => ['', "'", '2', "2'", '3', "3'"].map(suffix => face + suffix)));
const ACUBEMY_AUF_REMAP_CUTOFF_UTC = new Date('2025-10-21T13:00:00.000Z');
type FaceLetter = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

export function aufMovesForFace(face: FaceLetter): Set<string> {
    return new Set([face, `${face}'`, `${face}2`, `${face}2'`, `${face}3`, `${face}3'`]);
}

export function getAufMovesForSolve(solve: Pick<Solve, 'source' | 'date' | 'crossColor'>): Set<string> {
    if (solve.source !== 'acubemy' || !(solve.date instanceof Date) || !(solve.date < ACUBEMY_AUF_REMAP_CUTOFF_UTC)) return AUF_MOVES;
    const aufFace = ({ White: 'D', Yellow: 'U', Orange: 'R', Red: 'L', Green: 'B', Blue: 'F', Unknown: 'U' } as const)[solve.crossColor];
    return aufMovesForFace(aufFace);
}

export type MoveTiming = { move: string; timestamp: number };

/** Parses Cubeast format "U[100] R[200]" into MoveTiming[], filtering out rotations. */
export function parseRecordedMoves(raw: string, includeRotations = false): MoveTiming[] {
    const result: MoveTiming[] = [];
    if (!raw) return result;
    // One pass over the raw string: tokenizing it and slicing the digits out of every
    // "[123]" allocated millions of throwaway strings on a full export.
    const len = raw.length;
    let i = 0;
    while (i < len) {
        while (i < len && raw.charCodeAt(i) <= 32) i++;
        const start = i;
        while (i < len && raw.charCodeAt(i) > 32) i++;
        if (i === start || raw.charCodeAt(i - 1) !== 93) continue;
        let open = i - 2;
        let digits = 0;
        for (let c = raw.charCodeAt(open); open > start && c !== 91; c = raw.charCodeAt(--open)) {
            if (c < 48 || c > 57) { digits = -1; break; }
            digits++;
        }
        if (digits <= 0 || open <= start || raw.charCodeAt(open) !== 91) continue;
        let timestamp = 0;
        for (let d = open + 1; d < i - 1; d++) timestamp = timestamp * 10 + (raw.charCodeAt(d) - 48);
        const move = raw.slice(start, open);
        const firstChar = move.charCodeAt(0) | 32;
        // Only tokens starting with x/y/z can be rotations, so only they pay for the lookup.
        if (!includeRotations && firstChar >= 120 && firstChar <= 122 && ROTATIONS.has(move.toLowerCase())) continue;
        result.push({ move, timestamp });
    }
    return result;
}

export type StepSegments = { recognition: number; preAuf: number; coreExecution: number; postAuf: number };

/**
 * Computes 4-segment timing from non-rotation moves and previous step end timestamp.
 * Cross: recognition=0, preAuf=0, postAuf=0, execution=all.
 * PLL skip (all U moves): preAuf=0, coreExecution=0, all time is postAuf.
 */
export function computeStepSegments(
    moves: MoveTiming[],
    prevEndTsMs: number | null,
    stepName: StepName,
    aufMoves: Set<string> = AUF_MOVES
): StepSegments {
    const zero = { recognition: 0, preAuf: 0, coreExecution: 0, postAuf: 0 };
    if (!moves.length) return zero;

    const firstTs = moves[0].timestamp;
    const lastTs = moves[moves.length - 1].timestamp;

    if (stepName === StepName.Cross) return { ...zero, coreExecution: Math.max(0, (lastTs - firstTs) / 1000) };

    const recognition = prevEndTsMs == null ? 0 : Math.max(0, (firstTs - prevEndTsMs) / 1000);

    const firstNonU = moves.findIndex(move => !aufMoves.has(move.move));
    if (stepName === StepName.PLL && firstNonU < 0) return { ...zero, recognition, postAuf: Math.max(0, (lastTs - firstTs) / 1000) };
    if (firstNonU < 0) return { ...zero, recognition, coreExecution: Math.max(0, (lastTs - firstTs) / 1000) };
    let lastNonU = moves.length - 1;
    while (aufMoves.has(moves[lastNonU].move)) lastNonU--;

    const preAuf = (moves[firstNonU].timestamp - firstTs) / 1000;
    const postAuf =
        stepName === StepName.PLL && lastNonU < moves.length - 1
            ? (lastTs - moves[lastNonU].timestamp) / 1000
            : 0;
    const coreExecution = Math.max(0, (moves[lastNonU].timestamp - moves[firstNonU].timestamp) / 1000);

    return { recognition, preAuf, coreExecution, postAuf };
}

/**
 * Cross span from timestamps is 0 with a single move or identical first/last timestamps.
 * Use CSV step execution (seconds) when degenerate and the export reports a positive duration.
 */
export function effectiveCrossExecutionSec(
    moveTimings: MoveTiming[],
    segmentExecutionSec: number,
    csvExecutionFallbackSec: number
): number {
    if (!moveTimings.length) return segmentExecutionSec;
    const firstTs = moveTimings[0].timestamp;
    const lastTs = moveTimings[moveTimings.length - 1].timestamp;
    const degenerate =
        moveTimings.length === 1 || firstTs === lastTs;
    if (degenerate && csvExecutionFallbackSec > 0 && segmentExecutionSec === 0) {
        return csvExecutionFallbackSec;
    }
    return segmentExecutionSec;
}

/** Splits a CSV line on `splitter`, ignoring separators inside [...] (e.g. case "[FL,BR]->FR 30"). */
function splitCsvLine(line: string, splitterCode: number): string[] {
    const out: string[] = [];
    let depth = 0, start = 0;
    for (let i = 0; i < line.length; i++) {
        const c = line.charCodeAt(i);
        if (c === 91) depth++;
        else if (c === 93) depth--;
        else if (c === splitterCode && depth === 0) { out.push(line.slice(start, i)); start = i + 1; }
    }
    out.push(line.slice(start));
    return out;
}

/** Parses "YYYY-MM-DD HH:mm:ss" (optionally suffixed, e.g. " UTC") as a UTC date. */
function parseUtcDateTime(value: string): Date {
    return new Date(Date.UTC(
        +value.slice(0, 4), +value.slice(5, 7) - 1, +value.slice(8, 10),
        +value.slice(11, 13), +value.slice(14, 16), +value.slice(17, 19)));
}

// --- Shared helpers for Acubemy move parsing  ---

export function tokenizeMoves(raw: string | undefined | null): string[] {
    const normalized = raw?.trim().replace(/^"(.*)"$/, "$1").trim() ?? "";
    return normalized ? normalized.split(/\s+/) : [];
}

const consolidatedMoves = new Map<string, string>();
const consolidatedTokens = new Map<string, RegExpExecArray | null>();
/** Merge sensor-split turns, but retain cancellations as evidence of actual undos. */
export function consolidateMoves(raw: string): string {
    const cached = consolidatedMoves.get(raw);
    if (cached !== undefined) return cached;
    if (!/([RLUDFBrludfbMES]w?)(?:2'?|')?\s+\1(?:2'?|')?(?=\s|$|")/.test(raw)) { consolidatedMoves.set(raw, raw); return raw; }
    const result: string[] = [];
    let previous: string[] | null = null;
    const amount = (suffix: string) => suffix.startsWith('2') ? 2 : suffix === "'" ? 3 : 1;
    const tokens = tokenizeMoves(raw), parsed = tokens.map(token => {
        if (!consolidatedTokens.has(token)) consolidatedTokens.set(token, /^([RLUDFBrludfbMES]w?)(2'?|'?)$/.exec(token));
        return consolidatedTokens.get(token) ?? null;
    });
    const inverse = (left: number, right: number) => {
        const a = parsed[left], b = parsed[right];
        return a && b && a[1] === b[1] && (amount(a[2]) + amount(b[2])) % 4 === 0;
    };
    for (const [index, token] of tokens.entries()) {
        const move = parsed[index];
        if (inverse(index - 1, index) || inverse(index, index + 1)) { result.push(token); previous = null; continue; }
        const total: number = previous && move && previous[1] === move[1] ? (amount(previous[2]) + amount(move[2])) % 4 : 0;
        if (total) result[result.length - 1] = move![1] + ['', '', '2', "'"][total];
        else result.push(token);
        previous = total ? ['', move![1], ['', '', '2', "'"][total]] : previous?.[1] === move?.[1] ? null : move;
    }
    const value = result.join(' ');
    consolidatedMoves.set(raw, value);
    return value;
}

const moveCounts = new Map<string | undefined | null, number>();
/** Counts move tokens excluding cube rotations (x, y, z). Use for all turn counts. */
export function countMovesExcludingRotations(movesString: string | undefined | null): number {
    let count = moveCounts.get(movesString);
    if (count === undefined) moveCounts.set(movesString, count = tokenizeMoves(movesString).filter(t => !ROTATIONS.has(t.toLowerCase())).length);
    return count;
}

function consolidateStep(step: Step): boolean {
    const moves = consolidateMoves(step.moves);
    if (moves === step.moves) return false;
    step.moves = moves;
    step.turns = countMovesExcludingRotations(moves);
    step.tps = step.time > 0 ? step.turns / step.time : 0;
    return true;
}

/** Returns move string with all rotation tokens (x, y, z and variants) removed. Use for Acubemy so stored data has no rotations. */
export function stripRotationsFromMoveString(movesString: string | undefined | null): string {
    return tokenizeMoves(movesString).filter((t) => !ROTATIONS.has(t.toLowerCase())).join(' ');
}

/** Keep transient timelines off Step: deleting Step fields puts V8 objects into slower dictionary mode. */
interface RowScratch {
    moves: (MoveTiming[] | null)[];
    cumulativeSec: number[];
    penaltyMs: number;
    solution: string;
    recorded: string[];
}

type ColumnSetter = (obj: Solve, value: string, scratch: RowScratch) => void;

function parseCubeastCsv(stringVal: string, splitter: string, keepRecording: boolean): Solve[] {
    // Separators inside [...] (e.g. step case "[FL,BR]->FR 30") are skipped while splitting,
    // which avoids rewriting the whole 45MB export before it can be parsed.
    const splitterCode = splitter.charCodeAt(0);
    const headerEnd = stringVal.indexOf("\n");
    const keys = splitCsvLine((headerEnd < 0 ? stringVal : stringVal.slice(0, headerEnd)).trim(), splitterCode);

    const keyMap: { [key: string]: ColumnSetter } = {
        "cuberplus_source": (obj, value) => { if (value === 'cubeast' || value === 'acubemy') obj.source = value; },
        "id": (obj, value) => { obj.id = value; obj.rawSourceId = value; obj.source = 'cubeast'; },
        "time": (obj, value) => { obj.time = Number(value) / 1000; if (obj.time < 1) obj.isCorrupt = true; },
        "dnf": (obj, value) => { obj.dnf = value.toLowerCase() === 'true'; },
        "one_turn_away_two_second_penalty": (obj, value, scratch) => { if (value.toLowerCase() === 'true') scratch.penaltyMs += 2000; },
        "inspection_two_second_penalty": (obj, value, scratch) => { if (value.toLowerCase() === 'true') scratch.penaltyMs += 2000; },
        "manual_two_second_penalty": (obj, value, scratch) => { if (value.toLowerCase() === 'true') scratch.penaltyMs += 2000; },
        "date": (obj, value) => { obj.date = parseUtcDateTime(value); },
        "solve_end_date": (obj, value) => { if (value) obj.endDate = new Date(value); },
        "solution_rotation": (obj, value) => {
            obj.crossColor = Const.crossMappings.get(value) ?? CrossColor.Unknown;
        },
        "solution": (_obj, value, scratch) => { scratch.solution = value; },
        "first_f2l_pair": (obj, value) => { obj.firstF2LPair = value; },
        "scramble": (obj, value) => { obj.scramble = value; },
        "solving_method": (obj, value) => { if (value.trim()) obj.method = value.trim() as MethodName; },
        "turns_per_second": (obj, value) => { obj.tps = Number(value); },
        "total_recognition_time": (obj, value) => { obj.recognitionTime = Number(value) / 1000; },
        "inspection_time": (obj, value) => { obj.inspectionTime = value.trim() ? Number(value) / 1000 : null; },
        "total_execution_time": (obj, value) => { obj.executionTime = Number(value) / 1000; },
        "slice_turns": (obj, value) => { obj.turns = Number(value); },
        "session_name": (obj, value) => { obj.session = value; },
    };

    const stepKeyMap: { [key: string]: (step: Step, value: string) => void } = {
        "name": (step, value) => { step.name = value as StepName; },
        "slice_turns": (step, value) => { step.turns = Number(value); },
        "time": (step, value) => { step.time = Number(value) / 1000; },
        "case": (step, value) => { step.case = value; },
        "moves": (step, value) => { step.moves = value; },
        "turns_per_second": (step, value) => { step.tps = Number(value); },
        "recognition_time": (step, value) => { step.recognitionTime = Number(value) / 1000; },
        "execution_time": (step, value) => { step.executionTime = Number(value) / 1000; },
    };

    // Resolve each header column to its setter once, instead of re-parsing the key on every row.
    const TIME_COLUMNS: { [key: string]: number } = { "time": 0, "pickup_time": 1, "putdown_time": 2, "solving_time": 3 };
    const columnSetters = keys.map((key): ColumnSetter | undefined => {
        if (!key.startsWith("step_")) return keyMap[key];
        const stepIndex = +key[5];
        const stepKey = key.split("_").slice(2).join("_");
        if (stepKey === "recorded_moves") {
            return (obj, value, scratch) => {
                if (keepRecording) scratch.recorded[stepIndex] = value;
                const moveTimings = parseRecordedMoves(value);
                if (moveTimings.length > 0) scratch.moves[stepIndex] = moveTimings;
            };
        }
        if (stepKey === "cumulative_time") {
            return (obj, value, scratch) => {
                const sec = Number(value) / 1000;
                if (Number.isFinite(sec) && sec >= 0) scratch.cumulativeSec[stepIndex] = sec;
            };
        }
        const setStep = stepKeyMap[stepKey];
        return setStep ? (obj, value) => setStep(obj.steps[stepIndex], value) : undefined;
    });
    const timeColumns = keys.map((key) => TIME_COLUMNS[key] ?? -1);
    const bracketColumns = keys.map(key => key.endsWith('_case'));
    const columnCount = columnSetters.length;

    const formedArr: Solve[] = [];
    const stepCount = GetEmptySolve().steps.length;
    // Reused across rows; the parser is single threaded, so one set of scratch buffers is enough.
    const scratch: RowScratch = { moves: new Array<MoveTiming[] | null>(stepCount).fill(null), cumulativeSec: new Array<number>(stepCount).fill(-1), penaltyMs: 0, solution: '', recorded: [] };
    const times = [0, 0, 0, 0];
    const total = stringVal.length;

    for (let lineStart = headerEnd + 1; lineStart < total;) {
        let lineEnd = stringVal.indexOf("\n", lineStart);
        if (lineEnd < 0) lineEnd = total;
        // Exports are CRLF, so drop the carriage return rather than leaving it on the last cell.
        let end = lineEnd;
        if (end > lineStart && stringVal.charCodeAt(end - 1) === 13) end--;
        if (end <= lineStart) { lineStart = lineEnd + 1; continue; }

        const obj = GetEmptySolve();
        scratch.penaltyMs = 0;
        scratch.solution = '';
        if (keepRecording) scratch.recorded.length = 0;
        for (let i = 0; i < stepCount; i++) { scratch.moves[i] = null; scratch.cumulativeSec[i] = -1; }
        times[0] = times[1] = times[2] = times[3] = 0;

        // Native delimiter searches skip long move fields without a per-character JS loop.
        // Only quoted cells and legacy unquoted [FL,BR] cases need special scanning.
        for (let cellStart = lineStart, index = 0; cellStart <= end; index++) {
            let delimiterStart = cellStart;
            const quoted = stringVal.charCodeAt(cellStart) === 34;
            if (quoted) {
                let close = cellStart + 1;
                while ((close = stringVal.indexOf('"', close)) >= 0) {
                    if (stringVal.charCodeAt(close + 1) !== 34) break;
                    close += 2;
                }
                delimiterStart = close < 0 ? end : close + 1;
            } else if (bracketColumns[index]) {
                let depth = 0;
                while (delimiterStart < end) {
                    const c = stringVal.charCodeAt(delimiterStart);
                    if (c === 91) depth++;
                    else if (c === 93) depth--;
                    else if (c === splitterCode && depth === 0) break;
                    delimiterStart++;
                }
            }
            if (delimiterStart > lineEnd) {
                lineEnd = stringVal.indexOf("\n", delimiterStart);
                if (lineEnd < 0) lineEnd = total;
                end = lineEnd > 0 && stringVal.charCodeAt(lineEnd - 1) === 13 ? lineEnd - 1 : lineEnd;
            }
            let cellEnd = stringVal.indexOf(splitter, delimiterStart);
            if (cellEnd < 0 || cellEnd > end) cellEnd = end;
            if (index < columnCount) {
                const setter = columnSetters[index], timeColumn = timeColumns[index];
                if (setter !== undefined || timeColumn >= 0) {
                    const raw = stringVal.slice(cellStart, cellEnd);
                    const value = quoted ? raw.slice(1, -1).replace(/""/g, '"') : raw;
                    if (timeColumn >= 0) times[timeColumn] = Number(value) || 0;
                    setter?.(obj, value, scratch);
                }
            }
            cellStart = cellEnd + 1;
        }

        const [rawTimeMs, pickupTimeMs, putdownTimeMs, solvingTimeMs] = times;

        // After parsing the row, adjust Cubeast Solve.time to represent in-hand time:
        // prefer solving_time, else subtract pickup/putdown from time, else use raw time.
        if (obj.source === 'cubeast') {
            const finalMs = solvingTimeMs > 0 ? solvingTimeMs + scratch.penaltyMs
                : rawTimeMs > 0 ? rawTimeMs - pickupTimeMs - putdownTimeMs
                : 0;
            if (finalMs !== 0) {
                obj.time = finalMs / 1000;
                if (obj.time < 1) obj.isCorrupt = true;
            }
        }

        let prevEndTsMs: number | null = null;
        let normalized = false;
        let recognitionTotal = 0, executionTotal = 0, preAufTotal = 0, postAufTotal = 0, turnsTotal = 0;
        for (let i = 0; i < obj.steps.length; i++) {
            const step = obj.steps[i];
            const moveTimings = scratch.moves[i];
            if (moveTimings !== null && moveTimings.length > 0) {
                const isCross = step.name === StepName.Cross;
                const csvCumulativeSec = scratch.cumulativeSec[i];
                const crossExecFallback = !isCross ? 0
                    : step.executionTime > 0 ? step.executionTime
                    : Math.max(csvCumulativeSec, 0);
                const seg = computeStepSegments(moveTimings, prevEndTsMs, step.name);
                step.recognitionTime = seg.recognition;
                step.preAufTime = seg.preAuf;
                step.postAufTime = seg.postAuf;
                const segmentExec = seg.preAuf + seg.coreExecution + seg.postAuf;
                step.executionTime = isCross
                    ? effectiveCrossExecutionSec(moveTimings, segmentExec, crossExecFallback)
                    : segmentExec;
                step.time = step.recognitionTime + step.executionTime;
                let moves = moveTimings[0].move;
                for (let m = 1; m < moveTimings.length; m++) moves += " " + moveTimings[m].move;
                step.moves = moves;
                step.turns = moveTimings.length;
                if (step.time > 0) step.tps = step.turns / step.time;
                prevEndTsMs = moveTimings[moveTimings.length - 1].timestamp;
            } else {
                step.preAufTime = 0;
                step.postAufTime = 0;
                if (prevEndTsMs != null && step.time > 0) {
                    prevEndTsMs += step.time * 1000;
                }
            }
            normalized = consolidateStep(step) || normalized;
            recognitionTotal += step.recognitionTime;
            executionTotal += step.executionTime;
            preAufTotal += step.preAufTime;
            postAufTotal += step.postAufTime;
            turnsTotal += step.turns;
        }
        obj.recognitionTime = recognitionTotal;
        obj.executionTime = executionTotal;
        obj.preAufTime = preAufTotal;
        obj.postAufTime = postAufTotal;
        obj.turns = turnsTotal;
        if (normalized) obj.tps = obj.time > 0 ? obj.turns / obj.time : 0;

        obj.rawSource = obj.source;
        if (obj.firstF2LPair === undefined && obj.method.startsWith('CFOP')) obj.firstF2LPair = firstF2LPair(obj.scramble, scratch.solution, COLORS.indexOf(obj.crossColor as typeof COLORS[number]));
        if (obj.dnf) obj.isCorrupt = false;

        if (keepRecording) obj.recording = { solution: scratch.solution || scratch.recorded.join(' ') };
        formedArr.push(obj);
        lineStart = lineEnd + 1;
    }

    return formedArr.sort((a: Solve, b: Solve) => a.date.getTime() - b.date.getTime());
}

function* csvRows(csv: string, separator: string): Generator<string[]> {
    let row: string[] = [], start = 0, quoted = false;
    for (let i = 0; i <= csv.length; i++) {
        const char = csv[i];
        if (char === '"') {
            if (quoted && csv[i + 1] === '"') i++;
            else quoted = !quoted;
        }
        if (quoted || i < csv.length && char !== separator && char !== '\r' && char !== '\n') continue;
        const cell = csv.slice(start, i);
        row.push(cell.startsWith('"') && cell.endsWith('"') ? cell.slice(1, -1).replace(/""/g, '"') : cell);
        if (char !== separator) {
            if (row.some(value => value.trim())) yield row;
            row = [];
            if (char === '\r' && csv[i + 1] === '\n') i++;
        }
        start = i + 1;
    }
}

function parseAcubemyCsv(stringVal: string, splitter: string, keepRecording: boolean): Solve[] {

    type AcubemyStepDef = { index: number; name: StepName; movesField: string };

    const ACUBEMY_STEP_DEFS: AcubemyStepDef[] = [
        { index: 0, name: StepName.Cross, movesField: "cross_moves" },
        { index: 1, name: StepName.F2L_1, movesField: "f2l_pair1_moves" },
        { index: 2, name: StepName.F2L_2, movesField: "f2l_pair2_moves" },
        { index: 3, name: StepName.F2L_3, movesField: "f2l_pair3_moves" },
        { index: 4, name: StepName.F2L_4, movesField: "f2l_pair4_moves" },
        { index: 5, name: StepName.OLL, movesField: "oll_moves" },
        { index: 6, name: StepName.PLL, movesField: "pll_moves" },
    ];

    const records = csvRows(stringVal.trim(), splitter);
    const header = records.next();
    if (header.done) return [];
    const keys = header.value, crossColors = COLORS.map(color => CrossColor[color]);

    const keyIndex: Record<string, number> = {};
    keys.forEach((key, i) => { if (!(key in keyIndex)) keyIndex[key] = i; });

    /** Strips rotations from solution and move_times in parallel so lengths stay in sync. */
    const stripRotationsFromSolutionAndTimes = (
        solutionMovesRaw: string | undefined | null,
        moveTimesRaw: string | undefined | null
    ): { solutionNoRot: string; moveTimesNoRot: string } => {
        const solutionTokens = tokenizeMoves(solutionMovesRaw);
        const timeTokens = tokenizeMoves(moveTimesRaw).map(Number);
        if (!solutionTokens.length || solutionTokens.length !== timeTokens.length) return { solutionNoRot: '', moveTimesNoRot: '' };
        const keptMoves: string[] = [];
        const keptTimes: number[] = [];
        for (let i = 0; i < solutionTokens.length; i++) {
            if (ROTATIONS.has(solutionTokens[i].toLowerCase())) continue;
            keptMoves.push(solutionTokens[i]);
            keptTimes.push(timeTokens[i]);
        }
        return { solutionNoRot: keptMoves.join(' '), moveTimesNoRot: keptTimes.join(' ') };
    };

    type StepRange = { startIdx: number; endIdx: number };

    /** solutionMovesRaw and moveTimesRaw must already have rotations stripped (use stripRotationsFromSolutionAndTimes). */
    const recomputeAcubemyStepTimes = (
        solve: Solve,
        stepDefs: AcubemyStepDef[],
        solutionMovesRaw: string | undefined | null,
        moveTimesRaw: string | undefined | null,
        aufMoves: Set<string> = AUF_MOVES,
        crossCsvExecutionFallbackSec = 0
    ) => {
        const solutionTokens = tokenizeMoves(solutionMovesRaw);
        const timeTokens = tokenizeMoves(moveTimesRaw).map(Number);
        if (!solutionTokens.length || solutionTokens.length !== timeTokens.length) return;

        const matchStepRange = (
            stepMoves: string,
            searchFrom: number
        ): StepRange | null => {
            const tokens = tokenizeMoves(stepMoves);
            if (tokens.length === 0) return null;
            for (let i = searchFrom; i <= solutionTokens.length - tokens.length; i++) {
                if (tokens.every((token, offset) => solutionTokens[i + offset] === token))
                    return { startIdx: i, endIdx: i + tokens.length - 1 };
            }
            return null;
        };

        const steps = solve.steps;
        const stepRanges: (StepRange | null)[] = [];
        let searchFrom = 0;
        for (const def of stepDefs) {
            const range = matchStepRange(steps[def.index].moves, searchFrom);
            stepRanges[def.index] = range;
            if (range) searchFrom = range.endIdx + 1;
        }

        let prevEndIdx: number | null = null;

        for (const def of stepDefs) {
            const s = steps[def.index];
            const range = stepRanges[def.index];

            if (!range) {
                continue;
            }

            const moveTimings: MoveTiming[] = [];
            for (let k = range.startIdx; k <= range.endIdx; k++) {
                moveTimings.push({ move: solutionTokens[k], timestamp: timeTokens[k] });
            }

            const prevEndTsMs = prevEndIdx == null ? null : timeTokens[prevEndIdx];
            const seg = computeStepSegments(moveTimings, prevEndTsMs, s.name, aufMoves);

            s.recognitionTime = seg.recognition;
            s.preAufTime = seg.preAuf;
            s.postAufTime = seg.postAuf;
            const segmentExec = seg.preAuf + seg.coreExecution + seg.postAuf;
            s.executionTime = def.name === StepName.Cross
                ? effectiveCrossExecutionSec(moveTimings, segmentExec, crossCsvExecutionFallbackSec) : segmentExec;
            s.time = s.recognitionTime + s.executionTime;
            s.tps = s.time > 0 ? s.turns / s.time : 0;
            solve.recognitionTime += s.recognitionTime;
            solve.executionTime += s.executionTime;
            solve.preAufTime += s.preAufTime;
            solve.postAufTime += s.postAufTime;
            prevEndIdx = range.endIdx;
        }
    };

    const formedArr = Array.from(records, item => {
        const solve = GetEmptySolve();
        const get = (name: string): string => item[keyIndex[name]] ?? '';
        const getNumber = (name: string): number => Number(get(name));

        solve.source = 'acubemy';
        solve.rawSource = 'acubemy';

        const solveId = get("solve_id");
        solve.id = `acubemy-${solveId}`;
        solve.rawSourceId = solveId;

        const dateStr = get("date");
        if (dateStr) {
            solve.date = new Date(dateStr);
        }

        solve.time = getNumber("total_time") / 1000;
        if (solve.time < 1) {
            solve.isCorrupt = true;
        }

        // Acubemy exports don't include inspection time. Keep it as `null` unless the column exists.
        const inspectionTimeRaw = get("inspection_time");
        const inspectionMs = inspectionTimeRaw ? Number(inspectionTimeRaw) : NaN;
        solve.inspectionTime = Number.isFinite(inspectionMs) && inspectionMs >= 0
            ? inspectionMs / 1000
            : null;

        solve.scramble = get("scramble");

        solve.session = get("session_name");

        const analysisType = get("analysis_type")?.toUpperCase() ?? "";
        if (analysisType.includes("ROUX")) {
            solve.method = MethodName.Roux;
        } else if (analysisType.includes("ZZ")) {
            solve.method = MethodName.ZZ;
        } else if (analysisType.includes("CFOP")) {
            solve.method = MethodName.CFOP;
        }

        const crossFace = get("cross_face");
        if (crossFace) solve.crossColor = crossColors['URFDLB'.indexOf(crossFace)] ?? CrossColor.Unknown;
        if (solve.method === MethodName.CFOP && crossFace) solve.firstF2LPair = firstF2LPair(solve.scramble, get('raw_solution') || get('solution'), 'URFDLB'.indexOf(crossFace), crossColors);

        const steps = solve.steps;
        const ollCaseRaw = get("oll_case_id");
        const pllCaseRaw = get("pll_case_name");

        if (solve.method === MethodName.CFOP) {
            // Acubemy uses zero-based OLL IDs, with -1 for a skip.
            solve.steps = ACUBEMY_STEP_DEFS.map(def => ({
                ...steps[def.index], name: def.name, moves: stripRotationsFromMoveString(get(def.movesField)),
                turns: countMovesExcludingRotations(get(def.movesField)),
                case: def.name === StepName.OLL ? ollCaseRaw === '-1' ? 'Solved'
                    : /^\d+$/.test(ollCaseRaw) && +ollCaseRaw < 57 ? String(+ollCaseRaw + 1) : ''
                    : def.name === StepName.PLL ? pllCaseRaw === 'Unknown' ? 'Solved' : pllCaseRaw : '',
            }));
        } else {
            solve.steps = Const.MethodSteps[solve.method].map((name, i) => ({ ...steps[i], name }));
        }

        const solutionMovesRaw = get("solution") || get("raw_solution");
        const moveTimesRaw = get("move_times");
        if (keepRecording) solve.recording = get("raw_solution") && get("raw_timestamps")
            ? { solution: get("raw_solution"), timestamps: get("raw_timestamps") }
            : { solution: solutionMovesRaw, timestamps: moveTimesRaw };
        const { solutionNoRot, moveTimesNoRot } = stripRotationsFromSolutionAndTimes(solutionMovesRaw, moveTimesRaw);

        solve.turns = countMovesExcludingRotations(solutionNoRot || solutionMovesRaw);
        solve.tps = solve.time > 0 ? solve.turns / solve.time : 0;

        const crossExecMs = getNumber("cross_execution_time");
        const crossTimeMs = getNumber("cross_time");
        const crossCsvExecutionFallbackSec =
            crossExecMs > 0
                ? crossExecMs / 1000
                : crossTimeMs > 0
                  ? crossTimeMs / 1000
                  : 0;

        if (solve.method === MethodName.CFOP && solutionNoRot && moveTimesNoRot) {
            const solveAufMoves = getAufMovesForSolve(solve);
            recomputeAcubemyStepTimes(
                solve,
                ACUBEMY_STEP_DEFS,
                solutionNoRot,
                moveTimesNoRot,
                solveAufMoves,
                crossCsvExecutionFallbackSec
            );
        }

        return solve;
    });

    return formedArr.sort((a: Solve, b: Solve) => a.date.getTime() - b.date.getTime());
}

export function parseCsv(stringVal: string, splitter: string, keepRecording = false): Solve[] {
    // Only the first line is needed, so avoid splitting the whole 45MB export to find it.
    const firstBreak = stringVal.indexOf("\n");
    const header = (firstBreak < 0 ? stringVal : stringVal.slice(0, firstBreak)).trim();

    if (!header.includes("solve_id,date,total_time")) return parseCubeastCsv(stringVal, splitter, keepRecording);
    const solves = parseAcubemyCsv(stringVal, splitter, keepRecording);
    for (const solve of solves) for (const step of solve.steps) {
        const turns = step.turns;
        if (!consolidateStep(step)) continue;
        solve.turns += step.turns - turns;
        solve.tps = solve.time > 0 ? solve.turns / solve.time : 0;
    }
    return solves;
}
