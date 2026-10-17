import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import {
  PAWNS,
  STARTING_CASH,
  formatCash,
  getPawnDef,
  validateLobbySetup,
  type LobbySeat,
  type LobbySetup,
  type PawnId,
} from "@cidadela/shared";
import {
  clearRoomParam,
  createRoom,
  isLocalhostJoinUrl,
  isSupabaseConfigured,
  joinRoom,
  loadRoom,
  readRoomParam,
  resolveClientId,
  roomJoinUrl,
  startRoom,
  subscribeRoom,
  updateMemberProfile,
  type RoomState,
} from "../session/room";
import {
  ensureRoomParam,
  loadOnlineSession,
} from "../session/onlinePersist";
import {
  bindUiSfxHover,
  playSfx,
  preloadUiSfx,
  unlockAudio,
} from "../audio/sfx";
import i18n from "../i18n";
import { SfxMuteButton } from "../audio/SfxMuteButton";
import { LanguagePicker } from "./LanguagePicker";
import { LobbyPawnCarousel } from "./LobbyPawnCarousel";
import { LobbyPawnPicker, LobbyPawnToken } from "./LobbyPawnToken";

function playFormClick() {
  unlockAudio();
  playSfx("click");
}

function playBack() {
  unlockAudio();
  playSfx("back");
}

export type LobbyStartMeta = {
  mode: "local" | "online";
  roomId?: string;
  localPlayerId?: string;
  isHost?: boolean;
};

type Props = {
  onStart: (setup: LobbySetup, meta?: LobbyStartMeta) => void;
};

type Phase = "home" | "local" | "host" | "guest";

function defaultSeat(index: number, taken: Set<PawnId>): LobbySeat {
  const pawn = PAWNS.find((p) => !taken.has(p.id)) ?? PAWNS[index]!;
  return {
    name: `${i18n.t("common.player")} ${index + 1}`,
    pawnId: pawn.id,
  };
}

function resizeSeats(seats: LobbySeat[], count: number): LobbySeat[] {
  if (count <= seats.length) return seats.slice(0, count);
  const next = [...seats];
  while (next.length < count) {
    next.push(defaultSeat(next.length, new Set(next.map((s) => s.pawnId))));
  }
  return next;
}

