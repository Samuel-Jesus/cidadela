import { getSpace } from "./board";
import {
  deckIdFromSpaceKind,
  type CardDef,
  type DeckId,
  type DecksState,
} from "./cards";
import type { AuctionLot } from "./auction";
import {
  settleDebt,
  type DebtInfo,
} from "./bankruptcy";
import { sendToJail } from "./jail";
import { findPropertyOwner, type PlayerState } from "./pawns";
import {
  propertyRentAmount,
  transportRentAmount,
  utilityRentAmount,
} from "./rent";

export type SpaceResolveOptions = {
  transportMultiplier?: number;
  utilityDiceTotal?: number;
  utilityTimes?: number;
  skipCardDraw?: boolean;
  rng?: () => number;
  drawAndResolve?: (
    deckId: DeckId,
    players: PlayerState[],
    decks: DecksState,
  ) => {
    players: PlayerState[];
    decks: DecksState;
    notes: string[];
    followUpCards: CardDef[];
    pendingDebt?: DebtInfo | null;
    auctionQueue?: AuctionLot[];
  };
};

export type SpaceResolveResult = {
  players: PlayerState[];
  decks: DecksState;
  notes: string[];
  followUpCards: CardDef[];
  pendingDebt: DebtInfo | null;
  auctionQueue: AuctionLot[];
};

export function resolveSpaceLanding(
  players: readonly PlayerState[],
  decks: DecksState,
  playerId: string,
  spaceIndex: number,
  opts: SpaceResolveOptions = {},
): SpaceResolveResult {
  const notes: string[] = [];
  const followUpCards: CardDef[] = [];
  let nextPlayers = [...players];
  let nextDecks = decks;
  let pendingDebt: DebtInfo | null = null;
  const auctionQueue: AuctionLot[] = [];

  const space = getSpace(spaceIndex);
  if (!nextPlayers.some((p) => p.id === playerId)) {
    return {
      players: nextPlayers,
      decks: nextDecks,
      notes,
      followUpCards,
      pendingDebt,
      auctionQueue,
    };
  }

  switch (space.kind) {
    case "imposto": {
      const tax = space.taxAmount ?? 0;
      if (tax > 0) {
        const settled = settleDebt(
          nextPlayers,
          nextDecks,
          playerId,
          tax,
          { type: "bank" },
          `Imposto (${space.name})`,
        );
        nextPlayers = settled.players;
        nextDecks = settled.decks;
        notes.push(...settled.notes);
        if (settled.status === "shortfall") pendingDebt = settled.debt;
        if (settled.status === "bankrupt") {
          auctionQueue.push(...settled.auctionQueue);
        }
      }
      break;
    }

    case "va_para_o_forte": {
      nextPlayers = nextPlayers.map((p) =>
        p.id === playerId ? sendToJail(p) : p,
      );
      notes.push("Vá para o Forte — preso, sem $200 da Chegada.");
      break;
    }

    case "propriedade":
    case "transporte":
    case "companhia": {
      const owner = findPropertyOwner(nextPlayers, spaceIndex);
      if (!owner || owner.id === playerId || owner.bankrupt) {
        if (!owner && (space.kind === "propriedade" || space.kind === "transporte" || space.kind === "companhia")) {
          notes.push(`${space.name} está sem dono — você pode comprar.`);
        }
        break;
      }

      let utilityDiceTotal = opts.utilityDiceTotal;
      let utilityTimes = opts.utilityTimes;
      if (space.kind === "companhia" && utilityDiceTotal == null) {
        const rng = opts.rng ?? Math.random;
        const die1 = Math.floor(rng() * 6) + 1;
        const die2 = Math.floor(rng() * 6) + 1;
        utilityDiceTotal = die1 + die2;
        notes.push(
          `Companhia: rolou ${die1}+${die2}=${utilityDiceTotal} para o aluguel.`,
        );
      }

      let amount: number | null = null;
      if (space.kind === "transporte") {
        amount = transportRentAmount(
          owner,
          spaceIndex,
          opts.transportMultiplier ?? 1,
        );
      } else if (space.kind === "companhia") {
        if (utilityDiceTotal != null) {
          amount = utilityRentAmount(
            owner,
            spaceIndex,
            utilityDiceTotal,
            utilityTimes,
          );
        }
      } else {
        amount = propertyRentAmount(owner, spaceIndex);
      }

      if (amount != null && amount > 0) {
        const settled = settleDebt(
          nextPlayers,
          nextDecks,
          playerId,
          amount,
          { type: "player", playerId: owner.id },
          `Aluguel (${space.name})`,
        );
        nextPlayers = settled.players;
        nextDecks = settled.decks;
        notes.push(...settled.notes);
        if (settled.status === "shortfall") pendingDebt = settled.debt;
        if (settled.status === "bankrupt") {
          auctionQueue.push(...settled.auctionQueue);
        }
      }
      break;
    }

    case "fitinha":
    case "benca": {
      if (opts.skipCardDraw || !opts.drawAndResolve) break;
      const deckId = deckIdFromSpaceKind(space.kind);
      if (!deckId) break;
      notes.push(`Caiu em ${space.name} — comprou carta.`);
      const nested = opts.drawAndResolve(deckId, nextPlayers, nextDecks);
      nextPlayers = nested.players;
      nextDecks = nested.decks;
      notes.push(...nested.notes);
      followUpCards.push(...nested.followUpCards);
      if (nested.pendingDebt) pendingDebt = nested.pendingDebt;
      if (nested.auctionQueue?.length) {
        auctionQueue.push(...nested.auctionQueue);
      }
      break;
    }

    default:
      break;
  }

  return {
    players: nextPlayers,
    decks: nextDecks,
    notes,
    followUpCards,
    pendingDebt,
    auctionQueue,
  };
}
