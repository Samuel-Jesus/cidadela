import type { LobbySetup, PawnId } from "@cidadela/shared";
import { ensureAnonSession, getSupabase } from "../lib/supabase";
import { createGame } from "./gameSync";
import { createInitialSnapshot } from "./gameSnapshot";
import type { RoomListener, RoomMember, RoomState } from "./roomTypes";

type RoomRow = {
  id: string;
  host_id: string;
  max_players: number;
  status: "waiting" | "playing" | "ended";
};

type MemberRow = {
  room_id: string;
  user_id: string;
  name: string;
  pawn_id: string;
  is_host: boolean;
};

function toRoomStatus(s: RoomRow["status"]): RoomState["status"] {
  return s === "waiting" ? "waiting" : "started";
}

function membersToSetup(members: RoomMember[]): LobbySetup {
  const hostIndex = members.findIndex((m) => m.isHost);
  return {
    seats: members.map((m) => ({
      name: m.name,
      pawnId: m.pawnId,
      playerId: m.clientId,
    })),
    bankerIndex: hostIndex >= 0 ? hostIndex : 0,
  };
}

function mapMember(row: MemberRow): RoomMember {
  return {
    clientId: row.user_id,
    name: row.name,
    pawnId: row.pawn_id as PawnId,
    isHost: row.is_host,
  };
}

async function fetchRoomState(roomId: string): Promise<RoomState | null> {
  const id = roomId.toUpperCase();
  const sb = getSupabase();
  const { data: room, error: roomErr } = await sb
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (roomErr) throw new Error(roomErr.message);
  if (!room) return null;

  const { data: members, error: memErr } = await sb
    .from("room_members")
    .select("*")
    .eq("room_id", id)
    .order("joined_at", { ascending: true });
  if (memErr) throw new Error(memErr.message);

  const mapped = (members as MemberRow[]).map(mapMember);
  const row = room as RoomRow;
  const state: RoomState = {
    roomId: row.id,
    maxPlayers: row.max_players,
    hostId: row.host_id,
    members: mapped,
    status: toRoomStatus(row.status),
  };
  if (state.status === "started") {
    state.startedSetup = membersToSetup(mapped);
  }
  return state;
}

export async function remoteLoadRoom(roomId: string): Promise<RoomState | null> {
  await ensureAnonSession();
  return fetchRoomState(roomId);
}

export async function remoteCreateRoom(
  roomId: string,
  maxPlayers: number,
  host: Omit<RoomMember, "isHost">,
): Promise<RoomState> {
  const userId = await ensureAnonSession();
  const n = Math.min(8, Math.max(2, maxPlayers));
  const id = roomId.toUpperCase();
  const sb = getSupabase();

  const { error: roomErr } = await sb.from("rooms").insert({
    id,
    host_id: userId,
    max_players: n,
    status: "waiting",
  });
  if (roomErr) throw new Error(roomErr.message);

  const { error: memErr } = await sb.from("room_members").insert({
    room_id: id,
    user_id: userId,
    name: host.name.trim() || "Anfitrião",
    pawn_id: host.pawnId,
    is_host: true,
  });
  if (memErr) throw new Error(memErr.message);

  const state = await fetchRoomState(id);
  if (!state) throw new Error("Sala criada, mas falhou ao carregar.");
  return state;
}

export async function remoteJoinRoom(
  roomId: string,
  member: Omit<RoomMember, "isHost">,
): Promise<{ ok: true; state: RoomState } | { ok: false; error: string }> {
  await ensureAnonSession();
  const id = roomId.toUpperCase();
  const state = await fetchRoomState(id);
  if (!state) {
    return {
      ok: false,
      error: "Sala não encontrada. Peça um novo link ao anfitrião.",
    };
  }
  if (state.members.some((m) => m.clientId === member.clientId)) {
    return { ok: true, state };
  }
  if (state.status !== "waiting") {
    return {
      ok: false,
      error: "Esta partida já começou. Use o mesmo aparelho/conta para voltar.",
    };
  }
  if (state.members.length >= state.maxPlayers) {
    return { ok: false, error: "Sala cheia." };
  }
  if (state.members.some((m) => m.pawnId === member.pawnId)) {
    return { ok: false, error: "Este peão já foi escolhido." };
  }
  const name = member.name.trim();
  if (!name) return { ok: false, error: "Informe seu nome." };

  const { error } = await getSupabase().from("room_members").insert({
    room_id: id,
    user_id: member.clientId,
    name,
    pawn_id: member.pawnId,
    is_host: false,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Peão ou assento já ocupado." };
    }
    return { ok: false, error: error.message };
  }
  const next = await fetchRoomState(id);
  if (!next) return { ok: false, error: "Falha ao atualizar a sala." };
  return { ok: true, state: next };
}

