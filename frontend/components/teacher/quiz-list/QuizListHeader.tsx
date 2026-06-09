"use client";

import { motion } from "framer-motion";
import { Plus, BookOpen, Globe, FileText, Archive } from "lucide-react";
import { Button } from "@heroui/react";
import { useLang } from "@/lib/i18n/LanguageContext";

interface QuizListHeaderProps {
  stats: { total: number; published: number; draft: number; archived: number };
  onCreateQuiz: () => void;
}


export function QuizListHeader({ stats, onCreateQuiz }: QuizListHeaderProps) {
  const { t } = useLang();
  const ql = t.quizList;

  const STAT_ITEMS = [
    { key: "total",     label: ql.statTotal,     icon: BookOpen,  color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
    { key: "published", label: ql.statPublished,  icon: Globe,     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { key: "draft",     label: ql.statDrafts,     icon: FileText,  color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { key: "archived",  label: ql.statArchived,   icon: Archive,   color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-white/5" },
  ] as const;

  return (
    <div suppressHydrationWarning className="space-y-4">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {ql.pageTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-default-400 mt-0.5">
            {ql.pageSubtitle}
          </p>
        </div>
        <Button
          onPress={onCreateQuiz}
          aria-label={ql.createQuiz}
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          size="md"
        >
          <Plus className="w-4 h-4" />
          {ql.createQuiz}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_ITEMS.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur"
          >
            <div className={`p-2 rounded-xl ${item.bg}`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none">
                {stats[item.key]}
              </p>
              <p className="text-xs text-gray-500 dark:text-default-400 mt-0.5">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
