export type DeckId = "fitinha" | "benca";

export type ProtectionKind = "protecao_iemanja" | "protecao_bonfim";

export type CardEffect =
  | { type: "advance_to"; spaceIndex: number; collectGo: boolean }
  | { type: "nearest_transport"; rentMultiplier: number }
  | { type: "nearest_utility"; timesDice: number }
  | { type: "move_back"; steps: number }
  | { type: "go_to_jail" }
  | { type: "keep"; kind: ProtectionKind }
  | { type: "pay_bank"; amount: number }
  | { type: "pay_per_building"; perPousada: number; perResort: number }
  | { type: "collect_bank"; amount: number }
  | { type: "collect_from_each"; amount: number }
  | { type: "pay_each"; amount: number };

export type CardId = string;

export type CardDef = {
  id: CardId;
  deck: DeckId;
  number: number;
  text: string;
  effect: CardEffect;
  keepable: boolean;
};

export const DECK_LABELS: Record<DeckId, string> = {
  fitinha: "Fitinha do Bonfim",
  benca: "Bença",
};

export const PROTECTION_LABELS: Record<ProtectionKind, string> = {
  protecao_iemanja: "Proteção de Iemanjá",
  protecao_bonfim: "Proteção do Senhor do Bonfim",
};

export const TRANSPORT_INDICES = [5, 15, 25, 35] as const;
export const UTILITY_INDICES = [12, 28] as const;
export const JAIL_INDEX = 10;

export const FITINHA_CARDS: readonly CardDef[] = [
  {
    id: "fitinha-01",
    deck: "fitinha",
    number: 1,
    text: "Avance até a Chegada (Aeroporto de Salvador). Receba $200.",
    effect: { type: "advance_to", spaceIndex: 0, collectGo: true },
    keepable: false,
  },
  {
    id: "fitinha-02",
    deck: "fitinha",
    number: 2,
    text: "Avance até Itacaré. Se passar pela Chegada, receba $200.",
    effect: { type: "advance_to", spaceIndex: 13, collectGo: true },
    keepable: false,
  },
  {
    id: "fitinha-03",
    deck: "fitinha",
    number: 3,
    text: "Avance até Caraíva. Se passar pela Chegada, receba $200.",
    effect: { type: "advance_to", spaceIndex: 24, collectGo: true },
    keepable: false,
  },
  {
    id: "fitinha-04",
    deck: "fitinha",
    number: 4,
    text: "Avance até o Pelourinho.",
    effect: { type: "advance_to", spaceIndex: 39, collectGo: true },
    keepable: false,
  },
  {
    id: "fitinha-05",
    deck: "fitinha",
    number: 5,
    text: "Avance até o transporte mais próximo. Se tiver dono, pague o DOBRO do aluguel ao dono. Se não tiver, você pode comprá-lo.",
    effect: { type: "nearest_transport", rentMultiplier: 2 },
    keepable: false,
  },
  {
    id: "fitinha-06",
    deck: "fitinha",
    number: 6,
    text: "Avance até o transporte mais próximo. Se tiver dono, pague o DOBRO do aluguel ao dono. Se não tiver, você pode comprá-lo.",
    effect: { type: "nearest_transport", rentMultiplier: 2 },
    keepable: false,
  },
  {
    id: "fitinha-07",
    deck: "fitinha",
    number: 7,
    text: "Avance até a companhia mais próxima (Coelba ou Embasa). Se tiver dono, jogue os dados e pague 10 vezes o resultado.",
    effect: { type: "nearest_utility", timesDice: 10 },
    keepable: false,
  },
  {
    id: "fitinha-08",
    deck: "fitinha",
    number: 8,
    text: "Pegue o Elevador Lacerda: avance até lá. Se passar pela Chegada, receba $200.",
    effect: { type: "advance_to", spaceIndex: 15, collectGo: true },
    keepable: false,
  },
  {
    id: "fitinha-09",
    deck: "fitinha",
    number: 9,
    text: "Choveu na Lavagem do Bonfim e você ficou sem festa. Volte 3 casas.",
    effect: { type: "move_back", steps: 3 },
    keepable: false,
  },
  {
    id: "fitinha-10",
    deck: "fitinha",
    number: 10,
    text: "Vá direto para o Forte de São Marcelo. Não passe pela Chegada e não receba $200.",
    effect: { type: "go_to_jail" },
    keepable: false,
  },
  {
    id: "fitinha-11",
    deck: "fitinha",
    number: 11,
    text: "PROTEÇÃO DE IEMANJÁ: guarde esta carta para sair do Forte sem pagar.",
    effect: { type: "keep", kind: "protecao_iemanja" },
    keepable: true,
  },
  {
    id: "fitinha-12",
    deck: "fitinha",
    number: 12,
    text: "Reforma geral nas suas propriedades: pague $25 por pousada e $100 por resort.",
    effect: { type: "pay_per_building", perPousada: 25, perResort: 100 },
    keepable: false,
  },
  {
    id: "fitinha-13",
    deck: "fitinha",
    number: 13,
    text: "Multa de trânsito na Avenida Paralela. Pague $15.",
    effect: { type: "pay_bank", amount: 15 },
    keepable: false,
  },
  {
    id: "fitinha-14",
    deck: "fitinha",
    number: 14,
    text: "Seu bloco foi o mais animado do Carnaval. Receba $25 de cada jogador.",
    effect: { type: "collect_from_each", amount: 25 },
    keepable: false,
  },
  {
    id: "fitinha-15",
    deck: "fitinha",
    number: 15,
    text: "Você bancou a feijoada do bloco. Pague $25 a cada jogador.",
    effect: { type: "pay_each", amount: 25 },
    keepable: false,
  },
  {
    id: "fitinha-16",
    deck: "fitinha",
    number: 16,
    text: "Seu investimento no dendê rendeu bem. Receba $150.",
    effect: { type: "collect_bank", amount: 150 },
    keepable: false,
  },
] as const;

