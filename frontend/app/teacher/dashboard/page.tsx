"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageContext";
import { ScrollShadow } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader }   from "@/components/teacher/dashboard/DashboardHeader";
import { QuizStatsOverview } from "@/components/teacher/dashboard/QuizStatsOverview";
import { QuizCategoryCard }  from "@/components/teacher/dashboard/QuizCategoryCard";
import { QuizCard }          from "@/components/teacher/dashboard/QuizCard";
import { QuizTable }         from "@/components/teacher/dashboard/QuizTable";
import { QuizDetailPanel }   from "@/components/teacher/dashboard/QuizDetailPanel";
import { ShareQuizModal }    from "@/components/teacher/dashboard/ShareQuizModal";
import { EmptyState }        from "@/components/teacher/shared/EmptyState";

// Real API client
import { quizApi } from "@/services/quizApi";

// Categories are still static (no category collection yet)
import { MOCK_CATEGORIES } from "@/lib/teacher/quiz.mock";
import type { Quiz, QuizViewMode } from "@/types/teacher/quiz.types";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { t }  = useLang();

  // ── State ──────────────────────────────────────────────────────
  const [quizzes, setQuizzes]         = useState<Quiz[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [viewMode, setViewMode]       = useState<QuizViewMode>("grid");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod]     = useState("");
  const [shareQuiz, setShareQuiz]           = useState<Quiz | null>(null);

  const activePeriod = filterPeriod || t.header.periods[0];

  // ── Fetch from API ─────────────────────────────────────────────
  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await quizApi.listQuizzes();
      // API returns quiz-builder Quiz shape; teacher dashboard uses teacher Quiz shape.
      // They share the same fields that matter here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setQuizzes(result.quizzes as any);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      // Keep empty list on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  // ── Derived state ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = quizzes;
    if (activeCategory) result = result.filter((q) => q.categoryId === activeCategory);
    return result;
  }, [quizzes, activeCategory]);

  const stats = useMemo(() => {
    const attempted = quizzes.filter((q) => q.totalAttempts > 0);
    return {
      totalQuizzes:     quizzes.length,
      publishedQuizzes: quizzes.filter((q) => q.status === "published").length,
      draftQuizzes:     quizzes.filter((q) => q.status === "draft").length,
      archivedQuizzes:  quizzes.filter((q) => q.status === "archived").length,
      totalAttempts:    quizzes.reduce((s, q) => s + (q.totalAttempts ?? 0), 0),
      averageScore: attempted.length
        ? Math.round(attempted.reduce((s, q) => s + (q.averageScore ?? 0), 0) / attempted.length)
        : 0,
    };
  }, [quizzes]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleCreate = () => router.push("/teacher/create-quiz");
  const handleEdit   = (quiz: Quiz) => router.push(`/teacher/create-quiz?id=${quiz.id}`);

  const handleDelete = async (id: string) => {
    try {
      await quizApi.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuiz?.id === id) setSelectedQuiz(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const showDetailPanel = selectedQuiz !== null;

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* ── Left/Center Content ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="w-full mx-auto p-4 lg:p-6 space-y-6">

          {/* Header */}
          <DashboardHeader
            totalQuizzes={filtered.length}
            viewMode={viewMode}
            onViewChange={setViewMode}
            filterPeriod={activePeriod}
            onFilterPeriodChange={setFilterPeriod}
            onCreateQuiz={handleCreate}
          />

          {/* Stats Row */}
          <QuizStatsOverview stats={stats} />

          {/* Categories */}
          <section>
            <p className="text-xs font-semibold text-default-500 uppercase tracking-wider mb-3">
              {t.categories.title}
            </p>
            <ScrollShadow orientation="horizontal" className="flex gap-3 pb-2" hideScrollBar>
              {MOCK_CATEGORIES.map((cat) => (
                <QuizCategoryCard
                  key={cat.id}
                  category={cat}
                  isActive={activeCategory === cat.id}
                  onSelect={setActiveCategory}
                />
              ))}
            </ScrollShadow>
          </section>

          {/* Quiz Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                {t.quizSection.title}
                {activeCategory && (
                  <span className="ml-2 normal-case font-normal text-default-400">
                    {t.quizSection.filteredBy} {MOCK_CATEGORIES.find((c) => c.id === activeCategory)?.name}
                  </span>
                )}
              </p>
              <p className="text-xs text-default-400">{t.quizSection.results(filtered.length)}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-default-400 text-sm">
                Loading quizzes…
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title={t.quizSection.noQuizzes}
                description={t.quizSection.noQuizzesDesc}
                actionLabel={t.quizSection.createQuiz}
                onAction={handleCreate}
              />
            ) : viewMode === "grid" ? (
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((quiz) => (
                    <motion.div
                      key={quiz.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                    >
                      <QuizCard
                        quiz={quiz}
                        isSelected={selectedQuiz?.id === quiz.id}
                        onSelect={setSelectedQuiz}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onShare={setShareQuiz}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <QuizTable
                quizzes={filtered}
                selectedId={selectedQuiz?.id ?? null}
                onSelect={setSelectedQuiz}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </section>
        </div>
      </div>

      {/* ── Right Detail Panel ── */}
      <AnimatePresence>
        {showDetailPanel && selectedQuiz && (
          <motion.div
            key="detail-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="shrink-0 hidden lg:block overflow-hidden h-full"
          >
            <QuizDetailPanel
              quiz={selectedQuiz}
              onClose={() => setSelectedQuiz(null)}
              onEdit={handleEdit}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── Share Modal ── */}
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
