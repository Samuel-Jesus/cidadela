import { useCallback, useRef, useState } from "react";
import { nextPosition, type DiceRoll } from "@cidadela/engine";
import { createPlayers, type PlayerState } from "@cidadela/shared";
import { preloadLandmarkModels } from "./landmarks/GltfLandmark";
import { BoardCanvas } from "./scene/BoardCanvas";
import { BoardHud } from "./ui/BoardHud";

preloadLandmarkModels();

export function App() {
  const initial = createPlayers(4);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<PlayerState[]>(initial);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(initial[0]?.id ?? null);

  const [diceRoll, setDiceRoll] = useState<DiceRoll | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceRollId, setDiceRollId] = useState(0);
  const [consecutiveDoubles, setConsecutiveDoubles] = useState(0);

  const doublesRef = useRef(0);
  const activeRef = useRef(activePlayerId);
  activeRef.current = activePlayerId;

  const handlePlayerCountChange = useCallback((count: number) => {
    const next = createPlayers(count);
    setPlayerCount(count);
    setPlayers(next);
    setActivePlayerId(next[0]?.id ?? null);
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
            ? { ...p, position: nextPosition(p.position, steps) }
            : p,
        ),
      );
    },
    [activePlayerId],
  );

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
        prev.map((p) => (p.id === playerId ? { ...p, position: 10 } : p)),
      );
      setSelectedIndex(10);
      return;
    }

    setPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId
          ? { ...p, position: nextPosition(p.position, roll.total) }
          : p,
      );
      const me = updated.find((p) => p.id === playerId);
      if (me) setSelectedIndex(me.position);
      return updated;
    });
  }, []);

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
      />
      <BoardHud
        selectedIndex={selectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        playerCount={playerCount}
        diceRoll={diceRoll}
        diceRolling={diceRolling}
        consecutiveDoubles={consecutiveDoubles}
        onSelectPlayer={setActivePlayerId}
        onPlayerCountChange={handlePlayerCountChange}
        onMoveActiveToSelected={onMoveActiveToSelected}
        onAdvanceActive={onAdvanceActive}
        onRollDice={onRollDice}
      />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs text-[#c9ada7]/80">
        Arraste para orbitar · toque duplo na bandeja para lançar os dados
      </p>
    </div>
  );
}
