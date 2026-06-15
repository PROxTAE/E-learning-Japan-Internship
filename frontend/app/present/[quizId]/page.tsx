"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { quizApi } from "@/services/quizApi";
import { useTeacherSocket } from "@/hooks/useMonitoringSocket";
import { WaitingRoom } from "@/components/student/waiting-room/WaitingRoom";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { isAuthenticated } from "@/lib/auth";
import type { Student } from "@/types/teacher/monitoring.types";

// sessionId MUST match the Play page / monitoring: quiz-session-{quizId}
function sessionIdFromQuiz(quizId: string) {
  return `quiz-session-${quizId}`;
}

/**
 * Standalone projector / presentation view of the waiting room.
 *
 * Lives outside the /teacher route group so it renders WITHOUT the teacher
 * sidebar + topbar — a clean full-screen display to put on a projector while
 * students join. Display-only (no Start/Leave); the teacher starts the quiz
 * from their own monitoring screen.
 */
export default function PresentWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  const sessionId = sessionIdFromQuiz(quizId);

  // ── Auth guard (no teacher layout here, so guard locally) ───────
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/teacher/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // ── Load quiz meta (title + code) ───────────────────────────────
  useEffect(() => {
    if (!authChecked) return;
    quizApi
      .getQuiz(quizId)
      .then((q) => setQuiz(q))
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [quizId, authChecked]);

  // ── Live roster via teacher socket (read-only) ──────────────────
  const { isConnected } = useTeacherSocket(
    {
      sessionId,
      quizId,
      onLobbyUpdate: (list) => setStudents(list),
      onStudentJoined: () => {},
      onStudentLeft: () => {},
    },
    (snap) => setStudents(snap.students || [])
  );

  if (!authChecked || loading) {
    return (
      <div className="quiz-bg fixed inset-0 flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  return (
    <div className="quiz-bg fixed inset-0 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-violet-800/30 dark:bg-violet-600/20 blur-3xl" />
      </div>

      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      <WaitingRoom
        role="teacher"
        presentation
        quizTitle={quiz?.title || "Live Quiz Session"}
        code={quiz?.accessCode}
        questionCount={quiz?.questions?.length}
        students={students}
        isConnected={isConnected}
      />
    </div>
  );
}
