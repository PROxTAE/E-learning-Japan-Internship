"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageContext";
import { ScrollShadow } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

// ── Dashboard feature components ───────────────────────────────────
import { WelcomeBanner }     from "@/components/teacher/dashboard/WelcomeBanner";
import { QuizStatsOverview } from "@/components/teacher/dashboard/QuizStatsOverview";
import { PerformanceChart }  from "@/components/teacher/dashboard/PerformanceChart";
import { UpcomingSchedule }  from "@/components/teacher/dashboard/UpcomingSchedule";
import { ActivityFeed }      from "@/components/teacher/dashboard/ActivityFeed";
import { TopQuizzes }        from "@/components/teacher/dashboard/TopQuizzes";

// ── Quiz management components ─────────────────────────────────────
import { DashboardHeader }   from "@/components/teacher/dashboard/DashboardHeader";
import { QuizCategoryCard }  from "@/components/teacher/dashboard/QuizCategoryCard";
import { QuizCard }          from "@/components/teacher/dashboard/QuizCard";
import { QuizTable }         from "@/components/teacher/dashboard/QuizTable";
import { QuizDetailPanel }   from "@/components/teacher/dashboard/QuizDetailPanel";
import { ShareQuizModal }    from "@/components/teacher/dashboard/ShareQuizModal";
import { EmptyState }        from "@/components/teacher/shared/EmptyState";

// ── API clients ────────────────────────────────────────────────────
import { quizApi }      from "@/services/quizApi";
import { dashboardApi } from "@/services/dashboardApi";
import type { DashboardStats } from "@/services/dashboardApi";

// ── Static category filter (no category collection yet) ───────────
import { MOCK_CATEGORIES } from "@/lib/teacher/quiz.mock";
import type { Quiz, QuizStats, QuizViewMode } from "@/types/teacher/quiz.types";

