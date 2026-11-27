// Pattern sequences create the pictured target from solved (white up, green front).
// Standard patterns: https://ruwix.com/the-rubiks-cube/rubiks-cube-patterns-algorithms/
export const patternDefinitions = [
  { id: '1', name: 'Rotated centers (six spots)', algorithm: "M E' M' E y z" },
  { id: '2', name: 'Rotated centers (four spots)', algorithm: "E' M2 E M2 y2" },
  { id: '3', name: 'Checkerboard', algorithm: 'M2 E2 S2' },
  { id: '4', name: 'Checkerboard on two faces', algorithm: 'U2 F2 U2 F2 B2 U2 F2 D2' },
  { id: '5', name: 'Steven Brundage three sides solved', algorithm: "B2 U R2 B2 D2 B2 R2 U2 F2 U' L D2 F2 U2 R D2" },
  { id: '6', name: 'Cube in a cube in a cube', algorithm: "U' L' U' F' R2 B' R F U B2 U B' L U' F U R F'" },
  { id: '7', name: 'Zigzag on four colors', algorithm: "z (U D x')6 z' y2" },
  { id: '8', name: 'Yin yang', algorithm: "R L B F R L U' D' F' B' U D" },
  { id: '9', name: 'Superflip', algorithm: "((M U)4 x' y')3" },
  { id: '10', name: 'Anaconda', algorithm: "L U B' U' R L' B R' F B' D R D' F'" },
  { id: '11', name: 'Cube in a cube', algorithm: "F L F U' R U F2 L2 U' L' B D' B' L2 U" },
];
