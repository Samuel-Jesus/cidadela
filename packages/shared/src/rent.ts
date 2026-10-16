import { COLOR_GROUPS, getSpace } from "./board";
import { TRANSPORT_INDICES, UTILITY_INDICES } from "./cards";
import {
  findPropertyOwner,
  type PlayerState,
  type PropertyHolding,
} from "./pawns";
import type { ColorGroup } from "./types";

export const TRANSPORT_RENT_BY_COUNT = [25, 50, 100, 200] as const;

export type PropertyRentRow = {
  base: number;
  monopoly: number;
  pousadas: readonly [number, number, number, number];
  resort: number;
};

export const PROPERTY_RENT: Readonly<Record<number, PropertyRentRow>> = {
  1: { base: 2, monopoly: 4, pousadas: [10, 30, 90, 160], resort: 250 },
  3: { base: 4, monopoly: 8, pousadas: [20, 60, 180, 320], resort: 450 },
  6: { base: 6, monopoly: 12, pousadas: [30, 90, 270, 400], resort: 550 },
  8: { base: 6, monopoly: 12, pousadas: [30, 90, 270, 400], resort: 550 },
  9: { base: 8, monopoly: 16, pousadas: [40, 100, 300, 450], resort: 600 },
  11: { base: 10, monopoly: 20, pousadas: [50, 150, 450, 625], resort: 750 },
  13: { base: 10, monopoly: 20, pousadas: [50, 150, 450, 625], resort: 750 },
  14: { base: 12, monopoly: 24, pousadas: [60, 180, 500, 700], resort: 900 },
  16: { base: 14, monopoly: 28, pousadas: [70, 200, 550, 750], resort: 950 },
  18: { base: 14, monopoly: 28, pousadas: [70, 200, 550, 750], resort: 950 },
  19: { base: 16, monopoly: 32, pousadas: [80, 220, 600, 800], resort: 1000 },
  21: { base: 18, monopoly: 36, pousadas: [90, 250, 700, 875], resort: 1050 },
  23: { base: 18, monopoly: 36, pousadas: [90, 250, 700, 875], resort: 1050 },
  24: { base: 20, monopoly: 40, pousadas: [100, 300, 750, 925], resort: 1100 },
  26: { base: 22, monopoly: 44, pousadas: [110, 330, 800, 975], resort: 1150 },
  27: { base: 22, monopoly: 44, pousadas: [110, 330, 800, 975], resort: 1150 },
  29: { base: 24, monopoly: 48, pousadas: [120, 360, 850, 1025], resort: 1200 },
  31: { base: 26, monopoly: 52, pousadas: [130, 390, 900, 1100], resort: 1275 },
  32: { base: 26, monopoly: 52, pousadas: [130, 390, 900, 1100], resort: 1275 },
  34: { base: 28, monopoly: 56, pousadas: [150, 450, 1000, 1200], resort: 1400 },
  37: { base: 35, monopoly: 70, pousadas: [175, 500, 1100, 1300], resort: 1500 },
  39: { base: 50, monopoly: 100, pousadas: [200, 600, 1400, 1700], resort: 2000 },
};

function holdingOf(
  player: PlayerState,
  spaceIndex: number,
): PropertyHolding | undefined {
  return player.properties.find((h) => h.spaceIndex === spaceIndex);
}

export function countTransports(player: PlayerState): number {
  return player.properties.filter((h) =>
    (TRANSPORT_INDICES as readonly number[]).includes(h.spaceIndex),
  ).length;
}

export function countUtilities(player: PlayerState): number {
  return player.properties.filter((h) =>
    (UTILITY_INDICES as readonly number[]).includes(h.spaceIndex),
  ).length;
}

export function ownsFullColorGroup(
  player: PlayerState,
  colorGroup: ColorGroup,
): boolean {
  const indices = COLOR_GROUPS[colorGroup];
  return indices.every((i) => holdingOf(player, i) != null);
}

