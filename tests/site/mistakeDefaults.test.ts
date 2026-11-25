import { readDisabledMistakes } from '../../shared/mistakes';

afterEach(() => localStorage.clear());
test.each([
  [null, ['f2lChoice']],
  ['[]', []],
  ['["ollMoves"]', ['ollMoves']],
  ['["f2lChoice","invalid"]', ['f2lChoice']],
  ['invalid json', ['f2lChoice']],
  ['{}', ['f2lChoice']],
])('non-suggested pair is off by default without overwriting explicit saved preferences: %s', (saved, expected) => {
  localStorage.clear();
  if (typeof saved === 'string') localStorage.setItem('disabled-mistakes', saved);
  expect(readDisabledMistakes()).toEqual(expected);
});
