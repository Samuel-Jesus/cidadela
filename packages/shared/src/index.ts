export type { BoardSpace, ColorGroup, SpaceKind } from "./types";
export {
  COLOR_GROUP_LABELS,
  KIND_LABELS,
} from "./types";
export { BOARD, COLOR_GROUPS, getSpace } from "./board";
export type { PawnDef, PawnId, PlayerState, PropertyHolding } from "./pawns";
export {
  PAWNS,
  STARTING_CASH,
  GO_BONUS,
  createPlayers,
  getPawnDef,
  formatCash,
  findPropertyOwner,
  isBuyableKind,
  buyProperty,
} from "./pawns";
export type {
  DeckId,
  ProtectionKind,
  CardEffect,
  CardId,
  CardDef,
  DeckState,
  DecksState,
  DrawResult,
} from "./cards";
export {
  DECK_LABELS,
  PROTECTION_LABELS,
  TRANSPORT_INDICES,
  UTILITY_INDICES,
  JAIL_INDEX,
  FITINHA_CARDS,
  BENCA_CARDS,
  ALL_CARDS,
  getCard,
  cardsForDeck,
  deckIdFromSpaceKind,
  nearestAhead,
  createDecks,
  drawCard,
  discardCard,
  returnCardToBottom,
  deckCounts,
} from "./cards";
export type { CardResolveResult, CardResolveOptions } from "./cardEffects";
export { resolveCardEffect, drawAndResolveCard } from "./cardEffects";
export type { SpaceResolveResult, SpaceResolveOptions } from "./spaceResolve";
export { resolveSpaceLanding } from "./spaceResolve";
export {
  JAIL_FINE,
  JAIL_MAX_ATTEMPTS,
  sendToJail,
  releaseFromJail,
  payJailFine,
  useProtectionToLeaveJail,
  forceLeaveJailAfterFailedAttempts,
} from "./jail";
export type { Creditor, DebtInfo, SettleResult } from "./bankruptcy";
export {
  maxRaisableCash,
  liquidateAll,
  settleDebt,
  payPendingDebt,
  declareBankruptcy,
} from "./bankruptcy";
export type { AuctionLot, BidValidation } from "./auction";
export {
  minBidIncrement,
  minimumNextBid,
  validateBid,
  awardAuctionLot,
} from "./auction";
export type { PropertyRentRow } from "./rent";
export {
  TRANSPORT_RENT_BY_COUNT,
  PROPERTY_RENT,
  countTransports,
  countUtilities,
  ownsFullColorGroup,
  colorGroupHasMortgage,
  propertyRentAmount,
  transportRentAmount,
  utilityRentAmount,
  transferCash,
  payBank,
  chargeRentIfOwned,
} from "./rent";
export type { ActionResult } from "./propertyActions";
export {
  BUILD_COST_BY_GROUP,
  mortgageValue,
  mortgageInterest,
  redeemCost,
  buildCostForSpace,
  canMortgage,
  mortgageProperty,
  redeemProperty,
  canBuildPousada,
  buildPousada,
  canBuildResort,
  buildResort,
  canSellBuilding,
  sellBuilding,
} from "./propertyActions";
export type { BankStock } from "./bankStock";
export {
  BANK_POUSADAS_MAX,
  BANK_RESORTS_MAX,
  createBankStock,
  countBuildingsOnBoard,
  bankStockFromPlayers,
  countBuildingsInHoldings,
} from "./bankStock";
export {
  alivePlayers,
  findWinner,
  isGameOver,
} from "./gameEnd";
