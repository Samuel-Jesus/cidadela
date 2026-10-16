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
