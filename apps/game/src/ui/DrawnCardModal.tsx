import { DECK_LABELS, type CardDef } from "@cidadela/shared";

type Props = {
  card?: CardDef | null;
  notes?: string[];
  followUpCards?: CardDef[];
  title?: string;
  onDismiss: () => void;
};

export function DrawnCardModal({
  card = null,
  notes = [],
  followUpCards = [],
  title = "Resolução da casa",
  onDismiss,
}: Props) {
  const accent = card
    ? card.deck === "fitinha"
      ? "#fbbf24"
      : "#fb7185"
    : "#fbbf24";

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="deed-sheet max-h-[90dvh] w-full max-w-md overflow-y-auto"
        style={{ borderColor: "#5c3d2e" }}
      >
        {card ? (
          <header
            className="deed-sheet__band"
            style={{ backgroundColor: accent }}
          >
            <p
              className={`deed-sheet__kicker ${card.deck === "fitinha" ? "deed-sheet__kicker--dark" : ""}`}
            >
              {DECK_LABELS[card.deck]} · nº {card.number}
            </p>
            <h3
              className={`deed-sheet__title text-lg ${card.deck === "fitinha" ? "deed-sheet__title--dark" : ""}`}
            >
              {card.text}
            </h3>
          </header>
        ) : (
          <header
            className="deed-sheet__band"
            style={{ backgroundColor: "#fbbf24" }}
          >
            <p className="deed-sheet__kicker deed-sheet__kicker--dark">
              Cidadela
            </p>
            <h3 className="deed-sheet__title deed-sheet__title--dark text-lg">
              {title}
            </h3>
          </header>
        )}

        <div className="deed-sheet__body">
          {card?.keepable ? (
            <p className="deed-sheet__status">
              Carta guardável — fica na sua carteira.
            </p>
          ) : null}

          {notes.length > 0 ? (
            <ul className="m-0 list-none space-y-1.5 p-0 text-sm font-bold leading-relaxed text-[#5c3d2e]">
              {notes.map((note) => (
                <li
                  key={note}
                  className="rounded-lg border-2 border-[#5c3d2e] bg-white/70 px-3 py-2 shadow-[2px_2px_0_rgba(92,61,46,0.2)]"
                >
                  {note}
                </li>
              ))}
            </ul>
          ) : null}

          {followUpCards.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="deed-sheet__section-title">Em seguida</p>
              {followUpCards.map((c) => (
                <div key={c.id} className="deed-sheet__section">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a6a4e]">
                    {DECK_LABELS[c.deck]} · nº {c.number}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#5c3d2e]">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <footer className="deed-sheet__footer">
          <button
            type="button"
            onClick={onDismiss}
            className="deed-btn deed-btn--amber w-full"
          >
            Entendi
          </button>
        </footer>
      </div>
    </div>
  );
}
