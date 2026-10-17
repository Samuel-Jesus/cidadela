import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Group, type Mesh, type MeshBasicMaterial } from "three";
import type { PawnKind } from "./pawnKind";

type Props = {
  kind: PawnKind;
  movingRef: MutableRefObject<boolean>;
};

type Puff = {
  mesh: Mesh | null;
  life: number;
  max: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  grow: number;
};

const N = 16;

export function PawnTypeFx({ kind, movingRef }: Props) {
  const root = useRef<Group>(null);
  const puffs = useRef<Puff[]>(
    Array.from({ length: N }, () => ({
      mesh: null,
      life: 0,
      max: 1,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      grow: 1,
    })),
  );
  const spawnAcc = useRef(0);
  const smoke = useMemo(() => new Color("#d4d4d8"), []);

  useFrame((_, dt) => {
    if (kind !== "kart") return;
    const group = root.current;
    if (!group) return;

    const moving = movingRef.current;
    const list = puffs.current;

    if (list[0]!.mesh == null) {
      for (let i = 0; i < N; i++) {
        const child = group.children[i] as Mesh | undefined;
        if (child) {
          list[i]!.mesh = child;
          child.visible = false;
        }
      }
    }

    if (!moving) {
      for (const p of list) {
        if (p.life <= 0) continue;
        p.life -= dt * 1.5;
        const mesh = p.mesh;
        if (!mesh) continue;
        if (p.life <= 0) {
          mesh.visible = false;
          continue;
        }
        const u = 1 - p.life / p.max;
        mesh.position.set(p.x, p.y, p.z);
        mesh.scale.setScalar(0.04 + u * 0.1);
        (mesh.material as MeshBasicMaterial).opacity = (1 - u) * 0.2;
      }
      return;
    }

    spawnAcc.current += dt * 16;
    while (spawnAcc.current >= 1) {
      spawnAcc.current -= 1;
      const p = list.find((x) => x.life <= 0);
      if (!p) break;
      p.max = 0.65 + Math.random() * 0.45;
      p.life = p.max;
      p.grow = 1.5 + Math.random() * 0.7;
      p.x = (Math.random() - 0.5) * 0.06;
      p.y = 0.08 + Math.random() * 0.04;
      p.z = -0.26 - Math.random() * 0.05;
      p.vx = (Math.random() - 0.5) * 0.06;
      p.vy = 0.1 + Math.random() * 0.1;
      p.vz = -0.2 - Math.random() * 0.18;
    }

    for (const p of list) {
      const mesh = p.mesh;
      if (!mesh) continue;
      if (p.life <= 0) {
        mesh.visible = false;
        continue;
      }
      p.life -= dt;
      const u = 1 - Math.max(0, p.life) / p.max;
      const ease = u * u * (3 - 2 * u);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy += 0.04 * dt;
      p.vx *= 1 - dt * 0.35;
      mesh.visible = true;
      mesh.position.set(p.x, p.y, p.z);
      mesh.scale.setScalar(0.035 + ease * 0.11 * p.grow);
      const mat = mesh.material as MeshBasicMaterial;
      mat.color.copy(smoke);
      mat.opacity = (1 - ease) * 0.38;
    }
  });

  if (kind !== "kart") return null;

  return (
    <group ref={root}>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} visible={false} renderOrder={2}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            color="#d4d4d8"
          />
        </mesh>
      ))}
    </group>
  );
}
