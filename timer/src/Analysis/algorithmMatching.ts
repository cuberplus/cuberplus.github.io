import { Alg, Move } from 'cubing/alg';
import type { KPattern, KTransformation } from 'cubing/kpuzzle';
import type { Cube } from '../Core/puzzle';

export const cubeRotations = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap(tilt =>
  ['', 'y', 'y2', "y'"].map(yaw => `${tilt} ${yaw}`.trim()));
const faces = 'ULFRBD', axes = ['UD', 'RL', 'FB'];
const stateKey = (pattern: KPattern) => JSON.stringify([
  pattern.patternData.CORNERS, pattern.patternData.EDGES, pattern.patternData.CENTERS.pieces,
]);

export class AlgorithmMatcher {
  private decompositions = new Map<string, string[]>();
  private factors = new Map<string, { moves: string[]; rotation: KTransformation }>();
  private rotations: KTransformation[];
  private signatures = new Map<string, string>();
  constructor(private cube: Cube) {
    // Factor each notation move into recorded outer turns and an unrecorded rotation.
    const turns = ['', '', '2', "'"];
    this.rotations = cubeRotations.map(rotation => cube.puzzle.algToTransformation(rotation));
    for (const axis of axes) {
      for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
        const moves = [a ? axis[0] + turns[a] : '', b ? axis[1] + turns[b] : ''].filter(Boolean);
        const pattern = cube.solved().applyAlg(moves.join(' '));
        const key = stateKey(pattern);
        if (!this.decompositions.has(key)) this.decompositions.set(key, moves);
      }
    }
  }
  outerMoves(algorithm: string, onMove?: (move: string, index: number) => void): { moves: string[]; rotation: KTransformation } {
    let rotation = this.cube.puzzle.identityTransformation();
    if (/^\s*(?:[URFDLB](?:2'?|')?(?:\s+|$))*$/.test(algorithm)) {
      const moves = algorithm.trim() ? algorithm.trim().split(/\s+/).map(move => move.replace("2'", '2')) : [];
      if (onMove) moves.forEach(onMove);
      return { moves, rotation };
    }
    const moves: string[] = [];
    let index = 0;
    for (const node of new Alg(algorithm).experimentalExpand()) {
      if (!(node instanceof Move)) continue;
      const notation = node.toString();
      let factor = this.factors.get(notation);
      if (!factor) {
        const pattern = this.cube.solved().applyMove(node), centers = pattern.patternData.CENTERS.pieces;
        const frame = this.rotations.find(rotation => rotation.transformationData.CENTERS.permutation.every((piece, i) => piece === centers[i]))!;
        const outer = this.decompositions.get(stateKey(pattern.applyTransformation(frame.invert())));
        if (outer) this.factors.set(notation, factor = { moves: outer, rotation: frame });
      }
      if (!factor) throw new Error(`Unsupported algorithm move: ${node.toString()}`);
      const centers = this.cube.solved().applyTransformation(rotation).patternData.CENTERS.pieces;
      const outer = factor.moves.map(move => faces[centers[faces.indexOf(move[0])]] + move.slice(1));
      moves.push(...outer);
      if (onMove) for (const move of outer) onMove(move, index);
      index++;
      rotation = rotation.applyTransformation(factor.rotation);
    }
    return { moves, rotation };
  }
  signature(algorithm: string): string {
    const cached = this.signatures.get(algorithm);
    if (cached !== undefined) return cached;
    const moves = this.outerMoves(algorithm).moves;
    const variants = ['', 'y', 'y2', "y'"].map(yaw => {
      const centers = this.cube.solved().applyAlg(yaw).patternData.CENTERS.pieces;
      const blocks: { axis: string; amounts: number[] }[] = [];
      for (const move of moves) {
        const face = faces[centers[faces.indexOf(move[0])]], axis = axes.find(axis => axis.includes(face))!;
        if (blocks.at(-1)?.axis !== axis) blocks.push({ axis, amounts: [0, 0] });
        const block = blocks.at(-1)!, i = axis.indexOf(face);
        block.amounts[i] = (block.amounts[i] + (move.includes('2') ? 2 : move.endsWith("'") ? 3 : 1)) % 4;
        if (block.amounts.every(amount => !amount)) blocks.pop();
      }
      const tokens = blocks.flatMap(({ axis, amounts }) => amounts.flatMap((amount, i) =>
        amount ? [axis[i] + (amount === 2 ? '2' : amount === 3 ? "'" : '')] : []));
      while (tokens[0]?.[0] === 'U') tokens.shift();
      while (tokens.at(-1)?.[0] === 'U') tokens.pop();
      return tokens.join(' ');
    });
    const signature = variants.sort()[0];
    this.signatures.set(algorithm, signature);
    return signature;
  }
}

const matchers = new WeakMap<Cube, AlgorithmMatcher>();
export function algorithmMatcher(cube: Cube): AlgorithmMatcher {
  let matcher = matchers.get(cube);
  if (!matcher) matchers.set(cube, matcher = new AlgorithmMatcher(cube));
  return matcher;
}
