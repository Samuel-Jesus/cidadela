import { useLayoutEffect, useMemo, useRef } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group, type Mesh } from "three";

type Props = {
  url: string;
  targetHeight?: number;
  maxSpan?: number;
};

export function BlockyPawnMesh({
  url,
  targetHeight = 0.72,
  maxSpan,
}: Props) {
  const { scene } = useGLTF(url);
  const root = useRef<Group>(null);
  const source = useMemo(() => scene, [scene]);

  useLayoutEffect(() => {
    const g = root.current;
    if (!g) return;

    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    g.scale.set(1, 1, 1);
    g.updateMatrixWorld(true);

    const box = new Box3().setFromObject(g);
    const size = new Vector3();
    box.getSize(size);

    let scale = targetHeight / Math.max(size.y, 1e-3);
    if (maxSpan != null) {
      const span = Math.max(size.x, size.y, size.z, 1e-3);
      scale = Math.min(scale, maxSpan / span);
    }
    g.scale.setScalar(scale);
    g.updateMatrixWorld(true);

    const fitted = new Box3().setFromObject(g);
    g.position.x -= (fitted.min.x + fitted.max.x) / 2;
    g.position.z -= (fitted.min.z + fitted.max.z) / 2;
    g.position.y -= fitted.min.y;
    g.updateMatrixWorld(true);
    const grounded = new Box3().setFromObject(g);
    if (Math.abs(grounded.min.y) > 1e-4) {
      g.position.y -= grounded.min.y;
    }

    g.traverse((child) => {
      child.frustumCulled = true;
      const mesh = child as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [source, targetHeight, maxSpan]);

  return (
    <group ref={root}>
      <Clone object={source} />
    </group>
  );
}
