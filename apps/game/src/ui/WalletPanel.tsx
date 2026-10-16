import {
  COLOR_GROUP_LABELS,
  KIND_LABELS,
  formatCash,
  getCard,
  getPawnDef,
  getSpace,
  type PlayerState,
  type PropertyHolding,
} from "@cidadela/shared";
import { GROUP_COLORS } from "../scene/colors";

type Props = {
  player: PlayerState | null;
};

export function WalletPanel({ player }: Props) {
  if (!player) {
    return (
      <aside className="pointer-events-auto absolute left-4 top-4 z-10 w-72 rounded-xl border border-[#c4a484]/40 bg-gradient-to-b from-[#2a1c14]/95 to-[#1a120c]/95 p-4 text-[#f5f0e8] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <p className="text-xs text-[#c9ada7]">Selecione um peão para ver a carteira</p>
      </aside>
    );
  }

  const def = getPawnDef(player.pawnId);
  const holdings = [...player.properties].sort(
    (a, b) => a.spaceIndex - b.spaceIndex,
  );

  return (
    <aside className="pointer-events-auto absolute left-4 top-4 z-10 flex max-h-[calc(100dvh-5rem)] w-72 flex-col gap-3 overflow-y-auto rounded-xl border border-[#c4a484]/40 bg-gradient-to-b from-[#2a1c14]/95 to-[#1a120c]/95 p-4 text-[#f5f0e8] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <header className="flex items-center gap-2.5">
        <span
          className="inline-block h-4 w-4 shrink-0 rounded-full ring-2 ring-black/30"
          style={{ backgroundColor: def.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10px] uppercase tracking-[0.28em] text-[#d4a373]">
            Carteira
          </p>
          <h2 className="truncate font-serif text-lg leading-tight">{def.label}</h2>
        </div>
      </header>

      <section className="rounded-lg bg-[#ffd166]/10 px-3 py-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4a373]">
          Dinheiro
        </p>
        <p className="mt-1 font-serif text-3xl tabular-nums text-[#ffd166]">
          {formatCash(player.cash)}
        </p>
        {player.inJail ? (
          <p className="mt-1.5 text-xs text-[#e07a5f]">Preso no Forte</p>
        ) : null}
      </section>

      <section className="space-y-2 border-t border-[#c4a484]/25 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-[#d4a373]">Escrituras</h3>
          <span className="text-xs text-[#c9ada7]">{holdings.length}</span>
        </div>

        {holdings.length === 0 ? (
          <p className="text-xs leading-relaxed text-[#c9ada7]">
            Nenhuma escritura ainda. Compre propriedades, transportes ou
            companhias ao cair nelas.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {holdings.map((holding) => (
              <DeedRow key={holding.spaceIndex} holding={holding} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-1.5 border-t border-[#c4a484]/25 pt-3">
        <h3 className="text-sm font-medium text-[#d4a373]">Cartas</h3>
        {player.protectionCardIds.length > 0 ? (
          <ul className="space-y-1.5">
            {player.protectionCardIds.map((id) => {
              const card = getCard(id);
              return (
                <li
                  key={id}
                  className="rounded-lg bg-white/5 px-2.5 py-2 text-sm leading-snug"
                >
                  {card.text.replace(/^PROTEÇÃO[^:]+:\s*/i, "")}
                  <span className="mt-0.5 block text-[11px] text-[#c9ada7]">
                    {card.deck === "fitinha" ? "Fitinha" : "Bença"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-[#c9ada7]">Nenhuma carta em mãos</p>
        )}
      </section>
    </aside>
  );
}

function DeedRow({ holding }: { holding: PropertyHolding }) {
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
  if (space.colorGroup) {
    meta = COLOR_GROUP_LABELS[space.colorGroup];
  }
  if (holding.hasResort) {
    meta += " · Resort";
  } else if (holding.pousadas > 0) {
    meta += ` · ${holding.pousadas} pousada${holding.pousadas > 1 ? "s" : ""}`;
  }
  if (holding.mortgaged) {
    meta += " · Hipotecada";
  }

  return (
    <li
      className={`flex gap-2 overflow-hidden rounded-lg bg-white/5 ${
        holding.mortgaged ? "opacity-60" : ""
      }`}
    >
      <span
        className="w-1.5 shrink-0 self-stretch"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="min-w-0 flex-1 py-1.5 pr-2">
        <p className="truncate text-sm leading-snug">{space.name}</p>
        <p className="mt-0.5 text-[11px] text-[#c9ada7]">{meta}</p>
      </div>
      {space.price !== undefined ? (
        <span className="shrink-0 self-center pr-2 text-xs tabular-nums text-[#c9ada7]">
          {formatCash(space.price)}
        </span>
      ) : null}
    </li>
  );
}
