"use client";

import { useState, useEffect } from "react";
import { Clock, Tag, BarChart3, BookOpen, Eye } from "lucide-react";
import { Select, ListBox, ListBoxItem } from "@heroui/react";
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
  const [tagsInput, setTagsInput] = useState(() => quiz.tags.join(", "));

  useEffect(() => {
    const currentParsed = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const match =
      currentParsed.length === quiz.tags.length &&
      currentParsed.every((val, idx) => val === quiz.tags[idx]);
    if (!match) {
      setTagsInput(quiz.tags.join(", "));
    }
  }, [quiz.tags]);

  const handleTagsInputChange = (val: string) => {
    setTagsInput(val);
    const parsedTags = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onField("tags", parsedTags);
  };

  return (
    <div
      className="
      rounded-2xl border border-slate-200/80 dark:border-slate-700/60
      bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm
      shadow-sm shadow-slate-100 dark:shadow-slate-900/30
      overflow-hidden
    "
      data-ai-context-type="quiz-settings"
      data-ai-context-name={quiz.title ? `Quiz Settings: ${quiz.title}` : "Quiz Settings"}
      data-ai-context-data={JSON.stringify({ title: quiz.title, description: quiz.description, category: quiz.category, difficulty: quiz.difficulty, tags: quiz.tags, durationMinutes: quiz.durationMinutes, hasTimeLimit: quiz.hasTimeLimit, showAnswersAfterQuiz: quiz.showAnswersAfterQuiz })}
    >
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

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            <span className="inline-flex items-center gap-1">
              <BookOpen size={11} />
              Subject / วิชา
            </span>
          </label>
          <input
            id="quiz-subject-input"
            type="text"
            value={(quiz as any).subject || ""}
            onChange={(e) => onField("subject" as any, e.target.value)}
            placeholder="e.g. Computer Programming"
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

        {/* Chapter */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Chapter / บทเรียน
          </label>
          <input
            id="quiz-chapter-input"
            type="text"
            value={(quiz as any).chapter || ""}
            onChange={(e) => onField("chapter" as any, e.target.value)}
            placeholder="e.g. บทที่ 1"
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

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.category} <span className="text-red-400">*</span>
          </label>
          <Select
            selectedKey={quiz.category || null}
            onSelectionChange={(key) => onField("category", String(key || ""))}
            className="w-full"
          >
            <Select.Trigger className="
              w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm
              bg-white dark:bg-slate-900/60
              border border-slate-200 dark:border-slate-600/60
              text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
              transition-all duration-150 cursor-pointer text-left
            ">
              <Select.Value className="text-slate-800 dark:text-slate-100 text-sm font-medium">
                {({ defaultChildren, isPlaceholder }) =>
                  isPlaceholder ? (
                    <span className="text-slate-400 dark:text-slate-500">{t.categoryPlaceholder}</span>
                  ) : (
                    defaultChildren
                  )
                }
              </Select.Value>
              <Select.Indicator className="w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-250 data-[open=true]:rotate-180" />
            </Select.Trigger>
            <Select.Popover className="
              z-50 min-w-[200px] mt-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg
            ">
              <ListBox className="focus:outline-none">
                {t.categories.map((cat) => (
                  <ListBoxItem
                    key={cat}
                    id={cat}
                    className="
                      px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors duration-150
                      text-slate-700 dark:text-slate-300
                      hover:bg-slate-100 dark:hover:bg-slate-800/80
                      focus:bg-slate-100 dark:focus:bg-slate-800/80
                      focus:outline-none select-none
                      data-[selected=true]:bg-violet-50 dark:data-[selected=true]:bg-violet-900/30
                      data-[selected=true]:text-violet-700 dark:data-[selected=true]:text-violet-300
                    "
                  >
                    {cat}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Show Answers Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.showAnswers || "Show Answers"}
          </label>
          <button
            id="quiz-show-answers-toggle"
            type="button"
            onClick={() => onField("showAnswersAfterQuiz", quiz.showAnswersAfterQuiz === false ? true : false)}
            className={`
              w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150
              ${quiz.showAnswersAfterQuiz !== false
                ? "border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                : "border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }
            `}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Eye size={14} className={quiz.showAnswersAfterQuiz !== false ? "text-violet-500 shrink-0" : "text-slate-400 shrink-0"} />
              <span className="truncate">
                {quiz.showAnswersAfterQuiz !== false
                  ? t.showAnswersEnabled || "Reveal Answers"
                  : t.showAnswersDisabled || "Hide Answers"}
              </span>
            </span>
            <div className={`
              w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0
              ${quiz.showAnswersAfterQuiz !== false ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-600"}
            `}>
              <div className={`
                w-3 h-3 rounded-full bg-white shadow-sm transform duration-200 ease-in-out
                ${quiz.showAnswersAfterQuiz !== false ? "translate-x-4" : "translate-x-0"}
              `} />
            </div>
          </button>
        </div>

        {/* Time Limit Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.timeLimit || "Time Limit"}
          </label>
          <button
            id="quiz-time-limit-toggle"
            type="button"
            onClick={() => onField("hasTimeLimit", quiz.hasTimeLimit === false ? true : false)}
            className={`
              w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150
              ${quiz.hasTimeLimit !== false
                ? "border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                : "border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }
            `}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Clock size={14} className={quiz.hasTimeLimit !== false ? "text-violet-500 shrink-0" : "text-slate-400 shrink-0"} />
              <span className="truncate">
                {quiz.hasTimeLimit !== false
                  ? t.timeLimitEnabled || "Timer Enabled"
                  : t.timeLimitDisabled || "No Timer"}
              </span>
            </span>
            <div className={`
              w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0
              ${quiz.hasTimeLimit !== false ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-600"}
            `}>
              <div className={`
                w-3 h-3 rounded-full bg-white shadow-sm transform duration-200 ease-in-out
                ${quiz.hasTimeLimit !== false ? "translate-x-4" : "translate-x-0"}
              `} />
            </div>
          </button>
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
            disabled={quiz.hasTimeLimit === false}
            value={quiz.durationMinutes}
            onChange={(e) => onField("durationMinutes", Number(e.target.value))}
            className={`
              w-full px-3.5 py-2.5 rounded-xl text-sm
              bg-white dark:bg-slate-900/60
              border border-slate-200 dark:border-slate-600/60
              text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400
              transition-all duration-150
              ${quiz.hasTimeLimit === false ? "opacity-50 cursor-not-allowed select-none bg-slate-100 dark:bg-slate-950/60" : ""}
            `}
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
            value={tagsInput}
            onChange={(e) => handleTagsInputChange(e.target.value)}
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
