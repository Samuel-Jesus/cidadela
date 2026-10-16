import { GO_BONUS, type PlayerState } from "./pawns";
import {
  JAIL_INDEX,
  TRANSPORT_INDICES,
  UTILITY_INDICES,
  discardCard,
  drawCard,
  nearestAhead,
  type CardDef,
  type DeckId,
  type DecksState,
} from "./cards";
import { resolveSpaceLanding } from "./spaceResolve";

export type CardResolveOptions = {
  rng?: () => number;
  skipLanding?: boolean;
  cardDepth?: number;
};

export type CardResolveResult = {
  players: PlayerState[];
  decks: DecksState;
  notes: string[];
  followUpCards: CardDef[];
  utilityDice?: { die1: number; die2: number; total: number };
};

const MAX_CARD_DEPTH = 3;

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

function rollTwoDice(rng: () => number): {
  die1: number;
  die2: number;
  total: number;
} {
  const die1 = Math.floor(rng() * 6) + 1;
  const die2 = Math.floor(rng() * 6) + 1;
  return { die1, die2, total: die1 + die2 };
}

function landAfterMove(
  players: PlayerState[],
  decks: DecksState,
  playerId: string,
  spaceIndex: number,
  depth: number,
  rng: () => number,
  landingOpts: {
    transportMultiplier?: number;
    utilityDiceTotal?: number;
    utilityTimes?: number;
    skipCardDraw?: boolean;
  } = {},
): CardResolveResult {
  const result = resolveSpaceLanding(players, decks, playerId, spaceIndex, {
    ...landingOpts,
    rng,
    drawAndResolve: (deckId, p, d) =>
      drawCardAndResolve(p, d, playerId, deckId, depth + 1, rng),
  });
  return {
    players: result.players,
    decks: result.decks,
    notes: result.notes,
    followUpCards: result.followUpCards,
  };
}

function drawCardAndResolve(
  players: PlayerState[],
  decks: DecksState,
  playerId: string,
  deckId: DeckId,
  depth: number,
  rng: () => number,
): CardResolveResult {
  if (depth > MAX_CARD_DEPTH) {
    return { players, decks, notes: [], followUpCards: [] };
  }
  const drawn = drawCard(decks, deckId, rng);
  const resolved = resolveCardEffect(
    players,
    drawn.decks,
    playerId,
    drawn.card,
    { rng, cardDepth: depth },
  );
  return {
    players: resolved.players,
    decks: resolved.decks,
    notes: resolved.notes,
    followUpCards: [drawn.card, ...resolved.followUpCards],
    utilityDice: resolved.utilityDice,
  };
}

