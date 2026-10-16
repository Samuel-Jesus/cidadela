import { Suspense } from "react";
import type { PawnId } from "@cidadela/shared";
import { BlockyPawnMesh } from "./BlockyPawnMesh";
import { getPawnModel } from "./pawnModels";

type Props = {
  pawnId: PawnId;
  targetHeight?: number;
};

function PawnFallback() {
  return (
    <mesh castShadow position={[0, 0.2, 0]}>
      <boxGeometry args={[0.3, 0.4, 0.3]} />
      <meshStandardMaterial color="#94a3b8" roughness={0.7} />
    </mesh>
  );
}

export function PawnVisual({ pawnId, targetHeight }: Props) {
  const model = getPawnModel(pawnId);
  return (
    <Suspense fallback={<PawnFallback />}>
      <BlockyPawnMesh
        url={model.url}
        targetHeight={targetHeight ?? model.targetHeight}
        maxSpan={model.maxSpan}
      />
    </Suspense>
  );
}
