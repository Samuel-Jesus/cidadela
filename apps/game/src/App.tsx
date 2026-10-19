import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { crossesGo, nextPosition, type DiceRoll } from "@cidadela/engine";
import {
  GO_BONUS,
  JAIL_FINE,
  JAIL_MAX_ATTEMPTS,
  applyTrade,
  awardAuctionLot,
  buyProperty,
  createDecks,
  createPlayersFromLobby,
  declareBankruptcy,
  deckIdFromSpaceKind,
  drawAndResolveCard,
  findPropertyOwner,
  findWinner,
  forceLeaveJailAfterFailedAttempts,
  getPlayerLabel,
  getSpace,
  isBuyableKind,
  liquidateAll,
  maxRaisableCash,
  payJailFine,
  payPendingDebt,
  propertyAuctionLot,
  releaseFromJail,
  resolveSpaceLanding,
  resolveTieByDice,
  sendToJail,
  settleDebt,
  useProtectionToLeaveJail,
  validateBid,
  type AuctionLot,
  type CardDef,
  type DebtInfo,
  type DecksState,
  type LobbySetup,
  type PendingRentClaim,
  type PlayerState,
} from "@cidadela/shared";
import { setPawnPathDir } from "./scene/pawnPathIntent";
import {
  beginJailEscort,
  type JailEscortMission,
} from "./scene/jailEscortState";
import {
  preloadGameAssets,
  type PreloadProgress,
} from "./boot/preloadAssets";
import { AuctionOverlay } from "./ui/AuctionOverlay";
import { BoardCanvas } from "./scene/BoardCanvas";
import { GameSfxHud } from "./audio/GameSfxHud";
import { BoardHud } from "./ui/BoardHud";
import { DrawnCardModal } from "./ui/DrawnCardModal";
import { LoadingScreen } from "./ui/LoadingScreen";
import { SpaceSelectMarker } from "./ui/SpaceSelectMarker";
import {
  LobbyScreen,
  type LobbyStartMeta,
} from "./ui/LobbyScreen";
import { SfxAdminScreen } from "./ui/SfxAdminScreen";
import { TradeOverlay } from "./ui/TradeOverlay";
import { VictoryOverlay } from "./ui/VictoryOverlay";
import { WalletPanel } from "./ui/WalletPanel";
import {
  type AuctionSession,
  type GameIntent,
  type GameSnapshot,
  type PendingLanding,
  type PendingTradeProposal,
  type TurnPhase,
} from "./session/gameSnapshot";
import {
  enqueueGameAction,
  loadGame,
  markActionApplied,
  pushGameState,
  subscribeGame,
  subscribePendingActions,
  subscribeRoomPresence,
} from "./session/gameSync";
import type { OnlineSession } from "./session/onlineSession";
import {
  clearOnlineSession,
  ensureRoomParam,
  saveOnlineSession,
} from "./session/onlinePersist";
import { isSupabaseConfigured } from "./lib/supabase";
import { clearRoomParam } from "./session/room";
import {
  OnlineStatusBanner,
  type OnlineSyncStatus,
} from "./ui/OnlineStatusBanner";
import {
  ensureSfxOverridesReady,
  playCarnavalMusic,
  playGameSfx,
  preloadUiSfx,
  stopCarnavalMusic,
} from "./audio/sfx";

const UNLUCKY_CARD_EFFECTS = new Set([
  "go_to_jail",
  "pay_bank",
  "pay_per_building",
  "pay_each",
  "move_back",
]);

function applyMove(
  player: PlayerState,
  steps: number,
  opts: { grantGoBonus: boolean; forcePosition?: number; inJail?: boolean },
): PlayerState {
  if (opts.forcePosition !== undefined) {
    if (opts.inJail) {
      return sendToJail({ ...player, position: opts.forcePosition });
    }
    return {
      ...player,
      position: opts.forcePosition,
      inJail: player.inJail,
    };
  }

  const from = player.position;
  const position = nextPosition(from, steps);
  const bonus =
    opts.grantGoBonus && crossesGo(from, steps) ? GO_BONUS : 0;
  if (bonus > 0) playGameSfx("cashGain");

  return {
    ...player,
    position,
    cash: player.cash + bonus,
  };
}

function playCashGains(
  before: readonly PlayerState[],
  after: readonly PlayerState[],
): void {
  for (const p of after) {
    const prev = before.find((x) => x.id === p.id);
    if (prev && p.cash > prev.cash) {
      playGameSfx("cashGain");
      return;
    }
  }
}

function nextPlayerId(
  players: readonly PlayerState[],
  currentId: string,
): string {
  const start = players.findIndex((p) => p.id === currentId);
  if (start < 0) {
    return players.find((p) => !p.bankrupt)?.id ?? currentId;
  }
  for (let step = 1; step <= players.length; step++) {
    const p = players[(start + step) % players.length]!;
    if (!p.bankrupt) return p.id;
  }
  return currentId;
}

function isUnownedBuyable(
  players: readonly PlayerState[],
  spaceIndex: number,
): boolean {
  const space = getSpace(spaceIndex);
  if (!isBuyableKind(space.kind) || space.price === undefined) return false;
  return !findPropertyOwner(players, spaceIndex);
}

const LOADING_MIN_MS = 2200;
const LOADING_LAND_MS = 700;

type AppScreen = "loading" | "lobby" | "game" | "sfx-admin";

