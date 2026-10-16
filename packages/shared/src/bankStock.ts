import type { PlayerState, PropertyHolding } from "./pawns";

export const BANK_POUSADAS_MAX = 32;
export const BANK_RESORTS_MAX = 12;

export type BankStock = {
  pousadas: number;
  resorts: number;
};

export function createBankStock(): BankStock {
  return { pousadas: BANK_POUSADAS_MAX, resorts: BANK_RESORTS_MAX };
}

export function countBuildingsOnBoard(
  players: readonly PlayerState[],
): { pousadas: number; resorts: number } {
  let pousadas = 0;
  let resorts = 0;
  for (const p of players) {
    for (const h of p.properties) {
      if (h.hasResort) resorts += 1;
      else pousadas += h.pousadas;
    }
  }
  return { pousadas, resorts };
}

export function bankStockFromPlayers(
  players: readonly PlayerState[],
): BankStock {
  const used = countBuildingsOnBoard(players);
  return {
    pousadas: Math.max(0, BANK_POUSADAS_MAX - used.pousadas),
    resorts: Math.max(0, BANK_RESORTS_MAX - used.resorts),
  };
}

export function countBuildingsInHoldings(
  holdings: readonly PropertyHolding[],
): { pousadas: number; resorts: number } {
  let pousadas = 0;
  let resorts = 0;
  for (const h of holdings) {
    if (h.hasResort) resorts += 1;
    else pousadas += h.pousadas;
  }
  return { pousadas, resorts };
}
