import { FACES, NORMALS } from '../../scrambler/src/cube/cube';
import { locations } from '../../shared/cube/cubeLocations';

export function floatingFaces(facelets: string, pair = 4): number[] {
  const target = ['CORNERS', 'EDGES'].flatMap(orbit => {
    const pieces = locations[orbit as keyof typeof locations];
    const identity = orbit === 'CORNERS' ? pair : [8, 9, 11, 10][pair - 4];
    const colors = pieces[identity].map(index => FACES[Math.floor(index / 9)]);
    return pieces.find(indices => indices.every(index => colors.includes(facelets[index] as typeof FACES[number]))) ?? [];
  });
  return [4, 5, 3].filter(face => target.some(index => Math.floor(index / 9) === face));
}

export function projectFace(face: number, col: number, row: number, floating = false): number[] {
  const u = col * 2 / 3 - 1, v = row * 2 / 3 - 1;
  const position = [[u, 1, v], [1, -v, -u], [u, -v, 1],
    [u, -1, -v], [-1, -v, u], [-u, -v, -1]][face];
  // More than one cube width clears the entire hidden face, not just its outer row.
  const [x, y, z] = position.map((value, axis) => value + (floating ? NORMALS[face][axis] * 2.25 : 0));
  return [55 + 27 * (x - z), 55 + 13.5 * (x + z) - 27 * y];
}

export function diagramViewBox(faces: number[]): string {
  if (!faces.length) return '0 0 110 110';
  const points = [[2, 2], [108, 108], ...faces.flatMap(face =>
    [[0, 0], [3, 0], [3, 3], [0, 3]].map(([col, row]) => projectFace(face, col, row, true)))];
  const min = [0, 1].map(axis => Math.floor(Math.min(...points.map(point => point[axis])) - 2));
  const max = [0, 1].map(axis => Math.ceil(Math.max(...points.map(point => point[axis])) + 2));
  return [...min, ...max.map((value, axis) => value - min[axis])].join(' ');
}
