import { getSpace } from "./board";

export type PawnId =
  | "oobi"
  | "oodi"
  | "ooli"
  | "oopi"
  | "oozi"
  | "shipGhost"
  | "shipLarge"
  | "shipMedium"
  | "shipPirateLarge"
  | "shipPirateMedium"
  | "shipPirateSmall"
  | "shipSmall"
  | "shipWreck";

export type PawnDef = {
  id: PawnId;
  label: string;
  color: string;
  accent: string;
};

export const PAWNS: readonly PawnDef[] = [
  { id: "oobi", label: "Kart Oobi", color: "#a78bfa", accent: "#f97316" },
  { id: "oodi", label: "Kart Oodi", color: "#38bdf8", accent: "#fbbf24" },
  { id: "ooli", label: "Kart Ooli", color: "#4ade80", accent: "#fb7185" },
  { id: "oopi", label: "Kart Oopi", color: "#f472b6", accent: "#22d3ee" },
  { id: "oozi", label: "Kart Oozi", color: "#facc15", accent: "#6366f1" },
  { id: "shipGhost", label: "Nau Fantasma", color: "#94a3b8", accent: "#e2e8f0" },
  { id: "shipLarge", label: "Nau Grande", color: "#92400e", accent: "#fef3c7" },
  { id: "shipMedium", label: "Nau", color: "#a16207", accent: "#fde68a" },
  { id: "shipPirateLarge", label: "Galeão", color: "#1e293b", accent: "#f8fafc" },
  { id: "shipPirateMedium", label: "Corsário", color: "#334155", accent: "#f1f5f9" },
  { id: "shipPirateSmall", label: "Escuna", color: "#78350f", accent: "#e7e5e4" },
  { id: "shipSmall", label: "Barquinho", color: "#0ea5e9", accent: "#bae6fd" },
  { id: "shipWreck", label: "Nauferro", color: "#57534e", accent: "#a8a29e" },
] as const;

export const STARTING_CASH = 1500;

export const GO_BONUS = 200;

export type PropertyHolding = {
  spaceIndex: number;
  mortgaged: boolean;
  pousadas: number;
  hasResort: boolean;
};

export type PlayerState = {
  id: string;
  pawnId: PawnId;
  name: string;
  isBanker: boolean;
  position: number;
  cash: number;
  properties: PropertyHolding[];
  protectionCardIds: string[];
  inJail: boolean;
  jailAttempts: number;
  bankrupt: boolean;
};

export type LobbySeat = {
  name: string;
  pawnId: PawnId;
  playerId?: string;
};

export type LobbySetup = {
  seats: LobbySeat[];
  bankerIndex: number;
};

export function createPlayers(count: number): PlayerState[] {
  const n = Math.min(8, Math.max(2, count));
  return PAWNS.slice(0, n).map((pawn, i) => ({
    id: `player-${i + 1}`,
    pawnId: pawn.id,
    name: pawn.label,
    isBanker: i === 0,
    position: 0,
    cash: STARTING_CASH,
    properties: [],
    protectionCardIds: [],
    inJail: false,
    jailAttempts: 0,
    bankrupt: false,
  }));
}

export function validateLobbySetup(
  setup: LobbySetup,
): { ok: true } | { ok: false; error: string } {
  const { seats, bankerIndex } = setup;
  if (seats.length < 2 || seats.length > 8) {
    return { ok: false, error: "A partida precisa de 2 a 8 jogadores." };
  }
  if (bankerIndex < 0 || bankerIndex >= seats.length) {
    return { ok: false, error: "Escolha um banqueiro válido." };
  }
  const seenPawns = new Set<PawnId>();
  for (let i = 0; i < seats.length; i++) {
    const seat = seats[i]!;
    const name = seat.name.trim();
    if (!name) {
      return { ok: false, error: `Assento ${i + 1}: informe um nome.` };
    }
    if (seenPawns.has(seat.pawnId)) {
      return { ok: false, error: "Cada peão só pode ser escolhido uma vez." };
    }
    seenPawns.add(seat.pawnId);
    if (!PAWNS.some((p) => p.id === seat.pawnId)) {
      return { ok: false, error: `Peão inválido no assento ${i + 1}.` };
    }
  }
  return { ok: true };
}

export function createPlayersFromLobby(setup: LobbySetup): PlayerState[] {
  const check = validateLobbySetup(setup);
  if (!check.ok) {
    throw new Error(check.error);
  }
  return setup.seats.map((seat, i) => ({
    id: seat.playerId?.trim() || `player-${i + 1}`,
    pawnId: seat.pawnId,
    name: seat.name.trim(),
    isBanker: i === setup.bankerIndex,
    position: 0,
    cash: STARTING_CASH,
    properties: [],
    protectionCardIds: [],
    inJail: false,
    jailAttempts: 0,
    bankrupt: false,
  }));
}

export function getPawnDef(pawnId: PawnId): PawnDef {
  const found = PAWNS.find((p) => p.id === pawnId);
  if (!found) throw new Error(`Peão inválido: ${pawnId}`);
  return found;
}

export function getPlayerLabel(player: PlayerState): string {
  const pawnLabel = getPawnDef(player.pawnId).label;
  const name = player.name?.trim() || pawnLabel;
  if (name === pawnLabel) return name;
  return `${name} (${pawnLabel})`;
}

export function formatCash(amount: number): string {
  return `$${amount.toLocaleString("pt-BR")}`;
}

export function findPropertyOwner(
  players: readonly PlayerState[],
  spaceIndex: number,
): PlayerState | null {
  return (
    players.find((p) => p.properties.some((h) => h.spaceIndex === spaceIndex)) ??
    null
  );
}

export function isBuyableKind(kind: string): boolean {
  return kind === "propriedade" || kind === "transporte" || kind === "companhia";
}

export function buyProperty(
  players: readonly PlayerState[],
  playerId: string,
  spaceIndex: number,
): PlayerState[] | null {
  const space = getSpace(spaceIndex);
  if (space.price === undefined || !isBuyableKind(space.kind)) return null;
  if (findPropertyOwner(players, spaceIndex)) return null;

  const buyer = players.find((p) => p.id === playerId);
  if (!buyer || buyer.cash < space.price) return null;

  return players.map((p) => {
    if (p.id !== playerId) return p;
    return {
      ...p,
      cash: p.cash - space.price!,
      properties: [
        ...p.properties,
        {
          spaceIndex,
          mortgaged: false,
          pousadas: 0,
          hasResort: false,
        },
      ],
    };
  });
}
