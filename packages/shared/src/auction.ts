import { getSpace } from "./board";
import type { BankStock } from "./bankStock";
import { bankStockFromPlayers } from "./bankStock";
import {
  buildCostForSpace,
  canBuildPousada,
  canBuildResort,
  mortgageInterest,
} from "./propertyActions";
import {
  findPropertyOwner,
  type PlayerState,
  type PropertyHolding,
} from "./pawns";
import { payBank } from "./rent";

/** Escritura sem dono (recusa / falência). */
export type PropertyAuctionLot = {
  kind: "property";
  spaceIndex: number;
  mortgaged: boolean;
};

/** Peça do banco sob escassez (FR-53 / FR-85). */
export type PieceAuctionLot = {
  kind: "pousada" | "resort";
  /** Terreno onde o vencedor pretende colocar a peça. */
  spaceIndex: number;
};

export type AuctionLot = PropertyAuctionLot | PieceAuctionLot;

export type BidValidation =
  | { ok: true; tie?: boolean }
  | { ok: false; error: string };

/** Estoque baixo → leilão da peça (FR-53). */
export const SCARCE_POUSADAS = 4;
export const SCARCE_RESORTS = 2;

export function propertyAuctionLot(
  spaceIndex: number,
  mortgaged = false,
): PropertyAuctionLot {
  return { kind: "property", spaceIndex, mortgaged };
}

export function shouldAuctionBuildingPiece(
  stock: BankStock,
  kind: "pousada" | "resort",
  aliveCount: number,
): boolean {
  if (aliveCount < 2) return false;
  if (kind === "pousada") {
    return stock.pousadas >= 1 && stock.pousadas <= SCARCE_POUSADAS;
  }
  return stock.resorts >= 1 && stock.resorts <= SCARCE_RESORTS;
}

export function minBidIncrement(spaceIndex: number): number {
  const price = getSpace(spaceIndex).price ?? 200;
  return price <= 100 ? 5 : 10;
}

export function minBidIncrementForLot(lot: AuctionLot): number {
  if (lot.kind === "pousada" || lot.kind === "resort") {
    const cost = buildCostForSpace(lot.spaceIndex) ?? 100;
    return cost <= 100 ? 5 : 10;
  }
  return minBidIncrement(lot.spaceIndex);
}

/** Próximo lance mínimo ($1 se ainda não há lance). */
export function minimumNextBid(
  currentBid: number,
  spaceIndex: number,
): number {
  if (currentBid <= 0) return 1;
  return currentBid + minBidIncrement(spaceIndex);
}

export function minimumNextBidForLot(
  currentBid: number,
  lot: AuctionLot,
): number {
  if (currentBid <= 0) return 1;
  return currentBid + minBidIncrementForLot(lot);
}

/**
 * FR-89: lance igual ao atual (de outro jogador) declara empate.
 * Lance maior é o normal.
 */
export function validateBid(
  player: PlayerState,
  amount: number,
  currentBid: number,
  lotOrSpace: AuctionLot | number,
  excludedIds: readonly string[] = [],
  highBidderId: string | null = null,
): BidValidation {
  if (player.bankrupt) {
    return { ok: false, error: "Jogador falido não participa." };
  }
  if (excludedIds.includes(player.id)) {
    return { ok: false, error: "Excluído deste leilão." };
  }

  const lot: AuctionLot =
    typeof lotOrSpace === "number"
      ? propertyAuctionLot(lotOrSpace)
      : lotOrSpace;

  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, error: "Lance mínimo: $1." };
  }
  if (amount > player.cash) {
    return {
      ok: false,
      error: `Só pode lançar até o dinheiro na mão ($${player.cash}).`,
    };
  }

  if (currentBid <= 0) {
    return { ok: true };
  }

  // Empate: mesmo valor, outro jogador
  if (
    amount === currentBid &&
    highBidderId != null &&
    player.id !== highBidderId
  ) {
    return { ok: true, tie: true };
  }

  const min = minimumNextBidForLot(currentBid, lot);
  if (amount < min) {
    return { ok: false, error: `Lance mínimo: $${min}.` };
  }
  return { ok: true };
}

