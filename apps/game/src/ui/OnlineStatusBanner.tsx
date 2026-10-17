import { useTranslation } from "react-i18next";

export type OnlineSyncStatus =
  | "live"
  | "syncing"
  | "error"
  | "hostAway"
  | "reconnecting";

type Props = {
  status: OnlineSyncStatus;
  isHost: boolean;
};

export function OnlineStatusBanner({ status, isHost }: Props) {
  const { t } = useTranslation();
  if (status === "live") return null;

  const message =
    status === "hostAway"
      ? t("online.hostAway")
      : status === "syncing"
        ? t("online.syncing")
        : status === "reconnecting"
          ? t("online.reconnecting")
          : t("online.syncError");

  const tone =
    status === "hostAway" || status === "error"
      ? "border-[#5c3d2e] bg-[#fecaca] text-[#7f1d1d]"
      : "border-[#5c3d2e] bg-[#fef08a] text-[#92400e]";

  return (
    <div
      className={`pointer-events-none absolute start-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-30 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-xl border-2 px-3 py-1.5 text-center text-[11px] font-bold shadow-[3px_3px_0_rgba(92,61,46,0.3)] rtl:translate-x-1/2 ${tone}`}
      role="status"
    >
      {message}
      {isHost && status === "error" ? (
        <span className="mt-0.5 block text-[10px] font-semibold opacity-80">
          {t("online.hostRetryHint")}
        </span>
      ) : null}
    </div>
  );
}
