import { useCallback, useRef, useState } from "react";
import { crossesGo, nextPosition, type DiceRoll } from "@cidadela/engine";
import {
  GO_BONUS,
  JAIL_FINE,
  JAIL_MAX_ATTEMPTS,
  awardAuctionLot,
  buyProperty,
  createDecks,
  createPlayers,
  declareBankruptcy,
  deckIdFromSpaceKind,
  drawAndResolveCard,
  findPropertyOwner,
  findWinner,
  forceLeaveJailAfterFailedAttempts,
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
  type PendingRentClaim,
  type PlayerState,
} from "@cidadela/shared";
import { preloadLandmarkModels } from "./landmarks/GltfLandmark";
import { AuctionOverlay } from "./ui/AuctionOverlay";
import { BoardCanvas } from "./scene/BoardCanvas";
import { BoardHud } from "./ui/BoardHud";
import { DrawnCardModal } from "./ui/DrawnCardModal";
import { TradeOverlay } from "./ui/TradeOverlay";
import { VictoryOverlay } from "./ui/VictoryOverlay";
import { WalletPanel } from "./ui/WalletPanel";

preloadLandmarkModels();

type TurnPhase = "roll" | "busy" | "action" | "debt" | "auction" | "ended";

type AuctionSession = {
  lot: AuctionLot;
  queue: AuctionLot[];
  currentBid: number;
  highBidderId: string | null;
  tiedBidderIds: string[] | null;
  excludedIds: string[];
  passesSinceBid: number;
  resumePlayerId: string;
};

type PendingLanding = {
  playerId: string;
  utilityDiceTotal?: number;
};

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

  return {
    ...player,
    position,
    cash: player.cash + bonus,
  };
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

