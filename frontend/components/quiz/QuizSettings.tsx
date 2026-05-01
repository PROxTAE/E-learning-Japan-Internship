"use client";

import { Clock, Tag, BarChart3, BookOpen } from "lucide-react";
import type { BuilderT } from "@/lib/i18n/quizBuilderTranslations";
import type { QuizFormData, Difficulty } from "@/types/quiz";

interface QuizSettingsProps {
  t: BuilderT["builder"];
  quiz: QuizFormData;
  onField: <K extends keyof QuizFormData>(key: K, val: QuizFormData[K]) => void;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; emoji: string; colorClass: string }[] = [
  { value: "easy", emoji: "🟢", colorClass: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" },
  { value: "medium", emoji: "🟡", colorClass: "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" },
  { value: "hard", emoji: "🔴", colorClass: "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" },
];

export function QuizSettings({ t, quiz, onField }: QuizSettingsProps) {
  const handleTagsInput = (raw: string) => {
    onField("tags", raw.split(",").map((s) => s.trim()).filter(Boolean));
  };

  return (
    <div className="
      rounded-2xl border border-slate-200/80 dark:border-slate-700/60
      bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm
      shadow-sm shadow-slate-100 dark:shadow-slate-900/30
      overflow-hidden
    ">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/40 bg-gradient-to-r from-violet-50/50 to-transparent dark:from-violet-900/10">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <BookOpen size={15} className="text-violet-500" />
          Quiz Settings
        </h2>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.quizTitle} <span className="text-red-400">*</span>
          </label>
          <input
            id="quiz-title-input"
            type="text"
            value={quiz.title}
            onChange={(e) => onField("title", e.target.value)}
            placeholder={t.quizTitlePlaceholder}
            className="
              w-full px-3.5 py-2.5 rounded-xl text-sm
              bg-white dark:bg-slate-900/60
              border border-slate-200 dark:border-slate-600/60
              text-slate-800 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
              transition-all duration-150
            "
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.description}
          </label>
          <textarea
            id="quiz-description-input"
            value={quiz.description}
            onChange={(e) => onField("description", e.target.value)}
            placeholder={t.descriptionPlaceholder}
            rows={3}
            className="
              w-full px-3.5 py-2.5 rounded-xl text-sm resize-none
              bg-white dark:bg-slate-900/60
              border border-slate-200 dark:border-slate-600/60
              text-slate-800 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
              transition-all duration-150
            "
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.category} <span className="text-red-400">*</span>
          </label>
          <select
            id="quiz-category-select"
            value={quiz.category}
            onChange={(e) => onField("category", e.target.value)}
            className="
              w-full px-3.5 py-2.5 rounded-xl text-sm
              bg-white dark:bg-slate-900/60
              border border-slate-200 dark:border-slate-600/60
              text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
              transition-all duration-150 cursor-pointer
            "
          >
            <option value="">{t.categoryPlaceholder}</option>
            {t.categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {t.duration}
            </span>
          </label>
          <input
            id="quiz-duration-input"
            type="number"
            min={1}
            max={180}
            value={quiz.durationMinutes}
            onChange={(e) => onField("durationMinutes", Number(e.target.value))}
            className="
              w-full px-3.5 py-2.5 rounded-xl text-sm
              bg-white dark:bg-slate-900/60
              border border-slate-200 dark:border-slate-600/60
              text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
              transition-all duration-150
            "
          />
        </div>

        {/* Difficulty */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            <span className="inline-flex items-center gap-1">
              <BarChart3 size={11} />
              {t.difficulty}
            </span>
          </label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(({ value, emoji, colorClass }) => (
              <button
                key={value}
                id={`quiz-difficulty-${value}`}
                type="button"
                onClick={() => onField("difficulty", value)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl
                  text-sm font-medium border-2 transition-all duration-150
                  ${quiz.difficulty === value
                    ? colorClass
                    : "border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }
                `}
              >
                <span>{emoji}</span>
                <span className="capitalize">
                  {value === "easy" ? t.easy : value === "medium" ? t.medium : t.hard}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            <span className="inline-flex items-center gap-1">
              <Tag size={11} />
              {t.tags}
            </span>
          </label>
          <input
            id="quiz-tags-input"
            type="text"
            value={quiz.tags.join(", ")}
            onChange={(e) => handleTagsInput(e.target.value)}
            placeholder={t.tagsPlaceholder}
            className="
              w-full px-3.5 py-2.5 rounded-xl text-sm
              bg-white dark:bg-slate-900/60
              border border-slate-200 dark:border-slate-600/60
              text-slate-800 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
              transition-all duration-150
            "
          />
          {quiz.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quiz.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
