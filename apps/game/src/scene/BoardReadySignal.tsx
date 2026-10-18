import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

const SETTLE_FRAMES = 12;
const FORCE_READY_MS = 18000;

type Props = {
  onProgress?: (ratio: number) => void;
  onReady: () => void;
};

export function BoardReadySignal({ onProgress, onReady }: Props) {
  const frames = useRef(0);
  const done = useRef(false);
  const onReadyRef = useRef(onReady);
  const onProgressRef = useRef(onProgress);
  onReadyRef.current = onReady;
  onProgressRef.current = onProgress;

  useEffect(() => {
    onProgressRef.current?.(0.82);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onProgressRef.current?.(1);
      onReadyRef.current();
    }, FORCE_READY_MS);
    return () => window.clearTimeout(id);
  }, []);

  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    const ratio = Math.min(0.99, 0.82 + frames.current / SETTLE_FRAMES / 6);
    onProgressRef.current?.(ratio);
    if (frames.current >= SETTLE_FRAMES) {
      done.current = true;
      onProgressRef.current?.(1);
      onReadyRef.current();
    }
  });

  return null;
}
