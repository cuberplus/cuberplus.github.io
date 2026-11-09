import { formatAlgorithm } from '../../src/database/formatAlgorithm';

test.each([
  ["R U R' U' R' F R F'", "(R U R' U') (R' F R F')"],
  ["F R U R' U' F'", "F (R U R' U') F'"],
  ["y' U R U' R' U2 L' U' L U", "y' (U R U' R') U2 (L' U' L U)"],
  ["R U2 R' U' R U' R'", "R U2 R' U' R U' R'"],
  ["R U R' U2", "R U R' U2"],
  ["M2 U M2 U2 M2 U M2", "M2 U M2 U2 M2 U M2"],
])('groups common triggers without changing other moves: %s', (algorithm, expected) => {
  const formatted = formatAlgorithm(algorithm);
  expect(formatted).toBe(expected);
  expect(formatted.replace(/[()]/g, '')).toBe(algorithm);
});
