import { useTranslation } from "react-i18next";
import {
  COLOR_GROUP_LABELS,
  KIND_LABELS,
  findPropertyOwner,
  formatCash,
  getPawnDef,
  getPlayerLabel,
  getSpace,
  isBuyableKind,
  type PlayerState,
} from "@cidadela/shared";
import { stripeColor, tileColor } from "../scene/colors";

type Props = {
  spaceIndex: number | null;
  players: PlayerState[];
};

export function SpaceSelectMarker({ spaceIndex, players }: Props) {
  const { t } = useTranslation();
  if (spaceIndex === null) return null;

  const space = getSpace(spaceIndex);
  const accent = stripeColor(space) ?? tileColor(space);
  const kindLabel = KIND_LABELS[space.kind];
  const groupLabel = space.colorGroup
    ? COLOR_GROUP_LABELS[space.colorGroup]
    : null;
  const owner =
    space.price !== undefined && isBuyableKind(space.kind)
      ? findPropertyOwner(players, spaceIndex)
      : null;
  const ownerDef = owner ? getPawnDef(owner.pawnId) : null;
  const showOwner = space.price !== undefined && isBuyableKind(space.kind);

  return (
    <div
      className="space-marker pointer-events-none absolute inset-x-0 z-20 flex justify-center px-3"
      style={{
        top: "max(0.65rem, env(safe-area-inset-top, 0px))",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="space-marker__card"
        style={{ ["--space-accent" as string]: accent }}
      >
        <span className="space-marker__stripe" aria-hidden />
        <div className="space-marker__body">
          <p className="space-marker__kicker">
            {t("hud.houseN", { n: space.index })}
            <span className="space-marker__dot" aria-hidden>
              ·
            </span>
            <span className="space-marker__kind">{kindLabel}</span>
          </p>
          <p className="space-marker__name">{space.name}</p>
          <p className="space-marker__meta">
            {space.price != null ? (
              <span className="space-marker__price">
                {formatCash(space.price)}
              </span>
            ) : null}
            {groupLabel ? (
              <span className="space-marker__group">{groupLabel}</span>
            ) : null}
            {space.taxAmount != null ? (
              <span className="space-marker__tax">
                {t("hud.taxPay", { amount: formatCash(space.taxAmount) })}
              </span>
            ) : null}
            {showOwner ? (
              <span className="space-marker__owner">
                {ownerDef && owner ? (
                  <>
                    <span
                      className="space-marker__owner-dot"
                      style={{ backgroundColor: ownerDef.color }}
                      aria-hidden
                    />
                    {getPlayerLabel(owner)}
                  </>
                ) : (
                  t("hud.bankOwner")
                )}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
