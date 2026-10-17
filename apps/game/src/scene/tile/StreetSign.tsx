import { Text } from "@react-three/drei";
import type { SpaceLayout } from "../layout";
import { inkOn } from "./inkOn";
import { isSideTile } from "./tileLayout";

const NAME_FONT =
  "https://cdn.jsdelivr.net/fontsource/fonts/fredoka@5.2.5/latin-700-normal.woff";

const WHITE = "#f4f6f8";
const TILT = -0.32;

type Props = {
  layout: SpaceLayout;
  title: string;
  subtitle: string;
  accent: string;
  footerLeft?: string;
  footerRight?: string;
};

function SignFace({
  title,
  subtitle,
  footerLeft,
  footerRight,
  plateW,
  blueH,
  titleColor,
  subtitleColor,
  z,
}: {
  title: string;
  subtitle: string;
  footerLeft: string;
  footerRight: string;
  plateW: number;
  blueH: number;
  titleColor: string;
  subtitleColor: string;
  z: number;
}) {
  const whiteH = 0.13;
  return (
    <group position={[0, 0, z]}>
      <Text
        position={[0, whiteH / 2 + 0.035, 0]}
        font={NAME_FONT}
        fontSize={0.13}
        maxWidth={plateW * 0.94}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color={titleColor}
        overflowWrap="break-word"
        whiteSpace="normal"
      >
        {title}
      </Text>
      <Text
        position={[0, whiteH / 2 - 0.08, 0]}
        font={NAME_FONT}
        fontSize={0.052}
        maxWidth={plateW * 0.95}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color={subtitleColor}
      >
        {subtitle}
      </Text>
      <Text
        position={[-plateW * 0.4, -blueH / 2, 0]}
        font={NAME_FONT}
        fontSize={0.048}
        anchorX="left"
        anchorY="middle"
        color="#1a1a1a"
      >
        {footerLeft}
      </Text>
      <Text
        position={[plateW * 0.4, -blueH / 2, 0]}
        font={NAME_FONT}
        fontSize={0.045}
        anchorX="right"
        anchorY="middle"
        color="#1a1a1a"
      >
        {footerRight}
      </Text>
    </group>
  );
}

export function StreetSign({
  layout,
  title,
  subtitle,
  accent,
  footerLeft = "",
  footerRight = "",
}: Props) {
  const side = isSideTile(layout.yaw);
  const ox = Math.sign(layout.x || 1);
  const oz = Math.sign(layout.z || 1);
  const radial = side ? layout.width : layout.depth;
  const along = side ? layout.depth : layout.width;
  const front = radial * 0.4;

  const position: [number, number, number] = side
    ? [-ox * front, 0.2, 0]
    : [0, 0.2, -oz * front];

  const plateW = Math.min(1.65, along * 0.98);
  const blueH = 0.3;
  const whiteH = 0.13;
  const plateH = blueH + whiteH;
  const faceZ = 0.014;

  const titleColor = inkOn(accent);
  const subtitleColor =
    titleColor === "#fffef8" ? "#e8eef8" : "#3d2918";

  const faceProps = {
    title,
    subtitle,
    footerLeft,
    footerRight,
    plateW,
    blueH,
    titleColor,
    subtitleColor,
  };

  return (
    <group position={position} rotation={[0, layout.yaw, 0]}>
      <group rotation={[TILT, 0, 0]}>
        <mesh position={[0, whiteH / 2, 0]} castShadow>
          <boxGeometry args={[plateW, blueH, 0.022]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>
        <mesh position={[0, -blueH / 2, 0]} castShadow>
          <boxGeometry args={[plateW, whiteH, 0.022]} />
          <meshStandardMaterial color={WHITE} roughness={0.65} />
        </mesh>

        <SignFace {...faceProps} z={faceZ} />
        <group rotation={[0, Math.PI, 0]}>
          <SignFace {...faceProps} z={faceZ} />
        </group>

        <mesh position={[0, -plateH / 2 - 0.025, -0.05]} castShadow>
          <boxGeometry args={[plateW * 0.4, 0.035, 0.07]} />
          <meshStandardMaterial
            color="#6b6b6b"
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}

export function streetSignCopy(space: {
  name: string;
  price?: number;
  colorGroup?: string;
  kind: string;
}): {
  title: string;
  subtitle: string;
  footerLeft: string;
  footerRight: string;
} {
  const raw = space.name.replace(/^Chegada:\s*/i, "");
  const title =
    raw.length > 18
      ? raw.split(/[:–—(]/)[0]!.trim().slice(0, 18)
      : raw;
  const subtitle = raw;
  const footerLeft = space.price != null ? `$${space.price}` : `casa`;
  const footerRight = space.colorGroup
    ? space.colorGroup.replace("-", " ")
    : space.kind.replaceAll("_", " ");
  return { title, subtitle, footerLeft, footerRight };
}
