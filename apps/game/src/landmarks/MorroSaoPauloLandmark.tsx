import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import {
  criarMorroSaoPaulo,
  type MorroSaoPauloGroup,
} from "./morroSaoPaulo";
import { fitToSlot } from "./FitToSlot";

type Props = {
  fitWidth: number;
  fitDepth: number;
  accent?: boolean;
};

export function MorroSaoPauloLandmark({
  fitWidth,
  fitDepth,
  accent = false,
}: Props) {
  const wrap = useRef<Group>(null);
  const model = useRef<Group>(null);
  const built = useRef<MorroSaoPauloGroup | null>(null);

  useLayoutEffect(() => {
    const root = model.current;
    if (!root) return;

    while (root.children.length) root.remove(root.children[0]!);
    const morro = criarMorroSaoPaulo();
    built.current = morro;
    root.add(morro);
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    fitToSlot(root, fitWidth, fitDepth);

    return () => {
      built.current = null;
      while (root.children.length) root.remove(root.children[0]!);
    };
  }, [fitWidth, fitDepth]);

  useFrame((_, dt) => {
    built.current?.userData.tick(Math.min(dt, 0.05));
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
      <group ref={model} />
    </group>
  );
}
