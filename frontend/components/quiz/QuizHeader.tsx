"use client";

import { Save, Eye, EyeOff, RotateCcw, FlaskConical, Upload, CheckCircle2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import type { BuilderT } from "@/lib/i18n/quizBuilderTranslations";

interface QuizHeaderProps {
  t: BuilderT["builder"];
  title: string;
  isDirty: boolean;
  isSaving: boolean;
  previewMode: boolean;
  isValid: boolean;
  onSave: () => void;
  onTogglePreview: () => void;
  onLoadMock: () => void;
  onReset: () => void;
}

export function QuizHeader({
  t,
  title,
  isDirty,
  isSaving,
  previewMode,
  isValid,
  onSave,
  onTogglePreview,
  onLoadMock,
  onReset,
}: QuizHeaderProps) {
  return (
    <header className="
      sticky top-16 z-20
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
      border-b border-slate-200/60 dark:border-slate-700/50
      px-4 py-3
    ">
      <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
        {/* Brand + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600 shadow-md shadow-violet-500/30 flex-shrink-0">
            <FlaskConical size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {t.pageTitle}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {title || t.quizTitlePlaceholder}
            </p>
          </div>
        </div>

        {/* Unsaved badge */}
        {isDirty && !isSaving && (
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-medium border border-amber-200 dark:border-amber-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {t.unsaved}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            id="quiz-load-mock-btn"
            onClick={onLoadMock}
            title={t.loadMock}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
              hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400
              border border-slate-200 dark:border-slate-700
              transition-all duration-150
            "
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">{t.loadMock}</span>
          </button>

          <button
            id="quiz-preview-toggle-btn"
            onClick={onTogglePreview}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
              hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400
              border border-slate-200 dark:border-slate-700
              transition-all duration-150
            "
          >
            {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
            <span className="hidden sm:inline">{previewMode ? t.editMode : t.preview}</span>
          </button>

          <button
            id="quiz-save-btn"
            onClick={onSave}
            disabled={isSaving || !isValid}
            className="
              flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium
              bg-violet-600 hover:bg-violet-700 active:bg-violet-800
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white shadow-md shadow-violet-500/30
              transition-all duration-150
            "
          >
            {isSaving ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {t.saving}
              </>
            ) : isDirty ? (
              <>
                <Save size={13} />
                {t.save}
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                {t.save}
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
