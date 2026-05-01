"use client";

import { Card, CardContent, ProgressCircle } from "@heroui/react";
import { QuizResultData } from "../types";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, CheckCircle2, XCircle, Target, Star } from "lucide-react";

interface QuizResultProps {
  result: QuizResultData;
  onRestart: () => void;
}

export function QuizResult({ result, onRestart }: QuizResultProps) {
  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
  const wrongAnswers = result.totalQuestions - result.correctAnswers;

  const grade =
    percentage >= 80
      ? { label: "Excellent!", emoji: "🏆", sub: "Outstanding performance!", circleColor: "success" as const, accentFrom: "from-emerald-400", accentTo: "to-green-500" }
      : percentage >= 60
      ? { label: "Good Job!", emoji: "🌟", sub: "Keep pushing forward!", circleColor: "warning" as const, accentFrom: "from-amber-400", accentTo: "to-yellow-500" }
      : { label: "Keep Trying!", emoji: "💪", sub: "Practice makes perfect!", circleColor: "danger" as const, accentFrom: "from-red-400", accentTo: "to-rose-500" };

  const stats = [
    {
      icon: <Target className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />,
      label: "Total",
      value: result.totalQuestions,
      valueClass: "text-zinc-800 dark:text-white",
      bgClass: "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700",
    },
    {
      icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />,
      label: "Correct",
      value: result.correctAnswers,
      valueClass: "text-emerald-500",
      bgClass: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50",
    },
    {
      icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />,
      label: "Wrong",
      value: wrongAnswers,
      valueClass: "text-red-500",
      bgClass: "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50",
    },
  ];

  return (
    <div className="quiz-bg fixed inset-0 overflow-y-auto">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-purple-400/20 dark:bg-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-violet-800/30 dark:bg-violet-600/20 blur-3xl" />
      </div>

      {/* Floating stars */}
      {[...Array(5)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute select-none pointer-events-none text-yellow-300/30"
          style={{
            top: `${10 + i * 18}%`,
            left: i % 2 === 0 ? `${4 + i * 2}%` : undefined,
            right: i % 2 !== 0 ? `${4 + i * 2}%` : undefined,
            fontSize: `${12 + i * 4}px`,
          }}
          animate={{ y: [0, -12, 0], rotate: [0, 20, -20, 0] }}
          transition={{ repeat: Infinity, duration: 3 + i * 0.8, ease: "easeInOut" }}
        >
          ★
        </motion.span>
      ))}

      {/* Content */}
      <div className="relative min-h-full flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        {/* Inner column: grows with content, max-width adapts to screen */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg flex flex-col gap-5 sm:gap-6 mx-auto">

          {/* ── Trophy header ─────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, type: "spring", bounce: 0.4 }}
            className="flex flex-col items-center gap-2 sm:gap-3 text-center"
          >
            <div className="
              w-20 h-20 sm:w-24 sm:h-24 rounded-full
              bg-white/10 dark:bg-white/5 backdrop-blur-sm
              border-2 border-white/20 dark:border-white/10
              flex items-center justify-center shadow-2xl
            ">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-300 drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {grade.emoji} {grade.label}
              </h1>
              <p className="text-white/55 text-sm mt-1">{grade.sub}</p>
            </div>
          </motion.div>

          {/* ── Score card ────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
          >
            <Card className="
              w-full rounded-2xl sm:rounded-3xl border-0 shadow-2xl overflow-hidden
              bg-white dark:bg-zinc-900
            ">
              {/* Top accent stripe */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${grade.accentFrom} ${grade.accentTo}`} />

              <CardContent className="flex flex-col items-center gap-5 sm:gap-6 px-5 sm:px-7 py-6 sm:py-8">

                {/* Circular progress */}
                <div className="relative flex items-center justify-center">
                  <ProgressCircle
                    aria-label="Quiz Score"
                    value={percentage}
                    color={grade.circleColor}
                    size="lg"
                    className="w-32 h-32 sm:w-36 sm:h-36"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                    <span className={`
                      text-4xl sm:text-5xl font-black leading-none
                      ${percentage >= 80 ? "text-emerald-500" : percentage >= 60 ? "text-amber-500" : "text-red-500"}
                    `}>
                      {percentage}
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-widest">
                      Score
                    </span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                  {stats.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`
                        flex flex-col items-center gap-1.5 sm:gap-2
                        py-3 sm:py-4 px-2 rounded-xl sm:rounded-2xl border
                        ${s.bgClass}
                      `}
                    >
                      {s.icon}
                      <span className={`text-xl sm:text-2xl font-black ${s.valueClass}`}>
                        {s.value}
                      </span>
                      <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">
                        {s.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Final score badge */}
                <div className="
                  flex items-center justify-between w-full
                  bg-violet-50 dark:bg-violet-900/30
                  border border-violet-200 dark:border-violet-700/50
                  rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5
                ">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" fill="currentColor" />
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-300">
                      Final Score
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-violet-600 dark:text-violet-300">
                    {result.score} pts
                  </span>
                </div>

              </CardContent>
            </Card>
          </motion.div>

          {/* ── Try Again button ──────────── */}
          <motion.button
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onRestart}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="
              w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl
              bg-gradient-to-r from-emerald-400 to-green-500 text-white
              font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl
              transition-shadow flex items-center justify-center gap-2 sm:gap-3
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-emerald-400 focus-visible:ring-offset-2
            "
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            Try Again
          </motion.button>

        </div>
      </div>
    </div>
  );
}
