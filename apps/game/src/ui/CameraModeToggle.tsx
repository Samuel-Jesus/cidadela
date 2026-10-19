import { useTranslation } from "react-i18next";
import type { CameraMode } from "../scene/BoardCamera";

type Props = {
  mode: CameraMode;
  onChange: (mode: CameraMode) => void;
};

export function CameraModeToggle({ mode, onChange }: Props) {
  const { t } = useTranslation();
  const isFollow = mode === "follow";

  return (
    <button
      type="button"
      className={`sfx-mute ${isFollow ? "" : "sfx-mute--off"}`.trim()}
      aria-pressed={isFollow}
      aria-label={isFollow ? t("hud.cameraOrbit") : t("hud.cameraFollow")}
      title={isFollow ? t("hud.cameraOrbitHint") : t("hud.cameraFollowHint")}
      onClick={() => onChange(isFollow ? "orbit" : "follow")}
    >
      {isFollow ? t("hud.cameraFollowShort") : t("hud.cameraOrbitShort")}
    </button>
  );
}
