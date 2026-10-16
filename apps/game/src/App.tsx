import { useCallback, useRef, useState } from "react";
import { crossesGo, nextPosition, type DiceRoll } from "@cidadela/engine";
import {
  GO_BONUS,
  buyProperty,
  createDecks,
  createPlayers,
  deckIdFromSpaceKind,
  drawCard,
  getSpace,
  resolveCardEffect,
  type CardDef,
  type DecksState,
  type PlayerState,
} from "@cidadela/shared";
import { preloadLandmarkModels } from "./landmarks/GltfLandmark";
import { BoardCanvas } from "./scene/BoardCanvas";
import { BoardHud } from "./ui/BoardHud";
import { DrawnCardModal } from "./ui/DrawnCardModal";
import { WalletPanel } from "./ui/WalletPanel";

preloadLandmarkModels();

function applyMove(
  player: PlayerState,
  steps: number,
  opts: { grantGoBonus: boolean; forcePosition?: number; inJail?: boolean },
): PlayerState {
  if (opts.forcePosition !== undefined) {
    return {
      ...player,
      position: opts.forcePosition,
      inJail: opts.inJail ?? player.inJail,
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

export function App() {
  const initial = createPlayers(4);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<PlayerState[]>(initial);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [decks, setDecks] = useState<DecksState>(() => createDecks());
  const [drawnCard, setDrawnCard] = useState<CardDef | null>(null);
  const [cardNotes, setCardNotes] = useState<string[]>([]);
  const [followUpCards, setFollowUpCards] = useState<CardDef[]>([]);

  const [diceRoll, setDiceRoll] = useState<DiceRoll | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceRollId, setDiceRollId] = useState(0);
  const [consecutiveDoubles, setConsecutiveDoubles] = useState(0);

  const doublesRef = useRef(0);
  const activeRef = useRef(activePlayerId);
  activeRef.current = activePlayerId;

  const activePlayer =
    players.find((p) => p.id === activePlayerId) ?? null;

  const handlePlayerCountChange = useCallback((count: number) => {
    const next = createPlayers(count);
    setPlayerCount(count);
    setPlayers(next);
    setActivePlayerId(next[0]?.id ?? null);
    setDecks(createDecks());
    setDrawnCard(null);
    setCardNotes([]);
    setFollowUpCards([]);
    setDiceRoll(null);
    setDiceRolling(false);
    doublesRef.current = 0;
    setConsecutiveDoubles(0);
  }, []);

  const onMoveActiveToSelected = useCallback(() => {
    if (!activePlayerId || selectedIndex === null) return;
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === activePlayerId ? { ...p, position: selectedIndex } : p,
      ),
    );
  }, [activePlayerId, selectedIndex]);

  const onAdvanceActive = useCallback(
    (steps: number) => {
      if (!activePlayerId) return;
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === activePlayerId
            ? applyMove(p, steps, { grantGoBonus: true })
            : p,
        ),
      );
    },
    [activePlayerId],
  );

  const onBuySelected = useCallback(() => {
    if (!activePlayerId || selectedIndex === null) return;
    setPlayers((prev) => {
      const next = buyProperty(prev, activePlayerId, selectedIndex);
      return next ?? prev;
    });
  }, [activePlayerId, selectedIndex]);

  const onDrawCard = useCallback(() => {
    if (!activePlayerId || selectedIndex === null || drawnCard) return;
    const space = getSpace(selectedIndex);
    const deckId = deckIdFromSpaceKind(space.kind);
    if (!deckId) return;

    let finalDecks: DecksState | null = null;
    setDecks((prevDecks) => {
      const { card, decks: afterDraw } = drawCard(prevDecks, deckId);
      setPlayers((prevPlayers) => {
        const resolved = resolveCardEffect(
          prevPlayers,
          afterDraw,
          activePlayerId,
          card,
        );
        finalDecks = resolved.decks;
        const moved = resolved.players.find((p) => p.id === activePlayerId);
        if (moved) setSelectedIndex(moved.position);
        setDrawnCard(card);
        setCardNotes(resolved.notes);
        setFollowUpCards(resolved.followUpCards);
        return resolved.players;
      });
      return finalDecks ?? afterDraw;
    });
  }, [activePlayerId, selectedIndex, drawnCard]);

  const onRollDice = useCallback(() => {
    if (!activeRef.current || diceRolling) return;
    setDiceRolling(true);
    setDiceRollId((id) => id + 1);
  }, [diceRolling]);

  const onRollComplete = useCallback((roll: DiceRoll) => {
    setDiceRolling(false);
    setDiceRoll(roll);

    const playerId = activeRef.current;
    if (!playerId) return;

    if (roll.isDouble) {
      doublesRef.current += 1;
    } else {
      doublesRef.current = 0;
    }
    setConsecutiveDoubles(doublesRef.current);

    if (roll.isDouble && doublesRef.current >= 3) {
      doublesRef.current = 0;
      setConsecutiveDoubles(0);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? applyMove(p, 0, {
                grantGoBonus: false,
                forcePosition: 10,
                inJail: true,
              })
            : p,
        ),
      );
      return;
    }

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? applyMove(p, roll.total, { grantGoBonus: true })
          : p,
      ),
    );
  }, []);

  const onPawnArrive = useCallback(
    (playerId: string, spaceIndex: number) => {
      if (playerId !== activeRef.current) return;
      setSelectedIndex(spaceIndex);
    },
    [],
  );

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#120c08]">
      <BoardCanvas
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        onSelectPlayer={setActivePlayerId}
        diceRolling={diceRolling}
        diceRollId={diceRollId}
        canRoll={Boolean(activePlayerId)}
        onRollRequest={onRollDice}
        onRollComplete={onRollComplete}
        onPawnArrive={onPawnArrive}
      />
      <WalletPanel
        player={activePlayer}
        players={players}
        onPlayersChange={setPlayers}
      />
      <BoardHud
        selectedIndex={selectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        playerCount={playerCount}
        diceRoll={diceRoll}
        diceRolling={diceRolling}
        consecutiveDoubles={consecutiveDoubles}
        decks={decks}
        onSelectPlayer={setActivePlayerId}
        onPlayerCountChange={handlePlayerCountChange}
        onMoveActiveToSelected={onMoveActiveToSelected}
        onAdvanceActive={onAdvanceActive}
        onRollDice={onRollDice}
        onBuySelected={onBuySelected}
        onDrawCard={onDrawCard}
      />
      {drawnCard ? (
        <DrawnCardModal
          card={drawnCard}
          notes={cardNotes}
          followUpCards={followUpCards}
          onDismiss={() => {
            setDrawnCard(null);
            setCardNotes([]);
            setFollowUpCards([]);
          }}
        />
      ) : null}
      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-center text-xs text-[#c9ada7]/75">
        Arraste para orbitar · carteira no canto inferior esquerdo · toque duplo
        na bandeja para lançar
      </p>
    </div>
  );
}
