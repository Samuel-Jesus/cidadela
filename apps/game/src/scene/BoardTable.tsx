import { BOARD_SIZE, BOARD_Y } from "./layout";
import { JailRoad } from "./JailRoad";
import { ViaturaOperacao } from "./ViaturaOperacao";

export function BoardTable() {
  const size = BOARD_SIZE + 1.2;
  const feltH = 0.05;

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

      <mesh position={[0, BOARD_Y / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[size, BOARD_Y, size]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.75} />
      </mesh>

      <mesh
        position={[0, BOARD_Y - feltH / 2 + 0.002, 0]}
        receiveShadow
      >
        <boxGeometry args={[BOARD_SIZE * 0.72, feltH, BOARD_SIZE * 0.72]} />
        <meshStandardMaterial color="#e8d5b5" roughness={0.7} />
      </mesh>

      <JailRoad />
      <ViaturaOperacao />
    </group>
  );
}
