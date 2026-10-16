import { Suspense } from "react";
import { getPawnDef, type PawnId } from "@cidadela/shared";
import { BlockyPawnMesh } from "./BlockyPawnMesh";
import { getPawnModelUrl } from "./pawnModels";

type Props = {
  pawnId: PawnId;
  targetHeight?: number;
};

function ProceduralPawnMesh({ pawnId }: { pawnId: PawnId }) {
  const def = getPawnDef(pawnId);
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.08, 16]} />
        <meshStandardMaterial color={def.accent} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.1, 0.2, 0.42, 16]} />
        <meshStandardMaterial color={def.color} roughness={0.45} metalness={0.12} />
      </mesh>
      <mesh castShadow position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={def.color} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh castShadow position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={def.accent} roughness={0.35} metalness={0.2} />
      </mesh>
    </group>
  );
}

export function PawnVisual({ pawnId, targetHeight = 0.72 }: Props) {
  const url = getPawnModelUrl(pawnId);
  if (!url) return <ProceduralPawnMesh pawnId={pawnId} />;
  return (
    <Suspense fallback={<ProceduralPawnMesh pawnId={pawnId} />}>
      <BlockyPawnMesh url={url} targetHeight={targetHeight} />
    </Suspense>
  );
}
