"use client";

import { Card, CardContent, CardHeader, RadioGroup, Radio, Label } from "@heroui/react";
import { QuizQuestion, QuizOption } from "../types";
import { motion } from "framer-motion";

interface QuizCardProps {
  question: QuizQuestion;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

const LABELS = ["A", "B", "C", "D"];

export function QuizCard({
  question,
  selectedOptionId,
  onSelectOption,
  onNext,
  isLastQuestion,
}: QuizCardProps) {
  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6">
      {/* ── Question Card ───────────────── */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Card className="
          w-full rounded-2xl sm:rounded-3xl shadow-2xl border-0
          bg-white dark:bg-zinc-900
        ">
          <CardHeader className="flex-col items-start px-5 sm:px-7 pt-6 sm:pt-8 pb-1 gap-1">
            {/* Category pill */}
            <span className="
              text-[11px] sm:text-xs font-bold uppercase tracking-widest
              text-violet-400 dark:text-violet-300
            ">
              General Knowledge
            </span>
            {/* Question text — responsive font */}
            <h2 className="
              text-lg sm:text-xl md:text-2xl font-extrabold leading-snug
              text-zinc-900 dark:text-white
            ">
              {question.question}
            </h2>
          </CardHeader>

          <CardContent className="px-5 sm:px-7 pb-6 sm:pb-8">
            <RadioGroup
              className="flex flex-col gap-2.5 sm:gap-3 mt-3 sm:mt-4 w-full"
              name={`question-${question.id}`}
              value={selectedOptionId || ""}
              onChange={onSelectOption}
            >
              {question.options.map((option: QuizOption, index: number) => {
                const isSelected = selectedOptionId === option.id;

                return (
                  <Radio
                    key={option.id}
                    value={option.id}
                    className={`
                      w-full max-w-full flex items-center gap-3 sm:gap-4
                      px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2
                      cursor-pointer transition-all duration-200 option-ring
                      ${isSelected
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/40 shadow-md"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/60 dark:hover:bg-zinc-700"
                      }
                    `}
                  >
                    {/* Letter badge */}
                    <span className={`
                      flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full
                      flex items-center justify-center text-xs sm:text-sm font-bold
                      transition-all duration-200
                      ${isSelected
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300"
                      }
                    `}>
                      {LABELS[index] ?? String.fromCharCode(65 + index)}
                    </span>

                    {/* Hidden radio control (accessibility) */}
                    <Radio.Control className="hidden">
                      <Radio.Indicator />
                    </Radio.Control>

                    <Radio.Content className="flex-1 min-w-0">
                      <Label className={`
                        text-sm sm:text-base font-semibold cursor-pointer leading-snug
                        transition-colors duration-200 break-words
                        ${isSelected
                          ? "text-violet-700 dark:text-violet-300"
                          : "text-zinc-800 dark:text-zinc-100"
                        }
                      `}>
                        {option.text}
                      </Label>
                    </Radio.Content>
                  </Radio>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Next / Finish Button ────────── */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
        onClick={onNext}
        disabled={!selectedOptionId}
        whileHover={selectedOptionId ? { scale: 1.02, y: -2 } : {}}
        whileTap={selectedOptionId ? { scale: 0.97 } : {}}
        className={`
          w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl
          font-bold text-base sm:text-lg tracking-wide shadow-lg
          transition-all duration-200 focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2
          ${selectedOptionId
            ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white hover:shadow-xl"
            : "bg-white/20 dark:bg-white/10 text-white/40 cursor-not-allowed"
          }
        `}
      >
        {isLastQuestion ? "Finish Quiz 🎉" : "Next →"}
      </motion.button>
    </div>
  );
}
