import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  formatCash,
  getCard,
  getPawnDef,
  getPlayerLabel,
  getSpace,
  mortgageInterest,
  mortgagedSpacesInTrade,
  redeemCost,
  validateTrade,
  type MortgageChoice,
  type PlayerState,
  type TradeOffer,
  type TradeSide,
} from "@cidadela/shared";
import { tProtectionLabel } from "../i18n/tCard";
import type { PendingTradeProposal } from "../session/gameSnapshot";

type Mode = "compose" | "review" | "waiting";

type Props = {
  mode: Mode;
  initiatorId: string;
  players: PlayerState[];
  proposal?: PendingTradeProposal | null;
  onClose: () => void;
  onPropose: (proposal: PendingTradeProposal) => void;
  onRespond?: (accept: boolean) => void;
  onCancelProposal?: () => void;
};

function emptySide(): TradeSide {
  return { cash: 0, spaceIndexes: [], protectionCardIds: [] };
}

function toggleInList<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function resolutionsToRecord(
  list: PendingTradeProposal["resolutions"],
): Record<number, MortgageChoice> {
  const out: Record<number, MortgageChoice> = {};
  for (const r of list) out[r.spaceIndex] = r.choice;
  return out;
}

function SideSummary({
  title,
  player,
  side,
}: {
  title: string;
  player: PlayerState;
  side: TradeSide;
}) {
  const { t } = useTranslation();
  const def = getPawnDef(player.pawnId);
  return (
    <section className="deed-sheet__section min-w-0 flex-1">
      <h4 className="deed-sheet__section-title flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border border-[#5c3d2e]"
          style={{ backgroundColor: def.color }}
        />
        {title} · {getPlayerLabel(player)}
      </h4>
      <ul className="m-0 list-none space-y-1 p-0 text-xs font-bold text-[#5c3d2e]">
        {side.cash > 0 ? (
          <li>{formatCash(side.cash)}</li>
        ) : null}
        {side.spaceIndexes.map((idx) => (
          <li key={idx}>{getSpace(idx).name}</li>
        ))}
        {side.protectionCardIds.map((id) => {
          const card = getCard(id);
          const kind =
            card?.effect.type === "keep" ? card.effect.kind : null;
          return (
            <li key={id}>
              {kind ? tProtectionLabel(t, kind) : id}
            </li>
          );
        })}
        {side.cash <= 0 &&
        side.spaceIndexes.length === 0 &&
        side.protectionCardIds.length === 0 ? (
          <li className="text-[#8a6a4e]">{t("trade.emptySide")}</li>
        ) : null}
      </ul>
    </section>
  );
}