export function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<AppScreen>("loading");
  const [loadProgress, setLoadProgress] = useState<PreloadProgress>({
    stage: "fonts",
    ratio: 0,
    hint: t("loading.hint"),
  });
  const [boardReady, setBoardReady] = useState(false);
  const [boardProgress, setBoardProgress] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>("roll");
  const [decks, setDecks] = useState<DecksState>(() => createDecks());
  const [drawnCard, setDrawnCard] = useState<CardDef | null>(null);
  const [cardNotes, setCardNotes] = useState<string[]>([]);
  const [followUpCards, setFollowUpCards] = useState<CardDef[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);

  const [diceRoll, setDiceRoll] = useState<DiceRoll | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceRollId, setDiceRollId] = useState(0);
  const [consecutiveDoubles, setConsecutiveDoubles] = useState(0);
  const [jailError, setJailError] = useState<string | null>(null);
  const [pendingDebt, setPendingDebt] = useState<DebtInfo | null>(null);
  const [pendingRent, setPendingRent] = useState<PendingRentClaim | null>(
    null,
  );
  const [auction, setAuction] = useState<AuctionSession | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [showTrade, setShowTrade] = useState(false);
  const [pendingTrade, setPendingTrade] =
    useState<PendingTradeProposal | null>(null);
  const [onlineSession, setOnlineSession] = useState<OnlineSession | null>(
    null,
  );
  const [syncStatus, setSyncStatus] = useState<OnlineSyncStatus>("live");
  const [gameVersion, setGameVersion] = useState(0);
  const pendingAuctionsRef = useRef<AuctionLot[]>([]);
  const auctionAdvanceAfterModalRef = useRef<AuctionSession | null>(null);
  const resumePhaseAfterModalRef = useRef<TurnPhase | null>(null);

  const doublesRef = useRef(0);
  const extraRollRef = useRef(false);
  const forceEndTurnRef = useRef(false);
  const activeRef = useRef(activePlayerId);
  activeRef.current = activePlayerId;
  const decksRef = useRef(decks);
  decksRef.current = decks;
  const playersRef = useRef(players);
  playersRef.current = players;
  const pendingLandingRef = useRef<PendingLanding | null>(null);
  const pendingNotesRef = useRef<string[]>([]);
  const resolvingRef = useRef(false);
  const pendingEscortEventRef = useRef<{
    notes: string[];
    cards: CardDef[];
    playerId: string;
    landIndex: number;
    pendingDebt: DebtInfo | null;
    pendingRent: PendingRentClaim | null;
  } | null>(null);
  const gameVersionRef = useRef(0);
  gameVersionRef.current = gameVersion;
  const onlineRef = useRef(onlineSession);
  onlineRef.current = onlineSession;
  const applyingRemoteRef = useRef(false);
  const applyRemoteIntentRef = useRef<
    (actorId: string, intent: GameIntent) => void
  >(() => undefined);
  const processedActionsRef = useRef(new Set<number>());

  const activePlayer =
    players.find((p) => p.id === activePlayerId) ?? null;
  const winner = winnerId
    ? players.find((p) => p.id === winnerId) ?? null
    : null;

  useEffect(() => {
    void ensureSfxOverridesReady();
  }, []);

  useEffect(() => {
    if (screen !== "game") {
      setBoardReady(false);
      setBoardProgress(0);
      return;
    }
    setBoardReady(false);
    setBoardProgress(0.08);
    preloadUiSfx();
  }, [screen]);

  useEffect(() => {
    if (screen !== "loading") return;
    let cancelled = false;
    const started = performance.now();
    const wantSfxAdmin =
      new URLSearchParams(window.location.search).get("admin") === "sfx";

    void preloadGameAssets((p) => {
      if (!cancelled) setLoadProgress(p);
    })
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        setLoadProgress((p) => ({
          ...p,
          stage: "ready",
          ratio: 1,
          detail: undefined,
        }));
        const elapsed = performance.now() - started;
        const wait = Math.max(LOADING_LAND_MS, LOADING_MIN_MS - elapsed);
        window.setTimeout(() => {
          if (!cancelled) setScreen(wantSfxAdmin ? "sfx-admin" : "lobby");
        }, wait);
      });

    return () => {
      cancelled = true;
    };
  }, [screen]);

  const hydrateSnapshot = useCallback((snap: GameSnapshot) => {
    applyingRemoteRef.current = true;
    playersRef.current = snap.players;
    setPlayers(snap.players);
    setPlayerCount(snap.players.length);
    setActivePlayerId(snap.activePlayerId);
    {
      const ap = snap.players.find((p) => p.id === snap.activePlayerId);
      if (ap) setSelectedIndex(ap.position);
    }
    setTurnPhase(snap.turnPhase);
    setDecks(snap.decks);
    decksRef.current = snap.decks;
    setDiceRoll(snap.diceRoll);
    setDiceRollId(snap.diceRollId);
    setConsecutiveDoubles(snap.consecutiveDoubles);
    doublesRef.current = snap.consecutiveDoubles;
    setPendingDebt(snap.pendingDebt);
    setPendingRent(snap.pendingRent);
    setAuction(snap.auction);
    pendingAuctionsRef.current = snap.pendingAuctions;
    setWinnerId(snap.winnerId);
    setDrawnCard(snap.drawnCard);
    setCardNotes(snap.cardNotes);
    setFollowUpCards(snap.followUpCards);
    setShowEventModal(snap.showEventModal);
    setShowTrade(snap.showTrade);
    setPendingTrade(snap.pendingTrade ?? null);
    setJailError(snap.jailError);
    pendingLandingRef.current = snap.pendingLanding;
    extraRollRef.current = snap.extraRoll;
    forceEndTurnRef.current = snap.forceEndTurn;
    resumePhaseAfterModalRef.current = snap.resumePhaseAfterModal;
    auctionAdvanceAfterModalRef.current = snap.auctionAdvanceAfterModal;
    queueMicrotask(() => {
      applyingRemoteRef.current = false;
    });
  }, []);

  const buildSnapshot = useCallback((): GameSnapshot => {
    return {
      v: 1,
      players: playersRef.current,
      activePlayerId: activeRef.current,
      turnPhase,
      decks: decksRef.current,
      diceRoll,
      diceRollId,
      consecutiveDoubles: doublesRef.current,
      pendingDebt,
      pendingRent,
      auction,
      pendingAuctions: pendingAuctionsRef.current,
      winnerId,
      drawnCard,
      cardNotes,
      followUpCards,
      showEventModal,
      showTrade,
      pendingTrade,
      jailError,
      pendingLanding: pendingLandingRef.current,
      extraRoll: extraRollRef.current,
      forceEndTurn: forceEndTurnRef.current,
      resumePhaseAfterModal: resumePhaseAfterModalRef.current,
      auctionAdvanceAfterModal: auctionAdvanceAfterModalRef.current,
    };
  }, [
    turnPhase,
    diceRoll,
    diceRollId,
    pendingDebt,
    pendingRent,
    auction,
    winnerId,
    drawnCard,
    cardNotes,
    followUpCards,
    showEventModal,
    showTrade,
    pendingTrade,
    jailError,
  ]);

  const publishSnapshot = useCallback(async () => {
    const session = onlineRef.current;
    if (!session?.isHost || applyingRemoteRef.current) return;
    if (!isSupabaseConfigured()) return;
    setSyncStatus((s) => (s === "hostAway" ? s : "syncing"));
    const snap = buildSnapshot();
    const result = await pushGameState(
      session.roomId,
      gameVersionRef.current,
      snap,
    );
    if (result.ok) {
      gameVersionRef.current = result.version;
      setGameVersion(result.version);
      setSyncStatus("live");
      return;
    }
    if (result.conflict) {
      gameVersionRef.current = result.row.version;
      setGameVersion(result.row.version);
      hydrateSnapshot(result.row.state);
      setSyncStatus("live");
      return;
    }
    setSyncStatus("error");
  }, [buildSnapshot, hydrateSnapshot]);

  const isLocalActor = useCallback((playerId: string | null | undefined) => {
    const session = onlineRef.current;
    if (!session) return true;
    if (!playerId) return false;
    return session.localPlayerId === playerId;
  }, []);

  const sendIntent = useCallback(
    (intent: GameIntent, localApply: () => void) => {
      const session = onlineRef.current;
      if (session && !session.isHost) {
        if (syncStatus === "hostAway") return;
        void enqueueGameAction(session.roomId, intent).catch(() => {
          setSyncStatus("error");
        });
        return;
      }
      localApply();
    },
    [syncStatus],
  );

  const dismissEventUi = useCallback(() => {
    setShowEventModal(false);
    setDrawnCard(null);
    setCardNotes([]);
    setFollowUpCards([]);
  }, []);

  const presentEvent = useCallback((notes: string[], cards: CardDef[]) => {
    const primary = cards[0] ?? null;
    const rest = primary ? cards.slice(1) : cards;
    if (cards.some((c) => UNLUCKY_CARD_EFFECTS.has(c.effect.type))) {
      playGameSfx("badLuck");
    }
    setDrawnCard(primary);
    setCardNotes(notes);
    setFollowUpCards(rest);
    if (notes.length > 0 || cards.length > 0) {
      setShowEventModal(true);
      setTurnPhase("busy");
      return true;
    }
    return false;
  }, []);

  const endGameIfWon = useCallback((list: readonly PlayerState[]) => {
    const w = findWinner(list);
    if (!w) return false;
    setWinnerId(w.id);
    setActivePlayerId(w.id);
    setAuction(null);
    pendingAuctionsRef.current = [];
    auctionAdvanceAfterModalRef.current = null;
    setPendingDebt(null);
    setPendingRent(null);
    setTurnPhase("ended");
    setSelectedIndex(w.position);
    return true;
  }, []);

  const startNextTurn = useCallback(
    (fromPlayerId: string) => {
      if (endGameIfWon(playersRef.current)) return;
      const nextId = nextPlayerId(playersRef.current, fromPlayerId);
      doublesRef.current = 0;
      extraRollRef.current = false;
      forceEndTurnRef.current = false;
      setConsecutiveDoubles(0);
      setDiceRoll(null);
      setJailError(null);
      setShowTrade(false);
      setPendingTrade(null);
      setActivePlayerId(nextId);
      setTurnPhase("roll");
      const next = playersRef.current.find((p) => p.id === nextId);
      if (next) setSelectedIndex(next.position);
    },
    [endGameIfWon],
  );

  const resumeAfterAuctions = useCallback(
    (playerId: string) => {
      setAuction(null);
      if (endGameIfWon(playersRef.current)) return;
      if (extraRollRef.current) {
        extraRollRef.current = false;
        setTurnPhase("roll");
        return;
      }
      startNextTurn(playerId);
    },
    [startNextTurn, endGameIfWon],
  );

  const beginAuctions = useCallback(
    (lots: AuctionLot[], resumePlayerId: string) => {
      const pending = [...pendingAuctionsRef.current, ...lots];
      pendingAuctionsRef.current = [];
      if (pending.length === 0) {
        resumeAfterAuctions(resumePlayerId);
        return;
      }
      const [lot, ...queue] = pending;
      setAuction({
        lot: lot!,
        queue,
        currentBid: 0,
        highBidderId: null,
        tiedBidderIds: null,
        excludedIds: [],
        passesSinceBid: 0,
        resumePlayerId,
      });
      setTurnPhase("auction");
    },
    [resumeAfterAuctions],
  );

  const enqueueAuctions = useCallback((lots: AuctionLot[]) => {
    if (lots.length === 0) return;
    pendingAuctionsRef.current = [...pendingAuctionsRef.current, ...lots];
  }, []);

  const advanceAuctionQueue = useCallback(
    (session: AuctionSession) => {
      if (session.queue.length === 0) {
        resumeAfterAuctions(session.resumePlayerId);
        return;
      }
      const [lot, ...queue] = session.queue;
      setAuction({
        lot: lot!,
        queue,
        currentBid: 0,
        highBidderId: null,
        tiedBidderIds: null,
        excludedIds: [],
        passesSinceBid: 0,
        resumePlayerId: session.resumePlayerId,
      });
      setTurnPhase("auction");
    },
    [resumeAfterAuctions],
  );

  const advanceAfterResolve = useCallback(
    (playerId: string, spaceIndex: number) => {
      if (forceEndTurnRef.current) {
        forceEndTurnRef.current = false;
        startNextTurn(playerId);
        return;
      }

      const player = playersRef.current.find((p) => p.id === playerId);
      if (player?.bankrupt) {
        extraRollRef.current = false;
        startNextTurn(playerId);
        return;
      }

      if (player?.inJail) {
        extraRollRef.current = false;
        startNextTurn(playerId);
        return;
      }

      if (isUnownedBuyable(playersRef.current, spaceIndex)) {
        if (player && player.position === spaceIndex) {
          setTurnPhase("action");
          return;
        }
      }

      if (extraRollRef.current) {
        extraRollRef.current = false;
        setTurnPhase("roll");
        return;
      }

      startNextTurn(playerId);
    },
    [startNextTurn],
  );

  const applyDebtOutcome = useCallback(
    (
      debt: DebtInfo | null | undefined,
      queue: AuctionLot[] | undefined,
      afterPlayerId: string,
      spaceIndex: number,
    ) => {
      if (endGameIfWon(playersRef.current)) return;
      if (queue?.length) enqueueAuctions(queue);
      if (debt) {
        setPendingDebt(debt);
        setTurnPhase("debt");
        return;
      }
      const player = playersRef.current.find((p) => p.id === afterPlayerId);
      if (player?.bankrupt) {
        if (pendingAuctionsRef.current.length > 0) {
          beginAuctions([], afterPlayerId);
        } else {
          startNextTurn(afterPlayerId);
        }
        return;
      }
      if (pendingAuctionsRef.current.length > 0) {
        beginAuctions([], afterPlayerId);
        return;
      }
      advanceAfterResolve(afterPlayerId, spaceIndex);
    },
    [
      advanceAfterResolve,
      startNextTurn,
      enqueueAuctions,
      beginAuctions,
      endGameIfWon,
    ],
  );

  const onPayJailFine = useCallback(() => {
    if (!activePlayerId || turnPhase !== "roll") return;
    const result = payJailFine(playersRef.current, activePlayerId);
    if (!result.ok) {
      setJailError(result.error ?? t("msg.payJailFail"));
      return;
    }
    setJailError(null);
    playersRef.current = result.players;
    setPlayers(result.players);
    setTurnPhase("roll");
  }, [activePlayerId, turnPhase, t]);

  const onUseJailProtection = useCallback(() => {
    if (!activePlayerId || turnPhase !== "roll") return;
    const result = useProtectionToLeaveJail(
      playersRef.current,
      decksRef.current,
      activePlayerId,
    );
    if (!result.ok) {
      setJailError(result.error ?? t("msg.noProtection"));
      return;
    }
    setJailError(null);
    playersRef.current = result.players;
    setPlayers(result.players);
    decksRef.current = result.decks;
    setDecks(result.decks);
    setTurnPhase("roll");
  }, [activePlayerId, turnPhase, t]);

  const resetSessionFlags = useCallback(() => {
    setWinnerId(null);
    setDecks(createDecks());
    dismissEventUi();
    setDiceRoll(null);
    setDiceRolling(false);
    doublesRef.current = 0;
    extraRollRef.current = false;
    forceEndTurnRef.current = false;
    setConsecutiveDoubles(0);
    pendingLandingRef.current = null;
    setPendingDebt(null);
    setPendingRent(null);
    setAuction(null);
    pendingAuctionsRef.current = [];
    auctionAdvanceAfterModalRef.current = null;
    setShowTrade(false);
    setPendingTrade(null);
    resumePhaseAfterModalRef.current = null;
    setJailError(null);
    setSelectedIndex(0);
    setTurnPhase("roll");
  }, [dismissEventUi]);

  const startFromLobby = useCallback(
    (setup: LobbySetup, meta?: LobbyStartMeta) => {
      resetSessionFlags();
      processedActionsRef.current.clear();

      if (meta?.mode === "online" && meta.roomId && meta.localPlayerId) {
        const session: OnlineSession = {
          roomId: meta.roomId,
          isHost: Boolean(meta.isHost),
          localPlayerId: meta.localPlayerId,
        };
        setOnlineSession(session);
        saveOnlineSession(session);
        ensureRoomParam(meta.roomId);
        setSyncStatus("syncing");
        void loadGame(meta.roomId)
          .then((row) => {
            if (row?.state) {
              hydrateSnapshot(row.state);
              gameVersionRef.current = row.version;
              setGameVersion(row.version);
            } else {
              const next = createPlayersFromLobby(setup);
              setPlayerCount(next.length);
              setPlayers(next);
              playersRef.current = next;
              setActivePlayerId(next[0]?.id ?? null);
              setGameVersion(0);
              gameVersionRef.current = 0;
            }
            setSyncStatus("live");
            setScreen("game");
          })
          .catch(() => {
            const next = createPlayersFromLobby(setup);
            setPlayerCount(next.length);
            setPlayers(next);
            playersRef.current = next;
            setActivePlayerId(next[0]?.id ?? null);
            setSyncStatus("error");
            setScreen("game");
          });
        return;
      }

      clearOnlineSession();
      setOnlineSession(null);
      setSyncStatus("live");
      setGameVersion(0);
      gameVersionRef.current = 0;
      const next = createPlayersFromLobby(setup);
      setPlayerCount(next.length);
      setPlayers(next);
      playersRef.current = next;
      setActivePlayerId(next[0]?.id ?? null);
      setScreen("game");
    },
    [resetSessionFlags, hydrateSnapshot],
  );

  const returnToLobby = useCallback(() => {
    stopCarnavalMusic();
    clearOnlineSession();
    clearRoomParam();
    setOnlineSession(null);
    setSyncStatus("live");
    setGameVersion(0);
    gameVersionRef.current = 0;
    setScreen("lobby");
    setPlayers([]);
    playersRef.current = [];
    setActivePlayerId(null);
    resetSessionFlags();
  }, [resetSessionFlags]);

  const handlePlayerCountChange = useCallback(
    (_count: number) => {
      returnToLobby();
    },
    [returnToLobby],
  );

  useEffect(() => {
    if (screen !== "game" || !onlineSession || onlineSession.isHost) return;
    if (!isSupabaseConfigured()) return;
    return subscribeGame(onlineSession.roomId, (row) => {
      if (row.version <= gameVersionRef.current) return;
      gameVersionRef.current = row.version;
      setGameVersion(row.version);
      hydrateSnapshot(row.state);
      setSyncStatus("live");
    });
  }, [screen, onlineSession, hydrateSnapshot]);

  useEffect(() => {
    if (screen !== "game" || !onlineSession || onlineSession.isHost) return;
    if (!isSupabaseConfigured()) return;
    const poll = window.setInterval(() => {
      void loadGame(onlineSession.roomId)
        .then((row) => {
          if (!row) return;
          if (row.version > gameVersionRef.current) {
            gameVersionRef.current = row.version;
            setGameVersion(row.version);
            hydrateSnapshot(row.state);
          }
          setSyncStatus((s) =>
            s === "hostAway" || s === "error" ? s : "live",
          );
        })
        .catch(() => setSyncStatus("reconnecting"));
    }, 6000);
    return () => window.clearInterval(poll);
  }, [screen, onlineSession, hydrateSnapshot]);

  useEffect(() => {
    if (screen !== "game" || !onlineSession) return;
    if (!isSupabaseConfigured()) return;
    const graceUntil = Date.now() + 2800;
    return subscribeRoomPresence(
      onlineSession.roomId,
      {
        userId: onlineSession.localPlayerId,
        isHost: onlineSession.isHost,
      },
      ({ hostOnline }) => {
        if (onlineSession.isHost) {
          setSyncStatus((s) => (s === "error" ? s : "live"));
          return;
        }
        if (!hostOnline && Date.now() < graceUntil) return;
        setSyncStatus(hostOnline ? "live" : "hostAway");
      },
    );
  }, [screen, onlineSession]);

  useEffect(() => {
    if (screen !== "game" || !onlineSession?.isHost) return;
    if (applyingRemoteRef.current) return;
    const t = window.setTimeout(() => {
      void publishSnapshot();
    }, 180);
    return () => window.clearTimeout(t);
  }, [
    screen,
    onlineSession,
    publishSnapshot,
    players,
    activePlayerId,
    turnPhase,
    decks,
    diceRoll,
    diceRollId,
    consecutiveDoubles,
    pendingDebt,
    pendingRent,
    auction,
    winnerId,
    drawnCard,
    cardNotes,
    followUpCards,
    showEventModal,
    showTrade,
    pendingTrade,
    jailError,
  ]);

  useEffect(() => {
    if (screen !== "game" || !onlineSession?.isHost) return;
    if (!isSupabaseConfigured()) return;
    return subscribePendingActions(onlineSession.roomId, (action) => {
      if (processedActionsRef.current.has(action.id)) return;
      if (action.actor_id === onlineSession.localPlayerId) {
        processedActionsRef.current.add(action.id);
        void markActionApplied(action.id);
        return;
      }
      processedActionsRef.current.add(action.id);
      applyRemoteIntentRef.current(action.actor_id, action.payload);
      void markActionApplied(action.id);
    });
  }, [screen, onlineSession]);

  const queueLanding = useCallback(
    (playerId: string, utilityDiceTotal?: number) => {
      pendingLandingRef.current = { playerId, utilityDiceTotal };
      setTurnPhase("busy");
    },
    [],
  );

  const onMoveActiveToSelected = useCallback(() => {
    if (!activePlayerId || selectedIndex === null || turnPhase === "busy") {
      return;
    }
    if (playersRef.current.find((p) => p.id === activePlayerId)?.inJail) {
      return;
    }
    extraRollRef.current = false;
    queueLanding(activePlayerId);
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.id === activePlayerId ? { ...p, position: selectedIndex } : p,
      );
      playersRef.current = next;
      return next;
    });
  }, [activePlayerId, selectedIndex, turnPhase, queueLanding]);

  const onAdvanceActive = useCallback(
    (steps: number) => {
      if (!activePlayerId || turnPhase === "busy") return;
      if (playersRef.current.find((p) => p.id === activePlayerId)?.inJail) {
        return;
      }
      extraRollRef.current = false;
      queueLanding(activePlayerId);
      setPlayers((prev) => {
        const next = prev.map((p) =>
          p.id === activePlayerId
            ? applyMove(p, steps, { grantGoBonus: true })
            : p,
        );
        playersRef.current = next;
        return next;
      });
    },
    [activePlayerId, turnPhase, queueLanding],
  );

  const onBuySelectedLocal = useCallback(() => {
    if (!activePlayerId || selectedIndex === null || turnPhase !== "action") {
      return;
    }
    setPlayers((prev) => {
      const bought = buyProperty(prev, activePlayerId, selectedIndex);
      if (!bought) return prev;
      playersRef.current = bought;
      return bought;
    });
    if (extraRollRef.current) {
      extraRollRef.current = false;
      setTurnPhase("roll");
    } else {
      startNextTurn(activePlayerId);
    }
  }, [activePlayerId, selectedIndex, turnPhase, startNextTurn]);

  const onBuySelected = useCallback(() => {
    if (selectedIndex === null) return;
    if (!isLocalActor(activeRef.current)) return;
    sendIntent(
      { type: "buySelected", spaceIndex: selectedIndex },
      onBuySelectedLocal,
    );
  }, [sendIntent, onBuySelectedLocal, selectedIndex, isLocalActor]);

  const onPassTurnLocal = useCallback(() => {
    if (!activePlayerId || turnPhase !== "action") return;
    if (
      selectedIndex !== null &&
      isUnownedBuyable(playersRef.current, selectedIndex)
    ) {
      beginAuctions(
        [propertyAuctionLot(selectedIndex, false)],
        activePlayerId,
      );
      return;
    }
    if (extraRollRef.current) {
      extraRollRef.current = false;
      setTurnPhase("roll");
      return;
    }
    startNextTurn(activePlayerId);
  }, [
    activePlayerId,
    turnPhase,
    selectedIndex,
    startNextTurn,
    beginAuctions,
  ]);

  const onPassTurn = useCallback(() => {
    if (!isLocalActor(activeRef.current)) return;
    sendIntent({ type: "passTurn" }, onPassTurnLocal);
  }, [sendIntent, onPassTurnLocal, isLocalActor]);

  const onDrawCard = useCallback(() => {
    if (!activePlayerId || selectedIndex === null || showEventModal) return;
    if (turnPhase === "busy") return;
    const space = getSpace(selectedIndex);
    const deckId = deckIdFromSpaceKind(space.kind);
    if (!deckId) return;

    setTurnPhase("busy");
    setPlayers((prevPlayers) => {
      const resolved = drawAndResolveCard(
        prevPlayers,
        decksRef.current,
        activePlayerId,
        deckId,
      );
      if (resolved.pathDir) setPawnPathDir(activePlayerId, resolved.pathDir);
      playCashGains(prevPlayers, resolved.players);
      decksRef.current = resolved.decks;
      setDecks(resolved.decks);
      playersRef.current = resolved.players;
      const moved = resolved.players.find((p) => p.id === activePlayerId);
      if (moved) setSelectedIndex(moved.position);
      if (resolved.pendingDebt) setPendingDebt(resolved.pendingDebt);
      if (resolved.auctionQueue?.length) {
        enqueueAuctions(resolved.auctionQueue);
      }
      const shown = presentEvent(resolved.notes, resolved.followUpCards);
      if (!shown) {
        applyDebtOutcome(
          resolved.pendingDebt,
          undefined,
          activePlayerId,
          moved?.position ?? selectedIndex,
        );
      }
      return resolved.players;
    });
  }, [
    activePlayerId,
    selectedIndex,
    showEventModal,
    turnPhase,
    presentEvent,
    applyDebtOutcome,
    enqueueAuctions,
  ]);

  const onDismissEvent = useCallback(() => {
    const pendingAdvance = auctionAdvanceAfterModalRef.current;
    if (pendingAdvance) {
      auctionAdvanceAfterModalRef.current = null;
      dismissEventUi();
      if (endGameIfWon(playersRef.current)) return;
      advanceAuctionQueue(pendingAdvance);
      return;
    }
    const resumePhase = resumePhaseAfterModalRef.current;
    if (resumePhase) {
      resumePhaseAfterModalRef.current = null;
      dismissEventUi();
      if (winnerId) {
        setTurnPhase("ended");
        return;
      }
      if (pendingDebt) {
        setTurnPhase("debt");
        return;
      }
      setTurnPhase(resumePhase);
      return;
    }
    if (winnerId) {
      dismissEventUi();
      setTurnPhase("ended");
      return;
    }
    if (auction) {
      dismissEventUi();
      setTurnPhase("auction");
      return;
    }
    const playerId = activeRef.current;
    dismissEventUi();
    if (!playerId) {
      setTurnPhase("roll");
      return;
    }
    const player = playersRef.current.find((p) => p.id === playerId);
    const spaceIndex = player?.position ?? selectedIndex ?? 0;
    if (pendingDebt) {
      setTurnPhase("debt");
      return;
    }
    applyDebtOutcome(null, undefined, playerId, spaceIndex);
  }, [
    dismissEventUi,
    selectedIndex,
    pendingDebt,
    applyDebtOutcome,
    advanceAuctionQueue,
    auction,
    endGameIfWon,
    winnerId,
  ]);

  const onPayDebt = useCallback(() => {
    if (!pendingDebt || turnPhase !== "debt") return;
    const settled = payPendingDebt(
      playersRef.current,
      decksRef.current,
      pendingDebt,
    );
    playersRef.current = settled.players;
    setPlayers(settled.players);
    decksRef.current = settled.decks;
    setDecks(settled.decks);

    if (settled.status === "paid") {
      const debt = pendingDebt;
      setPendingDebt(null);
      presentEvent(settled.notes, []);
      // After dismiss, continue turn — clear debt first so dismiss doesn't loop
      const player = settled.players.find((p) => p.id === debt.debtorId);
      // Use a microtask: presentEvent shows modal; on dismiss pendingDebt is null
      // Store space for after dismiss via player position
      if (!settled.notes.length) {
        advanceAfterResolve(
          debt.debtorId,
          player?.position ?? selectedIndex ?? 0,
        );
      }
      return;
    }

    if (settled.status === "bankrupt") {
      setPendingDebt(null);
      if (endGameIfWon(settled.players)) {
        presentEvent(
          [...settled.notes, t("msg.gameOver")],
          [],
        );
        return;
      }
      if (settled.auctionQueue.length) {
        enqueueAuctions(settled.auctionQueue);
      }
      presentEvent(settled.notes, []);
      return;
    }

    // still shortfall
    presentEvent(settled.notes, []);
    setTurnPhase("debt");
  }, [
    pendingDebt,
    turnPhase,
    presentEvent,
    advanceAfterResolve,
    selectedIndex,
    enqueueAuctions,
    endGameIfWon,
    t,
  ]);

  const onLiquidateForDebt = useCallback(() => {
    if (!pendingDebt || turnPhase !== "debt") return;
    const next = liquidateAll(playersRef.current, pendingDebt.debtorId);
    playersRef.current = next;
    setPlayers(next);
  }, [pendingDebt, turnPhase]);

  const onDeclareBankruptcy = useCallback(() => {
    if (!pendingDebt || turnPhase !== "debt") return;
    const broke = declareBankruptcy(
      playersRef.current,
      decksRef.current,
      pendingDebt.debtorId,
      pendingDebt.creditor,
    );
    playersRef.current = broke.players;
    setPlayers(broke.players);
    decksRef.current = broke.decks;
    setDecks(broke.decks);
    setPendingDebt(null);
    if (endGameIfWon(broke.players)) {
      presentEvent(
        [...broke.notes, t("msg.gameOver")],
        [],
      );
      return;
    }
    if (broke.auctionQueue.length) {
      enqueueAuctions(broke.auctionQueue);
    }
    presentEvent(broke.notes, []);
  }, [pendingDebt, turnPhase, presentEvent, enqueueAuctions, endGameIfWon, t]);

  const onForfeitToBank = useCallback(
    (forfeitPlayerId?: string) => {
      if (
        winnerId ||
        turnPhase === "ended" ||
        turnPhase === "auction" ||
        turnPhase === "busy"
      ) {
        return;
      }
      const session = onlineRef.current;
      const playerId =
        forfeitPlayerId ?? session?.localPlayerId ?? activeRef.current;
      if (!playerId) return;
      if (playerId !== activeRef.current) {
        if (!(turnPhase === "debt" && pendingDebt?.debtorId === playerId)) {
          return;
        }
      }
      const player = playersRef.current.find((p) => p.id === playerId);
      if (!player || player.bankrupt) return;
      if (playersRef.current.filter((p) => !p.bankrupt).length <= 1) return;

      const broke = declareBankruptcy(
        playersRef.current,
        decksRef.current,
        playerId,
        { type: "bank" },
      );
      const notes = [
        t("msg.forfeit", { name: getPlayerLabel(player) }),
        ...broke.notes,
      ];
      playersRef.current = broke.players;
      setPlayers(broke.players);
      decksRef.current = broke.decks;
      setDecks(broke.decks);

      if (pendingDebt?.debtorId === playerId) setPendingDebt(null);
      if (
        pendingRent &&
        (pendingRent.visitorId === playerId ||
          pendingRent.ownerId === playerId)
      ) {
        setPendingRent(null);
      }
      setShowTrade(false);
      setPendingTrade((pt) =>
        pt && (pt.fromId === playerId || pt.toId === playerId) ? null : pt,
      );

      if (endGameIfWon(broke.players)) {
        presentEvent([...notes, t("msg.gameOver")], []);
        return;
      }
      if (broke.auctionQueue.length) {
        enqueueAuctions(broke.auctionQueue);
      }
      presentEvent(notes, []);
    },
    [
      winnerId,
      turnPhase,
      pendingDebt,
      pendingRent,
      presentEvent,
      enqueueAuctions,
      endGameIfWon,
      t,
    ],
  );

  const onClaimRent = useCallback(() => {
    if (!pendingRent) return;
    const claim = pendingRent;
    setPendingRent(null);
    const beforeClaim = playersRef.current;
    const settled = settleDebt(
      beforeClaim,
      decksRef.current,
      claim.visitorId,
      claim.amount,
      { type: "player", playerId: claim.ownerId },
      t("msg.rentClaim", { space: getSpace(claim.spaceIndex).name }),
    );
    if (settled.status === "paid") {
      playCashGains(beforeClaim, settled.players);
    }
    playersRef.current = settled.players;
    setPlayers(settled.players);
    decksRef.current = settled.decks;
    setDecks(settled.decks);
    if (settled.status === "shortfall") {
      setPendingDebt(settled.debt);
      presentEvent(settled.notes, []);
      return;
    }
    if (settled.status === "bankrupt") {
      if (endGameIfWon(settled.players)) {
        presentEvent(
          [...settled.notes, t("msg.gameOver")],
          [],
        );
        return;
      }
      if (settled.auctionQueue.length) {
        enqueueAuctions(settled.auctionQueue);
      }
      presentEvent(settled.notes, []);
      return;
    }
    presentEvent(settled.notes, []);
  }, [pendingRent, presentEvent, endGameIfWon, enqueueAuctions, t]);

  const onRollDiceLocal = useCallback(() => {
    if (!activeRef.current || diceRolling || turnPhase !== "roll") return;
    if (pendingRent) {
      const space = getSpace(pendingRent.spaceIndex);
      pendingNotesRef.current = [
        ...pendingNotesRef.current,
        t("msg.rentLost", {
          space: space.name,
          amount: pendingRent.amount,
        }),
      ];
      setPendingRent(null);
    }
    setTurnPhase("busy");
    setDiceRolling(true);
    setDiceRollId((id) => id + 1);
  }, [diceRolling, turnPhase, pendingRent, t]);

  const onRollDice = useCallback(() => {
    if (!isLocalActor(activeRef.current)) return;
    sendIntent({ type: "rollDice" }, onRollDiceLocal);
  }, [sendIntent, onRollDiceLocal, isLocalActor]);

  const onRollComplete = useCallback(
    (roll: DiceRoll) => {
      setDiceRolling(false);
      setDiceRoll(roll);

      const playerId = activeRef.current;
      if (!playerId) return;

      const current = playersRef.current.find((p) => p.id === playerId);

      // ——— Preso: tenta dupla (até 3) ———
      if (current?.inJail) {
        if (roll.isDouble) {
          extraRollRef.current = false;
          setPlayers((prev) => {
            const next = prev.map((p) =>
              p.id === playerId
                ? applyMove(releaseFromJail(p), roll.total, {
                  grantGoBonus: true,
                })
                : p,
            );
            playersRef.current = next;
            return next;
          });
          doublesRef.current = 0;
          setConsecutiveDoubles(0);
          queueLanding(playerId, roll.total);
          return;
        }

        const attempts = current.jailAttempts + 1;
        if (attempts >= JAIL_MAX_ATTEMPTS) {
          extraRollRef.current = false;
          setPlayers((prev) => {
            const freed = forceLeaveJailAfterFailedAttempts(prev, playerId);
            const next = freed.map((p) =>
              p.id === playerId
                ? applyMove(p, roll.total, { grantGoBonus: true })
                : p,
            );
            playersRef.current = next;
            return next;
          });
          doublesRef.current = 0;
          setConsecutiveDoubles(0);
          pendingNotesRef.current = [
            t("msg.jailThirdPay", {
              amount: JAIL_FINE,
              steps: roll.total,
            }),
          ];
          queueLanding(playerId, roll.total);
          return;
        }

        setPlayers((prev) => {
          const next = prev.map((p) =>
            p.id === playerId ? { ...p, jailAttempts: attempts } : p,
          );
          playersRef.current = next;
          return next;
        });
        pendingLandingRef.current = null;
        const shown = presentEvent(
          [
            t("msg.jailNoDoubles", {
              attempts,
              max: JAIL_MAX_ATTEMPTS,
            }),
          ],
          [],
        );
        forceEndTurnRef.current = true;
        if (!shown) startNextTurn(playerId);
        return;
      }

      if (roll.isDouble) {
        doublesRef.current += 1;
      } else {
        doublesRef.current = 0;
      }
      setConsecutiveDoubles(doublesRef.current);

      if (roll.isDouble && doublesRef.current >= 3) {
        doublesRef.current = 0;
        setConsecutiveDoubles(0);
        extraRollRef.current = false;
        forceEndTurnRef.current = true;
        const caught = playersRef.current.find((p) => p.id === playerId);
        setPlayers((prev) => {
          const next = prev.map((p) =>
            p.id === playerId
              ? applyMove(p, 0, {
                grantGoBonus: false,
                forcePosition: 10,
                inJail: true,
              })
              : p,
          );
          playersRef.current = next;
          return next;
        });
        setSelectedIndex(10);
        pendingLandingRef.current = null;
        if (caught) {
          beginJailEscort({
            playerId,
            pawnId: caught.pawnId,
            fromIndex: caught.position,
          });
          pendingEscortEventRef.current = {
            notes: [t("msg.tripleDoubles")],
            cards: [],
            playerId,
            landIndex: 10,
            pendingDebt: null,
            pendingRent: null,
          };
          setTurnPhase("busy");
          return;
        }
        const shown = presentEvent(
          [t("msg.tripleDoubles")],
          [],
        );
        if (!shown) startNextTurn(playerId);
        return;
      }

      extraRollRef.current = roll.isDouble;
      queueLanding(playerId, roll.total);
      setPlayers((prev) => {
        const next = prev.map((p) =>
          p.id === playerId
            ? applyMove(p, roll.total, { grantGoBonus: true })
            : p,
        );
        playersRef.current = next;
        return next;
      });
    },
    [queueLanding, presentEvent, startNextTurn],
  );

  // Para a música do Carnaval quando ninguém mais está na casa.
  useEffect(() => {
    const someoneOnCarnaval = players.some(
      (p) => !p.bankrupt && getSpace(p.position).kind === "carnaval",
    );
    if (!someoneOnCarnaval) stopCarnavalMusic();
  }, [players]);

  const gameSfxReadyRef = useRef(false);
  const prevActiveSfxRef = useRef<string | null>(null);
  const prevAuctionSfxRef = useRef<string | null>(null);
  const prevRentSfxRef = useRef<string | null>(null);

  useEffect(() => {
    if (screen !== "game") {
      gameSfxReadyRef.current = false;
      prevActiveSfxRef.current = null;
      prevAuctionSfxRef.current = null;
      prevRentSfxRef.current = null;
      return;
    }
    if (!gameSfxReadyRef.current) {
      gameSfxReadyRef.current = true;
      prevActiveSfxRef.current = activePlayerId;
      prevAuctionSfxRef.current = auction
        ? `${auction.lot.kind}:${auction.lot.spaceIndex}`
        : null;
      prevRentSfxRef.current = pendingRent
        ? `${pendingRent.visitorId}:${pendingRent.spaceIndex}`
        : null;
      return;
    }

    if (
      activePlayerId &&
      activePlayerId !== prevActiveSfxRef.current &&
      turnPhase === "roll"
    ) {
      playGameSfx("yourTurn");
    }
    prevActiveSfxRef.current = activePlayerId;

    const auctionKey = auction
      ? `${auction.lot.kind}:${auction.lot.spaceIndex}`
      : null;
    if (auctionKey && auctionKey !== prevAuctionSfxRef.current) {
      playGameSfx("auctionStart");
    }
    prevAuctionSfxRef.current = auctionKey;

    const rentKey = pendingRent
      ? `${pendingRent.visitorId}:${pendingRent.spaceIndex}`
      : null;
    if (rentKey && rentKey !== prevRentSfxRef.current) {
      playGameSfx("payRent");
    }
    prevRentSfxRef.current = rentKey;
  }, [screen, activePlayerId, turnPhase, auction, pendingRent]);

  const onPawnArrive = useCallback(
    (playerId: string, spaceIndex: number) => {
      if (playerId !== activeRef.current) return;
      setSelectedIndex(spaceIndex);

      if (getSpace(spaceIndex).kind === "carnaval") {
        playCarnavalMusic();
      }

      const pending = pendingLandingRef.current;
      if (!pending || pending.playerId !== playerId || resolvingRef.current) {
        return;
      }

      pendingLandingRef.current = null;
      resolvingRef.current = true;

      setPlayers((prevPlayers) => {
        const before = prevPlayers.find((p) => p.id === playerId);
        const resolved = resolveSpaceLanding(
          prevPlayers,
          decksRef.current,
          playerId,
          spaceIndex,
          {
            utilityDiceTotal: pending.utilityDiceTotal,
            drawAndResolve: (deckId, p, d) => {
              const r = drawAndResolveCard(p, d, playerId, deckId);
              if (r.pathDir) setPawnPathDir(playerId, r.pathDir);
              return {
                players: r.players,
                decks: r.decks,
                notes: r.notes,
                followUpCards: r.followUpCards,
                pendingDebt: r.pendingDebt,
                auctionQueue: r.auctionQueue,
                pendingRent: r.pendingRent,
              };
            },
          },
        );

        playCashGains(prevPlayers, resolved.players);
        decksRef.current = resolved.decks;
        setDecks(resolved.decks);
        playersRef.current = resolved.players;
        const moved = resolved.players.find((p) => p.id === playerId);
        const landIndex = moved?.position ?? spaceIndex;
        if (moved && moved.position !== spaceIndex) {
          setSelectedIndex(moved.position);
        }

        if (resolved.pendingDebt) {
          setPendingDebt(resolved.pendingDebt);
        }
        if (resolved.pendingRent) {
          setPendingRent(resolved.pendingRent);
        }
        if (resolved.auctionQueue.length) {
          enqueueAuctions(resolved.auctionQueue);
        }

        const prefix = pendingNotesRef.current;
        pendingNotesRef.current = [];
        const notes = [...prefix, ...resolved.notes];
        const justJailed =
          Boolean(moved?.inJail) && Boolean(before) && !before!.inJail;

        if (justJailed && before && moved) {
          beginJailEscort({
            playerId,
            pawnId: moved.pawnId,
            fromIndex: before.position,
          });
          pendingEscortEventRef.current = {
            notes,
            cards: resolved.followUpCards,
            playerId,
            landIndex,
            pendingDebt: resolved.pendingDebt,
            pendingRent: resolved.pendingRent ?? null,
          };
          resolvingRef.current = false;
          setTurnPhase("busy");
          return resolved.players;
        }

        const shown = presentEvent(notes, resolved.followUpCards);
        resolvingRef.current = false;
        if (!shown) {
          applyDebtOutcome(
            resolved.pendingDebt,
            undefined,
            playerId,
            landIndex,
          );
        }
        return resolved.players;
      });
    },
    [presentEvent, applyDebtOutcome, enqueueAuctions],
  );

  const onJailEscortComplete = useCallback(
    (escort: JailEscortMission) => {
      const pending = pendingEscortEventRef.current;
      if (!pending || pending.playerId !== escort.playerId) {
        return;
      }
      pendingEscortEventRef.current = null;
      setSelectedIndex(10);
      const shown = presentEvent(pending.notes, pending.cards);
      if (!shown) {
        applyDebtOutcome(
          pending.pendingDebt,
          undefined,
          pending.playerId,
          pending.landIndex,
        );
      }
    },
    [presentEvent, applyDebtOutcome],
  );

  const auctionPassesNeeded = players.filter((p) => !p.bankrupt).length;

  const onAuctionBid = useCallback(
    (playerId: string, amount: number) => {
      if (!auction) return;
      const player = playersRef.current.find((p) => p.id === playerId);
      if (!player) return;
      const check = validateBid(
        player,
        amount,
        auction.currentBid,
        auction.lot,
        auction.excludedIds,
        auction.highBidderId,
      );
      if (!check.ok) {
        presentEvent([check.error], []);
        return;
      }
      if (check.tie && auction.highBidderId) {
        setAuction({
          ...auction,
          tiedBidderIds: [auction.highBidderId, playerId],
          passesSinceBid: 0,
        });
        return;
      }
      setAuction({
        ...auction,
        currentBid: amount,
        highBidderId: playerId,
        tiedBidderIds: null,
        passesSinceBid: 0,
      });
    },
    [auction, presentEvent],
  );

  const onResolveTieDice = useCallback(() => {
    if (!auction?.tiedBidderIds || auction.tiedBidderIds.length < 2) return;
    const [a, b] = auction.tiedBidderIds;
    const result = resolveTieByDice(a!, b!);
    setAuction({
      ...auction,
      highBidderId: result.winnerId,
      tiedBidderIds: null,
      passesSinceBid: 0,
    });
    presentEvent(result.notes, []);
  }, [auction, presentEvent]);

  const finishAuctionLot = useCallback(
    (session: AuctionSession, notes: string[]) => {
      if (presentEvent(notes, [])) {
        auctionAdvanceAfterModalRef.current = session;
        return;
      }
      advanceAuctionQueue(session);
    },
    [presentEvent, advanceAuctionQueue],
  );

  const onAuctionPass = useCallback(
    (_playerId: string) => {
      if (!auction) return;
      const nextPasses = auction.passesSinceBid + 1;
      if (auction.currentBid > 0 && nextPasses >= auctionPassesNeeded) {
        const awarded = awardAuctionLot(
          playersRef.current,
          auction.highBidderId!,
          auction.lot,
          auction.currentBid,
        );
        if (!awarded.ok) {
          setAuction({
            ...auction,
            excludedIds: [...auction.excludedIds, auction.highBidderId!],
            currentBid: 0,
            highBidderId: null,
            tiedBidderIds: null,
            passesSinceBid: 0,
          });
          presentEvent(
            [awarded.error, t("msg.auctionReopen")],
            [],
          );
          return;
        }
        playersRef.current = awarded.players;
        setPlayers(awarded.players);
        finishAuctionLot(auction, awarded.notes);
        return;
      }
      if (auction.currentBid <= 0 && nextPasses >= auctionPassesNeeded) {
        const keepMsg =
          auction.lot.kind === "property"
            ? t("msg.noBidsProperty")
            : t("msg.noBidsPiece");
        finishAuctionLot(auction, [keepMsg]);
        return;
      }
      setAuction({ ...auction, passesSinceBid: nextPasses });
    },
    [auction, auctionPassesNeeded, presentEvent, finishAuctionLot, t],
  );

  const onAuctionSell = useCallback(() => {
    if (!auction || !auction.highBidderId || auction.currentBid <= 0) return;
    if (auction.tiedBidderIds?.length) return;
    const awarded = awardAuctionLot(
      playersRef.current,
      auction.highBidderId,
      auction.lot,
      auction.currentBid,
    );
    if (!awarded.ok) {
      setAuction({
        ...auction,
        excludedIds: [...auction.excludedIds, auction.highBidderId],
        currentBid: 0,
        highBidderId: null,
        tiedBidderIds: null,
        passesSinceBid: 0,
      });
      presentEvent(
        [awarded.error, t("msg.auctionReopen")],
        [],
      );
      return;
    }
    playersRef.current = awarded.players;
    setPlayers(awarded.players);
    finishAuctionLot(auction, awarded.notes);
  }, [auction, presentEvent, finishAuctionLot, t]);

  const onAuctionNoBids = useCallback(() => {
    if (!auction) return;
    const keepMsg =
      auction.lot.kind === "property"
        ? t("msg.noBidsProperty")
        : t("msg.noBidsPiece");
    finishAuctionLot(auction, [keepMsg]);
  }, [auction, finishAuctionLot, t]);

  const turnLabel = (() => {
    if (turnPhase === "ended" && winner) {
      return t("turn.winner");
    }
    if (!activePlayer) return null;
    if (turnPhase === "auction") return t("turn.auction");
    if (turnPhase === "roll" && activePlayer.inJail) {
      return t("turn.jail", {
        n: activePlayer.jailAttempts,
        max: JAIL_MAX_ATTEMPTS,
      });
    }
    if (turnPhase === "roll" && consecutiveDoubles > 0 && diceRoll?.isDouble) {
      return t("turn.doubles");
    }
    if (turnPhase === "roll") return t("turn.roll");
    if (turnPhase === "busy") return t("turn.busy");
    if (turnPhase === "action") return t("turn.action");
    if (turnPhase === "debt" && pendingDebt) {
      return t("turn.debt", { amount: pendingDebt.amount });
    }
    return null;
  })();

  const debtRaisable =
    pendingDebt && activePlayer
      ? maxRaisableCash(activePlayer)
      : 0;

  const auctionQueueCount =
    (auction ? 1 + auction.queue.length : 0) +
    pendingAuctionsRef.current.length;

  const localControlsTurn =
    syncStatus !== "hostAway" &&
    (!onlineSession || onlineSession.localPlayerId === activePlayerId);

  const localPlayerId = onlineSession?.localPlayerId ?? null;

  const showEventToLocal =
    showEventModal &&
    (!localPlayerId || localPlayerId === activePlayerId);

  const pendingRentForLocal =
    pendingRent &&
      (!localPlayerId || pendingRent.ownerId === localPlayerId)
      ? pendingRent
      : null;

  const pendingDebtForLocal =
    pendingDebt &&
      (!localPlayerId || pendingDebt.debtorId === localPlayerId)
      ? pendingDebt
      : null;

  const tradeOnTurn =
    turnPhase === "roll" || turnPhase === "action" || turnPhase === "debt";

  const onOpenTradeLocal = useCallback(() => {
    if (!tradeOnTurn || pendingTrade) return;
    setShowTrade(true);
  }, [tradeOnTurn, pendingTrade]);

  const onProposeTradeLocal = useCallback((proposal: PendingTradeProposal) => {
    if (proposal.fromId !== activeRef.current) return;
    setPendingTrade((current) => current ?? proposal);
    setShowTrade(false);
  }, []);

  const onCancelTradeLocal = useCallback(() => {
    setPendingTrade(null);
  }, []);

  const onRespondTradeLocal = useCallback(
    (accept: boolean) => {
      const pt = pendingTrade;
      if (!pt) return;
      if (!accept) {
        setPendingTrade(null);
        const rejector = playersRef.current.find((p) => p.id === pt.toId);
        presentEvent(
          [
            t("msg.tradeRejected", {
              name: rejector ? getPlayerLabel(rejector) : pt.toId,
            }),
          ],
          [],
        );
        return;
      }
      const offer = {
        fromId: pt.fromId,
        toId: pt.toId,
        give: pt.give,
        receive: pt.receive,
      };
      const resolutions: Record<number, "redeem" | "interest"> = {};
      for (const r of pt.resolutions) {
        resolutions[r.spaceIndex] = r.choice;
      }
      const result = applyTrade(playersRef.current, offer, resolutions);
      setPendingTrade(null);
      if (!result.ok) {
        presentEvent([result.error], []);
        return;
      }
      playersRef.current = result.players;
      setPlayers(result.players);
      const resume =
        turnPhase === "debt"
          ? "debt"
          : turnPhase === "action"
            ? "action"
            : "roll";
      if (presentEvent(result.notes, [])) {
        resumePhaseAfterModalRef.current = resume;
      }
    },
    [pendingTrade, presentEvent, turnPhase, t],
  );

  const showTradeCompose =
    showTrade &&
    !pendingTrade &&
    tradeOnTurn &&
    Boolean(activePlayerId) &&
    (!localPlayerId || localPlayerId === activePlayerId);

  const showTradeReview =
    Boolean(pendingTrade) &&
    !winnerId &&
    (!localPlayerId || localPlayerId === pendingTrade!.toId);

  const showTradeWaiting =
    Boolean(pendingTrade) &&
    !winnerId &&
    (!localPlayerId || localPlayerId === pendingTrade!.fromId) &&
    !showTradeReview;

  const walletPlayer =
    onlineSession != null
      ? (players.find((p) => p.id === onlineSession.localPlayerId) ??
        activePlayer)
      : activePlayer;

  applyRemoteIntentRef.current = (actorId, intent) => {
    const active = activeRef.current;
    const allowed = (() => {
      switch (intent.type) {
        case "rollDice":
        case "buySelected":
        case "passTurn":
        case "drawCard":
        case "dismissEvent":
        case "payJailFine":
        case "useJailProtection":
        case "openTrade":
        case "closeTrade":
        case "proposeTrade":
          return (
            actorId === active &&
            (turnPhase === "roll" ||
              turnPhase === "action" ||
              turnPhase === "debt")
          );
        case "cancelTrade":
          return (
            Boolean(pendingTrade) && pendingTrade!.fromId === actorId
          );
        case "respondTrade":
          return (
            Boolean(pendingTrade) && pendingTrade!.toId === actorId
          );
        case "requestPieceAuction":
        case "auctionSell":
        case "auctionNoBids":
        case "advanceActive":
        case "moveActiveTo":
        case "selectSpace":
          return actorId === active;
        case "claimRent":
          return pendingRent?.ownerId === actorId;
        case "payDebt":
        case "liquidateForDebt":
        case "declareBankruptcy":
          return pendingDebt?.debtorId === actorId;
        case "forfeitToBank":
          return (
            playersRef.current.some((p) => p.id === actorId && !p.bankrupt) &&
            (actorId === active ||
              (turnPhase === "debt" && pendingDebt?.debtorId === actorId))
          );
        case "auctionBid":
        case "auctionPass":
          return (
            Boolean(auction) && !auction!.excludedIds.includes(actorId)
          );
        case "auctionResolveTie":
          return Boolean(auction?.tiedBidderIds?.includes(actorId));
        case "setPlayers":
          return playersRef.current.some((p) => p.id === actorId);
        default:
          return false;
      }
    })();
    if (!allowed) return;

    switch (intent.type) {
      case "rollDice":
        onRollDiceLocal();
        break;
      case "buySelected": {
        const buyerId = activeRef.current;
        if (!buyerId) break;
        setSelectedIndex(intent.spaceIndex);
        const bought = buyProperty(
          playersRef.current,
          buyerId,
          intent.spaceIndex,
        );
        if (bought) {
          playersRef.current = bought;
          setPlayers(bought);
          if (extraRollRef.current) {
            extraRollRef.current = false;
            setTurnPhase("roll");
          } else {
            startNextTurn(buyerId);
          }
        }
        break;
      }
      case "passTurn":
        onPassTurnLocal();
        break;
      case "claimRent":
        onClaimRent();
        break;
      case "payDebt":
        onPayDebt();
        break;
      case "liquidateForDebt":
        onLiquidateForDebt();
        break;
      case "declareBankruptcy":
        onDeclareBankruptcy();
        break;
      case "forfeitToBank":
        onForfeitToBank(actorId);
        break;
      case "payJailFine":
        onPayJailFine();
        break;
      case "useJailProtection":
        onUseJailProtection();
        break;
      case "dismissEvent":
        onDismissEvent();
        break;
      case "auctionBid":
        onAuctionBid(actorId, intent.amount);
        break;
      case "auctionPass":
        onAuctionPass(actorId);
        break;
      case "auctionSell":
        onAuctionSell();
        break;
      case "auctionNoBids":
        onAuctionNoBids();
        break;
      case "auctionResolveTie":
        onResolveTieDice();
        break;
      case "openTrade":
        onOpenTradeLocal();
        break;
      case "closeTrade":
        setShowTrade(false);
        break;
      case "proposeTrade":
        onProposeTradeLocal(intent.proposal);
        break;
      case "cancelTrade":
        onCancelTradeLocal();
        break;
      case "respondTrade":
        onRespondTradeLocal(intent.accept);
        break;
      case "setPlayers":
        playersRef.current = intent.players;
        setPlayers(intent.players);
        break;
      case "requestPieceAuction":
        if (activeRef.current) {
          beginAuctions(
            [{ kind: intent.kind, spaceIndex: intent.spaceIndex }],
            activeRef.current,
          );
        }
        break;
      case "drawCard":
        onDrawCard();
        break;
      default:
        break;
    }
  };

  if (screen === "loading") {
    return (
      <LoadingScreen
        progress={loadProgress.ratio}
        hint={loadProgress.hint}
        detail={loadProgress.detail}
      />
    );
  }

  if (screen === "lobby") {
    return (
      <LobbyScreen
        onStart={startFromLobby}
        onOpenSfxAdmin={() => setScreen("sfx-admin")}
      />
    );
  }

  if (screen === "sfx-admin") {
    return <SfxAdminScreen onBack={() => setScreen("lobby")} />;
  }

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#120c08]">
      {onlineSession ? (
        <OnlineStatusBanner
          status={syncStatus}
          isHost={onlineSession.isHost}
        />
      ) : null}
      <BoardCanvas
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        onSelectPlayer={() => { }}
        diceRolling={diceRolling}
        diceRollId={diceRollId}
        canRoll={
          boardReady &&
          turnPhase === "roll" &&
          !showEventModal &&
          !winnerId &&
          localControlsTurn
        }
        onRollRequest={onRollDice}
        onRollComplete={onRollComplete}
        onPawnArrive={onPawnArrive}
        onJailEscortComplete={onJailEscortComplete}
        onBoardProgress={setBoardProgress}
        onBoardReady={() => setBoardReady(true)}
      />
      <GameSfxHud />
      {boardReady ? (
        <SpaceSelectMarker spaceIndex={selectedIndex} players={players} />
      ) : null}
      <WalletPanel
        player={walletPlayer}
        players={players}
        onPlayersChange={(next) => {
          if (winnerId) return;
          sendIntent({ type: "setPlayers", players: next }, () => {
            playersRef.current = next;
            setPlayers(next);
          });
        }}
        onRequestPieceAuction={(kind, spaceIndex) => {
          if (!activePlayerId || winnerId) return;
          sendIntent(
            { type: "requestPieceAuction", kind, spaceIndex },
            () => {
              beginAuctions([{ kind, spaceIndex }], activePlayerId);
            },
          );
        }}
      />
      <BoardHud
        selectedIndex={selectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        playerCount={playerCount}
        diceRoll={diceRoll}
        diceRolling={turnPhase !== "roll" || diceRolling || Boolean(winnerId)}
        consecutiveDoubles={consecutiveDoubles}
        decks={decks}
        turnPhase={turnPhase}
        turnHint={turnLabel}
        jailError={jailError}
        pendingDebt={pendingDebtForLocal}
        pendingRent={pendingRentForLocal}
        debtRaisable={debtRaisable}
        auctionQueueCount={auctionQueueCount}
        controlsTurn={localControlsTurn}
        isOnline={onlineSession != null}
        localPlayerId={localPlayerId}
        onSelectPlayer={() => { }}
        onPlayerCountChange={handlePlayerCountChange}
        onMoveActiveToSelected={onMoveActiveToSelected}
        onAdvanceActive={onAdvanceActive}
        onRollDice={onRollDice}
        onBuySelected={onBuySelected}
        onDrawCard={() => sendIntent({ type: "drawCard" }, onDrawCard)}
        onPassTurn={onPassTurn}
        onPayJailFine={() =>
          sendIntent({ type: "payJailFine" }, onPayJailFine)
        }
        onUseJailProtection={() =>
          sendIntent({ type: "useJailProtection" }, onUseJailProtection)
        }
        onPayDebt={() => sendIntent({ type: "payDebt" }, onPayDebt)}
        onLiquidateForDebt={() =>
          sendIntent({ type: "liquidateForDebt" }, onLiquidateForDebt)
        }
        onDeclareBankruptcy={() =>
          sendIntent({ type: "declareBankruptcy" }, onDeclareBankruptcy)
        }
        onForfeitToBank={() =>
          sendIntent({ type: "forfeitToBank" }, () => onForfeitToBank())
        }
        tradeBlocked={Boolean(pendingTrade)}
        onOpenTrade={() => {
          if (!tradeOnTurn || pendingTrade) return;
          sendIntent({ type: "openTrade" }, () => setShowTrade(true));
        }}
        onClaimRent={() => sendIntent({ type: "claimRent" }, onClaimRent)}
      />
      {showEventToLocal ? (
        <DrawnCardModal
          card={drawnCard}
          notes={cardNotes}
          followUpCards={followUpCards}
          onDismiss={() => {
            if (!isLocalActor(activePlayerId)) return;
            sendIntent({ type: "dismissEvent" }, onDismissEvent);
          }}
        />
      ) : null}
      {showTradeCompose && activePlayerId && !winnerId && !showEventToLocal ? (
        <TradeOverlay
          mode="compose"
          initiatorId={activePlayerId}
          players={players}
          onClose={() =>
            sendIntent({ type: "closeTrade" }, () => setShowTrade(false))
          }
          onPropose={(proposal) =>
            sendIntent({ type: "proposeTrade", proposal }, () =>
              onProposeTradeLocal(proposal),
            )
          }
        />
      ) : null}
      {showTradeReview && pendingTrade && !showEventToLocal ? (
        <TradeOverlay
          mode="review"
          initiatorId={pendingTrade.fromId}
          players={players}
          proposal={pendingTrade}
          onClose={() => undefined}
          onPropose={() => undefined}
          onRespond={(accept) =>
            sendIntent({ type: "respondTrade", accept }, () =>
              onRespondTradeLocal(accept),
            )
          }
        />
      ) : null}
      {showTradeWaiting && pendingTrade && !showEventToLocal ? (
        <TradeOverlay
          mode="waiting"
          initiatorId={pendingTrade.fromId}
          players={players}
          proposal={pendingTrade}
          onClose={() => undefined}
          onPropose={() => undefined}
          onCancelProposal={() =>
            sendIntent({ type: "cancelTrade" }, onCancelTradeLocal)
          }
        />
      ) : null}
      {auction &&
        turnPhase === "auction" &&
        !showEventToLocal &&
        !winnerId ? (
        <AuctionOverlay
          key={`${auction.lot.kind}-${auction.lot.spaceIndex}`}
          lot={auction.lot}
          queueRemaining={1 + auction.queue.length}
          players={players}
          currentBid={auction.currentBid}
          highBidderId={auction.highBidderId}
          tiedBidderIds={auction.tiedBidderIds}
          excludedIds={auction.excludedIds}
          passesNeeded={auctionPassesNeeded}
          passesSinceBid={auction.passesSinceBid}
          lockedBidderId={onlineSession?.localPlayerId ?? null}
          onBid={(playerId, amount) => {
            const bidAs = onlineSession?.localPlayerId ?? playerId;
            if (onlineSession && bidAs !== onlineSession.localPlayerId) return;
            sendIntent({ type: "auctionBid", amount }, () =>
              onAuctionBid(bidAs, amount),
            );
          }}
          onPass={(playerId) => {
            const passAs = onlineSession?.localPlayerId ?? playerId;
            if (onlineSession && passAs !== onlineSession.localPlayerId) return;
            sendIntent({ type: "auctionPass" }, () => onAuctionPass(passAs));
          }}
          onSell={() => {
            if (onlineSession && !isLocalActor(activePlayerId)) return;
            sendIntent({ type: "auctionSell" }, onAuctionSell);
          }}
          onNoBids={() => {
            if (onlineSession && !isLocalActor(activePlayerId)) return;
            sendIntent({ type: "auctionNoBids" }, onAuctionNoBids);
          }}
          onResolveTieDice={() => {
            if (
              onlineSession &&
              auction?.tiedBidderIds &&
              !auction.tiedBidderIds.includes(onlineSession.localPlayerId)
            ) {
              return;
            }
            sendIntent({ type: "auctionResolveTie" }, onResolveTieDice);
          }}
        />
      ) : null}
      {winner && !showEventToLocal ? (
        <VictoryOverlay
          winner={winner}
          players={players}
          onNewGame={returnToLobby}
        />
      ) : null}
      <p className="pointer-events-none absolute bottom-3 start-1/2 z-10 hidden -translate-x-1/2 text-center text-xs font-semibold text-[#ffe8c8]/80 max-md:bottom-[max(0.5rem,env(safe-area-inset-bottom))] md:block rtl:translate-x-1/2">
        {t("hud.hintOrbit")}
      </p>
      {!boardReady ? (
        <div className="absolute inset-0 z-50">
          <LoadingScreen
            progress={Math.max(0.08, boardProgress)}
            hint={t("loading.preparing")}
          />
        </div>
      ) : null}
    </div>
  );
}
