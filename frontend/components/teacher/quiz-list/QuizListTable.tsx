"use client";

import { Button } from "@heroui/react";
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

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  published: { bg: "bg-[var(--theme-secondary)]", text: "text-black" },
  draft:     { bg: "bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]", text: "text-[var(--theme-accent)]" },
  archived:  { bg: "bg-[var(--theme-text-muted)]/20 border border-[var(--theme-text-muted)]", text: "text-[var(--theme-text-muted)]" },
};

const DIFF_BADGE: Record<string, string> = {
  easy:   "bg-[var(--theme-secondary)] text-black",
  medium: "bg-[#FF6EB4] text-black",
  hard:   "bg-red-500 text-white",
};

export function QuizListTable({ quizzes, onEdit, onDelete, onShare, onMonitor, onStatusChange }: QuizListTableProps) {
  const { t } = useLang();
  const ql = t.quizList;

  return (
    <div className="rounded-2xl overflow-hidden
      border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
      bg-[var(--theme-card-bg)]
      shadow-[4px_4px_0px_var(--theme-text-main)] dark:shadow-[4px_4px_0px_var(--theme-border)]">

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3
        border-b-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
        bg-[var(--theme-primary)] ">
        <span className="text-xs font-black text-black uppercase tracking-widest">{ql.colQuiz}</span>
        <span className="text-xs font-black text-black uppercase tracking-widest text-center">{ql.colQuestions}</span>
        <span className="text-xs font-black text-black uppercase tracking-widest text-center">{ql.colDuration}</span>
        <span className="text-xs font-black text-black uppercase tracking-widest text-center">{ql.colAttempts}</span>
        <span className="text-xs font-black text-black uppercase tracking-widest text-right">{ql.colActions}</span>
      </div>

      {/* Rows */}
      <div className="divide-y-2 divide-[var(--theme-text-main)]/10 dark:divide-[var(--theme-border)]">
        {quizzes.map((quiz) => {
          const statusBadge = STATUS_BADGE[quiz.status] ?? STATUS_BADGE.draft;
          return (
            <div
              key={quiz.id}
              className="group grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4
                hover:bg-[var(--theme-bg-secondary)] transition-colors"
              data-ai-context-type="quiz"
              data-ai-context-name={quiz.title}
              data-ai-context-data={JSON.stringify(quiz)}
            >
              {/* Title + badges */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-[var(--theme-text-main)] truncate uppercase tracking-tight">{quiz.title}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-black/10 shrink-0 ${statusBadge.bg} ${statusBadge.text}`}>
                      {quiz.status}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest shrink-0 ${DIFF_BADGE[quiz.difficulty] ?? "bg-gray-200 text-black"}`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  {quiz.description && (
                    <p className="text-xs text-[var(--theme-text-muted)] truncate max-w-sm font-medium">{quiz.description}</p>
                  )}
                </div>
              </div>

              {/* Questions */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--theme-text-muted)] justify-center font-bold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="text-[var(--theme-text-main)]">
                  {(quiz as any).questionCount ?? (quiz as any).questions?.length ?? 0}
                </span>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--theme-text-muted)] justify-center font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[var(--theme-text-main)]">
                  {quiz.hasTimeLimit === false ? ql.noLimit : `${(quiz as any).duration ?? (quiz as any).durationMinutes ?? 0}m`}
                </span>
              </div>

              {/* Attempts */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--theme-text-muted)] justify-center font-bold">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[var(--theme-text-main)]">
                  {(quiz as any).totalAttempts ?? 0}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 justify-end">
                {quiz.status === "published" && (
                  <CyberTableBtn onClick={() => onMonitor(quiz)} title={ql.monitor} className="bg-[var(--theme-primary)] text-black border-[var(--theme-primary)]">
                    <Activity className="w-3.5 h-3.5" />
                  </CyberTableBtn>
                )}
                <CyberTableBtn onClick={() => onShare(quiz)} title={ql.share} className="bg-[var(--theme-secondary)] text-black border-[var(--theme-secondary)]">
                  <Share2 className="w-3.5 h-3.5" />
                </CyberTableBtn>
                <CyberTableBtn onClick={() => onEdit(quiz)} title={ql.edit} className="bg-[var(--theme-accent)] text-white border-[var(--theme-accent)]">
                  <Pencil className="w-3.5 h-3.5" />
                </CyberTableBtn>
                <CyberTableBtn onClick={() => onDelete(quiz)} title={ql.delete} className="bg-red-500 text-white border-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </CyberTableBtn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CyberTableBtn({ onClick, title, children, className }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 min-w-0 rounded-lg flex items-center justify-center
        border transition-all cursor-pointer
        hover:scale-110 hover:shadow-[1px_1px_0px_var(--theme-text-main)]
        ${className}`}
    >
      {children}
    </button>
  );
}