export function resolveCardEffect(
  players: readonly PlayerState[],
  decks: DecksState,
  playerId: string,
  card: CardDef,
  opts: CardResolveOptions = {},
): CardResolveResult {
  const rng = opts.rng ?? Math.random;
  const depth = opts.cardDepth ?? 0;
  const notes: string[] = [];
  let nextPlayers = [...players];
  let nextDecks = decks;
  let utilityDice: CardResolveResult["utilityDice"];
  let movedTo: number | null = null;
  let landingOpts: {
    transportMultiplier?: number;
    utilityDiceTotal?: number;
    utilityTimes?: number;
    skipCardDraw?: boolean;
  } = {};

  if (card.keepable) {
    nextPlayers = updatePlayer(nextPlayers, playerId, (p) => ({
      ...p,
      protectionCardIds: [...p.protectionCardIds, card.id],
    }));
  } else {
    nextDecks = discardCard(nextDecks, card.id);
  }

  const player = nextPlayers.find((p) => p.id === playerId);
  if (!player) {
    return { players: nextPlayers, decks: nextDecks, notes, followUpCards: [] };
  }

  const effect = card.effect;

  switch (effect.type) {
    case "keep":
      notes.push("Carta Proteção guardada na carteira.");
      break;

    case "collect_bank":
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        cash: player.cash + effect.amount,
      });
      notes.push(`Recebeu $${effect.amount} do banco.`);
      break;

    case "pay_bank":
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        cash: Math.max(0, player.cash - effect.amount),
      });
      notes.push(`Pagou $${effect.amount} ao banco.`);
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
      notes.push(
        total > 0
          ? `Pagou $${total} por construções.`
          : "Sem construções — não pagou nada.",
      );
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
      notes.push(`Recebeu $${gained} dos outros jogadores.`);
      break;
    }

    case "pay_each": {
      const others = nextPlayers.filter((p) => p.id !== playerId);
      const need = effect.amount * others.length;
      const payEach =
        others.length === 0
          ? 0
          : Math.min(
              effect.amount,
              Math.floor(Math.min(player.cash, need) / others.length),
            );
      nextPlayers = nextPlayers.map((p) => {
        if (p.id === playerId) {
          return { ...p, cash: p.cash - payEach * others.length };
        }
        return { ...p, cash: p.cash + payEach };
      });
      notes.push(
        `Pagou $${payEach} a cada jogador (total $${payEach * others.length}).`,
      );
      break;
    }

    case "go_to_jail":
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        position: JAIL_INDEX,
        inJail: true,
      });
      notes.push("Foi preso no Forte de São Marcelo.");
      break;

    case "advance_to": {
      const from = player.position;
      const to = effect.spaceIndex;
      const steps = stepsForward(from, to);
      let cash = player.cash;
      if (effect.collectGo) {
        if (to === 0 || (steps > 0 && crossesGo(from, steps))) {
          cash += GO_BONUS;
          notes.push("Passou/parou na Chegada: +$200.");
        }
      }
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        position: to,
        cash,
      });
      movedTo = to;
      break;
    }

    case "move_back": {
      const boardSize = 40;
      const position =
        (((player.position - effect.steps) % boardSize) + boardSize) %
        boardSize;
      nextPlayers = updatePlayer(nextPlayers, playerId, { position });
      notes.push(`Voltou ${effect.steps} casas.`);
      movedTo = position;
      break;
    }

    case "nearest_transport": {
      const to = nearestAhead(player.position, TRANSPORT_INDICES);
      const from = player.position;
      const steps = stepsForward(from, to);
      let cash = player.cash;
      if (steps > 0 && crossesGo(from, steps)) {
        cash += GO_BONUS;
        notes.push("Passou pela Chegada: +$200.");
      }
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        position: to,
        cash,
      });
      notes.push("Avançou até o transporte mais próximo.");
      movedTo = to;
      landingOpts = { transportMultiplier: effect.rentMultiplier };
      break;
    }

    case "nearest_utility": {
      const to = nearestAhead(player.position, UTILITY_INDICES);
      const from = player.position;
      const steps = stepsForward(from, to);
      let cash = player.cash;
      if (steps > 0 && crossesGo(from, steps)) {
        cash += GO_BONUS;
        notes.push("Passou pela Chegada: +$200.");
      }
      utilityDice = rollTwoDice(rng);
      nextPlayers = updatePlayer(nextPlayers, playerId, {
        position: to,
        cash,
      });
      notes.push(
        `Avançou até a companhia mais próxima. Dados: ${utilityDice.die1}+${utilityDice.die2}=${utilityDice.total}.`,
      );
      movedTo = to;
      landingOpts = {
        utilityDiceTotal: utilityDice.total,
        utilityTimes: effect.timesDice,
      };
      break;
    }

    default:
      break;
  }

  if (opts.skipLanding || movedTo == null) {
    return {
      players: nextPlayers,
      decks: nextDecks,
      notes,
      followUpCards: [],
      utilityDice,
    };
  }

  const landed = landAfterMove(
    nextPlayers,
    nextDecks,
    playerId,
    movedTo,
    depth,
    rng,
    landingOpts,
  );

  return {
    players: landed.players,
    decks: landed.decks,
    notes: [...notes, ...landed.notes],
    followUpCards: landed.followUpCards,
    utilityDice,
  };
}