export const BENCA_CARDS: readonly CardDef[] = [
  {
    id: "benca-01",
    deck: "benca",
    number: 1,
    text: "Avance até a Chegada (Aeroporto de Salvador). Receba $200.",
    effect: { type: "advance_to", spaceIndex: 0, collectGo: true },
    keepable: false,
  },
  {
    id: "benca-02",
    deck: "benca",
    number: 2,
    text: "Erro do banco a seu favor. Receba $200.",
    effect: { type: "collect_bank", amount: 200 },
    keepable: false,
  },
  {
    id: "benca-03",
    deck: "benca",
    number: 3,
    text: "Consulta com o médico. Pague $50.",
    effect: { type: "pay_bank", amount: 50 },
    keepable: false,
  },
  {
    id: "benca-04",
    deck: "benca",
    number: 4,
    text: "Você vendeu acarajé na Barra e fez sucesso. Receba $50.",
    effect: { type: "collect_bank", amount: 50 },
    keepable: false,
  },
  {
    id: "benca-05",
    deck: "benca",
    number: 5,
    text: "PROTEÇÃO DO SENHOR DO BONFIM: guarde esta carta para sair do Forte sem pagar.",
    effect: { type: "keep", kind: "protecao_bonfim" },
    keepable: true,
  },
  {
    id: "benca-06",
    deck: "benca",
    number: 6,
    text: "Vá direto para o Forte de São Marcelo. Não passe pela Chegada e não receba $200.",
    effect: { type: "go_to_jail" },
    keepable: false,
  },
  {
    id: "benca-07",
    deck: "benca",
    number: 7,
    text: "É seu aniversário! Receba $10 de cada jogador.",
    effect: { type: "collect_from_each", amount: 10 },
    keepable: false,
  },
  {
    id: "benca-08",
    deck: "benca",
    number: 8,
    text: "Restituição do imposto de renda. Receba $20.",
    effect: { type: "collect_bank", amount: 20 },
    keepable: false,
  },
  {
    id: "benca-09",
    deck: "benca",
    number: 9,
    text: "Você herdou uma casa no Recôncavo. Receba $100.",
    effect: { type: "collect_bank", amount: 100 },
    keepable: false,
  },
  {
    id: "benca-10",
    deck: "benca",
    number: 10,
    text: "Contas do hospital. Pague $100.",
    effect: { type: "pay_bank", amount: 100 },
    keepable: false,
  },
  {
    id: "benca-11",
    deck: "benca",
    number: 11,
    text: "Mensalidade da escola. Pague $50.",
    effect: { type: "pay_bank", amount: 50 },
    keepable: false,
  },
  {
    id: "benca-12",
    deck: "benca",
    number: 12,
    text: "Sua avó mandou uma ajuda para o mês. Receba $25.",
    effect: { type: "collect_bank", amount: 25 },
    keepable: false,
  },
  {
    id: "benca-13",
    deck: "benca",
    number: 13,
    text: "Reparos nas ruas do bairro: pague $40 por pousada e $115 por resort.",
    effect: { type: "pay_per_building", perPousada: 40, perResort: 115 },
    keepable: false,
  },
  {
    id: "benca-14",
    deck: "benca",
    number: 14,
    text: "Seu abadá foi eleito o mais bonito do bloco. Receba $10.",
    effect: { type: "collect_bank", amount: 10 },
    keepable: false,
  },
  {
    id: "benca-15",
    deck: "benca",
    number: 15,
    text: "Almoço de domingo para a família toda. Pague $30.",
    effect: { type: "pay_bank", amount: 30 },
    keepable: false,
  },
  {
    id: "benca-16",
    deck: "benca",
    number: 16,
    text: "Os festejos de São João renderam um bom lucro. Receba $100.",
    effect: { type: "collect_bank", amount: 100 },
    keepable: false,
  },
] as const;

