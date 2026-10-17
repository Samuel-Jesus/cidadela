import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

export const LOCALES = ["pt-BR", "en", "ar"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "pt-BR": "Português",
  en: "English",
  ar: "العربية",
};

/** Bandeira do país (PNG em /public/flags). */
export const LOCALE_FLAG_SRC: Record<AppLocale, string> = {
  "pt-BR": "/flags/br.png",
  en: "/flags/us.png",
  ar: "/flags/sa.png",
};

const STORAGE_KEY = "cidadela.locale";

function readStoredLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (LOCALES as readonly string[]).includes(raw)) {
      return raw as AppLocale;
    }
  } catch {
    /* ignore */
  }
  return "pt-BR";
}

export function applyDocumentLocale(locale: string) {
  const lang = locale === "pt-BR" ? "pt-BR" : locale;
  document.documentElement.lang = lang;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

void i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: readStoredLocale(),
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentLocale(i18n.language);

i18n.on("languageChanged", (lng) => {
  applyDocumentLocale(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
});

export default i18n;
