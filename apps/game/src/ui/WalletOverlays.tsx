import { useEffect, useState } from "react";
import {
  DECK_LABELS,
  PROTECTION_LABELS,
  buildPousada,
  buildResort,
  mortgageProperty,
  redeemProperty,
  sellBuilding,
  type CardDef,
  type PlayerState,
  type PropertyHolding,
} from "@cidadela/shared";
import { DeedDetailOverlay } from "./DeedDetailOverlay";

type Props = {
  player: PlayerState | null;
  players: PlayerState[];
  onPlayersChange: (players: PlayerState[]) => void;
  detailDeed: PropertyHolding | null;
  detailCard: CardDef | null;
  onDetailDeedChange: (holding: PropertyHolding | null) => void;
  onDetailCardChange: (card: CardDef | null) => void;
};

export function WalletOverlays({
  player,
  players,
  onPlayersChange,
  detailDeed,
  detailCard,
  onDetailDeedChange,
  onDetailCardChange,
}: Props) {
  const [deedError, setDeedError] = useState<string | null>(null);

  useEffect(() => {
    setDeedError(null);
  }, [detailDeed?.spaceIndex, player?.id]);

  useEffect(() => {
    if (!player || !detailDeed) return;
    const fresh = player.properties.find(
      (h) => h.spaceIndex === detailDeed.spaceIndex,
    );
    if (!fresh) {
      onDetailDeedChange(null);
      return;
    }
    if (
      fresh.mortgaged !== detailDeed.mortgaged ||
      fresh.pousadas !== detailDeed.pousadas ||
      fresh.hasResort !== detailDeed.hasResort
    ) {
      onDetailDeedChange(fresh);
    }
  }, [player, detailDeed, onDetailDeedChange]);

  if (!player) return null;

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
      {detailCard ? (
        <CardDetailOverlay
          card={detailCard}
          onClose={() => onDetailCardChange(null)}
        />
      ) : null}

      {detailDeed ? (
        <DeedDetailOverlay
          player={player}
          holding={detailDeed}
          actionError={deedError}
          onClose={() => {
            onDetailDeedChange(null);
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

function CardDetailOverlay({
  card,
  onClose,
}: {
  card: CardDef;
  onClose: () => void;
}) {
  const accent = card.deck === "fitinha" ? "#fbbf24" : "#fb7185";
  const dark = card.deck === "fitinha";
  const title =
    card.effect.type === "keep"
      ? PROTECTION_LABELS[card.effect.kind]
      : card.text;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhe da carta"
        className="wallet-card-detail deed-sheet w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="deed-sheet__band"
          style={{ backgroundColor: accent }}
        >
          <p
            className={`deed-sheet__kicker ${dark ? "deed-sheet__kicker--dark" : ""}`}
          >
            {DECK_LABELS[card.deck]} · nº {card.number}
          </p>
          <h3
            className={`deed-sheet__title ${dark ? "deed-sheet__title--dark" : ""}`}
          >
            {title}
          </h3>
        </header>
        <div className="deed-sheet__body">
          <p className="m-0 text-sm font-bold leading-relaxed text-[#5c3d2e]">
            {card.text}
          </p>
          {card.keepable ? (
            <p className="deed-sheet__status mt-3">
              Guarde para sair do Forte sem pagar. Pode ser negociada.
            </p>
          ) : null}
        </div>
        <footer className="deed-sheet__footer">
          <button
            type="button"
            onClick={onClose}
            className="deed-btn deed-btn--amber w-full"
          >
            Fechar carta
          </button>
        </footer>
      </div>
    </div>
  );
}
