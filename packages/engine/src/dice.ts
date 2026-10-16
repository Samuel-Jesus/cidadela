export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

export type DiceRoll = {
  die1: DieFace;
  die2: DieFace;
  total: number;
  isDouble: boolean;
};

export function rollDie(rng: () => number = Math.random): DieFace {
  return (Math.floor(rng() * 6) + 1) as DieFace;
}

export function rollDice(rng: () => number = Math.random): DiceRoll {
  const die1 = rollDie(rng);
  const die2 = rollDie(rng);
  return {
    die1,
    die2,
    total: die1 + die2,
    isDouble: die1 === die2,
  };
}

export function nextPosition(from: number, steps: number, boardSize = 40): number {
  return ((from + steps) % boardSize + boardSize) % boardSize;
}

export function crossesGo(from: number, steps: number, boardSize = 40): boolean {
  if (steps <= 0) return false;
  return from + steps >= boardSize;
}
