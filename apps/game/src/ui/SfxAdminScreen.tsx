import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ensureSfxOverridesReady,
  playSfxSlotPreview,
  slotHasPlayableAudio,
  stopSfxPreview,
  unlockAudio,
} from "../audio/sfx";
import {
  SFX_SLOTS,
  type SfxCategory,
  type SfxSlot,
} from "../audio/sfxCatalog";
import {
  clearAllSfxOverrides,
  clearSfxOverride,
  getOverrideMeta,
  hasOverride,
  setSfxOverride,
  subscribeSfxOverrides,
  type SfxOverrideMeta,
} from "../audio/sfxOverrides";

type Props = {
  onBack: () => void;
};

const CATEGORIES: SfxCategory[] = ["game", "dice", "carnaval", "ui"];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function SlotRow({
  slot,
  meta,
  onChanged,
}: {
  slot: SfxSlot;
  meta: SfxOverrideMeta | null;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customized = Boolean(meta);
  const hasDefault = Boolean(slot.defaultUrl.trim());
  const playable = slotHasPlayableAudio(slot);

  const statusKey = customized
    ? "custom"
    : hasDefault
      ? "default"
      : "empty";
  const statusClass =
    statusKey === "custom"
      ? "bg-[#86efac] text-[#14532d]"
      : statusKey === "default"
        ? "bg-[#fef08a] text-[#854d0e]"
        : "bg-[#e7e5e4] text-[#57534e]";

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    void setSfxOverride(slot.id, file)
      .then(() => {
        onChanged();
        unlockAudio();
        playSfxSlotPreview(slot);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : t("sfxAdmin.uploadFail"));
      })
      .finally(() => setBusy(false));
  };

  const onReset = () => {
    setBusy(true);
    setError(null);
    void clearSfxOverride(slot.id)
      .then(() => onChanged())
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : t("sfxAdmin.resetFail"));
      })
      .finally(() => setBusy(false));
  };

  return (
    <li className="rounded-xl border-2 border-[#5c3d2e] bg-white/80 p-3 shadow-[2px_2px_0_rgba(92,61,46,0.2)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-[family-name:var(--font-game)] text-base font-bold text-[#9a3412]">
              {slot.label}
            </h3>
            <span
              className={`rounded-md border border-[#5c3d2e] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${statusClass}`}
            >
              {t(`sfxAdmin.${statusKey}`)}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-[#6b5344]">
            {slot.description}
          </p>
          <p className="mt-1 truncate font-mono text-[10px] text-[#8a6a4e]">
            {customized && meta
              ? `${meta.fileName} · ${formatBytes(meta.size)}`
              : hasDefault
                ? slot.defaultUrl
                : t("sfxAdmin.noFileYet")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="deed-btn deed-btn--amber px-2.5 py-1.5 text-xs"
            disabled={busy || !playable}
            title={!playable ? t("sfxAdmin.needUpload") : undefined}
            onClick={() => {
              unlockAudio();
              if (!playSfxSlotPreview(slot)) {
                setError(t("sfxAdmin.needUpload"));
              }
            }}
          >
            {t("sfxAdmin.play")}
          </button>
          <button
            type="button"
            className="deed-btn deed-btn--soft px-2.5 py-1.5 text-xs"
            disabled={busy}
            onClick={() => stopSfxPreview()}
          >
            {t("sfxAdmin.stop")}
          </button>
          <label
            htmlFor={inputId}
            className={`deed-btn deed-btn--mint inline-flex cursor-pointer items-center px-2.5 py-1.5 text-xs ${
              busy ? "pointer-events-none opacity-45" : ""
            }`}
          >
            {t("sfxAdmin.upload")}
            <input
              id={inputId}
              type="file"
              accept="audio/*,.ogg,.mp3,.wav,.aiff,.aif,.webm,.m4a"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                onUpload(f);
              }}
            />
          </label>
          {customized ? (
            <button
              type="button"
              className="deed-btn deed-btn--warn px-2.5 py-1.5 text-xs"
              disabled={busy}
              onClick={onReset}
            >
              {t("sfxAdmin.reset")}
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="mt-2 rounded-lg border-2 border-[#5c3d2e] bg-[#fecaca] px-2 py-1 text-[11px] font-bold text-[#7f1d1d]">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function SfxAdminScreen({ onBack }: Props) {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    void ensureSfxOverridesReady().then(() => setReady(true));
    return subscribeSfxOverrides(() => setTick((n) => n + 1));
  }, []);

  useEffect(() => () => stopSfxPreview(), []);

  const customCount = SFX_SLOTS.filter((s) => hasOverride(s.id)).length;

  return (
    <div className="lobby relative flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto">
      <div className="lobby__bg" aria-hidden />
      <div className="lobby-shell relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:py-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="hud-kicker text-[#5eead4]">{t("sfxAdmin.kicker")}</p>
            <h1 className="font-[family-name:var(--font-game)] text-4xl font-bold leading-none text-[#fff7ed] sm:text-5xl">
              {t("sfxAdmin.title")}
            </h1>
            <p className="mt-2 max-w-lg text-sm font-semibold text-[#ffd7a8]">
              {t("sfxAdmin.blurb")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="deed-btn deed-btn--soft px-3 py-2 text-sm"
              onClick={() => {
                stopSfxPreview();
                onBack();
              }}
            >
              {t("sfxAdmin.back")}
            </button>
            {customCount > 0 ? (
              <button
                type="button"
                className="deed-btn deed-btn--warn px-3 py-2 text-sm"
                disabled={resetBusy}
                onClick={() => {
                  setResetBusy(true);
                  void clearAllSfxOverrides()
                    .then(() => setTick((n) => n + 1))
                    .finally(() => setResetBusy(false));
                }}
              >
                {t("sfxAdmin.resetAll")}
              </button>
            ) : null}
          </div>
        </header>

        <p className="rounded-xl border-2 border-[#5c3d2e] bg-[#fff7ed] px-3 py-2 text-xs font-bold text-[#5c3d2e] shadow-[3px_3px_0_rgba(92,61,46,0.25)]">
          {t("sfxAdmin.hintLocal")}{" "}
          <span className="text-[#9a3412]">
            {t("sfxAdmin.customCount", { n: customCount })}
          </span>
        </p>

        {!ready ? (
          <p className="text-sm font-bold text-[#ffd7a8]">{t("sfxAdmin.loading")}</p>
        ) : (
          CATEGORIES.map((cat) => {
            const slots = SFX_SLOTS.filter((s) => s.category === cat);
            if (slots.length === 0) return null;
            return (
              <section key={cat} className="deed-sheet overflow-hidden">
                <header
                  className="deed-sheet__band"
                  style={{ backgroundColor: "#e9a46c" }}
                >
                  <p className="deed-sheet__kicker deed-sheet__kicker--dark">
                    {t(`sfxAdmin.cat.${cat}`)}
                  </p>
                  <h2 className="deed-sheet__title deed-sheet__title--dark text-lg">
                    {t(`sfxAdmin.cat.${cat}`)}
                  </h2>
                </header>
                <ul className="m-0 list-none space-y-2.5 p-3">
                  {slots.map((slot) => (
                    <SlotRow
                      key={`${slot.id}:${tick}`}
                      slot={slot}
                      meta={getOverrideMeta(slot.id)}
                      onChanged={() => setTick((n) => n + 1)}
                    />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
