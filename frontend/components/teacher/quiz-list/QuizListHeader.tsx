"use client";

import { motion } from "framer-motion";
import { Plus, BookOpen, Globe, FileText, Archive } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";

interface QuizListHeaderProps {
  stats: { total: number; published: number; draft: number; archived: number };
  onCreateQuiz: () => void;
}

export function QuizListHeader({ stats, onCreateQuiz }: QuizListHeaderProps) {
  const { t } = useLang();
  const ql = t.quizList;

  const STAT_ITEMS = [
    { key: "total",     label: ql.statTotal,     icon: BookOpen, accentBg: "bg-[var(--theme-primary)]",   accentText: "text-black" },
    { key: "published", label: ql.statPublished,  icon: Globe,    accentBg: "bg-[var(--theme-secondary)]", accentText: "text-black" },
    { key: "draft",     label: ql.statDrafts,     icon: FileText, accentBg: "bg-[#FF6EB4]",               accentText: "text-black" },
    { key: "archived",  label: ql.statArchived,   icon: Archive,  accentBg: "bg-[var(--theme-accent)]",   accentText: "text-white" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--theme-text-main)] tracking-tight uppercase">
            {ql.pageTitle}
          </h1>
          <p className="text-sm text-[var(--theme-text-muted)] mt-0.5 font-medium">
            {ql.pageSubtitle}
          </p>
        </div>
        <button
          onClick={onCreateQuiz}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full
            bg-[var(--theme-primary)] text-black font-black text-sm uppercase tracking-wider
            border-2 border-[var(--theme-text-main)]
            shadow-[3px_3px_0px_var(--theme-text-main)]
            hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_var(--theme-text-main)]
            active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--theme-text-main)]
            transition-all duration-100 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          {ql.createQuiz}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_ITEMS.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-3 rounded-2xl
              border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
              bg-[var(--theme-card-bg)]
              shadow-[3px_3px_0px_var(--theme-text-main)] dark:shadow-[3px_3px_0px_var(--theme-border)]"
          >
            <div className={`p-2 rounded-xl border border-black/20 shrink-0 ${item.accentBg}`}>
              <item.icon className={`w-4 h-4 ${item.accentText}`} />
            </div>
            <div>
              <p className="text-xl font-black text-[var(--theme-text-main)] leading-none">
                {stats[item.key]}
              </p>
              <p className="text-xs text-[var(--theme-text-muted)] mt-0.5 font-semibold">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
