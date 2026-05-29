"use client";

import { Chip } from "@heroui/react";
import { Clock, HelpCircle, Pencil, Trash2, Users, Share2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Quiz, QuizDifficulty, QuizStatus } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";

const DIFFICULTY_COLOR: Record<QuizDifficulty, "success" | "warning" | "danger"> = {
  easy: "success", medium: "warning", hard: "danger",
};
const STATUS_COLOR: Record<QuizStatus, "success" | "default" | "warning"> = {
  published: "success", draft: "default", archived: "warning",
};

interface QuizCardProps {
  quiz: Quiz;
  isSelected: boolean;
  onSelect: (quiz: Quiz) => void;
  onEdit: (quiz: Quiz) => void;
  onDelete: (id: string) => void;
  onShare?: (quiz: Quiz) => void;
}

export function QuizCard({ quiz, isSelected, onSelect, onEdit, onDelete, onShare }: QuizCardProps) {
  const { t } = useLang();

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(quiz)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(quiz)}
      suppressHydrationWarning
      data-ai-context-type="quiz"
      data-ai-context-name={quiz.title}
      data-ai-context-data={JSON.stringify(quiz)}
      className={`group border transition-all duration-200 overflow-hidden rounded-xl cursor-pointer
        ${isSelected
          ? "border-violet-500 shadow-xl shadow-violet-500/20 ring-2 ring-violet-500/30"
          : "border-default-200/40 dark:border-default-700/30 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg"
        } bg-white dark:bg-white/5`}
    >
      {/* Banner */}
      <div className={`h-24 bg-gradient-to-br ${quiz.gradient} flex items-center justify-center relative overflow-hidden`}>
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <span className="text-4xl relative z-10 drop-shadow-lg">{quiz.emoji}</span>

        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onShare && (
            <button
              onClick={(e) => { e.stopPropagation(); onShare(quiz); }}
              suppressHydrationWarning
              className="w-7 h-7 rounded-lg bg-black/20 backdrop-blur-sm text-white hover:bg-green-500/70 flex items-center justify-center transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(quiz); }}
            suppressHydrationWarning
            className="w-7 h-7 rounded-lg bg-black/20 backdrop-blur-sm text-white hover:bg-white/40 flex items-center justify-center transition-colors"
            aria-label={t.table.actions}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(quiz.id); }}
            suppressHydrationWarning
            className="w-7 h-7 rounded-lg bg-black/20 backdrop-blur-sm text-white hover:bg-red-500/70 flex items-center justify-center transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Score badge (if has attempts) */}
        {quiz.totalAttempts > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-lg px-2 py-0.5">
            <TrendingUp className="w-2.5 h-2.5 text-white" />
            <span className="text-[10px] font-bold text-white">{quiz.averageScore}%</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div className="flex gap-1.5 flex-wrap">
          <Chip size="sm" color={STATUS_COLOR[quiz.status]} className="text-xs h-5">
            {t.status[quiz.status]}
          </Chip>
          <Chip size="sm" color={DIFFICULTY_COLOR[quiz.difficulty]} className="text-xs h-5">
            {t.difficulty[quiz.difficulty]}
          </Chip>
        </div>

        <p className="font-semibold text-sm text-default-900 dark:text-default-100 line-clamp-2 leading-snug">
          {quiz.title}
        </p>

        <div className="flex items-center gap-3 text-xs text-default-400 pt-1.5 border-t border-default-100 dark:border-default-700/30">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />{quiz.questionCount} Qs
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{quiz.duration}m
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Users className="w-3 h-3" />{quiz.totalAttempts}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
