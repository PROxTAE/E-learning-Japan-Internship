"use client";

import { Card, Chip } from "@heroui/react";
import { BookOpen, Users } from "lucide-react";
import type { QuizCategory } from "@/types/teacher/quiz.types";

interface QuizCategoryCardProps {
  category: QuizCategory;
  isActive: boolean;
  onSelect: (id: string | null) => void;
}

export function QuizCategoryCard({ category, isActive, onSelect }: QuizCategoryCardProps) {
  return (
    <div
      onClick={() => onSelect(isActive ? null : category.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(isActive ? null : category.id)}
      className={`
        border shrink-0 w-52 transition-all duration-200 cursor-pointer rounded-xl
        ${isActive
          ? "border-violet-500 shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/30"
          : "border-default-200/40 dark:border-default-700/30 hover:border-violet-300 dark:hover:border-violet-700"
        }
        bg-white dark:bg-white/5
      `}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-xl shadow-md shrink-0`}
          >
            {category.icon}
          </div>
          {isActive && (
            <Chip size="sm" color="accent" className="text-xs">
              Active
            </Chip>
          )}
        </div>
        {/* Name + description */}
        <div>
          <p className="font-semibold text-sm text-default-900 dark:text-default-100">{category.name}</p>
          <p className="text-xs text-default-400 mt-0.5 line-clamp-1">{category.description}</p>
        </div>
        {/* Stats row */}
        <div className="flex items-center gap-3 pt-1 border-t border-default-100 dark:border-default-700/30">
          <span className="flex items-center gap-1 text-xs text-default-500">
            <BookOpen className="w-3 h-3" />
            {category.quizCount} quizzes
          </span>
          <span className="flex items-center gap-1 text-xs text-default-500">
            <Users className="w-3 h-3" />
            {category.totalStudents}
          </span>
        </div>
      </div>
    </div>
  );
}
