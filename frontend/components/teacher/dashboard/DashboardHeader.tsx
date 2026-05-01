"use client";

import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { QuizViewMode } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";

interface DashboardHeaderProps {
  totalQuizzes: number;
  viewMode: QuizViewMode;
  onViewChange: (mode: QuizViewMode) => void;
  filterPeriod: string;
  onFilterPeriodChange: (period: string) => void;
  onCreateQuiz: () => void;
}

export function DashboardHeader({ totalQuizzes, viewMode, onViewChange, filterPeriod, onFilterPeriodChange, onCreateQuiz }: DashboardHeaderProps) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const { t } = useLang();
  const periods = t.header.periods;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-default-900 dark:text-default-100">{t.header.title}</h1>
        <p className="text-sm text-default-400 mt-0.5">{t.header.subtitle(totalQuizzes)}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Period Filter */}
        <div className="relative">
          <button
            onClick={() => setPeriodOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-default-200/50 dark:border-default-700/30 text-default-600 dark:text-default-400 bg-white dark:bg-white/5 hover:bg-default-50 dark:hover:bg-default-50/10 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {filterPeriod}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {periodOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#1a1a2e] border border-default-200/50 dark:border-default-700/30 rounded-xl shadow-lg z-20 overflow-hidden py-1">
                {periods.map((p) => (
                  <button key={p} onClick={() => { onFilterPeriodChange(p); setPeriodOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterPeriod === p ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" : "text-default-600 dark:text-default-400 hover:bg-default-50 dark:hover:bg-white/5"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl border border-default-200/50 dark:border-default-700/30 overflow-hidden">
          <button onClick={() => onViewChange("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-violet-600 text-white" : "text-default-400 hover:bg-default-50 dark:hover:bg-default-50/10"}`} aria-label="Grid">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => onViewChange("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-violet-600 text-white" : "text-default-400 hover:bg-default-50 dark:hover:bg-default-50/10"}`} aria-label="List">
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Create */}
        <button onClick={onCreateQuiz}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all">
          {t.header.newQuiz}
        </button>
      </div>
    </div>
  );
}
