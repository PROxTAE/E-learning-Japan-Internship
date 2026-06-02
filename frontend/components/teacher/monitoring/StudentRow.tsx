"use client";

import { Student } from "@/types/teacher/monitoring.types";
import { Avatar, ProgressBar } from "@heroui/react";
import { motion } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
import { useMonitoringStore } from "@/store/monitoringStore";

interface StudentRowProps {
  student: Student;
}

export function StudentRow({ student }: StudentRowProps) {
  const isOnline = student.isOnline;
  const { answers, questions } = useMonitoringStore();

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
    </div>
  );
}
