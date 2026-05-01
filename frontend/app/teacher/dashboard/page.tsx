"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { ScrollShadow } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/teacher/dashboard/DashboardHeader";
import { QuizStatsOverview } from "@/components/teacher/dashboard/QuizStatsOverview";
import { QuizCategoryCard } from "@/components/teacher/dashboard/QuizCategoryCard";
import { QuizCard } from "@/components/teacher/dashboard/QuizCard";
import { QuizTable } from "@/components/teacher/dashboard/QuizTable";
import { QuizDetailPanel } from "@/components/teacher/dashboard/QuizDetailPanel";
import { CreateQuizModal } from "@/components/teacher/dashboard/CreateQuizModal";
import { EmptyState } from "@/components/teacher/shared/EmptyState";

import { MOCK_QUIZZES, MOCK_CATEGORIES, MOCK_STATS } from "@/lib/teacher/quiz.mock";
import type { Quiz, QuizViewMode, CreateQuizFormData } from "@/types/teacher/quiz.types";

export default function TeacherDashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>(MOCK_QUIZZES);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [viewMode, setViewMode] = useState<QuizViewMode>("grid");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState("");
  const { t } = useLang();
  // Use first period label if filterPeriod is empty (or was set in different language)
  const activePeriod = filterPeriod || t.header.periods[0];
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ── Derived state ── */
  const filtered = useMemo(() => {
    let result = quizzes;
    if (activeCategory) result = result.filter((q) => q.categoryId === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(q) ||
          quiz.categoryName.toLowerCase().includes(q) ||
          quiz.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [quizzes, activeCategory, searchQuery]);

  const stats = useMemo(() => {
    const attempted = quizzes.filter((q) => q.totalAttempts > 0);
    return {
      totalQuizzes: quizzes.length,
      publishedQuizzes: quizzes.filter((q) => q.status === "published").length,
      draftQuizzes: quizzes.filter((q) => q.status === "draft").length,
      archivedQuizzes: quizzes.filter((q) => q.status === "archived").length,
      totalAttempts: quizzes.reduce((s, q) => s + q.totalAttempts, 0),
      averageScore: attempted.length
        ? Math.round(attempted.reduce((s, q) => s + q.averageScore, 0) / attempted.length)
        : 0,
    };
  }, [quizzes]);

  /* ── Handlers ── */
  const handleCreate = () => {
    setEditingQuiz(null);
    setIsModalOpen(true);
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    if (selectedQuiz?.id === id) setSelectedQuiz(null);
  };

  const handleSave = (data: CreateQuizFormData, id?: string) => {
    const cat = MOCK_CATEGORIES.find((c) => c.id === data.categoryId);
    const now = new Date().toISOString();

    if (id) {
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
              ...q,
              title: data.title,
              description: data.description,
              categoryId: data.categoryId,
              categoryName: cat?.name ?? q.categoryName,
              difficulty: data.difficulty,
              duration: data.duration,
              tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
              updatedAt: now,
            }
            : q
        )
      );
    } else {
      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        categoryName: cat?.name ?? "",
        difficulty: data.difficulty,
        status: "draft",
        questionCount: 0,
        duration: data.duration,
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0,
        createdAt: now,
        updatedAt: now,
        tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
        emoji: cat?.icon ?? "📝",
        gradient: cat?.gradient ?? "from-violet-500 to-purple-700",
      };
      setQuizzes((prev) => [newQuiz, ...prev]);
    }
  };

  const showDetailPanel = selectedQuiz !== null;

  return (
    <div className=" flex h-[calc(100vh-64px)]">
      {/* ── Left/Center Content ── */}
      <div className=" flex-1 min-w-0 overflow-y-auto">
        <div className="w-full mx-auto p-4 lg:p-6 space-y-6 ">

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

            {filtered.length === 0 ? (
              <EmptyState
                title={t.quizSection.noQuizzes}
                description={t.quizSection.noQuizzesDesc}
                actionLabel={t.quizSection.createQuiz}
                onAction={handleCreate}
              />
            ) : viewMode === "grid" ? (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3"
              >
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

      {/* Create/Edit Modal */}
      <CreateQuizModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingQuiz={editingQuiz}
        onSave={handleSave}
      />
    </div>
  );
}
