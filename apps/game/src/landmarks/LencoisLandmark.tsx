import { useLayoutEffect, useRef } from "react";
import type { Group } from "three";
import { criarLencois, type LencoisGroup } from "./lencois";
import { fitToSlot } from "./FitToSlot";
import { useLandmarkFrame } from "./useLandmarkFrame";

type Props = {
  fitWidth: number;
  fitDepth: number;
  accent?: boolean;
};

export function LencoisLandmark({
  fitWidth,
  fitDepth,
  accent = false,
}: Props) {
  const wrap = useRef<Group>(null);
  const model = useRef<Group>(null);
  const built = useRef<LencoisGroup | null>(null);

  useLayoutEffect(() => {
    const root = model.current;
    if (!root) return;

    while (root.children.length) root.remove(root.children[0]!);
    const lencois = criarLencois();
    built.current = lencois;
    root.add(lencois);
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
