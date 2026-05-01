import { BookOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No quizzes found",
  description = "Try adjusting your filters or create a new quiz.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-default-100 dark:bg-default-50/10 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-default-400" />
      </div>
      <div>
        <p className="font-semibold text-default-600 dark:text-default-300">{title}</p>
        <p className="text-sm text-default-400 mt-1 max-w-xs">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
