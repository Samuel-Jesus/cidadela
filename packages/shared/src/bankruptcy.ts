import { getSpace } from "./board";
import type { AuctionLot } from "./auction";
import {
  returnCardToBottom,
  type DecksState,
} from "./cards";
import {
  BUILD_COST_BY_GROUP,
  mortgageInterest,
  mortgageValue,
} from "./propertyActions";
import type { PlayerState, PropertyHolding } from "./pawns";
import { payBank, transferCash } from "./rent";

export type Creditor = { type: "player"; playerId: string } | { type: "bank" };

export type DebtInfo = {
  debtorId: string;
  amount: number;
  creditor: Creditor;
  reason: string;
};

export type SettleResult =
  | {
    status: "paid";
    players: PlayerState[];
    decks: DecksState;
    notes: string[];
  }
  | {
    status: "shortfall";
    players: PlayerState[];
    decks: DecksState;
    debt: DebtInfo;
    raisable: number;
    notes: string[];
  }
  | {
    status: "bankrupt";
    players: PlayerState[];
    decks: DecksState;
    debt: DebtInfo;
    auctionQueue: AuctionLot[];
    notes: string[];
  };

function buildingRefund(holding: PropertyHolding): number {
  const space = getSpace(holding.spaceIndex);
  if (!space.colorGroup) return 0;
  const unit = BUILD_COST_BY_GROUP[space.colorGroup];
  const half = Math.floor(unit / 2);
  if (holding.hasResort) {
    return half * 5;
  }
  return holding.pousadas * half;
}

export function maxRaisableCash(player: PlayerState): number {
  let total = player.cash;
  for (const h of player.properties) {
    total += buildingRefund(h);
    if (!h.mortgaged) total += mortgageValue(h.spaceIndex);
  }
  return total;
}

function stripBuildings(holding: PropertyHolding): PropertyHolding {
  return { ...holding, pousadas: 0, hasResort: false };
}

export function liquidateAll(
  players: readonly PlayerState[],
  playerId: string,
): PlayerState[] {
  return players.map((p) => {
    if (p.id !== playerId) return p;
    let cash = p.cash;
    const properties = p.properties.map((h) => {
      let next = h;
      const refund = buildingRefund(h);
      if (refund > 0) {
        cash += refund;
        next = stripBuildings(next);
      }
      if (!next.mortgaged) {
        cash += mortgageValue(next.spaceIndex);
        next = { ...next, mortgaged: true };
      }
      return next;
    });
    return { ...p, cash, properties };
  });
}

function applyMortgagedInterestOnReceive(
  players: PlayerState[],
  creditorId: string,
  holdings: PropertyHolding[],
  notes: string[],
): PlayerState[] {
  let next = players;
  for (const h of holdings) {
    if (!h.mortgaged) continue;
    const interest = mortgageInterest(h.spaceIndex);
    const creditor = next.find((p) => p.id === creditorId);
    if (!creditor) continue;
    const name = getSpace(h.spaceIndex).name;
    if (creditor.cash >= interest) {
      next = payBank(next, creditorId, interest);
      notes.push(
        `Credor pagou $${interest} de juros para manter ${name} hipotecada.`,
      );
    } else {
      notes.push(
        `${name} chegou hipotecada; credor sem caixa para juros — permanece hipotecada.`,
      );
    }
  }
  return next;
}

export function settleDebt(
  players: readonly PlayerState[],
  decks: DecksState,
  debtorId: string,
  amount: number,
  creditor: Creditor,
  reason: string,
): SettleResult {
  const notes: string[] = [];
  if (amount <= 0) {
    return { status: "paid", players: [...players], decks, notes };
  }

  const debtor = players.find((p) => p.id === debtorId);
  if (!debtor || debtor.bankrupt) {
    return { status: "paid", players: [...players], decks, notes };
  }

  const debt: DebtInfo = { debtorId, amount, creditor, reason };

  if (debtor.cash >= amount) {
    const paid =
      creditor.type === "bank"
        ? payBank(players, debtorId, amount)
        : transferCash(players, debtorId, creditor.playerId, amount);
    notes.push(`${reason}: pagou $${amount}.`);
    return { status: "paid", players: paid, decks, notes };
  }

  const raisable = maxRaisableCash(debtor);
  if (raisable < amount) {
    const broke = declareBankruptcy(players, decks, debtorId, creditor);
    return {
      status: "bankrupt",
      players: broke.players,
      decks: broke.decks,
      debt,
      auctionQueue: broke.auctionQueue,
      notes: [...notes, ...broke.notes, `${reason}: falência (devia $${amount}).`],
    };
  }

  notes.push(
    `${reason}: deve $${amount}, tem $${debtor.cash}. Venda/hipoteque ou declare falência.`,
  );
  return {
    status: "shortfall",
    players: [...players],
    decks,
    debt,
    raisable,
    notes,
  };
}

export function payPendingDebt(
  players: readonly PlayerState[],
  decks: DecksState,
  debt: DebtInfo,
): SettleResult {
  return settleDebt(
    players,
    decks,
    debt.debtorId,
    debt.amount,
    debt.creditor,
    debt.reason,
  );
}

export function declareBankruptcy(
  players: readonly PlayerState[],
  decks: DecksState,
  debtorId: string,
  creditor: Creditor,
): {
  players: PlayerState[];
  decks: DecksState;
  auctionQueue: AuctionLot[];
  notes: string[];
} {
  const notes: string[] = [];
  const debtor = players.find((p) => p.id === debtorId);
  if (!debtor || debtor.bankrupt) {
    return { players: [...players], decks, auctionQueue: [], notes };
  }

  const holdings = debtor.properties.map(stripBuildings);
  const cash = debtor.cash;
  const protections = [...debtor.protectionCardIds];
  let nextDecks = decks;
  let auctionQueue: AuctionLot[] = [];

  let nextPlayers = players.map((p) => {
    if (p.id !== debtorId) return p;
    return {
      ...p,
      cash: 0,
      properties: [],
      protectionCardIds: [],
      bankrupt: true,
      inJail: false,
      jailAttempts: 0,
    };
  });

  if (creditor.type === "player") {
    const credId = creditor.playerId;
    nextPlayers = nextPlayers.map((p) => {
      if (p.id !== credId) return p;
      return {
        ...p,
        cash: p.cash + cash,
        properties: [...p.properties, ...holdings],
        protectionCardIds: [...p.protectionCardIds, ...protections],
      };
    });
    notes.push(
      `Falência: bens e $${cash} foram para o credor. Construções voltaram ao banco.`,
    );
    nextPlayers = applyMortgagedInterestOnReceive(
      nextPlayers,
      credId,
      holdings,
      notes,
    );
  } else {
    for (const cardId of protections) {
      nextDecks = returnCardToBottom(nextDecks, cardId);
    }
    auctionQueue = holdings.map((h) => ({
      spaceIndex: h.spaceIndex,
      mortgaged: h.mortgaged,
    }));
    notes.push(
      `Falência para o banco: $${cash} e construções ao banco. ${auctionQueue.length} propriedade(s) vão a leilão.`,
    );
  }

  return { players: nextPlayers, decks: nextDecks, auctionQueue, notes };
}
