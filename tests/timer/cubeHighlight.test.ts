import { jest } from '@jest/globals';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { highlightCubies } from '../../timer/src/Components/cubeHighlight';

function cubie() {
  const group = new Group();
  for (const color of ['#222222', '#009b48', '#ffffff']) {
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color }));
    mesh.position.set(0, 1, 1); group.add(mesh);
  }
  return group;
}
test.each(['black', 'white', 'color'] as const)('%s edge highlights pop farther out, retain sticker colors and restore cleanly', aura => {
  const edge = cubie(), other = cubie(), corner = cubie();
  const originals = [...edge.children] as Mesh<BoxGeometry, MeshBasicMaterial>[];
  const colors = originals.map(mesh => mesh.material.color.getHexString());
  const materials = originals.map(mesh => mesh.material);
  const puzzle = Object.assign(new Group(), { pieces: { EDGES: [edge, other], CORNERS: [corner] }, scheduleRenderCallback: jest.fn() });
  const restore = highlightCubies(puzzle as Parameters<typeof highlightCubies>[0], { EDGES: [0], CORNERS: [0] }, aura);
  expect(edge.children).toHaveLength(5);
  expect(originals[0].scale.x).toBeCloseTo(1.1);
  expect(originals[0].position.y).toBeCloseTo(1.26);
  expect(originals.slice(1).map(mesh => mesh.material.color.getHexString())).toEqual(colors.slice(1));
  expect(corner.children[0].scale.x).toBeCloseTo(1.06);
  expect(other.children[0].scale.x).toBe(1);
  expect(other.children[0].position.y).toBe(1);
  const outlines = edge.children.slice(3) as Mesh<BoxGeometry, MeshBasicMaterial>[];
  for (const [index, outline] of outlines.entries()) {
    const expected = materials[index + 1].color.clone();
    if (aura === 'color') expected.multiplyScalar(.35);
    else expected.set(aura === 'white' ? '#ffffff' : '#000000');
    expect(outline.material.color.getHexString()).toBe(expected.getHexString());
    expect(outline.scale.x / originals[index + 1].scale.x).toBeCloseTo(1.2);
    expect(outline.position.y).toBeLessThan(originals[index + 1].position.y);
  }
  const disposed = outlines.map(mesh => jest.spyOn(mesh.material, 'dispose'));
  restore();
  expect(edge.children).toEqual(originals);
  originals.forEach((mesh, index) => {
    expect(mesh.scale.toArray()).toEqual([1, 1, 1]);
    expect(mesh.position.toArray()).toEqual([0, 1, 1]);
    expect(mesh.material).toBe(materials[index]);
  });
  disposed.forEach(dispose => expect(dispose).toHaveBeenCalledTimes(1));
  expect(corner.children[0].scale.x).toBe(1);
  expect(puzzle.scheduleRenderCallback).toHaveBeenCalledTimes(2);
});
