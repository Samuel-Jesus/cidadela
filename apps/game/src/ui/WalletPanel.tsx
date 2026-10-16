import { useEffect, useId, useState } from "react";
import {
  COLOR_GROUP_LABELS,
  DECK_LABELS,
  KIND_LABELS,
  PROTECTION_LABELS,
  buildPousada,
  buildResort,
  formatCash,
  getCard,
  getPawnDef,
  getSpace,
  mortgageProperty,
  redeemProperty,
  sellBuilding,
  type CardDef,
  type PlayerState,
  type PropertyHolding,
} from "@cidadela/shared";
import { GROUP_COLORS } from "../scene/colors";
import { DeedDetailOverlay } from "./DeedDetailOverlay";

type Props = {
  player: PlayerState | null;
  players: PlayerState[];
  onPlayersChange: (players: PlayerState[]) => void;
};

export function WalletPanel({ player, players, onPlayersChange }: Props) {
  const [open, setOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<CardDef | null>(null);
  const [detailDeed, setDetailDeed] = useState<PropertyHolding | null>(null);
  const [deedError, setDeedError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    setDetailCard(null);
    setDetailDeed(null);
    setDeedError(null);
  }, [player?.id]);

  useEffect(() => {
    if (!player || !detailDeed) return;
    const fresh = player.properties.find(
      (h) => h.spaceIndex === detailDeed.spaceIndex,
    );
    if (!fresh) {
      setDetailDeed(null);
      return;
    }
    if (fresh !== detailDeed) setDetailDeed(fresh);
  }, [player, detailDeed]);

  if (!player) {
    return (
      <div className="pointer-events-auto absolute bottom-4 left-4 z-20">
        <div className="rounded-lg border border-[#5c4030]/60 bg-[#2a1a12]/90 px-3 py-2 text-xs text-[#c9ada7]">
          Selecione um peão para a carteira
        </div>
      </div>
    );
  }

  const def = getPawnDef(player.pawnId);
  const holdings = [...player.properties].sort(
    (a, b) => a.spaceIndex - b.spaceIndex,
  );
  const cards = player.protectionCardIds.map((id) => getCard(id));

  const runDeedAction = (
    fn: (
      players: PlayerState[],
      playerId: string,
      spaceIndex: number,
    ) => { ok: true; players: PlayerState[] } | { ok: false; error: string },
  ) => {
    if (!detailDeed) return;
    const result = fn(players, player.id, detailDeed.spaceIndex);
    if (!result.ok) {
      setDeedError(result.error);
      return;
    }
    setDeedError(null);
    onPlayersChange(result.players);
  };

  return (
    <>
      <div className="pointer-events-auto absolute bottom-4 left-4 z-20">
        {!open ? (
          <ClosedWallet
            player={player}
            pawnColor={def.color}
            pawnLabel={def.label}
            deedCount={holdings.length}
            cardCount={cards.length}
            onOpen={() => setOpen(true)}
          />
        ) : (
          <OpenWallet
            titleId={titleId}
            player={player}
            pawnColor={def.color}
            pawnLabel={def.label}
            holdings={holdings}
            cards={cards}
            onClose={() => {
              setOpen(false);
              setDetailCard(null);
              setDetailDeed(null);
              setDeedError(null);
            }}
            onInspectCard={setDetailCard}
            onInspectDeed={(h) => {
              setDeedError(null);
              setDetailDeed(h);
            }}
          />
        )}
      </div>

      {detailCard ? (
        <CardDetailOverlay
          card={detailCard}
          onClose={() => setDetailCard(null)}
        />
      ) : null}

      {detailDeed ? (
        <DeedDetailOverlay
          player={player}
          holding={detailDeed}
          actionError={deedError}
          onClose={() => {
            setDetailDeed(null);
            setDeedError(null);
          }}
          onMortgage={() => runDeedAction(mortgageProperty)}
          onRedeem={() => runDeedAction(redeemProperty)}
          onSellBuilding={() => runDeedAction(sellBuilding)}
          onBuildPousada={() => runDeedAction(buildPousada)}
          onBuildResort={() => runDeedAction(buildResort)}
        />
      ) : null}
    </>
  );
}

