"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { quizApi } from "@/services/quizApi";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Quiz } from "@/types/teacher/quiz.types";

// ── Sub-components ─────────────────────────────────────────────
import { QuizListHeader }      from "@/components/teacher/quiz-list/QuizListHeader";
import { QuizListFilters }     from "@/components/teacher/quiz-list/QuizListFilters";
import { QuizListGrid }        from "@/components/teacher/quiz-list/QuizListGrid";
import { QuizListTable }       from "@/components/teacher/quiz-list/QuizListTable";
import { QuizListEmptyState }  from "@/components/teacher/quiz-list/QuizListEmptyState";
import { QuizListSkeleton }    from "@/components/teacher/quiz-list/QuizListSkeleton";
import { QuizDeleteModal }     from "@/components/teacher/quiz-list/QuizDeleteModal";
import { ShareQuizModal }      from "@/components/teacher/dashboard/ShareQuizModal";

export default function TeacherPage() {
  const router = useRouter();
  const { t }  = useLang();

  // ── State ──────────────────────────────────────────────────────
  const [quizzes, setQuizzes]         = useState<Quiz[]>([]);
  const [loading, setLoading]         = useState(true);
  const [viewMode, setViewMode]       = useState<"grid" | "table">("grid");
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [diffFilter, setDiffFilter]   = useState<"all" | "easy" | "medium" | "hard">("all");
  const [sortBy, setSortBy]           = useState<"updatedAt" | "title" | "attempts">("updatedAt");
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [shareQuiz, setShareQuiz]     = useState<Quiz | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await quizApi.listQuizzes();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setQuizzes(result.quizzes as any);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  // ── Derived ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let res = [...quizzes];
    if (statusFilter !== "all") res = res.filter(q => q.status === statusFilter);
    if (diffFilter   !== "all") res = res.filter(q => q.difficulty === diffFilter);
    if (search.trim())          res = res.filter(q =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description?.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === "title")    res.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "attempts") res.sort((a, b) => (b.totalAttempts ?? 0) - (a.totalAttempts ?? 0));
    if (sortBy === "updatedAt") res.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
    return res;
  }, [quizzes, search, statusFilter, diffFilter, sortBy]);

  const stats = useMemo(() => ({
    total:     quizzes.length,
    published: quizzes.filter(q => q.status === "published").length,
    draft:     quizzes.filter(q => q.status === "draft").length,
    archived:  quizzes.filter(q => q.status === "archived").length,
  }), [quizzes]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleCreate     = () => router.push("/teacher/create-quiz");
  const handleEdit       = (quiz: Quiz) => router.push(`/teacher/create-quiz?id=${quiz.id}`);
  const handleMonitor    = (quiz: Quiz) => router.push(`/teacher/monitoring/${quiz.id}`);
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quizApi.deleteQuiz(deleteTarget.id);
      setQuizzes(prev => prev.filter(q => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (quiz: Quiz, status: Quiz["status"]) => {
    try {
      await quizApi.setStatus(quiz.id, status);
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, status } : q));
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-[calc(100vh-64px)] text-foreground">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <QuizListHeader
          stats={stats}
          onCreateQuiz={handleCreate}
        />

        {/* Filters & Controls */}
        <QuizListFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          diffFilter={diffFilter}
          setDiffFilter={setDiffFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          resultCount={filtered.length}
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuizListSkeleton viewMode={viewMode} />
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <QuizListEmptyState hasFilters={search !== "" || statusFilter !== "all" || diffFilter !== "all"} onCreateQuiz={handleCreate} onClearFilters={() => { setSearch(""); setStatusFilter("all"); setDiffFilter("all"); }} />
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuizListGrid
                quizzes={filtered}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onShare={setShareQuiz}
                onMonitor={handleMonitor}
                onStatusChange={handleStatusChange}
              />
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuizListTable
                quizzes={filtered}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onShare={setShareQuiz}
                onMonitor={handleMonitor}
                onStatusChange={handleStatusChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Modal */}
      <QuizDeleteModal
        quiz={deleteTarget}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleting}
      />

      {/* Share Modal */}
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
