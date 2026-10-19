import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { getPawnCameraPose } from "./pawnCameraPose";

export type CameraMode = "orbit" | "follow";

const LOOK_SENS = 0.0042;
const ZOOM_SENS = 0.002;
const DIST_DEFAULT = 2.85;
const DIST_MIN = 1.55;
const DIST_MAX = 6.8;
const PITCH_DEFAULT = 0.48;
const PITCH_MIN = 0.22;
const PITCH_MAX = 1.12;
const LOOK_AHEAD = 0.55;
const LOOK_Y = 0.55;
const YAW_RECENTER = 2.2;

type Props = {
  mode: CameraMode;
  followPlayerId: string | null;
};

export function BoardCamera({ mode, followPlayerId }: Props) {
  const { camera, gl } = useThree();
  const orbitYaw = useRef(0);
  const orbitPitch = useRef(PITCH_DEFAULT);
  const distance = useRef(DIST_DEFAULT);
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const smoothPos = useRef(new Vector3(18, 16, 18));
  const smoothTarget = useRef(new Vector3(0, 0.5, 0));
  const ready = useRef(false);
  const desiredPos = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());

  useEffect(() => {
    if (mode !== "follow") {
      orbitYaw.current = 0;
      orbitPitch.current = PITCH_DEFAULT;
      distance.current = DIST_DEFAULT;
      ready.current = false;
      return;
    }
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
      dragging.current = false;
      last.current = null;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !last.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      orbitYaw.current -= dx * LOOK_SENS;
      orbitPitch.current = MathUtils.clamp(
        orbitPitch.current + dy * LOOK_SENS,
        PITCH_MIN,
        PITCH_MAX,
      );
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance.current = MathUtils.clamp(
        distance.current + e.deltaY * ZOOM_SENS,
        DIST_MIN,
        DIST_MAX,
      );
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("wheel", onWheel);
    };
  }, [mode, gl]);

  useFrame((_, dt) => {
    if (mode !== "follow" || !followPlayerId) return;
    const pose = getPawnCameraPose();
    if (!pose || pose.playerId !== followPlayerId) return;

    const clampedDt = Math.min(dt, 0.05);

    if (!dragging.current) {
      orbitYaw.current = MathUtils.damp(
        orbitYaw.current,
        0,
        YAW_RECENTER,
        clampedDt,
      );
    }

    const yaw = pose.yaw + orbitYaw.current;
    const pitch = orbitPitch.current;
    const dist = distance.current;
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    desiredPos.current.set(
      pose.x - Math.sin(yaw) * cosP * dist,
      pose.y + sinP * dist + 0.2,
      pose.z - Math.cos(yaw) * cosP * dist,
    );

    desiredTarget.current.set(
      pose.x + Math.sin(yaw) * LOOK_AHEAD,
      pose.y + LOOK_Y,
      pose.z + Math.cos(yaw) * LOOK_AHEAD,
    );

    if (!ready.current) {
      smoothPos.current.copy(desiredPos.current);
      smoothTarget.current.copy(desiredTarget.current);
      ready.current = true;
    } else {
      const distErr = smoothPos.current.distanceTo(desiredPos.current);
      const posLambda = distErr > 3 ? 11 : distErr > 1.2 ? 8 : 6.2;
      const tLambda = dragging.current ? 14 : 9;

      smoothPos.current.x = MathUtils.damp(
        smoothPos.current.x,
        desiredPos.current.x,
        posLambda,
        clampedDt,
      );
      smoothPos.current.y = MathUtils.damp(
        smoothPos.current.y,
        desiredPos.current.y,
        posLambda,
        clampedDt,
      );
      smoothPos.current.z = MathUtils.damp(
        smoothPos.current.z,
        desiredPos.current.z,
        posLambda,
        clampedDt,
      );
      smoothTarget.current.x = MathUtils.damp(
        smoothTarget.current.x,
        desiredTarget.current.x,
        tLambda,
        clampedDt,
      );
      smoothTarget.current.y = MathUtils.damp(
        smoothTarget.current.y,
        desiredTarget.current.y,
        tLambda,
        clampedDt,
      );
      smoothTarget.current.z = MathUtils.damp(
        smoothTarget.current.z,
        desiredTarget.current.z,
        tLambda,
        clampedDt,
      );
    }

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothTarget.current);
  });

  if (mode === "orbit") {
    return (
      <OrbitControls
        makeDefault
        target={[0, 0.45, 0]}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.01}
        minDistance={4}
        maxDistance={75}
        enablePan
        screenSpacePanning
        panSpeed={1}
        rotateSpeed={0.92}
        zoomSpeed={1.15}
        enableDamping
        dampingFactor={0.065}
      />
    );
  }

  return null;
}
