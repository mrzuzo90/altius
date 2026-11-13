"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useCallback,
  useMemo,
} from "react";
import { type Language, t as translateFn } from "@/lib/i18n/translations";
import { domTranslator } from "@/lib/i18n/dom-translator";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "altius-lang";

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "es";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

function subscribeLanguage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("altius:language-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("altius:language-change", callback);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribeLanguage, getLanguageSnapshot, () => "es" as Language);

  const setLang = useCallback((newLang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
    domTranslator.applyLanguage(newLang);
    window.dispatchEvent(new Event("altius:language-change"));
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "es" ? "en" : "es");
  }, [lang, setLang]);

  // Aplicar traducción inmediatamente al montar o cambiar
  useEffect(() => {
    domTranslator.applyLanguage(lang);
  }, [lang]);

  const t = useCallback(
    (key: string) => {
      return translateFn(key, lang);
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
    }),
    [lang, setLang, toggleLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
