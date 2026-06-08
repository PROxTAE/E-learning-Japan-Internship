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
  chipColor: string;
  iconBg: string;
  trend?: number;
  delay?: number;
}

function StatCard({ label, value, sub, icon, chipColor, iconBg, trend, delay = 0 }: StatCardProps) {
  const hasTrend = trend !== undefined;
  const isUp = (trend ?? 0) > 0;
  const isDown = (trend ?? 0) < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className="relative overflow-hidden rounded-2xl
        border-2 border-[var(--theme-border)] dark:border-[var(--theme-primary)]/30
        bg-[var(--theme-card-bg)] dark:bg-[var(--theme-card-bg)]
        shadow-[3px_3px_0px_var(--theme-border)] dark:shadow-[3px_3px_0px_var(--theme-primary)]
        hover:shadow-[5px_5px_0px_var(--theme-border)] dark:hover:shadow-[5px_5px_0px_var(--theme-primary)]
        transition-shadow duration-200 p-4 group"
    >
      {/* Corner accent dot */}
      <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${chipColor} border border-black/20`} />

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(var(--theme-primary) 1px, transparent 1px), linear-gradient(90deg, var(--theme-primary) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="relative z-10 flex items-start gap-3">
        {/* Icon chip */}
        <div className={`w-11 h-11 rounded-xl ${iconBg} border-2 border-black/20 dark:border-black/40 flex items-center justify-center shrink-0`}>
          <span className="text-black">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black text-[var(--theme-text-main)] leading-tight tabular-nums">
            {value}
          </p>
          <p className="text-xs font-bold text-[var(--theme-text-muted)] mt-0.5 truncate uppercase tracking-wide">
            {label}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[10px] text-[var(--theme-text-muted)] truncate">{sub}</p>
            {hasTrend && (
              <span
                className={`flex items-center gap-0.5 text-[10px] font-black ml-auto shrink-0 ${
                  isUp ? "text-[var(--theme-secondary)]" : isDown ? "text-red-500 dark:text-red-400" : "text-[var(--theme-text-muted)]"
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
      chipColor: "bg-[var(--theme-primary)]",
      iconBg: "bg-[var(--theme-primary)]",
      trend: loading ? undefined : 12,
      delay: 0,
    },
    {
      label: s.published,
      value: loading ? "—" : stats.publishedQuizzes,
      sub: loading ? "" : s.activeAccessible,
      icon: <Globe className="w-5 h-5" />,
      chipColor: "bg-[var(--theme-secondary)]",
      iconBg: "bg-[var(--theme-secondary)]",
      trend: loading ? undefined : 5,
      delay: 0.07,
    },
    {
      label: s.totalAttempts,
      value: loading ? "—" : stats.totalAttempts.toLocaleString(),
      sub: loading ? "" : s.byAllStudents,
      icon: <Users className="w-5 h-5" />,
      chipColor: "bg-[#FF6EB4]",
      iconBg: "bg-[#FF6EB4]",
      trend: loading ? undefined : 23,
      delay: 0.14,
    },
    {
      label: s.avgScore,
      value: loading ? "—" : `${stats.averageScore}%`,
      sub: loading ? "" : s.acrossAll,
      icon: <Star className="w-5 h-5" />,
      chipColor: "bg-[var(--theme-accent)]",
      iconBg: "bg-[var(--theme-accent)]",
      trend: loading ? undefined : -3,
      delay: 0.21,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      data-ai-context-type="stats"
      data-ai-context-name="Quiz Stats Overview"
      data-ai-context-data={JSON.stringify(stats)}
    >
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
