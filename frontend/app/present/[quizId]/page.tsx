"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { quizApi } from "@/services/quizApi";
import { useTeacherSocket } from "@/hooks/useMonitoringSocket";
import { WaitingRoom } from "@/components/student/waiting-room/WaitingRoom";
import { ProgressRoadmap } from "@/components/present/ProgressRoadmap";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useLang } from "@/lib/i18n/LanguageContext";
import { PresentLeaderboard } from "@/components/present/PresentLeaderboard";
import { Home, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { isAuthenticated } from "@/lib/auth";
import type { Student, AnswerCellData } from "@/types/teacher/monitoring.types";

// sessionId MUST match the Play page / monitoring: quiz-session-{quizId}
function sessionIdFromQuiz(quizId: string) {
  return `quiz-session-${quizId}`;
}

interface QuestionInfo {
  id: string;
  number: number;
  title: string;
}

/**
 * Standalone projector / presentation view.
 *
 * Phase 1 — WaitingRoom (before teacher starts)
 * Phase 2 — ProgressRoadmap (after teacher starts, real-time progress)
 *
 * Lives outside the /teacher route group so it renders WITHOUT the teacher
 * sidebar + topbar — a clean full-screen display to put on a projector.
 * Display-only (no Start/Leave); the teacher starts the quiz from their
 * own monitoring screen.
 */
export default function PresentPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { t } = useLang();

  const [quiz, setQuiz] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<QuestionInfo[]>([]);
  const [scale, setScale] = useState(1.0);
  const [view, setView] = useState<"waiting" | "roadmap" | "leaderboard">("waiting");

  const sessionId = sessionIdFromQuiz(quizId);

  // ── Auth guard (no teacher layout here, so guard locally) ───────
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/teacher/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // ── Load quiz meta + questions ──────────────────────────────────
  useEffect(() => {
    if (!authChecked) return;
    quizApi
      .getQuiz(quizId)
      .then((q) => {
        setQuiz(q);
        // Map questions for the roadmap
        const mapped: QuestionInfo[] = (q.questions ?? []).map((qq: any, i: number) => ({
          id: qq.id || qq._id?.toString() || `q-${i}`,
          number: i + 1,
          title: qq.text || qq.title || `Question ${i + 1}`,
        }));
        setQuestions(mapped);
      })
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [quizId, authChecked]);

  // Keep track of answers state
  const [answers, setAnswers] = useState<AnswerCellData[]>([]);

  // ── Throttled batching ──────────────────────────────────────────
  // During a join/answer flood every socket event would otherwise
  // trigger its own React render. We mutate authoritative copies held
  // in refs and flush them to state at most ~every 150ms, so dozens of
  // events collapse into a single re-render.
  const studentsRef = useRef<Student[]>([]);
  const answersRef = useRef<AnswerCellData[]>([]);
  const studentsDirty = useRef(false);
  const answersDirty = useRef(false);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      if (studentsDirty.current) {
        studentsDirty.current = false;
        setStudents(studentsRef.current.slice());
      }
      if (answersDirty.current) {
        answersDirty.current = false;
        setAnswers(answersRef.current.slice());
      }
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, []);

  // ── Handle answer updates ───────────────────────────────────────
  const handleAnswerUpdate = useCallback((answer: AnswerCellData) => {
    const arr = answersRef.current;
    const idx = arr.findIndex(
      (a) => a.studentId === answer.studentId && a.questionId === answer.questionId
    );
    if (idx >= 0) arr[idx] = answer;
    else arr.push(answer);
    answersDirty.current = true;
    scheduleFlush();
  }, [scheduleFlush]);

  // ── Handle session control events ───────────────────────────────
  const handleSessionControl = useCallback((payload: any) => {
    if (payload.action === "start") {
      setSessionStarted(true);
    } else if (payload.action === "end") {
      setSessionStarted(false);
    }
  }, []);

  // ── Live roster via teacher socket ──────────────────────────────
  const { isConnected } = useTeacherSocket(
    {
      sessionId,
      quizId,
      onLobbyUpdate: (list) => {
        studentsRef.current = list;
        studentsDirty.current = true;
        scheduleFlush();
      },
      onStudentJoined: (student) => {
        const normalized = { ...student, id: student.id || (student as any).studentId || "" };
        const arr = studentsRef.current;
        const exists = arr.findIndex((s) => s.id === normalized.id);
        if (exists >= 0) {
          arr[exists] = { ...arr[exists], ...normalized, isOnline: true };
        } else {
          arr.push({ ...normalized, isOnline: true });
        }
        studentsDirty.current = true;
        scheduleFlush();
      },
      onStudentLeft: (student) => {
        const arr = studentsRef.current;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].id === student.id || arr[i].id === (student as any).studentId) {
            arr[i] = { ...arr[i], isOnline: false };
          }
        }
        studentsDirty.current = true;
        scheduleFlush();
      },
      onAnswerUpdate: handleAnswerUpdate,
      onSessionControl: handleSessionControl,
    },
    (snap) => {
      studentsRef.current = (snap.students || []).slice();
      studentsDirty.current = true;
      if (snap.answers && snap.answers.length > 0) {
        answersRef.current = snap.answers.slice();
        answersDirty.current = true;
        // If we have answers, the session has already started
        setSessionStarted(true);
        setView("roadmap");
      }
      scheduleFlush();
    }
  );

  if (!authChecked || loading) {
    return (
      <div className="quiz-bg fixed inset-0 flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  return (
    <div className="quiz-bg fixed inset-0 overflow-hidden flex flex-col">
      {/* Background blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-violet-800/30 dark:bg-violet-600/20 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {sessionStarted && view === "roadmap" && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-default-200/50 dark:border-default-700/30 bg-default-50/90 dark:bg-[#1a1a2e]/60 backdrop-blur-md text-default-700 dark:text-default-300 text-xs font-semibold select-none shadow-lg">
            <span className="min-w-[36px] text-center font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
              disabled={scale <= 0.5}
              className="w-5 h-5 flex items-center justify-center rounded-lg bg-default-100 dark:bg-white/5 hover:bg-default-200 dark:hover:bg-white/10 text-default-700 dark:text-white font-bold text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={() => setScale((prev) => Math.min(1.5, prev + 0.1))}
              disabled={scale >= 1.5}
              className="w-5 h-5 flex items-center justify-center rounded-lg bg-default-100 dark:bg-white/5 hover:bg-default-200 dark:hover:bg-white/10 text-default-700 dark:text-white font-bold text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              +
            </button>
            <div className="w-px h-3 bg-default-200 dark:bg-white/20 mx-1" />
            <button
              onClick={() => setScale(1.0)}
              className="px-2 py-0.5 rounded-lg bg-default-100 dark:bg-white/5 hover:bg-default-200 dark:hover:bg-white/10 text-default-700 dark:text-white text-[10px] font-bold uppercase transition-colors"
            >
              Reset
            </button>
          </div>
        )}
        <LanguageSwitcher />
        <ThemeSwitcher />
        {sessionStarted && (
          <button
            onClick={() => router.push("/teacher")}
            className="p-1.5 rounded-xl border border-default-200/50 dark:border-default-700/30 bg-default-50/90 dark:bg-default-50/10 text-rose-500 hover:bg-default-100 dark:hover:bg-default-50/20 transition-all shadow-md"
            title="Exit Presentation"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>



      {/* ── Content: WaitingRoom OR ProgressRoadmap ──────────────── */}
      {!sessionStarted ? (
        <div className="flex-1 overflow-y-auto">
          <WaitingRoom
            role="teacher"
            presentation
            quizTitle={quiz?.title || t.present.liveQuizSession}
            code={quiz?.accessCode}
            questionCount={quiz?.questions?.length}
            students={students}
            isConnected={isConnected}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          {/* Roadmap title bar */}
          <div className="absolute top-0 left-0 right-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("waiting")}
                className={`p-1.5 rounded-lg border border-white/10 transition-colors ${view === "waiting"
                    ? "bg-violet-600 text-white border-violet-500"
                    : "bg-white/5 text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                title="Lobby / Waiting Room"
              >
                <Home className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 leading-none">
                  {view === "waiting"
                    ? t.play.waitingTitle
                    : view === "roadmap"
                      ? t.present.liveProgress
                      : t.present.leaderboard}
                </span>
                <h2 className="text-sm font-black text-white truncate max-w-[120px] leading-tight">
                  {quiz?.title || t.present.quiz}
                </h2>
              </div>
            </div>

            {/* View navigation toggles */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 z-40 select-none">
              <button
                onClick={() => setView("roadmap")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${view === "roadmap"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
              >
                🗺️ {t.present.roadmap}
              </button>
              <button
                onClick={() => setView("leaderboard")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${view === "leaderboard"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
              >
                🏆 {t.present.leaderboard}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {quiz?.accessCode && (
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3 py-1 text-white font-mono font-bold tracking-[0.15em] text-xs">
                  {quiz.accessCode}
                </div>
              )}
              <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isConnected ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"
                }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
                {isConnected ? t.present.live : "…"}
              </div>
            </div>
          </div>

          {/* Content (full height minus header) */}
          <div className="absolute inset-0 pt-14">
            {view === "waiting" ? (
              <div className="w-full h-full overflow-y-auto pt-4 pb-16">
                <WaitingRoom
                  role="teacher"
                  presentation
                  quizTitle={quiz?.title || t.present.liveQuizSession}
                  code={quiz?.accessCode}
                  questionCount={quiz?.questions?.length}
                  students={students}
                  isConnected={isConnected}
                />
              </div>
            ) : view === "roadmap" ? (
              <ProgressRoadmap
                questions={questions}
                students={students}
                answers={answers}
                scale={scale}
              />
            ) : (
              <PresentLeaderboard
                students={students}
                answers={answers}
                questionsCount={questions.length}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
