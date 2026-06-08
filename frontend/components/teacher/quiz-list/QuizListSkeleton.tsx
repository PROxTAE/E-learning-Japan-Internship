"use client";

export function QuizListSkeleton({ viewMode }: { viewMode: "grid" | "table" }) {
  if (viewMode === "table") {
    return (
      <div className="rounded-2xl overflow-hidden animate-pulse
        border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
        bg-[var(--theme-card-bg)]
        shadow-[4px_4px_0px_var(--theme-text-main)] dark:shadow-[4px_4px_0px_var(--theme-border)]">
        <div className="h-10 bg-[var(--theme-primary)]/60 border-b-2 border-[var(--theme-text-main)]/10 dark:border-[var(--theme-border)]" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b-2 border-[var(--theme-text-main)]/5 dark:border-[var(--theme-border)] last:border-0">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--theme-primary)]/20 rounded-lg w-2/3" />
              <div className="h-3 bg-[var(--theme-text-muted)]/15 rounded-lg w-1/3" />
            </div>
            <div className="h-4 w-8 bg-[var(--theme-text-muted)]/15 rounded" />
            <div className="h-4 w-8 bg-[var(--theme-text-muted)]/15 rounded" />
            <div className="h-4 w-8 bg-[var(--theme-text-muted)]/15 rounded" />
            <div className="flex gap-1.5">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-7 h-7 bg-[var(--theme-text-muted)]/15 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden
          border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
          bg-[var(--theme-card-bg)]
          shadow-[4px_4px_0px_var(--theme-text-main)] dark:shadow-[4px_4px_0px_var(--theme-border)]">
          <div className="h-28 bg-gradient-to-br from-[var(--theme-primary)]/40 to-[var(--theme-secondary)]/30" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-[var(--theme-primary)]/20 rounded-lg w-3/4" />
            <div className="h-3 bg-[var(--theme-text-muted)]/15 rounded-lg w-1/2" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-[var(--theme-secondary)]/30 rounded-md" />
              <div className="h-5 w-14 bg-[var(--theme-text-muted)]/15 rounded-md" />
            </div>
            <div className="flex gap-3 pt-2 border-t-2 border-[var(--theme-text-main)]/10 dark:border-[var(--theme-border)]">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-3 w-10 bg-[var(--theme-text-muted)]/15 rounded" />
              ))}
            </div>
          </div>
          <div className="flex border-t-2 border-[var(--theme-text-main)]/10 dark:border-[var(--theme-border)]">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex-1 h-7 bg-[var(--theme-primary)]/10" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
