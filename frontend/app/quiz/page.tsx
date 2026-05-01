"use client";

import { useEffect, useState } from "react";
import { QuizQuestion, QuizResultData } from "./types";
import { fetchQuizQuestions } from "./services/api";
import { QuizCard } from "./components/QuizCard";
import { QuizProgress } from "./components/QuizProgress";
import { QuizResult } from "./components/QuizResult";
import { Spinner } from "@heroui/react";
import { motion } from "framer-motion";

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);

  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<QuizResultData | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchQuizQuestions();
      setQuestions(data);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionId: string) => {
    setCurrentSelection(optionId);
  };

  const handleNext = () => {
    if (!currentSelection) return;
    const currentQuestion = questions[currentIndex];
    const updatedAnswers = { ...selectedAnswers, [currentQuestion.id]: currentSelection };
    setSelectedAnswers(updatedAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentSelection(null);
    } else {
      calculateResult(updatedAnswers);
    }
  };

  const calculateResult = (finalAnswers: Record<string, string>) => {
    const correct = questions.filter((q) => finalAnswers[q.id] === q.correctOptionId).length;
    setResult({ totalQuestions: questions.length, correctAnswers: correct, score: correct * 10 });
    setIsFinished(true);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setCurrentSelection(null);
    setIsFinished(false);
    setResult(null);
  };

  /* ── Finished → hand off to QuizResult (has its own full-screen bg) ── */
  if (isFinished && result) {
    return <QuizResult result={result} onRestart={handleRestart} />;
  }

  /* ── Quiz screen ───────────────────────────────────────────────────── */
  return (
    <div className="quiz-bg fixed inset-0 overflow-y-auto">
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-purple-400/20 dark:bg-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-violet-800/30 dark:bg-violet-600/20 blur-3xl" />
      </div>

      {/* Centred column — widens on larger screens */}
      <div className="relative min-h-full flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 py-6 sm:py-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">

        {loading ? (
          /* ── Loading state ── */
          <div className="flex-grow flex flex-col items-center justify-center gap-4 min-h-[60vh]">
            <Spinner size="lg" className="text-white" />
            <span className="text-white/70 font-semibold text-base sm:text-lg">Loading Quiz...</span>
          </div>

        ) : questions.length === 0 ? (
          /* ── Error state ── */
          <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-red-300 font-semibold text-lg">Failed to load questions.</p>
          </div>

        ) : (
          /* ── Active quiz ── */
          <motion.div
            className="w-full flex flex-col gap-3 sm:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-1">
              {/* Back / restart button */}
              <button
                onClick={handleRestart}
                aria-label="Restart quiz"
                className="
                  w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl
                  bg-white/20 dark:bg-white/10 backdrop-blur-sm
                  border border-white/25 text-white text-base
                  flex items-center justify-center
                  hover:bg-white/30 transition-all active:scale-95
                "
              >
                ←
              </button>

              {/* Question counter */}
              <span className="text-white font-extrabold text-sm sm:text-base tracking-wider">
                {String(currentIndex + 1).padStart(2, "0")}{" "}
                <span className="text-white/50 font-medium">of</span>{" "}
                {String(questions.length).padStart(2, "0")}
              </span>

              {/* Category / timer placeholder */}
              <div className="
                flex items-center gap-1.5 bg-white/20 dark:bg-white/10 backdrop-blur-sm
                border border-white/25 rounded-full px-3 py-1.5
              ">
                <span className="text-base leading-none">📚</span>
                <span className="text-white font-bold text-xs sm:text-sm">Quiz</span>
              </div>
            </div>

            {/* Progress bar */}
            <QuizProgress
              currentQuestionIndex={currentIndex}
              totalQuestions={questions.length}
            />

            {/* Question card + Next button */}
            <QuizCard
              question={questions[currentIndex]}
              selectedOptionId={currentSelection}
              onSelectOption={handleSelectOption}
              onNext={handleNext}
              isLastQuestion={currentIndex === questions.length - 1}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
