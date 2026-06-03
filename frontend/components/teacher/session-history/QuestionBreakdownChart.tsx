"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { QuestionStat } from "@/services/sessionHistoryApi";

interface QuestionBreakdownChartProps {
  questionStats: QuestionStat[];
}

export function QuestionBreakdownChart({ questionStats = [] }: QuestionBreakdownChartProps) {
  const { t } = useLang();

  if (!questionStats || !questionStats.length) return (
    <p className="text-sm text-default-400 text-center py-8">No question data available</p>
  );

  return (
    <div className="space-y-4">
      {questionStats.sort((a, b) => a.order - b.order).map((q, i) => {
        const correctPct  = q.correctPercent ?? 0;
        const wrongPct    = 100 - correctPct;
        const isHard      = correctPct < 40;
        const isMedium    = correctPct >= 40 && correctPct < 70;

        return (
          <motion.div
            key={q.questionId}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="space-y-2 p-4 rounded-xl bg-default-50 dark:bg-white/[0.03] border border-default-200/50 dark:border-white/10"
          >
            {/* Question header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`
                  inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold
                  ${isHard ? "bg-red-100 text-red-600 dark:bg-red-900/30" : isMedium ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"}
                `}>
                  Q{i + 1}
                </span>
                <p className="text-sm font-semibold text-foreground line-clamp-2">{q.questionText}</p>
              </div>
              <span className={`
                shrink-0 text-xs font-bold px-2 py-0.5 rounded-full
                ${isHard ? "bg-red-100 text-red-600 dark:bg-red-900/30" : isMedium ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"}
              `}>
                {correctPct}% ✓
              </span>
            </div>

            {/* Correct / Wrong bar */}
            <div className="h-2.5 rounded-full bg-default-100 dark:bg-white/10 overflow-hidden flex">
              <motion.div
                className="h-full bg-emerald-500 rounded-l-full"
                initial={{ width: 0 }}
                animate={{ width: `${correctPct}%` }}
                transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
              />
              <motion.div
                className="h-full bg-red-400"
                initial={{ width: 0 }}
                animate={{ width: `${wrongPct}%` }}
                transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
              />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-[10px] text-default-400 flex-wrap">
              <span>👥 {q.answerCount} answered</span>
              <span>⏱ {q.avgResponseTime}s avg</span>
              {q.confusionCount > 0 && (
                <span className="text-amber-500 dark:text-amber-400 font-semibold">
                  ⚠️ {q.confusionCount} confused
                </span>
              )}
            </div>

            {/* Choice breakdown (compact) */}
            {q.choices && q.choices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {q.choices.map((c, ci) => (
                  <span key={ci} className="text-[10px] bg-default-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-default-500">
                    {c.choiceText || c.choiceId}: <strong className="text-foreground">{c.count}</strong>
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
