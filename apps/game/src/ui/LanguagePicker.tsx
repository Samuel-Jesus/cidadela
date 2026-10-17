import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LOCALES,
  LOCALE_FLAG_SRC,
  LOCALE_LABELS,
  type AppLocale,
} from "../i18n";

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguagePicker({ className = "", compact = false }: Props) {
  const { i18n, t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const current = (LOCALES as readonly string[]).includes(i18n.language)
    ? (i18n.language as AppLocale)
    : "pt-BR";

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex items-center gap-1.5 ${className}`}
    >
      {compact ? null : (
        <span className="whitespace-nowrap text-xs font-bold text-[#6b5344]">
          {t("lang.label")}
        </span>
      )}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("lang.label")}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-lg border-2 border-[#5c3d2e] bg-[#fffef8] text-start text-xs font-bold text-[#5c3d2e] shadow-[2px_2px_0_rgba(92,61,46,0.2)] ${
          compact
            ? "min-w-0 gap-1.5 px-1.5 py-1"
            : "min-w-[9.5rem] px-2 py-1.5"
        }`}
      >
        <img
          src={LOCALE_FLAG_SRC[current]}
          alt=""
          width={22}
          height={16}
          className="h-4 w-[22px] shrink-0 rounded-[2px] object-cover ring-1 ring-[#5c3d2e]/35"
          decoding="async"
        />
        {compact ? null : (
          <span className="min-w-0 flex-1 truncate">
            {LOCALE_LABELS[current]}
          </span>
        )}
        <span className="text-[10px] opacity-70" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("lang.label")}
          className="absolute end-0 top-[calc(100%+4px)] z-50 m-0 min-w-full list-none overflow-hidden rounded-lg border-2 border-[#5c3d2e] bg-[#fffef8] p-0 shadow-[3px_3px_0_rgba(92,61,46,0.28)]"
        >
          {LOCALES.map((code) => {
            const selected = code === current;
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    void i18n.changeLanguage(code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-2.5 py-2 text-start text-xs font-bold ${
                    selected
                      ? "bg-[#ffd166] text-[#5c3d2e]"
                      : "text-[#5c3d2e] hover:bg-[#fff7ed]"
                  }`}
                >
                  <img
                    src={LOCALE_FLAG_SRC[code]}
                    alt=""
                    width={22}
                    height={16}
                    className="h-4 w-[22px] shrink-0 rounded-[2px] object-cover ring-1 ring-[#5c3d2e]/35"
                    decoding="async"
                  />
                  <span>{LOCALE_LABELS[code]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
