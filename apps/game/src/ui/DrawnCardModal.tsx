import {
  DECK_LABELS,
  type CardDef,
} from "@cidadela/shared";

type Props = {
  card: CardDef;
  notes?: string[];
  followUpCards?: CardDef[];
  onDismiss: () => void;
};

export function DrawnCardModal({
  card,
  notes = [],
  followUpCards = [],
  onDismiss,
}: Props) {
  const accent = card.deck === "fitinha" ? "#f0c75e" : "#d4b5b0";

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border bg-gradient-to-b from-[#2a1c14] to-[#1a120c] p-5 text-[#f5f0e8] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
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

        {notes.length > 0 ? (
          <ul className="mt-4 space-y-1.5 rounded-lg bg-white/5 px-3 py-2.5 text-xs leading-relaxed text-[#c9ada7]">
            {notes.map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
        ) : null}

        {followUpCards.length > 0 ? (
          <div className="mt-4 space-y-3 border-t border-[#c4a484]/25 pt-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4a373]">
              Em seguida
            </p>
            {followUpCards.map((c) => (
              <div
                key={c.id}
                className="rounded-lg bg-white/5 px-3 py-2.5"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c9ada7]">
                  {DECK_LABELS[c.deck]} · nº {c.number}
                </p>
                <p className="mt-1 font-serif text-sm leading-snug text-white">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
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
