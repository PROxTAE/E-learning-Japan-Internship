"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner, Button, Card, CardContent, RadioGroup, Radio, Input } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trophy, Wifi, WifiOff, RotateCcw } from "lucide-react";
import { quizApi } from "@/services/quizApi";
import type { Quiz } from "@/types/quiz";
import { useLang } from "@/lib/i18n/LanguageContext";
import { QuizProgress } from "../../quiz/components/QuizProgress";
import { StudentNameModal } from "./StudentNameModal";
import { useStudentSocket } from "@/hooks/useMonitoringSocket";
import { useQuizSession } from "@/hooks/useQuizSession";
import { StudentResultScreen } from "@/components/student/result/StudentResultScreen";
import { useQuizInteractionLog } from "@/hooks/useQuizInteractionLog";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

// sessionId must match the Teacher's monitoring page: quiz-session-{quizId}
function sessionIdFromQuiz(quizId: string) {
  return `quiz-session-${quizId}`;
}

export default function PlayQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useLang();

  const code = (params.code as string)?.toUpperCase();

  // ── Quiz data ──────────────────────────────────────────────────────────────
  const [quiz,    setQuiz]    = useState<Quiz | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Student identity ───────────────────────────────────────────────────────
  const [studentName, setStudentName]   = useState("");
  const [studentId,   setStudentId]     = useState("");
  const [showNameModal, setShowNameModal] = useState(false);

  // ── Quiz progress ──────────────────────────────────────────────────────────
  const [started,           setStarted]           = useState(false);
  const [currentIndex,      setCurrentIndex]       = useState(0);
  const [selectedAnswers,   setSelectedAnswers]    = useState<Record<string, string>>({});
  const [currentSelection,  setCurrentSelection]   = useState<string | null>(null);
  const [isFinished,        setIsFinished]         = useState(false);
  const [isPaused,          setIsPaused]           = useState(false);
  const [recoveredSession,  setRecoveredSession]   = useState(false); // banner flag

  // ── Global Quiz Timer ──────────────────────────────────────────────────────
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ── Session Controls States ────────────────────────────────────────────────
  const [isTeacherLed, setIsTeacherLed] = useState(false);
  const [roomLocked, setRoomLocked] = useState(false);
  const [liveTimer, setLiveTimer] = useState<number | null>(null);

  // ── Timing per question ────────────────────────────────────────────────────
  const questionStartTime = useRef<number>(Date.now());

  // ── Interaction log ────────────────────────────────────────────────────────
  const [submittedLogId, setSubmittedLogId] = useState<string | null>(null);
  const interactionLog = useQuizInteractionLog({
    quizId:      quiz?.id ?? "",
    quizTitle:   quiz?.title ?? "",
    studentId,
    studentName,
    lang,
  });

  // ── Session persistence ────────────────────────────────────────────────────
  const { loadSession, saveSession, clearSession } = useQuizSession(quiz?.id ?? "");

  // ── Load quiz from API ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!code) { setError("Invalid code"); setLoading(false); return; }
    quizApi.getQuizByCode(code)
      .then((data) => setQuiz(data))
      .catch((err) => setError(err.message || "Quiz not found or not available"))
      .finally(() => setLoading(false));
  }, [code]);

  // ── Restore saved session once quiz is loaded ──────────────────────────────
  useEffect(() => {
    if (!quiz) return;
    const saved = loadSession();
    if (!saved || !saved.started) return;

    // Restore all quiz state from localStorage
    setStudentId(saved.studentId);
    setStudentName(saved.studentName);
    setCurrentIndex(saved.currentIndex);
    setSelectedAnswers(saved.selectedAnswers);
    setCurrentSelection(saved.currentSelection);
    setStarted(saved.started);
    setIsFinished(saved.isFinished);
    setStartTime(saved.startTime || null);
    setRecoveredSession(true);

    // Banner auto-hides after 4 s
    setTimeout(() => setRecoveredSession(false), 4000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz?.id]);

  // ── Auto-save on every state change ───────────────────────────────────────
  useEffect(() => {
    if (!quiz || !started || !studentId) return;
    saveSession({
      studentId,
      studentName,
      currentIndex,
      selectedAnswers,
      currentSelection,
      started,
      isFinished,
      startTime: startTime || undefined,
    });
  }, [quiz, started, studentId, studentName, currentIndex, selectedAnswers, currentSelection, isFinished, startTime, saveSession]);

  // ── Socket (only active after student has an identity) ────────────────────
  const sessionId = quiz ? sessionIdFromQuiz(quiz.id) : "";

  const { isConnected, submitAnswer } = useStudentSocket({
    sessionId,
    quizId: quiz?.id,
    studentId,
    name: studentName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`,
    onSessionControl: (payload) => {
      const { action } = payload || {};
      if (action === "init") {
        setIsTeacherLed(!!payload.isTeacherLed);
        if (payload.isTeacherLed && payload.currentQuestionIndex !== undefined) {
          setCurrentIndex(payload.currentQuestionIndex);
        }
        if (payload.timer !== undefined && payload.timerActive) {
          setLiveTimer(payload.timer);
        }
      } else if (action === "pause") {
        setIsPaused(true);
      } else if (action === "resume") {
        setIsPaused(false);
      } else if (action === "end") {
        clearSession();
        setIsFinished(true);
      } else if (action === "teacher_led") {
        setIsTeacherLed(!!payload.isTeacherLed);
      } else if (action === "set_question_index") {
        setCurrentIndex(Number(payload.index || 0));
        setCurrentSelection(null);
      } else if (action === "set_timer") {
        setLiveTimer(payload.timer);
        if (payload.timer === 0 && payload.timerActive === false) {
          clearSession();
          setIsFinished(true);
        }
      } else if (action === "reset_student") {
        if (payload.studentId === studentId) {
          alert("Your progress has been reset by the teacher.");
          clearSession();
          setCurrentIndex(0);
          setSelectedAnswers({});
          setCurrentSelection(null);
          setStarted(false);
          setIsFinished(false);
          setStartTime(null);
          setLiveTimer(null);
          setRecoveredSession(false);
        }
      }
    },
    onError: (message) => {
      if (message === "ROOM_LOCKED") {
        setRoomLocked(true);
      }
    }
  });

  // Reset question timer and log view when question changes
  useEffect(() => {
    questionStartTime.current = Date.now();
    if (started && quiz) {
      interactionLog.logView(currentIndex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, started]);

  // Start heartbeat tracking when quiz begins; stop when finished
  useEffect(() => {
    if (started && !isFinished) {
      interactionLog.startHeartbeat();
    }
    if (isFinished) {
      interactionLog.stopHeartbeat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, isFinished]);

  // Global Timer logic
  useEffect(() => {
    if (!started || isFinished || isPaused || quiz?.hasTimeLimit === false || !quiz?.durationMinutes || !startTime) return;
    
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const totalMs = quiz.durationMinutes * 60 * 1000;
      const remaining = Math.max(0, totalMs - elapsedMs);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setIsFinished(true);
        clearSession();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [started, isFinished, isPaused, quiz?.durationMinutes, quiz?.hasTimeLimit, startTime, clearSession]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartQuiz = () => {
    const cleanName = studentName.trim();
    if (!cleanName) {
      setError("Please enter your name to start");
      return;
    }
    const finalId = studentId || `${cleanName.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString(36)}`;
    setStudentId(finalId);
    setError(null);
    interactionLog.resetLog();
    const now = Date.now();
    setStartTime(now);
    setStarted(true);
    // Log the first question view after state update
    setTimeout(() => interactionLog.logView(0), 50);
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setCurrentSelection(null);
    setIsFinished(false);
    setStarted(true);
  };

  const handleSelectOption = (optionId: string) => {
    if (isPaused) return;

    // ── Interaction log ──────────────────────────────────────────
    const selectedChoice = quiz?.questions[currentIndex].choices.find(
      (c) => ((c as any)._id?.toString() || c.id) === optionId
    );
    if (currentSelection) {
      // Student is changing their answer
      interactionLog.logChange(currentIndex, currentSelection, optionId, selectedChoice?.text);
    } else {
      // First selection on this question
      interactionLog.logSelect(currentIndex, optionId, selectedChoice?.text);
    }
    // ────────────────────────────────────────────────────────────

    setCurrentSelection(optionId);

    if (quiz && studentId) {
      const currentQuestion = quiz.questions[currentIndex];
      const correctChoice   = currentQuestion.choices.find(c => c.isCorrect);
      const responseTime    = Math.round((Date.now() - questionStartTime.current) / 1000);

      submitAnswer({
        questionId:   currentQuestion.id,
        choiceId:     optionId,
        choiceText:   selectedChoice?.text,
        isCorrect:    optionId === (correctChoice?.id || (correctChoice as any)?._id?.toString()),
        responseTime,
      });
    }
  };

  const handleNext = async () => {
    if (!currentSelection || isPaused) return;

    const currentQuestion = quiz!.questions[currentIndex];
    const qId = (currentQuestion as any)._id?.toString() || currentQuestion.id;
    const updated = { ...selectedAnswers, [qId]: currentSelection };
    setSelectedAnswers(updated);

    if (currentIndex < quiz!.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentSelection(null);
    } else {
      // ── Quiz finished: build & submit interaction log ────────
      setIsFinished(true);
      clearSession();

      if (quiz && studentId) {
        const payload = interactionLog.buildFinalLog(quiz, updated, startTime);
        const logId   = await interactionLog.submitLog(payload);
        if (logId) {
          setSubmittedLogId(logId);
          console.log("[QuizLog] Submitted interaction log:", logId);
        }
      }
    }
  };

  const handleRestartFresh = () => {
    clearSession();
    setStudentId("");
    setStudentName("");
    setCurrentIndex(0);
    setSelectedAnswers({});
    setCurrentSelection(null);
    setStarted(false);
    setIsFinished(false);
    setStartTime(null);
    setTimeLeft(null);
    setRecoveredSession(false);
  };

  const calcScore = () => {
    if (!quiz) return { correct: 0, total: 0 };
    const correct = quiz.questions.filter(q => {
      const selected  = selectedAnswers[q.id];
      const correctCh = q.choices.find(c => c.isCorrect);
      return selected && selected === correctCh?.id;
    }).length;
    return { correct, total: quiz.questions.length };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  Loading & Error Screens
  // ═══════════════════════════════════════════════════════════════════════════
  if (roomLocked) {
    return (
      <div className="quiz-bg fixed inset-0 flex flex-col items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <QuizLangSwitcher />
          <ThemeSwitcher />
        </div>
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl">
          <CardContent className="text-center py-12 px-8 flex flex-col items-center gap-6">
            <div className="text-6xl mb-2">🔒</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">{t.monitoring.accessCode.roomLocked}</h2>
              <p className="text-white/60">{t.play.roomLocked}</p>
            </div>
            <Button className="w-full h-14 rounded-2xl font-bold bg-white text-violet-600 shadow-xl" onPress={() => router.push("/")}>
              {t.play.backHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quiz-bg fixed inset-0 flex flex-col items-center justify-center gap-4">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <QuizLangSwitcher />
          <ThemeSwitcher />
        </div>
        <Spinner size="lg" className="text-white" />
        <p className="text-white/70 font-semibold text-lg">{t.play.loading}</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="quiz-bg fixed inset-0 flex flex-col items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <QuizLangSwitcher />
          <ThemeSwitcher />
        </div>
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl">
          <CardContent className="text-center py-12 px-8 flex flex-col items-center gap-6">
            <div className="text-6xl mb-2">🤔</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">{t.play.oops}</h2>
              <p className="text-white/60">{error || t.play.notFound}</p>
            </div>
            <Button className="w-full h-14 rounded-2xl font-bold bg-white text-violet-600 shadow-xl" onPress={() => router.push("/")}>
              {t.play.backHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Finished Screen
  // ═══════════════════════════════════════════════════════════════════════════
  if (isFinished) {
    return (
      <div className="quiz-bg fixed inset-0 overflow-y-auto">
        <Blobs />
        <div className="relative min-h-full flex flex-col items-center justify-center px-4 py-10">
          <StudentResultScreen 
            quizId={quiz.id}
            studentId={studentId}
            studentName={studentName}
            selectedAnswers={selectedAnswers}
            logId={submittedLogId}
            onPlayAgain={handlePlayAgain}
            onGoHome={() => router.push("/")}
          />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Welcome Screen
  // ═══════════════════════════════════════════════════════════════════════════
  if (!started) {
    return (
      <div className="quiz-bg fixed inset-0 overflow-y-auto">
        <Blobs />

        {/* ── Floating controls: Language + Theme ─────────────────────── */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <QuizLangSwitcher />
          <ThemeSwitcher />
        </div>

        <div className="relative min-h-full flex flex-col items-center justify-center px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Card
              className="w-full rounded-[32px] border-0 shadow-2xl overflow-hidden bg-white dark:bg-zinc-900"
              data-ai-context-type="quiz"
              data-ai-context-name={quiz.title}
              data-ai-context-data={JSON.stringify({ title: quiz.title, description: quiz.description, questionCount: quiz.questions.length, durationMinutes: quiz.durationMinutes, hasTimeLimit: quiz.hasTimeLimit, category: quiz.category, code })}
            >
              <div className="h-32 bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <span className="text-6xl relative z-10 drop-shadow-lg">📚</span>
              </div>

              <CardContent className="text-center py-10 px-8 flex flex-col items-center gap-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">{t.play.readyToStart}</span>
                  <h1 className="text-3xl font-black text-zinc-800 dark:text-white leading-tight">{quiz.title}</h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">{quiz.description}</p>
                </div>

                <div className="w-full space-y-2 mt-2">
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{t.play.yourName}</label>
                    <Input
                      placeholder={t.play.namePlaceholder}
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                      }}
                      size={"lg" as any}
                      variant={"bordered" as any}
                      color={"primary" as any}
                      className="mt-1 bg-white dark:bg-zinc-800 rounded-2xl"
                    />
                  </div>
                </div>

                <div className="flex gap-4 w-full mt-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700/50">
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{t.play.questions}</p>
                    <p className="text-xl font-black text-zinc-800 dark:text-white">{quiz.questions.length}</p>
                  </div>
                  <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{t.play.duration}</p>
                    <p className="text-xl font-black text-zinc-800 dark:text-white">{quiz.hasTimeLimit !== false ? `${quiz.durationMinutes}m` : t.play.noLimit}</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  isDisabled={!studentName.trim()}
                  className="w-full h-16 rounded-2xl font-black text-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl hover:shadow-violet-500/30 hover:-translate-y-1 transition-all"
                  onPress={handleStartQuiz}
                >
                  {t.play.startQuiz}
                </Button>

                <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold transition-colors">
                  {t.play.notNow}
                </button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Quiz Player
  // ═══════════════════════════════════════════════════════════════════════════
  const question = quiz.questions[currentIndex];

  return (
    <div className="quiz-bg fixed inset-0 overflow-y-auto">
      <Blobs />

      {/* ── Session Recovered Banner ───────────────────────────────────────── */}
      <AnimatePresence>
        {recoveredSession && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-500/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-400/30"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span className="font-bold text-sm">{t.play.sessionRestored}</span>
            <button
              onClick={handleRestartFresh}
              className="text-xs underline opacity-70 hover:opacity-100 ml-1 font-medium"
            >
              {t.play.startOver}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pause Overlay ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          >
            <div className="text-5xl">⏸️</div>
            <p className="text-white font-black text-xl">{t.play.quizPaused}</p>
            <p className="text-white/60 text-sm">{t.play.waitingResume}</p>
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

            {/* Right side: connection indicator + language + theme */}
            <div className="flex items-center gap-2">
              {/* Connection indicator */}
              <div className={`flex items-center gap-1.5 backdrop-blur-md border border-white/25 rounded-full px-3 py-1.5 ${isConnected ? "bg-emerald-500/20" : "bg-white/20 dark:bg-white/10"}`}>
                {isConnected
                  ? <Wifi    className="w-3.5 h-3.5 text-emerald-300" />
                  : <WifiOff className="w-3.5 h-3.5 text-white/50" />
                }
                <span className={`font-bold text-xs uppercase tracking-tight ${isConnected ? "text-emerald-300" : "text-white/50"}`}>
                  {isConnected ? t.play.live : t.play.offline}
                </span>
              </div>

              {/* Language switcher */}
              <QuizLangSwitcher />

              {/* Dark / light mode */}
              <ThemeSwitcher />
            </div>
          </div>
          
          {/* Global Timer Display */}
          {liveTimer !== null ? (
            <div className={`flex items-center justify-center py-2 px-4 rounded-xl border font-mono font-bold text-lg mb-2 shadow-sm transition-colors ${
              liveTimer <= 60 
                ? "bg-red-500/90 text-white border-red-400 animate-pulse" 
                : "bg-white/20 dark:bg-black/20 text-white border-white/25"
            }`}>
              ⏱ {Math.floor(liveTimer / 60)}:{String(liveTimer % 60).padStart(2, '0')}
            </div>
          ) : (
            timeLeft !== null && quiz.hasTimeLimit !== false && quiz.durationMinutes > 0 && (
              <div className={`flex items-center justify-center py-2 px-4 rounded-xl border font-mono font-bold text-lg mb-2 shadow-sm transition-colors ${
                timeLeft < 60000 
                  ? "bg-red-500/90 text-white border-red-400 animate-pulse" 
                  : "bg-white/20 dark:bg-black/20 text-white border-white/25"
              }`}>
                ⏱ {Math.floor(timeLeft / 60000)}:{String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0')}
              </div>
            )
          )}

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
              <Card
                className="w-full rounded-[32px] border-0 shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden"
                data-ai-context-type="question"
                data-ai-context-name={question.text}
                data-ai-context-data={JSON.stringify({ questionIndex: currentIndex + 1, total: quiz.questions.length, questionId: question.id, choiceCount: question.choices.length, category: quiz.category, studentName })}
              >
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
                            <label className={`font-bold ${isSelected ? "text-violet-700 dark:text-violet-300" : "text-zinc-700 dark:text-zinc-200"}`}>
                              {choice.text}
                            </label>
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
              {isTeacherLed ? (
                <div className="w-full py-5 rounded-2xl font-black text-lg text-center bg-white/10 text-white/80 border border-white/20 shadow-xl">
                  {currentSelection 
                    ? t.play.waitingNext
                    : t.play.selectAnswer
                  }
                </div>
              ) : (
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
                  {currentIndex === quiz.questions.length - 1 ? t.play.finishQuiz : t.play.nextQuestion}
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ── Shared UI Helpers ──────────────────────────────────────────────────────────

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

// ── QuizLangSwitcher ─────────────────────────────────────────────
// A compact language picker styled for the quiz's dark gradient background.
// Uses white glassmorphism for the trigger button and a dark card for the dropdown.

import { useLang as _useLang } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, type Language } from "@/lib/i18n/translations";

function QuizLangSwitcher() {
  const { lang, setLang } = _useLang();
  const [langOpen, setLangOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <button
        suppressHydrationWarning
        onClick={() => setLangOpen((v) => !v)}
        aria-label="Change language"
        className="
          h-10 px-3 rounded-2xl
          bg-white/20 hover:bg-white/30
          backdrop-blur-sm border border-white/30
          flex items-center gap-1.5
          text-white transition-all duration-200
          hover:scale-105 active:scale-95
          shadow-lg text-sm font-bold
        "
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline text-xs">{current.code.toUpperCase()}</span>
        <svg
          className={`w-3 h-3 opacity-70 transition-transform ${langOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {langOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />

            {/* Dropdown */}
            <motion.div
              key="lang-dropdown"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-44 z-50 rounded-2xl overflow-hidden
                         bg-zinc-900/95 backdrop-blur-xl border border-white/10
                         shadow-[0_20px_60px_rgba(0,0,0,0.5)] py-1.5"
            >
              {LANGUAGES.map((l) => (
                <button
                  suppressHydrationWarning
                  key={l.code}
                  onClick={() => { setLang(l.code as Language); setLangOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all
                    ${
                      lang === l.code
                        ? "bg-violet-600/25 text-violet-200 font-semibold"
                        : "text-zinc-300 hover:bg-white/8 hover:text-white"
                    }
                  `}
                >
                  <span className="text-lg">{l.flag}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold">{l.code.toUpperCase()}</p>
                    <p className="text-[10px] opacity-60">{l.nativeName}</p>
                  </div>
                  {lang === l.code && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
