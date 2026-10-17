import { useMemo } from "react";
import type { PlayerState } from "@cidadela/shared";
import type { SpaceLayout } from "./layout";
import { Pawn } from "./Pawn";

type Props = {
  players: PlayerState[];
  layouts: SpaceLayout[];
  activePlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
  onPawnArrive?: (playerId: string, spaceIndex: number) => void;
};

export function PawnsLayer({
  players,
  layouts,
  activePlayerId,
  onSelectPlayer,
  onPawnArrive,
}: Props) {
  const layoutsByIndex = useMemo(() => {
    const map = new Map<number, SpaceLayout>();
    for (const l of layouts) map.set(l.index, l);
    return map;
  }, [layouts]);

  const slotsBySpace = useMemo(() => {
    const map = new Map<number, PlayerState[]>();
    for (const p of players) {
      const list = map.get(p.position) ?? [];
      list.push(p);
      map.set(p.position, list);
    }
    return map;
  }, [players]);

  return (
    <group>
      {players.map((player) => {
        if (!layoutsByIndex.has(player.position)) return null;
        const onSpace = slotsBySpace.get(player.position) ?? [player];
        const slotIndex = onSpace.findIndex((p) => p.id === player.id);
        return (
          <Pawn
            key={player.id}
            playerId={player.id}
            pawnId={player.pawnId}
            spaceIndex={player.position}
            layoutsByIndex={layoutsByIndex}
            slotIndex={Math.max(0, slotIndex)}
            slotCount={onSpace.length}
            active={player.id === activePlayerId}
            onClick={() => onSelectPlayer(player.id)}
            onArrive={(spaceIndex) => onPawnArrive?.(player.id, spaceIndex)}
          />
        );
      })}
    </group>
  );
}
