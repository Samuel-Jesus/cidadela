import type { DiceRoll } from "@cidadela/engine";
import {
  COLOR_GROUP_LABELS,
  DECK_LABELS,
  KIND_LABELS,
  deckIdFromSpaceKind,
  findPropertyOwner,
  formatCash,
  getPawnDef,
  getSpace,
  isBuyableKind,
  type BoardSpace,
  type DecksState,
  type PlayerState,
} from "@cidadela/shared";

type Props = {
  selectedIndex: number | null;
  players: PlayerState[];
  activePlayerId: string | null;
  playerCount: number;
  diceRoll: DiceRoll | null;
  diceRolling: boolean;
  consecutiveDoubles: number;
  decks: DecksState;
  onSelectPlayer: (playerId: string) => void;
  onPlayerCountChange: (count: number) => void;
  onMoveActiveToSelected: () => void;
  onAdvanceActive: (steps: number) => void;
  onRollDice: () => void;
  onBuySelected: () => void;
  onDrawCard: () => void;
};

export function BoardHud({
  selectedIndex,
  players,
  activePlayerId,
  playerCount,
  diceRoll,
  diceRolling,
  consecutiveDoubles,
  decks,
  onSelectPlayer,
  onPlayerCountChange,
  onMoveActiveToSelected,
  onAdvanceActive,
  onRollDice,
  onBuySelected,
  onDrawCard,
}: Props) {
  const space = selectedIndex === null ? null : getSpace(selectedIndex);
  const active = players.find((p) => p.id === activePlayerId) ?? null;
  const owner =
    selectedIndex === null ? null : findPropertyOwner(players, selectedIndex);
  const canBuy =
    Boolean(
      active && space && space.price !== undefined && isBuyableKind(space.kind),
    ) &&
    !owner &&
    active !== null &&
    space !== null &&
    active.cash >= (space.price ?? Infinity);
  const cardDeck = space ? deckIdFromSpaceKind(space.kind) : null;
  const canDrawCard = Boolean(active && cardDeck && !diceRolling);

  return (
    <aside className="hud-panel pointer-events-auto absolute right-4 top-4 z-10 flex max-h-[calc(100dvh-2rem)] w-[19.5rem] flex-col gap-3 overflow-y-auto p-3.5">
      <header className="px-0.5">
        <p className="hud-kicker">Cidadela</p>
        <h1 className="hud-title mt-0.5 text-[1.65rem]">Tabuleiro da Bahia</h1>
        <p className="mt-1 text-xs font-semibold text-[#8a6a4e]">
          Rola, compra, ri e não vai pro Forte!
        </p>
      </header>

      <section className="hud-card space-y-2 p-2.5">
        <h2 className="hud-section-title">Baralhos</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className="hud-chip bg-[#fff7ae]">
            Fitinha
            <strong className="tabular-nums">
              {decks.fitinha.drawPile.length}/16
            </strong>
          </span>
          <span className="hud-chip bg-[#ffd0e0]">
            Bença
            <strong className="tabular-nums">
              {decks.benca.drawPile.length}/16
            </strong>
          </span>
        </div>
      </section>

      <section className="hud-card space-y-2 p-2.5">
        <h2 className="hud-section-title">Dados</h2>
        <p className="text-xs font-semibold leading-snug text-[#6b5344]">
          Toque duplo na bandeja do centro — ou no botão aqui embaixo.
        </p>
        <button
          type="button"
          disabled={!active || diceRolling}
          onClick={onRollDice}
          className="hud-btn hud-btn--primary w-full px-3 py-2.5 text-base"
        >
          {diceRolling ? "Rolando…" : "Rolar dados"}
        </button>

        {diceRoll ? (
          <div className="rounded-xl border-2 border-dashed border-[#5c3d2e]/40 bg-[#fffbeb] px-3 py-2">
            <p className="hud-dice-result text-xl text-[#5c3d2e]">
              {diceRoll.die1} + {diceRoll.die2} ={" "}
              <span className="text-[#c2410c]">{diceRoll.total}</span>
            </p>
            {diceRoll.isDouble ? (
              <p className="mt-1 text-xs font-bold text-[#b45309]">
                Dupla!{" "}
                {consecutiveDoubles >= 3
                  ? "3ª → Forte 😬"
                  : consecutiveDoubles > 0
                    ? `${consecutiveDoubles}/3 · joga de novo`
                    : "Joga de novo!"}
              </p>
            ) : (
              <p className="mt-1 text-xs font-semibold text-[#6b5344]">
                Avança {diceRoll.total} casas
              </p>
            )}
          </div>
        ) : null}
      </section>

      <section className="hud-card space-y-2 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="hud-section-title">Peões</h2>
          <label className="flex items-center gap-1.5 text-xs font-bold text-[#6b5344]">
            qtd
            <select
              className="rounded-lg border-2 border-[#5c3d2e] bg-white px-1.5 py-0.5 font-bold text-[#5c3d2e]"
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
                  className={`hud-player flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm font-bold transition ${
                    selected ? "hud-player--active" : "hover:-translate-y-0.5"
                  }`}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border-2 border-[#5c3d2e]"
                    style={{ backgroundColor: def.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-game)]">
                    {def.label}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-[#1f6b45]">
                    {formatCash(player.cash)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <button
            type="button"
            disabled={!active || diceRolling}
            onClick={() => onAdvanceActive(1)}
            className="hud-btn hud-btn--soft px-2.5 py-1.5 text-xs"
          >
            +1 casa
          </button>
          <button
            type="button"
            disabled={!active || selectedIndex === null || diceRolling}
            onClick={onMoveActiveToSelected}
            className="hud-btn hud-btn--soft px-2.5 py-1.5 text-xs"
          >
            Ir à casa
          </button>
        </div>
      </section>

      {space ? (
        <section className="hud-card p-2.5">
          <SpaceDetails
            space={space}
            owner={owner}
            canBuy={canBuy}
            buyDisabled={!active || diceRolling}
            onBuy={onBuySelected}
            canDrawCard={canDrawCard}
            drawDisabled={!canDrawCard}
            onDrawCard={onDrawCard}
            cardDeckLabel={cardDeck ? DECK_LABELS[cardDeck] : null}
          />
        </section>
      ) : null}
    </aside>
  );
}

function SpaceDetails({
  space,
  owner,
  canBuy,
  buyDisabled,
  onBuy,
  canDrawCard,
  drawDisabled,
  onDrawCard,
  cardDeckLabel,
}: {
  space: BoardSpace;
  owner: PlayerState | null;
  canBuy: boolean;
  buyDisabled: boolean;
  onBuy: () => void;
  canDrawCard: boolean;
  drawDisabled: boolean;
  onDrawCard: () => void;
  cardDeckLabel: string | null;
}) {
  const ownerDef = owner ? getPawnDef(owner.pawnId) : null;

  return (
    <div className="space-y-2 text-sm">
      <p className="hud-kicker">Casa nº {space.index}</p>
      <h2 className="font-[family-name:var(--font-game)] text-lg font-bold leading-snug text-[#9a3412]">
        {space.name}
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs font-semibold">
        <dt className="text-[#8a6a4e]">Tipo</dt>
        <dd>{KIND_LABELS[space.kind]}</dd>
        {space.colorGroup ? (
          <>
            <dt className="text-[#8a6a4e]">Grupo</dt>
            <dd>{COLOR_GROUP_LABELS[space.colorGroup]}</dd>
          </>
        ) : null}
        {space.price !== undefined ? (
          <>
            <dt className="text-[#8a6a4e]">Preço</dt>
            <dd className="tabular-nums text-[#1f6b45]">
              {formatCash(space.price)}
            </dd>
          </>
        ) : null}
        {space.taxAmount !== undefined ? (
          <>
            <dt className="text-[#8a6a4e]">Taxa</dt>
            <dd>Pague {formatCash(space.taxAmount)}</dd>
          </>
        ) : null}
        {space.price !== undefined && isBuyableKind(space.kind) ? (
          <>
            <dt className="text-[#8a6a4e]">Dono</dt>
            <dd className="flex items-center gap-1.5">
              {ownerDef ? (
                <>
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-[#5c3d2e]"
                    style={{ backgroundColor: ownerDef.color }}
                  />
                  {ownerDef.label}
                </>
              ) : (
                <span className="text-[#8a6a4e]">Banco</span>
              )}
            </dd>
          </>
        ) : null}
      </dl>

      {canBuy ? (
        <button
          type="button"
          disabled={buyDisabled}
          onClick={onBuy}
          className="hud-btn hud-btn--mint mt-1 w-full px-3 py-2 text-sm"
        >
          Comprar por {formatCash(space.price!)}
        </button>
      ) : null}

      {canDrawCard && cardDeckLabel ? (
        <button
          type="button"
          disabled={drawDisabled}
          onClick={onDrawCard}
          className="hud-btn hud-btn--pink mt-1 w-full px-3 py-2 text-sm"
        >
          Tirar carta · {cardDeckLabel}
        </button>
      ) : null}
    </div>
  );
}
