"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { quizApi } from "@/services/quizApi";
import { useTeacherSocket } from "@/hooks/useMonitoringSocket";
import { WaitingRoom } from "@/components/student/waiting-room/WaitingRoom";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLang } from "@/lib/i18n/LanguageContext";
import { MonitorPlay } from "lucide-react";
import type { Student } from "@/types/teacher/monitoring.types";

// sessionId MUST match the Play page / monitoring: quiz-session-{quizId}
function sessionIdFromQuiz(quizId: string) {
  return `quiz-session-${quizId}`;
}

export default function TeacherWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLang();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);

  const sessionId = sessionIdFromQuiz(quizId);

  // ── Load quiz meta (title + code) ───────────────────────────────
  useEffect(() => {
    quizApi
      .getQuiz(quizId)
      .then((q) => setQuiz(q))
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [quizId]);

  // ── Live roster via teacher socket ──────────────────────────────
  const { isConnected, startSession } = useTeacherSocket(
    {
      sessionId,
      quizId,
      onLobbyUpdate: (list) => setStudents(list),
      onStudentJoined: () => {},
      onStudentLeft: () => {},
    },
    (snap) => setStudents(snap.students || [])
  );

  const handleStart = () => {
    startSession();
    router.push(`/teacher/monitoring/${quizId}`);
  };

  if (loading) {
    return (
      <div className="quiz-bg fixed inset-0 flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  return (
    <div className="quiz-bg fixed inset-0 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-purple-400/20 dark:bg-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-violet-800/30 dark:bg-violet-600/20 blur-3xl" />
      </div>

      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => window.open(`/present/${quizId}`, "_blank", "noopener")}
          title={t.play.waitingProjectorHint}
          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white hover:bg-white/25 transition-colors"
        >
          <MonitorPlay className="w-4 h-4" />
          {t.play.waitingOpenProjector}
        </button>
      </div>

      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      <WaitingRoom
        role="teacher"
        quizTitle={quiz?.title || t.dashboardNew?.liveSession || "Live Quiz Session"}
        code={quiz?.accessCode}
        questionCount={quiz?.questions?.length}
        students={students}
        isConnected={isConnected}
        onStart={handleStart}
        onLeave={() => router.push(`/teacher/monitoring/${quizId}`)}
      />
    </div>
  );
}
