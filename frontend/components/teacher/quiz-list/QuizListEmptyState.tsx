"use client";

import { BookOpen, Plus, X } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { AnimeGhostCharacter } from "@/components/shared/ThemeCharacters";

interface QuizListEmptyStateProps {
  hasFilters:     boolean;
  onCreateQuiz:   () => void;
  onClearFilters: () => void;
}

export function QuizListEmptyState({ hasFilters, onCreateQuiz, onClearFilters }: QuizListEmptyStateProps) {
  const { t } = useLang();
  const ql = t.quizList;

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-5">
      {/* Chi mascot */}
      <div className="pointer-events-none">
        <AnimeGhostCharacter size={100} animate={true} />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-black text-[var(--theme-text-main)] uppercase tracking-tight">
          {hasFilters ? ql.emptyFiltered : ql.emptyLibrary}
        </h3>
        <p className="text-sm text-[var(--theme-text-muted)] font-medium max-w-xs">
          {hasFilters ? ql.emptyFilteredDesc : ql.emptyLibraryDesc}
        </p>
      </div>

      <div className="flex gap-3">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-full
              bg-[var(--theme-card-bg)] text-[var(--theme-text-main)] font-black text-xs uppercase tracking-wider
              border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
              shadow-[2px_2px_0px_var(--theme-text-main)] dark:shadow-[2px_2px_0px_var(--theme-border)]
              hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--theme-text-main)]
              active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--theme-text-main)]
              transition-all duration-100 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
            {ql.clearFilters}
          </button>
        )}
        <button
          onClick={onCreateQuiz}
          className="flex items-center gap-2 px-5 py-2 rounded-full
            bg-[var(--theme-primary)] text-black font-black text-xs uppercase tracking-wider
            border-2 border-[var(--theme-text-main)]
            shadow-[3px_3px_0px_var(--theme-text-main)]
            hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_var(--theme-text-main)]
            active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--theme-text-main)]
            transition-all duration-100 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          {ql.createNewQuiz}
        </button>
      </div>
    </div>
  );
}
