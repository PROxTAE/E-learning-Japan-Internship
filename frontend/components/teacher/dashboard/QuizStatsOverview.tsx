"use client";

import { Card } from "@heroui/react";
import { BookOpen, Globe, Users, Star } from "lucide-react";
import type { QuizStats } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";

function StatItem({ label, value, sub, icon, gradient }: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; gradient: string;
}) {
  return (
    <Card className="border border-default-200/40 dark:border-default-700/30 bg-white dark:bg-white/5 hover:shadow-lg transition-shadow duration-200">
      <Card.Content className="p-4 flex flex-row items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
          <span className="text-white">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold text-default-900 dark:text-default-100 leading-tight">{value}</p>
          <p className="text-sm font-medium text-default-600 dark:text-default-400 truncate">{label}</p>
          <p className="text-xs text-default-400">{sub}</p>
        </div>
      </Card.Content>
    </Card>
  );
}

export function QuizStatsOverview({ stats }: { stats: QuizStats }) {
  const { t } = useLang();
  const s = t.stats;

  const items = [
    { label: s.totalQuizzes, value: stats.totalQuizzes, sub: s.drafts(stats.draftQuizzes), icon: <BookOpen className="w-5 h-5" />, gradient: "from-violet-500 to-purple-700" },
    { label: s.published, value: stats.publishedQuizzes, sub: s.activeAccessible, icon: <Globe className="w-5 h-5" />, gradient: "from-emerald-500 to-teal-600" },
    { label: s.totalAttempts, value: stats.totalAttempts.toLocaleString(), sub: s.byAllStudents, icon: <Users className="w-5 h-5" />, gradient: "from-blue-500 to-cyan-600" },
    { label: s.avgScore, value: `${stats.averageScore}%`, sub: s.acrossAll, icon: <Star className="w-5 h-5" />, gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => <StatItem key={item.label} {...item} />)}
    </div>
  );
}
