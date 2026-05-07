"use client";

import { Popover, PopoverTrigger, PopoverContent, Separator } from "@heroui/react";
import { Student, Question, AnswerCellData } from "@/types/teacher/monitoring.types";
import { Clock, MousePointer2, Target, HelpCircle } from "lucide-react";
import { AnswerTimelineChart } from "./AnswerTimelineChart";
import { ConfusionBadge } from "./ConfusionBadge";
import { useLang } from "@/lib/i18n/LanguageContext";

interface AnswerPopoverProps {
  student: Student;
  question: Question;
  answer: AnswerCellData;
  children: React.ReactNode;
}

export function AnswerPopover({ student, question, answer, children }: AnswerPopoverProps) {
  const { t } = useLang();
  const changesCount = Math.max(0, answer.history.length - 1);
  const isCorrect = answer.state === "correct";

  return (
    <Popover placement="top" showArrow backdrop="blur" offset={15}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white/90 dark:bg-[#1a1a2e]/90 border border-white/20 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-default-400 font-bold">{t.monitoring.analytics.title} • {student.name}</span>
              <h4 className="text-sm font-bold text-foreground">Q{question.number}: {question.title}</h4>
            </div>
            <ConfusionBadge level={answer.confusionLevel} />
          </div>

          <Separator className="opacity-50" />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-default-100/50 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5 text-default-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase">{t.monitoring.analytics.responseTime}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{answer.responseTime}s</p>
            </div>
            <div className="bg-default-100/50 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5 text-default-400 mb-1">
                <MousePointer2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase">{t.monitoring.analytics.changes}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{changesCount} times</p>
            </div>
          </div>

          {/* Status Section */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-default-50 border border-white/5">
            <div className={`p-2 rounded-lg ${isCorrect ? "bg-success-500/20 text-success-500" : "bg-danger-500/20 text-danger-500"}`}>
              <Target className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-default-400 uppercase font-bold">{t.monitoring.analytics.accuracy}</p>
              <p className={`text-sm font-bold ${isCorrect ? "text-success-500" : "text-danger-500"}`}>
                {isCorrect ? t.monitoring.analytics.correct : t.monitoring.analytics.wrong}
              </p>
            </div>
          </div>

          {/* Timeline Chart */}
          {answer.history.length > 1 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-default-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase">{t.monitoring.analytics.evolution}</span>
              </div>
              <AnswerTimelineChart history={answer.history} question={question} />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
