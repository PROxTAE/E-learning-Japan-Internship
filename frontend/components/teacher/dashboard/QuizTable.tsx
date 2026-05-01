"use client";

import { Chip } from "@heroui/react";
import { Clock, HelpCircle, Pencil, Trash2, Eye } from "lucide-react";
import type { Quiz, QuizDifficulty, QuizStatus } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";

const DIFFICULTY_COLOR: Record<QuizDifficulty, "success" | "warning" | "danger"> = {
  easy: "success", medium: "warning", hard: "danger",
};
const STATUS_COLOR: Record<QuizStatus, "success" | "default" | "warning"> = {
  published: "success", draft: "default", archived: "warning",
};

interface QuizTableProps {
  quizzes: Quiz[];
  selectedId: string | null;
  onSelect: (quiz: Quiz) => void;
  onEdit: (quiz: Quiz) => void;
  onDelete: (id: string) => void;
}

export function QuizTable({ quizzes, selectedId, onSelect, onEdit, onDelete }: QuizTableProps) {
  const { t } = useLang();
  const col = t.table;

  return (
    <div className="border border-default-200/40 dark:border-default-700/30 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-default-200/40 dark:border-default-700/30 bg-default-50 dark:bg-white/5">
            {[col.title, col.category, col.status, col.difficulty, col.questions, col.avgScore, col.actions].map((c) => (
              <th key={c} className="text-left text-xs font-semibold text-default-500 uppercase tracking-wide px-4 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {quizzes.length === 0 && (
            <tr><td colSpan={7} className="text-center py-12 text-default-400 text-sm">{col.noQuizzes}</td></tr>
          )}
          {quizzes.map((quiz) => (
            <tr key={quiz.id}
              onClick={() => onSelect(quiz)}
              className={`border-b border-default-100/50 dark:border-default-700/20 last:border-0 cursor-pointer transition-colors
                ${selectedId === quiz.id ? "bg-violet-50 dark:bg-violet-900/10" : "hover:bg-default-50 dark:hover:bg-white/5"}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{quiz.emoji}</span>
                  <div>
                    <p className="font-medium text-sm text-default-900 dark:text-default-100 line-clamp-1">{quiz.title}</p>
                    <p className="text-xs text-default-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {quiz.duration}m
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-default-500">{quiz.categoryName}</td>
              <td className="px-4 py-3">
                <Chip size="sm" color={STATUS_COLOR[quiz.status]} className="text-xs">
                  {t.status[quiz.status]}
                </Chip>
              </td>
              <td className="px-4 py-3">
                <Chip size="sm" color={DIFFICULTY_COLOR[quiz.difficulty]} className="text-xs">
                  {t.difficulty[quiz.difficulty]}
                </Chip>
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1 text-sm text-default-600">
                  <HelpCircle className="w-3.5 h-3.5 text-default-400" />{quiz.questionCount}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 min-w-[80px]">
                  <div className="w-12 h-1.5 rounded-full bg-default-100 dark:bg-default-700/30 overflow-hidden">
                    <div className={`h-full rounded-full ${quiz.averageScore >= 70 ? "bg-emerald-500" : quiz.averageScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${quiz.averageScore}%` }} />
                  </div>
                  <span className="text-xs text-default-500">{quiz.averageScore}%</span>
                </div>
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button onClick={() => onSelect(quiz)} className="p-1.5 rounded-lg text-default-400 hover:text-default-600 hover:bg-default-100 dark:hover:bg-default-700/30 transition-colors" aria-label="View">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(quiz)} className="p-1.5 rounded-lg text-default-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors" aria-label="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(quiz.id)} className="p-1.5 rounded-lg text-default-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" aria-label="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
