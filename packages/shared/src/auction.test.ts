import { describe, expect, it } from "vitest";
import {
  awardAuctionLot,
  propertyAuctionLot,
  resolveTieByDice,
  shouldAuctionBuildingPiece,
  validateBid,
} from "./auction";
import { createPlayers } from "./pawns";
import type { BankStock } from "./bankStock";

describe("leilão", () => {
  it("FR-86/87 valida lance mínimo e limite de caixa", () => {
    const [p] = createPlayers(2);
    expect(
      validateBid(p!, 1, 0, propertyAuctionLot(1), [], null).ok,
    ).toBe(true);
    expect(
      validateBid(p!, 0, 0, propertyAuctionLot(1), [], null).ok,
    ).toBe(false);
    expect(
      validateBid(p!, p!.cash + 1, 0, propertyAuctionLot(1), [], null).ok,
    ).toBe(false);
  });

  it("FR-89 empate por lance igual", () => {
    const players = createPlayers(2);
    const check = validateBid(
      players[1]!,
      50,
      50,
      propertyAuctionLot(1),
      [],
      players[0]!.id,
    );
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.tie).toBe(true);
  });

  it("FR-89 decide empate nos dados", () => {
    let n = 0;
    const rng = () => {
      // Sequência: A=6+6=12, B=1+1=2
      const seq = [0.99, 0.99, 0.0, 0.0];
      return seq[n++ % seq.length]!;
    };
    const result = resolveTieByDice("a", "b", rng);
    expect(result.winnerId).toBe("a");
    expect(result.rollA).toBeGreaterThan(result.rollB);
  });

  it("FR-88 vende escritura ao vencedor", () => {
    const players = createPlayers(2);
    const awarded = awardAuctionLot(
      players,
      players[0]!.id,
      propertyAuctionLot(1, false),
      40,
    );
    expect(awarded.ok).toBe(true);
    if (!awarded.ok) return;
    expect(awarded.players[0]!.cash).toBe(players[0]!.cash - 40);
    expect(
      awarded.players[0]!.properties.some((h) => h.spaceIndex === 1),
    ).toBe(true);
  });

  it("FR-53 escassez dispara leilão de peça", () => {
    const scarce: BankStock = { pousadas: 3, resorts: 1 };
    const full: BankStock = { pousadas: 20, resorts: 8 };
    expect(shouldAuctionBuildingPiece(scarce, "pousada", 3)).toBe(true);
    expect(shouldAuctionBuildingPiece(full, "pousada", 3)).toBe(false);
    expect(shouldAuctionBuildingPiece(scarce, "pousada", 1)).toBe(false);
  });
});
