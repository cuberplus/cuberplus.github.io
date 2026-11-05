import type { KPattern } from 'cubing/kpuzzle';
import { locations, type Cube } from '../../timer/src/puzzle';
import alternatives from './alternatives.json';

export type Category = 'F2L' | 'AF2L' | 'OLL' | 'PLL';
export interface AlgorithmCase { category: Category; id: string; algorithm: string; options: string[]; setup?: string; pair?: number }
type CaseDefinition = Omit<AlgorithmCase, 'options'>;
export interface IllustratedCase extends AlgorithmCase { facelets: string; visibleStickers: number[] }
export const categories: Category[] = ['F2L', 'AF2L', 'OLL', 'PLL'];
// Highest community-voted algorithms in SpeedCubeDB's default (front-right F2L) view, November 4, 2026.
const f2l = [
  "U R U' R'",
  "F R' F' R",
  "F' U' F",
  "R U R'",
  "U' R U R' U2 R U' R'",
  "U' r U' R' U R U r'",
  "U' R U2 R' U' R U2 R'",
  "r' U2 R2 U R2 U r",
  "U' R U' R' U F' U' F",
  "U' R U R' U R U R'",
  "U' R U2 R' U F' U' F",
  "R U' R' U R U' R' U2 R U' R'",
  "y' U R' U R U' R' U' R",
  "U' R U' R' U R U R'",
  "M U r U' r' U' M'",
  "R U' R' U2 F' U' F",
  "R U2 R' U' R U R'",
  "y' R' U2 R U R' U' R",
  "U R U2 R' U R U' R'",
  "y' U' R' U2 R U' R' U R",
  "U2 R U R' U R U' R'",
  "r U' r' U2 r U r'",
  "U R U' R' U' R U' R' U R U' R'",
  "F U R U' R' F' R U' R'",
  "U' R' F R F' R U R'",
  "U R U' R' F R' F' R",
  "R U' R' U R U' R'",
  "R U R' U' F R' F' R",
  "R' F R F' U R U' R'",
  "R U R' U' R U R'",
  "U' R' F R F' R U' R'",
  "U R U' R' U R U' R' U R U' R'",
  "U' R U' R' U2 R U' R'",
  "U R U R' U2 R U R'",
  "U' R U R' U F' U' F",
  "U F' U' F U' R U R'",
  "R2 U2 F R2 F' U2 R' U R'",
  "R U' R' U' R U R' U2 R U' R'",
  "R U' R' U R U2 R' U R U' R'",
  "r U' r' U2 r U r' R U R'",
  "R U' R' r U' r' U2 r U r'",
];
const oll = [
  "R U2 R2 F R F' U2 R' F R F'",
  "y' R U' R2 D' r U r' D R2 U R'",
  "y' f R U R' U' f' U' F R U R' U' F'",
  "y' R' F2 R2 U2 R' F' R U2 R2 F2 R",
  "r' U2 R U R' U r",
  "r U2 R' U' R U' r'",
  "r U R' U R U2 r'",
  "y2 r' U' R U' R' U2 r",
  "y R U R' U' R' F R2 U R' U' F'",
  "R U R' U R' F R F' R U2 R'",
  "r' R2 U R' U R U2 R' U M'",
  "y' M' R' U' R U' R' U2 R U' M",
  "F U R U2 R' U' R U R' F'",
  "R' F R U R' F' R F U' F'",
  "r' U' r R' U' R U r' U r",
  "r U r' R U R' U' r U' r'",
  "R U R' U R' F R F' U2 R' F R F'",
  "y R U2 R2 F R F' U2 M' U R U' r'",
  "y S' R U R' S U' R' F R F'",
  "r U R' U' M2 U R U' R' U' M'",
  "R U R' U R U' R' U R U2 R'",
  "R U2 R2 U' R2 U' R2 U2 R",
  "R2 D R' U2 R D' R' U2 R'",
  "r U R' U' r' F R F'",
  "R U2 R D R' U2 R D' R2",
  "y R U2 R' U' R U' R'",
  "R U R' U R U2 R'",
  "r U R' U' M U R U' R'",
  "r2 D' r U r' D r2 U' r' U' r",
  "y2 F U R U2 R' U' R U2 R' U' F'",
  "R' U' F U R U' R' F' R",
  "S R U R' U' R' F R f'",
  "R U R' U' R' F R F'",
  "y f R f' U' r' U' R U M'",
  "R U2 R2 F R F' R U2 R'",
  "y R U R2 F' U' F U R2 U2 R'",
  "F R' F' R U R U' R'",
  "R U R' U R U' R' U' R' F R F'",
  "y' f' r U r' U' r' F r S",
  "y R' F R U R' U' F' U R",
  "y2 R U R' U R U2 R' F R U R' U' F'",
  "R' U' R U' R' U2 R F R U R' U' F'",
  "y R' U' F' U F R",
  "f R U R' U' f'",
  "F R U R' U' F'",
  "R' U' R' F R F' U R",
  "y' F R' F' R U2 R U' R' U R U2 R'",
  "F R U R' U' R U R' U' F'",
  "y2 r U' r2 U r2 U r2 U' r",
  "r' U r2 U' r2 U' r2 U r'",
  "y2 F U R U' R' U R U' R' F'",
  "y2 R' F' U' F U' R U R' U R",
  "r' U' R U' R' U R U' R' U2 r",
  "r U R' U R U' R' U R U2 r'",
  "y R' F U R U' R2 F' R2 U R' U' R",
  "r U r' U R U' R' U R U' R' r U' r'",
  "R U R' U' M' U R U' r'",
];
const pll = {
  Aa: "x R' U R' D2 R U' R' D2 R2 x'",
  Ab: "x R2 D2 R U R' D2 R U' R x'",
  E: "y x' R U' R' D R U R' D' R U R' D R U' R' D' x",
  F: "y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
  Ga: "R2 U R' U R' U' R U' R2 D U' R' U R D'",
  Gb: "D R' U' R U D' R2 U R' U R U' R U' R2",
  Gc: "R2 U' R U' R U R' U R2 D' U R U' R' D",
  Gd: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
  H: 'M2 U M2 U2 M2 U M2',
  Ja: "y2 x R2 F R F' R U2 r' U r U2 x'",
  Jb: "R U R' F' R U R' U' R' F R2 U' R'",
  Na: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
  Nb: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
  Ra: "y R U' R' U' R U R D R' U' R D' R' U2 R'",
  Rb: "R' U2 R U2 R' F R U R' U' R' F' R2",
  T: "R U R' U' R' F R2 U' R' U' R U R' F'",
  Ua: "y2 M2 U M U2 M' U M2",
  Ub: "y2 M2 U' M U2 M' U' M2",
  V: "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2",
  Y: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  Z: "M' U' M2 U' M2 U' M' U2 M2",
};
// Canonical advanced setups retain the occupied slots; pair identifies the target corner.
const advancedF2l: [string, string, string, number][] = [
  ["1", "S R' S'", "S R S'", 7],
  ["1a", "U2 R U' R' U' R' U' R", "f R S' R' F' R", 7],
  ["2", "L F' U2 F L'", "L U2' L' R U R'", 6],
  ["2a", "R' F R F' L U2 L'", "L U2' L' F R' F' R", 6],
  ["3", "R U' R' U F' r U r'", "L F' L' F U' R U R'", 5],
  ["3a", "R' F R2 U' R' U F'", "r U' r' F U' F R' F' R", 5],
  ["4", "F R' F' R U R' U2 R", "Fw R' Fw' U2' R U' R'", 7],
  ["4a", "U R U R2 U2 R", "R' U2' R2' U' R' U'", 7],
  ["5", "R U R' U L U L'", "L U' L' U' R U' R'", 6],
  ["5a", "U R U R' f' L f", "f' L' f R U' R' U'", 6],
  ["6", "R U R' F U F'", "F U' F' R U' R'", 5],
  ["6a", "U R L' U L R'", "L' U' L U R U' R' U'", 5],
  ["7", "U' F' U' f R S'", "Fw R' Fw' U F R' F' R U", 7],
  ["7a", "U2 R U' R' U2 R' U R", "R' U' R U2' R U R' U2'", 7],
  ["8", "U' F' U2 L U L' F", "L U' L' U2' F R' F' R U", 6],
  ["8a", "U2 R U' R' d L' U L", "f' L' f U' R U R' U2'", 6],
  ["9", "y' U R' U2 R U' R U R'", "F U' F' U' F R' F' R U", 5],
  ["9a", "U2 R U' R' L' U L", "L' U' L R U R' U2'", 5],
  ["10", "U' R U R2 U' R", "R' U R2' U' R' U", 7],
  ["10a", "U' R U' R' U f R' f'", "F' R' U R F U", 7],
  ["11", "U' R U' R' L U' L'", "L U L' R U R' U", 6],
  ["11a", "U' R U R' y' U' L' U' L", "L F' U' F U L' U2'", 6],
  ["12", "U2 R U R' L' U L", "L' U L U2' R U' R' U", 5],
  ["12a", "U' R U' R' U2 F' r U r'", "F U2' F' R U R' U", 5],
  ["13", "U R' F R F' R' U' R", "R' U R F R' F' R U'", 7],
  ["14", "U' F R' F' R U L U L'", "Fw' L Fw U F R' F' R U'", 6],
  ["15", "U R' F R2 U' R' U2 F'", "L' U L U2' F R' F' R U'", 5],
  ["16", "U' F' R' U' R F", "F' R' U R F U", 7],
  ["17", "U2 R B' U' B R'", "Fw' L Fw U R U' R' U", 6],
  ["18", "U F' U2 F L' U' L", "L' U L U F' U F U", 5],
  ["19", "U' R U2 R' f R f'", "f R' f' U' R U' R' U'", 7],
  ["20", "U R U R' L U L'", "L U' L' R U' R' U'", 6],
  ["21", "U R F U F' R'", "R F U' F' R' U'", 5],
  ["22", "R U' R2 U R", "R' U' R2' U R'", 7],
  ["23", "L F' U F L'", "L F' U' F L'", 6],
  ["24", "R U' R' U2 L' U L", "L' R U2' R' L", 5],
  ["25", "R' F R F' U R' U2 R", "Fw R' Fw' U R U R'", 7],
  ["26", "L R U2 R' L'", "R L U2' L' R'", 6],
  ["27", "R' F R2 U R' F'", "r U' r' F R U' R'", 5],
  ["28", "R U' R2 U' R U' R' U' R", "R' U R2 U' R' D U' R' U R D'", 7],
  ["29", "F' U L' U L U' L U L' F", "Fw' L Fw U R U R' U R U R'", 6],
  ["30", "R U' R' U' L' U L U L' U' L", "L' U L U2' R U R' U R U R'", 5],
  ["31", "R U R' U' R U' R' U R' U' R", "R' U' R U R' U R U' R U R'", 7],
  ["32", "R U R' U' R U' R' f' L' f", "Fw' L Fw U2' L U L' U' R U' R'", 6],
  ["33", "R U' R' U' L' U' L U' L' U L", "L' U L U R U R' U R U' R'", 5],
  ["34", "F' R' U R U' R' U' R F", "F' R' U R U R' U' R F", 7],
  ["35", "R U' R' U' R U R' L U' L'", "L U' L' U L U2' L' R U2' R'", 6],
  ["36", "R' F R2 U' R' U' R U R' U2 F'", "F U' F' U F U2' F' R U' R'", 5],
  ["37", "R U R' U2 R U' R' f R f'", "Fw R' Fw' R U R' U2' R U' R'", 7],
  ["38", "R U' R' U R U2 R' L U2 L'", "L U' L' U' L U L' R U' R'", 6],
  ["39", "R U R' d' L U' L' U L U L'", "F U' F' U' F U F' U R U' R'", 5],
  ["40", "R U' R2 U2 R U R' U2 R", "R' U R2' U2' R' U' R U2' R'", 7],
  ["41", "R U' R' d R' U2 R L' U L", "Fw' L Fw U R U2' R' U' R U2' R'", 6],
  ["42", "R U' R' U2 L' U2 L U2 L' U L", "L U L2' U L2' U2' L' U R U2' R'", 5],
];
const pairEdges = [8, 9, 11, 10];
export const algorithms: AlgorithmCase[] = [
  ...f2l.map((algorithm, i): CaseDefinition => ({ category: 'F2L', id: String(i + 1), algorithm })),
  ...advancedF2l.map(([id, algorithm, setup, pair]): CaseDefinition => ({ category: 'AF2L', id, algorithm, setup, pair })),
  ...oll.map((algorithm, i): CaseDefinition => ({ category: 'OLL', id: String(i + 1), algorithm })),
  ...Object.entries(pll).map(([id, algorithm]): CaseDefinition => ({ category: 'PLL', id, algorithm })),
].map(entry => ({ ...entry, options: [entry.algorithm, ...alternatives[`${entry.category}-${entry.id}` as keyof typeof alternatives]] }));

