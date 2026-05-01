"use client";

import { useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, List, ToggleLeft, FileQuestion } from "lucide-react";
import { QuestionCard } from "./QuestionCard";
import { QuizPreview } from "./QuizPreview";
import type { QuestionType } from "@/types/quiz";
import type { BuilderT } from "@/lib/i18n/quizBuilderTranslations";
import { useQuizBuilder } from "@/hooks/useQuizBuilder";

interface QuizFormProps {
  t: BuilderT["builder"];
}

export function QuizForm({ t }: QuizFormProps) {
  const {
    questions,
    quiz,
    activeQuestionId,
    previewMode,
    setActiveQuestion,
    addQuestion,
    removeQuestion,
    updateQuestionText,
    setQuestionType,
    reorderQuestions,
    addChoice,
    removeChoice,
    updateChoiceText,
    setCorrectChoice,
    setQuestionImage,
  } = useQuizBuilder();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = questions.findIndex((q) => q.id === active.id);
    const toIndex = questions.findIndex((q) => q.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) reorderQuestions(fromIndex, toIndex);
  }, [questions, reorderQuestions]);

  const handleAddQuestion = (type: QuestionType) => {
    addQuestion(type);
    // Scroll to bottom after a tick
    setTimeout(() => {
      const el = document.getElementById("questions-end-anchor");
      el?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  if (previewMode) {
    return (
      <motion.div
        key="preview"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="max-w-2xl mx-auto"
      >
        <QuizPreview
          t={t}
          title={quiz.title}
          description={quiz.description}
          questions={questions}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="builder"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="space-y-3"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <FileQuestion size={14} className="text-violet-500" />
          {t.questions}
          <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold">
            {questions.length}
          </span>
        </h3>
      </div>

      {/* Empty state */}
      {questions.length === 0 && (
        <div className="
          flex flex-col items-center justify-center py-16 rounded-2xl
          border-2 border-dashed border-slate-200 dark:border-slate-700
          bg-white/50 dark:bg-slate-800/30 text-center gap-3
        ">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <FileQuestion size={28} className="text-violet-400" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{t.noQuestions}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{t.noQuestionsHint}</p>
          </div>
        </div>
      )}

      {/* DnD Question list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence initial={false}>
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <QuestionCard
                  t={t}
                  question={question}
                  index={index}
                  totalCount={questions.length}
                  isActive={activeQuestionId === question.id}
                  onActivate={() => setActiveQuestion(question.id)}
                  onUpdateText={(text) => updateQuestionText(question.id, text)}
                  onSetType={(type) => setQuestionType(question.id, type)}
                  onDelete={() => removeQuestion(question.id)}
                  onMoveUp={() => reorderQuestions(index, index - 1)}
                  onMoveDown={() => reorderQuestions(index, index + 1)}
                  onAddChoice={() => addChoice(question.id)}
                  onRemoveChoice={(cId) => removeChoice(question.id, cId)}
                  onUpdateChoiceText={(cId, text) => updateChoiceText(question.id, cId, text)}
                  onSetCorrectChoice={(cId) => setCorrectChoice(question.id, cId)}
                  onSetQuestionImage={(url) => setQuestionImage(question.id, url)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      <div id="questions-end-anchor" />

      {/* Add Question buttons */}
      <div className="flex gap-2 pt-1">
        <button
          id="add-mc-question-btn"
          type="button"
          onClick={() => handleAddQuestion("multiple_choice")}
          className="
            flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
            text-sm font-medium
            border-2 border-dashed border-slate-200 dark:border-slate-700
            text-slate-500 dark:text-slate-400
            hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 dark:hover:border-violet-600
            hover:bg-violet-50/50 dark:hover:bg-violet-900/10
            transition-all duration-150
          "
        >
          <Plus size={15} />
          <List size={15} />
          {t.addMultipleChoice}
        </button>
        <button
          id="add-tf-question-btn"
          type="button"
          onClick={() => handleAddQuestion("true_false")}
          className="
            flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
            text-sm font-medium
            border-2 border-dashed border-slate-200 dark:border-slate-700
            text-slate-500 dark:text-slate-400
            hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 dark:hover:border-violet-600
            hover:bg-violet-50/50 dark:hover:bg-violet-900/10
            transition-all duration-150
          "
        >
          <Plus size={15} />
          <ToggleLeft size={15} />
          {t.addTrueFalse}
        </button>
      </div>
    </motion.div>
  );
}
