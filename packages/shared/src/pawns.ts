import { getSpace } from "./board";

export type PawnId =
  | "acaraje"
  | "fitinha"
  | "farol"
  | "tambor"
  | "coco"
  | "barco"
  | "sol"
  | "concha";

export type PawnDef = {
  id: PawnId;
  label: string;
  color: string;
  accent: string;
};

export const PAWNS: readonly PawnDef[] = [
  { id: "acaraje", label: "Acarajé", color: "#e67e22", accent: "#6e2c00" },
  { id: "fitinha", label: "Fitinha", color: "#e74c3c", accent: "#f1c40f" },
  { id: "farol", label: "Farol", color: "#ecf0f1", accent: "#c0392b" },
  { id: "tambor", label: "Tambor", color: "#8e44ad", accent: "#f39c12" },
  { id: "coco", label: "Coco", color: "#27ae60", accent: "#f5f5dc" },
  { id: "barco", label: "Barco", color: "#2980b9", accent: "#85c1e9" },
  { id: "sol", label: "Sol", color: "#f1c40f", accent: "#e67e22" },
  { id: "concha", label: "Concha", color: "#e91e63", accent: "#fadbd8" },
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
  position: number;
  cash: number;
  properties: PropertyHolding[];
  getOutOfJailCards: number;
  inJail: boolean;
};

export function createPlayers(count: number): PlayerState[] {
  const n = Math.min(8, Math.max(2, count));
  return PAWNS.slice(0, n).map((pawn, i) => ({
    id: `player-${i + 1}`,
    pawnId: pawn.id,
    position: 0,
    cash: STARTING_CASH,
    properties: [],
    getOutOfJailCards: 0,
    inJail: false,
  }));
}

export function getPawnDef(pawnId: PawnId): PawnDef {
  const found = PAWNS.find((p) => p.id === pawnId);
  if (!found) throw new Error(`Peão inválido: ${pawnId}`);
  return found;
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
