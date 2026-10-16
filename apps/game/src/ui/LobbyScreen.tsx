import { useMemo, useState } from "react";
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

type Props = {
  onStart: (setup: LobbySetup) => void;
};

function defaultSeats(count: number): LobbySeat[] {
  return PAWNS.slice(0, count).map((p) => ({
    name: p.label,
    pawnId: p.id,
  }));
}

export function LobbyScreen({ onStart }: Props) {
  const [count, setCount] = useState(4);
  const [seats, setSeats] = useState<LobbySeat[]>(() => defaultSeats(4));
  const [bankerIndex, setBankerIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const usedPawns = useMemo(
    () => new Set(seats.map((s) => s.pawnId)),
    [seats],
  );

  const setPlayerCount = (n: number) => {
    const next = Math.min(8, Math.max(2, n));
    setCount(next);
    setSeats((prev) => {
      if (next <= prev.length) return prev.slice(0, next);
      const extra = defaultSeats(next).slice(prev.length);
      const taken = new Set(prev.map((s) => s.pawnId));
      const filled = extra.map((seat) => {
        if (!taken.has(seat.pawnId)) {
          taken.add(seat.pawnId);
          return seat;
        }
        const free = PAWNS.find((p) => !taken.has(p.id));
        const pawnId = free?.id ?? seat.pawnId;
        taken.add(pawnId);
        return { name: getPawnDef(pawnId).label, pawnId };
      });
      return [...prev, ...filled];
    });
    setBankerIndex((b) => Math.min(b, next - 1));
    setError(null);
  };

  const updateSeat = (index: number, patch: Partial<LobbySeat>) => {
    setSeats((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
    setError(null);
  };

  const availablePawnsFor = (index: number): PawnId[] => {
    const current = seats[index]?.pawnId;
    return PAWNS.filter(
      (p) => p.id === current || !usedPawns.has(p.id),
    ).map((p) => p.id);
  };

  const start = () => {
    const setup: LobbySetup = { seats, bankerIndex };
    const check = validateLobbySetup(setup);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    onStart(setup);
  };

  return (
    <div className="lobby relative flex min-h-dvh w-dvw flex-col overflow-y-auto">
      <div className="lobby__bg" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:py-12">
        <header className="mb-8 text-center sm:mb-10 sm:text-left">
          <p className="hud-kicker text-[#5eead4]">Tabuleiro da Bahia</p>
          <h1 className="font-[family-name:var(--font-game)] text-5xl font-bold leading-none tracking-tight text-[#fff7ed] sm:text-6xl">
            Cidadela
          </h1>
          <p className="mt-3 max-w-md text-sm font-semibold text-[#ffd7a8] sm:text-base">
            Monte a mesa: peões, nomes e quem é o banqueiro. Depois é só rolar
            os dados.
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
              Preparar partida
            </h2>
            <p className="deed-sheet__sub deed-sheet__sub--dark">
              Cada um começa com {formatCash(STARTING_CASH)} na Chegada
            </p>
          </header>

          <div className="deed-sheet__body min-h-0 flex-1 space-y-4 overflow-y-auto">
            <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
              Jogadores (2–8)
              <select
                className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-2 font-bold text-[#5c3d2e]"
                value={count}
                onChange={(e) => setPlayerCount(Number(e.target.value))}
              >
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} jogadores
                  </option>
                ))}
              </select>
            </label>

            <ul className="m-0 list-none space-y-3 p-0">
              {seats.map((seat, index) => {
                const def = getPawnDef(seat.pawnId);
                const isBanker = index === bankerIndex;
                return (
                  <li
                    key={index}
                    className={`rounded-xl border-2 border-[#5c3d2e] p-3 shadow-[3px_3px_0_rgba(92,61,46,0.25)] ${
                      isBanker ? "bg-[#fef08a]" : "bg-white/80"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border-2 border-[#5c3d2e]"
                        style={{ backgroundColor: def.color }}
                      />
                      <span className="font-[family-name:var(--font-game)] text-sm font-bold text-[#9a3412]">
                        Assento {index + 1}
                        {isBanker ? " · Banqueiro" : ""}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                        Nome
                        <input
                          type="text"
                          maxLength={24}
                          value={seat.name}
                          onChange={(e) =>
                            updateSeat(index, { name: e.target.value })
                          }
                          className="rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 font-bold text-[#5c3d2e]"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                        Peão
                        <select
                          className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-1.5 font-bold text-[#5c3d2e]"
                          value={seat.pawnId}
                          onChange={(e) =>
                            updateSeat(index, {
                              pawnId: e.target.value as PawnId,
                            })
                          }
                        >
                          {availablePawnsFor(index).map((id) => {
                            const p = getPawnDef(id);
                            return (
                              <option key={id} value={id}>
                                {p.label}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    </div>

                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-bold text-[#5c3d2e]">
                      <input
                        type="radio"
                        name="banker"
                        checked={isBanker}
                        onChange={() => setBankerIndex(index)}
                      />
                      Este assento é o banqueiro
                    </label>
                  </li>
                );
              })}
            </ul>

            {error ? <p className="deed-sheet__error">{error}</p> : null}
          </div>

          <footer className="deed-sheet__footer">
            <button
              type="button"
              className="deed-btn deed-btn--mint w-full py-3 text-base"
              onClick={start}
            >
              Começar partida
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
