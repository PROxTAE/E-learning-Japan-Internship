"use client";

import { motion } from "framer-motion";
import { Plus, BookOpen, Globe, FileText, Archive } from "lucide-react";
import { Button } from "@heroui/react";

interface QuizListHeaderProps {
  stats: { total: number; published: number; draft: number; archived: number };
  onCreateQuiz: () => void;
}

const STAT_ITEMS = [
  { key: "total",     label: "Total Quizzes", icon: BookOpen,  color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
  { key: "published", label: "Published",     icon: Globe,     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { key: "draft",     label: "Drafts",        icon: FileText,  color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  { key: "archived",  label: "Archived",      icon: Archive,   color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-white/5" },
] as const;

export function QuizListHeader({ stats, onCreateQuiz }: QuizListHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            My Quiz Library
          </h1>
          <p className="text-sm text-gray-500 dark:text-default-400 mt-0.5">
            Manage, share and monitor all your quizzes
          </p>
        </div>
        <Button
          onPress={onCreateQuiz}
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          size="md"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
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
