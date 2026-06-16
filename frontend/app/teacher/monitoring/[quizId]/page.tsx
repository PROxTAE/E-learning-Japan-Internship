"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMonitoringStore } from "@/store/monitoringStore";
import { monitoringApi } from "@/services/monitoringApi";
import { MonitoringStats } from "@/components/teacher/monitoring/MonitoringStats";
import { QuizSessionHeader } from "@/components/teacher/monitoring/QuizSessionHeader";
import { MonitoringGrid } from "@/components/teacher/monitoring/MonitoringGrid";
import { Leaderboard } from "@/components/teacher/monitoring/Leaderboard";
import { VisualAnalytics } from "@/components/teacher/monitoring/VisualAnalytics";
import { ConfirmModal } from "@/components/teacher/monitoring/ConfirmModal";
import { ShareQuizModal } from "@/components/teacher/dashboard/ShareQuizModal";
import { useConnectionToast } from "@/components/teacher/monitoring/ConnectionToast";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Tabs, TabList, Tab, TabPanel } from "@heroui/react";
import { quizApi } from "@/services/quizApi";
import { ArrowLeft, Users, MonitorPlay } from "lucide-react";
import type { Question } from "@/types/teacher/monitoring.types";

export default function MonitoringQuizPage() {
  const params  = useParams();
  const router  = useRouter();
  const quizId  = params.quizId as string;
  const { t } = useLang();

  const {
    loading,
    setLoading,
    setSessionData,
    setQuestions,
    addAnswer,
    updateStudent,
    updateStats,
    stats,
    uiState,
    updateUIState,
    questions: storeQuestions,
    
    // Store values & actions
    timer,
    timerActive,
    tickTimer,
    students,
  } = useMonitoringStore();

  const [quizTitle, setQuizTitle] = useState("Live Quiz Session");
  const [quizCode,  setQuizCode]  = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionLabel, setSessionLabel] = useState("");
  const [quiz, setQuiz] = useState<any | null>(null);
  const [shareQuiz, setShareQuiz] = useState<any | null>(null);

  const { notify, ToastContainer } = useConnectionToast();

  // sessionId MUST match what Play page uses: quiz-session-{quiz._id}
  const sessionId = `quiz-session-${quizId}`;

  // ── Timer Loop Effect ───────────────────────────────────────────
  useEffect(() => {
    if (!timerActive || timer <= 0) return;

    const interval = setInterval(() => {
      const newTimer = timer - 1;
      monitoringApi.controlSession(sessionId, "set_timer", { timer: newTimer, timerActive: newTimer > 0 });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timer, sessionId]);

  // Timer Times Up Notification
  useEffect(() => {
    if (timer === 0 && timerActive) {
      alert("Time is up! The session timer has expired.");
      monitoringApi.controlSession(sessionId, "set_timer", { timer: 0, timerActive: false });
    }
  }, [timer, timerActive, sessionId]);


  // ── Step 1: Load quiz questions into store ────────────────────────
  useEffect(() => {
    if (!quizId) return;
    quizApi.getQuiz(quizId)
      .then((quiz) => {
        setQuiz(quiz);
        setQuizTitle(quiz.title);
        setQuizCode(quiz.accessCode || "");

        // Map to monitoring Question shape (preserve real MongoDB _id as id)
        const monitoringQuestions: Question[] = (quiz.questions ?? []).map((q: any, i: number) => ({
          id:     q.id || q._id?.toString() || `q-${i}`,
          number: i + 1,
          title:  q.text || q.title || `Question ${i + 1}`,
          type:   q.type || "multiple_choice",
          difficulty: quiz.difficulty || "medium",
          choices: (q.choices ?? []).map((c: any) => ({
            id:         c.id || c._id?.toString() || c.text,
            text:       c.text,
            isCorrect:  c.isCorrect ?? false,
            answerCount: 0,
          })),
          averageResponseTime: 0,
          correctPercentage:   0,
        }));

        console.log("[monitoring] Loaded questions:", monitoringQuestions.map(q => ({ id: q.id, title: q.title.slice(0, 30) })));
        setQuestions(monitoringQuestions);
      })
      .catch((err) => console.error("[monitoring] Failed to load quiz:", err));
  }, [quizId, setQuestions]);

  // ── Step 2: Load initial live session state ───────────────────────
  useEffect(() => {
    if (!quizId) return;
    const init = async () => {
      setLoading(true);
      try {
        const data = await monitoringApi.getSessionState(sessionId);
        // setSessionData won't overwrite questions (guard in store)
        setSessionData(data);
      } catch (err) {
        console.error("[monitoring] Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [sessionId, setLoading, setSessionData, quizId]);

  // ── Step 3: Real-time Socket.IO listeners ─────────────────────────
  useEffect(() => {
    if (!quizId) return;

    const cleanup = monitoringApi.setupRealtimeListeners(
      sessionId,
      {
        onAnswerUpdate: (answer) => {
          console.log("[monitoring] answer_update received:", answer.studentId, answer.questionId);
          addAnswer(answer);
        },
        onStudentJoined: (student) => {
          const normalized = { ...student, id: student.id || (student as any).studentId || "" };
          if (normalized.isOnline !== false) {
            notify({ type: "join",  studentName: normalized.name });
          } else {
            notify({ type: "leave", studentName: normalized.name });
          }
          updateStudent(normalized);
        },
        onStatsUpdate: (newStats) => updateStats(newStats),
        onStudentRemoved: (studentId) => {
          useMonitoringStore.getState().removeStudent(studentId);
        },
        onSessionControl: (payload) => {
          const { action } = payload;
          if (action === "pause") {
            updateUIState({ isPaused: true });
          } else if (action === "resume") {
            updateUIState({ isPaused: false });
          } else if (action === "lock") {
            useMonitoringStore.getState().setRoomLocked(true);
          } else if (action === "unlock") {
            useMonitoringStore.getState().setRoomLocked(false);
          } else if (action === "teacher_led") {
            useMonitoringStore.getState().setTeacherLed(!!payload.isTeacherLed);
          } else if (action === "set_question_index") {
            useMonitoringStore.getState().setCurrentQuestionIndex(Number(payload.index || 0));
          } else if (action === "set_timer") {
            useMonitoringStore.getState().setTimer(Number(payload.timer || 0));
            useMonitoringStore.getState().setTimerActive(!!payload.timerActive);
          } else if (action === "regenerate_code") {
            if (payload.accessCode) {
              useMonitoringStore.getState().setAccessCode(payload.accessCode);
              setQuizCode(payload.accessCode);
            }
          }
        }
      },
      (snapshot) => {
        console.log("[monitoring] snapshot restored:", snapshot.students.length, "students,", snapshot.answers.length, "answers");
        setSessionData({
          students:  snapshot.students,
          questions: storeQuestions.length > 0 ? storeQuestions : (undefined as any),
          answers:   snapshot.answers,
          stats:     snapshot.stats,
        });
        if (snapshot.isPaused !== undefined) {
          updateUIState({ isPaused: snapshot.isPaused });
        }
      }
    );

    return () => cleanup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, quizId]);

  // ── Pause/Resume/End ──────────────────────────────────────────────
  const handleStateChange = (newState: Partial<typeof uiState>) => {
    if ("isEnded" in (newState as any)) {
      setShowEndConfirm(true);
      return;
    }

    if ("isPaused" in newState) {
      monitoringApi.controlSession(sessionId, newState.isPaused ? "pause" : "resume");
    }
    updateUIState(newState);
  };

  const confirmEndSession = () => {
    monitoringApi.controlSession(sessionId, "end", { sessionLabel });
    router.push(`/teacher/quizzes/${quizId}/history`);
  };

  // ── Debug bar (dev only) ──────────────────────────────────────────
  const debugInfo = process.env.NODE_ENV === "development"
    ? `Session: ${sessionId} | Questions: ${storeQuestions.length} | Students: ${stats.totalStudents}`
    : null;

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative w-20 h-20"
        >
          <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
        </motion.div>
        <p className="mt-8 text-violet-400 font-black tracking-[0.3em] uppercase text-xs animate-pulse">
          Connecting to Live Session…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] text-foreground p-4 md:p-6 flex flex-col relative">
      <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto space-y-4 flex-1">

        {/* Top bar: back + waiting room */}
        <div className="flex items-center justify-between gap-3">
          <button
            suppressHydrationWarning
            onClick={() => router.push("/teacher/quizzes")}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-default-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quiz Library
          </button>

          <div className="flex items-center gap-2">
            <button
              suppressHydrationWarning
              onClick={() => window.open(`/present/${quizId}`, "_blank", "noopener")}
              title={t.play.waitingProjectorHint}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-default-300 hover:bg-gray-50 dark:hover:bg-white/15 transition-colors w-fit"
            >
              <MonitorPlay className="w-4 h-4" />
              {t.play.waitingOpenProjector}
            </button>

            <button
              suppressHydrationWarning
              onClick={() => router.push(`/teacher/waiting-room/${quizId}`)}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors w-fit"
            >
              <Users className="w-4 h-4" />
              {t.play.waitingTitle}
            </button>
          </div>
        </div>

        {/* Dev debug bar */}
        {debugInfo && (
          <div className="text-[10px] font-mono text-violet-400 bg-violet-500/10 rounded px-3 py-1">
            🔧 {debugInfo}
          </div>
        )}

        <QuizSessionHeader
          quizTitle={quizTitle}
          quizCode={quizCode}
          state={uiState}
          onStateChange={handleStateChange}
          sessionId={sessionId}
          onShare={quiz ? () => setShareQuiz(quiz) : undefined}
        />

        <MonitoringStats stats={stats} />

        {/* Monitoring views grid */}
        <div className="flex-1 min-h-0 mt-4">
          <Tabs aria-label="Monitoring Views">
            <TabList className="bg-white dark:bg-[#0f0f1a]  dark:border-white/10 mb-4 rounded-xl p-1 ">
              <Tab id="grid">Live Matrix</Tab>
              <Tab id="analytics">Visual Analytics</Tab>
              <Tab id="leaderboard">Leaderboard</Tab>
            </TabList>
            <TabPanel id="grid" className="p-0">
              <MonitoringGrid />
            </TabPanel>
            <TabPanel id="analytics" className="p-0">
              <VisualAnalytics />
            </TabPanel>
            <TabPanel id="leaderboard" className="p-0">
              <Leaderboard />
            </TabPanel>
          </Tabs>
        </div>
      </div>

      {/* Student join/leave toast notifications */}
      {ToastContainer}

      {/* HeroUI Confirm Modal for ending session */}
      <ConfirmModal
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={confirmEndSession}
        title={t.monitoring.controls.endSessionTitle}
        message={t.monitoring.controls.endSessionConfirm}
        confirmText={t.monitoring.controls.endSessionText}
        cancelText={t.modal.cancel}
        isDanger={true}
        inputLabel={t.monitoring.controls.sessionLabelLabel}
        inputPlaceholder={t.monitoring.controls.sessionLabelPlaceholder}
        inputValue={sessionLabel}
        onInputChange={setSessionLabel}
      />

      {shareQuiz && (
        <ShareQuizModal
          quiz={shareQuiz}
          isOpen={true}
          onClose={() => setShareQuiz(null)}
        />
      )}
    </div>
  );
}