function SideEditor({
  title,
  player,
  side,
  onChange,
}: {
  title: string;
  player: PlayerState;
  side: TradeSide;
  onChange: (next: TradeSide) => void;
}) {
  const { t } = useTranslation();
  const def = getPawnDef(player.pawnId);
  const tradable = player.properties.filter(
    (h) => !h.hasResort && h.pousadas === 0,
  );
  const blocked = player.properties.filter(
    (h) => h.hasResort || h.pousadas > 0,
  );

  return (
    <section className="deed-sheet__section min-w-0 flex-1">
      <h4 className="deed-sheet__section-title flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border border-[#5c3d2e]"
          style={{ backgroundColor: def.color }}
        />
        {title} · {getPlayerLabel(player)}
      </h4>

      <label className="mb-2 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
        {t("trade.cashMax", { max: formatCash(player.cash) })}
        <input
          type="number"
          min={0}
          max={player.cash}
          value={side.cash}
          onChange={(e) =>
            onChange({
              ...side,
              cash: Math.max(
                0,
                Math.min(player.cash, Number(e.target.value) || 0),
              ),
            })
          }
          className="rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 font-bold tabular-nums text-[#5c3d2e]"
        />
      </label>

      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a6a4e]">
        {t("trade.deeds")}
      </p>
      <ul className="m-0 mb-2 max-h-36 list-none space-y-1 overflow-y-auto p-0">
        {tradable.length === 0 ? (
          <li className="text-xs font-bold text-[#8a6a4e]">
            {t("trade.noneNegotiable")}
          </li>
        ) : (
          tradable.map((h) => {
            const space = getSpace(h.spaceIndex);
            const on = side.spaceIndexes.includes(h.spaceIndex);
            return (
              <li key={h.spaceIndex}>
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-[#5c3d2e] bg-white/70 px-2 py-1.5 text-xs font-bold text-[#5c3d2e]">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      onChange({
                        ...side,
                        spaceIndexes: toggleInList(
                          side.spaceIndexes,
                          h.spaceIndex,
                        ),
                      })
                    }
                  />
                  <span className="min-w-0 flex-1">
                    {space.name}
                    {h.mortgaged ? (
                      <span className="mt-0.5 block text-[10px] text-[#9a3412]">
                        {t("trade.mortgagedTag", {
                          amount: formatCash(mortgageInterest(h.spaceIndex)),
                        })}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>
      {blocked.length > 0 ? (
        <p className="mb-2 text-[10px] font-bold text-[#9a3412]">
          {t("trade.blockedBuildings", { count: blocked.length })}
        </p>
      ) : null}

      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a6a4e]">
        {t("trade.protectionSection")}
      </p>
      <ul className="m-0 list-none space-y-1 p-0">
        {player.protectionCardIds.length === 0 ? (
          <li className="text-xs font-bold text-[#8a6a4e]">
            {t("trade.noCards")}
          </li>
        ) : (
          player.protectionCardIds.map((id) => {
            const card = getCard(id);
            const on = side.protectionCardIds.includes(id);
            return (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-[#5c3d2e] bg-white/70 px-2 py-1.5 text-xs font-bold text-[#5c3d2e]">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      onChange({
                        ...side,
                        protectionCardIds: toggleInList(
                          side.protectionCardIds,
                          id,
                        ),
                      })
                    }
                  />
                  {card?.effect.type === "keep"
                    ? tProtectionLabel(t, card.effect.kind)
                    : id}
                </label>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

export function TradeOverlay({
  mode,
  initiatorId,
  players,
  proposal = null,
  onClose,
  onPropose,
  onRespond,
  onCancelProposal,
}: Props) {
  const { t } = useTranslation();
  const alive = useMemo(
    () => players.filter((p) => !p.bankrupt && p.id !== initiatorId),
    [players, initiatorId],
  );
  const initiator = players.find((p) => p.id === initiatorId) ?? null;
  const [partnerId, setPartnerId] = useState(
    () => proposal?.toId ?? alive[0]?.id ?? "",
  );
  const partner = players.find((p) => p.id === partnerId) ?? null;

  const [give, setGive] = useState<TradeSide>(
    () => proposal?.give ?? emptySide(),
  );
  const [receive, setReceive] = useState<TradeSide>(
    () => proposal?.receive ?? emptySide(),
  );
  const [resolutions, setResolutions] = useState<
    Record<number, MortgageChoice>
  >(() =>
    proposal ? resolutionsToRecord(proposal.resolutions) : {},
  );
  const [error, setError] = useState<string | null>(null);

  const offer: TradeOffer | null =
    mode === "compose" && initiator && partner
      ? { fromId: initiator.id, toId: partner.id, give, receive }
      : proposal
        ? {
            fromId: proposal.fromId,
            toId: proposal.toId,
            give: proposal.give,
            receive: proposal.receive,
          }
        : null;

  const fromPlayer = offer
    ? players.find((p) => p.id === offer.fromId) ?? null
    : null;
  const toPlayer = offer
    ? players.find((p) => p.id === offer.toId) ?? null
    : null;

  const mortgaged = offer ? mortgagedSpacesInTrade(players, offer) : [];
  const resolutionList =
    proposal?.resolutions ??
    mortgaged.map((spaceIndex) => ({
      spaceIndex,
      choice: resolutions[spaceIndex] ?? ("interest" as MortgageChoice),
    }));

  const resetSides = () => {
    setGive(emptySide());
    setReceive(emptySide());
    setResolutions({});
    setError(null);
  };

  const onConfirmPropose = () => {
    if (!offer) return;
    const check = validateTrade(players, offer);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    const full: PendingTradeProposal["resolutions"] = mortgaged.map(
      (spaceIndex) => ({
        spaceIndex,
        choice: resolutions[spaceIndex] ?? "interest",
      }),
    );
    onPropose({
      fromId: offer.fromId,
      toId: offer.toId,
      give: offer.give,
      receive: offer.receive,
      resolutions: full,
    });
  };

  if (!initiator && mode === "compose") return null;
  if ((mode === "review" || mode === "waiting") && !offer) return null;

  const heading =
    mode === "review"
      ? t("trade.reviewHeading")
      : mode === "waiting"
        ? t("trade.waitingHeading")
        : t("trade.heading");
  const subtitle =
    mode === "review"
      ? t("trade.reviewSubtitle", {
          name: fromPlayer ? getPlayerLabel(fromPlayer) : "—",
        })
      : mode === "waiting"
        ? t("trade.waitingSubtitle", {
            name: toPlayer ? getPlayerLabel(toPlayer) : "—",
          })
        : t("trade.subtitle");

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t("trade.kicker")}
    >
      <div className="deed-sheet flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden">
        <header
          className="deed-sheet__band"
          style={{ backgroundColor: "#e9a46c" }}
        >
          <p className="deed-sheet__kicker deed-sheet__kicker--dark">
            {t("trade.kicker")}
          </p>
          <h3 className="deed-sheet__title deed-sheet__title--dark">
            {heading}
          </h3>
          <p className="deed-sheet__sub deed-sheet__sub--dark">{subtitle}</p>
        </header>

        <div className="deed-sheet__body min-h-0 flex-1 overflow-y-auto">
          {mode === "compose" ? (
            <>
              <label className="mb-3 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
                {t("trade.with")}
                <select
                  className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-1.5 font-bold text-[#5c3d2e]"
                  value={partnerId}
                  onChange={(e) => {
                    setPartnerId(e.target.value);
                    resetSides();
                  }}
                >
                  {alive.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getPlayerLabel(p)} ({formatCash(p.cash)})
                    </option>
                  ))}
                </select>
              </label>

              {partner ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <SideEditor
                    title={t("trade.youGive")}
                    player={initiator!}
                    side={give}
                    onChange={setGive}
                  />
                  <SideEditor
                    title={t("trade.receiveShort")}
                    player={partner}
                    side={receive}
                    onChange={setReceive}
                  />
                </div>
              ) : (
                <p className="font-bold text-[#8a6a4e]">{t("trade.noPartner")}</p>
              )}

              {mortgaged.length > 0 ? (
                <section className="deed-sheet__section mt-3">
                  <h4 className="deed-sheet__section-title">
                    {t("trade.mortgagedSection")}
                  </h4>
                  <p className="deed-sheet__note mb-2">
                    {t("trade.mortgagedNote")}
                  </p>
                  <ul className="m-0 list-none space-y-2 p-0">
                    {mortgaged.map((idx) => {
                      const space = getSpace(idx);
                      const choice = resolutions[idx] ?? "interest";
                      return (
                        <li
                          key={idx}
                          className="rounded-lg border-2 border-[#5c3d2e] bg-white/70 px-2 py-2"
                        >
                          <p className="m-0 mb-1 text-xs font-bold text-[#5c3d2e]">
                            {space.name}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={`deed-btn px-2 py-1 text-xs ${
                                choice === "interest"
                                  ? "deed-btn--amber"
                                  : "deed-btn--soft"
                              }`}
                              onClick={() =>
                                setResolutions((r) => ({
                                  ...r,
                                  [idx]: "interest",
                                }))
                              }
                            >
                              {t("trade.interestOnly", {
                                amount: formatCash(mortgageInterest(idx)),
                              })}
                            </button>
                            <button
                              type="button"
                              className={`deed-btn px-2 py-1 text-xs ${
                                choice === "redeem"
                                  ? "deed-btn--mint"
                                  : "deed-btn--soft"
                              }`}
                              onClick={() =>
                                setResolutions((r) => ({
                                  ...r,
                                  [idx]: "redeem",
                                }))
                              }
                            >
                              {t("trade.redeemAction", {
                                amount: formatCash(redeemCost(idx)),
                              })}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </>
          ) : fromPlayer && toPlayer && offer ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <SideSummary
                  title={t("trade.offerFrom", {
                    name: getPlayerLabel(fromPlayer),
                  })}
                  player={fromPlayer}
                  side={offer.give}
                />
                <SideSummary
                  title={t("trade.offerFrom", {
                    name: getPlayerLabel(toPlayer),
                  })}
                  player={toPlayer}
                  side={offer.receive}
                />
              </div>
              {resolutionList.length > 0 ? (
                <section className="deed-sheet__section mt-3">
                  <h4 className="deed-sheet__section-title">
                    {t("trade.mortgagedSection")}
                  </h4>
                  <ul className="m-0 list-none space-y-1 p-0 text-xs font-bold text-[#5c3d2e]">
                    {resolutionList.map((r) => (
                      <li key={r.spaceIndex}>
                        {getSpace(r.spaceIndex).name}
                        {" · "}
                        {r.choice === "redeem"
                          ? t("trade.redeemAction", {
                              amount: formatCash(redeemCost(r.spaceIndex)),
                            })
                          : t("trade.interestOnly", {
                              amount: formatCash(
                                mortgageInterest(r.spaceIndex),
                              ),
                            })}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : null}

          {error ? <p className="deed-sheet__error mt-2">{error}</p> : null}
        </div>

        <footer className="deed-sheet__footer">
          <div className="deed-sheet__actions">
            {mode === "compose" ? (
              <>
                <button
                  type="button"
                  className="deed-btn deed-btn--soft flex-1"
                  onClick={onClose}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="deed-btn deed-btn--mint flex-1"
                  disabled={!partner || alive.length === 0}
                  onClick={onConfirmPropose}
                >
                  {t("trade.sendProposal")}
                </button>
              </>
            ) : null}
            {mode === "review" ? (
              <>
                <button
                  type="button"
                  className="deed-btn deed-btn--soft flex-1"
                  onClick={() => onRespond?.(false)}
                >
                  {t("trade.reject")}
                </button>
                <button
                  type="button"
                  className="deed-btn deed-btn--mint flex-1"
                  onClick={() => onRespond?.(true)}
                >
                  {t("trade.accept")}
                </button>
              </>
            ) : null}
            {mode === "waiting" ? (
              <button
                type="button"
                className="deed-btn deed-btn--soft flex-1"
                onClick={() => onCancelProposal?.()}
              >
                {t("trade.cancelProposal")}
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
