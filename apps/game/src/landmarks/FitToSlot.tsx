import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Box3, Matrix4, Vector3, type Group, type Mesh, type Object3D } from "three";
import { FLOOR_LIFT } from "../scene/layout";

type Props = {
  fitWidth: number;
  fitDepth?: number;
  children: ReactNode;
};

type PadInfo = {
  footprint: number;
  top: number;
  bottom: number;
  height: number;
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

function isFloorPad(size: Vector3): boolean {
  const footprint = Math.max(size.x, size.z);
  if (footprint < 0.08) return false;
  if (footprint > 10) return true;
  const slim = size.y / footprint;
  if (size.y <= 0.8 && slim < 0.2) return true;
  if (size.y <= 2.2 && footprint > 5 && slim < 0.35) return true;
  return false;
}

function isWaterPad(pad: PadInfo): boolean {
  return (
    pad.footprint > 8 &&
    pad.height >= 0.8 &&
    pad.top <= 0.05 &&
    pad.bottom < -0.35
  );
}

function eachMesh(
  object: Object3D,
  fn: (mesh: Mesh, localBox: Box3, size: Vector3) => void,
) {
  object.updateMatrixWorld(true);
  const inv = object.parent
    ? new Matrix4().copy(object.parent.matrixWorld).invert()
    : new Matrix4();
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
    temp.getSize(size);
    fn(mesh, temp, size);
  });
}

function collectPads(object: Object3D): PadInfo[] {
  const pads: PadInfo[] = [];
  eachMesh(object, (_mesh, temp, size) => {
    if (!isFloorPad(size)) return;
    pads.push({
      footprint: Math.max(size.x, size.z),
      top: temp.max.y,
      bottom: temp.min.y,
      height: size.y,
    });
  });
  return pads;
}

function localBoundingBox(
  object: Object3D,
  opts: { excludePads?: boolean; excludeWater?: boolean } = {},
): Box3 {
  const box = new Box3();
  eachMesh(object, (_mesh, temp, size) => {
    if (opts.excludePads && isFloorPad(size)) return;
    if (opts.excludeWater) {
      const pad: PadInfo = {
        footprint: Math.max(size.x, size.z),
        top: temp.max.y,
        bottom: temp.min.y,
        height: size.y,
      };
      if (isFloorPad(size) && isWaterPad(pad)) return;
    }
    box.union(temp);
  });
  return box;
}

export function hideOversizedMeshes(object: Object3D, maxFootprint: number) {
  eachMesh(object, (mesh, _temp, size) => {
    if (Math.max(size.x, size.z) > maxFootprint) mesh.visible = false;
  });
}

/**
 * Topo do piso jogável/temático: entre os pads grandes de terra,
 * usa o mais baixo (terreno base), ignorando água e plataformas altas.
 */
export function primaryFloorSurfaceY(object: Object3D): number | null {
  const pads = collectPads(object);
  const land = pads.filter((p) => !isWaterPad(p));
  const pool = land.length > 0 ? land : pads;
  if (pool.length === 0) return null;

  const maxFp = Math.max(...pool.map((p) => p.footprint));
  const main = pool.filter((p) => p.footprint >= maxFp * 0.55);
  if (main.length === 0) return null;

  return Math.min(...main.map((p) => p.top));
}

function contentMinY(object: Object3D): number | null {
  let min = Infinity;
  eachMesh(object, (_mesh, temp, size) => {
    if (isFloorPad(size)) return;
    min = Math.min(min, temp.min.y);
  });
  return min < Infinity ? min : null;
}

function absoluteMinY(object: Object3D): number | null {
  let min = Infinity;
  eachMesh(object, (_mesh, temp) => {
    min = Math.min(min, temp.min.y);
  });
  return min < Infinity ? min : null;
}

function surfaceY(object: Object3D): number | null {
  return (
    primaryFloorSurfaceY(object) ??
    contentMinY(object) ??
    absoluteMinY(object)
  );
}

export function fitToSlot(
  object: Object3D,
  fitWidth: number,
  fitDepth?: number,
  _includePadsForScale = false,
) {
  object.position.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  object.updateMatrixWorld(true);

  const measure = () => {
    let box = localBoundingBox(object, { excludeWater: true });
    if (box.isEmpty()) box = localBoundingBox(object, {});
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
  if (fitted.isEmpty()) return;

  const center = new Vector3();
  fitted.getCenter(center);
  object.position.x -= center.x;
  object.position.z -= center.z;

  const y = surfaceY(object);
  if (y != null) object.position.y += FLOOR_LIFT - y;
  object.updateMatrixWorld(true);
}

export function groundObjectToSurface(object: Object3D) {
  object.updateMatrixWorld(true);
  const y = surfaceY(object);
  if (y == null) return;
  object.position.y += FLOOR_LIFT - y;
  object.updateMatrixWorld(true);
}
