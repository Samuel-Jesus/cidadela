import { useGLTF } from "@react-three/drei";
import type { PawnId } from "@cidadela/shared";

export const PAWN_MODELS: Partial<Record<PawnId, string>> = {
  acaraje: "/models/pawns/character-a.glb",
  fitinha: "/models/pawns/character-d.glb",
  farol: "/models/pawns/character-h.glb",
  tambor: "/models/pawns/character-l.glb",
  coco: "/models/pawns/character-q.glb",
};

export const PAWN_MODEL_LIST = Object.entries(PAWN_MODELS).map(([id, url]) => ({
  id: id as PawnId,
  url: url!,
  label: id,
}));

export function getPawnModelUrl(pawnId: PawnId): string | undefined {
  return PAWN_MODELS[pawnId];
}

export function preloadPawnModels() {
  for (const url of Object.values(PAWN_MODELS)) {
    if (url) useGLTF.preload(url);
  }
}
