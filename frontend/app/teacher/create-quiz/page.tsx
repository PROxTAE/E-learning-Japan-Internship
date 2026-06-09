"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import { quizBuilderTranslations } from "@/lib/i18n/quizBuilderTranslations";
import { useQuizBuilder } from "@/hooks/useQuizBuilder";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { QuizSettings } from "@/components/quiz/QuizSettings";
import { QuizForm } from "@/components/quiz/QuizForm";

// ── Inner component (uses useSearchParams — must be inside Suspense) ──
function CreateQuizInner() {
  const { lang, t } = useLang();
  const tb = quizBuilderTranslations[lang]?.builder ?? quizBuilderTranslations.en.builder;
  const searchParams = useSearchParams();
  const editId = searchParams.get("id"); // ?id=<mongoId> when editing

  const {
    quiz,
    questions,
    isDirty,
    isSaving,
    previewMode,
    isValid,
    setQuizField,
    setPreviewMode,
    loadQuiz,
    loadMockQuiz,
    resetQuiz,
    save,
  } = useQuizBuilder();

  useEffect(() => {
    if (editId) {
      loadQuiz(editId);
    } else if (searchParams.get("from_ai") !== "true") {
      resetQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sticky header */}
      <QuizHeader
        t={tb}
        title={quiz.title}
        isDirty={isDirty}
        isSaving={isSaving}
        previewMode={previewMode}
        isValid={isValid}
        onSave={save}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        onLoadMock={loadMockQuiz}
        onReset={resetQuiz}
      />

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-3xl" />
      </div>

      {/* Page content */}
      <main className="relative max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {previewMode ? (
            <QuizForm t={tb} key="preview-wrapper" />
          ) : (
            <div key="edit-layout" className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
              {/* Left: Settings panel */}
              <div className="lg:sticky lg:top-20 space-y-4">
                <QuizSettings t={tb} quiz={quiz} onField={setQuizField} />
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Questions" value={String(questions.length)} color="violet" />
                  <StatCard label="Duration"  value={quiz.hasTimeLimit !== false ? `${quiz.durationMinutes}m` : (t.detail?.noLimit || "No Limit")} color="purple" />
                </div>
              </div>
              {/* Right: Question builder */}
              <div className="min-w-0">
                <QuizForm t={tb} />
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Page export — wraps inner with Suspense (required by Next.js) ──
export default function CreateQuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading…
      </div>
    }>
      <CreateQuizInner />
    </Suspense>
  );
}

// ── Mini stat card ─────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: "violet" | "purple" }) {
  const colors = {
    violet: "from-violet-500/10 to-violet-600/5 border-violet-200 dark:border-violet-800/50 text-violet-600 dark:text-violet-400",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-3 ${colors[color]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
