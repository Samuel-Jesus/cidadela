import { getSpace } from "./board";
import {
  mortgageInterest,
  redeemCost,
} from "./propertyActions";
import {
  findPropertyOwner,
  type PlayerState,
  type PropertyHolding,
} from "./pawns";
import { payBank, transferCash } from "./rent";

export type TradeSide = {
  cash: number;
  spaceIndexes: number[];
  protectionCardIds: string[];
};

export type TradeOffer = {
  fromId: string;
  toId: string;
  /** O que `from` entrega a `to`. */
  give: TradeSide;
  /** O que `to` entrega a `from`. */
  receive: TradeSide;
};

/** FR-65: ao receber bem hipotecado. */
export type MortgageChoice = "redeem" | "interest";

export type TradeValidation =
  | { ok: true }
  | { ok: false; error: string };

export type TradeResult =
  | { ok: true; players: PlayerState[]; notes: string[] }
  | { ok: false; error: string };

function emptySide(side: TradeSide): boolean {
  return (
    side.cash <= 0 &&
    side.spaceIndexes.length === 0 &&
    side.protectionCardIds.length === 0
  );
}

function holdingOf(
  player: PlayerState,
  spaceIndex: number,
): PropertyHolding | undefined {
  return player.properties.find((h) => h.spaceIndex === spaceIndex);
}

function hasBuildings(h: PropertyHolding): boolean {
  return h.hasResort || h.pousadas > 0;
}

function validateSide(
  giver: PlayerState,
  side: TradeSide,
  label: string,
): TradeValidation {
  if (!Number.isFinite(side.cash) || side.cash < 0) {
    return { ok: false, error: `${label}: dinheiro inválido.` };
  }
  if (side.cash > giver.cash) {
    return {
      ok: false,
      error: `${label}: saldo insuficiente (tem $${giver.cash}).`,
    };
  }

  const seenSpaces = new Set<number>();
  for (const idx of side.spaceIndexes) {
    if (seenSpaces.has(idx)) {
      return { ok: false, error: `${label}: escritura duplicada.` };
    }
    seenSpaces.add(idx);
    const h = holdingOf(giver, idx);
    if (!h) {
      return {
        ok: false,
        error: `${label}: não possui ${getSpace(idx).name}.`,
      };
    }
    if (hasBuildings(h)) {
      return {
        ok: false,
        error: `${getSpace(idx).name} tem construções — venda-as antes de negociar.`,
      };
    }
  }

  const seenCards = new Set<string>();
  for (const cardId of side.protectionCardIds) {
    if (seenCards.has(cardId)) {
      return { ok: false, error: `${label}: carta duplicada.` };
    }
    seenCards.add(cardId);
    if (!giver.protectionCardIds.includes(cardId)) {
      return { ok: false, error: `${label}: não possui essa carta Proteção.` };
    }
  }

  return { ok: true };
}

export function validateTrade(
  players: readonly PlayerState[],
  offer: TradeOffer,
): TradeValidation {
  if (offer.fromId === offer.toId) {
    return { ok: false, error: "Escolha outro jogador." };
  }
  const from = players.find((p) => p.id === offer.fromId);
  const to = players.find((p) => p.id === offer.toId);
  if (!from || !to) return { ok: false, error: "Jogador inválido." };
  if (from.bankrupt || to.bankrupt) {
    return { ok: false, error: "Jogador falido não negocia." };
  }
  if (emptySide(offer.give) && emptySide(offer.receive)) {
    return { ok: false, error: "A troca está vazia." };
  }

  const a = validateSide(from, offer.give, "Você oferece");
  if (!a.ok) return a;
  const b = validateSide(to, offer.receive, "O outro oferece");
  if (!b.ok) return b;

  // Propriedades não podem estar em ambas as listas (impossível se donos distintos)
  for (const idx of offer.give.spaceIndexes) {
    if (findPropertyOwner(players, idx)?.id !== offer.fromId) {
      return { ok: false, error: "Escritura mudou de dono." };
    }
  }
  for (const idx of offer.receive.spaceIndexes) {
    if (findPropertyOwner(players, idx)?.id !== offer.toId) {
      return { ok: false, error: "Escritura mudou de dono." };
    }
  }

  return { ok: true };
}

function moveHoldings(
  players: PlayerState[],
  fromId: string,
  toId: string,
  spaceIndexes: readonly number[],
): { players: PlayerState[]; moved: PropertyHolding[] } {
  const moved: PropertyHolding[] = [];
  let next = players.map((p) => {
    if (p.id !== fromId) return p;
    const keep: PropertyHolding[] = [];
    for (const h of p.properties) {
      if (spaceIndexes.includes(h.spaceIndex)) {
        moved.push({ ...h });
      } else {
        keep.push(h);
      }
    }
    return { ...p, properties: keep };
  });
  next = next.map((p) => {
    if (p.id !== toId) return p;
    return { ...p, properties: [...p.properties, ...moved] };
  });
  return { players: next, moved };
}

