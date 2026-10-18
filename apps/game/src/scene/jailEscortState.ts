import type { PawnId } from "@cidadela/shared";

export type JailEscortMission = {
  id: number;
  playerId: string;
  pawnId: PawnId;
  fromIndex: number;
};

type Listener = () => void;

let mission: JailEscortMission | null = null;
let seq = 0;
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn();
}

export function beginJailEscort(
  input: Omit<JailEscortMission, "id">,
): JailEscortMission {
  mission = { ...input, id: ++seq };
  emit();
  return mission;
}

export function getJailEscort(): JailEscortMission | null {
  return mission;
}

export function isPlayerInJailEscort(playerId: string): boolean {
  return mission?.playerId === playerId;
}

export function endJailEscort(id?: number): void {
  if (!mission) return;
  if (id != null && mission.id !== id) return;
  mission = null;
  emit();
}

export function subscribeJailEscort(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
