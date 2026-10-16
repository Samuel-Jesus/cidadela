import { useState } from "react";
import { isSfxMuted, toggleSfxMuted, unlockAudio } from "./sfx";

type Props = {
  className?: string;
};

export function SfxMuteButton({ className = "" }: Props) {
  const [muted, setMuted] = useState(() => isSfxMuted());

  return (
    <button
      type="button"
      className={`sfx-mute ${muted ? "sfx-mute--off" : ""} ${className}`.trim()}
      aria-pressed={muted}
      aria-label={muted ? "Ativar sons" : "Silenciar sons"}
      title={muted ? "Ativar sons" : "Silenciar sons"}
      onClick={() => {
        unlockAudio();
        setMuted(toggleSfxMuted());
      }}
    >
      {muted ? "Som off" : "Som on"}
    </button>
  );
}
