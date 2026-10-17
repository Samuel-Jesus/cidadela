import { useEffect, useMemo, useRef } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, Quaternion } from "three";
import type { DieFace } from "@cidadela/engine";
import {
  playDiceSfx,
  startDiceMixLoop,
  stopDiceMixLoop,
} from "../../audio/sfx";
import { BOARD_Y } from "../layout";
import {
  DEFAULT_DICE_PARAMS,
  createDiceBoxGeometry,
  createDiceInnerGeometry,
} from "./createDiceGeometry";
import { faceFlatness, quaternionWithFaceUp, readDieFace } from "./readDieFace";

type Props = {
  index: number;
  rolling: boolean;
  rollId: number;
  onFace: (index: number, face: DieFace) => void;
};

const SIZE = 0.42;
const SHAKE_MS = 1100;
const SHAKE_Y = BOARD_Y + 2.95;
const MIN_ROLL_MS = 1600;
const MAX_ROLL_MS = 5500;

function handBase(index: number): { x: number; z: number } {
  return {
    x: index === 0 ? -0.22 : 0.28,
    z: index === 0 ? 0.08 : -0.06,
  };
}

function restPosition(index: number): [number, number, number] {
  const { x, z } = handBase(index);
  return [x, BOARD_Y + 0.32, z];
}

export function PhysicsDie({ index, rolling, rollId, onFace }: Props) {
  const reported = useRef(false);
  const stillFrames = useRef(0);
  const vel = useRef([0, 0, 0]);
  const ang = useRef([0, 0, 0]);
  const quat = useRef(new Quaternion());
  const onFaceRef = useRef(onFace);
  onFaceRef.current = onFace;
  const throwStartedAt = useRef(0);
  const shaking = useRef(false);
  const shakeUntil = useRef(0);
  const shakeStartedAt = useRef(0);
  const phase = useRef(Math.random() * Math.PI * 2);

  const [ref, api] = useBox(() => ({
    mass: 1,
    args: [SIZE, SIZE, SIZE],
    position: restPosition(index),
    allowSleep: true,
    sleepTimeLimit: 0.2,
    linearDamping: 0.12,
    angularDamping: 0.1,
    material: { restitution: 0.45, friction: 0.4 },
  }));

  const geom = useMemo(() => {
    const g = createDiceBoxGeometry(DEFAULT_DICE_PARAMS);
    g.scale(SIZE, SIZE, SIZE);
    return g;
  }, []);
  const inner = useMemo(() => {
    const g = createDiceInnerGeometry(DEFAULT_DICE_PARAMS);
    g.scale(SIZE, SIZE, SIZE);
    return g;
  }, []);
  const outerMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.42,
        metalness: 0.04,
      }),
    [],
  );
  const innerMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.05,
        metalness: 0.9,
        side: 2,
      }),
    [],
  );

  useEffect(() => {
    const uv = api.velocity.subscribe((v) => {
      vel.current = [v[0], v[1], v[2]];
    });
    const ua = api.angularVelocity.subscribe((w) => {
      ang.current = [w[0], w[1], w[2]];
    });
    const uq = api.quaternion.subscribe((q) => {
      quat.current.set(q[0], q[1], q[2], q[3]);
    });
    return () => {
      uv();
      ua();
      uq();
    };
  }, [api]);

  useEffect(() => {
    if (!rolling) {
      shaking.current = false;
      if (index === 0) stopDiceMixLoop();
      return;
    }

    reported.current = false;
    stillFrames.current = 0;
    throwStartedAt.current = 0;
    shaking.current = true;
    const now = performance.now();
    shakeStartedAt.current = now;
    shakeUntil.current = now + SHAKE_MS + index * 50;
    phase.current = Math.random() * Math.PI * 2;

    const { x, z } = handBase(index);
    api.wakeUp?.();
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);
    api.position.set(x, SHAKE_Y, z);
    api.rotation.set(
      Math.PI * 2 * Math.random(),
      Math.PI * 2 * Math.random(),
      Math.PI * 2 * Math.random(),
    );

    if (index === 0) startDiceMixLoop();

    return () => {
      if (index === 0) stopDiceMixLoop();
    };
  }, [rolling, rollId, api, index]);

  const beginThrow = () => {
    if (!shaking.current) return;
    shaking.current = false;
    throwStartedAt.current = performance.now();

    if (index === 0) {
      stopDiceMixLoop();
      playDiceSfx("fall");
    }

    const { x, z } = handBase(index);
    const t =
      ((performance.now() - shakeStartedAt.current) / 1000) * 14 +
      phase.current;
    const handX = x + Math.sin(t) * 0.1;
    const handZ = z + Math.cos(t * 0.9) * 0.08;

    api.wakeUp?.();
    api.position.set(handX, SHAKE_Y + 0.15, handZ);
    api.velocity.set(0, 0, 0);
    api.rotation.set(
      Math.PI * 2 * Math.random(),
      Math.PI * 2 * Math.random(),
      Math.PI * 2 * Math.random(),
    );

    const force = 2.8 + 2.2 * Math.random();
    const side = index === 0 ? 1 : -1;
    api.applyImpulse(
      [
        side * force * 0.35 + (Math.random() - 0.5) * 0.6,
        -force * 1.15,
        (Math.random() - 0.5) * force * 0.75,
      ],
      [0.05 * side, 0, 0.1],
    );
    api.angularVelocity.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 20,
    );
  };

  const settleWithFace = (face: DieFace) => {
    if (reported.current) return;
    reported.current = true;

    const snapped = quaternionWithFaceUp(face);
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);
    api.quaternion.set(snapped.x, snapped.y, snapped.z, snapped.w);

    onFaceRef.current(index, face);
  };

  useFrame(() => {
    if (!rolling || reported.current) return;

    const now = performance.now();

    if (shaking.current) {
      if (now >= shakeUntil.current) {
        beginThrow();
        return;
      }

      const t =
        ((now - shakeStartedAt.current) / 1000) * 14 + phase.current;
      const { x, z } = handBase(index);
      const amp = 0.11;
      const handX = x + Math.sin(t) * amp;
      const handY = SHAKE_Y + Math.sin(t * 1.35 + index) * 0.1;
      const handZ = z + Math.cos(t * 0.95) * amp * 0.85;

      api.position.set(handX, handY, handZ);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(
        Math.sin(t * 1.1 + index) * 9,
        Math.cos(t * 0.85) * 11,
        Math.sin(t * 1.25 + 1) * 8,
      );
      return;
    }

    if (!throwStartedAt.current) return;

    const elapsed = now - throwStartedAt.current;
    const speed = Math.hypot(vel.current[0], vel.current[1], vel.current[2]);
    const spin = Math.hypot(ang.current[0], ang.current[1], ang.current[2]);
    const flat = faceFlatness(quat.current);

    if (elapsed > MAX_ROLL_MS) {
      settleWithFace(readDieFace(quat.current));
      return;
    }

    if (elapsed < MIN_ROLL_MS) return;

    const settled = speed < 0.12 && spin < 0.28 && flat > 0.88;
    if (settled) {
      stillFrames.current += 1;
    } else {
      stillFrames.current = 0;
    }

    if (stillFrames.current >= 25) {
      settleWithFace(readDieFace(quat.current));
    }
  });

  return (
    <group ref={ref}>
      <mesh geometry={inner} material={innerMat} />
      <mesh geometry={geom} material={outerMat} castShadow receiveShadow />
    </group>
  );
}
