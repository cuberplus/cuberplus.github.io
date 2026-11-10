import type { AlgorithmCase } from './algorithms';
import images from './caseImages.json';
import { locations } from '../../shared/cube/cubeLocations';

export function caseGroup(entry: AlgorithmCase): string {
  const { facelets } = images[`${entry.category}-${entry.id}` as keyof typeof images] ?? {};
  if (!facelets) return '';
  if (entry.category === 'OLL') {
    const edges = [1, 3, 5, 7].filter(i => facelets[i] === 'U');
    return edges.length === 0 ? 'Dot' : edges.length === 4 ? 'Cross' :
      edges.length === 2 && edges[0] + edges[1] === 8 ? 'Line' : 'Angle';
  }
  if (entry.category === 'PLL') {
    if (['H', 'Ua', 'Ub', 'Z'].includes(entry.id)) return 'Solved corners';
    return ['E', 'Na', 'Nb', 'V', 'Y'].includes(entry.id) ? 'Diagonal corners' : 'Adjacent corners';
  }
  const target = locations.EDGES[[8, 9, 11, 10][(entry.pair ?? 4) - 4]];
  const colors = target.map(i => 'URFDLB'[Math.floor(i / 9)]);
  const position = locations.EDGES.find(stickers => stickers.every(i => colors.includes(facelets[i])));
  // The F/B sticker faces U/D in the U/D layers, but F/B in the middle layer.
  const sticker = position?.find(i => facelets[i] === colors.find(color => 'FB'.includes(color)));
  const inUDLayer = position?.some(i => [0, 3].includes(Math.floor(i / 9)));
  return sticker !== undefined && (inUDLayer ? [0, 3] : [2, 5]).includes(Math.floor(sticker / 9)) ? 'Oriented edge' : 'Unoriented edge';
}
const groups = ['Oriented edge', 'Unoriented edge', 'Dot', 'Line', 'Angle', 'Cross', 'Adjacent corners', 'Diagonal corners', 'Solved corners'];
export function compareCases(a: AlgorithmCase, b: AlgorithmCase) {
  return groups.indexOf(caseGroup(a)) - groups.indexOf(caseGroup(b)) || a.id.localeCompare(b.id, undefined, { numeric: true });
}
