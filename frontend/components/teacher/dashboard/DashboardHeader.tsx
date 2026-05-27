"use client";

import { ChevronDown, LayoutGrid, List, SlidersHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export function DashboardHeader({
  totalQuizzes,
  viewMode,
  onViewChange,
  filterPeriod,
  onFilterPeriodChange,
  onCreateQuiz,
}: DashboardHeaderProps) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const { t } = useLang();
  const periods = t.header.periods;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-default-900 dark:text-default-100">{t.header.title}</h2>
        <p className="text-sm text-default-400 mt-0.5">{t.header.subtitle(totalQuizzes)}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Period Filter */}
        <div className="relative">
          <button
            onClick={() => setPeriodOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-default-200/50 dark:border-default-700/30 text-default-600 dark:text-default-400 bg-white dark:bg-white/5 hover:bg-default-50 dark:hover:bg-default-50/10 transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {filterPeriod}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${periodOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {periodOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-[#1a1a2e] border border-default-200/50 dark:border-default-700/30 rounded-xl shadow-xl z-20 overflow-hidden py-1"
                >
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => { onFilterPeriodChange(p); setPeriodOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        filterPeriod === p
                          ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 font-semibold"
                          : "text-default-600 dark:text-default-400 hover:bg-default-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl border border-default-200/50 dark:border-default-700/30 overflow-hidden bg-white dark:bg-white/5 shadow-sm">
          <button
            onClick={() => onViewChange("grid")}
            className={`p-2 transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-inner"
                : "text-default-400 hover:bg-default-50 dark:hover:bg-default-50/10"
            }`}
            aria-label="Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={`p-2 transition-all duration-200 ${
              viewMode === "list"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-inner"
                : "text-default-400 hover:bg-default-50 dark:hover:bg-default-50/10"
            }`}
            aria-label="List"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Create button */}
        <motion.button
          onClick={onCreateQuiz}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t.header.newQuiz}
        </motion.button>
      </div>
    </div>
  );
}
