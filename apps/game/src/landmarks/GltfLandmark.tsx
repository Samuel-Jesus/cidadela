import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Clone, useGLTF } from "@react-three/drei";
import {
  Box3,
  Color,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
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

    root.traverse((child) => {
      child.frustumCulled = false;
      const mesh = child as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
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
    const k = Math.min(1, dt * 6);
    g.scale.x += (target - g.scale.x) * k;
    g.scale.y = g.scale.x;
    g.scale.z = g.scale.x;
  });

  return (
    <group ref={wrap}>
      <pointLight
        position={[0.4, 1.2, 0.5]}
        intensity={accent ? 0.55 : 0.3}
        distance={3.5}
        color="#fff1dd"
      />
      <group ref={model}>
        <Clone object={source} castShadow receiveShadow />
      </group>
    </group>
  );
}

function fitOnTile(object: Object3D, targetHeight: number, maxFootprint: number) {
  object.updateMatrixWorld(true);
  const box = new Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const size = new Vector3();
  box.getSize(size);
  const height = Math.max(size.y, 1e-3);

  let scale = targetHeight / height;
  object.scale.setScalar(scale);
  object.updateMatrixWorld(true);

  const after = new Box3().setFromObject(object);
  after.getSize(size);
  const footprint = Math.max(size.x, size.z, 1e-3);
  if (footprint > maxFootprint) {
    scale *= maxFootprint / footprint;
    object.scale.setScalar(scale);
    object.updateMatrixWorld(true);
  }

  const fitted = new Box3().setFromObject(object);
  const center = new Vector3();
  fitted.getCenter(center);
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= fitted.min.y;
  object.updateMatrixWorld(true);
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
  { url: "/models/forte-sao-marcelo.gltf", label: "Forte São Marcelo" },
  { url: "/models/farol-da-barra.gltf", label: "Farol da Barra" },
  { url: "/models/hidrometro.gltf", label: "Hidrômetro" },
] as const;

export function preloadLandmarkModels() {
  for (const m of LANDMARK_MODELS) useGLTF.preload(m.url);
}
