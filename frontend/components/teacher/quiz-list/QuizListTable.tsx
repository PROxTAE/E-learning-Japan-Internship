"use client";

import { Chip, Button } from "@heroui/react";
import { Pencil, Trash2, Share2, Activity, Clock, HelpCircle, Users } from "lucide-react";
import type { Quiz } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";

interface QuizListTableProps {
  quizzes: Quiz[];
  onEdit:         (quiz: Quiz) => void;
  onDelete:       (quiz: Quiz) => void;
  onShare:        (quiz: Quiz) => void;
  onMonitor:      (quiz: Quiz) => void;
  onStatusChange: (quiz: Quiz, status: Quiz["status"]) => void;
}

const STATUS_COLOR = { published: "success", draft: "default", archived: "warning" } as const;
const DIFF_COLOR   = { easy: "success", medium: "warning", hard: "danger" } as const;

export function QuizListTable({ quizzes, onEdit, onDelete, onShare, onMonitor, onStatusChange }: QuizListTableProps) {
  const { t } = useLang();
  const ql = t.quizList;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.03]">
        <span className="text-xs font-bold text-gray-500 dark:text-default-400 uppercase tracking-wider">{ql.colQuiz}</span>
        <span className="text-xs font-bold text-gray-500 dark:text-default-400 uppercase tracking-wider text-center">{ql.colQuestions}</span>
        <span className="text-xs font-bold text-gray-500 dark:text-default-400 uppercase tracking-wider text-center">{ql.colDuration}</span>
        <span className="text-xs font-bold text-gray-500 dark:text-default-400 uppercase tracking-wider text-center">{ql.colAttempts}</span>
        <span className="text-xs font-bold text-gray-500 dark:text-default-400 uppercase tracking-wider text-right">{ql.colActions}</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="group grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
            data-ai-context-type="quiz"
            data-ai-context-name={quiz.title}
            data-ai-context-data={JSON.stringify(quiz)}
          >
            
            {/* Title + badges */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{quiz.title}</span>
                  <Chip {...{ size: "sm", color: STATUS_COLOR[quiz.status] } as any} className="text-[10px] h-5 capitalize shrink-0">
                    {quiz.status}
                  </Chip>
                  <Chip {...{ size: "sm", color: DIFF_COLOR[quiz.difficulty], variant: "flat" } as any} className="text-[10px] h-5 capitalize shrink-0">
                    {quiz.difficulty}
                  </Chip>
                </div>
                {quiz.description && (
                  <p className="text-xs text-gray-500 dark:text-default-400 truncate max-w-sm">{quiz.description}</p>
                )}
              </div>
            </div>

            {/* Questions */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-default-400 justify-center">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="font-semibold text-gray-700 dark:text-default-300">
                {(quiz as any).questionCount ?? (quiz as any).questions?.length ?? 0}
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-default-400 justify-center">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-semibold text-gray-700 dark:text-default-300">
                {quiz.hasTimeLimit === false ? ql.noLimit : `${(quiz as any).duration ?? (quiz as any).durationMinutes ?? 0}m`}
              </span>
            </div>

            {/* Attempts */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-default-400 justify-center">
              <Users className="w-3.5 h-3.5" />
              <span className="font-semibold text-gray-700 dark:text-default-300">
                {(quiz as any).totalAttempts ?? 0}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 justify-end">
              {quiz.status === "published" && (
                <ActionBtn onClick={() => onMonitor(quiz)} title={ql.monitor} className="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10">
                  <Activity className="w-3.5 h-3.5" />
                </ActionBtn>
              )}
              <ActionBtn onClick={() => onShare(quiz)} title={ql.share} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                <Share2 className="w-3.5 h-3.5" />
              </ActionBtn>
              <ActionBtn onClick={() => onEdit(quiz)} title={ql.edit} className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                <Pencil className="w-3.5 h-3.5" />
              </ActionBtn>
              <ActionBtn onClick={() => onDelete(quiz)} title={ql.delete} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2 className="w-3.5 h-3.5" />
              </ActionBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, title, children, className }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <Button
      isIconOnly
      onClick={onClick}
      {...{ title } as any}
      className={`w-7 h-7 min-w-0 rounded-lg flex items-center justify-center transition-colors bg-transparent ${className}`}
    >
      {children}
    </Button>
  );
}
