import type { ReactNode } from "react";
import {
  BUILD_COST_BY_GROUP,
  COLOR_GROUP_LABELS,
  KIND_LABELS,
  PROPERTY_RENT,
  TRANSPORT_RENT_BY_COUNT,
  BANK_POUSADAS_MAX,
  BANK_RESORTS_MAX,
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
  type BankStock,
  type PlayerState,
  type PropertyHolding,
} from "@cidadela/shared";
import { GROUP_COLORS } from "../scene/colors";

type Props = {
  player: PlayerState;
  holding: PropertyHolding;
  bankStock: BankStock;
  scarcePousada?: boolean;
  scarceResort?: boolean;
  onClose: () => void;
  onMortgage: () => void;
  onRedeem: () => void;
  onSellBuilding: () => void;
  onBuildPousada: () => void;
  onBuildResort: () => void;
  actionError: string | null;
};

function bandInk(hex: string): "light" | "dark" {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return "light";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "dark" : "light";
}

export function DeedDetailOverlay({
  player,
  holding,
  bankStock,
  scarcePousada = false,
  scarceResort = false,
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
          : "#e9a46c";
  const ink = bandInk(accent);
  const dark = ink === "dark";

  const rent = PROPERTY_RENT[holding.spaceIndex];
  const buildCost = buildCostForSpace(holding.spaceIndex);
  const mValue = mortgageValue(holding.spaceIndex);
  const mInterest = mortgageInterest(holding.spaceIndex);
  const rCost = redeemCost(holding.spaceIndex);

  const mortgageOk = canMortgage(player, holding.spaceIndex);
  const redeemOk = holding.mortgaged && player.cash >= rCost;
  const sellOk = canSellBuilding(player, holding.spaceIndex, bankStock);
  const pousadaOk = canBuildPousada(player, holding.spaceIndex, {
    stock: bankStock,
    ignoreCash: scarcePousada,
    ignoreStock: scarcePousada,
  });
  const resortOk = canBuildResort(player, holding.spaceIndex, {
    stock: bankStock,
    ignoreCash: scarceResort,
    ignoreStock: scarceResort,
  });

  const currentLabel = holding.mortgaged
    ? "Hipotecada (sem aluguel)"
    : holding.hasResort
      ? "Resort"
      : holding.pousadas > 0
        ? `${holding.pousadas} pousada${holding.pousadas > 1 ? "s" : ""}`
        : "Terreno sem construção";

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Escritura: ${space.name}`}
        className="deed-sheet flex max-h-[90dvh] w-full max-w-md flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="deed-sheet__band"
          style={{ backgroundColor: accent }}
        >
          <p
            className={`deed-sheet__kicker ${dark ? "deed-sheet__kicker--dark" : ""}`}
          >
            Escritura · casa {space.index}
          </p>
          <h3
            className={`deed-sheet__title ${dark ? "deed-sheet__title--dark" : ""}`}
          >
            {space.name}
          </h3>
          <p
            className={`deed-sheet__sub ${dark ? "deed-sheet__sub--dark" : ""}`}
          >
            {KIND_LABELS[space.kind]}
            {space.colorGroup
              ? ` · ${COLOR_GROUP_LABELS[space.colorGroup]}`
              : ""}
            {space.price != null ? ` · ${formatCash(space.price)}` : ""}
          </p>
        </header>

        <div className="deed-sheet__body min-h-0 flex-1 overflow-y-auto">
          <p
            className={`deed-sheet__status ${holding.mortgaged ? "deed-sheet__status--mortgage" : ""}`}
          >
            {currentLabel}
          </p>

          {space.kind === "propriedade" && rent ? (
            <section className="deed-sheet__section">
              <h4 className="deed-sheet__section-title">Tabela de aluguel</h4>
              <dl className="deed-sheet__rows">
                <RentRow
                  label="Aluguel"
                  value={rent.base}
                  active={
                    !holding.mortgaged &&
                    !holding.hasResort &&
                    holding.pousadas === 0
                  }
                />
                <RentRow label="Grupo completo (2×)" value={rent.monopoly} />
                <RentRow
                  label="1 pousada"
                  value={rent.pousadas[0]}
                  active={holding.pousadas === 1}
                />
                <RentRow
                  label="2 pousadas"
                  value={rent.pousadas[1]}
                  active={holding.pousadas === 2}
                />
                <RentRow
                  label="3 pousadas"
                  value={rent.pousadas[2]}
                  active={holding.pousadas === 3}
                />
                <RentRow
                  label="4 pousadas"
                  value={rent.pousadas[3]}
                  active={holding.pousadas === 4}
                />
                <RentRow
                  label="Resort"
                  value={rent.resort}
                  active={holding.hasResort}
                />
              </dl>
            </section>
          ) : null}

          {space.kind === "transporte" ? (
            <section className="deed-sheet__section">
              <h4 className="deed-sheet__section-title">
                Aluguel por transportes
              </h4>
              <dl className="deed-sheet__rows">
                {TRANSPORT_RENT_BY_COUNT.map((v, i) => (
                  <RentRow
                    key={v}
                    label={`${i + 1} transporte${i ? "s" : ""}`}
                    value={v}
                  />
                ))}
              </dl>
            </section>
          ) : null}

          {space.kind === "companhia" ? (
            <section className="deed-sheet__section">
              <h4 className="deed-sheet__section-title">
                Aluguel das companhias
              </h4>
              <ul className="m-0 list-none space-y-1 p-0 text-sm font-bold text-[#5c3d2e]">
                <li>
                  1 companhia: <span className="text-[#1f6b45]">4×</span> o
                  total dos dados
                </li>
                <li>
                  2 companhias: <span className="text-[#1f6b45]">10×</span> o
                  total dos dados
                </li>
              </ul>
            </section>
          ) : null}

          {space.kind === "propriedade" &&
          space.colorGroup &&
          buildCost != null ? (
            <section className="deed-sheet__section">
              <h4 className="deed-sheet__section-title">
                Construção · {COLOR_GROUP_LABELS[space.colorGroup]}
              </h4>
              <dl className="deed-sheet__rows">
                <dt>Cada pousada</dt>
                <dd>{formatCash(buildCost)}</dd>
                <dt>Resort</dt>
                <dd>{formatCash(buildCost)} + 4 pousadas</dd>
                <dt>Venda ao banco</dt>
                <dd>{formatCash(Math.floor(buildCost / 2))} / peça</dd>
              </dl>
              <p className="deed-sheet__note">
                Custo neste grupo:{" "}
                {formatCash(BUILD_COST_BY_GROUP[space.colorGroup])}. Construção
                uniforme obrigatória. Estoque do banco: {bankStock.pousadas}/
                {BANK_POUSADAS_MAX} pousadas · {bankStock.resorts}/
                {BANK_RESORTS_MAX} resorts.
              </p>
            </section>
          ) : null}

          <section className="deed-sheet__section">
            <h4 className="deed-sheet__section-title">Hipoteca</h4>
            <dl className="deed-sheet__rows">
              <dt>Recebe ao hipotecar</dt>
              <dd>{formatCash(mValue)}</dd>
              <dt>Juros (10%)</dt>
              <dd>{formatCash(mInterest)}</dd>
              <dt>Resgate</dt>
              <dd>{formatCash(rCost)}</dd>
            </dl>
          </section>

          {actionError ? (
            <p className="deed-sheet__error">{actionError}</p>
          ) : null}
        </div>

        <footer className="deed-sheet__footer">
          <div className="deed-sheet__actions">
            {!holding.mortgaged ? (
              <ActionButton
                disabled={!mortgageOk.ok}
                onClick={onMortgage}
                tone="warn"
              >
                Hipotecar · {formatCash(mValue)}
              </ActionButton>
            ) : (
              <ActionButton disabled={!redeemOk} onClick={onRedeem} tone="ok">
                Resgatar · {formatCash(rCost)}
              </ActionButton>
            )}

            <ActionButton
              disabled={!sellOk.ok}
              onClick={onSellBuilding}
              tone="soft"
            >
              Vender construção
              {buildCost != null
                ? ` · ${formatCash(Math.floor(buildCost / 2))}`
                : ""}
            </ActionButton>
          </div>

          {space.kind === "propriedade" ? (
            <div className="deed-sheet__actions">
              <ActionButton
                disabled={!pousadaOk.ok}
                onClick={onBuildPousada}
                tone="ok"
              >
                {scarcePousada ? "Leiloar pousada" : "Pousada"}
                {!scarcePousada && buildCost != null
                  ? ` · ${formatCash(buildCost)}`
                  : ""}
              </ActionButton>
              <ActionButton
                disabled={!resortOk.ok}
                onClick={onBuildResort}
                tone="ok"
              >
                {scarceResort ? "Leiloar resort" : "Resort"}
                {!scarceResort && buildCost != null
                  ? ` · ${formatCash(buildCost)}`
                  : ""}
              </ActionButton>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="deed-btn deed-btn--amber w-full"
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
      <dt className={active ? "is-active" : undefined}>{label}</dt>
      <dd className={active ? "is-active" : undefined}>{formatCash(value)}</dd>
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
  tone: "ok" | "warn" | "soft";
}) {
  const cls =
    tone === "ok"
      ? "deed-btn--mint"
      : tone === "warn"
        ? "deed-btn--warn"
        : "deed-btn--soft";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`deed-btn ${cls}`}
    >
      {children}
    </button>
  );
}
