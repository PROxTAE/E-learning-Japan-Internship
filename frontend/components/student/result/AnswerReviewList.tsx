"use client";

import { Accordion, AccordionItem, Chip } from "@heroui/react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { AnswerReview } from "@/services/studentResultApi";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";

interface AnswerReviewListProps {
  reviews: AnswerReview[];
}

export function AnswerReviewList({ reviews }: AnswerReviewListProps) {
  const { t } = useLang();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full mt-6"
      data-ai-context-type="answer-review"
      data-ai-context-name="Answer Review"
      data-ai-context-data={JSON.stringify({ total: reviews.length, correct: reviews.filter(r => r.isCorrect).length, incorrect: reviews.filter(r => !r.isCorrect && r.selectedChoiceId !== null).length, skipped: reviews.filter(r => r.selectedChoiceId === null).length })}
    >
      <h3 className="text-xl font-bold text-white mb-4 px-2">{t.play.answerReview}</h3>
      
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-2 shadow-xl border border-white/10 overflow-hidden">
        <Accordion {...{ variant: "light", selectionMode: "multiple" } as any}>
          {reviews.map((review, idx) => (
            <AccordionItem
              {...{
                key: review.questionId,
                "aria-label": `Question ${idx + 1}`,
                title: (
                  <div className="flex items-center gap-3 py-1">
                    {review.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : review.selectedChoiceId === null ? (
                      <HelpCircle className="w-5 h-5 text-zinc-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-danger-500 shrink-0" />
                    )}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm line-clamp-2">
                      {idx + 1}. {review.questionText}
                    </span>
                  </div>
                ),
                subtitle: (
                  <div className="pl-8 pt-1">
                    <Chip 
                      size="sm" 
                      color={(review.isCorrect ? "success" : review.selectedChoiceId === null ? "default" : "danger") as any} 
                      variant={"flat" as any}
                      className="font-medium"
                    >
                      {review.isCorrect 
                        ? t.play.correctStatus 
                        : review.selectedChoiceId === null 
                          ? t.play.skippedStatus 
                          : t.play.incorrectStatus}
                    </Chip>
                  </div>
                )
              } as any}
            >
              <div className="pl-8 pr-4 pb-4 flex flex-col gap-3 text-sm">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 block">{t.play.yourAnswer}</span>
                  <span className={`font-medium ${
                    review.isCorrect 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-danger-600 dark:text-danger-400"
                  }`}>
                    {review.selectedChoiceText || "—"}
                  </span>
                </div>
                
                {!review.isCorrect && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mb-1 block">{t.play.correctAnswer}</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {review.correctChoiceText}
                    </span>
                  </div>
                )}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </motion.div>
  );
}
