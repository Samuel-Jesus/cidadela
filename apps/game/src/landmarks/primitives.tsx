import type { ReactNode } from "react";
import { getGraphicsQuality } from "../scene/graphicsQuality";

function shadowProps() {
  const on = getGraphicsQuality().shadows;
  return { castShadow: on, receiveShadow: on };
}

export function Box({
  args,
  position,
  rotation,
  color,
  scale,
}: {
  args: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  scale?: [number, number, number];
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      {...shadowProps()}
    >
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.08} />
    </mesh>
  );
}

export function Cyl({
  args,
  position,
  rotation,
  color,
}: {
  args: [number, number, number, number?];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation} {...shadowProps()}>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

export function Cone({
  args,
  position,
  rotation,
  color,
}: {
  args: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow={getGraphicsQuality().shadows}
    >
      <coneGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

export function Sphere({
  args,
  position,
  color,
}: {
  args: [number, number?];
  position?: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow={getGraphicsQuality().shadows}>
      <sphereGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

export function Group({
  children,
  position,
  rotation,
  scale,
}: {
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {children}
    </group>
  );
}
