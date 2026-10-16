/** Peões disponíveis (2–8 jogadores). */

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

export type PlayerState = {
  id: string;
  pawnId: PawnId;
  position: number;
};

export function createPlayers(count: number): PlayerState[] {
  const n = Math.min(8, Math.max(2, count));
  return PAWNS.slice(0, n).map((pawn, i) => ({
    id: `player-${i + 1}`,
    pawnId: pawn.id,
    position: 0,
  }));
}

export function getPawnDef(pawnId: PawnId): PawnDef {
  const found = PAWNS.find((p) => p.id === pawnId);
  if (!found) throw new Error(`Peão inválido: ${pawnId}`);
  return found;
}
