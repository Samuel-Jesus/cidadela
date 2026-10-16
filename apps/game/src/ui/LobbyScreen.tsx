import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  PAWNS,
  STARTING_CASH,
  formatCash,
  getPawnDef,
  type LobbySetup,
  type PawnId,
} from "@cidadela/shared";
import {
  clearRoomParam,
  createRoom,
  getClientId,
  joinRoom,
  loadRoom,
  readRoomParam,
  roomJoinUrl,
  startRoom,
  subscribeRoom,
  updateMemberProfile,
  type RoomState,
} from "../session/room";

type Props = {
  onStart: (setup: LobbySetup) => void;
};

type Phase = "home" | "host" | "guest";

export function LobbyScreen({ onStart }: Props) {
  const clientId = useMemo(() => getClientId(), []);
  const initialRoom = useMemo(() => readRoomParam(), []);

  const [phase, setPhase] = useState<Phase>(() =>
    initialRoom ? "guest" : "home",
  );
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [room, setRoom] = useState<RoomState | null>(() =>
    initialRoom ? loadRoom(initialRoom) : null,
  );
  const [roomIdInput, setRoomIdInput] = useState(initialRoom ?? "");
  const [hostName, setHostName] = useState("Anfitrião");
  const [hostPawn, setHostPawn] = useState<PawnId>("acaraje");
  const [guestName, setGuestName] = useState("");
  const [guestPawn, setGuestPawn] = useState<PawnId>("fitinha");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinUrl = room ? roomJoinUrl(room.roomId) : "";

  useEffect(() => {
    if (!room?.roomId) return;
    return subscribeRoom(room.roomId, (next) => {
      if (!next) return;
      setRoom(next);
      if (next.status === "started" && next.startedSetup) {
        clearRoomParam();
        onStart(next.startedSetup);
      }
    });
  }, [room?.roomId, onStart]);

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

  const createAsHost = () => {
    setError(null);
    const name = hostName.trim() || "Anfitrião";
    const state = createRoom(maxPlayers, {
      clientId,
      name,
      pawnId: hostPawn,
    });
    setRoom(state);
    setPhase("host");
    const url = new URL(window.location.href);
    url.searchParams.set("room", state.roomId);
    window.history.replaceState({}, "", url.toString());
  };

  const enterAsGuest = () => {
    setError(null);
    const id = roomIdInput.trim().toUpperCase();
    if (!id) {
      setError("Informe o código da sala.");
      return;
    }
    const existing = loadRoom(id);
    if (!existing) {
      setError("Sala não encontrada. Confira o código ou o QR.");
      return;
    }
    setRoom(existing);
    setPhase("guest");
    const url = new URL(window.location.href);
    url.searchParams.set("room", id);
    window.history.replaceState({}, "", url.toString());
  };

  const confirmGuestJoin = () => {
    if (!room) return;
    setError(null);
    const result = joinRoom(room.roomId, {
      clientId,
      name: guestName,
      pawnId: guestPawn,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRoom(result.state);
  };

  const saveHostProfile = () => {
    if (!room) return;
    const result = updateMemberProfile(room.roomId, clientId, {
      name: hostName,
      pawnId: hostPawn,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setRoom(result.state);
  };

  const beginMatch = () => {
    if (!room) return;
    const result = startRoom(room.roomId, clientId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRoom(result.state);
    if (result.state.startedSetup) {
      clearRoomParam();
      onStart(result.state.startedSetup);
    }
  };

  const copyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o link manualmente.");
    }
  };

  const leaveToHome = () => {
    clearRoomParam();
    setRoom(null);
    setPhase("home");
    setError(null);
  };

  const freePawnsFor = (current?: PawnId): PawnId[] =>
    PAWNS.filter((p) => p.id === current || !usedPawns.has(p.id)).map(
      (p) => p.id,
    );

  return (
    <div className="lobby relative flex min-h-dvh w-dvw flex-col overflow-y-auto">
      <div className="lobby__bg" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 sm:py-12">
        <header className="mb-8 text-center sm:mb-10 sm:text-left">
          <p className="hud-kicker text-[#5eead4]">Tabuleiro da Bahia</p>
          <h1 className="font-[family-name:var(--font-game)] text-5xl font-bold leading-none tracking-tight text-[#fff7ed] sm:text-6xl">
            Cidadela
          </h1>
          <p className="mt-3 max-w-md text-sm font-semibold text-[#ffd7a8] sm:text-base">
            O anfitrião monta a sala; os outros entram pelo link ou QR Code.
          </p>
        </header>

        <section className="deed-sheet flex flex-1 flex-col overflow-hidden">
          <header
            className="deed-sheet__band"
            style={{ backgroundColor: "#e9a46c" }}
          >
            <p className="deed-sheet__kicker deed-sheet__kicker--dark">
              Lobby
            </p>
            <h2 className="deed-sheet__title deed-sheet__title--dark text-xl">
              {phase === "home"
                ? "Criar ou entrar"
                : phase === "host"
                  ? "Sala do anfitrião"
                  : "Entrar na sala"}
            </h2>
            <p className="deed-sheet__sub deed-sheet__sub--dark">
              Cada um começa com {formatCash(STARTING_CASH)} na Chegada
            </p>
          </header>

          <div className="deed-sheet__body min-h-0 flex-1 space-y-4 overflow-y-auto">
            {phase === "home" ? (
              <>
                <div className="rounded-xl border-2 border-[#5c3d2e] bg-white/80 p-3 shadow-[3px_3px_0_rgba(92,61,46,0.2)]">
                  <h3 className="deed-sheet__section-title">Sou anfitrião</h3>
                  <label className="mb-2 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                    Quantidade de jogadores
                    <select
                      className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-2 font-bold text-[#5c3d2e]"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    >
                      {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n} jogadores
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mb-2 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                    Seu nome
                    <input
                      className="rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 font-bold text-[#5c3d2e]"
                      value={hostName}
                      maxLength={24}
                      onChange={(e) => setHostName(e.target.value)}
                    />
                  </label>
                  <label className="mb-3 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                    Seu peão
                    <select
                      className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-1.5 font-bold text-[#5c3d2e]"
                      value={hostPawn}
                      onChange={(e) =>
                        setHostPawn(e.target.value as PawnId)
                      }
                    >
                      {PAWNS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="deed-btn deed-btn--mint w-full"
                    onClick={createAsHost}
                  >
                    Criar sala e gerar QR
                  </button>
                </div>

                <div className="rounded-xl border-2 border-[#5c3d2e] bg-white/80 p-3 shadow-[3px_3px_0_rgba(92,61,46,0.2)]">
                  <h3 className="deed-sheet__section-title">Tenho um código</h3>
                  <label className="mb-3 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                    Código da sala
                    <input
                      className="rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 font-bold uppercase tracking-widest text-[#5c3d2e]"
                      value={roomIdInput}
                      maxLength={8}
                      placeholder="Ex.: A3K9PQ"
                      onChange={(e) =>
                        setRoomIdInput(e.target.value.toUpperCase())
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="deed-btn deed-btn--amber w-full"
                    onClick={enterAsGuest}
                  >
                    Continuar para entrar
                  </button>
                </div>
              </>
            ) : null}

            {phase === "host" && room ? (
              <>
                <div className="text-center">
                  <p className="m-0 text-xs font-bold uppercase tracking-wide text-[#8a6a4e]">
                    Código da sala
                  </p>
                  <p className="m-0 font-[family-name:var(--font-game)] text-3xl font-bold tracking-[0.2em] text-[#9a3412]">
                    {room.roomId}
                  </p>
                  <p className="deed-sheet__note mt-1">
                    Mesa para {room.maxPlayers} · você é o banqueiro
                  </p>
                </div>

                {qrDataUrl ? (
                  <div className="mx-auto w-fit rounded-xl border-2 border-[#5c3d2e] bg-[#fff7ed] p-3 shadow-[3px_3px_0_rgba(92,61,46,0.25)]">
                    <img
                      src={qrDataUrl}
                      alt={`QR Code da sala ${room.roomId}`}
                      width={220}
                      height={220}
                      className="block"
                    />
                  </div>
                ) : null}

                <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                  Link para convidados
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
                  {copied ? "Link copiado!" : "Copiar link"}
                </button>

                <div className="rounded-xl border-2 border-[#5c3d2e] bg-[#fef08a]/70 p-3">
                  <h3 className="deed-sheet__section-title">Seu perfil</h3>
                  <div className="mb-2 grid gap-2 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                      Nome
                      <input
                        className="rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 font-bold"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                      Peão
                      <select
                        className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-1.5 font-bold"
                        value={hostPawn}
                        onChange={(e) =>
                          setHostPawn(e.target.value as PawnId)
                        }
                      >
                        {freePawnsFor(hostPawn).map((id) => (
                          <option key={id} value={id}>
                            {getPawnDef(id).label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button
                    type="button"
                    className="deed-btn deed-btn--soft w-full text-xs"
                    onClick={saveHostProfile}
                  >
                    Atualizar meu perfil
                  </button>
                </div>

                <MemberList room={room} />

                <p className="deed-sheet__note">
                  MVP: o QR/link sincroniza entre abas do mesmo navegador.
                  Multiplayer em aparelhos diferentes entra na fase 2 (servidor).
                </p>
              </>
            ) : null}

            {phase === "guest" && room ? (
              <>
                <p className="m-0 text-center font-[family-name:var(--font-game)] text-2xl font-bold tracking-widest text-[#9a3412]">
                  {room.roomId}
                </p>
                <p className="deed-sheet__note text-center">
                  {room.members.length}/{room.maxPlayers} na sala
                </p>

                {!iAmInRoom ? (
                  <>
                    <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                      Seu nome
                      <input
                        className="rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 font-bold"
                        value={guestName}
                        maxLength={24}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                      Seu peão
                      <select
                        className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-1.5 font-bold"
                        value={guestPawn}
                        onChange={(e) =>
                          setGuestPawn(e.target.value as PawnId)
                        }
                      >
                        {freePawnsFor(guestPawn).map((id) => (
                          <option key={id} value={id}>
                            {getPawnDef(id).label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="deed-btn deed-btn--mint w-full"
                      onClick={confirmGuestJoin}
                    >
                      Entrar na sala
                    </button>
                  </>
                ) : (
                  <p className="rounded-lg border-2 border-[#5c3d2e] bg-[#ecfdf5] px-3 py-2 text-sm font-bold text-[#166534]">
                    Você está na sala. Aguarde o anfitrião começar a partida.
                  </p>
                )}

                <MemberList room={room} />
              </>
            ) : null}

            {error ? <p className="deed-sheet__error">{error}</p> : null}
          </div>

          <footer className="deed-sheet__footer">
            {phase === "host" && iAmHost ? (
              <div className="deed-sheet__actions">
                <button
                  type="button"
                  className="deed-btn deed-btn--soft flex-1"
                  onClick={leaveToHome}
                >
                  Cancelar sala
                </button>
                <button
                  type="button"
                  className="deed-btn deed-btn--mint flex-1"
                  disabled={(room?.members.length ?? 0) < 2}
                  onClick={beginMatch}
                >
                  Começar
                  {room
                    ? ` (${room.members.length}/${room.maxPlayers})`
                    : ""}
                </button>
              </div>
            ) : phase !== "home" ? (
              <button
                type="button"
                className="deed-btn deed-btn--soft w-full"
                onClick={leaveToHome}
              >
                Voltar
              </button>
            ) : null}
          </footer>
        </section>
      </div>
    </div>
  );
}

function MemberList({ room }: { room: RoomState }) {
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
              Aguardando jogador {i + 1}…
            </li>
          );
        }
        const def = getPawnDef(member.pawnId);
        return (
          <li
            key={member.clientId}
            className="flex items-center gap-2 rounded-lg border-2 border-[#5c3d2e] bg-white/80 px-3 py-2 text-xs font-bold text-[#5c3d2e]"
          >
            <span
              className="inline-block h-3 w-3 rounded-full border border-[#5c3d2e]"
              style={{ backgroundColor: def.color }}
            />
            <span className="min-w-0 flex-1 truncate">
              {member.name}
              {member.isHost ? " · anfitrião / banqueiro" : ""}
            </span>
            <span className="text-[#8a6a4e]">{def.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
