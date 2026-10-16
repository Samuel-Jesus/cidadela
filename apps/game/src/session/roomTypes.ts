import type { LobbySetup, PawnId } from "@cidadela/shared";

export type RoomMember = {
  clientId: string;
  name: string;
  pawnId: PawnId;
  isHost: boolean;
};

export type RoomState = {
  roomId: string;
  maxPlayers: number;
  hostId: string;
  members: RoomMember[];
  status: "waiting" | "started";
  startedSetup?: LobbySetup;
};

export type RoomListener = (state: RoomState | null) => void;