export const ALL_CARDS: readonly CardDef[] = [
  ...FITINHA_CARDS,
  ...BENCA_CARDS,
];

const CARD_BY_ID: ReadonlyMap<CardId, CardDef> = new Map(
  ALL_CARDS.map((c) => [c.id, c]),
);

export function getCard(id: CardId): CardDef {
  const card = CARD_BY_ID.get(id);
  if (!card) throw new Error(`Carta inválida: ${id}`);
  return card;
}

export function cardsForDeck(deck: DeckId): readonly CardDef[] {
  return deck === "fitinha" ? FITINHA_CARDS : BENCA_CARDS;
}

export function deckIdFromSpaceKind(
  kind: string,
): DeckId | null {
  if (kind === "fitinha") return "fitinha";
  if (kind === "benca") return "benca";
  return null;
}

export function nearestAhead(
  from: number,
  targets: readonly number[],
  boardSize = 40,
): number {
  let best = targets[0]!;
  let bestDist = Infinity;
  for (const t of targets) {
    const dist = (t - from + boardSize) % boardSize;
    const step = dist === 0 ? boardSize : dist;
    if (step < bestDist) {
      bestDist = step;
      best = t;
    }
  }
  return best;
}

export type DeckState = {
  drawPile: CardId[];
  discardPile: CardId[];
};

export type DecksState = Record<DeckId, DeckState>;

function shuffleInPlace<T>(items: T[], rng: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
}

export function createDecks(rng: () => number = Math.random): DecksState {
  const fitinha = FITINHA_CARDS.map((c) => c.id);
  const benca = BENCA_CARDS.map((c) => c.id);
  shuffleInPlace(fitinha, rng);
  shuffleInPlace(benca, rng);
  return {
    fitinha: { drawPile: fitinha, discardPile: [] },
    benca: { drawPile: benca, discardPile: [] },
  };
}

function reshuffleDiscard(deck: DeckState, rng: () => number): DeckState {
  if (deck.drawPile.length > 0) return deck;
  const drawPile = [...deck.discardPile];
  shuffleInPlace(drawPile, rng);
  return { drawPile, discardPile: [] };
}

export type DrawResult = {
  card: CardDef;
  decks: DecksState;
};

export function drawCard(
  decks: DecksState,
  deckId: DeckId,
  rng: () => number = Math.random,
): DrawResult {
  let pile = decks[deckId];
  pile = reshuffleDiscard(pile, rng);
  if (pile.drawPile.length === 0) {
    throw new Error(`Baralho ${deckId} vazio (todas as cartas em mãos?)`);
  }
  const [id, ...rest] = pile.drawPile;
  const card = getCard(id!);
  return {
    card,
    decks: {
      ...decks,
      [deckId]: { drawPile: rest, discardPile: pile.discardPile },
    },
  };
}

export function discardCard(decks: DecksState, cardId: CardId): DecksState {
  const card = getCard(cardId);
  const pile = decks[card.deck];
  return {
    ...decks,
    [card.deck]: {
      drawPile: pile.drawPile.filter((id) => id !== cardId),
      discardPile: [...pile.discardPile, cardId],
    },
  };
}

export function returnCardToBottom(
  decks: DecksState,
  cardId: CardId,
): DecksState {
  const card = getCard(cardId);
  const pile = decks[card.deck];
  return {
    ...decks,
    [card.deck]: {
      drawPile: [
        ...pile.drawPile.filter((id) => id !== cardId),
        cardId,
      ],
      discardPile: pile.discardPile.filter((id) => id !== cardId),
    },
  };
}

export function deckCounts(deck: DeckState): {
  draw: number;
  discard: number;
} {
  return { draw: deck.drawPile.length, discard: deck.discardPile.length };
}

if (FITINHA_CARDS.length !== 16) {
  throw new Error(`Fitinha deve ter 16 cartas, tem ${FITINHA_CARDS.length}`);
}
if (BENCA_CARDS.length !== 16) {
  throw new Error(`Bença deve ter 16 cartas, tem ${BENCA_CARDS.length}`);
}
