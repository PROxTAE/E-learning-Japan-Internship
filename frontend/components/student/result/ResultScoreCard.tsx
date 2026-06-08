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
  const bgColor = isPassed ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div
      className="w-full flex flex-col gap-6"
      data-ai-context-type="result"
      data-ai-context-name={`${studentName}'s Quiz Result`}
      data-ai-context-data={JSON.stringify({ studentName, score, total, percentage, isPassed })}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-brand-primary/15 border-2 border-brand-primary/30 flex items-center justify-center shadow-lg">
          <Trophy className="w-10 h-10 text-brand-secondary drop-shadow-md" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">{t.play.quizComplete}</h1>
          <p className="text-text-muted text-sm mt-1">{t.play.wellDone} <span className="font-bold text-text-main">{studentName}</span>!</p>
        </div>
      </motion.div>
 
      <Card className="w-full rounded-[28px] border-2 border-theme-border shadow-xl overflow-hidden bg-bg-card">
        <div className={`h-1.5 w-full ${bgColor}`} />
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
              <text x="72" y="72" dominantBaseline="central" textAnchor="middle" className="text-3xl font-black fill-text-main" dy="0.1em">
                {percentage}%
              </text>
            </svg>
          </div>
          
          <div className="text-center">
            <p className="text-text-muted mt-1">
              {t.play.youScored} <span className="font-bold text-text-main">{score}</span> {t.play.outOf} {total} {t.play.correct}
            </p>
          </div>
 
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-4 rounded-2xl border-2 border-theme-border bg-bg-secondary flex flex-col items-center gap-1">
              <span className="text-2xl font-black text-text-main">{score}/{total}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{t.play.score}</span>
            </div>
            <div className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 ${
              isPassed 
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50" 
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
            }`}>
              <span className={`text-2xl font-black ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {percentage}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{t.play.accuracy}</span>
            </div>
          </div>
 
          <div className="flex flex-col gap-3 w-full mt-2">
            <Button
              className="w-full py-6 rounded-full font-black text-lg bg-brand-primary hover:bg-brand-primary-hover text-white shadow-md transition-all flex items-center gap-2"
              onPress={onPlayAgain}
            >
              <RotateCcw className="w-5 h-5" /> {t.play.playAgain}
            </Button>
            <Button
              className="w-full py-6 rounded-full font-bold text-text-main bg-bg-secondary border-2 border-theme-border hover:bg-bg-secondary/80 flex items-center gap-2"
              onPress={onGoHome}
            >
              <Home className="w-5 h-5" /> {t.play.backHome}
            </Button>
          </div>
 
        </CardContent>
      </Card>
    </div>
  );
}
