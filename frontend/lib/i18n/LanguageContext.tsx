"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language, type T } from "./translations";

interface LangCtx {
  lang: Language;
  setLang: (l: Language) => void;
  t: T;
}

const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  /* Restore from localStorage on mount */
  useEffect(() => {
    const saved = localStorage.getItem("app-lang") as Language | null;
    if (saved && saved in translations) {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("app-lang", l);
    // Update html[lang] so script-specific CSS rules (line-height, word-break) apply
    document.documentElement.lang = l;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
