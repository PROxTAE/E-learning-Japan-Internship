"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle } from "lucide-react";
import type { Quiz } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";

interface QuizDeleteModalProps {
  quiz:       Quiz | null;
  isOpen:     boolean;
  onClose:    () => void;
  onConfirm:  () => void;
  isDeleting: boolean;
}

export function QuizDeleteModal({ quiz, isOpen, onClose, onConfirm, isDeleting }: QuizDeleteModalProps) {
  const { t } = useLang();
  const ql = t.quizList;

  return (
    <AnimatePresence>
      {isOpen && quiz && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-md pointer-events-auto overflow-hidden rounded-3xl
              border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
              bg-[var(--theme-card-bg)]
              shadow-[6px_6px_0px_var(--theme-text-main)] dark:shadow-[6px_6px_0px_var(--theme-border)]">

              {/* Top danger strip */}
              <div className="h-2 bg-gradient-to-r from-red-500 to-[#FF6EB4]" />

              <div className="p-6 space-y-4">
                {/* Icon + title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center
                    bg-red-500/10 border-2 border-red-500/30">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--theme-text-main)] uppercase tracking-tight">{ql.deleteTitle}</h3>
                    <p className="text-xs text-[var(--theme-text-muted)] font-medium">{ql.deleteUndone}</p>
                  </div>
                </div>

                {/* Quiz preview */}
                <div className="px-4 py-3 rounded-xl
                  border-2 border-[var(--theme-text-main)]/10 dark:border-[var(--theme-border)]
                  bg-[var(--theme-bg-secondary)]">
                  <p className="text-sm font-black text-[var(--theme-text-main)] line-clamp-1 uppercase tracking-tight">{quiz.title}</p>
                  <p className="text-xs text-[var(--theme-text-muted)] mt-0.5 font-medium">
                    {(quiz as any).questionCount ?? (quiz as any).questions?.length ?? 0} questions · {quiz.status}
                  </p>
                </div>

                <p className="text-sm text-[var(--theme-text-muted)] font-medium">
                  {ql.deleteConfirmText}
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-full
                      bg-[var(--theme-card-bg)] text-[var(--theme-text-main)] font-black text-sm uppercase tracking-wider
                      border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
                      shadow-[2px_2px_0px_var(--theme-text-main)] dark:shadow-[2px_2px_0px_var(--theme-border)]
                      hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--theme-text-main)]
                      active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0px_var(--theme-text-main)]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-100 cursor-pointer"
                  >
                    {ql.cancel}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full
                      bg-gradient-to-r from-red-500 to-[#FF6EB4] text-white font-black text-sm uppercase tracking-wider
                      border-2 border-red-600
                      shadow-[2px_2px_0px_red] 
                      hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_red]
                      active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0px_red]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-100 cursor-pointer"
                  >
                    {isDeleting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {ql.deleteBtn}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
