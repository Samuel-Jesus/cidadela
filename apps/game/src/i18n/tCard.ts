import type { CardDef, DeckId, ProtectionKind } from "@cidadela/shared";
import type { TFunction } from "i18next";

export function tCardText(t: TFunction, card: CardDef): string {
  return t(`cards.${card.id}`, { defaultValue: card.text });
}

export function tDeckLabel(t: TFunction, deck: DeckId): string {
  return t(`decks.${deck}`);
}

export function tProtectionLabel(t: TFunction, kind: ProtectionKind): string {
  return t(`protection.${kind}`);
}
