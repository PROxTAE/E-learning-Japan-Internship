"use client";

import { motion } from "framer-motion";
import { 
  Trophy, 
  TrendingUp, 
  Users,
  BookOpen,
  Brain,
  Lightbulb,
  Target,
  Microscope,
  Globe,
  BarChart3,
  Pencil,
  Zap 
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";

const EMOJI_TO_ICON: Record<string, React.ComponentType<any>> = {
  "📚": BookOpen,
  "🧠": Brain,
  "💡": Lightbulb,
  "🎯": Target,
  "🔬": Microscope,
  "🌐": Globe,
  "📊": BarChart3,
  "✏️": Pencil,
  "🏆": Trophy,
  "⚡": Zap,
};
import type { TopQuizEntry } from "@/services/dashboardApi";

interface TopQuizzesProps {
  quizzes: TopQuizEntry[];
  loading?: boolean;
}

function CompletionBar({ value, rank }: { value: number; rank: number }) {
  const rankColors = [
    "from-amber-400 to-yellow-500",
    "from-slate-400 to-gray-400",
    "from-orange-500 to-amber-600",
  ];
  const color = rank <= 3 ? rankColors[rank - 1] : "from-violet-500 to-purple-600";
  return (
    <div className="w-full h-1.5 rounded-full bg-default-100 dark:bg-default-700/30 overflow-hidden mt-1">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ delay: 0.3 + rank * 0.05, duration: 0.6, ease: "easeOut" }}
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
      />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <div className="w-7 h-7 rounded bg-default-100 dark:bg-default-700/30 animate-pulse shrink-0" />
      <div className="w-8 h-8 rounded-xl bg-default-100 dark:bg-default-700/30 animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-default-100 dark:bg-default-700/30 rounded-full animate-pulse w-3/4" />
        <div className="h-1.5 bg-default-100 dark:bg-default-700/30 rounded-full animate-pulse w-full" />
        <div className="h-2 bg-default-100 dark:bg-default-700/30 rounded-full animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function TopQuizzes({ quizzes, loading = false }: TopQuizzesProps) {
  const { t } = useLang();
  const tq = t.topQuizzes;

  const rankBadge = ["🥇", "🥈", "🥉", "4", "5"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      data-ai-context-type="leaderboard"
      data-ai-context-name="Top Quizzes"
      data-ai-context-data={JSON.stringify({ quizzes: quizzes.slice(0, 5) })}
      className="rounded-2xl border border-default-200/40 dark:border-default-700/30 bg-white dark:bg-white/5 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-default-100 dark:border-default-700/30">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <p className="font-semibold text-sm text-default-900 dark:text-default-100">{tq.title}</p>
      </div>

      {/* List */}
      <div className="divide-y divide-default-100/50 dark:divide-default-700/20">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : quizzes.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Trophy className="w-8 h-8 text-default-300 mx-auto mb-2" />
            <p className="text-sm text-default-400">{tq.empty}</p>
          </div>
        ) : (
          quizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.quizId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.07 }}
              className="px-5 py-3.5 hover:bg-default-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Rank badge */}
                <span className="w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">
                  {rankBadge[idx] ?? String(idx + 1)}
                </span>

                {/* Icon/Emoji */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${quiz.gradient}`}>
                  {(() => {
                    const MappedIcon = quiz.emoji ? EMOJI_TO_ICON[quiz.emoji] : null;
                    return MappedIcon ? (
                      <MappedIcon className="w-4 h-4 text-white/90 drop-shadow" />
                    ) : (
                      <span className="text-base">{quiz.emoji}</span>
                    );
                  })()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-xs text-default-900 dark:text-default-100 truncate leading-tight">
                      {quiz.quizTitle}
                    </p>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {quiz.completionRate}%
                    </span>
                  </div>
                  <CompletionBar value={quiz.completionRate} rank={idx + 1} />
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-default-400">
                    <span className="flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" /> {quiz.totalAttempts}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> {quiz.averageScore}% {tq.avgScore}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
