"use client";

import { Input } from "@heroui/react";
import { Search, LayoutGrid, List, SlidersHorizontal } from "lucide-react";

interface QuizListFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: "all" | "published" | "draft" | "archived";
  setStatusFilter: (v: "all" | "published" | "draft" | "archived") => void;
  diffFilter: "all" | "easy" | "medium" | "hard";
  setDiffFilter: (v: "all" | "easy" | "medium" | "hard") => void;
  sortBy: "updatedAt" | "title" | "attempts";
  setSortBy: (v: "updatedAt" | "title" | "attempts") => void;
  viewMode: "grid" | "table";
  setViewMode: (v: "grid" | "table") => void;
  resultCount: number;
}

const STATUS_OPTIONS = [
  { value: "all",       label: "All" },
  { value: "published", label: "Published" },
  { value: "draft",     label: "Draft" },
  { value: "archived",  label: "Archived" },
] as const;

const DIFF_OPTIONS = [
  { value: "all",    label: "All Levels" },
  { value: "easy",   label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard",   label: "Hard" },
] as const;

const SORT_OPTIONS = [
  { value: "updatedAt", label: "Last Updated" },
  { value: "title",     label: "A → Z" },
  { value: "attempts",  label: "Most Attempts" },
] as const;

export function QuizListFilters({
  search, setSearch,
  statusFilter, setStatusFilter,
  diffFilter, setDiffFilter,
  sortBy, setSortBy,
  viewMode, setViewMode,
  resultCount,
}: QuizListFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Top row: search + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <Input
            placeholder="Search quizzes by title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
          <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-default-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-transparent text-sm text-gray-700 dark:text-default-300 outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shrink-0">
          {(["grid", "table"] as const).map((mode) => (
            <button
              suppressHydrationWarning
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 transition-all ${viewMode === mode
                ? "bg-violet-600 text-white"
                : "text-gray-500 dark:text-default-400 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {mode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: filter pills + result count */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden text-xs">
          {STATUS_OPTIONS.map(o => (
            <button
              suppressHydrationWarning
              key={o.value}
              onClick={() => setStatusFilter(o.value as typeof statusFilter)}
              className={`px-3 py-1.5 font-medium transition-all ${statusFilter === o.value
                ? "bg-violet-600 text-white"
                : "text-gray-600 dark:text-default-400 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden text-xs">
          {DIFF_OPTIONS.map(o => (
            <button
              suppressHydrationWarning
              key={o.value}
              onClick={() => setDiffFilter(o.value as typeof diffFilter)}
              className={`px-3 py-1.5 font-medium transition-all ${diffFilter === o.value
                ? "bg-violet-600 text-white"
                : "text-gray-600 dark:text-default-400 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-500 dark:text-default-400">
          {resultCount} quiz{resultCount !== 1 ? "zes" : ""}
        </span>
      </div>
    </div>
  );
}
