"use client";

import { motion } from "framer-motion";
import { Calendar, Users, CheckCircle2, Trash2 } from "lucide-react";
import type { SessionSummary } from "@/services/sessionHistoryApi";
import { useLang } from "@/lib/i18n/LanguageContext";

interface SessionCardProps {
  session: SessionSummary;
  index: number;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
}

function formatDate(dateStr: string, lang: string): string {
  try {
    return new Date(dateStr).toLocaleString(
      lang === "th" ? "th-TH" : lang === "ja" ? "ja-JP" : "en-US",
      { dateStyle: "medium", timeStyle: "short" }
    );
  } catch { return dateStr; }
}

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-indigo-500 to-blue-600",
];

export function SessionCard({ session, index, onView, onDelete }: SessionCardProps) {
  const { t, lang } = useLang();
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const label      = session.sessionLabel || t.sessionHistory.unlabeled;
  const score      = session.stats?.averageScore ?? 0;
  const completion = session.stats?.completionPercentage ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView(session.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView(session.id);
          }
        }}
        className="w-full text-left group relative overflow-hidden rounded-2xl border border-default-200/60 dark:border-white/10 hover:border-violet-400/50 dark:hover:border-violet-500/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 bg-background dark:bg-white/[0.03] backdrop-blur-sm cursor-pointer select-none"
        data-ai-context-type="session-summary"
        data-ai-context-name={`สรุปผลเซสชัน ${label}`}
        data-ai-context-data={JSON.stringify({
          id: session.id,
          label,
          endedAt: session.endedAt || session.startedAt,
          studentCount: session.studentCount,
          averageScore: score,
          completionPercentage: completion
        })}
      >
        {/* Top gradient strip */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

        <div className="p-5 pt-6">
          {/* Label & Score */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold text-default-400 uppercase tracking-wider mb-1">
                Session {index + 1}
              </p>
              <h3 className="text-base font-bold text-foreground group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors leading-tight">
                {label}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold bg-gradient-to-r ${gradient} text-white px-2.5 py-1 rounded-lg shadow-sm`}>
                {score}%
              </span>
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="p-1.5 rounded-lg text-default-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label="Delete Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-default-500">
              <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <span><strong className="text-foreground">{session.studentCount}</strong> {t.sessionHistory.students}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-default-500">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span><strong className="text-foreground">{completion}%</strong> done</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-default-500 col-span-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span>{formatDate(session.endedAt || session.startedAt, lang)}</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-default-400">
              <span>{t.sessionHistory.avgScore}</span>
              <span>{score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-default-100 dark:bg-white/10 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ delay: index * 0.07 + 0.3, duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
