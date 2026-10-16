import { useGLTF } from "@react-three/drei";
import type { PawnId } from "@cidadela/shared";

export type PawnModelFit = {
  url: string;
  targetHeight: number;
  maxSpan?: number;
};

const KART_FIT = { targetHeight: 0.42, maxSpan: 0.7 } as const;
const SHIP_FIT = { targetHeight: 0.48, maxSpan: 0.78 } as const;

export const PAWN_MODELS: Record<PawnId, PawnModelFit> = {
  oobi: { url: "/models/pawns/karts/kart-oobi.glb", ...KART_FIT },
  oodi: { url: "/models/pawns/karts/kart-oodi.glb", ...KART_FIT },
  ooli: { url: "/models/pawns/karts/kart-ooli.glb", ...KART_FIT },
  oopi: { url: "/models/pawns/karts/kart-oopi.glb", ...KART_FIT },
  oozi: { url: "/models/pawns/karts/kart-oozi.glb", ...KART_FIT },
  shipGhost: { url: "/models/pawns/ships/ship-ghost.glb", ...SHIP_FIT },
  shipLarge: { url: "/models/pawns/ships/ship-large.glb", ...SHIP_FIT },
  shipMedium: { url: "/models/pawns/ships/ship-medium.glb", ...SHIP_FIT },
  shipPirateLarge: {
    url: "/models/pawns/ships/ship-pirate-large.glb",
    ...SHIP_FIT,
  },
  shipPirateMedium: {
    url: "/models/pawns/ships/ship-pirate-medium.glb",
    ...SHIP_FIT,
  },
  shipPirateSmall: {
    url: "/models/pawns/ships/ship-pirate-small.glb",
    ...SHIP_FIT,
  },
  shipSmall: { url: "/models/pawns/ships/ship-small.glb", ...SHIP_FIT },
  shipWreck: { url: "/models/pawns/ships/ship-wreck.glb", ...SHIP_FIT },
};

export const PAWN_MODEL_LIST = Object.entries(PAWN_MODELS).map(([id, fit]) => ({
  id: id as PawnId,
  url: fit.url,
  label: id,
}));

export function getPawnModel(pawnId: PawnId): PawnModelFit {
  return PAWN_MODELS[pawnId];
}

export function preloadPawnModels() {
  for (const fit of Object.values(PAWN_MODELS)) {
    useGLTF.preload(fit.url);
  }
}
