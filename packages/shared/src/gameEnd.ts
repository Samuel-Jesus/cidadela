import type { PlayerState } from "./pawns";

export function alivePlayers(
  players: readonly PlayerState[],
): PlayerState[] {
  return players.filter((p) => !p.bankrupt);
}

export function findWinner(
  players: readonly PlayerState[],
): PlayerState | null {
  const alive = alivePlayers(players);
  return alive.length === 1 ? alive[0]! : null;
}

export function isGameOver(players: readonly PlayerState[]): boolean {
  return findWinner(players) !== null;
}
