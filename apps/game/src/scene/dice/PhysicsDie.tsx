import { useEffect, useMemo, useRef } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, Quaternion } from "three";
import type { DieFace } from "@cidadela/engine";
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
const MIN_ROLL_MS = 1600;
const MAX_ROLL_MS = 5500;

export function PhysicsDie({ index, rolling, rollId, onFace }: Props) {
  const reported = useRef(false);
  const stillFrames = useRef(0);
  const vel = useRef([0, 0, 0]);
  const ang = useRef([0, 0, 0]);
  const quat = useRef(new Quaternion());
  const onFaceRef = useRef(onFace);
  onFaceRef.current = onFace;
  const rollStartedAt = useRef(0);

  const [ref, api] = useBox(() => ({
    mass: 1,
    args: [SIZE, SIZE, SIZE],
    position: [index === 0 ? -0.5 : 0.5, 1.5 + index * 0.35, 0],
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
    () => new MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.42, metalness: 0.04 }),
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
    if (!rolling) return;

    reported.current = false;
    stillFrames.current = 0;
    rollStartedAt.current = performance.now();

    api.wakeUp?.();
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);
    api.position.set(
      index === 0 ? -0.4 : 0.45,
      2.6 + index * 0.5,
      index === 0 ? 0.2 : -0.15,
    );
    api.rotation.set(
      Math.PI * 2 * Math.random(),
      Math.PI * 2 * Math.random(),
      Math.PI * 2 * Math.random(),
    );

    const force = 2.4 + 2.6 * Math.random();
    const side = index === 0 ? 1 : -1;
    const t = window.setTimeout(() => {
      api.applyImpulse(
        [side * force * 0.4, force * 0.55, (Math.random() - 0.5) * force * 0.85],
        [0, 0, 0.1],
      );
      api.angularVelocity.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
      );
    }, 50);

    return () => window.clearTimeout(t);
  }, [rolling, rollId, api, index]);

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

    const elapsed = performance.now() - rollStartedAt.current;
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
