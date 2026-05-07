"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner, Button, Card, CardContent, RadioGroup, Radio, Label } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trophy, Wifi, WifiOff } from "lucide-react";
import { quizApi } from "@/services/quizApi";
import type { Quiz } from "@/types/quiz";
import { useLang } from "@/lib/i18n/LanguageContext";
import { QuizProgress } from "../../quiz/components/QuizProgress";
import { StudentNameModal } from "./StudentNameModal";
import { useStudentSocket } from "@/hooks/useMonitoringSocket";

// sessionId is based on the Quiz's MongoDB _id so Teacher & Student share the same room
function sessionIdFromQuiz(quizId: string) {
  return `quiz-session-${quizId}`;
}

export default function PlayQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLang();

  const code = (params.code as string)?.toUpperCase();

  // ── Quiz data ──────────────────────────────────────────────
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Student identity ───────────────────────────────────────
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId]     = useState("");
  const [showNameModal, setShowNameModal] = useState(false);

  // ── Quiz state ─────────────────────────────────────────────
  const [started, setStarted]               = useState(false);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [isFinished, setIsFinished]         = useState(false);
  const [isPaused, setIsPaused]             = useState(false);

  // ── Timing per question ────────────────────────────────────
  const questionStartTime = useRef<number>(Date.now());

  // ── Load quiz ──────────────────────────────────────────────
  useEffect(() => {
    if (!code) { setError("Invalid code"); setLoading(false); return; }
    quizApi.getQuizByCode(code)
      .then((data) => setQuiz(data))
      .catch((err) => setError(err.message || "Quiz not found or not available"))
      .finally(() => setLoading(false));
  }, [code]);

  // ── Socket (only active after student confirmed name) ──────
  // sessionId must match what Teacher's monitoring page uses: quiz-session-{quizId}
  const sessionId = quiz ? sessionIdFromQuiz(quiz.id) : "";

  const { isConnected, submitAnswer } = useStudentSocket({
    sessionId,
    quizId: quiz?.id,
    studentId,
    name: studentName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
    onSessionControl: (action) => {
      if (action === "pause")  setIsPaused(true);
      if (action === "resume") setIsPaused(false);
    },
  });

  // Reset question timer when question changes
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  // ── Handlers ───────────────────────────────────────────────
  const handleStartQuiz = () => {
    if (!studentName) {
      setShowNameModal(true);
    } else {
      setStarted(true);
    }
  };

  const handleNameConfirm = (name: string, id: string) => {
    setStudentName(name);
    setStudentId(id);
    setShowNameModal(false);
    setStarted(true);
  };

  const handleSelectOption = (optionId: string) => {
    if (isPaused) return;
    setCurrentSelection(optionId);

    // Emit real-time selection change immediately
    if (quiz && studentId) {
      const currentQuestion = quiz.questions[currentIndex];
      const selectedChoice  = currentQuestion.choices.find(c => c.id === optionId);
      const correctChoice   = currentQuestion.choices.find(c => c.isCorrect);
      const responseTime    = Math.round((Date.now() - questionStartTime.current) / 1000);

      submitAnswer({
        questionId:   currentQuestion.id,
        choiceId:     optionId,
        choiceText:   selectedChoice?.text,
        isCorrect:    optionId === correctChoice?.id,
        responseTime,
      });
    }
  };

  const handleNext = () => {
    if (!currentSelection || isPaused) return;

    const currentQuestion = quiz!.questions[currentIndex];
    const updated = { ...selectedAnswers, [currentQuestion.id]: currentSelection };
    setSelectedAnswers(updated);

    if (currentIndex < quiz!.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentSelection(null);
    } else {
      setIsFinished(true);
    }
  };

  // ── Score calculation ──────────────────────────────────────
  const calcScore = () => {
    if (!quiz) return { correct: 0, total: 0 };
    const correct = quiz.questions.filter(q => {
      const selected  = selectedAnswers[q.id];
      const correctCh = q.choices.find(c => c.isCorrect);
      return selected && selected === correctCh?.id;
    }).length;
    return { correct, total: quiz.questions.length };
  };

  // ═══════════════════════════════════════════════════════════
  //  Loading screen
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="quiz-bg fixed inset-0 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" className="text-white" />
        <p className="text-white/70 font-semibold text-lg">Loading quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="quiz-bg fixed inset-0 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl">
          <CardContent className="text-center py-12 px-8 flex flex-col items-center gap-6">
            <div className="text-6xl mb-2">🤔</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Oops!</h2>
              <p className="text-white/60">{error || "Quiz not found or not available."}</p>
            </div>
            <Button className="w-full h-14 rounded-2xl font-bold bg-white text-violet-600 shadow-xl" onPress={() => router.push("/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  Finished Screen
  // ═══════════════════════════════════════════════════════════
  if (isFinished) {
    const { correct, total } = calcScore();
    const percentage = Math.round((correct / total) * 100);

    return (
      <div className="quiz-bg fixed inset-0 overflow-y-auto">
        <Blobs />
        <div className="relative min-h-full flex flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-md flex flex-col gap-6 mx-auto">
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
                <p className="text-white/55 text-sm mt-1">Well done, {studentName || "Challenger"}!</p>
              </div>
            </motion.div>

            <Card className="w-full rounded-[32px] border-0 shadow-2xl overflow-hidden bg-white dark:bg-zinc-900">
              <div className={`h-1.5 w-full ${percentage >= 70 ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-amber-400 to-orange-500"}`} />
              <CardContent className="flex flex-col items-center gap-6 py-10 px-8">
                <div className="text-center">
                  <div className="text-6xl font-black text-violet-600 dark:text-violet-300">{percentage}%</div>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    <span className="font-bold text-zinc-800 dark:text-white">{correct}</span> of {total} correct
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <StatBox label="Score" value={`${correct}/${total}`} highlight={false} />
                  <StatBox label="Accuracy" value={`${percentage}%`} highlight={percentage >= 70} />
                </div>

                <Button
                  className="w-full py-7 rounded-2xl font-black text-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl"
                  onPress={() => router.push("/")}
                >
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  Welcome Screen
  // ═══════════════════════════════════════════════════════════
  if (!started) {
    return (
      <div className="quiz-bg fixed inset-0 overflow-y-auto">
        <Blobs />
        <div className="relative min-h-full flex flex-col items-center justify-center px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Card className="w-full rounded-[32px] border-0 shadow-2xl overflow-hidden bg-white dark:bg-zinc-900">
              <div className="h-32 bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <span className="text-6xl relative z-10 drop-shadow-lg">📚</span>
              </div>

              <CardContent className="text-center py-10 px-8 flex flex-col items-center gap-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">Ready to start?</span>
                  <h1 className="text-3xl font-black text-zinc-800 dark:text-white leading-tight">{quiz.title}</h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">{quiz.description}</p>
                </div>

                <div className="flex gap-4 w-full mt-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700/50">
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Questions</p>
                    <p className="text-xl font-black text-zinc-800 dark:text-white">{quiz.questions.length}</p>
                  </div>
                  <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Duration</p>
                    <p className="text-xl font-black text-zinc-800 dark:text-white">{quiz.durationMinutes}m</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 rounded-2xl font-black text-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl hover:shadow-violet-500/30 hover:-translate-y-1 transition-all"
                  onPress={handleStartQuiz}
                >
                  Start Quiz
                </Button>

                <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold transition-colors">
                  Not now, take me home
                </button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Name input modal */}
        <StudentNameModal
          quizTitle={quiz.title}
          isOpen={showNameModal}
          onConfirm={handleNameConfirm}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  Quiz Player
  // ═══════════════════════════════════════════════════════════
  const question = quiz.questions[currentIndex];

  return (
    <div className="quiz-bg fixed inset-0 overflow-y-auto">
      <Blobs />

      {/* Pause overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          >
            <div className="text-5xl">⏸️</div>
            <p className="text-white font-black text-xl">Quiz Paused</p>
            <p className="text-white/60 text-sm">Waiting for your teacher to resume…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative min-h-full flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 py-6 sm:py-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        <motion.div className="w-full flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setStarted(false)}
              className="w-10 h-10 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-white font-black text-sm tracking-widest">
              {String(currentIndex + 1).padStart(2, "0")}{" "}
              <span className="text-white/40 font-bold">/</span>{" "}
              {String(quiz.questions.length).padStart(2, "0")}
            </span>

            {/* Connection indicator */}
            <div className={`flex items-center gap-1.5 backdrop-blur-md border border-white/25 rounded-full px-3 py-1.5 ${isConnected ? "bg-emerald-500/20" : "bg-white/20 dark:bg-white/10"}`}>
              {isConnected
                ? <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                : <WifiOff className="w-3.5 h-3.5 text-white/50" />
              }
              <span className={`font-bold text-xs uppercase tracking-tight ${isConnected ? "text-emerald-300" : "text-white/50"}`}>
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <QuizProgress currentQuestionIndex={currentIndex} totalQuestions={quiz.questions.length} />

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-5 sm:gap-6"
            >
              <Card className="w-full rounded-[32px] border-0 shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden">
                <CardContent className="px-6 sm:px-8 pt-8 sm:pt-10 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-2 block">
                    {quiz.category || "General"}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white leading-snug">
                    {question.text}
                  </h2>
                  {question.imageUrl && (
                    <div className="mt-6 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={question.imageUrl} alt="Question" className="w-full max-h-64 object-contain bg-zinc-50 dark:bg-black/20" />
                    </div>
                  )}
                </CardContent>

                <CardContent className="px-6 sm:px-8 pb-8 sm:pb-10 pt-4">
                  <RadioGroup
                    value={currentSelection || ""}
                    onChange={(val) => handleSelectOption(val)}
                    className="flex flex-col gap-3"
                  >
                    {question.choices.map((choice, idx) => {
                      const isSelected = currentSelection === choice.id;
                      const labels = ["A", "B", "C", "D", "E"];
                      return (
                        <Radio
                          key={choice.id}
                          value={choice.id}
                          className={`
                            w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all cursor-pointer
                            ${isSelected
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-900/40 shadow-md"
                              : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-violet-200 dark:hover:border-violet-700"
                            }
                          `}
                        >
                          <div className={`
                            shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all
                            ${isSelected ? "bg-violet-600 text-white" : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500"}
                          `}>
                            {labels[idx] || idx + 1}
                          </div>

                          <div className="flex-1 flex items-center justify-between gap-4">
                            <Label className={`font-bold ${isSelected ? "text-violet-700 dark:text-violet-300" : "text-zinc-700 dark:text-zinc-200"}`}>
                              {choice.text}
                            </Label>
                            {choice.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={choice.imageUrl} alt="" className="h-10 w-10 object-cover rounded-lg bg-black/10 shrink-0" />
                            )}
                          </div>

                          <Radio.Control className="hidden">
                            <Radio.Indicator />
                          </Radio.Control>
                        </Radio>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Next button */}
              <motion.button
                whileHover={currentSelection ? { scale: 1.02, y: -2 } : {}}
                whileTap={currentSelection ? { scale: 0.98 } : {}}
                onClick={handleNext}
                disabled={!currentSelection || isPaused}
                className={`
                  w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all
                  ${currentSelection && !isPaused
                    ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white hover:shadow-green-500/25"
                    : "bg-white/20 dark:bg-white/10 text-white/40 cursor-not-allowed"
                  }
                `}
              >
                {currentIndex === quiz.questions.length - 1 ? "Finish Quiz 🎉" : "Next Question →"}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ── Shared UI Helpers ──────────────────────────────────────────

function Blobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-20 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-purple-400/20 dark:bg-purple-300/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-violet-800/30 dark:bg-violet-600/20 blur-3xl" />
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border flex flex-col items-center gap-1 ${
      highlight
        ? "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/50"
        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700/50"
    }`}>
      <span className={`text-2xl font-black ${highlight ? "text-violet-600 dark:text-violet-300" : "text-zinc-800 dark:text-white"}`}>{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
    </div>
  );
}
