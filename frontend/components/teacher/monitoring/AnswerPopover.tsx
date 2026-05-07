"use client";

import { Popover, PopoverTrigger, PopoverContent, Separator, ScrollShadow } from "@heroui/react";
import { Student, Question, AnswerCellData } from "@/types/teacher/monitoring.types";
import { Clock, MousePointer2, Target, CheckCircle2, XCircle } from "lucide-react";
import { AnswerTimelineChart } from "./AnswerTimelineChart";
import { ConfusionBadge } from "./ConfusionBadge";
import { useLang } from "@/lib/i18n/LanguageContext";

interface AnswerPopoverProps {
  student:  Student;
  question: Question;
  answer:   AnswerCellData;
  children: React.ReactElement; // Change from ReactNode to ReactElement
}

export function AnswerPopover({ student, question, answer, children }: AnswerPopoverProps) {
  const { t } = useLang();
  const changesCount = Math.max(0, (answer.history ?? []).length - 1);
  const isCorrect    = answer.state === "correct";

  // Resolve display text for the selected choice
  const selectedChoiceText = resolveChoiceText(answer, question);
  const correctChoiceText  = question.choices.find(c => c.isCorrect)?.text ?? "—";

  return (
    <Popover placement="top" showArrow offset={15}>
      <PopoverTrigger>
        <div>{children}</div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 bg-white/95 dark:bg-[#1a1a2e]/95 border border-white/20 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <ScrollShadow className="max-h-[450px] w-full p-4 space-y-3">

          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-default-400 font-bold">
                {t.monitoring.analytics.title} · {student.name}
              </span>
              <h4 className="text-sm font-bold text-gray-900 dark:text-foreground leading-snug">
                Q{question.number}: {question.title}
              </h4>
            </div>
            <ConfusionBadge level={answer.confusionLevel} />
          </div>

          <Separator className="opacity-30" />

          {/* ── Choice selected ─────────────────────────────────── */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-default-400">
              Choices
            </p>
            {question.choices.map((choice) => {
              const isSelected = choice.id === answer.finalAnswer;
              const isRight    = choice.isCorrect;
              return (
                <div
                  key={choice.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors border ${
                    isSelected && isRight
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                      : isSelected && !isRight
                      ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                      : isRight
                      ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10"
                      : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5"
                  }`}
                >
                  {/* Indicator */}
                  {isSelected && isRight  && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {isSelected && !isRight && <XCircle      className="w-4 h-4 text-red-500     shrink-0" />}
                  {!isSelected && isRight && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
                  {!isSelected && !isRight && <span className="w-4 h-4 shrink-0 flex items-center justify-center text-gray-300 dark:text-gray-600 text-[10px] font-bold">·</span>}

                  <span className={`flex-1 font-medium ${
                    isSelected ? (isRight ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")
                               : (isRight ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400")
                  }`}>
                    {choice.text}
                  </span>

                  {isSelected && (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-white/10 text-gray-500 dark:text-gray-400 shrink-0">
                      Selected
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <Separator className="opacity-30" />

          {/* ── Stats ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox icon={<Clock className="w-3.5 h-3.5" />} label={t.monitoring.analytics.responseTime} value={`${answer.responseTime ?? 0}s`} />
            <StatBox icon={<MousePointer2 className="w-3.5 h-3.5" />} label={t.monitoring.analytics.changes} value={`${changesCount} ×`} />
          </div>

          {/* ── Accuracy ────────────────────────────────────────── */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${
            isCorrect
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
              : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
          }`}>
            <Target className={`w-4 h-4 shrink-0 ${isCorrect ? "text-emerald-500" : "text-red-500"}`} />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 dark:text-default-400 uppercase font-bold">{t.monitoring.analytics.accuracy}</p>
              <p className={`text-xs font-bold ${isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {isCorrect ? t.monitoring.analytics.correct : t.monitoring.analytics.wrong}
                {!isCorrect && correctChoiceText !== "—" && (
                  <span className="text-gray-500 dark:text-gray-500 font-normal ml-1">· Correct: {correctChoiceText}</span>
                )}
              </p>
            </div>
          </div>

          {/* ── Answer timeline (only if changed multiple times) ── */}
          {(answer.history ?? []).length > 1 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-default-400">
                {t.monitoring.analytics.evolution}
              </p>
              <AnswerTimelineChart 
                history={answer.history} 
                question={question} 
                responseTime={answer.responseTime}
              />
            </div>
          )}
        </ScrollShadow>
      </PopoverContent>
    </Popover>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function resolveChoiceText(answer: AnswerCellData, question: Question): string {
  // Prefer stored text (from backend choiceText field)
  if (answer.finalAnswerText) return answer.finalAnswerText;
  // Fall back to lookup by ID
  const choice = question.choices.find(c => c.id === answer.finalAnswer);
  return choice?.text ?? answer.finalAnswer ?? "—";
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-default-400 mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase">{label}</span>
      </div>
      <p className="text-base font-bold text-gray-800 dark:text-foreground">{value}</p>
    </div>
  );
}
