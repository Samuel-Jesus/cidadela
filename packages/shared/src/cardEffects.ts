import { GO_BONUS, type PlayerState } from "./pawns";
import {
  JAIL_INDEX,
  TRANSPORT_INDICES,
  UTILITY_INDICES,
  discardCard,
  nearestAhead,
  type CardDef,
  type DecksState,
} from "./cards";

export type CardResolveResult = {
  players: PlayerState[];
  decks: DecksState;
};

function stepsForward(from: number, to: number, boardSize = 40): number {
  return (to - from + boardSize) % boardSize;
}

function crossesGo(from: number, steps: number, boardSize = 40): boolean {
  if (steps <= 0) return false;
  return from + steps >= boardSize;
}

function updatePlayer(
  players: readonly PlayerState[],
  playerId: string,
  patch: Partial<PlayerState> | ((p: PlayerState) => PlayerState),
): PlayerState[] {
  return players.map((p) => {
    if (p.id !== playerId) return p;
    return typeof patch === "function" ? patch(p) : { ...p, ...patch };
  });
}

export function resolveCardEffect(
  players: readonly PlayerState[],
  decks: DecksState,
  playerId: string,
  card: CardDef,
): CardResolveResult {
  let nextPlayers = [...players];
  let nextDecks = decks;

  if (card.keepable) {
    nextPlayers = updatePlayer(nextPlayers, playerId, (p) => ({
      ...p,
      protectionCardIds: [...p.protectionCardIds, card.id],
    }));
  } else {
    nextDecks = discardCard(nextDecks, card.id);
  }

  const player = nextPlayers.find((p) => p.id === playerId);
  if (!player) return { players: nextPlayers, decks: nextDecks };

  const effect = card.effect;

  switch (effect.type) {
    case "keep":
      break;

    case "collect_bank":
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        cash: player.cash + effect.amount,
      });
      break;

    case "pay_bank":
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        cash: Math.max(0, player.cash - effect.amount),
      });
      break;

    case "pay_per_building": {
      let total = 0;
      for (const h of player.properties) {
        if (h.hasResort) total += effect.perResort;
        else total += h.pousadas * effect.perPousada;
      }
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        cash: Math.max(0, player.cash - total),
      });
      break;
    }

    case "collect_from_each": {
      let gained = 0;
      nextPlayers = nextPlayers.map((p) => {
        if (p.id === playerId) return p;
        const pay = Math.min(p.cash, effect.amount);
        gained += pay;
        return { ...p, cash: p.cash - pay };
      });
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        cash: player.cash + gained,
      });
      break;
    }

    case "pay_each": {
      const others = nextPlayers.filter((p) => p.id !== playerId);
      const need = effect.amount * others.length;
      const payEach = Math.min(
        effect.amount,
        others.length === 0
          ? 0
          : Math.floor(Math.min(player.cash, need) / others.length),
      );
      nextPlayers = nextPlayers.map((p) => {
        if (p.id === playerId) {
          return { ...p, cash: p.cash - payEach * others.length };
        }
        return { ...p, cash: p.cash + payEach };
      });
      break;
    }

    case "go_to_jail":
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        position: JAIL_INDEX,
        inJail: true,
      });
      break;

    case "advance_to": {
      const from = player.position;
      const to = effect.spaceIndex;
      const steps = stepsForward(from, to);
      let cash = player.cash;
      if (effect.collectGo) {
        if (to === 0 || (steps > 0 && crossesGo(from, steps))) {
          cash += GO_BONUS;
        }
      }
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        position: to,
        cash,
      });
      break;
    }

    case "move_back": {
      const boardSize = 40;
      const position =
        (((player.position - effect.steps) % boardSize) + boardSize) %
        boardSize;
      nextPlayers = updatePlayer(nextPlayers, playerId, { position });
      break;
    }

    case "nearest_transport": {
      const to = nearestAhead(player.position, TRANSPORT_INDICES);
      const from = player.position;
      const steps = stepsForward(from, to);
      let cash = player.cash;
      if (steps > 0 && crossesGo(from, steps)) cash += GO_BONUS;
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        position: to,
        cash,
      });
      break;
    }

    case "nearest_utility": {
      const to = nearestAhead(player.position, UTILITY_INDICES);
      const from = player.position;
      const steps = stepsForward(from, to);
      let cash = player.cash;
      if (steps > 0 && crossesGo(from, steps)) cash += GO_BONUS;
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        position: to,
        cash,
      });
      break;
    }

    default:
      break;
  }

  return { players: nextPlayers, decks: nextDecks };
}
