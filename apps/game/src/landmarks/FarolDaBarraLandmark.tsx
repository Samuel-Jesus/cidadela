import { useLayoutEffect, useRef } from "react";
import type { Group } from "three";
import { criarFarolDaBarra, type FarolDaBarraGroup } from "./farolDaBarra";
import { fitToSlot } from "./FitToSlot";
import { useLandmarkFrame } from "./useLandmarkFrame";

type Props = {
  fitWidth: number;
  fitDepth: number;
  accent?: boolean;
};

export function FarolDaBarraLandmark({
  fitWidth,
  fitDepth,
  accent = false,
}: Props) {
  const wrap = useRef<Group>(null);
  const model = useRef<Group>(null);
  const built = useRef<FarolDaBarraGroup | null>(null);

  useLayoutEffect(() => {
    const root = model.current;
    if (!root) return;

    while (root.children.length) root.remove(root.children[0]!);
    const farol = criarFarolDaBarra();
    built.current = farol;
    root.add(farol);
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    fitToSlot(root, fitWidth, fitDepth);

    return () => {
      built.current = null;
      while (root.children.length) root.remove(root.children[0]!);
    };
  }, [fitWidth, fitDepth]);

  useLandmarkFrame(wrap, built, accent);

  return (
    <group ref={wrap}>
      <group ref={model} />
    </group>
  );
}
