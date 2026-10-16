import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Box3, Matrix4, Vector3, type Group, type Mesh, type Object3D } from "three";

type Props = {
  fitWidth: number;
  fitDepth?: number;
  children: ReactNode;
};

export function FitToSlot({ fitWidth, fitDepth, children }: Props) {
  const root = useRef<Group>(null);

  useLayoutEffect(() => {
    const object = root.current;
    if (!object) return;
    fitToSlot(object, fitWidth, fitDepth);
  }, [fitWidth, fitDepth, children]);

  return <group ref={root}>{children}</group>;
}

function localBoundingBox(object: Object3D): Box3 {
  object.updateMatrixWorld(true);
  const inv = new Matrix4().copy(object.matrixWorld).invert();
  const box = new Box3();
  const temp = new Box3();

  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const geo = mesh.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    if (!geo.boundingBox) return;
    temp.copy(geo.boundingBox);
    temp.applyMatrix4(mesh.matrixWorld);
    temp.applyMatrix4(inv);
    box.union(temp);
  });

  return box;
}

export function fitToSlot(object: Object3D, fitWidth: number, fitDepth?: number) {
  object.position.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  object.updateMatrixWorld(true);

  const box = localBoundingBox(object);
  if (box.isEmpty()) return;

  const size = new Vector3();
  box.getSize(size);
  const modelWidth = Math.max(size.x, 1e-3);

  let scale = fitWidth / modelWidth;
  object.scale.setScalar(scale);
  object.updateMatrixWorld(true);

  if (fitDepth != null) {
    const after = localBoundingBox(object);
    after.getSize(size);
    const modelDepth = Math.max(size.z, 1e-3);
    if (modelDepth > fitDepth) {
      scale *= fitDepth / modelDepth;
      object.scale.setScalar(scale);
      object.updateMatrixWorld(true);
    }
  }

  const fitted = localBoundingBox(object);
  const center = new Vector3();
  fitted.getCenter(center);
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= fitted.min.y;
  object.updateMatrixWorld(true);
}
