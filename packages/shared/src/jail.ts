import { JAIL_INDEX, returnCardToBottom, type DecksState } from "./cards";
import { type PlayerState } from "./pawns";
import { payBank } from "./rent";

export const JAIL_FINE = 50;
export const JAIL_MAX_ATTEMPTS = 3;

export function sendToJail(player: PlayerState): PlayerState {
  return {
    ...player,
    position: JAIL_INDEX,
    inJail: true,
    jailAttempts: 0,
  };
}

export function releaseFromJail(player: PlayerState): PlayerState {
  return {
    ...player,
    inJail: false,
    jailAttempts: 0,
  };
}

export function payJailFine(
  players: readonly PlayerState[],
  playerId: string,
): { players: PlayerState[]; ok: boolean; error?: string } {
  const player = players.find((p) => p.id === playerId);
  if (!player?.inJail) {
    return { players: [...players], ok: false, error: "Não está no Forte." };
  }
  if (player.cash < JAIL_FINE) {
    return {
      players: [...players],
      ok: false,
      error: `Precisa de $${JAIL_FINE} para sair do Forte.`,
    };
  }
  const paid = payBank(players, playerId, JAIL_FINE);
  return {
    players: paid.map((p) => (p.id === playerId ? releaseFromJail(p) : p)),
    ok: true,
  };
}

export function useProtectionToLeaveJail(
  players: readonly PlayerState[],
  decks: DecksState,
  playerId: string,
  cardId?: string,
): {
  players: PlayerState[];
  decks: DecksState;
  ok: boolean;
  error?: string;
  usedCardId?: string;
} {
  const player = players.find((p) => p.id === playerId);
  if (!player?.inJail) {
    return {
      players: [...players],
      decks,
      ok: false,
      error: "Não está no Forte.",
    };
  }
  const id = cardId ?? player.protectionCardIds[0];
  if (!id || !player.protectionCardIds.includes(id)) {
    return {
      players: [...players],
      decks,
      ok: false,
      error: "Sem carta Proteção na carteira.",
    };
  }

  const nextPlayers = players.map((p) => {
    if (p.id !== playerId) return p;
    return releaseFromJail({
      ...p,
      protectionCardIds: p.protectionCardIds.filter((c) => c !== id),
    });
  });

  return {
    players: nextPlayers,
    decks: returnCardToBottom(decks, id),
    ok: true,
    usedCardId: id,
  };
}

export function forceLeaveJailAfterFailedAttempts(
  players: readonly PlayerState[],
  playerId: string,
): PlayerState[] {
  const paid = payBank(players, playerId, JAIL_FINE);
  return paid.map((p) => (p.id === playerId ? releaseFromJail(p) : p));
}
