import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { useTranslation } from "react-i18next";
import { getPawnDef, type PawnId } from "@cidadela/shared";
import { playSfx, unlockAudio } from "../audio/sfx";
import { getPawnKind } from "../pawns/pawnKind";
import { PawnTypeFx } from "../pawns/PawnTypeFx";
import { PawnVisual } from "../pawns/PawnVisual";

type Props = {
  value: PawnId;
  options: readonly PawnId[];
  onChange: (id: PawnId) => void;
  taken?: ReadonlySet<PawnId>;
  hint?: string;
};

function PreviewPawn({ pawnId }: { pawnId: PawnId }) {
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const idle = useRef(true);
  const movingRef = useRef(true);
  const kind = getPawnKind(pawnId);

  useFrame((_, dt) => {
    const g = group.current;
    const b = body.current;
    if (!g) return;
    if (idle.current) g.rotation.y += dt * 0.35;

    const t = performance.now() * 0.001;
    if (!b) return;
    if (kind === "ship") {
      b.position.y = Math.sin(t * 1.5) * 0.028 + Math.sin(t * 2.4) * 0.012;
      b.rotation.z = Math.sin(t * 1.25) * 0.05;
      b.rotation.x = Math.sin(t * 1.8 + 0.5) * 0.035;
    } else {
      b.position.y = Math.sin(t * 3.2) * 0.01;
      b.rotation.z = Math.sin(t * 2.2) * 0.025;
      b.rotation.x = Math.sin(t * 2.8) * 0.015;
    }
  });

  return (
    <>
      <group ref={group} position={[0, 0.05, 0]} scale={0.95}>
        <group ref={body}>
          <PawnVisual key={pawnId} pawnId={pawnId} />
          <PawnTypeFx key={`${pawnId}-fx`} kind={kind} movingRef={movingRef} />
        </group>
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.35, 0]}
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
  hint,
}: Props) {
  const { t } = useTranslation();
  const displayHint = hint ?? t("lobby.pawnHint");
  const available = useMemo(
    () => options.filter((id) => id === value || !taken?.has(id)),
    [options, taken, value],
  );
  const index = Math.max(0, available.indexOf(value));
  const def = getPawnDef(value);

  const step = (dir: -1 | 1) => {
    if (available.length === 0) return;
    unlockAudio();
    playSfx("switch");
    const next = available[(index + dir + available.length) % available.length]!;
    onChange(next);
  };

  return (
    <aside className="lobby-pawn-stage" aria-label={t("lobby.choosePawn")}>
      <p className="lobby-pawn-stage__kicker">{t("lobby.yourPawn")}</p>
      <h3 className="lobby-pawn-stage__title">{def.label}</h3>
      <p className="lobby-pawn-stage__hint">{displayHint}</p>

      <div
        className="lobby-pawn-stage__canvas"
        role="img"
        aria-label={t("lobby.pawnAria", { label: def.label })}
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
          aria-label={t("lobby.pawnPrev")}
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
          aria-label={t("lobby.pawnNext")}
        >
          ›
        </button>
      </div>
    </aside>
  );
}
