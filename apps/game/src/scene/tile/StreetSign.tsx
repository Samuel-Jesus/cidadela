import { useMemo } from "react";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import type { SpaceLayout } from "../layout";
import { inkOn } from "./inkOn";
import { isSideTile } from "./tileLayout";

/** Usado no preload do boot (cache HTTP da fonte das placas). */
export const STREET_SIGN_FONT =
  "https://cdn.jsdelivr.net/fontsource/fonts/fredoka@5.2.5/latin-700-normal.woff";

const WHITE = "#f4f6f8";
const TILT = -0.32;
const TEX_W = 256;
const TEX_H = 144;

const textureCache = new Map<string, CanvasTexture>();

type FaceCopy = {
  title: string;
  subtitle: string;
  footerLeft: string;
  footerRight: string;
  accent: string;
};

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = words[0]!;
  for (let i = 1; i < words.length; i++) {
    const next = `${line} ${words[i]!}`;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = words[i]!;
      if (lines.length >= maxLines) break;
    }
  }
  if (lines.length < maxLines) lines.push(line);
  if (lines.length > maxLines) {
    const last = lines[maxLines - 1]!;
    lines.length = maxLines;
    lines[maxLines - 1] =
      last.length > 2 ? `${last.slice(0, Math.max(1, last.length - 1))}…` : last;
  }
  return lines;
}

function bakeSignTexture(copy: FaceCopy): CanvasTexture {
  const key = [
    copy.title,
    copy.subtitle,
    copy.footerLeft,
    copy.footerRight,
    copy.accent,
  ].join("\0");
  const hit = textureCache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  const blueH = Math.round(TEX_H * 0.7);
  const whiteH = TEX_H - blueH;
  const titleColor = inkOn(copy.accent);
  const subtitleColor =
    titleColor === "#fffef8" ? "#e8eef8" : "#3d2918";

  ctx.fillStyle = copy.accent;
  ctx.fillRect(0, 0, TEX_W, blueH);
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, blueH, TEX_W, whiteH);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = titleColor;
  ctx.font = '700 42px "Fredoka", "Nunito", system-ui, sans-serif';
  const titleLines = wrapLines(ctx, copy.title, TEX_W * 0.9, 2);
  const titleY = blueH * 0.38;
  const titleStep = 44;
  titleLines.forEach((line, i) => {
    const y =
      titleY - ((titleLines.length - 1) * titleStep) / 2 + i * titleStep;
    ctx.fillText(line, TEX_W / 2, y);
  });

  ctx.fillStyle = subtitleColor;
  ctx.font = '600 20px "Fredoka", "Nunito", system-ui, sans-serif';
  const sub = wrapLines(ctx, copy.subtitle, TEX_W * 0.92, 1)[0]!;
  ctx.fillText(sub, TEX_W / 2, blueH * 0.78);

  ctx.fillStyle = "#1a1a1a";
  ctx.font = '700 22px "Fredoka", "Nunito", system-ui, sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(copy.footerLeft, TEX_W * 0.06, blueH + whiteH * 0.52);
  ctx.textAlign = "right";
  ctx.font = '600 18px "Fredoka", "Nunito", system-ui, sans-serif';
  ctx.fillText(copy.footerRight, TEX_W * 0.94, blueH + whiteH * 0.52);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 1;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

type Props = {
  layout: SpaceLayout;
  title: string;
  subtitle: string;
  accent: string;
  footerLeft?: string;
  footerRight?: string;
};

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
  const plateH = 0.43;
  const faceZ = 0.012;

  const map = useMemo(
    () =>
      bakeSignTexture({
        title,
        subtitle,
        footerLeft,
        footerRight,
        accent,
      }),
    [title, subtitle, footerLeft, footerRight, accent],
  );

  return (
    <group position={position} rotation={[0, layout.yaw, 0]}>
      <group rotation={[TILT, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[plateW, plateH, 0.02]} />
          <meshStandardMaterial color="#4a3426" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0, faceZ]}>
          <planeGeometry args={[plateW, plateH]} />
          <meshBasicMaterial map={map} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -faceZ]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[plateW, plateH]} />
          <meshBasicMaterial map={map} toneMapped={false} />
        </mesh>
        <mesh position={[0, -plateH / 2 - 0.025, -0.05]}>
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
