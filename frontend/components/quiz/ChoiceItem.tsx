"use client";

import { useRef, useEffect } from "react";
import { X, Check, Plus } from "lucide-react";
import type { Choice } from "@/types/quiz";
import type { BuilderT } from "@/lib/i18n/quizBuilderTranslations";

interface ChoiceItemProps {
  t: BuilderT["builder"];
  questionId: string;
  choice: Choice;
  index: number;
  isTrueFalse: boolean;
  onTextChange: (text: string) => void;
  onToggleCorrect: () => void;
  onRemove: () => void;
  onEnterKey: () => void; // Press Enter → add next choice
  autoFocus?: boolean;
}

export function ChoiceItem({
  t,
  questionId,
  choice,
  index,
  isTrueFalse,
  onTextChange,
  onToggleCorrect,
  onRemove,
  onEnterKey,
  autoFocus,
}: ChoiceItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const LETTERS = ["A", "B", "C", "D", "E", "F"];

  return (
    <div
      data-ai-context-type="choice"
      data-ai-context-name={`Choice ${LETTERS[index] ?? index + 1}: ${choice.text}`}
      data-ai-context-data={JSON.stringify({ questionId, choiceId: choice.id, text: choice.text, isCorrect: choice.isCorrect, letter: LETTERS[index] ?? index + 1 })}
      className={`
        group flex items-center gap-2.5 rounded-xl px-3 py-2.5 border-2 transition-all duration-150
        ${choice.isCorrect
          ? "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20"
          : "border-transparent bg-slate-50 dark:bg-slate-700/40 hover:border-slate-200 dark:hover:border-slate-600"
        }
      `}
    >
      {/* Correct indicator button */}
      <button
        id={`choice-correct-btn-${choice.id}`}
        type="button"
        onClick={onToggleCorrect}
        aria-label={t.markCorrect}
        className={`
          flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-150
          ${choice.isCorrect
            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
            : "border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-400 hover:text-emerald-400"
          }
        `}
      >
        <Check size={12} strokeWidth={3} />
      </button>

      {/* Letter badge */}
      <span className="flex-shrink-0 w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
        {LETTERS[index] ?? index + 1}
      </span>

      {/* Text input */}
      <input
        ref={inputRef}
        id={`choice-text-input-${choice.id}`}
        type="text"
        value={choice.text}
        readOnly={isTrueFalse}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); onEnterKey(); }
        }}
        placeholder={t.choicePlaceholder}
        className={`
          flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200
          placeholder-slate-400 dark:placeholder-slate-500
          focus:outline-none min-w-0
          ${isTrueFalse ? "cursor-default" : ""}
          ${choice.isCorrect ? "font-medium text-emerald-700 dark:text-emerald-300" : ""}
        `}
      />

      {/* Correct badge */}
      {choice.isCorrect && (
        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wide">
          <Check size={9} strokeWidth={3} />
          {t.correct}
        </span>
      )}

      {/* Remove button */}
      {!isTrueFalse && (
        <button
          id={`choice-remove-btn-${choice.id}`}
          type="button"
          onClick={onRemove}
          aria-label={t.removeChoice}
          className="
            flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center
            text-slate-300 dark:text-slate-600
            hover:text-red-500 dark:hover:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/20
            opacity-0 group-hover:opacity-100 transition-all duration-150
          "
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
