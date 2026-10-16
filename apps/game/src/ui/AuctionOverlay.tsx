import { useMemo, useState } from "react";
import {
  COLOR_GROUP_LABELS,
  KIND_LABELS,
  auctionLotLabel,
  formatCash,
  getPawnDef,
  getPlayerLabel,
  getSpace,
  minBidIncrementForLot,
  minimumNextBidForLot,
  type AuctionLot,
  type PlayerState,
} from "@cidadela/shared";
import { GROUP_COLORS } from "../scene/colors";

type Props = {
  lot: AuctionLot;
  queueRemaining: number;
  players: PlayerState[];
  currentBid: number;
  highBidderId: string | null;
  tiedBidderIds: string[] | null;
  excludedIds: string[];
  passesNeeded: number;
  passesSinceBid: number;
  onBid: (playerId: string, amount: number) => void;
  onPass: (playerId: string) => void;
  onSell: () => void;
  onNoBids: () => void;
  onResolveTieDice: () => void;
};

function bandInk(hex: string): "light" | "dark" {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return "light";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "dark" : "light";
}

export function AuctionOverlay({
  lot,
  queueRemaining,
  players,
  currentBid,
  highBidderId,
  tiedBidderIds,
  excludedIds,
  passesNeeded,
  passesSinceBid,
  onBid,
  onPass,
  onSell,
  onNoBids,
  onResolveTieDice,
}: Props) {
  const space = getSpace(lot.spaceIndex);
  const accent =
    lot.kind === "pousada"
      ? "#86efac"
      : lot.kind === "resort"
        ? "#f9a8d4"
        : space.colorGroup != null
          ? GROUP_COLORS[space.colorGroup]
          : space.kind === "transporte"
            ? "#3d7ea6"
            : space.kind === "companhia"
              ? "#7cb342"
              : "#e9a46c";
  const dark = bandInk(accent) === "dark";
  const minNext = minimumNextBidForLot(currentBid, lot);
  const increment = minBidIncrementForLot(lot);
  const highBidder = highBidderId
    ? players.find((p) => p.id === highBidderId)
    : null;
  const inTie = Boolean(tiedBidderIds && tiedBidderIds.length >= 2);

  const alive = useMemo(
    () => players.filter((p) => !p.bankrupt),
    [players],
  );

  const [bidderId, setBidderId] = useState(
    () => alive.find((p) => !excludedIds.includes(p.id))?.id ?? "",
  );
  const bidder = alive.find((p) => p.id === bidderId) ?? null;
  const [amount, setAmount] = useState(minNext);

  const syncAmount = (nextMin: number, cash: number) => {
    setAmount(Math.min(Math.max(nextMin, nextMin), cash));
  };

  const selectable = alive.filter((p) => !excludedIds.includes(p.id));

  const kicker =
    lot.kind === "pousada"
      ? "Leilão de pousada"
      : lot.kind === "resort"
        ? "Leilão de resort"
        : "Leilão";

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Leilão"
    >
      <div className="deed-sheet flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden">
        <header
          className="deed-sheet__band"
          style={{ backgroundColor: accent }}
        >
          <p
            className={`deed-sheet__kicker ${dark ? "deed-sheet__kicker--dark" : ""}`}
          >
            {kicker}
            {queueRemaining > 1 ? ` · +${queueRemaining - 1} na fila` : ""}
          </p>
          <h3
            className={`deed-sheet__title ${dark ? "deed-sheet__title--dark" : ""}`}
          >
            {auctionLotLabel(lot)}
          </h3>
          <p
            className={`deed-sheet__sub ${dark ? "deed-sheet__sub--dark" : ""}`}
          >
            {lot.kind === "property" ? (
              <>
                {KIND_LABELS[space.kind]}
                {space.colorGroup
                  ? ` · ${COLOR_GROUP_LABELS[space.colorGroup]}`
                  : ""}
                {space.price != null
                  ? ` · tabela ${formatCash(space.price)}`
                  : ""}
                {lot.mortgaged ? " · hipotecada" : ""}
              </>
            ) : (
              <>
                Peça escassa do banco · lance substitui o custo de tabela ·
                terreno {space.name}
              </>
            )}
          </p>
        </header>

        <div className="deed-sheet__body min-h-0 flex-1 overflow-y-auto">
          <div className="deed-sheet__section">
            <h4 className="deed-sheet__section-title">Lance atual</h4>
            {currentBid > 0 && highBidder ? (
              <p className="m-0 text-lg font-bold text-[#1f6b45]">
                {formatCash(currentBid)} ·{" "}
                {getPlayerLabel(highBidder)}
                {inTie ? " · empatado" : ""}
              </p>
            ) : (
              <p className="m-0 font-bold text-[#8a6a4e]">
                Ainda sem lances · mínimo {formatCash(1)}
              </p>
            )}
            <p className="deed-sheet__note">
              Incremento mínimo {formatCash(increment)}. Próximo lance:{" "}
              {formatCash(minNext)}. Passes desde o último lance:{" "}
              {passesSinceBid}/{passesNeeded}. Igualar o lance declara empate
              (FR-89).
            </p>
          </div>

          {inTie && tiedBidderIds ? (
            <div className="deed-sheet__section rounded-xl border-2 border-[#5c3d2e] bg-[#fef08a]/80 p-2.5">
              <h4 className="deed-sheet__section-title">Empate</h4>
              <p className="deed-sheet__note mb-2">
                {tiedBidderIds
                  .map((id) => {
                    const p = players.find((x) => x.id === id);
                    return p ? getPlayerLabel(p) : id;
                  })
                  .join(" × ")}{" "}
                empataram em {formatCash(currentBid)}. Aumentem o lance ou
                decidam nos dados.
              </p>
              <button
                type="button"
                className="deed-btn deed-btn--amber w-full"
                onClick={onResolveTieDice}
              >
                Decidir nos dados
              </button>
            </div>
          ) : null}

          <div className="deed-sheet__section">
            <h4 className="deed-sheet__section-title">Dar lance</h4>
            <label className="mb-2 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
              Jogador
              <select
                className="rounded-lg border-2 border-[#5c3d2e] bg-white px-2 py-1.5 font-bold text-[#5c3d2e]"
                value={bidderId}
                onChange={(e) => {
                  const id = e.target.value;
                  setBidderId(id);
                  const p = alive.find((x) => x.id === id);
                  if (p) syncAmount(minNext, p.cash);
                }}
              >
                {selectable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getPlayerLabel(p)} ({formatCash(p.cash)})
                  </option>
                ))}
              </select>
            </label>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="deed-btn deed-btn--soft px-2 py-1 text-xs"
                disabled={!bidder}
                onClick={() =>
                  bidder && setAmount(Math.max(minNext, amount - increment))
                }
              >
                −{increment}
              </button>
              <input
                type="number"
                min={1}
                max={bidder?.cash ?? minNext}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-24 rounded-lg border-2 border-[#5c3d2e] px-2 py-1 font-bold tabular-nums"
              />
              <button
                type="button"
                className="deed-btn deed-btn--soft px-2 py-1 text-xs"
                disabled={!bidder}
                onClick={() =>
                  bidder &&
                  setAmount(Math.min(bidder.cash, amount + increment))
                }
              >
                +{increment}
              </button>
              {currentBid > 0 ? (
                <button
                  type="button"
                  className="deed-btn deed-btn--soft px-2 py-1 text-xs"
                  disabled={!bidder || bidder.id === highBidderId}
                  onClick={() => setAmount(currentBid)}
                >
                  empatar
                </button>
              ) : null}
              <button
                type="button"
                className="deed-btn deed-btn--soft px-2 py-1 text-xs"
                disabled={!bidder}
                onClick={() => bidder && setAmount(minNext)}
              >
                mín
              </button>
              <button
                type="button"
                className="deed-btn deed-btn--soft px-2 py-1 text-xs"
                disabled={!bidder}
                onClick={() => bidder && setAmount(bidder.cash)}
              >
                tudo
              </button>
            </div>

            <div className="deed-sheet__actions">
              <button
                type="button"
                className="deed-btn deed-btn--mint"
                disabled={!bidderId || selectable.length === 0}
                onClick={() => {
                  onBid(bidderId, amount);
                  const p = alive.find((x) => x.id === bidderId);
                  if (p) {
                    const nextMin = minimumNextBidForLot(amount, lot);
                    setAmount(Math.min(p.cash, nextMin));
                  }
                }}
              >
                Lançar {formatCash(amount)}
              </button>
              <button
                type="button"
                className="deed-btn deed-btn--soft"
                disabled={!bidderId || selectable.length === 0}
                onClick={() => onPass(bidderId)}
              >
                Passar
              </button>
            </div>
          </div>

          <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0">
            {alive.map((p) => {
              const def = getPawnDef(p.pawnId);
              const excluded = excludedIds.includes(p.id);
              const leading = p.id === highBidderId;
              const tied = tiedBidderIds?.includes(p.id);
              return (
                <li
                  key={p.id}
                  className={`rounded-lg border-2 border-[#5c3d2e] px-2 py-1.5 text-xs font-bold ${
                    tied
                      ? "bg-[#fde68a]"
                      : leading
                        ? "bg-[#fef08a]"
                        : excluded
                          ? "bg-[#fecaca] opacity-70"
                          : "bg-white/70"
                  }`}
                >
                  <span
                    className="mr-1 inline-block h-2.5 w-2.5 rounded-full border border-[#5c3d2e]"
                    style={{ backgroundColor: def.color }}
                  />
                  {getPlayerLabel(p)}
                  <span className="float-right tabular-nums text-[#1f6b45]">
                    {formatCash(p.cash)}
                  </span>
                  {excluded ? (
                    <span className="mt-0.5 block text-[10px] text-[#7f1d1d]">
                      fora deste leilão
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <footer className="deed-sheet__footer">
          {currentBid > 0 && !inTie ? (
            <button
              type="button"
              className="deed-btn deed-btn--amber w-full"
              onClick={onSell}
            >
              Dou-lhe uma, duas… vendido! ({formatCash(currentBid)})
            </button>
          ) : currentBid <= 0 ? (
            <button
              type="button"
              className="deed-btn deed-btn--soft w-full"
              onClick={onNoBids}
            >
              Sem lances — fica com o banco
            </button>
          ) : (
            <p className="m-0 text-center text-xs font-bold text-[#6b5344]">
              Resolva o empate antes de vender
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
