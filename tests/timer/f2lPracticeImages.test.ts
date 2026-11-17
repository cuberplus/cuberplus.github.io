import { readFileSync } from 'node:fs';
import { loadCube } from '../../timer/src/Core/puzzle';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import { f2lPracticeImages } from '../../src/database/f2lPracticeImages';
import { makeSolve, makeStep } from '../analyzer/testUtils';
import { StepName } from '../../smartcubeanalyzer/src/Models/Types';

const cube = await loadCube();
test('imported Cubeast numbering is resolved from the pair state instead of assumed to match the database', () => {
  const solves = parseCsv(readFileSync('smartcubeanalyzer/public/demo/cfop-small.csv', 'utf8'), ',');
  for (const [label, expected] of [['17', 'F2L-8'], ['20', 'F2L-14'], ['BR->FR 12', 'F2L-3'], ['BL->FR 93', 'AF2L-10']]) {
    const solve = solves.find(solve => solve.steps.some(step => step.name.startsWith('F2L') && step.case === label))!;
    expect(f2lPracticeImages(cube, solve, label).map(image => image.key)).toContain(expected);
  }
  for (const solve of solves) for (const step of solve.steps.filter(step => step.name.startsWith('F2L') && step.case && step.case !== 'Solved')) {
    const images = f2lPracticeImages(cube, solve, step.case);
    expect(images.length).toBeGreaterThan(0);
    expect(images.every(image => image.facelets.length === 54 && image.visibleStickers.length > 6)).toBe(true);
  }
});
test('each combined pair gets an image and a diagram does not expose unrelated unsolved pieces', () => {
  const solve = makeSolve({ steps: [
    makeStep(StepName.F2L_1, 2, { case: 'combined', moves: "R U R' L' U L" }),
  ] });
  const images = f2lPracticeImages(cube, solve, 'combined');
  expect(images).toHaveLength(2);
  for (const image of images) {
    expect(image.key).toMatch(/^(?:A|O)?F2L-/);
    expect(image.visibleStickers).toHaveLength(19);
  }
  expect(f2lPracticeImages(cube, solve, 'missing')).toEqual([]);
});
