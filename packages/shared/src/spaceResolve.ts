import { getSpace } from "./board";
import {
  JAIL_INDEX,
  deckIdFromSpaceKind,
  type CardDef,
  type DeckId,
  type DecksState,
} from "./cards";
import { findPropertyOwner, type PlayerState } from "./pawns";
import { chargeRentIfOwned, payBank } from "./rent";

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
  };
};

export type SpaceResolveResult = {
  players: PlayerState[];
  decks: DecksState;
  notes: string[];
  followUpCards: CardDef[];
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

  const space = getSpace(spaceIndex);
  if (!nextPlayers.some((p) => p.id === playerId)) {
    return { players: nextPlayers, decks: nextDecks, notes, followUpCards };
  }

  switch (space.kind) {
    case "imposto": {
      const tax = space.taxAmount ?? 0;
      if (tax > 0) {
        nextPlayers = payBank(nextPlayers, playerId, tax);
        notes.push(`Imposto: pagou $${tax} ao banco.`);
      }
      break;
    }

    case "va_para_o_forte": {
      nextPlayers = nextPlayers.map((p) =>
        p.id === playerId
          ? { ...p, position: JAIL_INDEX, inJail: true }
          : p,
      );
      notes.push("Vá para o Forte — preso, sem $200 da Chegada.");
      break;
    }

    case "propriedade":
    case "transporte":
    case "companhia": {
      let utilityDiceTotal = opts.utilityDiceTotal;
      let utilityTimes = opts.utilityTimes;
      if (space.kind === "companhia" && utilityDiceTotal == null) {
        const owner = findPropertyOwner(nextPlayers, spaceIndex);
        if (owner && owner.id !== playerId) {
          const rng = opts.rng ?? Math.random;
          const die1 = Math.floor(rng() * 6) + 1;
          const die2 = Math.floor(rng() * 6) + 1;
          utilityDiceTotal = die1 + die2;
          notes.push(
            `Companhia: rolou ${die1}+${die2}=${utilityDiceTotal} para o aluguel.`,
          );
        }
      }

      const rent = chargeRentIfOwned(nextPlayers, playerId, spaceIndex, {
        transportMultiplier: opts.transportMultiplier,
        utilityDiceTotal,
        utilityTimes,
      });
      nextPlayers = rent.players;
      if (rent.amount > 0) {
        if (space.kind === "transporte" && (opts.transportMultiplier ?? 1) > 1) {
          notes.push(`Aluguel dobrado do transporte: pagou $${rent.amount}.`);
        } else if (space.kind === "companhia" && utilityDiceTotal != null) {
          notes.push(
            `Aluguel da companhia: pagou $${rent.amount}.`,
          );
        } else {
          notes.push(`Aluguel: pagou $${rent.amount}.`);
        }
      } else if (!rent.ownerId) {
        notes.push(`${space.name} está sem dono — você pode comprar.`);
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
      break;
    }

    default:
      break;
  }

  return { players: nextPlayers, decks: nextDecks, notes, followUpCards };
}