export function awardPropertyAuction(
  players: readonly PlayerState[],
  winnerId: string,
  lot: PropertyAuctionLot,
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

/** Coloca a peça no terreno do vencedor; o lance substitui o custo de tabela. */
export function awardPieceAuction(
  players: readonly PlayerState[],
  winnerId: string,
  lot: PieceAuctionLot,
  bid: number,
): { ok: true; players: PlayerState[]; notes: string[] } | { ok: false; error: string } {
  const winner = players.find((p) => p.id === winnerId);
  if (!winner || winner.bankrupt) {
    return { ok: false, error: "Vencedor inválido." };
  }
  if (winner.cash < bid) {
    return { ok: false, error: "Vencedor sem saldo para o lance." };
  }

  const stock = bankStockFromPlayers(players);
  if (lot.kind === "pousada" && stock.pousadas < 1) {
    return { ok: false, error: "Banco sem pousadas." };
  }
  if (lot.kind === "resort" && stock.resorts < 1) {
    return { ok: false, error: "Banco sem resorts." };
  }

  const placeCheck =
    lot.kind === "pousada"
      ? canBuildPousada(winner, lot.spaceIndex, {
          ignoreCash: true,
          ignoreStock: true,
        })
      : canBuildResort(winner, lot.spaceIndex, {
          ignoreCash: true,
          ignoreStock: true,
        });
  if (!placeCheck.ok) {
    return { ok: false, error: placeCheck.error };
  }

  const space = getSpace(lot.spaceIndex);
  const label = lot.kind === "pousada" ? "Pousada" : "Resort";
  const notes: string[] = [
    `Leilão de peça: ${label} em ${space.name} por $${bid}.`,
  ];

  let next = payBank(players, winnerId, bid);
  next = next.map((p) => {
    if (p.id !== winnerId) return p;
    return {
      ...p,
      properties: p.properties.map((h) => {
        if (h.spaceIndex !== lot.spaceIndex) return h;
        if (lot.kind === "pousada") {
          return { ...h, pousadas: h.pousadas + 1 };
        }
        return { ...h, hasResort: true, pousadas: 0 };
      }),
    };
  });

  return { ok: true, players: next, notes };
}

export function awardAuctionLot(
  players: readonly PlayerState[],
  winnerId: string,
  lot: AuctionLot,
  bid: number,
): { ok: true; players: PlayerState[]; notes: string[] } | { ok: false; error: string } {
  if (lot.kind === "pousada" || lot.kind === "resort") {
    return awardPieceAuction(players, winnerId, lot, bid);
  }
  return awardPropertyAuction(
    players,
    winnerId,
    lot as PropertyAuctionLot,
    bid,
  );
}

/** FR-89: maior total nos dados vence; empate nos dados → tenta de novo. */
export function resolveTieByDice(
  playerAId: string,
  playerBId: string,
  rng: () => number = Math.random,
): { winnerId: string; rollA: number; rollB: number; notes: string[] } {
  let rollA = 0;
  let rollB = 0;
  let guard = 0;
  do {
    rollA =
      Math.floor(rng() * 6) +
      1 +
      (Math.floor(rng() * 6) + 1);
    rollB =
      Math.floor(rng() * 6) +
      1 +
      (Math.floor(rng() * 6) + 1);
    guard += 1;
  } while (rollA === rollB && guard < 20);

  const winnerId = rollA >= rollB ? playerAId : playerBId;
  return {
    winnerId,
    rollA,
    rollB,
    notes: [
      `Empate no leilão: dados ${rollA} vs ${rollB} — vence o maior total.`,
    ],
  };
}

export function auctionLotLabel(lot: AuctionLot): string {
  const space = getSpace(lot.spaceIndex);
  if (lot.kind === "pousada") return `Pousada · ${space.name}`;
  if (lot.kind === "resort") return `Resort · ${space.name}`;
  return space.name;
}
