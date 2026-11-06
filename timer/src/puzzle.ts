import { KPattern, type KPatternData, type KPuzzle } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { randomScrambleForEvent } from 'cubing/scramble';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { locations } from '../../shared/cubeLocations';
export { locations } from '../../shared/cubeLocations';

export const SOLVED = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
const pieceLookup = { EDGES: new Map<string, [number, number]>(), CORNERS: new Map<string, [number, number]>() };
for (const orbit of ['EDGES', 'CORNERS'] as const) locations[orbit].forEach((home, piece) => {
  for (let twist = 0; twist < home.length; twist++) {
    pieceLookup[orbit].set(home.map((_, sticker) =>
      SOLVED[home[(sticker - twist + home.length) % home.length]]).join(''), [piece, twist]);
  }
});
export const crossRotation = (cross: number | null): string => ['x2', 'z', "x'", '', "z'", 'x'][cross ?? 3];
export const isMove = (move: string): boolean => /^[URFDLB](2|'|2')?$/.test(move);
export const movesOf = (alg: string): string[] => alg.trim() ? alg.trim().split(/\s+/) : [];
export const inverse = (move: string): string => move.includes('2') ? move[0] + '2' : move.endsWith("'") ? move[0] : move + "'";
export const sameAxis = (first: string, second: string): boolean => ['UD', 'RL', 'FB'].some(axis => axis.includes(first[0]) && axis.includes(second[0]));
export function simplifyMoves(moves: readonly string[]): string[] {
  const result: string[] = [];
  const amount = (move: string) => move.includes('2') ? 2 : move.endsWith("'") ? 3 : 1;
  const notation = (face: string, turns: number) => face + (turns === 2 ? '2' : turns === 3 ? "'" : '');
  for (const move of moves) {
    let merged = false;
    // Search across opposite-face turns only; all other move order stays unchanged.
    for (let i = result.length - 1; i >= 0 && sameAxis(result[i], move); i--) {
      if (result[i][0] !== move[0]) continue;
      const turns = (amount(result[i]) + amount(move)) % 4;
      if (turns) result[i] = notation(move[0], turns);
      else result.splice(i, 1);
      merged = true;
      break;
    }
    if (!merged) result.push(notation(move[0], amount(move)));
  }
  return result;
}

const parity = (pieces: number[]): number => pieces.reduce((n, piece, i) => n + pieces.slice(i + 1).filter(other => other < piece).length, 0) % 2;

export class Cube {
  constructor(readonly puzzle: KPuzzle) {}
  solved(): KPattern { return this.puzzle.defaultPattern(); }
  facelets(pattern: KPattern): string {
    const stickers = SOLVED.split('');
    for (const orbit of ['EDGES', 'CORNERS'] as const) {
      const data = pattern.patternData[orbit];
      locations[orbit].forEach((indices, position) => indices.forEach((index, sticker) => {
        stickers[index] = SOLVED[locations[orbit][data.pieces[position]][(sticker - data.orientation[position] + indices.length) % indices.length]];
      }));
    }
    return stickers.join('');
  }
  parse(facelets: string): KPattern {
    if (facelets.length !== 54) throw new Error('Expected a legal 3x3 state in the calibrated URFDLB frame.');
    const counts = new Uint8Array(6);
    for (const face of facelets) {
      const color = 'URFDLB'.indexOf(face);
      if (color < 0) throw new Error('Expected a legal 3x3 state in the calibrated URFDLB frame.');
      counts[color]++;
    }
    if ([...'URFDLB'].some((face, i) =>
      facelets[i * 9 + 4] !== face || counts[i] !== 9)) {
      throw new Error('Expected a legal 3x3 state in the calibrated URFDLB frame.');
    }
    const data: KPatternData = structuredClone(this.solved().patternData);
    for (const orbit of ['EDGES', 'CORNERS'] as const) {
      const size = locations[orbit][0].length;
      locations[orbit].forEach((indices, position) => {
        const found = pieceLookup[orbit].get(indices.map(index => facelets[index]).join(''));
        if (!found) throw new Error('Invalid cube pieces.');
        const [piece, twist] = found;
        data[orbit].pieces[position] = piece;
        data[orbit].orientation[position] = twist;
      });
      if (new Set(data[orbit].pieces).size !== locations[orbit].length ||
          data[orbit].orientation.reduce((a, b) => a + b, 0) % size) throw new Error('Invalid cube orientation.');
    }
    if (parity(data.EDGES.pieces) !== parity(data.CORNERS.pieces)) throw new Error('Invalid cube parity.');
    return new KPattern(this.puzzle, data);
  }
  equals(a: KPattern, b: KPattern): boolean { return this.facelets(a) === this.facelets(b); }
  isSolved(pattern: KPattern): boolean { return pattern.experimentalIsSolved({ ignoreCenterOrientation: true, ignorePuzzleOrientation: true }); }
  async solution(facelets: string): Promise<string[]> {
    return movesOf((await experimentalSolve3x3x3IgnoringCenters(this.parse(facelets))).toString());
  }
}

export const loadCube = async (): Promise<Cube> => new Cube(await puzzles['3x3x3'].kpuzzle());
export const generateScramble = async (): Promise<string> => simplifyMoves(movesOf((await randomScrambleForEvent('333')).toString())).join(' ');
