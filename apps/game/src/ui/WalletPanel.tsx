import { useEffect, useId, useState } from "react";
import {
  COLOR_GROUP_LABELS,
  KIND_LABELS,
  PROPERTY_RENT,
  PROTECTION_LABELS,
  formatCash,
  getCard,
  getPawnDef,
  getSpace,
  type CardDef,
  type PlayerState,
  type PropertyHolding,
} from "@cidadela/shared";
import { GROUP_COLORS } from "../scene/colors";
import { WalletOverlays } from "./WalletOverlays";

type Props = {
  player: PlayerState | null;
  players: PlayerState[];
  onPlayersChange: (players: PlayerState[]) => void;
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

export function WalletPanel({ player, players, onPlayersChange }: Props) {
  const [open, setOpen] = useState(false);
  const [detailDeed, setDetailDeed] = useState<PropertyHolding | null>(null);
  const [detailCard, setDetailCard] = useState<CardDef | null>(null);
  const titleId = useId();

  useEffect(() => {
    setDetailDeed(null);
    setDetailCard(null);
  }, [player?.id]);

  if (!player) {
    return (
      <div className="pointer-events-auto absolute bottom-4 left-4 z-20">
        <div className="wallet-ui wallet-ui--closed px-4 py-3 text-sm text-[#6b4f3a]">
          Escolhe um peão pra ver a carteira
        </div>
      </div>
    );
  }

  const def = getPawnDef(player.pawnId);
  const holdings = [...player.properties].sort(
    (a, b) => a.spaceIndex - b.spaceIndex,
  );
  const cards = player.protectionCardIds.map((id) => getCard(id));

  return (
    <>
      <div className="pointer-events-auto absolute bottom-4 left-4 z-20">
        {!open ? (
          <button
            type="button"
            className="wallet-ui wallet-ui--closed group"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-label={`Abrir carteira de ${def.label}`}
          >
            <div className="wallet-cash-peek" aria-hidden>
              <span className="wallet-cash-peek__bill" />
              <span className="wallet-cash-peek__bill wallet-cash-peek__bill--2" />
              <span className="wallet-cash-peek__bill wallet-cash-peek__bill--3" />
            </div>
            <span className="wallet-snap" style={{ borderColor: def.color }} />
            <div className="wallet-closed-body">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-sm ring-2 ring-white/70"
                  style={{ backgroundColor: def.color }}
                  aria-hidden
                >
                  ✦
                </span>
                <div className="min-w-0 text-left">
                  <p className="truncate font-semibold text-[#5c3d2e]">
                    {def.label}
                  </p>
                  <p className="text-[11px] text-[#8a6a4e]">
                    {player.inJail ? "no Forte" : "sua carteira"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="font-[family-name:var(--font-game)] text-2xl leading-none tabular-nums text-[#1f6b45]">
                  {formatCash(player.cash)}
                </p>
                <p className="rounded-full bg-[#fff3d6] px-2 py-0.5 text-[11px] font-medium text-[#b45309] group-hover:bg-[#ffe8a3]">
                  abrir
                </p>
              </div>
              <p className="mt-2 text-[11px] text-[#9a7b5c]">
                {holdings.length} escritura{holdings.length === 1 ? "" : "s"} ·{" "}
                {cards.length} carta{cards.length === 1 ? "" : "s"}
              </p>
            </div>
          </button>
        ) : (
          <div
            className="wallet-ui wallet-ui--open"
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
          >
            <div className="wallet-hinge" aria-hidden />

            <div className="wallet-flap wallet-flap--left">
              <div className="wallet-flap__head">
                <p className="wallet-label">Dinheirinho</p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDetailDeed(null);
                    setDetailCard(null);
                  }}
                  className="wallet-close"
                >
                  fechar
                </button>
              </div>

              <div className="wallet-pocket wallet-pocket--cash">
                <div className="wallet-bill-stack" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
                <p id={titleId} className="relative z-[1] text-sm text-[#d8f3e4]">
                  {def.label}
                </p>
                <p className="relative z-[1] mt-1 font-[family-name:var(--font-game)] text-3xl tabular-nums text-white">
                  {formatCash(player.cash)}
                </p>
                <p className="relative z-[1] mt-2 text-[11px] text-[#b7e4cb]">
                  {player.inJail
                    ? "Preso, mas o bolso continua aí"
                    : "Pronto pra gastar em Salvador"}
                </p>
              </div>
            </div>

            <div className="wallet-flap wallet-flap--right">
              <div className="wallet-pocket">
                <div className="wallet-pocket__label">
                  <span>Escrituras</span>
                  <span className="wallet-chip">{holdings.length}</span>
                </div>
                {holdings.length === 0 ? (
                  <p className="wallet-empty">
                    Bolso vazio… hora de comprar um terreninho!
                  </p>
                ) : (
                  <ul className="wallet-deed-grid">
                    {holdings.map((holding, i) => (
                      <DeedCard
                        key={holding.spaceIndex}
                        holding={holding}
                        delayMs={70 + i * 35}
                        onClick={() => {
                          setDetailCard(null);
                          setDetailDeed(holding);
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <div className="wallet-pocket mt-2">
                <div className="wallet-pocket__label">
                  <span>Cartas</span>
                  <span className="wallet-chip">{cards.length}</span>
                </div>
                {cards.length === 0 ? (
                  <p className="wallet-empty">
                    Nenhuma Proteção guardada ainda.
                  </p>
                ) : (
                  <ul className="wallet-card-grid">
                    {cards.map((card, i) => (
                      <li
                        key={card.id}
                        className="wallet-item-in"
                        style={{ animationDelay: `${100 + i * 40}ms` }}
                      >
                        <button
                          type="button"
                          className="wallet-prot-card"
                          onClick={() => {
                            setDetailDeed(null);
                            setDetailCard(card);
                          }}
                        >
                          <span className="wallet-prot-card__deck">
                            {card.deck === "fitinha" ? "Fitinha" : "Bença"}
                          </span>
                          <span className="wallet-prot-card__title">
                            {card.effect.type === "keep"
                              ? PROTECTION_LABELS[card.effect.kind]
                              : card.text.replace(/^PROTEÇÃO[^:]+:\s*/i, "")}
                          </span>
                          <span className="wallet-prot-card__cta">olhar</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <WalletOverlays
        player={player}
        players={players}
        onPlayersChange={onPlayersChange}
        detailDeed={detailDeed}
        detailCard={detailCard}
        onDetailDeedChange={setDetailDeed}
        onDetailCardChange={setDetailCard}
      />
    </>
  );
}

function DeedCard({
  holding,
  onClick,
  delayMs,
}: {
  holding: PropertyHolding;
  onClick: () => void;
  delayMs: number;
}) {
  const space = getSpace(holding.spaceIndex);
  const stripe =
    space.colorGroup != null ? GROUP_COLORS[space.colorGroup] : null;
  const kindTint =
    space.kind === "transporte"
      ? "#3d7ea6"
      : space.kind === "companhia"
        ? "#7cb342"
        : "#e9a46c";
  const accent = stripe ?? kindTint;
  const ink = bandInk(accent);
  const rent = PROPERTY_RENT[holding.spaceIndex];

  let rentLine = KIND_LABELS[space.kind];
  if (rent) rentLine = `Aluguel ${formatCash(rent.base)}`;
  else if (space.kind === "transporte") rentLine = "Aluguel 25+";
  else if (space.kind === "companhia") rentLine = "4× / 10× dados";

  let badge: string | null = null;
  if (holding.mortgaged) badge = "Hipoteca";
  else if (holding.hasResort) badge = "Resort";
  else if (holding.pousadas > 0) badge = `${holding.pousadas} pous.`;

  return (
    <li className="wallet-item-in" style={{ animationDelay: `${delayMs}ms` }}>
      <button
        type="button"
        onClick={onClick}
        className={`wallet-deed-card ${holding.mortgaged ? "wallet-deed-card--muted" : ""}`}
      >
        <span
          className="wallet-deed-card__band"
          style={{ backgroundColor: accent }}
        >
          <span
            className={`wallet-deed-card__name ${ink === "dark" ? "wallet-deed-card__name--dark" : ""}`}
          >
            {space.name}
          </span>
        </span>
        <span className="wallet-deed-card__body">
          <span className="wallet-deed-card__kicker">
            {space.colorGroup
              ? COLOR_GROUP_LABELS[space.colorGroup]
              : KIND_LABELS[space.kind]}
          </span>
          <span className="wallet-deed-card__rent">{rentLine}</span>
          <span className="wallet-deed-card__meta">
            {space.price !== undefined ? (
              <span className="wallet-deed-card__price">
                {formatCash(space.price)}
              </span>
            ) : (
              <span />
            )}
            {badge ? (
              <span
                className={`wallet-deed-card__badge ${holding.mortgaged ? "wallet-deed-card__badge--mortgage" : ""}`}
              >
                {badge}
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}
