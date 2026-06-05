"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
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
            <div className="w-full max-w-md bg-white dark:bg-[#1a1a2e] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 pointer-events-auto overflow-hidden">
              
              {/* Top danger strip */}
              <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />

              <div className="p-6 space-y-4">
                {/* Icon + title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{ql.deleteTitle}</h3>
                    <p className="text-xs text-gray-500 dark:text-default-400">{ql.deleteUndone}</p>
                  </div>
                </div>

                {/* Quiz preview */}
                <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{quiz.title}</p>
                  <p className="text-xs text-gray-500 dark:text-default-400 mt-0.5">
                    {(quiz as any).questionCount ?? (quiz as any).questions?.length ?? 0} questions · {quiz.status}
                  </p>
                </div>

                <p className="text-sm text-gray-600 dark:text-default-400">
                  {ql.deleteConfirmText}
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onPress={onClose}
                    isDisabled={isDeleting}
                  >
                    {ql.cancel}
                  </Button>
                  <Button
                    {...{ isLoading: isDeleting } as any}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold"
                    onPress={onConfirm}
                  >
                    <Trash2 className="w-4 h-4" />
                    {ql.deleteBtn}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
