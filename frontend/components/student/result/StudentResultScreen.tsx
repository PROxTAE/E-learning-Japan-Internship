"use client";

import { useEffect, useState } from "react";
import { Spinner, Button } from "@heroui/react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { quizApi } from "@/services/quizApi";
import type { StudentResult } from "@/services/studentResultApi";
import { ResultScoreCard } from "./ResultScoreCard";
import { AnswerReviewList } from "./AnswerReviewList";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

function SimpleConfetti() {
  const colors = ["#fce18a", "#ff726d", "#b48def", "#f4306d", "#00b8a9"];
  const isClient = typeof window !== "undefined";
  if (!isClient) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            y: -20, 
            x: Math.random() * window.innerWidth 
          }}
          animate={{ 
            opacity: 0, 
            y: window.innerHeight, 
            x: Math.random() * window.innerWidth + (Math.random() > 0.5 ? 100 : -100),
            rotate: Math.random() * 720
          }}
          transition={{ duration: 2.5 + Math.random() * 2, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: Math.random() > 0.5 ? 12 : 8,
            height: Math.random() > 0.5 ? 12 : 8,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? "50%" : "2px"
          }}
        />
      ))}
    </div>
  );
}

interface StudentResultScreenProps {
  quizId: string;
  studentId: string;
  studentName: string;
  selectedAnswers: Record<string, string>;
  /** logId returned after the interaction log is submitted; enables AI analysis */
  logId?: string | null;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function StudentResultScreen({ quizId, studentId, studentName, selectedAnswers, logId, onPlayAgain, onGoHome }: StudentResultScreenProps) {
  const { lang } = useLang();
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);

