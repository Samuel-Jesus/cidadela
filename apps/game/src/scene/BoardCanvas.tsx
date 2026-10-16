import { Canvas } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import { BOARD, type PlayerState } from "@cidadela/shared";
import { BoardTable } from "./BoardTable";
import { computeSpaceLayouts } from "./layout";
import { PawnsLayer } from "./PawnsLayer";
import { SpaceTile } from "./SpaceTile";

type Props = {
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  players: PlayerState[];
  activePlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
};

export function BoardCanvas({
  selectedIndex,
  onSelect,
  players,
  activePlayerId,
  onSelectPlayer,
}: Props) {
  const layouts = useMemo(() => computeSpaceLayouts(), []);

  return (
    <Canvas
      shadows
      camera={{ position: [18, 16, 18], fov: 42, near: 0.1, far: 200 }}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#120c08"]} />
      <fog attach="fog" args={["#120c08", 35, 70]} />

      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow
        position={[12, 22, 10]}
        intensity={1.35}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={["#ffe8c8", "#2a1810", 0.35]} />

      <BoardTable />
      {layouts.map((layout) => (
        <SpaceTile
          key={layout.index}
          layout={layout}
          selected={selectedIndex === layout.index}
          onSelect={onSelect}
        />
      ))}

      <PawnsLayer
        players={players}
        layouts={layouts}
        activePlayerId={activePlayerId}
        onSelectPlayer={onSelectPlayer}
      />

      <ContactShadows position={[0, 0.03, 0]} opacity={0.45} scale={32} blur={2.5} far={12} />

      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={12}
        maxDistance={42}
        enablePan={false}
      />

      {selectedIndex !== null ? (
        <Html position={[0, 8.5, 0]} center style={{ pointerEvents: "none" }}>
          <div className="rounded-full bg-[#1a120c]/75 px-3 py-1 text-xs text-[#f5f0e8] backdrop-blur">
            {BOARD[selectedIndex]?.name}
          </div>
        </Html>
      ) : null}
    </Canvas>
  );
}