function ClosedWallet({
  player,
  pawnColor,
  pawnLabel,
  deedCount,
  cardCount,
  onOpen,
}: {
  player: PlayerState;
  pawnColor: string;
  pawnLabel: string;
  deedCount: number;
  cardCount: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      aria-label={`Abrir carteira de ${pawnLabel}`}
      className="wallet-closed group relative flex h-[4.75rem] w-[11.5rem] flex-col justify-between overflow-hidden rounded-xl border border-[#3d2818] px-3 py-2.5 text-left shadow-[0_10px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,220,160,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(0,0,0,0.6)] active:translate-y-0"
      style={{
        background:
          "linear-gradient(145deg, #5a3a24 0%, #3d2416 42%, #2a170e 100%)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a373]/50 to-transparent"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-2 left-2 right-2 top-2 rounded-lg border border-dashed border-[#c4a484]/20"
        aria-hidden
      />

      <div className="relative flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full ring-2 ring-black/40"
          style={{ backgroundColor: pawnColor }}
        />
        <span className="truncate font-serif text-sm text-[#f3e6d0]">
          {pawnLabel}
        </span>
        {player.inJail ? (
          <span className="ml-auto text-[9px] uppercase tracking-wider text-[#e07a5f]">
            Forte
          </span>
        ) : null}
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] text-[#d4a373]/90">
            Carteira
          </p>
          <p className="font-serif text-xl leading-none tabular-nums text-[#ffd166]">
            {formatCash(player.cash)}
          </p>
        </div>
        <div className="text-right text-[10px] leading-tight text-[#c9ada7]">
          <p>{deedCount} escrit.</p>
          <p>
            {cardCount} carta{cardCount === 1 ? "" : "s"}
          </p>
          <p className="mt-0.5 text-[#d4a373] group-hover:text-[#ffd166]">
            Abrir →
          </p>
        </div>
      </div>

      <span
        className="pointer-events-none absolute -right-1 top-1/2 h-8 w-3 -translate-y-1/2 rounded-l-md border border-[#2a170e] bg-[#1a100a]"
        style={{ boxShadow: `inset 2px 0 0 ${pawnColor}` }}
        aria-hidden
      />
    </button>
  );
}

function OpenWallet({
  titleId,
  player,
  pawnColor,
  pawnLabel,
  holdings,
  cards,
  onClose,
  onInspectCard,
  onInspectDeed,
}: {
  titleId: string;
  player: PlayerState;
  pawnColor: string;
  pawnLabel: string;
  holdings: PropertyHolding[];
  cards: CardDef[];
  onClose: () => void;
  onInspectCard: (card: CardDef) => void;
  onInspectDeed: (holding: PropertyHolding) => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="wallet-open flex max-h-[min(78dvh,36rem)] w-[min(94vw,22rem)] flex-col overflow-hidden rounded-2xl border border-[#4a3220] shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
      style={{
        background:
          "linear-gradient(160deg, #4a2f1c 0%, #2e1b10 55%, #1c110a 100%)",
      }}
    >
      <header className="flex items-center gap-2 border-b border-[#c4a484]/20 px-3 py-2.5">
        <span
          className="h-3.5 w-3.5 rounded-full ring-2 ring-black/40"
          style={{ backgroundColor: pawnColor }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#d4a373]">
            Carteira aberta
          </p>
          <h2
            id={titleId}
            className="truncate font-serif text-base text-[#f3e6d0]"
          >
            {pawnLabel}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#c4a484]/35 bg-[#1a120c]/60 px-2.5 py-1.5 text-xs text-[#f5f0e8] hover:bg-[#1a120c]"
        >
          Fechar
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <section
          className="relative overflow-hidden rounded-xl border border-[#2a9d6a]/30 px-3 py-3"
          style={{
            background:
              "linear-gradient(135deg, #1f4d38 0%, #163528 50%, #0f241c 100%)",
          }}
        >
          <div className="absolute -right-4 -top-6 h-20 w-28 rotate-12 rounded-md bg-[#2f6b4a]/40" />
          <div className="absolute -right-1 top-4 h-14 w-24 -rotate-6 rounded-md bg-[#3d8a5f]/35" />
          <p className="relative text-[9px] uppercase tracking-[0.22em] text-[#9dceb0]">
            Dinheiro
          </p>
          <p className="relative mt-1 font-serif text-3xl tabular-nums text-[#e8f5e9]">
            {formatCash(player.cash)}
          </p>
          {player.inJail ? (
            <p className="relative mt-1 text-xs text-[#f0a090]">
              Preso no Forte
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[#d4a373]">
              Escrituras
            </h3>
            <span className="text-[11px] text-[#c9ada7]">{holdings.length}</span>
          </div>
          {holdings.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#c4a484]/25 px-3 py-3 text-xs leading-relaxed text-[#c9ada7]">
              Bolso vazio — compre terrenos, transportes ou companhias.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {holdings.map((holding) => (
                <DeedRow
                  key={holding.spaceIndex}
                  holding={holding}
                  onClick={() => onInspectDeed(holding)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2 pb-1">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[#d4a373]">
              Cartas
            </h3>
            <span className="text-[11px] text-[#c9ada7]">{cards.length}</span>
          </div>
          {cards.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#c4a484]/25 px-3 py-3 text-xs text-[#c9ada7]">
              Nenhuma carta Proteção neste bolso.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {cards.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => onInspectCard(card)}
                    className="wallet-card flex h-full min-h-[5.5rem] w-full flex-col rounded-lg border border-[#f0c75e]/35 bg-gradient-to-br from-[#3a2a14] to-[#1f160c] p-2 text-left transition hover:border-[#ffd166]/70 hover:shadow-[0_0_0_1px_rgba(255,209,102,0.25)]"
                  >
                    <span className="text-[9px] uppercase tracking-[0.16em] text-[#f0c75e]">
                      {card.deck === "fitinha" ? "Fitinha" : "Bença"}
                    </span>
                    <span className="mt-1 line-clamp-3 flex-1 font-serif text-xs leading-snug text-[#f5f0e8]">
                      {protectionTitle(card)}
                    </span>
                    <span className="mt-1 text-[10px] text-[#d4a373]">
                      Ver detalhe →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function protectionTitle(card: CardDef): string {
  if (card.effect.type === "keep") {
    return PROTECTION_LABELS[card.effect.kind];
  }
  return card.text.replace(/^PROTEÇÃO[^:]+:\s*/i, "");
}

function DeedRow({
  holding,
  onClick,
}: {
  holding: PropertyHolding;
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
        : null;
  const accent = stripe ?? kindTint ?? "#c4a484";

  let meta = KIND_LABELS[space.kind];
  if (space.colorGroup) meta = COLOR_GROUP_LABELS[space.colorGroup];
  if (holding.hasResort) meta += " · Resort";
  else if (holding.pousadas > 0) {
    meta += ` · ${holding.pousadas} pousada${holding.pousadas > 1 ? "s" : ""}`;
  }
  if (holding.mortgaged) meta += " · Hipotecada";

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full gap-2 overflow-hidden rounded-lg border border-black/20 bg-[#1a120c]/55 text-left transition hover:border-[#d4a373]/50 hover:bg-[#1a120c]/80 ${
          holding.mortgaged ? "opacity-60" : ""
        }`}
      >
        <span
          className="w-1.5 shrink-0 self-stretch"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="min-w-0 flex-1 py-1.5 pr-2">
          <p className="truncate text-sm leading-snug text-[#f5f0e8]">
            {space.name}
          </p>
          <p className="mt-0.5 text-[11px] text-[#c9ada7]">{meta}</p>
          <p className="mt-0.5 text-[10px] text-[#d4a373]">Ver escritura →</p>
        </div>
        {space.price !== undefined ? (
          <span className="shrink-0 self-center pr-2 text-xs tabular-nums text-[#c9ada7]">
            {formatCash(space.price)}
          </span>
        ) : null}
      </button>
    </li>
  );
}

function CardDetailOverlay({
  card,
  onClose,
}: {
  card: CardDef;
  onClose: () => void;
}) {
  const accent = card.deck === "fitinha" ? "#f0c75e" : "#d4b5b0";
  const title =
    card.effect.type === "keep"
      ? PROTECTION_LABELS[card.effect.kind]
      : card.text;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhe da carta"
        className="wallet-card-detail w-full max-w-sm rounded-2xl border bg-gradient-to-b from-[#2a1c14] to-[#1a120c] p-5 text-[#f5f0e8] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        style={{ borderColor: `${accent}66` }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="text-[10px] uppercase tracking-[0.28em]"
          style={{ color: accent }}
        >
          {DECK_LABELS[card.deck]} · nº {card.number}
        </p>
        <h3 className="mt-3 font-serif text-xl leading-snug text-white">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[#c9ada7]">
          {card.text}
        </p>
        {card.keepable ? (
          <p className="mt-3 rounded-lg bg-[#ffd166]/10 px-3 py-2 text-xs text-[#ffd166]">
            Guarde para sair do Forte sem pagar. Pode ser negociada com outros
            jogadores.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-[#1a120c]"
          style={{ backgroundColor: accent }}
        >
          Fechar carta
        </button>
      </div>
    </div>
  );
}
