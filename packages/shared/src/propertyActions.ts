import { COLOR_GROUPS, getSpace } from "./board";
import type { BankStock } from "./bankStock";
import { bankStockFromPlayers } from "./bankStock";
import {
  colorGroupHasMortgage,
  ownsFullColorGroup,
} from "./rent";
import type { PlayerState, PropertyHolding } from "./pawns";
import type { ColorGroup } from "./types";

export const BUILD_COST_BY_GROUP: Record<ColorGroup, number> = {
  marrom: 50,
  "azul-claro": 50,
  rosa: 100,
  laranja: 100,
  vermelho: 150,
  amarelo: 150,
  verde: 200,
  "azul-escuro": 200,
};

export type ActionResult =
  | { ok: true; players: PlayerState[] }
  | { ok: false; error: string };

export function mortgageValue(spaceIndex: number): number {
  const price = getSpace(spaceIndex).price;
  if (price == null) return 0;
  return Math.floor(price / 2);
}

export function mortgageInterest(spaceIndex: number): number {
  return Math.ceil(mortgageValue(spaceIndex) * 0.1);
}

export function redeemCost(spaceIndex: number): number {
  return mortgageValue(spaceIndex) + mortgageInterest(spaceIndex);
}

export function buildCostForSpace(spaceIndex: number): number | null {
  const group = getSpace(spaceIndex).colorGroup;
  if (!group) return null;
  return BUILD_COST_BY_GROUP[group];
}

function holdingOf(
  player: PlayerState,
  spaceIndex: number,
): PropertyHolding | undefined {
  return player.properties.find((h) => h.spaceIndex === spaceIndex);
}

function updateHolding(
  players: readonly PlayerState[],
  playerId: string,
  spaceIndex: number,
  patch: Partial<PropertyHolding> | ((h: PropertyHolding) => PropertyHolding),
  cashDelta = 0,
): PlayerState[] {
  return players.map((p) => {
    if (p.id !== playerId) return p;
    return {
      ...p,
      cash: p.cash + cashDelta,
      properties: p.properties.map((h) => {
        if (h.spaceIndex !== spaceIndex) return h;
        return typeof patch === "function" ? patch(h) : { ...h, ...patch };
      }),
    };
  });
}

function groupBuildLevels(
  player: PlayerState,
  colorGroup: ColorGroup,
): number[] {
  return COLOR_GROUPS[colorGroup].map((i) => {
    const h = holdingOf(player, i);
    if (!h) return 0;
    if (h.hasResort) return 5;
    return h.pousadas;
  });
}

function groupHasAnyBuilding(
  player: PlayerState,
  colorGroup: ColorGroup,
): boolean {
  return groupBuildLevels(player, colorGroup).some((n) => n > 0);
}

export function canMortgage(
  player: PlayerState,
  spaceIndex: number,
): ActionResult {
  const h = holdingOf(player, spaceIndex);
  if (!h) return { ok: false, error: "Você não possui esta escritura." };
  if (h.mortgaged) return { ok: false, error: "Já está hipotecada." };

  const space = getSpace(spaceIndex);
  if (space.colorGroup && groupHasAnyBuilding(player, space.colorGroup)) {
    return {
      ok: false,
      error: "Venda todas as construções do grupo antes de hipotecar.",
    };
  }
  if (h.pousadas > 0 || h.hasResort) {
    return {
      ok: false,
      error: "Venda as construções antes de hipotecar.",
    };
  }
  return { ok: true, players: [] };
}

export function mortgageProperty(
  players: readonly PlayerState[],
  playerId: string,
  spaceIndex: number,
): ActionResult {
  const player = players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: "Jogador inválido." };
  const check = canMortgage(player, spaceIndex);
  if (!check.ok) return check;

  const value = mortgageValue(spaceIndex);
  return {
    ok: true,
    players: updateHolding(
      players,
      playerId,
      spaceIndex,
      { mortgaged: true },
      value,
    ),
  };
}

export function redeemProperty(
  players: readonly PlayerState[],
  playerId: string,
  spaceIndex: number,
): ActionResult {
  const player = players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: "Jogador inválido." };
  const h = holdingOf(player, spaceIndex);
  if (!h) return { ok: false, error: "Você não possui esta escritura." };
  if (!h.mortgaged) return { ok: false, error: "Não está hipotecada." };

  const cost = redeemCost(spaceIndex);
  if (player.cash < cost) {
    return { ok: false, error: `Saldo insuficiente (precisa ${cost}).` };
  }
  return {
    ok: true,
    players: updateHolding(
      players,
      playerId,
      spaceIndex,
      { mortgaged: false },
      -cost,
    ),
  };
}

export function canBuildPousada(
  player: PlayerState,
  spaceIndex: number,
  stock?: BankStock,
): ActionResult {
  const space = getSpace(spaceIndex);
  if (space.kind !== "propriedade" || !space.colorGroup) {
    return { ok: false, error: "Só se constrói em terrenos de cor." };
  }
  const h = holdingOf(player, spaceIndex);
  if (!h) return { ok: false, error: "Você não possui este terreno." };
  if (h.mortgaged || colorGroupHasMortgage(player, space.colorGroup)) {
    return { ok: false, error: "Há hipoteca no grupo." };
  }
  if (!ownsFullColorGroup(player, space.colorGroup)) {
    return { ok: false, error: "Precisa do monopólio do grupo." };
  }
  if (h.hasResort) return { ok: false, error: "Já tem resort." };
  if (h.pousadas >= 4) {
    return { ok: false, error: "Máximo de 4 pousadas — construa um resort." };
  }

  const levels = groupBuildLevels(player, space.colorGroup);
  const min = Math.min(...levels);
  if (h.pousadas > min) {
    return { ok: false, error: "Construção deve ser uniforme no grupo." };
  }

  if (stock && stock.pousadas < 1) {
    return {
      ok: false,
      error: "Banco sem pousadas — espere alguém vender construções.",
    };
  }

  const cost = BUILD_COST_BY_GROUP[space.colorGroup];
  if (player.cash < cost) {
    return { ok: false, error: `Saldo insuficiente (precisa $${cost}).` };
  }
  return { ok: true, players: [] };
}

