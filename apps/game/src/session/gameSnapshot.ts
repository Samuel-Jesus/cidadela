import type { DiceRoll } from "@cidadela/engine";
import {
  createDecks,
  createPlayersFromLobby,
  type AuctionLot,
  type CardDef,
  type DebtInfo,
  type DecksState,
  type LobbySetup,
  type MortgageChoice,
  type PendingRentClaim,
  type PlayerState,
  type TradeSide,
} from "@cidadela/shared";

export type PendingTradeProposal = {
  fromId: string;
  toId: string;
  give: TradeSide;
  receive: TradeSide;
  resolutions: { spaceIndex: number; choice: MortgageChoice }[];
};

export type TurnPhase =
  | "roll"
  | "busy"
  | "action"
  | "debt"
  | "auction"
  | "ended";

export type AuctionSession = {
  lot: AuctionLot;
  queue: AuctionLot[];
  currentBid: number;
  highBidderId: string | null;
  tiedBidderIds: string[] | null;
  excludedIds: string[];
  passesSinceBid: number;
  resumePlayerId: string;
};

export type PendingLanding = {
  playerId: string;
  utilityDiceTotal?: number;
};

export type GameSnapshot = {
  v: 1;
  players: PlayerState[];
  activePlayerId: string | null;
  turnPhase: TurnPhase;
  decks: DecksState;
  diceRoll: DiceRoll | null;
  diceRollId: number;
  consecutiveDoubles: number;
  pendingDebt: DebtInfo | null;
  pendingRent: PendingRentClaim | null;
  auction: AuctionSession | null;
  pendingAuctions: AuctionLot[];
  winnerId: string | null;
  drawnCard: CardDef | null;
  cardNotes: string[];
  followUpCards: CardDef[];
  showEventModal: boolean;
  eventAudience: string[] | null;
  showTrade: boolean;
  pendingTrade: PendingTradeProposal | null;
  jailError: string | null;
  pendingLanding: PendingLanding | null;
  extraRoll: boolean;
  forceEndTurn: boolean;
  resumePhaseAfterModal: TurnPhase | null;
  auctionAdvanceAfterModal: AuctionSession | null;
  lastAppliedActionId: number | null;
};

export function createInitialSnapshot(setup: LobbySetup): GameSnapshot {
  const players = createPlayersFromLobby(setup);
  return {
    v: 1,
    players,
    activePlayerId: players[0]?.id ?? null,
    turnPhase: "roll",
    decks: createDecks(),
    diceRoll: null,
    diceRollId: 0,
    consecutiveDoubles: 0,
    pendingDebt: null,
    pendingRent: null,
    auction: null,
    pendingAuctions: [],
    winnerId: null,
    drawnCard: null,
    cardNotes: [],
    followUpCards: [],
    showEventModal: false,
    eventAudience: null,
    showTrade: false,
    pendingTrade: null,
    jailError: null,
    pendingLanding: null,
    extraRoll: false,
    forceEndTurn: false,
    resumePhaseAfterModal: null,
    auctionAdvanceAfterModal: null,
    lastAppliedActionId: null,
  };
}

export type GameIntent =
  | { type: "rollDice" }
  | { type: "buySelected"; spaceIndex: number }
  | { type: "passTurn" }
  | { type: "drawCard" }
  | { type: "dismissEvent" }
  | { type: "claimRent" }
  | { type: "payDebt" }
  | { type: "liquidateForDebt" }
  | { type: "declareBankruptcy" }
  | { type: "forfeitToBank" }
  | { type: "payJailFine" }
  | { type: "useJailProtection" }
  | { type: "auctionBid"; amount: number }
  | { type: "auctionPass" }
  | { type: "auctionSell" }
  | { type: "auctionNoBids" }
  | { type: "auctionResolveTie" }
  | { type: "openTrade" }
  | { type: "closeTrade" }
  | {
    type: "proposeTrade";
    proposal: PendingTradeProposal;
  }
  | { type: "respondTrade"; accept: boolean }
  | { type: "cancelTrade" }
  | {
    type: "setPlayers";
    players: PlayerState[];
  }
  | {
    type: "requestPieceAuction";
    kind: "pousada" | "resort";
    spaceIndex: number;
  }
  | { type: "advanceActive"; steps: number }
  | { type: "moveActiveTo"; spaceIndex: number }
  | { type: "selectSpace"; spaceIndex: number | null };
