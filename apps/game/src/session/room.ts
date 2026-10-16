import type { PawnId } from "@cidadela/shared";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  localClientId,
  localCreateRoom,
  localJoinRoom,
  localLoadRoom,
  localStartRoom,
  localSubscribeRoom,
  localUpdateMemberProfile,
} from "./roomLocal";
import {
  remoteCreateRoom,
  remoteJoinRoom,
  remoteLoadRoom,
  remoteStartRoom,
  remoteSubscribeRoom,
  remoteUpdateMemberProfile,
} from "./roomRemote";
import type { RoomListener, RoomMember, RoomState } from "./roomTypes";

export type { RoomMember, RoomState } from "./roomTypes";

export function createRoomId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return id;
}

export function roomJoinUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("room", roomId);
  return url.toString();
}

export function isLocalhostJoinUrl(joinUrl: string): boolean {
  try {
    const host = new URL(joinUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

export function readRoomParam(): string | null {
  const id = new URLSearchParams(window.location.search).get("room");
  return id?.trim().toUpperCase() || null;
}

export function clearRoomParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("room")) return;
  url.searchParams.delete("room");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}

/** Sync: id local (fallback). Preferir `resolveClientId` no Lobby online. */
export function getClientId(): string {
  return localClientId();
}

export async function resolveClientId(): Promise<string> {
  if (isSupabaseConfigured()) {
    const { ensureAnonSession } = await import("../lib/supabase");
    return ensureAnonSession();
  }
  return localClientId();
}

export async function loadRoom(roomId: string): Promise<RoomState | null> {
  if (isSupabaseConfigured()) return remoteLoadRoom(roomId);
  return localLoadRoom(roomId);
}

export async function createRoom(
  maxPlayers: number,
  host: Omit<RoomMember, "isHost">,
): Promise<RoomState> {
  const roomId = createRoomId();
  if (isSupabaseConfigured()) {
    return remoteCreateRoom(roomId, maxPlayers, host);
  }
  return localCreateRoom(roomId, maxPlayers, host);
}

export async function joinRoom(
  roomId: string,
  member: Omit<RoomMember, "isHost">,
): Promise<{ ok: true; state: RoomState } | { ok: false; error: string }> {
  if (isSupabaseConfigured()) return remoteJoinRoom(roomId, member);
  return localJoinRoom(roomId, member);
}

export async function updateMemberProfile(
  roomId: string,
  clientId: string,
  patch: { name?: string; pawnId?: PawnId },
): Promise<{ ok: true; state: RoomState } | { ok: false; error: string }> {
  if (isSupabaseConfigured()) {
    return remoteUpdateMemberProfile(roomId, clientId, patch);
  }
  return localUpdateMemberProfile(roomId, clientId, patch);
}

export async function startRoom(
  roomId: string,
  hostId: string,
): Promise<{ ok: true; state: RoomState } | { ok: false; error: string }> {
  if (isSupabaseConfigured()) return remoteStartRoom(roomId, hostId);
  return localStartRoom(roomId, hostId);
}

export function subscribeRoom(
  roomId: string,
  listener: RoomListener,
): () => void {
  if (isSupabaseConfigured()) return remoteSubscribeRoom(roomId, listener);
  return localSubscribeRoom(roomId, listener);
}

export { isSupabaseConfigured };
