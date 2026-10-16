import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  onRequestPieceAuction?: (
    kind: "pousada" | "resort",
    spaceIndex: number,
  ) => void;
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

function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as CSSProperties;
}

function fanAngle(i: number) {
  const steps = [-2.2, 1.6, -1, 2.4, -1.6, 1.1];
  return `${steps[i % steps.length]}deg`;
}

export function WalletPanel({
  player,
  players,
  onPlayersChange,
  onRequestPieceAuction,
}: Props) {
  const [open, setOpen] = useState(false);
  const [detailDeed, setDetailDeed] = useState<PropertyHolding | null>(null);
  const [detailCard, setDetailCard] = useState<CardDef | null>(null);
  const cardsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setDetailDeed(null);
    setDetailCard(null);
  }, [player?.id]);

  const closeWallet = () => {
    setOpen(false);
    setDetailDeed(null);
    setDetailCard(null);
  };

  if (!player) {
    return (
      <div className="pointer-events-auto absolute bottom-4 left-4 z-20">
        <div className="wlt-none">Escolhe um peão pra ver a carteira</div>
      </div>
    );
  }

  const def = getPawnDef(player.pawnId);
  const holdings = [...player.properties].sort(
    (a, b) => a.spaceIndex - b.spaceIndex,
  );
  const cards = player.protectionCardIds.map((id) => getCard(id));
  const totalItems = holdings.length + cards.length;
  const billCount =
    player.cash <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(player.cash / 500)));

  const activate = (fn: () => void) => {
    if (!open) {
      setOpen(true);
      return;
    }
    fn();
  };

  return (
    <>
      <div className="pointer-events-auto absolute bottom-5 left-4 z-20">
        <div
          className={`wlt ${open ? "wlt--open" : ""}`}
          style={cssVars({ "--wlt-accent": def.color })}
        >
          <div className="wlt__lining">
            <div className="wlt__head">
              <span className="wlt__who">
                <span
                  className="wlt__dot"
                  style={{ backgroundColor: def.color }}
                />
                <span className="wlt__who-name">{def.label}</span>
              </span>
              {totalItems > 3 ? <span className="wlt__hint">role →</span> : null}
              <button
                type="button"
                className="wlt__close"
                tabIndex={open ? 0 : -1}
                onClick={closeWallet}
              >
                fechar
              </button>
            </div>
          </div>

          <div className="wlt__tray">
            <div className="wlt__bills" aria-hidden>
              {Array.from({ length: billCount }, (_, i) => (
                <span
                  key={i}
                  className="wlt__bill"
                  style={cssVars({
                    "--i": i,
                    "--rot": `${(i - (billCount - 1) / 2) * 5 + 2}deg`,
                  })}
                >
                  <span className="wlt__coin">$</span>
                  {i === billCount - 1 ? (
                    <span className="wlt__amount">
                      {formatCash(player.cash)}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>

            <ul
              ref={cardsRef}
              className="wlt__cards"
              onWheel={(e) => {
                if (cardsRef.current) cardsRef.current.scrollLeft += e.deltaY;
              }}
            >
              {totalItems === 0 ? (
                <li className="wlt-empty">
                  Sem escrituras ainda… hora de comprar um terreninho!
                </li>
              ) : null}

              {holdings.map((holding, i) => (
                <DeedCard
                  key={holding.spaceIndex}
                  holding={holding}
                  index={i}
                  focusable={open}
                  onClick={() =>
                    activate(() => {
                      setDetailCard(null);
                      setDetailDeed(holding);
                    })
                  }
                />
              ))}

              {cards.map((card, i) => (
                <ProtectionCard
                  key={card.id}
                  card={card}
                  index={holdings.length + i}
                  focusable={open}
                  onClick={() =>
                    activate(() => {
                      setDetailDeed(null);
                      setDetailCard(card);
                    })
                  }
                />
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="wlt__pocket"
            aria-expanded={open}
            aria-label={
              open
                ? `Fechar carteira de ${def.label}`
                : `Abrir carteira de ${def.label}`
            }
            onClick={() => (open ? closeWallet() : setOpen(true))}
          >
            <span className="wlt__pocket-main">
              <span className="wlt__label">{def.label}</span>
              <span className="wlt__cash">{formatCash(player.cash)}</span>
            </span>
            <span className="wlt__pocket-meta">
              {player.inJail ? (
                <span className="wlt__chip wlt__chip--jail">no Forte</span>
              ) : null}
              <span className="wlt__chip">
                {holdings.length} escritura{holdings.length === 1 ? "" : "s"}
              </span>
              <span className="wlt__chip">
                {cards.length} carta{cards.length === 1 ? "" : "s"}
              </span>
            </span>
          </button>

          <span className="wlt__strap" aria-hidden>
            <span className="wlt__snap" />
          </span>
        </div>
      </div>

      <WalletOverlays
        player={player}
        players={players}
        onPlayersChange={onPlayersChange}
        onRequestPieceAuction={onRequestPieceAuction}
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
  index,
  focusable,
  onClick,
}: {
  holding: PropertyHolding;
  index: number;
  focusable: boolean;
  onClick: () => void;
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
    <li className="wlt-card-li">
      <button
        type="button"
        tabIndex={focusable ? 0 : -1}
        onClick={onClick}
        aria-label={`Escritura: ${space.name}`}
        style={cssVars({ "--rot": fanAngle(index) })}
        className={`wlt-card ${holding.mortgaged ? "wlt-card--muted" : ""}`}
      >
        <span className="wlt-card__band" style={{ backgroundColor: accent }}>
          <span
            className={`wlt-card__name ${ink === "dark" ? "wlt-card__name--dark" : ""}`}
          >
            {space.name}
          </span>
        </span>
        <span className="wlt-card__body">
          <span className="wlt-card__kicker">
            {space.colorGroup
              ? COLOR_GROUP_LABELS[space.colorGroup]
              : KIND_LABELS[space.kind]}
          </span>
          <span className="wlt-card__rent">{rentLine}</span>
          <span className="wlt-card__meta">
            {space.price !== undefined ? (
              <span className="wlt-card__price">{formatCash(space.price)}</span>
            ) : (
              <span />
            )}
            {badge ? (
              <span
                className={`wlt-card__badge ${holding.mortgaged ? "wlt-card__badge--mortgage" : ""}`}
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

function ProtectionCard({
  card,
  index,
  focusable,
  onClick,
}: {
  card: CardDef;
  index: number;
  focusable: boolean;
  onClick: () => void;
}) {
  const accent = card.deck === "fitinha" ? "#fbbf24" : "#fb7185";
  const ink = bandInk(accent);
  const title =
    card.effect.type === "keep"
      ? PROTECTION_LABELS[card.effect.kind]
      : card.text.replace(/^PROTEÇÃO[^:]+:\s*/i, "");

  return (
    <li className="wlt-card-li">
      <button
        type="button"
        tabIndex={focusable ? 0 : -1}
        onClick={onClick}
        aria-label={`Carta: ${title}`}
        style={cssVars({ "--rot": fanAngle(index) })}
        className="wlt-card wlt-card--prot"
      >
        <span className="wlt-card__band" style={{ backgroundColor: accent }}>
          <span
            className={`wlt-card__name ${ink === "dark" ? "wlt-card__name--dark" : ""}`}
          >
            {card.deck === "fitinha" ? "Fitinha do Bonfim" : "Bença"}
          </span>
        </span>
        <span className="wlt-card__body">
          <span className="wlt-card__kicker">Proteção</span>
          <span className="wlt-card__text">{title}</span>
          <span className="wlt-card__cta">olhar →</span>
        </span>
      </button>
    </li>
  );
}
