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
import {
  OrangeFlowerCharacter,
  OliveBlobCharacter,
  LimeStarCharacter,
  GreenDropletCharacter,
} from "@/components/shared/ThemeCharacters";

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
        <ThemeBackground />
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
      <div className="quiz-bg fixed inset-0 overflow-y-auto bg-bg-primary select-none">
        <ThemeBackground />

        {/* ── Floating controls: Language + Theme ─────────────────────── */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <QuizLangSwitcher />
          <ThemeSwitcher />
        </div>

        <div className="relative min-h-full flex flex-col items-center justify-center px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Card
              className="w-full rounded-[24px] retro-card bg-bg-card shadow-2xl overflow-hidden"
              data-ai-context-type="quiz"
              data-ai-context-name={quiz.title}
              data-ai-context-data={JSON.stringify({ title: quiz.title, description: quiz.description, questionCount: quiz.questions.length, durationMinutes: quiz.durationMinutes, hasTimeLimit: quiz.hasTimeLimit, category: quiz.category, code })}
            >
              <div className="h-36 bg-brand-primary/10 flex items-center justify-center relative border-b-3 border-text-main overflow-hidden">
                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--theme-text-main) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <div className="flex gap-6 items-center">
                  <OrangeFlowerCharacter size={80} />
                  <LimeStarCharacter size={80} />
                </div>
              </div>

              <CardContent className="text-center py-10 px-8 flex flex-col items-center gap-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">{t.play.readyToStart}</span>
                  <h1 className="text-3xl font-black text-text-main leading-tight uppercase">{quiz.title}</h1>
                  <p className="text-text-muted text-sm font-semibold">{quiz.description}</p>
                </div>

                <div className="w-full space-y-2 mt-2">
                  <div className="text-left">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t.play.yourName}</label>
                    <Input
                      placeholder={t.play.namePlaceholder}
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                      }}
                      size={"lg" as any}
                      variant={"bordered" as any}
                      color={"primary" as any}
                      className="mt-1 bg-bg-secondary text-text-main font-bold border-3 border-text-main rounded-[16px] overflow-hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-4 w-full mt-2 bg-bg-secondary rounded-[16px] p-4 border-3 border-text-main">
                  <div className="flex-1">
                    <p className="text-[10px] text-text-muted uppercase font-black tracking-wider">{t.play.questions}</p>
                    <p className="text-xl font-black text-text-main">{quiz.questions.length}</p>
                  </div>
                  <div className="w-[3px] bg-text-main" />
                  <div className="flex-1">
                    <p className="text-[10px] text-text-muted uppercase font-black tracking-wider">{t.play.duration}</p>
                    <p className="text-xl font-black text-text-main">{quiz.hasTimeLimit !== false ? `${quiz.durationMinutes}m` : t.play.noLimit}</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  isDisabled={!studentName.trim()}
                  className="w-full h-16 rounded-full font-black text-xl bg-brand-primary text-white shadow-xl retro-btn cursor-pointer"
                  onPress={handleStartQuiz}
                >
                  {t.play.startQuiz}
                </Button>

                <button onClick={() => router.push("/")} className="text-text-muted hover:text-text-main text-sm font-bold transition-colors">
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
    <div className="quiz-bg fixed inset-0 overflow-y-auto bg-bg-primary select-none">
      <ThemeBackground />

      {/* ── Session Recovered Banner ───────────────────────────────────────── */}
      <AnimatePresence>
        {recoveredSession && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-500/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl border-3 border-text-main"
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
            <div className="text-5xl animate-bounce">⏸️</div>
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
              className="w-10 h-10 rounded-[16px] bg-bg-card border-3 border-text-main text-text-main flex items-center justify-center hover:bg-bg-secondary hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--theme-text-main)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--theme-text-main)] transition-all cursor-pointer shadow-[2px_2px_0px_var(--theme-text-main)]"
            >
              <ChevronLeft className="w-5 h-5 stroke-[3]" />
            </button>

            <span className="text-text-main font-black text-sm tracking-widest bg-bg-card px-4 py-1.5 rounded-[12px] border-3 border-text-main shadow-[2px_2px_0px_var(--theme-text-main)]">
              {String(currentIndex + 1).padStart(2, "0")}{" "}
              <span className="text-text-muted font-black">/</span>{" "}
              {String(quiz.questions.length).padStart(2, "0")}
            </span>

            {/* Right side: connection indicator + language + theme */}
            <div className="flex items-center gap-2">
              {/* Connection indicator */}
              <div className={`flex items-center gap-1.5 bg-bg-card border-3 border-text-main rounded-full px-3 py-1 ${isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-text-muted"}`}>
                {isConnected
                  ? <Wifi    className="w-3.5 h-3.5" />
                  : <WifiOff className="w-3.5 h-3.5" />
                }
                <span className="font-black text-xs uppercase tracking-tight">
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
            <div className={`flex items-center justify-center py-2 px-4 rounded-[16px] border-3 border-text-main font-mono font-black text-lg mb-2 shadow-[2px_2px_0px_var(--theme-text-main)] transition-colors ${
              liveTimer <= 60 
                ? "bg-red-500 text-white animate-pulse" 
                : "bg-bg-card text-text-main"
            }`}>
              ⏱ {Math.floor(liveTimer / 60)}:{String(liveTimer % 60).padStart(2, '0')}
            </div>
          ) : (
            timeLeft !== null && quiz.hasTimeLimit !== false && quiz.durationMinutes > 0 && (
              <div className={`flex items-center justify-center py-2 px-4 rounded-[16px] border-3 border-text-main font-mono font-black text-lg mb-2 shadow-[2px_2px_0px_var(--theme-text-main)] transition-colors ${
                timeLeft < 60000 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-bg-card text-text-main"
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
                className="w-full rounded-[24px] retro-card bg-bg-card overflow-hidden"
                data-ai-context-type="question"
                data-ai-context-name={question.text}
                data-ai-context-data={JSON.stringify({ questionIndex: currentIndex + 1, total: quiz.questions.length, questionId: question.id, choiceCount: question.choices.length, category: quiz.category, studentName })}
              >
                <CardContent className="px-6 sm:px-8 pt-8 sm:pt-10 pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                      {quiz.category || "General"}
                    </span>
                    <GreenDropletCharacter size={40} className="transform rotate-12" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-text-main leading-snug">
                    {question.text}
                  </h2>
                  {question.imageUrl && (
                    <div className="mt-6 rounded-[16px] overflow-hidden border-3 border-text-main">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={question.imageUrl} alt="Question" className="w-full max-h-64 object-contain bg-bg-secondary" />
                    </div>
                  )}
                </CardContent>

                <CardContent className="px-6 sm:px-8 pb-8 sm:pb-10 pt-4">
                  <RadioGroup
                    value={currentSelection || ""}
                    onChange={(val) => handleSelectOption(val)}
                    className="flex flex-col gap-4"
                  >
                    {question.choices.map((choice, idx) => {
                      const isSelected = currentSelection === choice.id;
                      const labels = ["A", "B", "C", "D", "E"];
                      return (
                        <Radio
                          key={choice.id}
                          value={choice.id}
                          className={`
                            w-full flex items-center gap-4 px-5 py-4 rounded-[20px] border-3 transition-all cursor-pointer
                            ${isSelected
                              ? "border-text-main bg-brand-primary/25 shadow-[4px_4px_0px_var(--theme-text-main)] translate-x-[-2px] translate-y-[-2px]"
                              : "border-text-main bg-bg-card hover:bg-bg-secondary hover:shadow-[4px_4px_0px_var(--theme-text-main)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                            }
                          `}
                        >
                          <div className={`
                            shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all border-3 border-text-main
                            ${isSelected ? "bg-brand-primary text-white" : "bg-bg-secondary text-text-main"}
                          `}>
                            {labels[idx] || idx + 1}
                          </div>

                          <div className="flex-1 flex items-center justify-between gap-4">
                            <label className="font-bold text-text-main cursor-pointer">
                              {choice.text}
                            </label>
                            {choice.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={choice.imageUrl} alt="" className="h-12 w-12 object-cover rounded-lg border-2 border-text-main shrink-0" />
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
                <div className="w-full py-5 rounded-[24px] font-black text-lg text-center bg-bg-card text-text-main border-3 border-text-main shadow-[4px_4px_0px_var(--theme-text-main)]">
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
                    w-full py-5 rounded-[20px] font-black text-lg shadow-xl transition-all
                    ${currentSelection && !isPaused
                      ? "bg-brand-secondary hover:bg-brand-secondary-hover text-white retro-btn cursor-pointer"
                      : "bg-bg-secondary text-text-muted border-3 border-text-muted/40 cursor-not-allowed opacity-60"
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

function ThemeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-20 select-none">
      <div className="absolute top-12 left-6 transform -rotate-12">
        <OrangeFlowerCharacter size={120} animate={true} />
      </div>
      <div className="absolute bottom-20 right-6 transform rotate-12">
        <OliveBlobCharacter size={120} animate={true} />
      </div>
      <div className="absolute left-[-20px] top-[45%] transform rotate-45 hidden sm:block">
        <LimeStarCharacter size={80} animate={true} />
      </div>
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
