import { Suspense, useLayoutEffect, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";
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

function GhostPulse({ children }: { children: ReactNode }) {
  const root = useRef<Group>(null);

  useLayoutEffect(() => {
    const g = root.current;
    if (!g) return;
    g.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as MeshStandardMaterial;
        if (!m) continue;
        m.transparent = true;
        m.depthWrite = false;
      }
    });
  }, []);

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const pulse = 0.55 + Math.sin(performance.now() * 0.004) * 0.25;
    g.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as MeshStandardMaterial;
        if (m && "opacity" in m) m.opacity = pulse;
      }
    });
  });

  return <group ref={root}>{children}</group>;
}

export function PawnVisual({ pawnId, targetHeight }: Props) {
  const model = getPawnModel(pawnId);
  const mesh = (
    <Suspense fallback={<PawnFallback />}>
      <BlockyPawnMesh
        url={model.url}
        targetHeight={targetHeight ?? model.targetHeight}
        maxSpan={model.maxSpan}
      />
    </Suspense>
  );
  if (pawnId === "shipGhost") return <GhostPulse>{mesh}</GhostPulse>;
  return mesh;
}