export function App() {
  const initial = createPlayers(4);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<PlayerState[]>(initial);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
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

  const activePlayer =
    players.find((p) => p.id === activePlayerId) ?? null;
  const winner = winnerId
    ? players.find((p) => p.id === winnerId) ?? null
    : null;

  const dismissEventUi = useCallback(() => {
    setShowEventModal(false);
    setDrawnCard(null);
    setCardNotes([]);
    setFollowUpCards([]);
  }, []);

  const presentEvent = useCallback((notes: string[], cards: CardDef[]) => {
    const primary = cards[0] ?? null;
    const rest = primary ? cards.slice(1) : cards;
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
      setJailError(result.error ?? "Não foi possível pagar.");
      return;
    }
    setJailError(null);
    playersRef.current = result.players;
    setPlayers(result.players);
    setTurnPhase("roll");
  }, [activePlayerId, turnPhase]);

  const onUseJailProtection = useCallback(() => {
    if (!activePlayerId || turnPhase !== "roll") return;
    const result = useProtectionToLeaveJail(
      playersRef.current,
      decksRef.current,
      activePlayerId,
    );
    if (!result.ok) {
      setJailError(result.error ?? "Sem Proteção.");
      return;
    }
    setJailError(null);
    playersRef.current = result.players;
    setPlayers(result.players);
    decksRef.current = result.decks;
    setDecks(result.decks);
    setTurnPhase("roll");
  }, [activePlayerId, turnPhase]);

  const handlePlayerCountChange = useCallback(
    (count: number) => {
      const next = createPlayers(count);
      setPlayerCount(count);
      setPlayers(next);
      playersRef.current = next;
      setActivePlayerId(next[0]?.id ?? null);
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
      resumePhaseAfterModalRef.current = null;
      setSelectedIndex(0);
      setTurnPhase("roll");
    },
    [dismissEventUi],
  );

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

  const onBuySelected = useCallback(() => {
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

  const onPassTurn = useCallback(() => {
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
          [...settled.notes, "Fim de jogo — resta um jogador de pé."],
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
        [...broke.notes, "Fim de jogo — resta um jogador de pé."],
        [],
      );
      return;
    }
    if (broke.auctionQueue.length) {
      enqueueAuctions(broke.auctionQueue);
    }
    presentEvent(broke.notes, []);
  }, [pendingDebt, turnPhase, presentEvent, enqueueAuctions, endGameIfWon]);

  const onClaimRent = useCallback(() => {
    if (!pendingRent) return;
    const claim = pendingRent;
    setPendingRent(null);
    const settled = settleDebt(
      playersRef.current,
      decksRef.current,
      claim.visitorId,
      claim.amount,
      { type: "player", playerId: claim.ownerId },
      `Aluguel (${getSpace(claim.spaceIndex).name})`,
    );
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
          [...settled.notes, "Fim de jogo — resta um jogador de pé."],
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
  }, [pendingRent, presentEvent, endGameIfWon, enqueueAuctions]);

  const onRollDice = useCallback(() => {
    if (!activeRef.current || diceRolling || turnPhase !== "roll") return;
    if (pendingRent) {
      const space = getSpace(pendingRent.spaceIndex);
      pendingNotesRef.current = [
        ...pendingNotesRef.current,
        `Aluguel de ${space.name} ($${pendingRent.amount}) perdido — o dono não cobrou a tempo.`,
      ];
      setPendingRent(null);
    }
    setTurnPhase("busy");
    setDiceRolling(true);
    setDiceRollId((id) => id + 1);
  }, [diceRolling, turnPhase, pendingRent]);

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
            `3ª tentativa sem dupla — pagou $${JAIL_FINE} e saiu avançando ${roll.total}.`,
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
            `Sem dupla (${attempts}/${JAIL_MAX_ATTEMPTS}). Continua no Forte.`,
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
        const shown = presentEvent(
          ["3ª dupla seguida — direto pro Forte, sem $200 da Chegada."],
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

  const onPawnArrive = useCallback(
    (playerId: string, spaceIndex: number) => {
      if (playerId !== activeRef.current) return;
      setSelectedIndex(spaceIndex);

      const pending = pendingLandingRef.current;
      if (!pending || pending.playerId !== playerId || resolvingRef.current) {
        return;
      }

      pendingLandingRef.current = null;
      resolvingRef.current = true;

      setPlayers((prevPlayers) => {
        const resolved = resolveSpaceLanding(
          prevPlayers,
          decksRef.current,
          playerId,
          spaceIndex,
          {
            utilityDiceTotal: pending.utilityDiceTotal,
            drawAndResolve: (deckId, p, d) => {
              const r = drawAndResolveCard(p, d, playerId, deckId);
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
        const shown = presentEvent(
          [...prefix, ...resolved.notes],
          resolved.followUpCards,
        );
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
            [awarded.error, "Leilão reabre sem o jogador que falhou."],
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
            ? "Sem lances — propriedade continua com o banco."
            : "Sem lances — peça continua no banco.";
        finishAuctionLot(auction, [keepMsg]);
        return;
      }
      setAuction({ ...auction, passesSinceBid: nextPasses });
    },
    [auction, auctionPassesNeeded, presentEvent, finishAuctionLot],
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
        [awarded.error, "Leilão reabre sem o jogador que falhou."],
        [],
      );
      return;
    }
    playersRef.current = awarded.players;
    setPlayers(awarded.players);
    finishAuctionLot(auction, awarded.notes);
  }, [auction, presentEvent, finishAuctionLot]);

  const onAuctionNoBids = useCallback(() => {
    if (!auction) return;
    const keepMsg =
      auction.lot.kind === "property"
        ? "Sem lances — propriedade continua com o banco."
        : "Sem lances — peça continua no banco.";
    finishAuctionLot(auction, [keepMsg]);
  }, [auction, finishAuctionLot]);

  const turnLabel = (() => {
    if (turnPhase === "ended" && winner) {
      return `Fim de jogo — vencedor`;
    }
    if (!activePlayer) return null;
    if (turnPhase === "auction") return "Leilão em andamento";
    if (turnPhase === "roll" && activePlayer.inJail) {
      return `No Forte · tentativa ${activePlayer.jailAttempts}/${JAIL_MAX_ATTEMPTS}`;
    }
    if (turnPhase === "roll" && consecutiveDoubles > 0 && diceRoll?.isDouble) {
      return "Dupla! Role de novo";
    }
    if (turnPhase === "roll") return "Sua vez — role os dados";
    if (turnPhase === "busy") return "Resolvendo…";
    if (turnPhase === "action") return "Comprar ou passar a vez";
    if (turnPhase === "debt" && pendingDebt) {
      return `Dívida $${pendingDebt.amount} — liquide ou falência`;
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

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#120c08]">
      <BoardCanvas
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        onSelectPlayer={() => { }}
        diceRolling={diceRolling}
        diceRollId={diceRollId}
        canRoll={turnPhase === "roll" && !showEventModal && !winnerId}
        onRollRequest={onRollDice}
        onRollComplete={onRollComplete}
        onPawnArrive={onPawnArrive}
      />
      <WalletPanel
        player={activePlayer}
        players={players}
        onPlayersChange={(next) => {
          if (winnerId) return;
          playersRef.current = next;
          setPlayers(next);
        }}
        onRequestPieceAuction={(kind, spaceIndex) => {
          if (!activePlayerId || winnerId) return;
          beginAuctions(
            [{ kind, spaceIndex }],
            activePlayerId,
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
        pendingDebt={pendingDebt}
        pendingRent={pendingRent}
        debtRaisable={debtRaisable}
        auctionQueueCount={auctionQueueCount}
        onSelectPlayer={() => { }}
        onPlayerCountChange={handlePlayerCountChange}
        onMoveActiveToSelected={onMoveActiveToSelected}
        onAdvanceActive={onAdvanceActive}
        onRollDice={onRollDice}
        onBuySelected={onBuySelected}
        onDrawCard={onDrawCard}
        onPassTurn={onPassTurn}
        onPayJailFine={onPayJailFine}
        onUseJailProtection={onUseJailProtection}
        onPayDebt={onPayDebt}
        onLiquidateForDebt={onLiquidateForDebt}
        onDeclareBankruptcy={onDeclareBankruptcy}
        onOpenTrade={() => setShowTrade(true)}
        onClaimRent={onClaimRent}
      />
      {showEventModal ? (
        <DrawnCardModal
          card={drawnCard}
          notes={cardNotes}
          followUpCards={followUpCards}
          onDismiss={onDismissEvent}
        />
      ) : null}
      {showTrade && activePlayerId && !winnerId && !showEventModal ? (
        <TradeOverlay
          initiatorId={activePlayerId}
          players={players}
          onClose={() => setShowTrade(false)}
          onApplied={(next, notes) => {
            playersRef.current = next;
            setPlayers(next);
            setShowTrade(false);
            const resume =
              turnPhase === "debt"
                ? "debt"
                : turnPhase === "action"
                  ? "action"
                  : turnPhase === "roll"
                    ? "roll"
                    : "roll";
            if (presentEvent(notes, [])) {
              resumePhaseAfterModalRef.current = resume;
            }
          }}
        />
      ) : null}
      {auction && turnPhase === "auction" && !showEventModal && !winnerId ? (
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
          onBid={onAuctionBid}
          onPass={onAuctionPass}
          onSell={onAuctionSell}
          onNoBids={onAuctionNoBids}
          onResolveTieDice={onResolveTieDice}
        />
      ) : null}
      {winner && !showEventModal ? (
        <VictoryOverlay
          winner={winner}
          players={players}
          onNewGame={() => handlePlayerCountChange(playerCount)}
        />
      ) : null}
      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-center text-xs font-semibold text-[#ffe8c8]/80">
        Arraste pra orbitar · carteira embaixo à esquerda · toque duplo na
        bandeja pra lançar
      </p>
    </div>
  );
}
