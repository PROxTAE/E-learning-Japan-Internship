"use client";

import { useMonitoringStore } from "@/store/monitoringStore";
import { StudentRow } from "./StudentRow";
import { AnswerCell } from "./AnswerCell";
import { QuestionTooltip } from "./QuestionTooltip";
import { ScrollShadow } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";

export function MonitoringGrid() {
  const { t } = useLang();
  const { students, questions, answers, uiState } = useMonitoringStore();

  // Filter & Sort Logic
  let processedStudents = [...students];

  if (uiState.searchQuery) {
    const q = uiState.searchQuery.toLowerCase();
    processedStudents = processedStudents.filter(s => s.name.toLowerCase().includes(q));
  }

  if (uiState.filter === "completed") {
    processedStudents = processedStudents.filter(s => s.progress === 100);
  } else if (uiState.filter === "incorrect") {
    const wrongIds = new Set(answers.filter(a => a.state === "wrong").map(a => a.studentId));
    processedStudents = processedStudents.filter(s => wrongIds.has(s.id));
  }

  if (uiState.sortBy === "score") processedStudents.sort((a, b) => b.score - a.score);

  // Deduplicate by id — guard against empty/undefined ids from socket events
  const seen = new Set<string>();
  processedStudents = processedStudents.filter((s) => {
    const key = s.id || "";
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl shadow-xl dark:shadow-2xl overflow-hidden flex flex-col h-full min-h-[600px]">
      <ScrollShadow className="flex-1 overflow-auto" orientation="horizontal">
        <div className="min-w-max">

          {/* Header Row */}
          <div className="flex border-b border-gray-200 dark:border-white/10 sticky top-0 bg-gray-50/90 dark:bg-[#0f0f1a]/80 backdrop-blur-xl z-30">
            <div className="w-56 shrink-0 p-4 sticky left-0 bg-gray-50 dark:bg-[#0f0f1a]/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 z-40">
              <span className="text-[10px] font-bold text-gray-500 dark:text-default-400 uppercase tracking-[0.2em]">{t.monitoring.registry}</span>
            </div>

            <div className="flex px-4 py-4">
              {questions.map((q) => (
                <div key={q.id} className="w-16 shrink-0 flex justify-center">
                  <QuestionTooltip question={q}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="cursor-pointer group flex flex-col items-center gap-1.5"
                    >
                      <span className="text-[11px] font-bold text-gray-500 dark:text-default-400 group-hover:text-primary transition-colors">Q{q.number}</span>
                      <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(0,0,0,0.5)] ${q.difficulty === "easy" ? "bg-success-500 shadow-success-500/20" :
                        q.difficulty === "medium" ? "bg-warning-500 shadow-warning-500/20" : "bg-danger-500 shadow-danger-500/20"
                        }`} />
                    </motion.div>
                  </QuestionTooltip>
                </div>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div className="pb-8">
            <AnimatePresence mode="popLayout">
              {processedStudents.map((student, idx) => (
                <motion.div
                  layout
                  key={student.id || `fallback-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex border-b border-gray-100 dark:border-white/5 transition-colors group/row hover:bg-gray-50 dark:hover:bg-white/[0.03] ${idx % 2 === 0 ? "bg-transparent" : "bg-gray-50/50 dark:bg-white/[0.01]"
                    }`}
                >
                  {/* Sticky Student Info */}
                  <div className="sticky left-0 bg-white dark:bg-[#0f0f1a]/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 z-20 group-hover/row:bg-gray-100 dark:group-hover/row:bg-white/5 transition-colors">
                    <StudentRow student={student} />
                  </div>

                  {/* Answer Matrix */}
                  <div className="flex px-4 py-3 items-center">
                    {questions.map((q) => {
                      const ans = answers.find(a => a.studentId === student.id && a.questionId === q.id);
                      return (
                        <div key={q.id} className="w-16 shrink-0 flex justify-center">
                          <AnswerCell
                            answer={ans}
                            question={q}
                            student={student}
                            heatmapMode={uiState.heatmapMode}
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </ScrollShadow>
    </div>
  );
}
