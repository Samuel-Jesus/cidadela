import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import type { DiceRoll } from "@cidadela/engine";
import type { PlayerState } from "@cidadela/shared";
import { BoardCamera, type CameraMode } from "./BoardCamera";
import { BoardReadySignal } from "./BoardReadySignal";
import { BoardTable } from "./BoardTable";
import { DiceTray } from "./DiceTray";
import { getGraphicsQuality } from "./graphicsQuality";
import { JailEscort } from "./JailEscort";
import type { JailEscortMission } from "./jailEscortState";
import { computeSpaceLayouts } from "./layout";
import { PawnsLayer } from "./PawnsLayer";
import { SpaceTile } from "./SpaceTile";

type Props = {
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  players: PlayerState[];
  activePlayerId: string | null;
  cameraFollowPlayerId?: string | null;
  cameraMode?: CameraMode;
  onSelectPlayer: (playerId: string) => void;
  diceRolling: boolean;
  diceRollId: number;
  canRoll: boolean;
  onRollRequest: () => void;
  onRollComplete: (roll: DiceRoll) => void;
  onPawnArrive?: (playerId: string, spaceIndex: number) => void;
  onJailEscortComplete?: (mission: JailEscortMission) => void;
  onBoardProgress?: (ratio: number) => void;
  onBoardReady?: () => void;
};

export function BoardCanvas({
  selectedIndex,
  onSelect,
  players,
  activePlayerId,
  cameraFollowPlayerId = null,
  cameraMode = "orbit",
  onSelectPlayer,
  diceRolling,
  diceRollId,
  canRoll,
  onRollRequest,
  onRollComplete,
  onPawnArrive,
  onJailEscortComplete,
  onBoardProgress,
  onBoardReady,
}: Props) {
  const layouts = useMemo(() => computeSpaceLayouts(), []);
  const followId = cameraFollowPlayerId ?? activePlayerId;
  const quality = useMemo(() => getGraphicsQuality(), []);

  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      camera={{ position: [18, 16, 18], fov: 42, near: 0.1, far: 200 }}
      gl={{
        antialias: quality.antialias,
        powerPreference: "high-performance",
        stencil: false,
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#120c08"]} />
      <fog attach="fog" args={["#120c08", 35, 70]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow={quality.shadows}
        position={[12, 22, 10]}
        intensity={1.35}
        shadow-mapSize={[quality.shadowMapSize, quality.shadowMapSize]}
        shadow-bias={-0.0003}
        shadow-camera-far={50}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <hemisphereLight args={["#ffe8c8", "#2a1810", 0.4]} />
      <directionalLight position={[-8, 10, -6]} intensity={0.3} color="#b8d4ff" />

      <Suspense fallback={null}>
        <BoardTable />
        {layouts.map((layout) => (
          <SpaceTile
            key={layout.index}
            layout={layout}
            selected={selectedIndex === layout.index}
            onSelect={onSelect}
          />
        ))}

        <DiceTray
          rolling={diceRolling}
          rollId={diceRollId}
          canRoll={canRoll}
          onRollRequest={onRollRequest}
          onRollComplete={onRollComplete}
        />

        <PawnsLayer
          players={players}
          layouts={layouts}
          activePlayerId={activePlayerId}
          cameraFollowPlayerId={followId}
          onSelectPlayer={onSelectPlayer}
          onPawnArrive={onPawnArrive}
        />

        <JailEscort onComplete={onJailEscortComplete} />

        {onBoardReady ? (
          <BoardReadySignal
            onProgress={onBoardProgress}
            onReady={onBoardReady}
          />
        ) : null}
      </Suspense>

      <BoardCamera mode={cameraMode} followPlayerId={followId} />
    </Canvas>
  );
}
