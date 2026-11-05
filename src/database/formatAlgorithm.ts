const triggers = [
  "R U R' U'", "U R U' R'", "R' U' R U", "U' R' U R",
  "R' F R F'", "F R' F' R", "L' U' L U", "U' L' U L",
  "L U L' U'", "U L U' L'", "L F' L' F", "F' L F L'",
].map(trigger => trigger.split(' '));

export function formatAlgorithm(algorithm: string): string {
  const moves = algorithm.trim().split(/\s+/), formatted: string[] = [];
  for (let i = 0; i < moves.length;) {
    const trigger = triggers.find(trigger => trigger.every((move, offset) => move === moves[i + offset]));
    if (trigger) {
      formatted.push(`(${trigger.join(' ')})`);
      i += trigger.length;
    } else formatted.push(moves[i++]);
  }
  return formatted.join(' ');
}
