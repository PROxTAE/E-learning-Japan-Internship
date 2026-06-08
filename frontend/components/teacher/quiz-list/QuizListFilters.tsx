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

  const pillBase = "min-w-0 h-auto px-3 py-1.5 rounded-none font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-none";
  const pillActive = "bg-[var(--theme-primary)] text-black";
  const pillInactive = "bg-transparent text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-secondary)] hover:text-[var(--theme-text-main)]";

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: search + sort + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none z-10">
            <Search className="w-4 h-4" />
          </div>
          <input
            placeholder={ql.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium
              bg-[var(--theme-card-bg)] text-[var(--theme-text-main)]
              border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
              shadow-[2px_2px_0px_var(--theme-text-main)] dark:shadow-[2px_2px_0px_var(--theme-border)]
              placeholder:text-[var(--theme-text-muted)]
              focus:outline-none focus:border-[var(--theme-primary)] focus:shadow-[2px_2px_0px_var(--theme-primary)]
              transition-all"
          />
        </div>

        {/* Sort */}
        <div className="relative flex items-center">
          <SlidersHorizontal className="absolute left-3 w-4 h-4 text-[var(--theme-text-muted)] pointer-events-none z-10" />
          <Select
            selectedKey={sortBy}
            onSelectionChange={(key) => setSortBy(String(key) as any)}
            className="min-w-[180px]"
          >
            <Select.Trigger className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide
              bg-[var(--theme-card-bg)] text-[var(--theme-text-main)]
              border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
              shadow-[2px_2px_0px_var(--theme-text-main)] dark:shadow-[2px_2px_0px_var(--theme-border)]
              cursor-pointer text-left focus:outline-none flex items-center justify-between">
              <Select.Value className="text-sm font-black">
                {({ defaultChildren, isPlaceholder }) =>
                  isPlaceholder ? (
                    <span className="text-[var(--theme-text-muted)]">{ql.sortBy}</span>
                  ) : (
                    defaultChildren
                  )
                }
              </Select.Value>
              <Select.Indicator className="w-4 h-4 text-[var(--theme-text-muted)] ml-2" />
            </Select.Trigger>
            <Select.Popover className="z-50 min-w-[180px] mt-1 p-1
              bg-[var(--theme-card-bg)]
              border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
              rounded-xl shadow-[3px_3px_0px_var(--theme-text-main)] dark:shadow-[3px_3px_0px_var(--theme-border)]">
              <ListBox className="focus:outline-none">
                {SORT_OPTIONS.map((o) => (
                  <ListBoxItem
                    key={o.value}
                    id={o.value}
                    className="px-3 py-2 text-xs rounded-lg cursor-pointer font-bold uppercase tracking-wide
                      text-[var(--theme-text-main)]
                      hover:bg-[var(--theme-primary)] hover:text-black
                      data-[selected=true]:bg-[var(--theme-primary)] data-[selected=true]:text-black
                      select-none transition-colors"
                  >
                    {o.label}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
          bg-[var(--theme-card-bg)] overflow-hidden shrink-0
          shadow-[2px_2px_0px_var(--theme-text-main)] dark:shadow-[2px_2px_0px_var(--theme-border)]">
          {(["grid", "table"] as const).map((mode) => (
            <Button
              key={mode}
              onPress={() => setViewMode(mode)}
              className={`min-w-0 px-3 py-2 h-auto rounded-none transition-all cursor-pointer ${
                viewMode === mode
                  ? "bg-[var(--theme-primary)] text-black font-black"
                  : "bg-transparent text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-secondary)]"
              }`}
            >
              {mode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </Button>
          ))}
        </div>
      </div>

      {/* Bottom row: filter pills + result count */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter pills */}
        <div className="flex rounded-xl border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
          bg-[var(--theme-card-bg)] overflow-hidden text-xs
          shadow-[2px_2px_0px_var(--theme-text-main)] dark:shadow-[2px_2px_0px_var(--theme-border)]">
          {STATUS_OPTIONS.map(o => (
            <Button
              key={o.value}
              onPress={() => setStatusFilter(o.value as typeof statusFilter)}
              className={`${pillBase} ${statusFilter === o.value ? pillActive : pillInactive}`}
            >
              {o.label}
            </Button>
          ))}
        </div>

        {/* Difficulty filter pills */}
        <div className="flex rounded-xl border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
          bg-[var(--theme-card-bg)] overflow-hidden text-xs
          shadow-[2px_2px_0px_var(--theme-text-main)] dark:shadow-[2px_2px_0px_var(--theme-border)]">
          {DIFF_OPTIONS.map(o => (
            <Button
              key={o.value}
              onPress={() => setDiffFilter(o.value as typeof diffFilter)}
              className={`${pillBase} ${diffFilter === o.value ? pillActive : pillInactive}`}
            >
              {o.label}
            </Button>
          ))}
        </div>

        <span className="ml-auto text-xs font-bold text-[var(--theme-text-muted)]">
          {ql.resultCount(resultCount)}
        </span>
      </div>
    </div>
  );
}
