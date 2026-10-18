import { useMemo } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import { BOARD_Y } from "./layout";

export const JAIL_ROAD_SCALE = 0.72;
export const JAIL_ROAD_Y = BOARD_Y + 0.08;

const SCALE = JAIL_ROAD_SCALE;
const ROAD_Y = JAIL_ROAD_Y;

const EAST = 9;
const NORTH = 9;
const WEST = -9;
const SOUTH = -9;

export function jailRoadWaypoints(): [number, number][] {
  const pts: [number, number][] = [];
  for (let gz = SOUTH; gz <= NORTH; gz++) {
    pts.push([EAST * SCALE, gz * SCALE]);
  }
  for (let gx = EAST - 1; gx >= WEST; gx--) {
    pts.push([gx * SCALE, NORTH * SCALE]);
  }
  for (let gz = NORTH - 1; gz >= SOUTH; gz--) {
    pts.push([WEST * SCALE, gz * SCALE]);
  }
  for (let gx = WEST + 1; gx < EAST; gx++) {
    pts.push([gx * SCALE, SOUTH * SCALE]);
  }
  return pts;
}

export function jailRoadParipeStop(): [number, number] {
  return [3.2, NORTH * SCALE];
}

const URLS = {
  straight: "/models/roads/road-straight.glb",
  bend: "/models/roads/road-bend.glb",
  light: "/models/roads/light-curved.glb",
  cone: "/models/roads/construction-cone.glb",
} as const;

export const JAIL_ROAD_MODELS = [
  { url: URLS.straight, label: "Pista reta" },
  { url: URLS.bend, label: "Pista curva" },
  { url: URLS.light, label: "Poste da pista" },
  { url: URLS.cone, label: "Cone da pista" },
] as const;

type TileKind = "straight" | "bend";

type Tile = {
  kind: TileKind;
  gx: number;
  gz: number;
  rot: number;
};

type Prop = {
  kind: "light" | "cone";
  gx: number;
  gz: number;
  rot: number;
  ox?: number;
  oz?: number;
};

function buildTiles(): Tile[] {
  const tiles: Tile[] = [];

  tiles.push({ kind: "bend", gx: EAST, gz: NORTH, rot: -Math.PI / 2 });
  for (let gx = EAST - 1; gx >= WEST + 1; gx--) {
    tiles.push({ kind: "straight", gx, gz: NORTH, rot: 0 });
  }

  tiles.push({ kind: "bend", gx: WEST, gz: NORTH, rot: Math.PI });
  for (let gz = NORTH - 1; gz >= SOUTH + 1; gz--) {
    tiles.push({ kind: "straight", gx: WEST, gz, rot: Math.PI / 2 });
  }

  tiles.push({ kind: "bend", gx: WEST, gz: SOUTH, rot: Math.PI / 2 });
  for (let gx = WEST + 1; gx <= EAST - 1; gx++) {
    tiles.push({ kind: "straight", gx, gz: SOUTH, rot: 0 });
  }

  tiles.push({ kind: "bend", gx: EAST, gz: SOUTH, rot: 0 });
  for (let gz = SOUTH + 1; gz <= NORTH - 1; gz++) {
    tiles.push({ kind: "straight", gx: EAST, gz, rot: Math.PI / 2 });
  }

  return tiles;
}

function buildProps(): Prop[] {
  return [
    { kind: "light", gx: EAST, gz: -4, rot: Math.PI / 2, ox: -0.45 },
    { kind: "light", gx: EAST, gz: 4, rot: -Math.PI / 2, ox: 0.45 },
    { kind: "light", gx: 4, gz: NORTH, rot: 0, oz: -0.45 },
    { kind: "light", gx: -4, gz: NORTH, rot: Math.PI, oz: 0.45 },
    { kind: "light", gx: WEST, gz: 4, rot: Math.PI / 2, ox: -0.45 },
    { kind: "light", gx: WEST, gz: -4, rot: -Math.PI / 2, ox: 0.45 },
    { kind: "light", gx: 4, gz: SOUTH, rot: Math.PI, oz: 0.45 },
    { kind: "light", gx: -4, gz: SOUTH, rot: 0, oz: -0.45 },
    { kind: "cone", gx: EAST, gz: 0, rot: 0.3, ox: 0.4 },
    { kind: "cone", gx: WEST, gz: 0, rot: -0.25, ox: -0.4 },
    { kind: "cone", gx: 0, gz: NORTH, rot: 0.2, oz: 0.4 },
    { kind: "cone", gx: 0, gz: SOUTH, rot: -0.15, oz: -0.4 },
  ];
}

function RoadMesh({
  url,
  position,
  rotationY,
  scale = SCALE,
}: {
  url: string;
  position: [number, number, number];
  rotationY: number;
  scale?: number;
}) {
  const { scene } = useGLTF(url);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  );
}

export function JailRoad() {
  const tiles = useMemo(() => buildTiles(), []);
  const props = useMemo(() => buildProps(), []);

  return (
    <group name="jail-road">
      {tiles.map((t) => (
        <RoadMesh
          key={`${t.kind}-${t.gx}-${t.gz}`}
          url={URLS[t.kind]}
          position={[t.gx * SCALE, ROAD_Y, t.gz * SCALE]}
          rotationY={t.rot}
        />
      ))}
      {props.map((p, i) => (
        <RoadMesh
          key={`prop-${p.kind}-${i}`}
          url={p.kind === "light" ? URLS.light : URLS.cone}
          position={[
            p.gx * SCALE + (p.ox ?? 0) * SCALE,
            ROAD_Y,
            p.gz * SCALE + (p.oz ?? 0) * SCALE,
          ]}
          rotationY={p.rot}
          scale={p.kind === "cone" ? SCALE * 0.9 : SCALE}
        />
      ))}
    </group>
  );
}

export function preloadJailRoadModels() {
  for (const m of JAIL_ROAD_MODELS) useGLTF.preload(m.url);
}
