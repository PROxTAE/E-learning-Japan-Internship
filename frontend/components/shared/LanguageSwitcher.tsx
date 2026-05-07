"use client";

import { useLang } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, type Language } from "@/lib/i18n/translations";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div className="relative">
      <button
        suppressHydrationWarning
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-default-200/50 dark:border-default-700/30 bg-default-50 dark:bg-default-50/10 text-default-700 dark:text-default-300 hover:bg-default-100 dark:hover:bg-default-50/20 transition-all text-xs font-semibold"
        aria-label="Change language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-[#1a1a2e] border border-default-200/50 dark:border-default-700/30 rounded-xl shadow-xl z-20 overflow-hidden py-1">
            {LANGUAGES.map((l) => (
              <button
                suppressHydrationWarning
                key={l.code}
                onClick={() => { setLang(l.code as Language); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${lang === l.code
                    ? "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-semibold"
                    : "text-default-600 dark:text-default-400 hover:bg-default-50 dark:hover:bg-white/5"
                  }`}
              >
                <span className="text-lg">{l.flag}</span>
                <div className="text-left">
                  <p className="text-xs font-semibold">{l.code.toUpperCase()}</p>
                  <p className="text-[10px] opacity-70">{l.nativeName}</p>
                </div>
                {lang === l.code && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
