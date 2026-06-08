"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Spinner } from "@heroui/react";
import { ArrowLeft, History, BarChart2, Search, BookOpen } from "lucide-react";
import { sessionHistoryApi, type SessionSummary } from "@/services/sessionHistoryApi";
import { quizApi } from "@/services/quizApi";
import { SessionCard } from "@/components/teacher/session-history/SessionCard";
import { SessionDeleteModal } from "@/components/teacher/session-history/SessionDeleteModal";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Quiz } from "@/types/teacher/quiz.types";

export default function SessionHistoryPage() {
  const params  = useParams();
  const router  = useRouter();
  const { t }   = useLang();
  const quizId  = params.quizId as string;

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [quiz,     setQuiz]     = useState<Quiz | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<SessionSummary | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  const handleDeleteSessionConfirm = async () => {
    if (!deleteSessionTarget) return;
    setDeletingSession(true);
    try {
      await sessionHistoryApi.deleteSession(deleteSessionTarget.id);
      setSessions(prev => prev.filter(s => s.id !== deleteSessionTarget.id));
      setDeleteSessionTarget(null);
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setDeletingSession(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sess, quizData] = await Promise.all([
        sessionHistoryApi.listSessions(quizId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quizApi.getQuiz(quizId).catch(() => null) as any,
      ]);
      setSessions(sess);
      if (quizData?.data) setQuiz(quizData.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => { load(); }, [load]);

  const filtered = sessions.filter(s =>
    !search || (s.sessionLabel || "").toLowerCase().includes(search.toLowerCase())
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quizTitle   = (quiz as any)?.title   || "Quiz";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quizSubject = (quiz as any)?.subject || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quizChapter = (quiz as any)?.chapter || "";

  return (
    <div 
      className="min-h-screen text-foreground"
      data-ai-context-type="quiz-history"
      data-ai-context-name={`ประวัติเซสชันของ ${quizTitle}`}
      data-ai-context-data={JSON.stringify({
        quiz: { id: quizId, title: quizTitle, subject: quizSubject, chapter: quizChapter },
        sessionsCount: sessions.length,
        sessionsList: sessions.map(s => ({
          id: s.id,
          label: s.sessionLabel,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          studentCount: s.studentCount,
          averageScore: s.stats?.averageScore,
          completionPercentage: s.stats?.completionPercentage
        }))
      })}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button
            onClick={() => router.push("/teacher/quizzes")}
            className="flex items-center gap-1.5 text-sm text-default-400 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.sessionHistory.backToHistory}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              {(quizSubject || quizChapter) && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {quizSubject && (
                    <span className="text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-2.5 py-0.5 rounded-full">
                      <BookOpen className="w-3 h-3 inline mr-1" />{quizSubject}
                    </span>
                  )}
                  {quizChapter && (
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                      {quizChapter}
                    </span>
                  )}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {quizTitle}
              </h1>
              <p className="text-sm text-default-500 mt-1">
                <History className="w-4 h-4 inline mr-1 mb-0.5" />
                {t.sessionHistory.title} · {sessions.length} sessions
              </p>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => router.push(`/teacher/quizzes/${quizId}/history/compare`)}
                isDisabled={sessions.length < 2}
                className="font-semibold text-default-600"
              >
                <BarChart2 className="w-4 h-4 mr-1" />
                {t.sessionHistory.compareBtn}
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-500/30"
                onPress={() => router.push(`/teacher/monitoring/${quizId}`)}
              >
                ▶ Start Monitoring
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        {sessions.length > 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
              <input
                type="text"
                placeholder={`${t.monitoring.search}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-background border border-default-200 dark:border-white/10 text-foreground placeholder-default-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
          </motion.div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="flex justify-center py-20">
              <Spinner size="lg" />
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/20 dark:to-fuchsia-900/20 flex items-center justify-center mb-4 text-4xl">
                📋
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{t.sessionHistory.noHistory}</h3>
              <p className="text-sm text-default-400 max-w-xs">{t.sessionHistory.noHistoryDesc}</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
               {filtered.map((session, i) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={i}
                  onView={(id) => router.push(`/teacher/quizzes/${quizId}/history/${id}`)}
                  onDelete={() => setDeleteSessionTarget(session)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <SessionDeleteModal
        session={deleteSessionTarget}
        isOpen={!!deleteSessionTarget}
        onClose={() => setDeleteSessionTarget(null)}
        onConfirm={handleDeleteSessionConfirm}
        isDeleting={deletingSession}
      />
    </div>
  );
}
