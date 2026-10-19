import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Clone, useGLTF } from "@react-three/drei";
import {
  Color,
  MeshStandardMaterial,
  type Group,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
import { getGraphicsQuality } from "../scene/graphicsQuality";
import { fitToSlot, hideOversizedMeshes } from "./FitToSlot";

type Props = {
  url: string;
  fitWidth?: number;
  fitDepth?: number;
  fitIncludesPads?: boolean;
  hideFootprintAbove?: number;
  targetHeight?: number;
  maxFootprint?: number;
  rotationY?: number;
  polish?: boolean;
  accent?: boolean;
};

export function GltfLandmark({
  url,
  fitWidth,
  fitDepth,
  fitIncludesPads = false,
  hideFootprintAbove,
  targetHeight = 1.35,
  maxFootprint = 2.4,
  rotationY = 0,
  polish = true,
  accent = false,
}: Props) {
  const { scene } = useGLTF(url);
  const wrap = useRef<Group>(null);
  const model = useRef<Group>(null);
  const source = useMemo(() => scene, [scene]);

  useLayoutEffect(() => {
    const root = model.current;
    if (!root) return;

    root.position.set(0, 0, 0);
    root.rotation.set(0, rotationY, 0);
    root.scale.set(1, 1, 1);
    root.updateMatrixWorld(true);

    if (polish) polishMaterials(root);

    const shadows = getGraphicsQuality().shadows;
    root.traverse((child) => {
      child.frustumCulled = true;
      const mesh = child as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = shadows;
        mesh.receiveShadow = shadows;
      }
    });

    if (hideFootprintAbove != null) hideOversizedMeshes(root, hideFootprintAbove);

    if (fitWidth != null) {
      fitToSlot(root, fitWidth, fitDepth, !fitIncludesPads);
    } else {
      fitOnTile(root, targetHeight, maxFootprint);
    }
  }, [
    source,
    fitWidth,
    fitDepth,
    fitIncludesPads,
    hideFootprintAbove,
    targetHeight,
    maxFootprint,
    rotationY,
    polish,
  ]);

  useFrame((_, dt) => {
    const g = wrap.current;
    if (!g) return;
    const target = accent ? 1.04 : 1;
    if (Math.abs(g.scale.x - target) < 0.001) {
      if (g.scale.x !== target) g.scale.setScalar(target);
      return;
    }
    const k = Math.min(1, dt * 6);
    g.scale.x += (target - g.scale.x) * k;
    g.scale.y = g.scale.x;
    g.scale.z = g.scale.x;
  });

  const shadowsOn = getGraphicsQuality().shadows;

  return (
    <group ref={wrap}>
      {shadowsOn || accent ? (
        <pointLight
          position={[0.4, 1.2, 0.5]}
          intensity={accent ? 0.55 : 0.22}
          distance={3.5}
          color="#fff1dd"
        />
      ) : null}
      <group ref={model}>
        <Clone
          object={source}
          castShadow={shadowsOn}
          receiveShadow={shadowsOn}
        />
      </group>
    </group>
  );
}

function fitOnTile(object: Object3D, targetHeight: number, maxFootprint: number) {
  void targetHeight;
  fitToSlot(object, maxFootprint, maxFootprint);
}

function polishMaterials(object: Object3D) {
  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;

    const apply = (mat: Material): Material => {
      const std = mat as MeshStandardMaterial;
      if (!std.isMeshStandardMaterial) return mat;

      const cloned = std.clone();
      cloned.roughness = Math.min(0.9, Math.max(0.4, cloned.roughness ?? 0.75));
      cloned.metalness = Math.min(0.35, cloned.metalness ?? 0);
      cloned.envMapIntensity = 0.7;
      if (cloned.transparent && (cloned.opacity ?? 1) < 0.05) {
        cloned.opacity = 1;
        cloned.transparent = false;
      }
      if (cloned.color) {
        cloned.color = cloned.color.clone().lerp(new Color("#ffffff"), 0.03);
      }
      cloned.needsUpdate = true;
      return cloned;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(apply);
    } else if (mesh.material) {
      mesh.material = apply(mesh.material);
    }
  });
}

export const LANDMARK_MODELS = [
  { url: "/models/elevador-lacerda.gltf", label: "Elevador Lacerda" },
] as const;

export function preloadLandmarkModels() {
  for (const m of LANDMARK_MODELS) useGLTF.preload(m.url);
}