export async function remoteUpdateMemberProfile(
  roomId: string,
  clientId: string,
  patch: { name?: string; pawnId?: PawnId },
): Promise<{ ok: true; state: RoomState } | { ok: false; error: string }> {
  await ensureAnonSession();
  const id = roomId.toUpperCase();
  const state = await fetchRoomState(id);
  if (!state || state.status !== "waiting") {
    return { ok: false, error: "Sala indisponível." };
  }
  if (!state.members.some((m) => m.clientId === clientId)) {
    return { ok: false, error: "Você não está nesta sala." };
  }
  if (patch.pawnId != null) {
    if (
      state.members.some(
        (m) => m.clientId !== clientId && m.pawnId === patch.pawnId,
      )
    ) {
      return { ok: false, error: "Este peão já foi escolhido." };
    }
  }
  const update: Record<string, string> = {};
  if (patch.name != null) {
    const name = patch.name.trim();
    if (!name) return { ok: false, error: "Informe seu nome." };
    update.name = name;
  }
  if (patch.pawnId != null) update.pawn_id = patch.pawnId;

  if (Object.keys(update).length) {
    const { error } = await getSupabase()
      .from("room_members")
      .update(update)
      .eq("room_id", id)
      .eq("user_id", clientId);
    if (error) return { ok: false, error: error.message };
  }
  const next = await fetchRoomState(id);
  if (!next) return { ok: false, error: "Falha ao atualizar." };
  return { ok: true, state: next };
}

export async function remoteStartRoom(
  roomId: string,
  hostId: string,
): Promise<{ ok: true; state: RoomState } | { ok: false; error: string }> {
  await ensureAnonSession();
  const id = roomId.toUpperCase();
  const state = await fetchRoomState(id);
  if (!state) return { ok: false, error: "Sala não encontrada." };
  if (state.hostId !== hostId) {
    return { ok: false, error: "Só o anfitrião pode começar." };
  }
  if (state.members.length < 2) {
    return { ok: false, error: "É preciso pelo menos 2 jogadores." };
  }

  const setup = membersToSetup(state.members);
  const snapshot = createInitialSnapshot(setup);

  try {
    await createGame(id, snapshot);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao criar partida.";
    // Já existe jogo (re-start): ok seguir
    if (!msg.toLowerCase().includes("duplicate")) {
      return { ok: false, error: msg };
    }
  }

  const { error } = await getSupabase()
    .from("rooms")
    .update({ status: "playing" })
    .eq("id", id)
    .eq("host_id", hostId);
  if (error) return { ok: false, error: error.message };

  const next = await fetchRoomState(id);
  if (!next) return { ok: false, error: "Partida iniciada, falha ao ler sala." };
  next.startedSetup = setup;
  return { ok: true, state: next };
}

export function remoteSubscribeRoom(
  roomId: string,
  listener: RoomListener,
): () => void {
  const id = roomId.toUpperCase();
  const sb = getSupabase();
  let cancelled = false;

  const refresh = () => {
    void fetchRoomState(id)
      .then((s) => {
        if (!cancelled) listener(s);
      })
      .catch(() => {
        if (!cancelled) listener(null);
      });
  };

  refresh();

  const channel = sb
    .channel(`room-${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `id=eq.${id}` },
      refresh,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_members",
        filter: `room_id=eq.${id}`,
      },
      refresh,
    )
    .subscribe();

  return () => {
    cancelled = true;
    void sb.removeChannel(channel);
  };
}