export function casePattern(cube: Cube, algorithm: string): KPattern {
  const transform = cube.puzzle.algToTransformation(algorithm);
  const centers = transform.transformationData.CENTERS.permutation;
  // Start with calibrated centers, even when the algorithm ends in a rotated frame.
  const frame = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap(tilt =>
    ['', 'y', 'y2', "y'"].map(yaw => cube.solved().applyAlg(`${tilt} ${yaw}`)))
    .find(pattern => pattern.patternData.CENTERS.pieces.every((piece, i) => piece === centers[i]))!;
  return frame.applyTransformation(transform.invert());
}

export const illustrateCases = (cube: Cube): IllustratedCase[] =>
  algorithms.map(entry => {
    const pattern = entry.setup ? cube.solved().applyAlg(entry.setup) : casePattern(cube, entry.algorithm);
    const corners = new Set([entry.pair ?? 4]);
    if (entry.category === 'AF2L') {
      for (let corner = 4; corner < 8; corner++) {
        const edge = pairEdges[corner - 4], { EDGES, CORNERS } = pattern.patternData;
        if (EDGES.pieces[edge] === edge && !EDGES.orientation[edge] &&
          CORNERS.pieces[corner] === corner && !CORNERS.orientation[corner]) corners.add(corner);
      }
    }
    const edges = new Set([...corners].map(corner => pairEdges[corner - 4]));
    const visibleStickers = [4, 13, 22, 31, 40, 49];
    for (const orbit of ['EDGES', 'CORNERS'] as const) {
      pattern.patternData[orbit].pieces.forEach((piece, position) => {
        if (orbit === 'EDGES' ? piece >= 4 && piece <= 7 || edges.has(piece) : corners.has(piece)) {
          visibleStickers.push(...locations[orbit][position]);
        }
      });
    }
    return { ...entry, facelets: cube.facelets(pattern), visibleStickers };
  });
