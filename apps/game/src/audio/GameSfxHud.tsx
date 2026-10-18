import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getSfxVolume,
  isSfxMuted,
  setSfxVolume,
  toggleSfxMuted,
  unlockAudio,
} from "./sfx";

export function GameSfxHud() {
  const { t } = useTranslation();
  const [muted, setMuted] = useState(() => isSfxMuted());
  const [volume, setVolume] = useState(() => getSfxVolume());

  return (
    <div
      className="game-sfx-hud pointer-events-auto absolute z-20 flex items-center gap-2"
      style={{
        top: "max(0.75rem, env(safe-area-inset-top, 0px))",
        insetInlineStart: "max(0.75rem, env(safe-area-inset-left, 0px))",
      }}
    >
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
