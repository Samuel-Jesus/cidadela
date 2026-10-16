import { useCallback, useRef, useState } from "react";
import { crossesGo, nextPosition, type DiceRoll } from "@cidadela/engine";
import {
  GO_BONUS,
  JAIL_FINE,
  JAIL_MAX_ATTEMPTS,
  buyProperty,
  createDecks,
  createPlayers,
  declareBankruptcy,
  deckIdFromSpaceKind,
  drawAndResolveCard,
  findPropertyOwner,
  forceLeaveJailAfterFailedAttempts,
  getSpace,
  isBuyableKind,
  liquidateAll,
  maxRaisableCash,
  payJailFine,
  payPendingDebt,
  releaseFromJail,
  resolveSpaceLanding,
  sendToJail,
  useProtectionToLeaveJail,
  type CardDef,
  type DebtInfo,
  type DecksState,
  type PlayerState,
} from "@cidadela/shared";
import { preloadLandmarkModels } from "./landmarks/GltfLandmark";
import { BoardCanvas } from "./scene/BoardCanvas";
import { BoardHud } from "./ui/BoardHud";
import { DrawnCardModal } from "./ui/DrawnCardModal";
import { WalletPanel } from "./ui/WalletPanel";

preloadLandmarkModels();

type TurnPhase = "roll" | "busy" | "action" | "debt";

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
  const [auctionQueue, setAuctionQueue] = useState<number[]>([]);

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

  const startNextTurn = useCallback((fromPlayerId: string) => {
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
  }, []);

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
      queue: number[] | undefined,
      afterPlayerId: string,
      spaceIndex: number,
    ) => {
      if (queue?.length) {
        setAuctionQueue((prev) => [...prev, ...queue]);
      }
      if (debt) {
        setPendingDebt(debt);
        setTurnPhase("debt");
        return;
      }
      const player = playersRef.current.find((p) => p.id === afterPlayerId);
      if (player?.bankrupt) {
        startNextTurn(afterPlayerId);
        return;
      }
      advanceAfterResolve(afterPlayerId, spaceIndex);
    },
    [advanceAfterResolve, startNextTurn],
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
      setAuctionQueue([]);
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
    if (extraRollRef.current) {
      extraRollRef.current = false;
      setTurnPhase("roll");
      return;
    }
    startNextTurn(activePlayerId);
  }, [activePlayerId, turnPhase, startNextTurn]);

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
        setAuctionQueue((q) => [...q, ...resolved.auctionQueue!]);
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
  ]);

  const onDismissEvent = useCallback(() => {
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
      if (settled.auctionQueue.length) {
        setAuctionQueue((q) => [...q, ...settled.auctionQueue]);
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
    if (broke.auctionQueue.length) {
      setAuctionQueue((q) => [...q, ...broke.auctionQueue]);
    }
    presentEvent(broke.notes, []);
  }, [pendingDebt, turnPhase, presentEvent]);

  const onRollDice = useCallback(() => {
    if (!activeRef.current || diceRolling || turnPhase !== "roll") return;
    setTurnPhase("busy");
    setDiceRolling(true);
    setDiceRollId((id) => id + 1);
  }, [diceRolling, turnPhase]);

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
        if (resolved.auctionQueue.length) {
          setAuctionQueue((q) => [...q, ...resolved.auctionQueue]);
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
    [presentEvent, applyDebtOutcome],
  );

  const turnLabel = (() => {
    if (!activePlayer) return null;
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
        canRoll={turnPhase === "roll" && !showEventModal}
        onRollRequest={onRollDice}
        onRollComplete={onRollComplete}
        onPawnArrive={onPawnArrive}
      />
      <WalletPanel
        player={activePlayer}
        players={players}
        onPlayersChange={(next) => {
          playersRef.current = next;
          setPlayers(next);
        }}
      />
      <BoardHud
        selectedIndex={selectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        playerCount={playerCount}
        diceRoll={diceRoll}
        diceRolling={turnPhase !== "roll" || diceRolling}
        consecutiveDoubles={consecutiveDoubles}
        decks={decks}
        turnPhase={turnPhase}
        turnHint={turnLabel}
        jailError={jailError}
        pendingDebt={pendingDebt}
        debtRaisable={debtRaisable}
        auctionQueueCount={auctionQueue.length}
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
      />
      {showEventModal ? (
        <DrawnCardModal
          card={drawnCard}
          notes={cardNotes}
          followUpCards={followUpCards}
          onDismiss={onDismissEvent}
        />
      ) : null}
      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-center text-xs font-semibold text-[#ffe8c8]/80">
        Arraste pra orbitar · carteira embaixo à esquerda · toque duplo na
        bandeja pra lançar
      </p>
    </div>
  );
}