export function colorGroupHasMortgage(
  player: PlayerState,
  colorGroup: ColorGroup,
): boolean {
  const indices = COLOR_GROUPS[colorGroup];
  return indices.some((i) => holdingOf(player, i)?.mortgaged === true);
}

export function propertyRentAmount(
  owner: PlayerState,
  spaceIndex: number,
): number | null {
  const holding = holdingOf(owner, spaceIndex);
  if (!holding || holding.mortgaged) return null;

  const row = PROPERTY_RENT[spaceIndex];
  if (!row) return null;

  if (holding.hasResort) return row.resort;
  if (holding.pousadas >= 1) {
    const idx = Math.min(holding.pousadas, 4) - 1;
    return row.pousadas[idx]!;
  }

  const space = getSpace(spaceIndex);
  if (
    space.colorGroup &&
    ownsFullColorGroup(owner, space.colorGroup) &&
    !colorGroupHasMortgage(owner, space.colorGroup)
  ) {
    return row.monopoly;
  }
  return row.base;
}

export function transportRentAmount(
  owner: PlayerState,
  spaceIndex: number,
  multiplier = 1,
): number | null {
  const holding = holdingOf(owner, spaceIndex);
  if (!holding || holding.mortgaged) return null;
  const n = countTransports(owner);
  if (n < 1 || n > 4) return null;
  return TRANSPORT_RENT_BY_COUNT[n - 1]! * multiplier;
}

export function utilityRentAmount(
  owner: PlayerState,
  spaceIndex: number,
  diceTotal: number,
  timesOverride?: number,
): number | null {
  const holding = holdingOf(owner, spaceIndex);
  if (!holding || holding.mortgaged) return null;
  const times =
    timesOverride ?? (countUtilities(owner) >= 2 ? 10 : 4);
  return times * diceTotal;
}

export function transferCash(
  players: readonly PlayerState[],
  fromId: string,
  toId: string,
  amount: number,
): PlayerState[] {
  if (amount <= 0 || fromId === toId) return [...players];
  const from = players.find((p) => p.id === fromId);
  if (!from) return [...players];
  const pay = Math.min(from.cash, amount);
  return players.map((p) => {
    if (p.id === fromId) return { ...p, cash: p.cash - pay };
    if (p.id === toId) return { ...p, cash: p.cash + pay };
    return p;
  });
}

export function payBank(
  players: readonly PlayerState[],
  playerId: string,
  amount: number,
): PlayerState[] {
  if (amount <= 0) return [...players];
  return players.map((p) =>
    p.id === playerId
      ? { ...p, cash: Math.max(0, p.cash - amount) }
      : p,
  );
}

export function chargeRentIfOwned(
  players: readonly PlayerState[],
  visitorId: string,
  spaceIndex: number,
  opts?: {
    transportMultiplier?: number;
    utilityDiceTotal?: number;
    utilityTimes?: number;
  },
): { players: PlayerState[]; amount: number; ownerId: string | null } {
  const owner = findPropertyOwner(players, spaceIndex);
  if (!owner || owner.id === visitorId) {
    return { players: [...players], amount: 0, ownerId: null };
  }

  const space = getSpace(spaceIndex);
  let amount: number | null = null;

  if (space.kind === "transporte") {
    amount = transportRentAmount(
      owner,
      spaceIndex,
      opts?.transportMultiplier ?? 1,
    );
  } else if (space.kind === "companhia") {
    if (opts?.utilityDiceTotal == null) {
      return { players: [...players], amount: 0, ownerId: null };
    }
    amount = utilityRentAmount(
      owner,
      spaceIndex,
      opts.utilityDiceTotal,
      opts.utilityTimes,
    );
  } else if (space.kind === "propriedade") {
    amount = propertyRentAmount(owner, spaceIndex);
  }

  if (amount == null || amount <= 0) {
    return { players: [...players], amount: 0, ownerId: owner.id };
  }

  return {
    players: transferCash(players, visitorId, owner.id, amount),
    amount,
    ownerId: owner.id,
  };
}
