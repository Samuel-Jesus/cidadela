import { BOARD_SIZE, BOARD_Y } from "./layout";
import { JailRoad } from "./JailRoad";

export function BoardTable() {
  const size = BOARD_SIZE + 1.2;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[16, 64]} />
        <meshStandardMaterial color="#3b2416" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <circleGeometry args={[14.5, 64]} />
        <meshStandardMaterial color="#4a2f1c" roughness={0.8} />
      </mesh>

      <mesh position={[0, BOARD_Y * 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[size, BOARD_Y * 0.85, size]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.75} />
      </mesh>

      <mesh position={[0, BOARD_Y + 0.02, 0]} receiveShadow>
        <boxGeometry args={[BOARD_SIZE * 0.72, 0.08, BOARD_SIZE * 0.72]} />
        <meshStandardMaterial color="#e8d5b5" roughness={0.7} />
      </mesh>

      <CenterLabel />

      <JailRoad />
    </group>
  );
}

function CenterLabel() {
  return (
    <group position={[0, BOARD_Y + 0.15, 0]}>
      <mesh castShadow>
        <boxGeometry args={[4.5, 0.12, 1.2]} />
        <meshStandardMaterial color="#6b452f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[4.2, 0.05, 0.9]} />
        <meshStandardMaterial color="#d4a373" roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  );
}
