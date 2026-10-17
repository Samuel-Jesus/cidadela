import type { RealtimeChannel } from "@supabase/supabase-js";
import { ensureAnonSession, getSupabase } from "../lib/supabase";
import type { GameIntent, GameSnapshot } from "./gameSnapshot";

export type GameRow = {
  room_id: string;
  version: number;
  state: GameSnapshot;
  updated_at: string;
};

export async function createGame(
  roomId: string,
  initial: GameSnapshot,
): Promise<GameRow> {
  await ensureAnonSession();
  const sb = getSupabase();
  const { data, error } = await sb
    .from("games")
    .insert({
      room_id: roomId.toUpperCase(),
      version: 1,
      state: initial,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as GameRow;
}

export async function loadGame(roomId: string): Promise<GameRow | null> {
  await ensureAnonSession();
  const { data, error } = await getSupabase()
    .from("games")
    .select("*")
    .eq("room_id", roomId.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as GameRow | null) ?? null;
}

export async function pushGameState(
  roomId: string,
  expectedVersion: number,
  state: GameSnapshot,
): Promise<
  | { ok: true; version: number }
  | { ok: false; conflict: true; row: GameRow }
  | { ok: false; conflict: false; error: string }
> {
  await ensureAnonSession();
  const id = roomId.toUpperCase();
  const nextVersion = expectedVersion + 1;
  const { data, error } = await getSupabase()
    .from("games")
    .update({
      version: nextVersion,
      state,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", id)
    .eq("version", expectedVersion)
    .select("version")
    .maybeSingle();

  if (error) return { ok: false, conflict: false, error: error.message };
  if (!data) {
    const row = await loadGame(id);
    if (row) return { ok: false, conflict: true, row };
    return {
      ok: false,
      conflict: false,
      error: "Versão desatualizada — outro write venceu.",
    };
  }
  return { ok: true, version: nextVersion };
}


export function subscribeRoomPresence(
  roomId: string,
  self: { userId: string; isHost: boolean },
  onChange: (info: { hostOnline: boolean; memberCount: number }) => void,
): () => void {
  const id = roomId.toUpperCase();
  const sb = getSupabase();
  const channel = sb.channel(`presence-${id}`, {
    config: { presence: { key: self.userId } },
  });

  const emit = () => {
    const state = channel.presenceState() as Record<
      string,
      Array<{ userId?: string; isHost?: boolean }>
    >;
    let hostOnline = false;
    let memberCount = 0;
    for (const metas of Object.values(state)) {
      for (const meta of metas) {
        memberCount += 1;
        if (meta.isHost) hostOnline = true;
      }
    }
    onChange({ hostOnline, memberCount });
  };

  channel
    .on("presence", { event: "sync" }, emit)
    .on("presence", { event: "join" }, emit)
    .on("presence", { event: "leave" }, emit)
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: self.userId,
          isHost: self.isHost,
          at: Date.now(),
        });
      }
    });

  return () => {
    void sb.removeChannel(channel);
  };
}

export async function enqueueGameAction(
  roomId: string,
  intent: GameIntent,
): Promise<void> {
  const actorId = await ensureAnonSession();
  const { error } = await getSupabase().from("game_actions").insert({
    room_id: roomId.toUpperCase(),
    actor_id: actorId,
    payload: intent,
  });
  if (error) throw new Error(error.message);
}

export async function markActionApplied(actionId: number): Promise<void> {
  await ensureAnonSession();
  const { error } = await getSupabase()
    .from("game_actions")
    .update({ applied: true })
    .eq("id", actionId);
  if (error) throw new Error(error.message);
}

export function subscribeGame(
  roomId: string,
  onRow: (row: GameRow) => void,
): () => void {
  const id = roomId.toUpperCase();
  const sb = getSupabase();
  void loadGame(id).then((row) => {
    if (row) onRow(row);
  });

  const channel: RealtimeChannel = sb
    .channel(`game-${id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "games",
        filter: `room_id=eq.${id}`,
      },
      (payload) => {
        const row = (payload.new ?? null) as GameRow | null;
        if (row?.state) onRow(row);
      },
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}

export type PendingAction = {
  id: number;
  room_id: string;
  actor_id: string;
  payload: GameIntent;
  applied: boolean;
  created_at: string;
};

export function subscribePendingActions(
  roomId: string,
  onAction: (action: PendingAction) => void,
): () => void {
  const id = roomId.toUpperCase();
  const sb = getSupabase();

  void sb
    .from("game_actions")
    .select("*")
    .eq("room_id", id)
    .eq("applied", false)
    .order("id", { ascending: true })
    .then(({ data }) => {
      for (const row of data ?? []) {
        onAction(row as PendingAction);
      }
    });

  const channel = sb
    .channel(`actions-${id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_actions",
        filter: `room_id=eq.${id}`,
      },
      (payload) => {
        const row = payload.new as PendingAction;
        if (row && !row.applied) onAction(row);
      },
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}
