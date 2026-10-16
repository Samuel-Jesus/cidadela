import { describe, expect, it } from "vitest";
import { createPlayers } from "./pawns";
import { alivePlayers, findWinner, isGameOver } from "./gameEnd";

describe("FR-83 fim de jogo", () => {
  it("não encerra com 2+ vivos", () => {
    const players = createPlayers(3);
    expect(findWinner(players)).toBeNull();
    expect(isGameOver(players)).toBe(false);
    expect(alivePlayers(players)).toHaveLength(3);
  });

  it("vence o último não falido", () => {
    const players = createPlayers(3).map((p, i) =>
      i === 0 ? p : { ...p, bankrupt: true },
    );
    const winner = findWinner(players);
    expect(winner?.id).toBe(players[0]!.id);
    expect(isGameOver(players)).toBe(true);
  });
});
