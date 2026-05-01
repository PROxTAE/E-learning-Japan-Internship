"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, CheckCircle2, Circle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Question } from "@/types/quiz";
import type { BuilderT } from "@/lib/i18n/quizBuilderTranslations";

interface QuizPreviewProps {
  t: BuilderT["builder"];
  title: string;
  description: string;
  questions: Question[];
}

export function QuizPreview({ t, title, description, questions }: QuizPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const total = questions.length;
  const current = questions[currentIndex];

  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    setCurrentIndex((i) => Math.max(0, Math.min(total - 1, i + dir)));
  };

  const score = Object.entries(selectedChoices).reduce((acc, [qId, cId]) => {
    const q = questions.find((q) => q.id === qId);
    const c = q?.choices.find((c) => c.id === cId);
    return acc + (c?.isCorrect ? 1 : 0);
  }, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Circle size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">{t.noQuestions}</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t.noQuestionsHint}</p>
      </div>
    );
  }

  if (submitted) {
    const pct = Math.round((score / total) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center gap-5"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
          <span className="text-3xl font-bold text-white">{pct}%</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {score} / {total} correct
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {pct >= 80 ? "🎉 Excellent work!" : pct >= 60 ? "👍 Good effort!" : "📚 Keep studying!"}
          </p>
        </div>
        <button
          id="preview-retake-btn"
          onClick={() => { setSelectedChoices({}); setSubmitted(false); setCurrentIndex(0); }}
          className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors shadow-md shadow-violet-500/20"
        >
          Retake
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Quiz title bar */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title || "Untitled Quiz"}</h2>
        {description && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{description}</p>}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t.previewQuestion} {currentIndex + 1} {t.previewOf} {total}</span>
          <span>{Math.round(((currentIndex + 1) / total) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
            animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm overflow-hidden"
        >
          {/* Question image */}
          {current.imageUrl && (
            <div className="mb-5 -mx-6 -mt-6 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.imageUrl}
                alt="Question image"
                className="w-full max-h-52 object-cover"
              />
            </div>
          )}

          <p className="text-base font-semibold text-slate-700 dark:text-slate-200 leading-relaxed mb-5">
            {current.text || "(No question text)"}
          </p>

          <div className="space-y-2.5">
            {current.choices.map((choice) => {
              const isSelected = selectedChoices[current.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  id={`preview-choice-${choice.id}`}
                  type="button"
                  onClick={() => setSelectedChoices((p) => ({ ...p, [current.id]: choice.id }))}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left
                    border-2 transition-all duration-150 font-medium
                    ${isSelected
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                      : "border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
                    }
                  `}
                >
                  {isSelected
                    ? <CheckCircle2 size={16} className="text-violet-500 flex-shrink-0" />
                    : <Circle size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  }
                  {choice.text || "(Empty choice)"}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="preview-prev-btn"
          type="button"
          disabled={currentIndex === 0}
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={15} /> Previous
        </button>

        {currentIndex < total - 1 ? (
          <button
            id="preview-next-btn"
            type="button"
            onClick={() => navigate(1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all"
          >
            Next <ChevronRight size={15} />
          </button>
        ) : (
          <button
            id="preview-submit-btn"
            type="button"
            onClick={() => setSubmitted(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all"
          >
            {t.submit} <CheckCircle2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
