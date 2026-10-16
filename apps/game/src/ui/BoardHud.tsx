import {
  COLOR_GROUP_LABELS,
  KIND_LABELS,
  getSpace,
  type BoardSpace,
} from "@cidadela/shared";

type Props = {
  selectedIndex: number | null;
};

export function BoardHud({ selectedIndex }: Props) {
  const space = selectedIndex === null ? null : getSpace(selectedIndex);

  return (
    <aside className="pointer-events-none absolute right-4 top-4 z-10 w-80 rounded-xl border border-[#c4a484]/40 bg-gradient-to-b from-[#2a1c14]/95 to-[#1a120c]/95 p-4 text-[#f5f0e8] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-[#d4a373]">
        Cidadela · Three.js
      </p>
      <h1 className="mb-3 font-serif text-xl leading-tight">Tabuleiro 3D</h1>

      {space ? (
        <SpaceDetails space={space} />
      ) : (
        <p className="text-sm text-[#c9ada7]">Clique em uma casa para ver os detalhes.</p>
      )}
    </aside>
  );
}

function SpaceDetails({ space }: { space: BoardSpace }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-[#d4a373]">Casa nº {space.index}</p>
      <h2 className="font-serif text-lg leading-snug text-white">{space.name}</h2>
      <p className="text-xs text-[#c9ada7]">Landmark 3D low-poly desta casa</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-[#c4a484]/25 pt-3">
        <dt className="text-[#c9ada7]">Tipo</dt>
        <dd>{KIND_LABELS[space.kind]}</dd>

        {space.colorGroup ? (
          <>
            <dt className="text-[#c9ada7]">Grupo</dt>
            <dd>{COLOR_GROUP_LABELS[space.colorGroup]}</dd>
          </>
        ) : null}

        {space.price !== undefined ? (
          <>
            <dt className="text-[#c9ada7]">Preço</dt>
            <dd>${space.price}</dd>
          </>
        ) : null}

        {space.taxAmount !== undefined ? (
          <>
            <dt className="text-[#c9ada7]">Taxa</dt>
            <dd>Pague ${space.taxAmount}</dd>
          </>
        ) : null}

        {space.kind === "chegada" ? (
          <>
            <dt className="text-[#c9ada7]">Efeito</dt>
            <dd>Receba $200</dd>
          </>
        ) : null}

        {space.kind === "carnaval" ? (
          <>
            <dt className="text-[#c9ada7]">Efeito</dt>
            <dd>Nada acontece</dd>
          </>
        ) : null}

        {space.kind === "va_para_o_forte" ? (
          <>
            <dt className="text-[#c9ada7]">Efeito</dt>
            <dd>Direto ao Forte (sem $200)</dd>
          </>
        ) : null}

        {space.kind === "forte" ? (
          <>
            <dt className="text-[#c9ada7]">Efeito</dt>
            <dd>Prisão / só visita</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}
