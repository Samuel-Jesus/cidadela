import {
  DECK_LABELS,
  type CardDef,
} from "@cidadela/shared";

type Props = {
  card: CardDef;
  onDismiss: () => void;
};

export function DrawnCardModal({ card, onDismiss }: Props) {
  const accent = card.deck === "fitinha" ? "#f0c75e" : "#d4b5b0";

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border bg-gradient-to-b from-[#2a1c14] to-[#1a120c] p-5 text-[#f5f0e8] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        style={{ borderColor: `${accent}66` }}
      >
        <p
          className="text-[10px] uppercase tracking-[0.28em]"
          style={{ color: accent }}
        >
          {DECK_LABELS[card.deck]} · nº {card.number}
        </p>
        <p className="mt-3 font-serif text-xl leading-snug text-white">
          {card.text}
        </p>
        {card.keepable ? (
          <p className="mt-3 text-xs text-[#ffd166]">
            Carta guardável — fica na sua carteira.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-[#1a120c]"
          style={{ backgroundColor: accent }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
