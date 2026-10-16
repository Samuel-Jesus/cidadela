import { describe, expect, it } from "vitest";
import {
  BANK_POUSADAS_MAX,
  BANK_RESORTS_MAX,
  bankStockFromPlayers,
} from "./bankStock";
import { createPlayers } from "./pawns";

describe("FR-53 estoque 32/12", () => {
  it("começa cheio", () => {
    const stock = bankStockFromPlayers(createPlayers(4));
    expect(stock.pousadas).toBe(BANK_POUSADAS_MAX);
    expect(stock.resorts).toBe(BANK_RESORTS_MAX);
  });

  it("deduz peças do tabuleiro", () => {
    const players = createPlayers(2);
    players[0] = {
      ...players[0]!,
      properties: [
        {
          spaceIndex: 1,
          mortgaged: false,
          pousadas: 3,
          hasResort: false,
        },
        {
          spaceIndex: 3,
          mortgaged: false,
          pousadas: 0,
          hasResort: true,
        },
      ],
    };
    const stock = bankStockFromPlayers(players);
    expect(stock.pousadas).toBe(BANK_POUSADAS_MAX - 3);
    expect(stock.resorts).toBe(BANK_RESORTS_MAX - 1);
  });
});
