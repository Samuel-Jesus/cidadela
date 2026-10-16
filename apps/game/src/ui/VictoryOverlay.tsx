import {
  formatCash,
  getPawnDef,
  type PlayerState,
} from "@cidadela/shared";

type Props = {
  winner: PlayerState;
  players: PlayerState[];
  onNewGame: () => void;
};

export function VictoryOverlay({ winner, players, onNewGame }: Props) {
  const def = getPawnDef(winner.pawnId);
  const falidos = players.filter((p) => p.bankrupt);

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Fim de jogo"
    >
      <div className="deed-sheet flex w-full max-w-md flex-col overflow-hidden">
        <header
          className="deed-sheet__band"
          style={{ backgroundColor: def.color }}
        >
          <p className="deed-sheet__kicker deed-sheet__kicker--dark">
            Fim de jogo
          </p>
          <h3 className="deed-sheet__title deed-sheet__title--dark text-2xl">
            {def.label} venceu!
          </h3>
          <p className="deed-sheet__sub deed-sheet__sub--dark">
            Último jogador de pé · {formatCash(winner.cash)} em caixa
          </p>
        </header>

        <div className="deed-sheet__body">
          <p className="m-0 text-sm font-bold leading-relaxed text-[#5c3d2e]">
            Todos os outros foram à falência. A Cidadela é sua.
          </p>

          {falidos.length > 0 ? (
            <ul className="mt-3 m-0 list-none space-y-1.5 p-0">
              {falidos.map((p) => {
                const d = getPawnDef(p.pawnId);
                return (
                  <li
                    key={p.id}
                    className="rounded-lg border-2 border-[#5c3d2e] bg-white/70 px-3 py-2 text-xs font-bold text-[#6b5344] opacity-80"
                  >
                    <span
                      className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border border-[#5c3d2e]"
                      style={{ backgroundColor: d.color }}
                    />
                    {d.label} · falido
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <footer className="deed-sheet__footer">
          <button
            type="button"
            className="deed-btn deed-btn--amber w-full"
            onClick={onNewGame}
          >
            Nova partida
          </button>
        </footer>
      </div>
    </div>
  );
}
