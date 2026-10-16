import {
  COLOR_GROUP_LABELS,
  KIND_LABELS,
  getPawnDef,
  getSpace,
  type BoardSpace,
  type PlayerState,
} from "@cidadela/shared";

type Props = {
  selectedIndex: number | null;
  players: PlayerState[];
  activePlayerId: string | null;
  playerCount: number;
  onSelectPlayer: (playerId: string) => void;
  onPlayerCountChange: (count: number) => void;
  onMoveActiveToSelected: () => void;
  onAdvanceActive: (steps: number) => void;
};

export function BoardHud({
  selectedIndex,
  players,
  activePlayerId,
  playerCount,
  onSelectPlayer,
  onPlayerCountChange,
  onMoveActiveToSelected,
  onAdvanceActive,
}: Props) {
  const space = selectedIndex === null ? null : getSpace(selectedIndex);
  const active = players.find((p) => p.id === activePlayerId) ?? null;

  return (
    <aside className="pointer-events-auto absolute right-4 top-4 z-10 flex max-h-[calc(100dvh-2rem)] w-80 flex-col gap-3 overflow-y-auto rounded-xl border border-[#c4a484]/40 bg-gradient-to-b from-[#2a1c14]/95 to-[#1a120c]/95 p-4 text-[#f5f0e8] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-[#d4a373]">
          Cidadela · Three.js
        </p>
        <h1 className="font-serif text-xl leading-tight">Tabuleiro 3D</h1>
      </div>

      <section className="space-y-2 border-t border-[#c4a484]/25 pt-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[#d4a373]">Peões</h2>
          <label className="flex items-center gap-2 text-xs text-[#c9ada7]">
            Jogadores
            <select
              className="rounded border border-[#c4a484]/40 bg-[#1a120c] px-2 py-1 text-[#f5f0e8]"
              value={playerCount}
              onChange={(e) => onPlayerCountChange(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ul className="space-y-1.5">
          {players.map((player) => {
            const def = getPawnDef(player.pawnId);
            const selected = player.id === activePlayerId;
            return (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => onSelectPlayer(player.id)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition ${
                    selected
                      ? "border-[#ffd166] bg-[#ffd166]/15"
                      : "border-transparent bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full ring-2 ring-black/30"
                    style={{ backgroundColor: def.color }}
                  />
                  <span className="flex-1">{def.label}</span>
                  <span className="text-xs text-[#c9ada7]">casa {player.position}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={!active}
            onClick={() => onAdvanceActive(1)}
            className="rounded-lg bg-[#d4a373] px-3 py-1.5 text-xs font-medium text-[#1a120c] disabled:opacity-40"
          >
            Avançar 1
          </button>
          <button
            type="button"
            disabled={!active}
            onClick={() => onAdvanceActive(2)}
            className="rounded-lg bg-[#c4a484]/30 px-3 py-1.5 text-xs text-[#f5f0e8] disabled:opacity-40"
          >
            Avançar 2
          </button>
          <button
            type="button"
            disabled={!active || selectedIndex === null}
            onClick={onMoveActiveToSelected}
            className="rounded-lg bg-[#c4a484]/30 px-3 py-1.5 text-xs text-[#f5f0e8] disabled:opacity-40"
          >
            Ir à casa selecionada
          </button>
        </div>

        {active ? (
          <p className="text-xs text-[#c9ada7]">
            Ativo: <span className="text-[#ffd166]">{getPawnDef(active.pawnId).label}</span>
          </p>
        ) : null}
      </section>

      {space ? (
        <section className="border-t border-[#c4a484]/25 pt-3">
          <SpaceDetails space={space} />
        </section>
      ) : (
        <p className="border-t border-[#c4a484]/25 pt-3 text-sm text-[#c9ada7]">
          Clique em uma casa para ver os detalhes.
        </p>
      )}
    </aside>
  );
}

function SpaceDetails({ space }: { space: BoardSpace }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-[#d4a373]">Casa nº {space.index}</p>
      <h2 className="font-serif text-lg leading-snug text-white">{space.name}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        <dt className="text-[#c9ada7]">Tipo</dt>
        <dd>{KIND_LABELS[space.kind]}</dd>

        {space.colorGroup ? (
          <>
            <dt className="text-[#c9ada7]">Grupo</dt>
            <dd>{COLOR_GROUP_LABELS[space.colorGroup]}</dd>
          </>
        ) : null}

        {space.price !== undefined ? (
          <>
            <dt className="text-[#c9ada7]">Preço</dt>
            <dd>${space.price}</dd>
          </>
        ) : null}

        {space.taxAmount !== undefined ? (
          <>
            <dt className="text-[#c9ada7]">Taxa</dt>
            <dd>Pague ${space.taxAmount}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}
