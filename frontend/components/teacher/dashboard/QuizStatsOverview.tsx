"use client";

import { motion } from "framer-motion";
import { BookOpen, Globe, Users, Star, TrendingUp, TrendingDown } from "lucide-react";
import type { QuizStats } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
  trend?: number; // positive = up, negative = down, 0/undefined = neutral
  delay?: number;
}

function StatCard({ label, value, sub, icon, gradient, shadowColor, trend, delay = 0 }: StatCardProps) {
  const hasTrend = trend !== undefined;
  const isUp = (trend ?? 0) > 0;
  const isDown = (trend ?? 0) < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="relative overflow-hidden rounded-2xl border border-default-200/40 dark:border-default-700/30 bg-white dark:bg-white/5 hover:shadow-xl transition-shadow duration-300 p-4"
    >
      {/* Decorative bg gradient orb */}
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl pointer-events-none`}
      />

      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg ${shadowColor}`}
        >
          <span className="text-white">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-extrabold text-default-900 dark:text-default-100 leading-tight tabular-nums">
            {value}
          </p>
          <p className="text-sm font-semibold text-default-600 dark:text-default-400 mt-0.5 truncate">
            {label}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-xs text-default-400 truncate">{sub}</p>
            {hasTrend && (
              <span
                className={`flex items-center gap-0.5 text-[10px] font-bold ml-auto shrink-0 ${
                  isUp ? "text-emerald-500" : isDown ? "text-red-500" : "text-default-400"
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : null}
                {isUp ? "+" : ""}{Math.abs(trend ?? 0)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function QuizStatsOverview({ stats, loading = false }: { stats: QuizStats; loading?: boolean }) {
  const { t } = useLang();
  const s = t.stats;

  const items: StatCardProps[] = [
    {
      label: s.totalQuizzes,
      value: loading ? "—" : stats.totalQuizzes,
      sub: loading ? "" : s.drafts(stats.draftQuizzes),
      icon: <BookOpen className="w-5 h-5" />,
      gradient: "from-violet-500 to-purple-700",
      shadowColor: "shadow-violet-500/30",
      trend: loading ? undefined : 12,
      delay: 0,
    },
    {
      label: s.published,
      value: loading ? "—" : stats.publishedQuizzes,
      sub: loading ? "" : s.activeAccessible,
      icon: <Globe className="w-5 h-5" />,
      gradient: "from-emerald-500 to-teal-600",
      shadowColor: "shadow-emerald-500/30",
      trend: loading ? undefined : 5,
      delay: 0.07,
    },
    {
      label: s.totalAttempts,
      value: loading ? "—" : stats.totalAttempts.toLocaleString(),
      sub: loading ? "" : s.byAllStudents,
      icon: <Users className="w-5 h-5" />,
      gradient: "from-blue-500 to-cyan-600",
      shadowColor: "shadow-blue-500/30",
      trend: loading ? undefined : 23,
      delay: 0.14,
    },
    {
      label: s.avgScore,
      value: loading ? "—" : `${stats.averageScore}%`,
      sub: loading ? "" : s.acrossAll,
      icon: <Star className="w-5 h-5" />,
      gradient: "from-amber-500 to-orange-500",
      shadowColor: "shadow-amber-500/30",
      trend: loading ? undefined : -3,
      delay: 0.21,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
