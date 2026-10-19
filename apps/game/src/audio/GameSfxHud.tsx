import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CameraMode } from "../scene/BoardCamera";
import { CameraModeToggle } from "../ui/CameraModeToggle";
import {
  getSfxVolume,
  isSfxMuted,
  setSfxVolume,
  toggleSfxMuted,
  unlockAudio,
} from "./sfx";

type Props = {
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
};

export function GameSfxHud({ cameraMode, onCameraModeChange }: Props) {
  const { t } = useTranslation();
  const [muted, setMuted] = useState(() => isSfxMuted());
  const [volume, setVolume] = useState(() => getSfxVolume());

  return (
    <div
      className="game-sfx-hud pointer-events-auto absolute z-20 flex flex-wrap items-center gap-2"
      style={{
        top: "max(0.75rem, env(safe-area-inset-top, 0px))",
        insetInlineStart: "max(0.75rem, env(safe-area-inset-left, 0px))",
      }}
    >
      <CameraModeToggle mode={cameraMode} onChange={onCameraModeChange} />
      <button
        type="button"
        className={`sfx-mute ${muted ? "sfx-mute--off" : ""}`.trim()}
        aria-pressed={muted}
        aria-label={muted ? t("hud.sfxUnmute") : t("hud.sfxMute")}
        title={muted ? t("hud.sfxUnmute") : t("hud.sfxMute")}
        onClick={() => {
          unlockAudio();
          setMuted(toggleSfxMuted());
        }}
      >
        {muted ? t("hud.sfxOff") : t("hud.sfxOn")}
      </button>
      <input
        type="range"
        className="game-sfx-hud__slider"
        min={0}
        max={100}
        step={5}
        value={Math.round(volume * 100)}
        disabled={muted}
        aria-label={t("hud.sfxVolume")}
        title={t("hud.sfxVolume")}
        onPointerDown={() => unlockAudio()}
        onChange={(e) => {
          unlockAudio();
          const next = Number(e.target.value) / 100;
          setSfxVolume(next);
          setVolume(next);
          if (next > 0 && isSfxMuted()) {
            setMuted(toggleSfxMuted());
          }
        }}
      />
    </div>
  );
}
