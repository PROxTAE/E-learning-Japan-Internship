"use client";

import { AnswerCellData, Question, Student } from "@/types/teacher/monitoring.types";
import { Badge } from "@heroui/react";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnswerPopover } from "./AnswerPopover";

interface AnswerCellProps {
  answer?: AnswerCellData;
  question: Question;
  student: Student;
  heatmapMode: boolean;
}

export function AnswerCell({ answer, question, student, heatmapMode }: AnswerCellProps) {
  if (!answer || answer.state === "unanswered") {
    return (
      <div className="w-10 h-10 rounded-xl bg-default-100/30 border border-dashed border-default-300 flex items-center justify-center m-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-default-300/30"></span>
      </div>
    );
  }

  if (answer.state === "answering") {
    return (
      <div className="w-10 h-10 rounded-xl bg-warning-500/10 border border-warning-500/40 flex items-center justify-center m-auto relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-warning-500/20"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-warning-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"
        />
      </div>
    );
  }

  const isCorrect = answer.state === "correct";

  const content = (
    <Badge.Anchor>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className={`w-10 h-10 rounded-xl border flex items-center justify-center m-auto cursor-pointer transition-all duration-300 relative group
          ${isCorrect
            ? "bg-success-500/10 dark:bg-success-500/10  border-gray-200 dark:border-gray-700"
            : "bg-danger-500/10 dark:bg-danger-500/10  border-gray-200 dark:border-gray-700"
          }
          ${heatmapMode && (isCorrect ? "bg-success-500 border-none shadow-lg shadow-success-500/20" : "bg-danger-500 border-none shadow-lg shadow-danger-500/20")}
        `}
      >
        <AnimatePresence mode="wait">
          {!heatmapMode && (
            <motion.div
              key={isCorrect ? "correct" : "wrong"}
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              className={isCorrect ? "text-success-600 dark:text-success-400" : "text-danger-600 dark:text-danger-400"}
            >
              {isCorrect ? (
                <Check color="#27ff24" className="w-5 h-5 stroke-[3px] drop-shadow-sm" />
              ) : (
                <X color="#ff2424" className="w-5 h-5 stroke-[3px] drop-shadow-sm" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {answer.confusionLevel !== "none" && (
        <Badge
          color={answer.confusionLevel === "high" ? "danger" : "warning"}
          size="sm"
          className="border-2 border-background"
        />
      )}
    </Badge.Anchor>
  );

  return (
    <AnswerPopover student={student} question={question} answer={answer}>
      {content}
    </AnswerPopover>
  );
}
