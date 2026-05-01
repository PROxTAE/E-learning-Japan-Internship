"use client";

import { useRef, useEffect, useState } from "react";
import { Trash2, ChevronUp, ChevronDown, GripVertical, Plus, ToggleLeft, List, ImagePlus, ImageOff } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { ChoiceItem } from "./ChoiceItem";
import { ImageUploader } from "./ImageUploader";
import type { Question, QuestionType } from "@/types/quiz";
import type { BuilderT } from "@/lib/i18n/quizBuilderTranslations";

interface QuestionCardProps {
  t: BuilderT["builder"];
  question: Question;
  index: number;
  totalCount: number;
  isActive: boolean;
  onActivate: () => void;
  onUpdateText: (text: string) => void;
  onSetType: (type: QuestionType) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddChoice: () => void;
  onRemoveChoice: (choiceId: string) => void;
  onUpdateChoiceText: (choiceId: string, text: string) => void;
  onSetCorrectChoice: (choiceId: string) => void;
  onSetQuestionImage: (imageUrl: string | undefined) => void;
}

export function QuestionCard({
  t,
  question,
  index,
  totalCount,
  isActive,
  onActivate,
  onUpdateText,
  onSetType,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddChoice,
  onRemoveChoice,
  onUpdateChoiceText,
  onSetCorrectChoice,
  onSetQuestionImage,
}: QuestionCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastAddedChoiceIndex, setLastAddedChoiceIndex] = useState<number | null>(null);
  const [showImageZone, setShowImageZone] = useState(!!question.imageUrl);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [question.text]);

  // Auto-focus when activated
  useEffect(() => {
    if (isActive) textareaRef.current?.focus();
  }, [isActive]);

  // DnD sortable
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isTrueFalse = question.type === "true_false";
  const hasNoCorrect = !question.choices.some((c) => c.isCorrect);

  const handleAddChoice = () => {
    onAddChoice();
    setLastAddedChoiceIndex(question.choices.length);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onActivate}
      id={`question-card-${question.id}`}
      className={`
        group relative rounded-2xl border-2 transition-all duration-200 cursor-pointer
        ${isActive
          ? "border-violet-400 dark:border-violet-500 shadow-lg shadow-violet-500/10"
          : "border-slate-200/80 dark:border-slate-700/60 hover:border-violet-300 dark:hover:border-violet-700/50 shadow-sm"
        }
        bg-white dark:bg-slate-800/80 backdrop-blur-sm
      `}
    >
      {/* Active accent bar */}
      {isActive && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full bg-violet-500" />
      )}

      {/* Card header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>

        {/* Question number */}
        <div className={`
          flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
          ${isActive
            ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
          }
          transition-all duration-150
        `}>
          {index + 1}
        </div>

        {/* Question textarea */}
        <textarea
          ref={textareaRef}
          id={`question-text-${question.id}`}
          value={question.text}
          onChange={(e) => onUpdateText(e.target.value)}
          placeholder={t.questionPlaceholder}
          rows={1}
          onClick={(e) => e.stopPropagation()}
          className="
            flex-1 resize-none bg-transparent text-sm font-medium
            text-slate-700 dark:text-slate-200
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none leading-relaxed
            overflow-hidden
          "
        />

        {/* Collapsed image indicator */}
        {!isActive && question.imageUrl && (
          <span className="flex-shrink-0 w-6 h-6 rounded-md overflow-hidden border border-slate-200 dark:border-slate-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.imageUrl} alt="" className="w-full h-full object-cover" />
          </span>
        )}

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            id={`question-move-up-${question.id}`}
            type="button"
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-violet-600 disabled:opacity-30 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
            aria-label={t.moveUp}
          >
            <ChevronUp size={14} />
          </button>
          <button
            id={`question-move-down-${question.id}`}
            type="button"
            disabled={index === totalCount - 1}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-violet-600 disabled:opacity-30 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
            aria-label={t.moveDown}
          >
            <ChevronDown size={14} />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-0.5" />
          <button
            id={`question-delete-${question.id}`}
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            aria-label={t.deleteQuestion}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Type switcher + choices (only when active) */}
      {isActive && (
        <div className="px-4 pb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Question type toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t.questionType}:</span>
              <div className="flex gap-1">
                <button
                  id={`question-type-mc-${question.id}`}
                  type="button"
                  onClick={() => onSetType("multiple_choice")}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                    ${question.type === "multiple_choice"
                      ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }
                  `}
                >
                  <List size={11} />
                  {t.addMultipleChoice}
                </button>
                <button
                  id={`question-type-tf-${question.id}`}
                  type="button"
                  onClick={() => onSetType("true_false")}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                    ${question.type === "true_false"
                      ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }
                  `}
                >
                  <ToggleLeft size={11} />
                  {t.addTrueFalse}
                </button>
              </div>
            </div>

            {/* Image toggle button */}
            <button
              id={`question-image-toggle-${question.id}`}
              type="button"
              onClick={() => {
                if (showImageZone && question.imageUrl) onSetQuestionImage(undefined);
                setShowImageZone((v) => !v);
              }}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                ${showImageZone
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }
              `}
            >
              {showImageZone ? <ImageOff size={11} /> : <ImagePlus size={11} />}
              {showImageZone ? t.removeImage : t.addImage}
            </button>
          </div>

          {/* Image upload zone */}
          <AnimatePresence>
            {showImageZone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ImageUploader
                  t={t}
                  imageUrl={question.imageUrl}
                  onUpload={(url) => onSetQuestionImage(url)}
                  onRemove={() => onSetQuestionImage(undefined)}
                  id={`question-img-${question.id}`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Warning: no correct answer */}
          {hasNoCorrect && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400/30 flex-shrink-0" />
              {t.noCorrectAnswer}
            </p>
          )}

          {/* Choices list */}
          <div className="space-y-2">
            {question.choices.map((choice, ci) => (
              <ChoiceItem
                key={choice.id}
                t={t}
                questionId={question.id}
                choice={choice}
                index={ci}
                isTrueFalse={isTrueFalse}
                autoFocus={lastAddedChoiceIndex === ci}
                onTextChange={(text) => onUpdateChoiceText(choice.id, text)}
                onToggleCorrect={() => onSetCorrectChoice(choice.id)}
                onRemove={() => onRemoveChoice(choice.id)}
                onEnterKey={handleAddChoice}
              />
            ))}
          </div>

          {/* Add choice */}
          {!isTrueFalse && question.choices.length < 6 && (
            <button
              id={`add-choice-btn-${question.id}`}
              type="button"
              onClick={handleAddChoice}
              className="
                flex items-center gap-2 w-full px-3 py-2 rounded-xl
                text-sm text-slate-500 dark:text-slate-400
                border-2 border-dashed border-slate-200 dark:border-slate-700
                hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 dark:hover:border-violet-600
                hover:bg-violet-50/50 dark:hover:bg-violet-900/10
                transition-all duration-150
              "
            >
              <Plus size={14} />
              {t.addChoice}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
