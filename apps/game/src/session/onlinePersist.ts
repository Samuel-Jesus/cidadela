import type { OnlineSession } from "./onlineSession";

const KEY = "cidadela:onlineSession";

export function saveOnlineSession(session: OnlineSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
  }
}

export function loadOnlineSession(): OnlineSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnlineSession>;
    if (
      typeof parsed.roomId !== "string" ||
      typeof parsed.localPlayerId !== "string" ||
      typeof parsed.isHost !== "boolean"
    ) {
      return null;
    }
    return {
      roomId: parsed.roomId.toUpperCase(),
      localPlayerId: parsed.localPlayerId,
      isHost: parsed.isHost,
    };
  } catch {
    return null;
  }
}

export function clearOnlineSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
  }
}

export function ensureRoomParam(roomId: string): void {
  const url = new URL(window.location.href);
  const id = roomId.toUpperCase();
  if (url.searchParams.get("room")?.toUpperCase() === id) return;
  url.searchParams.set("room", id);
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}
