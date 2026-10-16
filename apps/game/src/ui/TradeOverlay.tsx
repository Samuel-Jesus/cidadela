import { useMemo, useState } from "react";
import {
  PROTECTION_LABELS,
  applyTrade,
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

type Props = {
  initiatorId: string;
  players: PlayerState[];
  onClose: () => void;
  onApplied: (players: PlayerState[], notes: string[]) => void;
};

function emptySide(): TradeSide {
  return { cash: 0, spaceIndexes: [], protectionCardIds: [] };
}

function toggleInList<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
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
        Dinheiro (máx. {formatCash(player.cash)})
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
        Escrituras
      </p>
      <ul className="m-0 mb-2 max-h-36 list-none space-y-1 overflow-y-auto p-0">
        {tradable.length === 0 ? (
          <li className="text-xs font-bold text-[#8a6a4e]">Nenhuma negociável</li>
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
                        hipotecada · juros {formatCash(mortgageInterest(h.spaceIndex))}
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
        <p className="deed-sheet__note mb-2">
          {blocked.length} com construção — venda ao banco antes.
        </p>
      ) : null}

      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a6a4e]">
        Proteção
      </p>
      <ul className="m-0 list-none space-y-1 p-0">
        {player.protectionCardIds.length === 0 ? (
          <li className="text-xs font-bold text-[#8a6a4e]">Nenhuma carta</li>
        ) : (
          player.protectionCardIds.map((id) => {
            const card = getCard(id);
            const on = side.protectionCardIds.includes(id);
            const label =
              card.effect.type === "keep"
                ? PROTECTION_LABELS[card.effect.kind]
                : card.text;
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
                  {label}
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
  initiatorId,
  players,
  onClose,
  onApplied,
}: Props) {
  const alive = useMemo(
    () => players.filter((p) => !p.bankrupt && p.id !== initiatorId),
    [players, initiatorId],
  );
  const initiator = players.find((p) => p.id === initiatorId) ?? null;
  const [partnerId, setPartnerId] = useState(
    () => alive[0]?.id ?? "",
  );
  const partner = players.find((p) => p.id === partnerId) ?? null;

  const [give, setGive] = useState<TradeSide>(emptySide);
  const [receive, setReceive] = useState<TradeSide>(emptySide);
  const [resolutions, setResolutions] = useState<
    Record<number, MortgageChoice>
  >({});
  const [error, setError] = useState<string | null>(null);

  const offer: TradeOffer | null =
    initiator && partner
      ? { fromId: initiator.id, toId: partner.id, give, receive }
      : null;

  const mortgaged = offer
    ? mortgagedSpacesInTrade(players, offer)
    : [];

  const resetSides = () => {
    setGive(emptySide());
    setReceive(emptySide());
    setResolutions({});
    setError(null);
  };

  const onConfirm = () => {
    if (!offer) return;
    const check = validateTrade(players, offer);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    const fullResolutions = { ...resolutions };
    for (const idx of mortgaged) {
      if (!fullResolutions[idx]) fullResolutions[idx] = "interest";
    }
    const result = applyTrade(players, offer, fullResolutions);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onApplied(result.players, result.notes);
  };

  if (!initiator) return null;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Negociação"
    >
      <div className="deed-sheet flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden">
        <header
          className="deed-sheet__band"
          style={{ backgroundColor: "#e9a46c" }}
        >
          <p className="deed-sheet__kicker deed-sheet__kicker--dark">
            Negociação
          </p>
          <h3 className="deed-sheet__title deed-sheet__title--dark">
            Troca entre jogadores
          </h3>
          <p className="deed-sheet__sub deed-sheet__sub--dark">
            Terrenos sem construção, transportes, companhias, dinheiro e
            Proteção
          </p>
        </header>

        <div className="deed-sheet__body min-h-0 flex-1 overflow-y-auto">
          <label className="mb-3 flex flex-col gap-1 text-xs font-bold text-[#6b5344]">
            Negociar com
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
                title="Você oferece"
                player={initiator}
                side={give}
                onChange={setGive}
              />
              <SideEditor
                title="Recebe"
                player={partner}
                side={receive}
                onChange={setReceive}
              />
            </div>
          ) : (
            <p className="font-bold text-[#8a6a4e]">
              Não há outro jogador ativo para negociar.
            </p>
          )}

          {mortgaged.length > 0 ? (
            <section className="deed-sheet__section mt-3">
              <h4 className="deed-sheet__section-title">
                Bens hipotecados na troca
              </h4>
              <p className="deed-sheet__note mb-2">
                O novo dono escolhe: resgatar agora ou pagar só os juros e
                manter hipotecado.
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
                          Só juros · {formatCash(mortgageInterest(idx))}
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
                          Resgatar · {formatCash(redeemCost(idx))}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {error ? <p className="deed-sheet__error mt-2">{error}</p> : null}
        </div>

        <footer className="deed-sheet__footer">
          <div className="deed-sheet__actions">
            <button
              type="button"
              className="deed-btn deed-btn--soft flex-1"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="deed-btn deed-btn--mint flex-1"
              disabled={!partner || alive.length === 0}
              onClick={onConfirm}
            >
              Confirmar troca
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
