import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import { Vector3, type Group, type Object3D } from "three";
import { getGraphicsQuality } from "../scene/graphicsQuality";

type Tickable = Object3D & {
  userData: { tick?: (dt: number) => void };
};

const _world = new Vector3();

export function useLandmarkFrame(
  wrapRef: RefObject<Group | null>,
  builtRef: RefObject<Tickable | null>,
  accent: boolean,
) {
  const { camera } = useThree();
  const farAccum = useRef(0);

  useFrame((_, dt) => {
    const g = wrapRef.current;
    if (g) {
      const target = accent ? 1.04 : 1;
      const k = Math.min(1, dt * 6);
      if (Math.abs(g.scale.x - target) > 0.001) {
        g.scale.x += (target - g.scale.x) * k;
        g.scale.y = g.scale.x;
        g.scale.z = g.scale.x;
      } else if (g.scale.x !== target) {
        g.scale.setScalar(target);
      }
    }

    const built = builtRef.current;
    const tick = built?.userData.tick;
    if (!tick) return;

    if (typeof document !== "undefined" && document.hidden) return;

    const q = getGraphicsQuality();
    if (g) {
      g.getWorldPosition(_world);
      const dist = camera.position.distanceTo(_world);
      if (dist > q.landmarkTickHardMaxDist) return;
      if (dist > q.landmarkTickMaxDist) {
        farAccum.current += dt;
        if (farAccum.current < 0.1) return;
        farAccum.current = 0;
      } else {
        farAccum.current = 0;
      }
    }

    tick(Math.min(dt, 0.05));
  });
}