function moveProtections(
  players: PlayerState[],
  fromId: string,
  toId: string,
  cardIds: readonly string[],
): PlayerState[] {
  return players.map((p) => {
    if (p.id === fromId) {
      return {
        ...p,
        protectionCardIds: p.protectionCardIds.filter(
          (id) => !cardIds.includes(id),
        ),
      };
    }
    if (p.id === toId) {
      return {
        ...p,
        protectionCardIds: [...p.protectionCardIds, ...cardIds],
      };
    }
    return p;
  });
}

function resolveMortgagedReceipt(
  players: PlayerState[],
  receiverId: string,
  holdings: readonly PropertyHolding[],
  resolutions: Readonly<Record<number, MortgageChoice>>,
  notes: string[],
): TradeResult {
  let next = players;
  for (const h of holdings) {
    if (!h.mortgaged) continue;
    const name = getSpace(h.spaceIndex).name;
    const choice = resolutions[h.spaceIndex] ?? "interest";
    const receiver = next.find((p) => p.id === receiverId);
    if (!receiver) {
      return { ok: false, error: "Receptor inválido." };
    }

    if (choice === "redeem") {
      const cost = redeemCost(h.spaceIndex);
      if (receiver.cash < cost) {
        return {
          ok: false,
          error: `Sem $${cost} para resgatar ${name} na hora.`,
        };
      }
      next = payBank(next, receiverId, cost);
      next = next.map((p) => {
        if (p.id !== receiverId) return p;
        return {
          ...p,
          properties: p.properties.map((ph) =>
            ph.spaceIndex === h.spaceIndex
              ? { ...ph, mortgaged: false }
              : ph,
          ),
        };
      });
      notes.push(`Resgatou ${name} na negociação ($${cost}).`);
      continue;
    }

    const interest = mortgageInterest(h.spaceIndex);
    if (receiver.cash < interest) {
      return {
        ok: false,
        error: `Sem $${interest} de juros para manter ${name} hipotecada.`,
      };
    }
    next = payBank(next, receiverId, interest);
    notes.push(
      `Manteve ${name} hipotecada e pagou $${interest} de juros ao banco.`,
    );
  }
  return { ok: true, players: next, notes };
}

/**
 * Aplica a troca. `resolutions` cobre cada espaço hipotecado que muda de dono
 * (chave = spaceIndex → redeem | interest).
 */
export function applyTrade(
  players: readonly PlayerState[],
  offer: TradeOffer,
  resolutions: Readonly<Record<number, MortgageChoice>> = {},
): TradeResult {
  const check = validateTrade(players, offer);
  if (!check.ok) return check;

  const notes: string[] = ["Negociação concluída."];
  let next: PlayerState[] = players.map((p) => ({
    ...p,
    properties: p.properties.map((h) => ({ ...h })),
    protectionCardIds: [...p.protectionCardIds],
  }));

  // Dinheiro
  if (offer.give.cash > 0) {
    next = transferCash(next, offer.fromId, offer.toId, offer.give.cash);
    notes.push(`$${offer.give.cash} transferidos.`);
  }
  if (offer.receive.cash > 0) {
    next = transferCash(next, offer.toId, offer.fromId, offer.receive.cash);
    notes.push(`$${offer.receive.cash} recebidos.`);
  }

  // Escrituras from → to
  const toReceiver = moveHoldings(
    next,
    offer.fromId,
    offer.toId,
    offer.give.spaceIndexes,
  );
  next = toReceiver.players;

  // Escrituras to → from
  const fromReceiver = moveHoldings(
    next,
    offer.toId,
    offer.fromId,
    offer.receive.spaceIndexes,
  );
  next = fromReceiver.players;

  // Proteções
  if (offer.give.protectionCardIds.length) {
    next = moveProtections(
      next,
      offer.fromId,
      offer.toId,
      offer.give.protectionCardIds,
    );
  }
  if (offer.receive.protectionCardIds.length) {
    next = moveProtections(
      next,
      offer.toId,
      offer.fromId,
      offer.receive.protectionCardIds,
    );
  }

  // FR-65 nos dois sentidos (após transferir dinheiro da troca)
  const r1 = resolveMortgagedReceipt(
    next,
    offer.toId,
    toReceiver.moved,
    resolutions,
    notes,
  );
  if (!r1.ok) return r1;
  next = r1.players;

  const r2 = resolveMortgagedReceipt(
    next,
    offer.fromId,
    fromReceiver.moved,
    resolutions,
    notes,
  );
  if (!r2.ok) return r2;
  next = r2.players;

  return { ok: true, players: next, notes };
}

/** Lista spaceIndexes hipotecados que mudam de dono nesta oferta. */
export function mortgagedSpacesInTrade(
  players: readonly PlayerState[],
  offer: TradeOffer,
): number[] {
  const out: number[] = [];
  const from = players.find((p) => p.id === offer.fromId);
  const to = players.find((p) => p.id === offer.toId);
  if (!from || !to) return out;
  for (const idx of offer.give.spaceIndexes) {
    const h = holdingOf(from, idx);
    if (h?.mortgaged) out.push(idx);
  }
  for (const idx of offer.receive.spaceIndexes) {
    const h = holdingOf(to, idx);
    if (h?.mortgaged) out.push(idx);
  }
  return out;
}
