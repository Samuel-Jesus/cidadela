import type { ReactNode } from "react";
import {
  BUILD_COST_BY_GROUP,
  COLOR_GROUP_LABELS,
  KIND_LABELS,
  PROPERTY_RENT,
  TRANSPORT_RENT_BY_COUNT,
  buildCostForSpace,
  canBuildPousada,
  canBuildResort,
  canMortgage,
  canSellBuilding,
  formatCash,
  getSpace,
  mortgageInterest,
  mortgageValue,
  redeemCost,
  type PlayerState,
  type PropertyHolding,
} from "@cidadela/shared";
import { GROUP_COLORS } from "../scene/colors";

type Props = {
  player: PlayerState;
  holding: PropertyHolding;
  onClose: () => void;
  onMortgage: () => void;
  onRedeem: () => void;
  onSellBuilding: () => void;
  onBuildPousada: () => void;
  onBuildResort: () => void;
  actionError: string | null;
};

export function DeedDetailOverlay({
  player,
  holding,
  onClose,
  onMortgage,
  onRedeem,
  onSellBuilding,
  onBuildPousada,
  onBuildResort,
  actionError,
}: Props) {
  const space = getSpace(holding.spaceIndex);
  const accent =
    space.colorGroup != null
      ? GROUP_COLORS[space.colorGroup]
      : space.kind === "transporte"
        ? "#3d7ea6"
        : space.kind === "companhia"
          ? "#7cb342"
          : "#c4a484";

  const rent = PROPERTY_RENT[holding.spaceIndex];
  const buildCost = buildCostForSpace(holding.spaceIndex);
  const mValue = mortgageValue(holding.spaceIndex);
  const mInterest = mortgageInterest(holding.spaceIndex);
  const rCost = redeemCost(holding.spaceIndex);

  const mortgageOk = canMortgage(player, holding.spaceIndex);
  const redeemOk = holding.mortgaged && player.cash >= rCost;
  const sellOk = canSellBuilding(player, holding.spaceIndex);
  const pousadaOk = canBuildPousada(player, holding.spaceIndex);
  const resortOk = canBuildResort(player, holding.spaceIndex);

  const currentLabel = holding.mortgaged
    ? "Hipotecada (sem aluguel)"
    : holding.hasResort
      ? "Resort"
      : holding.pousadas > 0
        ? `${holding.pousadas} pousada${holding.pousadas > 1 ? "s" : ""}`
        : "Terreno sem construção";

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Escritura: ${space.name}`}
        className="wallet-card-detail flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#2a1c14] to-[#1a120c] text-[#f5f0e8] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        style={{ borderColor: `${accent}66` }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-white/10 px-4 py-3">
          <div
            className="mb-2 h-2 w-full rounded-full"
            style={{ backgroundColor: accent }}
          />
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#d4a373]">
            Escritura · casa {space.index}
          </p>
          <h3 className="mt-1 font-serif text-xl leading-snug text-white">
            {space.name}
          </h3>
          <p className="mt-1 text-xs text-[#c9ada7]">
            {KIND_LABELS[space.kind]}
            {space.colorGroup
              ? ` · ${COLOR_GROUP_LABELS[space.colorGroup]}`
              : ""}
            {space.price != null ? ` · Preço ${formatCash(space.price)}` : ""}
          </p>
          <p className="mt-2 text-sm text-[#ffd166]">{currentLabel}</p>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
          {space.kind === "propriedade" && rent ? (
            <section>
              <h4 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#d4a373]">
                Tabela de aluguel
              </h4>
              <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
                <RentRow label="Aluguel" value={rent.base} active={!holding.mortgaged && !holding.hasResort && holding.pousadas === 0} />
                <RentRow label="Grupo completo (2×)" value={rent.monopoly} />
                <RentRow label="1 pousada" value={rent.pousadas[0]} active={holding.pousadas === 1} />
                <RentRow label="2 pousadas" value={rent.pousadas[1]} active={holding.pousadas === 2} />
                <RentRow label="3 pousadas" value={rent.pousadas[2]} active={holding.pousadas === 3} />
                <RentRow label="4 pousadas" value={rent.pousadas[3]} active={holding.pousadas === 4} />
                <RentRow label="Resort" value={rent.resort} active={holding.hasResort} />
              </dl>
            </section>
          ) : null}

          {space.kind === "transporte" ? (
            <section>
              <h4 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#d4a373]">
                Aluguel por transportes
              </h4>
              <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
                {TRANSPORT_RENT_BY_COUNT.map((v, i) => (
                  <RentRow key={v} label={`${i + 1} transporte${i ? "s" : ""}`} value={v} />
                ))}
              </dl>
            </section>
          ) : null}

          {space.kind === "companhia" ? (
            <section>
              <h4 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#d4a373]">
                Aluguel das companhias
              </h4>
              <ul className="space-y-1 text-sm text-[#c9ada7]">
                <li>1 companhia: <span className="text-[#f5f0e8]">4×</span> o total dos dados</li>
                <li>2 companhias: <span className="text-[#f5f0e8]">10×</span> o total dos dados</li>
              </ul>
            </section>
          ) : null}

          {space.kind === "propriedade" && space.colorGroup && buildCost != null ? (
            <section>
              <h4 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#d4a373]">
                Construção · {COLOR_GROUP_LABELS[space.colorGroup]}
              </h4>
              <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-[#c9ada7]">Cada pousada</dt>
                <dd className="tabular-nums">{formatCash(buildCost)}</dd>
                <dt className="text-[#c9ada7]">Resort</dt>
                <dd className="tabular-nums">
                  {formatCash(buildCost)} + 4 pousadas
                </dd>
                <dt className="text-[#c9ada7]">Venda ao banco</dt>
                <dd className="tabular-nums">
                  {formatCash(Math.floor(buildCost / 2))} / peça
                </dd>
              </dl>
              <p className="mt-2 text-[11px] leading-relaxed text-[#c9ada7]/90">
                Custo de pousada neste grupo:{" "}
                {formatCash(BUILD_COST_BY_GROUP[space.colorGroup])}. Construção
                uniforme obrigatória.
              </p>
            </section>
          ) : null}

          <section>
            <h4 className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#d4a373]">
              Hipoteca
            </h4>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-[#c9ada7]">Recebe ao hipotecar</dt>
              <dd className="tabular-nums text-[#ffd166]">{formatCash(mValue)}</dd>
              <dt className="text-[#c9ada7]">Juros (10%)</dt>
              <dd className="tabular-nums">{formatCash(mInterest)}</dd>
              <dt className="text-[#c9ada7]">Resgate</dt>
              <dd className="tabular-nums">{formatCash(rCost)}</dd>
            </dl>
          </section>

          {actionError ? (
            <p className="rounded-lg bg-[#e07a5f]/15 px-3 py-2 text-xs text-[#f0a090]">
              {actionError}
            </p>
          ) : null}
        </div>

        <footer className="space-y-2 border-t border-white/10 px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            {!holding.mortgaged ? (
              <ActionButton
                disabled={!mortgageOk.ok}
                onClick={onMortgage}
                tone="warn"
              >
                Hipotecar · {formatCash(mValue)}
              </ActionButton>
            ) : (
              <ActionButton
                disabled={!redeemOk}
                onClick={onRedeem}
                tone="ok"
              >
                Resgatar · {formatCash(rCost)}
              </ActionButton>
            )}

            <ActionButton
              disabled={!sellOk.ok}
              onClick={onSellBuilding}
              tone="neutral"
            >
              Vender construção
              {buildCost != null
                ? ` · ${formatCash(Math.floor(buildCost / 2))}`
                : ""}
            </ActionButton>
          </div>

          {space.kind === "propriedade" ? (
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                disabled={!pousadaOk.ok}
                onClick={onBuildPousada}
                tone="ok"
              >
                Pousada
                {buildCost != null ? ` · ${formatCash(buildCost)}` : ""}
              </ActionButton>
              <ActionButton
                disabled={!resortOk.ok}
                onClick={onBuildResort}
                tone="ok"
              >
                Resort
                {buildCost != null ? ` · ${formatCash(buildCost)}` : ""}
              </ActionButton>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-[#c4a484]/35 px-3 py-2 text-sm text-[#f5f0e8] hover:bg-white/5"
          >
            Fechar escritura
          </button>
        </footer>
      </div>
    </div>
  );
}

function RentRow({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <>
      <dt className={active ? "text-[#ffd166]" : "text-[#c9ada7]"}>{label}</dt>
      <dd
        className={`tabular-nums ${active ? "font-semibold text-[#ffd166]" : ""}`}
      >
        {formatCash(value)}
      </dd>
    </>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "ok" | "warn" | "neutral";
}) {
  const bg =
    tone === "ok"
      ? "bg-[#2a9d8f] text-white"
      : tone === "warn"
        ? "bg-[#c45c76] text-white"
        : "bg-[#c4a484]/25 text-[#f5f0e8]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-2 py-2 text-xs font-semibold leading-snug disabled:opacity-35 ${bg}`}
    >
      {children}
    </button>
  );
}
