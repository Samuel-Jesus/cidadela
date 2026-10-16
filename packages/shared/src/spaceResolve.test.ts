import { describe, expect, it } from "vitest";
import { createDecks } from "./cards";
import { createPlayers } from "./pawns";
import { resolveSpaceLanding } from "./spaceResolve";

describe("FR-22a aluguel pedido", () => {
  it("claim mode cria pendingRent sem debitar", () => {
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
    players[1] = { ...players[1]!, position: 1 };

    const result = resolveSpaceLanding(
      players,
      createDecks(),
      players[1]!.id,
      1,
      { rentMode: "claim" },
    );

    expect(result.pendingRent).not.toBeNull();
    expect(result.pendingRent?.amount).toBeGreaterThan(0);
    expect(result.players[1]!.cash).toBe(players[1]!.cash);
    expect(result.players[0]!.cash).toBe(players[0]!.cash);
  });

  it("auto mode cobra na hora", () => {
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
    const cashBefore = players[1]!.cash;

    const result = resolveSpaceLanding(
      players,
      createDecks(),
      players[1]!.id,
      1,
      { rentMode: "auto" },
    );

    expect(result.pendingRent).toBeNull();
    expect(result.players[1]!.cash).toBeLessThan(cashBefore);
  });
});
