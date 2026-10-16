import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { getPawnDef, type PawnId } from "@cidadela/shared";

type Props = {
  value: PawnId;
  options: readonly PawnId[];
  onChange: (id: PawnId) => void;
  taken?: ReadonlySet<PawnId>;
  hint?: string;
};

function PawnMesh({ pawnId }: { pawnId: PawnId }) {
  const def = getPawnDef(pawnId);
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.08, 16]} />
        <meshStandardMaterial
          color={def.accent}
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.1, 0.2, 0.42, 16]} />
        <meshStandardMaterial
          color={def.color}
          roughness={0.45}
          metalness={0.12}
        />
      </mesh>
      <mesh castShadow position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color={def.color}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <mesh castShadow position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color={def.accent}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

function PreviewPawn({ pawnId }: { pawnId: PawnId }) {
  const group = useRef<Group>(null);
  const idle = useRef(true);

  useFrame((_, dt) => {
    if (!group.current || !idle.current) return;
    group.current.rotation.y += dt * 0.55;
  });

  return (
    <>
      <group ref={group} position={[0, 0.05, 0]} scale={0.78}>
        <PawnMesh key={pawnId} pawnId={pawnId} />
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.32, 0]}
        onStart={() => {
          idle.current = false;
        }}
        onEnd={() => {
          idle.current = true;
        }}
      />
    </>
  );
}

export function LobbyPawnCarousel({
  value,
  options,
  onChange,
  taken,
  hint = "Arraste para girar · ‹ › para trocar",
}: Props) {
  const available = useMemo(
    () => options.filter((id) => id === value || !taken?.has(id)),
    [options, taken, value],
  );
  const index = Math.max(0, available.indexOf(value));
  const def = getPawnDef(value);

  const step = (dir: -1 | 1) => {
    if (available.length === 0) return;
    const next = available[(index + dir + available.length) % available.length]!;
    onChange(next);
  };

  return (
    <aside className="lobby-pawn-stage" aria-label="Escolher peão">
      <p className="lobby-pawn-stage__kicker">Seu peão</p>
      <h3 className="lobby-pawn-stage__title">{def.label}</h3>
      <p className="lobby-pawn-stage__hint">{hint}</p>

      <div
        className="lobby-pawn-stage__canvas"
        role="img"
        aria-label={`${def.label}. Arraste para girar e ver todos os lados. Use os botões para trocar de peão.`}
      >
        <Canvas
          camera={{ position: [0, 0.42, 2.55], fov: 34 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["#fff7ed"]} />
          <ambientLight intensity={0.65} />
          <directionalLight
            position={[2.5, 4, 2]}
            intensity={1.15}
            castShadow
          />
          <Suspense fallback={null}>
            <PreviewPawn pawnId={value} />
            <ContactShadows
              position={[0, -0.02, 0]}
              opacity={0.45}
              scale={4}
              blur={2.2}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="lobby-pawn-stage__nav">
        <button
          type="button"
          className="deed-btn deed-btn--soft"
          onClick={() => step(-1)}
          aria-label="Peão anterior"
        >
          ‹
        </button>
        <span className="lobby-pawn-stage__dots" aria-hidden>
          {available.map((id) => (
            <i
              key={id}
              className={
                id === value
                  ? "lobby-pawn-stage__dot lobby-pawn-stage__dot--on"
                  : "lobby-pawn-stage__dot"
              }
              style={{
                backgroundColor: id === value ? getPawnDef(id).color : undefined,
              }}
            />
          ))}
        </span>
        <button
          type="button"
          className="deed-btn deed-btn--soft"
          onClick={() => step(1)}
          aria-label="Próximo peão"
        >
          ›
        </button>
      </div>
    </aside>
  );
}
