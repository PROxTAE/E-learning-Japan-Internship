"use client";

export function QuizListSkeleton({ viewMode }: { viewMode: "grid" | "table" }) {
  if (viewMode === "table") {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden animate-pulse">
        <div className="h-10 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-lg w-2/3" />
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-lg w-1/3" />
            </div>
            <div className="h-4 w-8 bg-gray-100 dark:bg-white/5 rounded" />
            <div className="h-4 w-8 bg-gray-100 dark:bg-white/5 rounded" />
            <div className="h-4 w-8 bg-gray-100 dark:bg-white/5 rounded" />
            <div className="flex gap-1.5">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-7 h-7 bg-gray-100 dark:bg-white/5 rounded-lg" />
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
        <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/5">
          <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/5" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-lg w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-lg w-1/2" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
              <div className="h-5 w-14 bg-gray-100 dark:bg-white/5 rounded-full" />
            </div>
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-3 w-10 bg-gray-100 dark:bg-white/5 rounded" />
              ))}
            </div>
          </div>
          <div className="flex border-t border-gray-100 dark:border-white/5">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex-1 h-7 bg-gray-50 dark:bg-white/[0.03]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
