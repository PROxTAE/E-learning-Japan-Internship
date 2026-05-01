"use client";

import { useLang } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 p-1 backdrop-blur-sm">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          id={`lang-btn-${l.code}`}
          onClick={() => setLang(l.code)}
          title={l.label}
          aria-label={`Switch to ${l.label}`}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
            transition-all duration-200
            ${lang === l.code
              ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
            }
          `}
        >
          <span>{l.flag}</span>
          <span className="hidden sm:inline">{l.nativeName}</span>
        </button>
      ))}
    </div>
  );
}