export function buildPousada(
  players: readonly PlayerState[],
  playerId: string,
  spaceIndex: number,
): ActionResult {
  const player = players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: "Jogador inválido." };
  const stock = bankStockFromPlayers(players);
  const check = canBuildPousada(player, spaceIndex, stock);
  if (!check.ok) return check;
  const cost = buildCostForSpace(spaceIndex)!;
  return {
    ok: true,
    players: updateHolding(
      players,
      playerId,
      spaceIndex,
      (h) => ({ ...h, pousadas: h.pousadas + 1 }),
      -cost,
    ),
  };
}

export function canBuildResort(
  player: PlayerState,
  spaceIndex: number,
  stock?: BankStock,
): ActionResult {
  const space = getSpace(spaceIndex);
  if (space.kind !== "propriedade" || !space.colorGroup) {
    return { ok: false, error: "Só se constrói em terrenos de cor." };
  }
  const h = holdingOf(player, spaceIndex);
  if (!h) return { ok: false, error: "Você não possui este terreno." };
  if (h.mortgaged || colorGroupHasMortgage(player, space.colorGroup)) {
    return { ok: false, error: "Há hipoteca no grupo." };
  }
  if (!ownsFullColorGroup(player, space.colorGroup)) {
    return { ok: false, error: "Precisa do monopólio do grupo." };
  }
  if (h.hasResort) return { ok: false, error: "Já tem resort." };
  if (h.pousadas !== 4) {
    return { ok: false, error: "Precisa de 4 pousadas neste terreno." };
  }

  const othersMin = Math.min(
    ...COLOR_GROUPS[space.colorGroup]
      .filter((i) => i !== spaceIndex)
      .map((i) => {
        const oh = holdingOf(player, i);
        if (!oh) return 0;
        return oh.hasResort ? 5 : oh.pousadas;
      }),
  );
  if (othersMin < 4) {
    return {
      ok: false,
      error: "Os outros terrenos do grupo precisam estar no mesmo nível.",
    };
  }

  if (stock && stock.resorts < 1) {
    return {
      ok: false,
      error: "Banco sem resorts — espere alguém vender um resort.",
    };
  }

  const cost = BUILD_COST_BY_GROUP[space.colorGroup];
  if (player.cash < cost) {
    return { ok: false, error: `Saldo insuficiente (precisa $${cost}).` };
  }
  return { ok: true, players: [] };
}

export function buildResort(
  players: readonly PlayerState[],
  playerId: string,
  spaceIndex: number,
): ActionResult {
  const player = players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: "Jogador inválido." };
  const stock = bankStockFromPlayers(players);
  const check = canBuildResort(player, spaceIndex, stock);
  if (!check.ok) return check;
  const cost = buildCostForSpace(spaceIndex)!;
  // 4 pousadas voltam ao banco; 1 resort sai do estoque (derivado do tabuleiro).
  return {
    ok: true,
    players: updateHolding(
      players,
      playerId,
      spaceIndex,
      { hasResort: true, pousadas: 0 },
      -cost,
    ),
  };
}

export function canSellBuilding(
  player: PlayerState,
  spaceIndex: number,
  stock?: BankStock,
): ActionResult {
  const space = getSpace(spaceIndex);
  const h = holdingOf(player, spaceIndex);
  if (!h) return { ok: false, error: "Você não possui este terreno." };
  if (!h.hasResort && h.pousadas <= 0) {
    return { ok: false, error: "Não há construções para vender." };
  }
  if (space.colorGroup) {
    const level = h.hasResort ? 5 : h.pousadas;
    const levels = groupBuildLevels(player, space.colorGroup);
    const max = Math.max(...levels);
    if (level < max) {
      return { ok: false, error: "Venda deve ser uniforme no grupo." };
    }
  }
  if (h.hasResort && stock && stock.pousadas < 4) {
    return {
      ok: false,
      error: "Banco sem 4 pousadas para desmontar o resort.",
    };
  }
  return { ok: true, players: [] };
}

export function sellBuilding(
  players: readonly PlayerState[],
  playerId: string,
  spaceIndex: number,
): ActionResult {
  const player = players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: "Jogador inválido." };
  const stock = bankStockFromPlayers(players);
  const check = canSellBuilding(player, spaceIndex, stock);
  if (!check.ok) return check;

  const h = holdingOf(player, spaceIndex)!;
  const cost = buildCostForSpace(spaceIndex) ?? 0;
  const refund = Math.floor(cost / 2);

  if (h.hasResort) {
    return {
      ok: true,
      players: updateHolding(
        players,
        playerId,
        spaceIndex,
        { hasResort: false, pousadas: 4 },
        refund,
      ),
    };
  }

  return {
    ok: true,
    players: updateHolding(
      players,
      playerId,
      spaceIndex,
      (cur) => ({ ...cur, pousadas: cur.pousadas - 1 }),
      refund,
    ),
  };
}
