import { useMemo } from "react";
import type { PlayerState } from "@cidadela/shared";
import type { SpaceLayout } from "./layout";
import { Pawn } from "./Pawn";

type Props = {
  players: PlayerState[];
  layouts: SpaceLayout[];
  activePlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
};

export function PawnsLayer({ players, layouts, activePlayerId, onSelectPlayer }: Props) {
  const layoutByIndex = useMemo(() => {
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
        const layout = layoutByIndex.get(player.position);
        if (!layout) return null;
        const onSpace = slotsBySpace.get(player.position) ?? [player];
        const slotIndex = onSpace.findIndex((p) => p.id === player.id);
        return (
          <Pawn
            key={player.id}
            pawnId={player.pawnId}
            layout={layout}
            slotIndex={Math.max(0, slotIndex)}
            slotCount={onSpace.length}
            active={player.id === activePlayerId}
            onClick={() => onSelectPlayer(player.id)}
          />
        );
      })}
    </group>
  );
}
