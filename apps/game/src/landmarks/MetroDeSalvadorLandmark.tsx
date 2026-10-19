import { useLayoutEffect, useRef } from "react";
import type { Group } from "three";
import { fitToSlot } from "./FitToSlot";
import { useLandmarkFrame } from "./useLandmarkFrame";
import { criarMetroDeSalvador, type MetroDeSalvadorGroup } from "./metroDeSalvador";

type Props = {
  fitWidth: number;
  fitDepth: number;
  accent?: boolean;
};

export function MetroDeSalvadorLandmark({ fitWidth, fitDepth, accent = false }: Props) {
  const wrap = useRef<Group>(null);
  const model = useRef<Group>(null);
  const built = useRef<MetroDeSalvadorGroup | null>(null);

  useLayoutEffect(() => {
    const root = model.current;
    if (!root) return;

    while (root.children.length) root.remove(root.children[0]);
    const metro = criarMetroDeSalvador();
    built.current = metro;
    root.add(metro);
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    fitToSlot(root, fitWidth, fitDepth, false);

    return () => {
      built.current = null;
      while (root.children.length) root.remove(root.children[0]);
    };
  }, [fitWidth, fitDepth]);

  useLandmarkFrame(wrap, built, accent);

  return (
    <group ref={wrap}>
      <group ref={model} />
    </group>
  );
}
