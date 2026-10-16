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

type RoomListener = (state: RoomState | null) => void;

const CLIENT_KEY = "cidadela-client-id";

function storageKey(roomId: string) {
  return `cidadela-room-${roomId}`;
}

function channelName(roomId: string) {
  return `cidadela-room-ch-${roomId}`;
}

export function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return `temp-${Math.random().toString(36).slice(2)}`;
  }
}

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

function readStored(roomId: string): RoomState | null {
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return null;
    return JSON.parse(raw) as RoomState;
  } catch {
    return null;
  }
}

function writeStored(state: RoomState) {
  localStorage.setItem(storageKey(state.roomId), JSON.stringify(state));
  try {
    const ch = new BroadcastChannel(channelName(state.roomId));
    ch.postMessage({ type: "room", state });
    ch.close();
  } catch {
    // BroadcastChannel indisponível
  }
}

export function loadRoom(roomId: string): RoomState | null {
  return readStored(roomId.toUpperCase());
}

export function createRoom(maxPlayers: number, host: Omit<RoomMember, "isHost">): RoomState {
  const n = Math.min(8, Math.max(2, maxPlayers));
  const roomId = createRoomId();
  const state: RoomState = {
    roomId,
    maxPlayers: n,
    hostId: host.clientId,
    members: [{ ...host, isHost: true }],
    status: "waiting",
  };
  writeStored(state);
  return state;
}

export function joinRoom(
  roomId: string,
  member: Omit<RoomMember, "isHost">,
): { ok: true; state: RoomState } | { ok: false; error: string } {
  const id = roomId.toUpperCase();
  const state = readStored(id);
  if (!state) {
    return { ok: false, error: "Sala não encontrada. Peça um novo link ao anfitrião." };
  }
  if (state.status !== "waiting") {
    return { ok: false, error: "Esta partida já começou." };
  }
  if (state.members.some((m) => m.clientId === member.clientId)) {
    return { ok: true, state };
  }
  if (state.members.length >= state.maxPlayers) {
    return { ok: false, error: "Sala cheia." };
  }
  if (state.members.some((m) => m.pawnId === member.pawnId)) {
    return { ok: false, error: "Este peão já foi escolhido." };
  }
  const name = member.name.trim();
  if (!name) {
    return { ok: false, error: "Informe seu nome." };
  }
  const next: RoomState = {
    ...state,
    members: [
      ...state.members,
      { ...member, name, isHost: member.clientId === state.hostId },
    ],
  };
  writeStored(next);
  return { ok: true, state: next };
}

export function updateMemberProfile(
  roomId: string,
  clientId: string,
  patch: { name?: string; pawnId?: PawnId },
): { ok: true; state: RoomState } | { ok: false; error: string } {
  const state = readStored(roomId.toUpperCase());
  if (!state || state.status !== "waiting") {
    return { ok: false, error: "Sala indisponível." };
  }
  const idx = state.members.findIndex((m) => m.clientId === clientId);
  if (idx < 0) return { ok: false, error: "Você não está nesta sala." };

  const nextMembers = state.members.map((m) => ({ ...m }));
  const me = { ...nextMembers[idx]! };
  if (patch.name != null) {
    const name = patch.name.trim();
    if (!name) return { ok: false, error: "Informe seu nome." };
    me.name = name;
  }
  if (patch.pawnId != null) {
    if (
      nextMembers.some(
        (m, i) => i !== idx && m.pawnId === patch.pawnId,
      )
    ) {
      return { ok: false, error: "Este peão já foi escolhido." };
    }
    me.pawnId = patch.pawnId;
  }
  nextMembers[idx] = me;
  const next = { ...state, members: nextMembers };
  writeStored(next);
  return { ok: true, state: next };
}

export function startRoom(
  roomId: string,
  hostId: string,
): { ok: true; state: RoomState } | { ok: false; error: string } {
  const state = readStored(roomId.toUpperCase());
  if (!state) return { ok: false, error: "Sala não encontrada." };
  if (state.hostId !== hostId) {
    return { ok: false, error: "Só o anfitrião pode começar." };
  }
  if (state.members.length < 2) {
    return { ok: false, error: "É preciso pelo menos 2 jogadores." };
  }
  const hostIndex = state.members.findIndex((m) => m.isHost);
  const setup: LobbySetup = {
    seats: state.members.map((m) => ({
      name: m.name,
      pawnId: m.pawnId,
    })),
    bankerIndex: hostIndex >= 0 ? hostIndex : 0,
  };
  const next: RoomState = {
    ...state,
    status: "started",
    startedSetup: setup,
  };
  writeStored(next);
  return { ok: true, state: next };
}

export function subscribeRoom(
  roomId: string,
  listener: RoomListener,
): () => void {
  const id = roomId.toUpperCase();
  listener(readStored(id));

  const onStorage = (e: StorageEvent) => {
    if (e.key !== storageKey(id)) return;
    listener(readStored(id));
  };
  window.addEventListener("storage", onStorage);

  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(channelName(id));
    ch.onmessage = (ev: MessageEvent) => {
      if (ev.data?.type === "room" && ev.data.state) {
        listener(ev.data.state as RoomState);
      }
    };
  } catch {
    ch = null;
  }

  const poll = window.setInterval(() => {
    listener(readStored(id));
  }, 800);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.clearInterval(poll);
    ch?.close();
  };
}
