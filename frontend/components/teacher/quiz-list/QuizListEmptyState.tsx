"use client";

import { BookOpen, Plus, X } from "lucide-react";
import { Button } from "@heroui/react";
import { useLang } from "@/lib/i18n/LanguageContext";

interface QuizListEmptyStateProps {
  hasFilters:     boolean;
  onCreateQuiz:   () => void;
  onClearFilters: () => void;
}

export function QuizListEmptyState({ hasFilters, onCreateQuiz, onClearFilters }: QuizListEmptyStateProps) {
  const { t } = useLang();
  const ql = t.quizList;

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-violet-500" />
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          {hasFilters ? ql.emptyFiltered : ql.emptyLibrary}
        </h3>
        <p className="text-sm text-gray-500 dark:text-default-400 mt-1">
          {hasFilters ? ql.emptyFilteredDesc : ql.emptyLibraryDesc}
        </p>
      </div>
      <div className="flex gap-3">
        {hasFilters && (
          <Button variant="secondary" size="sm" onPress={onClearFilters}>
            <X className="w-4 h-4" />
            {ql.clearFilters}
          </Button>
        )}
        <Button
          onPress={onCreateQuiz}
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
        >
          <Plus className="w-4 h-4" />
          {ql.createNewQuiz}
        </Button>
      </div>
    </div>
  );
}
