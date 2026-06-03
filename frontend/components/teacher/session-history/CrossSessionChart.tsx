"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { AggregateData } from "@/services/sessionHistoryApi";

interface CrossSessionChartProps {
  aggregate: AggregateData;
}

const SESSION_COLORS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"
];

export function CrossSessionChart({ aggregate }: CrossSessionChartProps) {
  const { t } = useLang();
  const { sessions, questionAggregate } = aggregate;

  if (!sessions.length || !questionAggregate.length) return (
    <p className="text-sm text-default-400 text-center py-8">{t.sessionHistory.noSessions}</p>
  );

  const sortedQuestions = [...questionAggregate].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {/* Avg Score Trend */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground/80">Average Score per Session</h4>
        <div className="flex items-end gap-4 h-28">
          {sessions.map((s, i) => {
            const score = s.stats?.averageScore ?? 0;
            return (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-foreground/70">{score}%</span>
                <motion.div
                  className="w-full rounded-t-lg"
                  style={{ backgroundColor: SESSION_COLORS[i % SESSION_COLORS.length] }}
                  initial={{ height: 0 }}
                  animate={{ height: `${score}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                />
                <span className="text-[9px] text-default-400 text-center leading-tight line-clamp-2">
                  {s.sessionLabel || `Session ${i + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-question correct% across sessions */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground/80">
          {t.sessionHistory.correctRate} by Question × Session
        </h4>
        <div className="space-y-3">
          {sortedQuestions.slice(0, 10).map((q, qi) => (
            <div key={q.questionId} className="space-y-1.5">
              <p className="text-xs font-semibold text-default-500 truncate">
                Q{qi + 1}: {q.questionText}
              </p>
              <div className="flex gap-2 h-6">
                {q.sessions.map((sess, si) => {
                  const pct = sess.correctPercent;
                  return (
                    <div
                      key={`${sess.sessionId}-${si}`}
                      className="flex-1 relative rounded overflow-hidden bg-default-100 dark:bg-white/10"
                      title={`${sess.sessionLabel || `Session ${si + 1}`}: ${pct}% correct`}
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded"
                        style={{ backgroundColor: SESSION_COLORS[si % SESSION_COLORS.length] + "cc" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: qi * 0.04 + si * 0.02, duration: 0.5 }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mix-blend-normal z-10">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Session color legend */}
        <div className="flex items-center gap-4 flex-wrap pt-2">
          {sessions.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SESSION_COLORS[i % SESSION_COLORS.length] }} />
              <span className="text-[9px] text-default-500">{s.sessionLabel || `Session ${i + 1}`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
