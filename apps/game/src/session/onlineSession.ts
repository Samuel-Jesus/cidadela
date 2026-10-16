import type { GameSnapshot } from "./gameSnapshot";

export type OnlineSession = {
  roomId: string;
  isHost: boolean;
  localPlayerId: string;
};

export function snapshotPlayersEqual(
  a: GameSnapshot["players"],
  b: GameSnapshot["players"],
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
