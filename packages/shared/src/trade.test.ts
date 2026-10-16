import { describe, expect, it } from "vitest";
import { createPlayers } from "./pawns";
import { applyTrade, validateTrade } from "./trade";

describe("FR-80/81 negociação", () => {
  it("troca dinheiro e escritura sem construção", () => {
    const players = createPlayers(2);
    players[0] = {
      ...players[0]!,
      properties: [
        {
          spaceIndex: 1,
          mortgaged: false,
          pousadas: 0,
          hasResort: false,
        },
      ],
    };

    const offer = {
      fromId: players[0]!.id,
      toId: players[1]!.id,
      give: { cash: 50, spaceIndexes: [1], protectionCardIds: [] },
      receive: { cash: 100, spaceIndexes: [], protectionCardIds: [] },
    };

    expect(validateTrade(players, offer).ok).toBe(true);
    const result = applyTrade(players, offer);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.players[1]!.properties.some((h) => h.spaceIndex === 1),
    ).toBe(true);
    expect(result.players[0]!.properties).toHaveLength(0);
  });

  it("rejeita terreno com construção", () => {
    const players = createPlayers(2);
    players[0] = {
      ...players[0]!,
      properties: [
        {
          spaceIndex: 1,
          mortgaged: false,
          pousadas: 2,
          hasResort: false,
        },
      ],
    };

    const check = validateTrade(players, {
      fromId: players[0]!.id,
      toId: players[1]!.id,
      give: { cash: 0, spaceIndexes: [1], protectionCardIds: [] },
      receive: { cash: 10, spaceIndexes: [], protectionCardIds: [] },
    });
    expect(check.ok).toBe(false);
  });
});
