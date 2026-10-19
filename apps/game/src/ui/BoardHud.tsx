import type { DiceRoll } from "@cidadela/engine";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BANK_POUSADAS_MAX,
  BANK_RESORTS_MAX,
  JAIL_FINE,
  JAIL_MAX_ATTEMPTS,
  bankStockFromPlayers,
  deckIdFromSpaceKind,
  findPropertyOwner,
  formatCash,
  getPawnDef,
  getPlayerLabel,
  getSpace,
  isBuyableKind,
  type DebtInfo,
  type DecksState,
  type PendingRentClaim,
  type PlayerState,
} from "@cidadela/shared";
import { tDeckLabel } from "../i18n/tCard";
import { LanguagePicker } from "./LanguagePicker";

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
  pendingRent: PendingRentClaim | null;
  debtRaisable: number;
  auctionQueueCount: number;
  controlsTurn?: boolean;
  isOnline?: boolean;
  localPlayerId?: string | null;
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
  onForfeitToBank: () => void;
  onOpenTrade: () => void;
  onClaimRent: () => void;
  /** Proposta já enviada — esconde o botão Negociar. */
  tradeBlocked?: boolean;
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
  pendingRent,
  debtRaisable,
  auctionQueueCount,
  controlsTurn = true,
  isOnline = false,
  localPlayerId = null,
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
  onForfeitToBank,
  onOpenTrade,
  onClaimRent,
  tradeBlocked = false,
}: Props) {
  const { t } = useTranslation();
  const [isNarrow, setIsNarrow] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setIsNarrow(mq.matches);
      if (!mq.matches) setMobileExpanded(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (pendingDebt || pendingRent) setDesktopCollapsed(false);
  }, [pendingDebt, pendingRent]);

  const showExtras = !isNarrow || mobileExpanded;
  const space = selectedIndex === null ? null : getSpace(selectedIndex);
  const active = players.find((p) => p.id === activePlayerId) ?? null;
  const activeDef = active ? getPawnDef(active.pawnId) : null;
  const forfeitPlayer = isOnline
    ? (players.find((p) => p.id === localPlayerId) ?? null)
    : active;
  const canForfeit =
    Boolean(forfeitPlayer) &&
    !forfeitPlayer!.bankrupt &&
    turnPhase !== "ended" &&
    turnPhase !== "auction" &&
    turnPhase !== "busy" &&
    players.filter((p) => !p.bankrupt).length > 1 &&
    (controlsTurn ||
      (turnPhase === "debt" && pendingDebt?.debtorId === forfeitPlayer!.id));
  const confirmForfeit = () => {
    if (!window.confirm(t("hud.forfeitConfirm"))) return;
    onForfeitToBank();
  };
  const owner =
    selectedIndex === null ? null : findPropertyOwner(players, selectedIndex);

  const canBuy =
    controlsTurn &&
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
    controlsTurn && active && cardDeck && turnPhase !== "busy" && !diceRolling,
  );
  const bankStock = bankStockFromPlayers(players);
  const waitingOnline = isOnline && !controlsTurn && turnPhase !== "ended";

  const hasJailChoice = Boolean(active?.inJail) && turnPhase === "roll";
  const canTrade = Boolean(
    controlsTurn &&
      !tradeBlocked &&
      active &&
      !active.bankrupt &&
      (turnPhase === "roll" ||
        turnPhase === "action" ||
        turnPhase === "debt") &&
      players.some((p) => !p.bankrupt && p.id !== active.id),
  );
  if (isNarrow) {
    return (
      <aside
        className="hud-panel pointer-events-auto absolute inset-x-2 z-10 flex flex-col overflow-hidden"
        style={{
          bottom: `max(0.4rem, env(safe-area-inset-bottom, 0px))`,
          maxHeight: mobileExpanded ? "min(78dvh, 38rem)" : "min(46dvh, 20rem)",
          transition: "max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <button
          type="button"
          aria-label={mobileExpanded ? t("hud.less") : t("hud.more")}
          aria-expanded={mobileExpanded}
          onClick={() => setMobileExpanded((v) => !v)}
          className="flex w-full touch-manipulation items-center justify-center pb-1 pt-2.5"
        >
          <span className="h-1 w-10 rounded-full bg-[#5c3d2e]/35" />
        </button>

        <div className="flex shrink-0 items-center gap-2 px-3 pb-2">
          {activeDef ? (
            <>
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#5c3d2e]"
                style={{ backgroundColor: activeDef.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-[family-name:var(--font-game)] text-sm font-bold leading-tight text-[#9a3412]">
                  {active ? getPlayerLabel(active) : activeDef.label}
                  {waitingOnline ? (
                    <span className="ms-1 text-[10px] font-semibold text-[#b45309]">
                      {" "}· {t("hud.waitTurn")}
                    </span>
                  ) : turnHint ? (
                    <span className="ms-1 text-[10px] font-semibold text-[#6b5344]">
                      {" "}· {turnHint}
                    </span>
                  ) : null}
                </p>
                <p className="text-[10px] font-bold tabular-nums text-[#6b5344]">
                  {isNarrow && !mobileExpanded
                    ? t("hud.bankStockShort", {
                      pousadas: bankStock.pousadas,
                      resorts: bankStock.resorts,
                    })
                    : t("hud.bankStock", {
                      pousadas: bankStock.pousadas,
                      pousadasMax: BANK_POUSADAS_MAX,
                      resorts: bankStock.resorts,
                      resortsMax: BANK_RESORTS_MAX,
                    })}
                </p>
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#9a3412]">
                {t("brand.board")}
              </p>
            </div>
          )}
          <button
            type="button"
            disabled={!active || diceRolling || !controlsTurn}
            onClick={onRollDice}
            className="hud-btn hud-btn--primary shrink-0 px-4 py-2 text-sm"
          >
            {diceRolling
              ? t("hud.rolling")
              : !controlsTurn
                ? t("hud.waitingOpponent")
                : active?.inJail
                  ? t("hud.tryDoubles")
                  : t("hud.roll")}
          </button>
          <button
            type="button"
            onClick={() => setMobileExpanded((v) => !v)}
            className="hud-btn hud-btn--soft shrink-0 px-2 py-1.5 text-[11px]"
            aria-expanded={mobileExpanded}
          >
            {mobileExpanded ? "▴" : "▾"}
          </button>

          <LanguagePicker compact className="shrink-0" />
        </div>
        {diceRoll ? (
          <div className="mx-3 mb-2 shrink-0 rounded-xl border-2 border-dashed border-[#5c3d2e]/40 bg-[#fffbeb] px-3 py-1.5">
            <p className="hud-dice-result text-base text-[#5c3d2e]">
              {diceRoll.die1} + {diceRoll.die2} ={" "}
              <span className="font-bold text-[#c2410c]">{diceRoll.total}</span>
              {diceRoll.isDouble ? (
                <span className="ms-2 text-[11px] font-bold text-[#b45309]">
                  {t("hud.doublesExclaim")}{" "}
                  {consecutiveDoubles >= 3
                    ? t("hud.doublesJail")
                    : t("hud.doublesAgain")}
                </span>
              ) : (
                <span className="ms-2 text-[11px] font-semibold text-[#6b5344]">
                  {t("hud.advance", { n: diceRoll.total })}
                </span>
              )}
            </p>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col gap-2 px-3 pb-3">
            {hasJailChoice ? (
              <div className="hud-card space-y-2 p-2.5">
                <p className="text-xs font-bold leading-snug text-[#9a3412]">
                  {t("hud.jailTry", {
                    n: active!.jailAttempts,
                    max: JAIL_MAX_ATTEMPTS,
                  })}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      !controlsTurn || diceRolling || active!.cash < JAIL_FINE
                    }
                    onClick={onPayJailFine}
                    className="hud-btn hud-btn--mint flex-1 px-2 py-2 text-xs"
                  >
                    {t("hud.payJail", { amount: JAIL_FINE })}
                  </button>
                  <button
                    type="button"
                    disabled={
                      !controlsTurn ||
                      diceRolling ||
                      active!.protectionCardIds.length === 0
                    }
                    onClick={onUseJailProtection}
                    className="hud-btn hud-btn--pink flex-1 px-2 py-2 text-xs"
                  >
                    {t("hud.useProtection")}
                    {active!.protectionCardIds.length > 0
                      ? ` (${active!.protectionCardIds.length})`
                      : ""}
                  </button>
                </div>
                {jailError ? (
                  <p className="rounded-lg border-2 border-[#5c3d2e] bg-[#fecaca] px-2 py-1.5 text-[11px] font-bold text-[#7f1d1d]">
                    {jailError}
                  </p>
                ) : null}
              </div>
            ) : null}
            {pendingRent ? (
              <div className="hud-card space-y-2 p-2.5">
                <p className="font-[family-name:var(--font-game)] text-sm font-bold text-[#166534]">
                  Aluguel · {formatCash(pendingRent.amount)} ·{" "}
                  {getSpace(pendingRent.spaceIndex).name}
                </p>
                <button
                  type="button"
                  onClick={onClaimRent}
                  className="hud-btn hud-btn--mint w-full px-2.5 py-2 text-sm"
                >
                  Cobrar aluguel
                </button>
              </div>
            ) : null}
            {turnPhase === "debt" && pendingDebt && active ? (
              <div className="hud-card space-y-2 p-2.5">
                <p className="font-[family-name:var(--font-game)] text-sm font-bold text-[#9a3412]">
                  Dívida: {formatCash(pendingDebt.amount)}
                </p>
                <p className="text-[10px] font-semibold text-[#6b5344]">
                  {pendingDebt.reason} ·{" "}
                  {pendingDebt.creditor.type === "player"
                    ? "a outro jogador"
                    : "ao banco"}
                </p>
                <p className="text-[10px] font-bold text-[#5c3d2e]">
                  Caixa {formatCash(active.cash)} · liquidável até{" "}
                  {formatCash(debtRaisable)}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={active.cash < pendingDebt.amount}
                    onClick={onPayDebt}
                    className="hud-btn hud-btn--mint flex-1 px-2 py-2 text-xs"
                  >
                    Pagar
                  </button>
                  <button
                    type="button"
                    onClick={onLiquidateForDebt}
                    className="hud-btn hud-btn--soft flex-1 px-2 py-2 text-xs"
                  >
                    Liquidar tudo
                  </button>
                  <button
                    type="button"
                    onClick={onDeclareBankruptcy}
                    className="hud-btn hud-btn--pink shrink-0 px-2 py-2 text-xs"
                  >
                    Falência
                  </button>
                </div>
              </div>
            ) : null}
            {(canBuy || canDrawCard || (turnPhase === "action" && controlsTurn)) &&
              turnPhase !== "debt" ? (
              <div className="hud-card flex flex-col gap-2 p-2.5">
                {canBuy && space ? (
                  <button
                    type="button"
                    onClick={onBuySelected}
                    className="hud-btn hud-btn--mint w-full px-3 py-2 text-sm"
                  >
                    {t("hud.buyFor", { price: formatCash(space.price!) })}
                  </button>
                ) : null}
                {canDrawCard && cardDeck ? (
                  <button
                    type="button"
                    onClick={onDrawCard}
                    className="hud-btn hud-btn--pink w-full px-3 py-2 text-sm"
                  >
                    {t("hud.drawCard", { deck: tDeckLabel(t, cardDeck) })}
                  </button>
                ) : null}
                {turnPhase === "action" && controlsTurn ? (
                  <button
                    type="button"
                    onClick={onPassTurn}
                    className="hud-btn hud-btn--soft w-full px-2.5 py-2 text-sm"
                  >
                    {canBuy ? t("hud.skipBuyAuction") : t("hud.endTurn")}
                  </button>
                ) : null}
              </div>
            ) : null}
            {showExtras ? (
              <>
                <section className="hud-card space-y-2 p-2.5">
                  <h2 className="hud-section-title">{t("hud.decks")}</h2>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="hud-chip bg-[#fff7ae]">
                      {tDeckLabel(t, "fitinha")}
                      <strong className="tabular-nums">
                        {decks.fitinha.drawPile.length}/16
                      </strong>
                    </span>
                    <span className="hud-chip bg-[#ffd0e0]">
                      {tDeckLabel(t, "benca")}
                      <strong className="tabular-nums">
                        {decks.benca.drawPile.length}/16
                      </strong>
                    </span>
                  </div>
                </section>
                <section className="hud-card space-y-2 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="hud-section-title">{t("hud.pawns")}</h2>
                    <div className="flex gap-1.5">
                      {canTrade ? (
                        <button
                          type="button"
                          onClick={onOpenTrade}
                          className="hud-btn hud-btn--amber px-2 py-0.5 text-[11px]"
                        >
                          {t("hud.trade")}
                        </button>
                      ) : null}
                      {canForfeit ? (
                        <button
                          type="button"
                          onClick={confirmForfeit}
                          className="hud-btn hud-btn--pink px-2 py-0.5 text-[11px]"
                          title={t("hud.forfeitTitle")}
                        >
                          {t("hud.forfeit")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="hud-btn hud-btn--soft px-2 py-0.5 text-[11px]"
                        onClick={() => onPlayerCountChange(playerCount)}
                        title={t("hud.backToLobbyTitle")}
                      >
                        {t("hud.lobby")}
                      </button>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {players.map((player) => {
                      const def = getPawnDef(player.pawnId);
                      const selected = player.id === activePlayerId;
                      return (
                        <li key={player.id}>
                          <div
                            className={`hud-player flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm font-bold ${selected ? "hud-player--active" : ""
                              } ${player.bankrupt ? "opacity-45" : ""}`}
                          >
                            <span
                              className="h-4 w-4 shrink-0 rounded-full border-2 border-[#5c3d2e]"
                              style={{ backgroundColor: def.color }}
                            />
                            <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-game)]">
                              {getPlayerLabel(player)}
                              {localPlayerId === player.id
                                ? t("hud.youTag")
                                : ""}
                              {player.isBanker ? t("hud.bankerShort") : ""}
                              {player.bankrupt
                                ? t("hud.bankruptTag")
                                : turnPhase === "ended"
                                  ? t("hud.winnerTag")
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

                  {auctionQueueCount > 0 && turnPhase !== "auction" ? (
                    <p className="text-[11px] font-bold text-[#b45309]">
                      Leilão na fila: {auctionQueueCount} escritura
                      {auctionQueueCount === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </section>
                {!isOnline ? (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={!active || diceRolling || turnPhase === "busy"}
                      onClick={() => onAdvanceActive(1)}
                      className="hud-btn hud-btn--soft px-2.5 py-1.5 text-xs"
                    >
                      {t("hud.plusHouse")}
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
                      {t("hud.goToHouse")}
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </aside>
    );
  }
  if (desktopCollapsed) {
    return (
      <aside className="hud-panel hud-panel--collapsed pointer-events-auto absolute end-4 top-4 z-10 flex w-[15.5rem] flex-col gap-2 p-2.5">
        <div className="flex items-center gap-2">
          {activeDef ? (
            <span
              className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#5c3d2e]"
              style={{ backgroundColor: activeDef.color }}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-game)] text-xs font-bold text-[#9a3412]">
              {activeDef
                ? t("hud.turnOf", {
                    name: active ? getPlayerLabel(active) : activeDef.label,
                  })
                : t("brand.name")}
            </p>
            {waitingOnline ? (
              <p className="truncate text-[10px] font-bold text-[#b45309]">
                {t("hud.waitTurn")}
              </p>
            ) : turnHint ? (
              <p className="truncate text-[10px] font-bold text-[#6b5344]">
                {turnHint}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="hud-btn hud-btn--soft shrink-0 px-2 py-1 text-[11px]"
            onClick={() => setDesktopCollapsed(false)}
            title={t("hud.expand")}
            aria-expanded={false}
          >
            {t("hud.expand")}
          </button>
        </div>
        {turnPhase === "roll" ? (
          <button
            type="button"
            disabled={!active || diceRolling || !controlsTurn}
            onClick={onRollDice}
            className="hud-btn hud-btn--primary w-full px-2.5 py-2 text-sm"
          >
            {diceRolling
              ? t("hud.rolling")
              : !controlsTurn
                ? t("hud.waitingOpponent")
                : active?.inJail
                  ? t("hud.tryDoubles")
                  : t("hud.roll")}
          </button>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="hud-panel pointer-events-auto absolute end-4 top-4 z-10 flex max-h-[calc(100dvh-2rem)] w-[19.5rem] flex-col gap-3 overflow-y-auto p-3.5">
      <header className="px-0.5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="hud-kicker">{t("brand.name")}</p>
            <h1 className="hud-title mt-0.5 text-[1.5rem]">{t("brand.board")}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <LanguagePicker compact className="shrink-0" />
            <button
              type="button"
              className="hud-btn hud-btn--soft px-2 py-1 text-[11px]"
              onClick={() => setDesktopCollapsed(true)}
              title={t("hud.minimize")}
              aria-expanded
            >
              {t("hud.minimize")}
            </button>
          </div>
        </div>
        {activeDef ? (
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border-2 border-[#5c3d2e] bg-[#fffbeb] px-2.5 py-1.5 shadow-[2px_2px_0_rgba(92,61,46,0.25)]">
            <span
              className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#5c3d2e]"
              style={{ backgroundColor: activeDef.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-game)] text-sm font-bold text-[#9a3412]">
                {t("hud.turnOf", {
                  name: active ? getPlayerLabel(active) : activeDef.label,
                })}
              </p>
              {waitingOnline ? (
                <p className="text-[11px] font-bold text-[#b45309]">
                  {t("hud.waitTurn")}
                </p>
              ) : turnHint ? (
                <p className="truncate text-[11px] font-bold text-[#6b5344]">
                  {turnHint}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-xs font-semibold text-[#8a6a4e]">
            {t("hud.tagline")}
          </p>
        )}
        <p className="mt-1.5 text-[11px] font-bold tabular-nums text-[#6b5344]">
          {t("hud.bankStock", {
            pousadas: bankStock.pousadas,
            pousadasMax: BANK_POUSADAS_MAX,
            resorts: bankStock.resorts,
            resortsMax: BANK_RESORTS_MAX,
          })}
        </p>
      </header>

      <section className="hud-card space-y-2 p-2.5">
        <h2 className="hud-section-title">{t("hud.play")}</h2>
        {active?.inJail && turnPhase === "roll" ? (
          <div className="space-y-2">
            <p className="text-xs font-bold leading-snug text-[#9a3412]">
              {t("hud.jailTry", {
                n: active.jailAttempts,
                max: JAIL_MAX_ATTEMPTS,
              })}
            </p>
            <button
              type="button"
              disabled={
                !controlsTurn || diceRolling || active.cash < JAIL_FINE
              }
              onClick={onPayJailFine}
              className="hud-btn hud-btn--mint w-full px-3 py-2 text-sm"
            >
              {t("hud.payJail", { amount: JAIL_FINE })}
            </button>
            <button
              type="button"
              disabled={
                !controlsTurn ||
                diceRolling ||
                active.protectionCardIds.length === 0
              }
              onClick={onUseJailProtection}
              className="hud-btn hud-btn--pink w-full px-3 py-2 text-sm"
            >
              {t("hud.useProtection")}
              {active.protectionCardIds.length > 0
                ? ` (${active.protectionCardIds.length})`
                : ""}
            </button>
            <p className="text-[11px] font-semibold text-[#6b5344]">
              {t("hud.orRollDoubles")}
            </p>
            {jailError ? (
              <p className="rounded-lg border-2 border-[#5c3d2e] bg-[#fecaca] px-2 py-1.5 text-[11px] font-bold text-[#7f1d1d]">
                {jailError}
              </p>
            ) : null}
          </div>
        ) : turnPhase === "roll" ? (
          <p className="text-xs font-semibold leading-snug text-[#6b5344]">
            {t("hud.doubleTap")}
          </p>
        ) : null}

        {turnPhase === "roll" || turnPhase === "busy" ? (
          <button
            type="button"
            disabled={!active || diceRolling || !controlsTurn}
            onClick={onRollDice}
            className="hud-btn hud-btn--primary w-full px-3 py-2.5 text-base"
          >
            {diceRolling
              ? t("hud.rolling")
              : !controlsTurn
                ? t("hud.waitingOpponent")
                : active?.inJail
                  ? t("hud.tryDoubles")
                  : t("hud.roll")}
          </button>
        ) : null}

        {diceRoll ? (
          <div className="rounded-xl border-2 border-dashed border-[#5c3d2e]/40 bg-[#fffbeb] px-3 py-2">
            <p className="hud-dice-result text-xl text-[#5c3d2e]">
              {diceRoll.die1} + {diceRoll.die2} ={" "}
              <span className="text-[#c2410c]">{diceRoll.total}</span>
            </p>
            {diceRoll.isDouble ? (
              <p className="mt-1 text-xs font-bold text-[#b45309]">
                {t("hud.doublesExclaim")}{" "}
                {consecutiveDoubles >= 3
                  ? t("hud.doublesJail")
                  : consecutiveDoubles > 0
                    ? t("hud.doublesCount", { n: consecutiveDoubles })
                    : t("hud.doublesAgain")}
              </p>
            ) : (
              <p className="mt-1 text-xs font-semibold text-[#6b5344]">
                {t("hud.advance", { n: diceRoll.total })}
              </p>
            )}
          </div>
        ) : null}

        {pendingRent ? (
          <div className="space-y-2 rounded-xl border-2 border-[#5c3d2e] bg-[#ecfdf5] p-2.5">
            <p className="font-[family-name:var(--font-game)] text-sm font-bold text-[#166534]">
              Aluguel pendente · {formatCash(pendingRent.amount)} ·{" "}
              {getSpace(pendingRent.spaceIndex).name}
            </p>
            <p className="text-[11px] font-bold text-[#6b5344]">
              Dono:{" "}
              {(() => {
                const rentOwner = players.find(
                  (p) => p.id === pendingRent.ownerId,
                );
                return rentOwner ? getPlayerLabel(rentOwner) : "—";
              })()}
              . Cobrar antes do próximo lance de dados.
            </p>
            <button
              type="button"
              onClick={onClaimRent}
              className="hud-btn hud-btn--mint w-full px-2.5 py-2 text-sm"
            >
              Cobrar aluguel
            </button>
          </div>
        ) : null}

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

        {canBuy && space ? (
          <button
            type="button"
            onClick={onBuySelected}
            className="hud-btn hud-btn--mint w-full px-3 py-2 text-sm"
          >
            {t("hud.buyFor", { price: formatCash(space.price!) })}
          </button>
        ) : null}
        {canDrawCard && cardDeck ? (
          <button
            type="button"
            onClick={onDrawCard}
            className="hud-btn hud-btn--pink w-full px-3 py-2 text-sm"
          >
            {t("hud.drawCard", { deck: tDeckLabel(t, cardDeck) })}
          </button>
        ) : null}
        {turnPhase === "action" && controlsTurn ? (
          <button
            type="button"
            onClick={onPassTurn}
            className="hud-btn hud-btn--soft w-full px-2.5 py-2 text-sm"
          >
            {canBuy ? t("hud.skipBuyAuction") : t("hud.endTurn")}
          </button>
        ) : null}
        {auctionQueueCount > 0 && turnPhase !== "auction" ? (
          <p className="text-[11px] font-bold text-[#b45309]">
            Leilão na fila: {auctionQueueCount} escritura
            {auctionQueueCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </section>

      <section className="hud-card space-y-2 p-2.5">
        <h2 className="hud-section-title">{t("hud.pawns")}</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className="hud-chip bg-[#fff7ae]">
            {tDeckLabel(t, "fitinha")}
            <strong className="tabular-nums">
              {decks.fitinha.drawPile.length}/16
            </strong>
          </span>
          <span className="hud-chip bg-[#ffd0e0]">
            {tDeckLabel(t, "benca")}
            <strong className="tabular-nums">
              {decks.benca.drawPile.length}/16
            </strong>
          </span>
        </div>
        <ul className="space-y-1.5">
          {players.map((player) => {
            const def = getPawnDef(player.pawnId);
            const selected = player.id === activePlayerId;
            return (
              <li key={player.id}>
                <div
                  className={`hud-player flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm font-bold ${selected ? "hud-player--active" : ""
                    } ${player.bankrupt ? "opacity-45" : ""}`}
                >
                  <span
                    className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-[#5c3d2e]"
                    style={{ backgroundColor: def.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-game)]">
                    {getPlayerLabel(player)}
                    {localPlayerId === player.id ? t("hud.youTag") : ""}
                    {player.isBanker ? t("hud.bankerShort") : ""}
                    {player.bankrupt
                      ? t("hud.bankruptTag")
                      : turnPhase === "ended"
                        ? t("hud.winnerTag")
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
        {(canTrade || canForfeit) && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {canTrade ? (
              <button
                type="button"
                onClick={onOpenTrade}
                className="hud-btn hud-btn--amber px-2.5 py-1.5 text-xs"
              >
                {t("hud.trade")}
              </button>
            ) : null}
            {canForfeit ? (
              <button
                type="button"
                onClick={confirmForfeit}
                className="hud-btn hud-btn--pink px-2.5 py-1.5 text-xs"
                title={t("hud.forfeitTitle")}
              >
                {t("hud.forfeit")}
              </button>
            ) : null}
          </div>
        )}
      </section>

      <section className="hud-card space-y-2 p-2.5">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
        >
          <h2 className="hud-section-title">{t("hud.moreSection")}</h2>
          <span className="text-[11px] font-bold text-[#6b5344]">
            {showMore ? t("hud.less") : t("hud.more")}
          </span>
        </button>
        {showMore ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="hud-btn hud-btn--soft px-2.5 py-1.5 text-xs"
              onClick={() => onPlayerCountChange(playerCount)}
              title={t("hud.backToLobbyTitle")}
            >
              {t("hud.lobby")}
            </button>
            {!isOnline ? (
              <>
                <button
                  type="button"
                  disabled={!active || diceRolling || turnPhase === "busy"}
                  onClick={() => onAdvanceActive(1)}
                  className="hud-btn hud-btn--soft px-2.5 py-1.5 text-xs"
                >
                  {t("hud.plusHouse")}
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
                  {t("hud.goToHouse")}
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </aside>
  );
}

