import type { DiceRoll } from "@cidadela/engine";
import {
  BANK_POUSADAS_MAX,
  BANK_RESORTS_MAX,
  COLOR_GROUP_LABELS,
  DECK_LABELS,
  JAIL_FINE,
  JAIL_MAX_ATTEMPTS,
  KIND_LABELS,
  bankStockFromPlayers,
  deckIdFromSpaceKind,
  findPropertyOwner,
  formatCash,
  getPawnDef,
  getSpace,
  isBuyableKind,
  type BoardSpace,
  type DebtInfo,
  type DecksState,
  type PlayerState,
} from "@cidadela/shared";

type TurnPhase = "roll" | "busy" | "action" | "debt" | "auction" | "ended";

type Props = {
  selectedIndex: number | null;
  players: PlayerState[];
  activePlayerId: string | null;
  playerCount: number;
  diceRoll: DiceRoll | null;
  diceRolling: boolean;
  consecutiveDoubles: number;
  decks: DecksState;
  turnPhase: TurnPhase;
  turnHint: string | null;
  jailError: string | null;
  pendingDebt: DebtInfo | null;
  debtRaisable: number;
  auctionQueueCount: number;
  onSelectPlayer: (playerId: string) => void;
  onPlayerCountChange: (count: number) => void;
  onMoveActiveToSelected: () => void;
  onAdvanceActive: (steps: number) => void;
  onRollDice: () => void;
  onBuySelected: () => void;
  onDrawCard: () => void;
  onPassTurn: () => void;
  onPayJailFine: () => void;
  onUseJailProtection: () => void;
  onPayDebt: () => void;
  onLiquidateForDebt: () => void;
  onDeclareBankruptcy: () => void;
  onOpenTrade: () => void;
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
  turnPhase,
  turnHint,
  jailError,
  pendingDebt,
  debtRaisable,
  auctionQueueCount,
  onPlayerCountChange,
  onMoveActiveToSelected,
  onAdvanceActive,
  onRollDice,
  onBuySelected,
  onDrawCard,
  onPassTurn,
  onPayJailFine,
  onUseJailProtection,
  onPayDebt,
  onLiquidateForDebt,
  onDeclareBankruptcy,
  onOpenTrade,
}: Props) {
  const space = selectedIndex === null ? null : getSpace(selectedIndex);
  const active = players.find((p) => p.id === activePlayerId) ?? null;
  const activeDef = active ? getPawnDef(active.pawnId) : null;
  const owner =
    selectedIndex === null ? null : findPropertyOwner(players, selectedIndex);
  const canBuy =
    turnPhase === "action" &&
    Boolean(
      active && space && space.price !== undefined && isBuyableKind(space.kind),
    ) &&
    !owner &&
    active !== null &&
    space !== null &&
    active.cash >= (space.price ?? Infinity);
  const cardDeck = space ? deckIdFromSpaceKind(space.kind) : null;
  const canDrawCard = Boolean(
    active && cardDeck && turnPhase !== "busy" && !diceRolling,
  );
  const bankStock = bankStockFromPlayers(players);

  return (
    <aside className="hud-panel pointer-events-auto absolute right-4 top-4 z-10 flex max-h-[calc(100dvh-2rem)] w-[19.5rem] flex-col gap-3 overflow-y-auto p-3.5">
      <header className="px-0.5">
        <p className="hud-kicker">Cidadela</p>
        <h1 className="hud-title mt-0.5 text-[1.65rem]">Tabuleiro da Bahia</h1>
        {activeDef ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-[#5c3d2e] bg-[#fffbeb] px-2.5 py-1.5 shadow-[2px_2px_0_rgba(92,61,46,0.25)]">
            <span
              className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#5c3d2e]"
              style={{ backgroundColor: activeDef.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-game)] text-sm font-bold text-[#9a3412]">
                Vez de {activeDef.label}
              </p>
              {turnHint ? (
                <p className="text-[11px] font-bold text-[#6b5344]">{turnHint}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-xs font-semibold text-[#8a6a4e]">
            Rola, compra, ri e não vai pro Forte!
          </p>
        )}
        <p className="mt-1.5 text-[11px] font-bold tabular-nums text-[#6b5344]">
          Banco · {bankStock.pousadas}/{BANK_POUSADAS_MAX} pousadas ·{" "}
          {bankStock.resorts}/{BANK_RESORTS_MAX} resorts
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
        {active?.inJail && turnPhase === "roll" ? (
          <div className="space-y-2">
            <p className="text-xs font-bold leading-snug text-[#9a3412]">
              Preso no Forte · tentativa {active.jailAttempts}/
              {JAIL_MAX_ATTEMPTS}
            </p>
            <button
              type="button"
              disabled={diceRolling || active.cash < JAIL_FINE}
              onClick={onPayJailFine}
              className="hud-btn hud-btn--mint w-full px-3 py-2 text-sm"
            >
              Pagar ${JAIL_FINE} e sair
            </button>
            <button
              type="button"
              disabled={diceRolling || active.protectionCardIds.length === 0}
              onClick={onUseJailProtection}
              className="hud-btn hud-btn--pink w-full px-3 py-2 text-sm"
            >
              Usar Proteção
              {active.protectionCardIds.length > 0
                ? ` (${active.protectionCardIds.length})`
                : ""}
            </button>
            <p className="text-[11px] font-semibold text-[#6b5344]">
              Ou role os dados tentando uma dupla.
            </p>
            {jailError ? (
              <p className="rounded-lg border-2 border-[#5c3d2e] bg-[#fecaca] px-2 py-1.5 text-[11px] font-bold text-[#7f1d1d]">
                {jailError}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs font-semibold leading-snug text-[#6b5344]">
            Toque duplo na bandeja do centro — ou no botão aqui embaixo.
          </p>
        )}
        <button
          type="button"
          disabled={!active || diceRolling}
          onClick={onRollDice}
          className="hud-btn hud-btn--primary w-full px-3 py-2.5 text-base"
        >
          {diceRolling
            ? "Rolando…"
            : active?.inJail
              ? "Tentar dupla"
              : "Rolar dados"}
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
                <div
                  className={`hud-player flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm font-bold ${
                    selected ? "hud-player--active" : ""
                  } ${player.bankrupt ? "opacity-45" : ""}`}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border-2 border-[#5c3d2e]"
                    style={{ backgroundColor: def.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-game)]">
                    {def.label}
                    {player.bankrupt
                      ? " · falido"
                      : turnPhase === "ended"
                        ? " · vencedor"
                        : ""}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-[#1f6b45]">
                    {formatCash(player.cash)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {turnPhase === "debt" && pendingDebt && active ? (
          <div className="space-y-2 rounded-xl border-2 border-[#5c3d2e] bg-[#fff1f2] p-2.5">
            <p className="font-[family-name:var(--font-game)] text-sm font-bold text-[#9a3412]">
              Dívida: {formatCash(pendingDebt.amount)}
            </p>
            <p className="text-[11px] font-semibold text-[#6b5344]">
              {pendingDebt.reason}
              {pendingDebt.creditor.type === "player"
                ? " · a outro jogador"
                : " · ao banco"}
            </p>
            <p className="text-[11px] font-bold text-[#5c3d2e]">
              Caixa {formatCash(active.cash)} · liquidável até{" "}
              {formatCash(debtRaisable)}
            </p>
            <p className="text-[10px] font-semibold text-[#8a6a4e]">
              Abra a carteira pra vender construções/hipotecar, ou liquide
              tudo de uma vez.
            </p>
            <button
              type="button"
              disabled={active.cash < pendingDebt.amount}
              onClick={onPayDebt}
              className="hud-btn hud-btn--mint w-full px-2.5 py-2 text-sm"
            >
              Pagar dívida
            </button>
            <button
              type="button"
              onClick={onLiquidateForDebt}
              className="hud-btn hud-btn--soft w-full px-2.5 py-2 text-sm"
            >
              Liquidar tudo
            </button>
            <button
              type="button"
              onClick={onDeclareBankruptcy}
              className="hud-btn hud-btn--pink w-full px-2.5 py-2 text-sm"
            >
              Declarar falência
            </button>
          </div>
        ) : null}

        {auctionQueueCount > 0 && turnPhase !== "auction" ? (
          <p className="text-[11px] font-bold text-[#b45309]">
            Leilão na fila: {auctionQueueCount} escritura
            {auctionQueueCount === 1 ? "" : "s"}
          </p>
        ) : null}

        {turnPhase === "action" ? (
          <button
            type="button"
            onClick={onPassTurn}
            className="hud-btn hud-btn--soft w-full px-2.5 py-2 text-sm"
          >
            {canBuy ? "Não comprar · leilão" : "Passar a vez"}
          </button>
        ) : null}

        {active &&
        !active.bankrupt &&
        turnPhase !== "ended" &&
        turnPhase !== "auction" &&
        players.some((p) => !p.bankrupt && p.id !== active.id) ? (
          <button
            type="button"
            onClick={onOpenTrade}
            className="hud-btn hud-btn--amber w-full px-2.5 py-2 text-sm"
          >
            Negociar
          </button>
        ) : null}

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <button
            type="button"
            disabled={!active || diceRolling || turnPhase === "busy"}
            onClick={() => onAdvanceActive(1)}
            className="hud-btn hud-btn--soft px-2.5 py-1.5 text-xs"
          >
            +1 casa
          </button>
          <button
            type="button"
            disabled={
              !active ||
              selectedIndex === null ||
              diceRolling ||
              turnPhase === "busy"
            }
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
            buyDisabled={!canBuy}
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
