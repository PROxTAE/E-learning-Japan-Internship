"use client";

import { useState } from "react";
import { Student } from "@/types/teacher/monitoring.types";
import { Avatar, ProgressBar, Button, Tooltip } from "@heroui/react";
import { motion } from "framer-motion";
import { Wifi, WifiOff, RotateCcw, UserX } from "lucide-react";
import { useMonitoringStore } from "@/store/monitoringStore";
import { useLang } from "@/lib/i18n/LanguageContext";
import { ConfirmModal } from "./ConfirmModal";
import { useParams } from "next/navigation";
import { monitoringApi } from "@/services/monitoringApi";

interface StudentRowProps {
  student: Student;
}

export function StudentRow({ student }: StudentRowProps) {
  const isOnline = student.isOnline;
  const { t } = useLang();
  const params = useParams();
  const quizId = params.quizId as string;
  const sessionId = `quiz-session-${quizId}`;
  
  const { answers, questions } = useMonitoringStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRemove, setShowRemove] = useState(false);

  // Find and format student's answers for AI context
  const studentAnswers = answers.filter((a) => a.studentId === student.id);
  const enrichedAnswers = studentAnswers
    .map((ans) => {
      const question = questions.find((q) => q.id === ans.questionId);
      return {
        questionNumber: question ? question.number : undefined,
        questionTitle: question ? question.title : "Unknown Question",
        difficulty: question ? question.difficulty : undefined,
        status: ans.state, // "correct" | "wrong" | "unanswered" | "answering"
        studentAnswerText: ans.finalAnswerText || "No answer",
        isCorrect: ans.isCorrect,
        responseTimeSeconds: ans.responseTime,
        confusionLevel: ans.confusionLevel, // "none" | "low" | "high"
        answerChangesCount: ans.history ? ans.history.length : 0,
      };
    })
    .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

  const aiContextData = {
    ...student,
    detailedAnswers: enrichedAnswers,
  };

  return (
    <div
      data-ai-context-type="student"
      data-ai-context-name={student.name}
      data-ai-context-data={JSON.stringify(aiContextData)}
      className={`
        flex items-center gap-3 p-3 w-56 shrink-0 group transition-all duration-300
        ${isOnline ? "" : "opacity-50"}
      `}
    >
      {/* Avatar + online dot */}
      <div className="relative shrink-0">
        <Avatar
          size="sm"
          className={`border-2 shadow-lg transition-all duration-300 ${
            isOnline
              ? "border-emerald-400/60 shadow-emerald-400/20"
              : "border-gray-300/30 dark:border-white/10 grayscale"
          }`}
        >
          <Avatar.Image src={student.avatar} alt={student.name} />
          <Avatar.Fallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold">
            {student.name.charAt(0)}
          </Avatar.Fallback>
        </Avatar>

        {/* Animated online dot */}
        <span
          className={`
            absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm
            transition-colors duration-500 flex items-center justify-center
            ${isOnline ? "bg-emerald-500" : "bg-gray-400 dark:bg-gray-600"}
          `}
        >
          {/* Pulse ring only when online */}
          {isOnline && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          )}
        </span>
      </div>

      {/* Student info */}
      <div className="flex-1 min-w-0">
        {/* Name + status icon */}
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-bold truncate transition-colors group-hover:text-primary ${
            isOnline
              ? "text-gray-800 dark:text-foreground"
              : "text-gray-400 dark:text-default-500 line-through decoration-gray-300"
          }`}>
            {student.name}
          </p>
          {isOnline
            ? <Wifi    className="w-3 h-3 text-emerald-500 shrink-0" />
            : <WifiOff className="w-3 h-3 text-gray-400 dark:text-gray-600 shrink-0" />
          }
        </div>

        {/* Offline label OR progress + score */}
        {!isOnline ? (
          <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">
            Disconnected
          </p>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1">
              <ProgressBar
                {...{
                  size: "sm",
                  value: student.progress ?? 0,
                  className: "h-1",
                  color: student.progress === 100 ? "success" : "primary",
                  classNames: { indicator: "bg-gradient-to-r from-violet-500 to-fuchsia-500" }
                } as any}
              />
            </div>
            <span className="text-[9px] font-bold text-gray-500 dark:text-default-400 tabular-nums">
              {student.score}%
            </span>
          </div>
        )}
      </div>

      {/* Hover-activated action buttons */}
      <div className="flex items-center shrink-0">
        {isOnline && (
          // @ts-expect-error HeroUI Tooltip types issue
          <Tooltip content={t.monitoring.controls.resetStudent}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 hover:bg-default-100 dark:hover:bg-white/5 transition-opacity rounded-full min-w-0 w-8 h-8 flex items-center justify-center shrink-0 ml-1"
              onPress={() => setShowConfirm(true)}
            >
              <RotateCcw className="w-3.5 h-3.5 text-danger animate-spin-slow hover:rotate-180 transition-transform duration-500" />
            </Button>
          </Tooltip>
        )}

        {/* Remove-from-session button (available for any row, incl. duplicates / ghosts) */}
        {/* @ts-expect-error HeroUI Tooltip types issue */}
        <Tooltip content={t.monitoring.controls.removeStudent}>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 hover:bg-danger/10 transition-opacity rounded-full min-w-0 w-8 h-8 flex items-center justify-center shrink-0"
            onPress={() => setShowRemove(true)}
          >
            <UserX className="w-3.5 h-3.5 text-danger" />
          </Button>
        </Tooltip>
      </div>

      {/* HeroUI Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          monitoringApi.controlSession(sessionId, "reset_student", { studentId: student.id });
          setShowConfirm(false);
        }}
        title={t.monitoring.controls.resetStudent}
        message={t.monitoring.controls.resetConfirm}
        confirmText="Reset"
        cancelText={t.modal.cancel}
        isDanger={true}
      />

      {/* Remove-from-session confirm modal */}
      <ConfirmModal
        isOpen={showRemove}
        onClose={() => setShowRemove(false)}
        onConfirm={() => {
          monitoringApi.controlSession(sessionId, "remove_student", { studentId: student.id });
          setShowRemove(false);
        }}
        title={`${t.monitoring.controls.removeStudent} — ${student.name}`}
        message={t.monitoring.controls.removeConfirm}
        confirmText={t.monitoring.controls.removeText}
        cancelText={t.modal.cancel}
        isDanger={true}
      />
    </div>
  );
}