  // ── AI Analysis state ─────────────────────────────────────────
  const [aiAnalysis, setAiAnalysis]         = useState<string | null>(null);
  const [aiLoading, setAiLoading]           = useState(false);
  const [aiError, setAiError]               = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel]       = useState(false);
  const [aiModel, setAiModel]               = useState<string>("");


  useEffect(() => {
    let mounted = true;
    setLoading(true);

    quizApi.getQuiz(quizId)
      .then((fullQuiz) => {
        if (!mounted) return;
        
        let correctCount = 0;
        const reviews = fullQuiz.questions.map((q: any) => {
          const qId = q.id || q._id;
          const studentChoiceId = selectedAnswers[qId] || null;
          const studentChoice = q.choices.find((c: any) => (c.id || c._id) === studentChoiceId);
          const correctChoice = q.choices.find((c: any) => c.isCorrect);
          
          const isCorrect = studentChoiceId === (correctChoice?.id || correctChoice?._id);
          if (isCorrect) correctCount++;
          
          return {
            questionId: qId,
            questionText: q.text || q.title || "Question",
            selectedChoiceId: studentChoiceId,
            selectedChoiceText: studentChoice?.text || null,
            correctChoiceId: correctChoice?.id || correctChoice?._id || "",
            correctChoiceText: correctChoice?.text || "Unknown",
            isCorrect
          };
        });

        const total = fullQuiz.questions.length;
        const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        
        const calculatedResult = {
          score: correctCount,
          total,
          percentage,
          reviews
        };
        
        setResult(calculatedResult);
        setShowAnswers(fullQuiz.showAnswersAfterQuiz !== false);
        
        if (percentage >= 50) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      })
      .catch((err) => console.error("Failed to load result:", err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [quizId, selectedAnswers]);

  // ── AI Analysis handler ───────────────────────────────────────
  const handleAiAnalysis = async () => {
    if (aiAnalysis) {
      // Toggle panel if already analysed
      setShowAiPanel((p) => !p);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setShowAiPanel(true);
    try {
      const res  = await fetch("/api/analyze-quiz-log", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ logId, lang }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message || "Analysis failed");
      setAiAnalysis(body.data.analysis);
      setAiModel(body.data.model || "");
    } catch (err: any) {
      setAiError(err.message || "Could not connect to AI");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Spinner size="lg" className="text-white" />
        <p className="text-white/70 font-semibold">Calculating your results...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {showConfetti && <SimpleConfetti />}

      {/* Floating controls: Language + Theme */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      
      <ResultScoreCard 
        studentName={studentName}
        score={result.score}
        total={result.total}
        percentage={result.percentage}
        onPlayAgain={onPlayAgain}
        onGoHome={onGoHome}
      />

      {/* ── AI Analysis Panel ────────────────────────────────────────── */}
      {logId && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5"
        >
          <button
            onClick={handleAiAnalysis}
            disabled={aiLoading}
            className={`
              w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl font-bold text-sm
              transition-all duration-200 shadow-lg
              ${
                aiLoading
                  ? "bg-violet-500/80 text-white cursor-wait"
                  : showAiPanel
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-500/25"
                  : "bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md"
              }
            `}
          >
            <span className="flex items-center gap-2">
              {aiLoading ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {aiLoading
                ? (lang === "th" ? "AI กำลังวิเคราะห์..." : lang === "ja" ? "AI分析中..." : "AI is analysing...")
                : (lang === "th" ? "วิเคราะห์ด้วย AI" : lang === "ja" ? "AIで分析する" : "Analyse with AI")
              }
            </span>
            {!aiLoading && (
              showAiPanel
                ? <ChevronUp className="w-4 h-4 shrink-0" />
                : <ChevronDown className="w-4 h-4 shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {showAiPanel && (
              <motion.div
                key="ai-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-2xl bg-white/10 dark:bg-zinc-900/60 backdrop-blur-md border border-white/15 dark:border-zinc-700/50 p-5 shadow-xl">
                  {aiLoading && (
                    <div className="flex items-center gap-3 text-white/70">
                      <Spinner size="sm" />
                      <span className="text-sm font-medium">
                        {lang === "th" ? "กำลังวิเคราะห์ผลการทดสอบ..." : lang === "ja" ? "テスト結果を分析中..." : "Analysing your quiz performance..."}
                      </span>
                    </div>
                  )}

                  {aiError && (
                    <div className="flex items-start gap-2.5 text-rose-300 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">
                          {lang === "th" ? "ไม่สามารถเชื่อมต่อ AI ได้" : lang === "ja" ? "AIへの接続に失敗しました" : "Could not connect to AI"}
                        </p>
                        <p className="text-xs opacity-75 mt-0.5">{aiError}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {lang === "th" ? "โปรดตรวจสอบว่า Ollama รันอยู่" : lang === "ja" ? "Ollamaが起動しているか確認してください" : "Please ensure Ollama is running."}
                        </p>
                      </div>
                    </div>
                  )}

                  {aiAnalysis && !aiLoading && (
                    <div>
                      {aiModel && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/20 text-violet-200 border border-violet-400/20 select-none uppercase tracking-wider">
                            <Sparkles className="w-2.5 h-2.5" />
                            {aiModel}
                          </span>
                        </div>
                      )}
                      <div className="prose prose-sm prose-invert max-w-none text-white/90 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-violet-200 [&_strong]:text-white [&_p]:text-white/85 [&_li]:text-white/80 [&_ul]:text-white/80">
                        <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Answer review ────────────────────────────────────────────── */}
      {showAnswers ? (
        <AnswerReviewList reviews={result.reviews} />
      ) : (
        <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-6 text-center text-white/70 shadow-xl">
          <p className="font-semibold text-sm leading-relaxed">
            {lang === "th" 
              ? "ผู้สอนปิดการแสดงเฉลยและทบทวนคำตอบสำหรับแบบทดสอบนี้" 
              : lang === "ja" 
                ? "このクイズの解答とレビューは非表示に設定されています。" 
                : "Answer review and correct answers are hidden for this quiz."}
          </p>
        </div>
      )}
    </div>
  );
}