// ── Field normaliser: backend → teacher dashboard Quiz type ────────
// Backend uses: category, durationMinutes, questions[] (as array)
// Dashboard expects: categoryId, categoryName, duration, questionCount
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseQuiz(raw: any): Quiz {
  return {
    id:              raw.id ?? raw._id,
    title:           raw.title ?? "",
    description:     raw.description ?? "",
    categoryId:      raw.category ?? "",
    categoryName:    raw.category ?? "",
    difficulty:      raw.difficulty ?? "medium",
    status:          raw.status ?? "draft",
    accessCode:      raw.accessCode ?? null,
    questionCount:   raw.questionCount ?? (Array.isArray(raw.questions) ? raw.questions.length : 0),
    duration:        raw.duration ?? raw.durationMinutes ?? 0,
    totalAttempts:   raw.totalAttempts ?? 0,
    averageScore:    raw.averageScore ?? 0,
    completionRate:  raw.completionRate ?? 0,
    createdAt:       raw.createdAt ?? new Date().toISOString(),
    updatedAt:       raw.updatedAt ?? new Date().toISOString(),
    tags:            raw.tags ?? [],
    emoji:           raw.emoji ?? "📄",
    gradient:        raw.gradient ?? "from-violet-500 to-purple-700",
    hasTimeLimit:    raw.hasTimeLimit,
    showAnswersAfterQuiz: raw.showAnswersAfterQuiz,
  };
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { t }  = useLang();

  // ── Quiz list state ────────────────────────────────────────────
  const [quizzes, setQuizzes]           = useState<Quiz[]>([]);
  const [quizLoading, setQuizLoading]   = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [viewMode, setViewMode]         = useState<QuizViewMode>("grid");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod]     = useState("");
  const [shareQuiz, setShareQuiz]           = useState<Quiz | null>(null);

  const activePeriod = filterPeriod || t.header.periods[0];

  // ── Dashboard stats state ──────────────────────────────────────
  const [dashStats, setDashStats]       = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Fetch quizzes from API ─────────────────────────────────────
  const fetchQuizzes = useCallback(async () => {
    try {
      setQuizLoading(true);
      const result = await quizApi.listQuizzes();
      setQuizzes(result.quizzes.map(normaliseQuiz));
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    } finally {
      setQuizLoading(false);
    }
  }, []);

  // ── Fetch dashboard stats from API ─────────────────────────────
  const fetchDashStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await dashboardApi.getStats();
      setDashStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
    fetchDashStats();
  }, [fetchQuizzes, fetchDashStats]);

  // ── Derived state ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = quizzes;
    if (activeCategory)
      result = result.filter((q) => q.categoryId === activeCategory || q.categoryName === activeCategory);
    return result;
  }, [quizzes, activeCategory]);

  // Use real stats from API when available, fall back to quiz-list computation
  const stats = useMemo((): QuizStats => {
    if (dashStats) return dashStats.quizStats;
    const attempted = quizzes.filter((q) => q.totalAttempts > 0);
    return {
      totalQuizzes:     quizzes.length,
      publishedQuizzes: quizzes.filter((q) => q.status === "published").length,
      draftQuizzes:     quizzes.filter((q) => q.status === "draft").length,
      archivedQuizzes:  quizzes.filter((q) => q.status === "archived").length,
      totalAttempts:    quizzes.reduce((s, q) => s + (q.totalAttempts ?? 0), 0),
      averageScore:     attempted.length
        ? Math.round(attempted.reduce((s, q) => s + (q.averageScore ?? 0), 0) / attempted.length)
        : 0,
    };
  }, [dashStats, quizzes]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleCreate = () => router.push("/teacher/create-quiz");
  const handleEdit   = (quiz: Quiz) => router.push(`/teacher/create-quiz?id=${quiz.id}`);

  const handleDelete = async (id: string) => {
    try {
      await quizApi.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuiz?.id === id) setSelectedQuiz(null);
      // Refresh dashboard stats after delete
      fetchDashStats();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const showDetailPanel = selectedQuiz !== null;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* ── Main scrollable area ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="w-full mx-auto p-4 lg:p-6 space-y-6">

          {/* ① Welcome Hero Banner */}
          <WelcomeBanner />

          {/* ② Stats Overview Cards */}
          <QuizStatsOverview stats={stats} loading={statsLoading} />

          {/* ③ Performance chart + Upcoming schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PerformanceChart
                data={dashStats?.weeklyPerformance ?? []}
                loading={statsLoading}
              />
            </div>
            <div className="lg:col-span-1">
              <UpcomingSchedule />
            </div>
          </div>

          {/* ④ Activity feed + Top quizzes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityFeed
              activities={dashStats?.recentActivity ?? []}
              loading={statsLoading}
            />
            <TopQuizzes
              quizzes={dashStats?.topQuizzes ?? []}
              loading={statsLoading}
            />
          </div>

          {/* ⑤ Quiz Management section divider */}
          <div className="pt-2 border-t border-default-200/40 dark:border-default-700/30">
            <DashboardHeader
              totalQuizzes={filtered.length}
              viewMode={viewMode}
              onViewChange={setViewMode}
              filterPeriod={activePeriod}
              onFilterPeriodChange={setFilterPeriod}
              onCreateQuiz={handleCreate}
            />
          </div>

          {/* ⑥ Category filter bar */}
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

          {/* ⑦ Quiz grid / table */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                {t.quizSection.title}
                {activeCategory && (
                  <span className="ml-2 normal-case font-normal text-default-400">
                    {t.quizSection.filteredBy}{" "}
                    {MOCK_CATEGORIES.find((c) => c.id === activeCategory)?.name ?? activeCategory}
                  </span>
                )}
              </p>
              <p className="text-xs text-default-400">{t.quizSection.results(filtered.length)}</p>
            </div>

            {quizLoading ? (
              /* Loading skeleton */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-default-200/40 dark:border-default-700/30 bg-white dark:bg-white/5 animate-pulse">
                    <div className="h-24 bg-default-100 dark:bg-default-700/30 rounded-t-xl" />
                    <div className="p-3 space-y-2">
                      <div className="flex gap-1.5">
                        <div className="h-4 w-16 bg-default-100 dark:bg-default-700/30 rounded-full" />
                        <div className="h-4 w-12 bg-default-100 dark:bg-default-700/30 rounded-full" />
                      </div>
                      <div className="h-3 bg-default-100 dark:bg-default-700/30 rounded-full w-full" />
                      <div className="h-3 bg-default-100 dark:bg-default-700/30 rounded-full w-3/4" />
                    </div>
                  </div>
                ))}
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
