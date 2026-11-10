import { cleanup, render, screen } from '@testing-library/react';
import CaseImage, { CategoryImage } from '../../src/database/CaseDiagram';
import { applyMoves, FACES, HEX, inverseMoves, parseAlgorithm, ROTATIONS, solvedCube, stickers } from '../../scrambler/src/cube/cube';

afterEach(cleanup);

function renderF2L(algorithm: string, category: 'F2L' | 'AF2L' = 'F2L') {
  const facelets = Array<string>(54);
  const visibleStickers: number[] = [];
  stickers(applyMoves(solvedCube(), inverseMoves(parseAlgorithm(algorithm)))).forEach(({ face, row, col, color }, i) => {
    const index = face * 9 + row * 3 + col;
    facelets[index] = FACES[color];
    if (i >= 48 || i < 24 && Math.floor(i / 2) >= 4 && Math.floor(i / 2) <= 8 ||
      i >= 24 && i < 48 && Math.floor((i - 24) / 3) === 4) visibleStickers.push(index);
  });
  render(<CaseImage category={category} id="1" algorithm={algorithm} facelets={facelets.join('')} visibleStickers={visibleStickers} />);
  const image = screen.getByRole('img', { name: `${category} 1 case` });
  const tile = (index: number) => image.querySelector(`[data-facelet="${index}"]`)!;
  const vertices = (index: number) => tile(index).getAttribute('points')!.split(' ');
  return { image, tile, vertices, facelets, visibleStickers };
}

test('F2L stickers meet at the correct physical edges and front-right corner', () => {
  const { vertices } = renderF2L("U R U' R'");
  const shared = (a: number, b: number) => vertices(a).filter(point => vertices(b).includes(point));
  for (let i = 0; i < 3; i++) {
    expect(shared(6 + i, 18 + i)).toHaveLength(2); // UF: top front row and front top row.
    expect(shared(2 + i * 3, 11 - i)).toHaveLength(2); // UR: top right column and reversed right top row.
    expect(shared(20 + i * 3, 9 + i * 3)).toHaveLength(2); // FR: front right column and right left column.
  }
  expect(vertices(8).filter(point => vertices(20).includes(point) && vertices(9).includes(point))).toEqual(['55,55']);
});

test('advanced F2L uses the projected cube and masks unused stickers rather than showing a full-color top view', () => {
  const { image, tile } = renderF2L("U R U' R'", 'AF2L');
  expect(image.querySelectorAll('polygon')).toHaveLength(27);
  expect(tile(0).getAttribute('fill')).toBe('#697384');
  expect(tile(4).getAttribute('fill')).toBe(HEX[3]);
});

test.each(["U R U' R'", "F R' F' R", "R U R'", "R U' R' U R U' R'"])('F2L diagram colors only centers, cross and target pair for %s', algorithm => {
  const { image, tile, facelets, visibleStickers } = renderF2L(algorithm);
  const whiteCrossRotation = ROTATIONS.find(rotation => rotation.faces[0] === 3 && rotation.faces[2] === 2)!;
  expect(image.querySelectorAll('polygon')).toHaveLength(27);
  for (let index = 0; index < 27; index++) {
    expect(tile(index).getAttribute('fill')).toBe(visibleStickers.includes(index) ?
      HEX[whiteCrossRotation.faces[FACES.indexOf(facelets[index] as typeof FACES[number])]] : '#697384');
  }
});

test('OLL uses yellow for top-face stickers on both the top face and side ring', () => {
  const facelets = Array<string>(54);
  for (const { face, row, col, color } of stickers(applyMoves(solvedCube(), inverseMoves(parseAlgorithm("R U R' U R U2 R'"))))) {
    facelets[face * 9 + row * 3 + col] = FACES[color];
  }
  render(<CaseImage category="OLL" id="27" algorithm="R U R' U R U2 R'" facelets={facelets.join('')} visibleStickers={[]} />);
  const image = screen.getByRole('img', { name: 'OLL 27 case' });
  expect(image.querySelectorAll(`rect[fill="${HEX[3]}"]`)).toHaveLength(9);
  expect(image.querySelectorAll('rect[fill="#697384"]')).toHaveLength(12);
  expect(image.querySelectorAll(`g rect[fill="${HEX[3]}"]`).length).toBeGreaterThan(0);
  expect(image.querySelectorAll(`rect[fill="${HEX[0]}"]`)).toHaveLength(0);
  expect(image.querySelector('title')!.textContent).toContain('top-face stickers highlighted, other stickers gray');
});

test('PLL uses a yellow top and physically consistent side colors above a white cross', () => {
  render(<CaseImage category="PLL" id="T" algorithm="" facelets={FACES.map(face => face.repeat(9)).join('')} visibleStickers={[]} />);
  const image = screen.getByRole('img', { name: 'PLL T case' });
  expect(image.querySelectorAll(`rect[fill="${HEX[3]}"]`)).toHaveLength(9);
  expect(image.querySelectorAll(`rect[fill="${HEX[0]}"]`)).toHaveLength(0);
  for (const [side, color] of [HEX[5], HEX[4], HEX[2], HEX[1]].entries()) {
    expect(image.querySelectorAll(`g:nth-of-type(${side + 1}) rect[fill="${color}"]`)).toHaveLength(3);
  }
  expect(image.querySelectorAll('rect[fill="#697384"]')).toHaveLength(0);
});

test('category previews highlight the F2L layers and the oriented OLL top', () => {
  const view = render(<CategoryImage category="F2L" />);
  const tile = (index: number) => view.container.querySelector(`[data-facelet="${index}"]`)!;
  for (let i = 0; i < 9; i++) expect(tile(i).getAttribute('fill')).toBe('#697384');
  for (const [face, color] of [[9, HEX[4]], [18, HEX[2]]] as const) {
    for (let i = 0; i < 9; i++) expect(tile(face + i).getAttribute('fill')).toBe(i < 3 ? '#697384' : color);
  }
  view.rerender(<CategoryImage category="OLL" />);
  expect(view.container.querySelectorAll(`rect[fill="${HEX[3]}"]`)).toHaveLength(9);
  expect(view.container.querySelectorAll('rect[fill="#697384"]')).toHaveLength(12);
  view.rerender(<CategoryImage category="PLL" />);
  expect(view.container.querySelectorAll(`rect[fill="${HEX[3]}"]`)).toHaveLength(9);
  expect(view.container.querySelectorAll(`rect[fill="${HEX[0]}"]`)).toHaveLength(0);
});
