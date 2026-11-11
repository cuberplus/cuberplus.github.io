import { algorithms } from '../../src/database/algorithms';
import { caseGroup, compareCases } from '../../src/database/caseGroups';
import images from '../../src/database/caseImages.json';
import { locations } from '../../shared/cube/cubeLocations';
import { EDGES, EDGE_MOVES, FACES, MOVES } from '../../scrambler/src/cube/cube';

const entry = (category: string, id: string) => algorithms.find(item => item.category === category && item.id === id)!;
test('OLL groups follow edge orientation rather than case number', () => {
  expect(caseGroup(entry('OLL', '1'))).toBe('Dot');
  expect(caseGroup(entry('OLL', '45'))).toBe('Line');
  expect(caseGroup(entry('OLL', '44'))).toBe('Angle');
  expect(caseGroup(entry('OLL', '27'))).toBe('Cross');
  const sorted = [entry('OLL', '27'), entry('OLL', '44'), entry('OLL', '45'), entry('OLL', '1')].sort(compareCases);
  expect(sorted.map(item => item.id)).toEqual(['1', '45', '44', '27']);
});
test('PLL sorting separates adjacent, diagonal and solved corners, with stable case names within groups', () => {
  const sorted = ['Z', 'Y', 'T', 'H', 'E', 'Aa'].map(id => entry('PLL', id)).sort(compareCases);
  expect(sorted.map(item => item.id)).toEqual(['Aa', 'T', 'E', 'Y', 'H', 'Z']);
});
test.each(['F2L', 'AF2L', 'OF2L'])('%s groups target edge orientation consistently and sorts numeric suffixes naturally', category => {
  const entries = algorithms.filter(entry => entry.category === category).sort(compareCases);
  const groups = entries.map(caseGroup);
  expect(new Set(groups)).toEqual(new Set(['Oriented edge', 'Unoriented edge']));
  expect(groups.lastIndexOf('Oriented edge')).toBeLessThan(groups.indexOf('Unoriented edge'));
  expect(caseGroup(entry('F2L', '1'))).toBe('Oriented edge');
  expect(caseGroup(entry('F2L', '2'))).toBe('Unoriented edge');
  expect(caseGroup(entry('F2L', '3'))).toBe('Unoriented edge');
  expect(caseGroup(entry('F2L', '13'))).toBe('Unoriented edge');
});
test('every standard and advanced F2L category agrees with independent RULD edge reachability', () => {
  const moves = MOVES.flatMap((move, i) => /^[RULD]/.test(move) ? [i] : []);
  for (const item of algorithms.filter(item => item.category.endsWith('F2L'))) {
    const target = locations.EDGES[[8, 9, 11, 10][(item.pair ?? 4) - 4]].map(i => Math.floor(i / 9));
    const home = EDGES.findIndex(edge => edge.every(face => target.includes(face)));
    const reachable = new Set([home * 2]), queue = [home * 2];
    for (const state of queue) for (const move of moves) {
      const next = EDGE_MOVES[state * 18 + move];
      if (!reachable.has(next)) { reachable.add(next); queue.push(next); }
    }
    expect(reachable.size).toBe(12);
    const { facelets } = images[`${item.category}-${item.id}` as keyof typeof images];
    const stickers = locations.EDGES.find(stickers => stickers.every(i => target.map(face => FACES[face]).includes(facelets[i] as typeof FACES[number])))!;
    const faces = stickers.map(i => Math.floor(i / 9));
    const position = EDGES.findIndex(edge => edge.every(face => faces.includes(face)));
    const marker = stickers.find(i => facelets[i] === FACES[EDGES[home][0]])!;
    const state = position * 2 + EDGES[position].indexOf(Math.floor(marker / 9));
    expect({ case: `${item.category} ${item.id}`, group: caseGroup(item) }).toEqual({
      case: `${item.category} ${item.id}`, group: reachable.has(state) ? 'Oriented edge' : 'Unoriented edge',
    });
  }
});
