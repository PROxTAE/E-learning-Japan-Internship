"use client";

import { Input, Select, ListBox, ListBoxItem, Button } from "@heroui/react";
import { Search, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";

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

export function QuizListFilters({
  search, setSearch,
  statusFilter, setStatusFilter,
  diffFilter, setDiffFilter,
  sortBy, setSortBy,
  viewMode, setViewMode,
  resultCount,
}: QuizListFiltersProps) {
  const { t } = useLang();
  const ql = t.quizList;

  const STATUS_OPTIONS = [
    { value: "all",       label: ql.statusAll },
    { value: "published", label: ql.statusPublished },
    { value: "draft",     label: ql.statusDraft },
    { value: "archived",  label: ql.statusArchived },
  ] as const;

  const DIFF_OPTIONS = [
    { value: "all",    label: ql.diffAll },
    { value: "easy",   label: ql.diffEasy },
    { value: "medium", label: ql.diffMedium },
    { value: "hard",   label: ql.diffHard },
  ] as const;

  const SORT_OPTIONS = [
    { value: "updatedAt", label: ql.sortUpdatedAt },
    { value: "title",     label: ql.sortTitle },
    { value: "attempts",  label: ql.sortAttempts },
  ] as const;

  return (
    <div suppressHydrationWarning className="flex flex-col gap-3">
      {/* Top row: search + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <Input
            placeholder={ql.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>

        {/* Sort */}
        <div className="relative flex items-center">
          <SlidersHorizontal className="absolute left-3 w-4 h-4 text-gray-500 dark:text-default-400 pointer-events-none z-10" />
          <Select
            selectedKey={sortBy}
            onSelectionChange={(key) => setSortBy(String(key) as any)}
            className="min-w-[180px]"
          >
            <Select.Trigger className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-default-300 cursor-pointer text-left focus:outline-none flex items-center justify-between">
              <Select.Value className="text-sm font-medium">
                {({ defaultChildren, isPlaceholder }) =>
                  isPlaceholder ? (
                    <span className="text-gray-400">{ql.sortBy}</span>
                  ) : (
                    defaultChildren
                  )
                }
              </Select.Value>
              <Select.Indicator className="w-4 h-4 text-gray-400 ml-2" />
            </Select.Trigger>
            <Select.Popover className="z-50 min-w-[180px] mt-1 p-1 bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg">
              <ListBox className="focus:outline-none">
                {SORT_OPTIONS.map((o) => (
                  <ListBoxItem
                    key={o.value}
                    id={o.value}
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-white/5 text-foreground select-none data-[selected=true]:bg-violet-50 dark:data-[selected=true]:bg-violet-900/30 data-[selected=true]:text-violet-700 dark:data-[selected=true]:text-violet-300"
                  >
                    {o.label}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shrink-0">
          {(["grid", "table"] as const).map((mode) => (
            <Button
              key={mode}
              onPress={() => setViewMode(mode)}
              aria-label={mode === "grid" ? ql.viewGrid ?? "Grid view" : ql.viewTable ?? "Table view"}
              className={`min-w-0 px-3 py-2 h-auto rounded-none transition-all ${
                viewMode === mode
                  ? "bg-violet-600 text-white font-semibold"
                  : "bg-transparent text-gray-500 dark:text-default-400 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {mode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </Button>
          ))}
        </div>
      </div>

      {/* Bottom row: filter pills + result count */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden text-xs">
          {STATUS_OPTIONS.map(o => (
            <Button
              key={o.value}
              onPress={() => setStatusFilter(o.value as typeof statusFilter)}
              aria-label={o.label}
              className={`min-w-0 h-auto px-3 py-1.5 rounded-none font-medium text-xs transition-all ${
                statusFilter === o.value
                  ? "bg-violet-600 text-white"
                  : "bg-transparent text-gray-600 dark:text-default-400 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {o.label}
            </Button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden text-xs">
          {DIFF_OPTIONS.map(o => (
            <Button
              key={o.value}
              onPress={() => setDiffFilter(o.value as typeof diffFilter)}
              aria-label={o.label}
              className={`min-w-0 h-auto px-3 py-1.5 rounded-none font-medium text-xs transition-all ${
                diffFilter === o.value
                  ? "bg-violet-600 text-white"
                  : "bg-transparent text-gray-600 dark:text-default-400 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {o.label}
            </Button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-500 dark:text-default-400">
          {ql.resultCount(resultCount)}
        </span>
      </div>
    </div>
  );
}
