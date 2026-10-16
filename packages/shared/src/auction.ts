import { getSpace } from "./board";
import { mortgageInterest } from "./propertyActions";
import {
  findPropertyOwner,
  type PlayerState,
  type PropertyHolding,
} from "./pawns";
import { payBank } from "./rent";

export type AuctionLot = {
  spaceIndex: number;
  mortgaged: boolean;
};

export type BidValidation =
  | { ok: true }
  | { ok: false; error: string };

export function minBidIncrement(spaceIndex: number): number {
  const price = getSpace(spaceIndex).price ?? 200;
  return price <= 100 ? 5 : 10;
}

export function minimumNextBid(
  currentBid: number,
  spaceIndex: number,
): number {
  if (currentBid <= 0) return 1;
  return currentBid + minBidIncrement(spaceIndex);
}

export function validateBid(
  player: PlayerState,
  amount: number,
  currentBid: number,
  spaceIndex: number,
  excludedIds: readonly string[] = [],
): BidValidation {
  if (player.bankrupt) {
    return { ok: false, error: "Jogador falido não participa." };
  }
  if (excludedIds.includes(player.id)) {
    return { ok: false, error: "Excluído deste leilão." };
  }
  const min = minimumNextBid(currentBid, spaceIndex);
  if (!Number.isFinite(amount) || amount < min) {
    return { ok: false, error: `Lance mínimo: $${min}.` };
  }
  if (amount > player.cash) {
    return {
      ok: false,
      error: `Só pode lançar até o dinheiro na mão ($${player.cash}).`,
    };
  }
  return { ok: true };
}

export function awardAuctionLot(
  players: readonly PlayerState[],
  winnerId: string,
  lot: AuctionLot,
  bid: number,
): { ok: true; players: PlayerState[]; notes: string[] } | { ok: false; error: string } {
  const winner = players.find((p) => p.id === winnerId);
  if (!winner || winner.bankrupt) {
    return { ok: false, error: "Vencedor inválido." };
  }
  if (findPropertyOwner(players, lot.spaceIndex)) {
    return { ok: false, error: "Propriedade já tem dono." };
  }
  if (winner.cash < bid) {
    return { ok: false, error: "Vencedor sem saldo para o lance." };
  }

  const space = getSpace(lot.spaceIndex);
  const notes: string[] = [
    `Leilão: ${space.name} vendida por $${bid}.`,
  ];

  let next = payBank(players, winnerId, bid);
  const holding: PropertyHolding = {
    spaceIndex: lot.spaceIndex,
    mortgaged: lot.mortgaged,
    pousadas: 0,
    hasResort: false,
  };

  next = next.map((p) => {
    if (p.id !== winnerId) return p;
    return {
      ...p,
      properties: [...p.properties, holding],
    };
  });

  if (lot.mortgaged) {
    const interest = mortgageInterest(lot.spaceIndex);
    const after = next.find((p) => p.id === winnerId)!;
    if (after.cash >= interest) {
      next = payBank(next, winnerId, interest);
      notes.push(
        `Escritura hipotecada: pagou $${interest} de juros ao banco.`,
      );
    } else {
      notes.push(
        `Escritura hipotecada; sem $${interest} de juros — permanece hipotecada.`,
      );
    }
  }

  return { ok: true, players: next, notes };
}
