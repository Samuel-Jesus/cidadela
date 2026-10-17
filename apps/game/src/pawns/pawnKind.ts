import type { PawnId } from "@cidadela/shared";

export type PawnKind = "kart" | "ship";

export function getPawnKind(pawnId: PawnId): PawnKind {
  return pawnId.startsWith("ship") ? "ship" : "kart";
}

export function stepDurationFor(kind: PawnKind): number {
  return kind === "kart" ? 0.34 : 0.48;
}

export function yawFollowFor(kind: PawnKind): number {
  return kind === "kart" ? 7 : 3.5;
}