export function LobbyScreen({ onStart }: Props) {
  const { t } = useTranslation();
  const online = isSupabaseConfigured();
  const allowLocalHotSeat = import.meta.env.DEV;
  const initialRoom = useMemo(() => readRoomParam(), []);
  const [clientId, setClientId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [phase, setPhase] = useState<Phase>(() =>
    initialRoom ? "guest" : "home",
  );
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomIdInput, setRoomIdInput] = useState(initialRoom ?? "");
  const [hostName, setHostName] = useState("Anfitrião");
  const [hostPawn, setHostPawn] = useState<PawnId>("oobi");
  const [guestName, setGuestName] = useState("");
  const [guestPawn, setGuestPawn] = useState<PawnId>("oodi");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSeats, setLocalSeats] = useState<LobbySeat[]>(() =>
    resizeSeats([], 4),
  );
  const [localBanker, setLocalBanker] = useState(0);
  const [homePanel, setHomePanel] = useState<"host" | "join" | null>(null);
  const startedRef = useRef(false);

  const joinUrl = room ? roomJoinUrl(room.roomId) : "";

  useEffect(() => {
    preloadUiSfx();
    bindUiSfxHover();
  }, []);

  useEffect(() => {
    if (!error) return;
    playSfx("error");
  }, [error]);

  useEffect(() => {
    if (!allowLocalHotSeat && phase === "local") {
      setPhase("home");
    }
  }, [allowLocalHotSeat, phase]);

  useEffect(() => {
    let cancelled = false;
    void resolveClientId()
      .then((id) => {
        if (!cancelled) setClientId(id);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : t("lobby.authFail"),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialRoom || !clientId) return;
    let cancelled = false;
    setBusy(true);
    void loadRoom(initialRoom)
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          setError(null);
          setRoom(existing);
          setPhase(
            existing.hostId === clientId ? "host" : "guest",
          );
        } else {
          setError(t("lobby.roomNotFound"));
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : t("lobby.loadRoomFail"),
        );
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialRoom, clientId]);

  useEffect(() => {
    if (!room?.roomId || !clientId) return;
    return subscribeRoom(room.roomId, (next) => {
      if (!next) return;
      setRoom(next);
      if (
        next.status === "started" &&
        next.startedSetup &&
        !startedRef.current
      ) {
        startedRef.current = true;
        ensureRoomParam(next.roomId);
        onStart(next.startedSetup, {
          mode: online ? "online" : "local",
          roomId: next.roomId,
          localPlayerId: clientId,
          isHost: next.hostId === clientId,
        });
      }
    });
  }, [room?.roomId, onStart, clientId, online]);

  useEffect(() => {
    if (!clientId || initialRoom || startedRef.current) return;
    const saved = loadOnlineSession();
    if (!saved || saved.localPlayerId !== clientId) return;
    let cancelled = false;
    setBusy(true);
    void loadRoom(saved.roomId)
      .then((existing) => {
        if (cancelled || !existing) return;
        if (
          existing.status === "started" &&
          existing.startedSetup &&
          existing.members.some((m) => m.clientId === clientId)
        ) {
          startedRef.current = true;
          ensureRoomParam(existing.roomId);
          onStart(existing.startedSetup, {
            mode: "online",
            roomId: existing.roomId,
            localPlayerId: clientId,
            isHost: existing.hostId === clientId,
          });
          return;
        }
        setRoom(existing);
        setPhase(existing.hostId === clientId ? "host" : "guest");
        ensureRoomParam(existing.roomId);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, initialRoom, onStart]);

  useEffect(() => {
    if (!joinUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(joinUrl, {
      width: 220,
      margin: 2,
      color: { dark: "#5c3d2e", light: "#fff7ed" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  const usedPawns = useMemo(
    () => new Set(room?.members.map((m) => m.pawnId) ?? []),
    [room],
  );

  const iAmInRoom = Boolean(
    room?.members.some((m) => m.clientId === clientId),
  );
  const iAmHost = room?.hostId === clientId;

  useEffect(() => {
    if (phase !== "guest" || !room || iAmInRoom) return;
    if (!usedPawns.has(guestPawn)) return;
    const free = PAWNS.find((p) => !usedPawns.has(p.id));
    if (free) setGuestPawn(free.id);
  }, [phase, room, usedPawns, guestPawn, iAmInRoom]);

  const setLocalCount = (count: number) => {
    setLocalSeats((seats) => resizeSeats(seats, count));
    setLocalBanker((b) => (b < count ? b : 0));
  };

  const updateLocalSeat = (index: number, patch: Partial<LobbySeat>) => {
    setLocalSeats((seats) =>
      seats.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  };

  const startLocal = () => {
    playFormClick();
    if (!allowLocalHotSeat) {
      setError(t("lobby.hotseatUnavailable"));
      return;
    }
    const setup: LobbySetup = {
      seats: localSeats.map((s) => ({ ...s, name: s.name.trim() })),
      bankerIndex: localBanker,
    };
    const check = validateLobbySetup(setup);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(null);
    onStart(setup, { mode: "local" });
  };

  const createAsHost = () => {
    playFormClick();
    if (!clientId) {
      setError(t("lobby.waitingAuth"));
      return;
    }
    if (!online) {
      setError(t("lobby.needSupabase"));
      return;
    }
    setError(null);
    setBusy(true);
    const name = hostName.trim() || "Anfitrião";
    void createRoom(maxPlayers, {
      clientId,
      name,
      pawnId: hostPawn,
    })
      .then((state) => {
        startedRef.current = false;
        setRoom(state);
        setPhase("host");
        const url = new URL(window.location.href);
        url.searchParams.set("room", state.roomId);
        window.history.replaceState({}, "", url.toString());
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : t("lobby.createFail"));
      })
      .finally(() => setBusy(false));
  };

  const enterAsGuest = () => {
    playFormClick();
    setError(null);
    const id = roomIdInput.trim().toUpperCase();
    if (!id) {
      setError(t("lobby.needCode"));
      return;
    }
    if (!online) {
      setError(t("lobby.needSupabaseJoin"));
      return;
    }
    setBusy(true);
    void loadRoom(id)
      .then((existing) => {
        if (!existing) {
          setError(t("lobby.roomNotFoundShort"));
          return;
        }
        startedRef.current = false;
        setError(null);
        setRoom(existing);
        setPhase("guest");
        const url = new URL(window.location.href);
        url.searchParams.set("room", id);
        window.history.replaceState({}, "", url.toString());
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : t("lobby.joinFail"));
      })
      .finally(() => setBusy(false));
  };

  const confirmGuestJoin = () => {
    if (!room || !clientId) return;
    playFormClick();
    setError(null);
    setBusy(true);
    void joinRoom(room.roomId, {
      clientId,
      name: guestName,
      pawnId: guestPawn,
    })
      .then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRoom(result.state);
        if (
          result.state.status === "started" &&
          result.state.startedSetup &&
          !startedRef.current
        ) {
          startedRef.current = true;
          ensureRoomParam(result.state.roomId);
          onStart(result.state.startedSetup, {
            mode: "online",
            roomId: result.state.roomId,
            localPlayerId: clientId,
            isHost: result.state.hostId === clientId,
          });
        }
      })
      .finally(() => setBusy(false));
  };

  const saveHostProfile = () => {
    if (!room || !clientId) return;
    playFormClick();
    setBusy(true);
    void updateMemberProfile(room.roomId, clientId, {
      name: hostName,
      pawnId: hostPawn,
    })
      .then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError(null);
        setRoom(result.state);
      })
      .finally(() => setBusy(false));
  };

  const beginMatch = () => {
    if (!room || !clientId) return;
    playFormClick();
    setBusy(true);
    void startRoom(room.roomId, clientId)
      .then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRoom(result.state);
        if (result.state.startedSetup && !startedRef.current) {
          startedRef.current = true;
          ensureRoomParam(result.state.roomId);
          onStart(result.state.startedSetup, {
            mode: online ? "online" : "local",
            roomId: result.state.roomId,
            localPlayerId: clientId,
            isHost: true,
          });
        }
      })
      .finally(() => setBusy(false));
  };

  const copyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("lobby.copyFail"));
    }
  };

  const leaveToHome = () => {
    playBack();
    clearRoomParam();
    startedRef.current = false;
    setRoom(null);
    setPhase("home");
    setHomePanel(null);
    setError(null);
  };

  const freePawnsFor = (current?: PawnId): PawnId[] =>
    PAWNS.filter((p) => p.id === current || !usedPawns.has(p.id)).map(
      (p) => p.id,
    );

  const showPawnCarousel =
    (phase === "home" && homePanel !== null) ||
    phase === "host" ||
    (phase === "guest" && !iAmInRoom);

  const carouselValue = phase === "guest" ? guestPawn : hostPawn;
  const carouselOptions =
    phase === "guest" || phase === "host"
      ? freePawnsFor(carouselValue)
      : PAWNS.map((p) => p.id);
  const setCarouselValue = phase === "guest" ? setGuestPawn : setHostPawn;

  return (
    <div className="lobby relative flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto">
      <div className="lobby__bg" aria-hidden />

      <div className="lobby-shell relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
        <header className="flex flex-col gap-3 text-center sm:flex-row sm:items-start sm:justify-between sm:text-start">
          <div>
            <p className="hud-kicker text-[#5eead4]">{t("brand.board")}</p>
            <h1 className="font-[family-name:var(--font-game)] text-5xl font-bold leading-none tracking-tight text-[#fff7ed] sm:text-6xl">
              {t("brand.name")}
            </h1>
            <p className="mt-3 max-w-md text-sm font-semibold text-[#ffd7a8] sm:text-base">
              {allowLocalHotSeat ? t("lobby.taglineDev") : t("lobby.tagline")}
            </p>
          </div>
          <div className="mx-auto flex items-center gap-2 sm:mx-0 sm:mt-1">
            <LanguagePicker compact />
            <SfxMuteButton />
          </div>
        </header>

        <div className="mx-auto flex w-full min-w-0 flex-1 flex-col items-stretch justify-center gap-6 lg:flex-row lg:items-center">
        <section className="deed-sheet flex w-full max-w-md flex-col overflow-hidden lg:flex-none">
          <header
            className="deed-sheet__band"
            style={{ backgroundColor: "#e9a46c" }}
          >
            <p className="deed-sheet__kicker deed-sheet__kicker--dark">
              {t("lobby.section")}
            </p>
            <h2 className="deed-sheet__title deed-sheet__title--dark text-xl">
              {phase === "home"
                ? t("lobby.headingCreate")
                : phase === "local"
                  ? t("lobby.headingLocal")
                  : phase === "host"
                    ? t("lobby.headingHost")
                    : t("lobby.headingJoin")}
            </h2>
            <p className="deed-sheet__sub deed-sheet__sub--dark">
              {t("lobby.startingCash", { cash: formatCash(STARTING_CASH) })}
            </p>
          </header>

          <div className="deed-sheet__body min-h-0 flex-1 space-y-4 overflow-y-auto">
            {phase === "home" ? (
              <>
                {allowLocalHotSeat ? (
                  <button
                    type="button"
                    className="lobby-cta lobby-cta--dev"
                    onClick={() => {
                      playFormClick();
                      setError(null);
                      setHomePanel(null);
                      setPhase("local");
                    }}
                  >
                    <span className="lobby-cta__title">
                      {t("lobby.playLocal")}
                    </span>
                    <span className="lobby-cta__sub">
                      {t("lobby.playLocalSub")}
                    </span>
                  </button>
                ) : null}

                {homePanel === null ? (
                  <>
                    <button
                      type="button"
                      className="lobby-cta lobby-cta--create"
                      disabled={!online}
                      onClick={() => {
                        playFormClick();
                        setError(null);
                        setHomePanel("host");
                      }}
                    >
                      <span className="lobby-cta__title">
                        {t("lobby.createRoom")}
                      </span>
                      <span className="lobby-cta__sub">
                        {t("lobby.createRoomSub")}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="lobby-cta lobby-cta--join"
                      onClick={() => {
                        playFormClick();
                        setError(null);
                        setHomePanel("join");
                      }}
                    >
                      <span className="lobby-cta__title">
                        {t("lobby.joinRoom")}
                      </span>
                      <span className="lobby-cta__sub">
                        {t("lobby.joinRoomSub")}
                      </span>
                    </button>
                    {!online ? (
                      <p className="deed-sheet__note">
                        {t("lobby.needSupabaseHint")}
                      </p>
                    ) : null}
                  </>
                ) : null}

                {homePanel === "host" ? (
                  <div className="rounded-xl border-2 border-[#5c3d2e] bg-white/80 p-3 shadow-[3px_3px_0_rgba(92,61,46,0.2)]">
                    <h3 className="deed-sheet__section-title">
                      {t("lobby.createRoom")}
                    </h3>
                    <p className="deed-sheet__note mb-2">
                      {t("lobby.hostPanelNote")}
                    </p>
                    <label className="mb-3 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                      {t("lobby.playerCount")}
                      <select
                        className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-2 font-bold text-[#5c3d2e]"
                        value={maxPlayers}
                        onChange={(e) =>
                          setMaxPlayers(Number(e.target.value))
                        }
                      >
                        {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {t("lobby.players_other", { count: n })}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className="deed-btn deed-btn--soft flex-1"
                        onClick={() => {
                          playBack();
                          setHomePanel(null);
                        }}
                      >
                        {t("common.back")}
                      </button>
                      <button
                        type="button"
                        className="deed-btn deed-btn--mint flex-1"
                        disabled={busy || !online}
                        onClick={createAsHost}
                      >
                        {busy ? t("lobby.creating") : t("lobby.createAndQr")}
                      </button>
                    </div>
                  </div>
                ) : null}

                {homePanel === "join" ? (
                  <div className="rounded-xl border-2 border-[#5c3d2e] bg-white/80 p-3 shadow-[3px_3px_0_rgba(92,61,46,0.2)]">
                    <h3 className="deed-sheet__section-title">
                      {t("lobby.joinRoom")}
                    </h3>
                    <p className="deed-sheet__note mb-2">
                      {t("lobby.joinPanelNote")}
                    </p>
                    <label className="mb-3 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                      {t("lobby.roomCode")}
                      <input
                        className="rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 font-bold uppercase tracking-widest text-[#5c3d2e]"
                        value={roomIdInput}
                        maxLength={8}
                        placeholder={t("lobby.roomCodePlaceholder")}
                        autoFocus
                        onChange={(e) =>
                          setRoomIdInput(e.target.value.toUpperCase())
                        }
                      />
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className="deed-btn deed-btn--soft flex-1"
                        onClick={() => {
                          playBack();
                          setHomePanel(null);
                        }}
                      >
                        {t("common.back")}
                      </button>
                      <button
                        type="button"
                        className="deed-btn deed-btn--amber flex-1"
                        onClick={enterAsGuest}
                      >
                        {t("common.continue")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {phase === "local" && allowLocalHotSeat ? (
              <>
                <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                  {t("lobby.playerCount")}
                  <select
                    className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-2 font-bold text-[#5c3d2e]"
                    value={localSeats.length}
                    onChange={(e) => setLocalCount(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {t("lobby.players_other", { count: n })}
                      </option>
                    ))}
                  </select>
                </label>

                <ul className="m-0 list-none space-y-2 p-0">
                  {localSeats.map((seat, i) => {
                    const takenByOthers = new Set(
                      localSeats
                        .filter((_, j) => j !== i)
                        .map((s) => s.pawnId),
                    );
                    return (
                      <li
                        key={i}
                        className="rounded-xl border-2 border-[#5c3d2e] bg-white/80 p-2 shadow-[2px_2px_0_rgba(92,61,46,0.2)]"
                      >
                        <div className="flex items-start gap-2">
                          <LobbyPawnToken pawnId={seat.pawnId} size={36} />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <input
                              aria-label={t("lobby.playerName", { n: i + 1 })}
                              className="w-full rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 text-sm font-bold text-[#5c3d2e]"
                              value={seat.name}
                              maxLength={24}
                              onChange={(e) =>
                                updateLocalSeat(i, { name: e.target.value })
                              }
                            />
                            <LobbyPawnPicker
                              value={seat.pawnId}
                              options={PAWNS.filter(
                                (p) =>
                                  p.id === seat.pawnId ||
                                  !takenByOthers.has(p.id),
                              ).map((p) => p.id)}
                              onChange={(pawnId) =>
                                updateLocalSeat(i, { pawnId })
                              }
                            />
                          </div>
                        </div>
                        <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#6b5344]">
                          <input
                            type="radio"
                            name="local-banker"
                            checked={localBanker === i}
                            onChange={() => setLocalBanker(i)}
                          />
                          {t("lobby.banker")}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}

            {phase === "host" && room ? (
              <>
                <div className="text-center">
                  <p className="m-0 text-xs font-bold uppercase tracking-wide text-[#8a6a4e]">
                    {t("lobby.roomCode")}
                  </p>
                  <p className="m-0 font-[family-name:var(--font-game)] text-3xl font-bold tracking-[0.2em] text-[#9a3412]">
                    {room.roomId}
                  </p>
                  <p className="deed-sheet__note mt-1">
                    {t("lobby.roomMeta", { max: room.maxPlayers })}
                  </p>
                </div>

                {qrDataUrl ? (
                  <div className="mx-auto w-fit rounded-xl border-2 border-[#5c3d2e] bg-[#fff7ed] p-3 shadow-[3px_3px_0_rgba(92,61,46,0.25)]">
                    <img
                      src={qrDataUrl}
                      alt={t("lobby.qrAlt", { code: room.roomId })}
                      width={220}
                      height={220}
                      className="block"
                    />
                  </div>
                ) : null}

                <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                  {t("lobby.guestLinkLabel")}
                  <input
                    readOnly
                    value={joinUrl}
                    className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-1.5 text-xs font-bold text-[#5c3d2e]"
                    onFocus={(e) => e.target.select()}
                  />
                </label>
                <button
                  type="button"
                  className="deed-btn deed-btn--soft w-full"
                  onClick={() => void copyLink()}
                >
                  {copied ? t("lobby.linkCopied") : t("lobby.copyLink")}
                </button>

                {isLocalhostJoinUrl(joinUrl) ? (
                  <p className="rounded-lg border-2 border-[#b45309] bg-[#fff7ed] px-3 py-2 text-xs font-bold text-[#9a3412]">
                    {t("lobby.localhostWarning")}
                  </p>
                ) : null}

                <MemberList room={room} />

                <p className="deed-sheet__note">{t("lobby.realtimeNote")}</p>
              </>
            ) : null}

            {phase === "guest" && room ? (
              <>
                <p className="m-0 text-center font-[family-name:var(--font-game)] text-2xl font-bold tracking-widest text-[#9a3412]">
                  {room.roomId}
                </p>
                <p className="deed-sheet__note text-center">
                  {t("lobby.inRoomCount", {
                    current: room.members.length,
                    max: room.maxPlayers,
                  })}
                </p>

                {!iAmInRoom ? (
                  <button
                    type="button"
                    className="deed-btn deed-btn--mint w-full"
                    onClick={confirmGuestJoin}
                  >
                    {t("lobby.joinRoom")}
                  </button>
                ) : (
                  <p className="rounded-lg border-2 border-[#5c3d2e] bg-[#ecfdf5] px-3 py-2 text-sm font-bold text-[#166534]">
                    {t("lobby.inRoomWaiting")}
                  </p>
                )}

                <MemberList room={room} />
              </>
            ) : null}

            {error ? <p className="deed-sheet__error">{error}</p> : null}
          </div>

          <footer className="deed-sheet__footer">
            {phase === "local" && allowLocalHotSeat ? (
              <div className="deed-sheet__actions">
                <button
                  type="button"
                  className="deed-btn deed-btn--soft flex-1"
                  onClick={leaveToHome}
                >
                  {t("common.back")}
                </button>
                <button
                  type="button"
                  className="deed-btn deed-btn--mint flex-1"
                  onClick={startLocal}
                >
                  {t("lobby.startMatch")}
                </button>
              </div>
            ) : phase === "host" && iAmHost ? (
              <div className="deed-sheet__actions">
                <button
                  type="button"
                  className="deed-btn deed-btn--soft flex-1"
                  onClick={leaveToHome}
                >
                  {t("lobby.cancelRoom")}
                </button>
                <button
                  type="button"
                  className="deed-btn deed-btn--mint flex-1"
                  disabled={busy || (room?.members.length ?? 0) < 2}
                  onClick={beginMatch}
                >
                  {busy
                    ? t("lobby.starting")
                    : room
                      ? t("lobby.startWithCount", {
                          current: room.members.length,
                          max: room.maxPlayers,
                        })
                      : t("lobby.start")}
                </button>
              </div>
            ) : phase !== "home" ? (
              <button
                type="button"
                className="deed-btn deed-btn--soft w-full"
                onClick={leaveToHome}
              >
                {t("common.back")}
              </button>
            ) : null}
          </footer>
        </section>

        {showPawnCarousel ? (
          <div className="lobby-identity">
            <label className="lobby-identity__name">
              {t("lobby.hostName")}
              <input
                value={phase === "guest" ? guestName : hostName}
                maxLength={24}
                placeholder={
                  phase === "guest"
                    ? t("lobby.guestNamePlaceholder")
                    : t("lobby.hostNamePlaceholder")
                }
                onChange={(e) =>
                  phase === "guest"
                    ? setGuestName(e.target.value)
                    : setHostName(e.target.value)
                }
              />
            </label>
            {phase === "host" ? (
              <button
                type="button"
                className="deed-btn deed-btn--soft w-full text-xs"
                onClick={saveHostProfile}
              >
                {t("lobby.updateProfile")}
              </button>
            ) : null}
            <LobbyPawnCarousel
              value={carouselValue}
              options={carouselOptions}
              taken={phase === "home" ? undefined : usedPawns}
              onChange={setCarouselValue}
            />
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}

function MemberList({ room }: { room: RoomState }) {
  const { t } = useTranslation();
  return (
    <ul className="m-0 list-none space-y-1.5 p-0">
      {Array.from({ length: room.maxPlayers }, (_, i) => {
        const member = room.members[i];
        if (!member) {
          return (
            <li
              key={`empty-${i}`}
              className="rounded-lg border-2 border-dashed border-[#5c3d2e]/50 px-3 py-2 text-xs font-bold text-[#8a6a4e]"
            >
              {t("lobby.waitingPlayer", { n: i + 1 })}
            </li>
          );
        }
        const def = getPawnDef(member.pawnId);
        return (
          <li
            key={member.clientId}
            className="flex items-center gap-2.5 rounded-lg border-2 border-[#5c3d2e] bg-white/80 px-2.5 py-2 text-xs font-bold text-[#5c3d2e]"
          >
            <LobbyPawnToken pawnId={member.pawnId} size={40} />
            <span className="min-w-0 flex-1 truncate">
              {member.name}
              {member.isHost ? t("lobby.hostBankerTag") : ""}
            </span>
            <span className="text-[#8a6a4e]">{def.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
