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

function localBoundingBox(object: Object3D, excludePads: boolean): Box3 {
  object.updateMatrixWorld(true);
  const inv = object.parent
    ? new Matrix4().copy(object.parent.matrixWorld).invert()
    : new Matrix4();
  const box = new Box3();
  const temp = new Box3();
  const size = new Vector3();

  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || !mesh.geometry || !mesh.visible) return;
    const geo = mesh.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    if (!geo.boundingBox) return;
    temp.copy(geo.boundingBox);
    temp.applyMatrix4(mesh.matrixWorld);
    temp.applyMatrix4(inv);
    if (excludePads) {
      temp.getSize(size);
      const footprint = Math.max(size.x, size.z);
      if (footprint > 0.05 && (size.y / footprint < 0.1 || footprint > 12)) return;
    }
    box.union(temp);
  });

  return box;
}

export function hideOversizedMeshes(object: Object3D, maxFootprint: number) {
  object.updateMatrixWorld(true);
  const inv = new Matrix4().copy(object.matrixWorld).invert();
  const temp = new Box3();
  const size = new Vector3();

  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const geo = mesh.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    if (!geo.boundingBox) return;
    temp.copy(geo.boundingBox);
    temp.applyMatrix4(mesh.matrixWorld);
    temp.applyMatrix4(inv);
    temp.getSize(size);
    if (Math.max(size.x, size.z) > maxFootprint) mesh.visible = false;
  });
}

export function fitToSlot(
  object: Object3D,
  fitWidth: number,
  fitDepth?: number,
  excludePads = true,
) {
  object.position.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  object.updateMatrixWorld(true);

  const measure = () => {
    let box = localBoundingBox(object, excludePads);
    if (box.isEmpty() && excludePads) box = localBoundingBox(object, false);
    return box;
  };

  const box = measure();
  if (box.isEmpty()) return;

  const size = new Vector3();
  box.getSize(size);
  const modelWidth = Math.max(size.x, size.z, 1e-3);

  let scale = fitWidth / modelWidth;
  object.scale.setScalar(scale);
  object.updateMatrixWorld(true);

  if (fitDepth != null) {
    measure().getSize(size);
    const modelDepth = Math.max(size.z, size.x, 1e-3);
    if (modelDepth > fitDepth) {
      scale *= fitDepth / modelDepth;
      object.scale.setScalar(scale);
      object.updateMatrixWorld(true);
    }
  }

  const fitted = measure();
  const center = new Vector3();
  fitted.getCenter(center);
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= fitted.min.y;
  object.updateMatrixWorld(true);
}
