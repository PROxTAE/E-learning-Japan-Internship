"use client";

import { Card, CardContent, Button } from "@heroui/react";
import { Trophy, Home, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";

interface ResultScoreCardProps {
  studentName: string;
  score: number;
  total: number;
  percentage: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function ResultScoreCard({ studentName, score, total, percentage, onPlayAgain, onGoHome }: ResultScoreCardProps) {
  const { t } = useLang();
  
  const isPassed = percentage >= 50;
  const strokeColor = isPassed ? "success" : "warning";
  const bgGradient = isPassed 
    ? "from-emerald-400 to-green-500" 
    : "from-amber-400 to-orange-500";

  return (
    <div className="w-full flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-2xl">
          <Trophy className="w-10 h-10 text-yellow-300 drop-shadow-lg" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Quiz Complete!</h1>
          <p className="text-white/70 text-sm mt-1">Well done, <span className="font-bold text-white">{studentName}</span>!</p>
        </div>
      </motion.div>

      <Card className="w-full rounded-[32px] border-0 shadow-2xl overflow-hidden bg-white dark:bg-zinc-900">
        <div className={`h-1.5 w-full bg-gradient-to-r ${bgGradient}`} />
        <CardContent className="flex flex-col items-center gap-6 py-10 px-8">
          
          {/* Custom SVG Circular Progress */}
          <div className="relative flex items-center justify-center">
            <svg width="144" height="144" viewBox="0 0 144 144" className="drop-shadow-md">
              <circle cx="72" cy="72" r="60" fill="none" className="stroke-black/5 dark:stroke-white/5" strokeWidth="12" />
              <motion.circle 
                cx="72" 
                cy="72" 
                r="60" 
                fill="none" 
                className={`stroke-current ${isPassed ? 'text-emerald-500' : 'text-amber-500'}`} 
                strokeWidth="12" 
                strokeDasharray={2 * Math.PI * 60} 
                initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - percentage / 100) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                strokeLinecap="round"
                transform="rotate(-90 72 72)"
              />
              <text x="72" y="72" dominantBaseline="central" textAnchor="middle" className="text-3xl font-black fill-zinc-800 dark:fill-white" dy="0.1em">
                {percentage}%
              </text>
            </svg>
          </div>
          
          <div className="text-center">
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              You scored <span className="font-bold text-zinc-800 dark:text-white">{score}</span> out of {total} correct
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-4 rounded-2xl border bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700/50 flex flex-col items-center gap-1">
              <span className="text-2xl font-black text-zinc-800 dark:text-white">{score}/{total}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Score</span>
            </div>
            <div className={`p-4 rounded-2xl border flex flex-col items-center gap-1 ${
              isPassed 
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50" 
                : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
            }`}>
              <span className={`text-2xl font-black ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {percentage}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Accuracy</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full mt-2">
            <Button
              className="w-full py-6 rounded-2xl font-black text-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl hover:shadow-violet-500/30 transition-all flex items-center gap-2"
              onPress={onPlayAgain}
            >
              <RotateCcw className="w-5 h-5" /> Play Again
            </Button>
            <Button
              variant="flat"
              className="w-full py-6 rounded-2xl font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2"
              onPress={onGoHome}
            >
              <Home className="w-5 h-5" /> Back to Home
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
