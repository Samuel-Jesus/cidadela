import { useCallback, useState } from "react";
import { createPlayers, type PlayerState } from "@cidadela/shared";
import { BoardCanvas } from "./scene/BoardCanvas";
import { BoardHud } from "./ui/BoardHud";

export function App() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<PlayerState[]>(() => createPlayers(4));
  const [activePlayerId, setActivePlayerId] = useState<string | null>(() => createPlayers(4)[0]?.id ?? null);

  const handlePlayerCountChange = useCallback((count: number) => {
    const next = createPlayers(count);
    setPlayerCount(count);
    setPlayers(next);
    setActivePlayerId(next[0]?.id ?? null);
  }, []);

  const movePlayer = useCallback((playerId: string, position: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, position: ((position % 40) + 40) % 40 } : p)),
    );
  }, []);

  const onMoveActiveToSelected = useCallback(() => {
    if (!activePlayerId || selectedIndex === null) return;
    movePlayer(activePlayerId, selectedIndex);
  }, [activePlayerId, selectedIndex, movePlayer]);

  const onAdvanceActive = useCallback(
    (steps: number) => {
      if (!activePlayerId) return;
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === activePlayerId
            ? { ...p, position: (p.position + steps) % 40 }
            : p,
        ),
      );
    },
    [activePlayerId],
  );

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#120c08]">
      <BoardCanvas
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        onSelectPlayer={setActivePlayerId}
      />
      <BoardHud
        selectedIndex={selectedIndex}
        players={players}
        activePlayerId={activePlayerId}
        playerCount={playerCount}
        onSelectPlayer={setActivePlayerId}
        onPlayerCountChange={handlePlayerCountChange}
        onMoveActiveToSelected={onMoveActiveToSelected}
        onAdvanceActive={onAdvanceActive}
      />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs text-[#c9ada7]/80">
        Arraste para orbitar · clique peão ou casa · avance pelo painel
      </p>
    </div>
  );
}
