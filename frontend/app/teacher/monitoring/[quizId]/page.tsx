"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMonitoringStore } from "@/store/monitoringStore";
import { monitoringApi } from "@/services/monitoringApi";
import { MonitoringStats } from "@/components/teacher/monitoring/MonitoringStats";
import { QuizSessionHeader } from "@/components/teacher/monitoring/QuizSessionHeader";
import { MonitoringGrid } from "@/components/teacher/monitoring/MonitoringGrid";
import { useConnectionToast } from "@/components/teacher/monitoring/ConnectionToast";
import { motion } from "framer-motion";
import { quizApi } from "@/services/quizApi";
import { ArrowLeft } from "lucide-react";
import type { Question } from "@/types/teacher/monitoring.types";

export default function MonitoringQuizPage() {
  const params  = useParams();
  const router  = useRouter();
  const quizId  = params.quizId as string;

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
  } = useMonitoringStore();

  const [quizTitle, setQuizTitle] = useState("Live Quiz Session");
  const [quizCode,  setQuizCode]  = useState("");

  const { notify, ToastContainer } = useConnectionToast();

  // sessionId MUST match what Play page uses: quiz-session-{quiz._id}
  const sessionId = `quiz-session-${quizId}`;

  // ── Step 1: Load quiz questions into store ────────────────────────
  useEffect(() => {
    if (!quizId) return;
    quizApi.getQuiz(quizId)
      .then((quiz) => {
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
  // Register socket IMMEDIATELY on mount — don't wait for loading.
  // The `session_joined` and `session_state` events carry the full snapshot
  // and will overwrite whatever the REST call returned.
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
          // Normalize id so grid dedup doesn't drop this student
          const normalized = { ...student, id: student.id || (student as any).studentId || "" };
          if (normalized.isOnline !== false) {
            // true join
            notify({ type: "join",  studentName: normalized.name });
          } else {
            // came in via student_left path
            notify({ type: "leave", studentName: normalized.name });
          }
          updateStudent(normalized);
        },
        onStatsUpdate: (newStats) => updateStats(newStats),
      },
      // onSnapshot: full sync on every connect/reconnect
      (snapshot) => {
        console.log("[monitoring] snapshot restored:", snapshot.students.length, "students,", snapshot.answers.length, "answers");
        setSessionData({
          students:  snapshot.students,
          questions: storeQuestions.length > 0 ? storeQuestions : undefined as any,
          answers:   snapshot.answers,
          stats:     snapshot.stats,
        });
      }
    );

    return () => cleanup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, quizId]);

  // ── Pause/Resume/End ──────────────────────────────────────────────
  const handleStateChange = (newState: Partial<typeof uiState>) => {
    if ("isEnded" in (newState as any)) {
      if (window.confirm("Are you sure you want to end the session? This will finalize scores and save them permanently.")) {
        monitoringApi.controlSession(sessionId, "end");
        router.push("/teacher/quizzes");
      }
      return;
    }

    if ("isPaused" in newState) {
      monitoringApi.controlSession(sessionId, newState.isPaused ? "pause" : "resume");
    }
    updateUIState(newState);
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
      <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto space-y-4">

        {/* Back button */}
        <button
          suppressHydrationWarning
          onClick={() => router.push("/teacher/quizzes")}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-default-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quiz Library
        </button>

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
        />

        <MonitoringStats stats={stats} />

        <div className="flex-1 min-h-0">
          <MonitoringGrid />
        </div>
      </div>

      {/* Student join/leave toast notifications */}
      {ToastContainer}
    </div>
  );
}
