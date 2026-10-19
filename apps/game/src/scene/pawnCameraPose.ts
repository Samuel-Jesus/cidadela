export type PawnCameraPose = {
  playerId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
};

type Listener = () => void;

let pose: PawnCameraPose | null = null;
const listeners = new Set<Listener>();

export function setPawnCameraPose(next: PawnCameraPose | null): void {
  pose = next;
  for (const l of listeners) l();
}

export function getPawnCameraPose(): PawnCameraPose | null {
  return pose;
}

export function subscribePawnCameraPose(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearPawnCameraPose(playerId?: string): void {
  if (!pose) return;
  if (playerId && pose.playerId !== playerId) return;
  pose = null;
  for (const l of listeners) l();
}
