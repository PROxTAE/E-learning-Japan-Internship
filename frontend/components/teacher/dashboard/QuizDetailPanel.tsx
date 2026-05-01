"use client";

import { useState } from "react";
import { Chip, Tabs, TabList, Tab, TabPanel } from "@heroui/react";
import { X, Pencil, Clock, HelpCircle, Users, TrendingUp, CheckCircle, Tag, Share2 } from "lucide-react";
import type { Quiz } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";
import { ShareQuizModal } from "./ShareQuizModal";

interface QuizDetailPanelProps {
  quiz: Quiz;
  onClose: () => void;
  onEdit: (quiz: Quiz) => void;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-default-100 dark:bg-default-700/30 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function QuizDetailPanel({ quiz, onClose, onEdit }: QuizDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("info");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { t } = useLang();
  const d = t.detail;

  const scoreColor = quiz.averageScore >= 70 ? "bg-emerald-500" : quiz.averageScore >= 50 ? "bg-amber-500" : "bg-red-500";
  const completionColor = quiz.completionRate >= 70 ? "bg-emerald-500" : quiz.completionRate >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <aside className="w-full h-full flex flex-col border-l border-default-200/50 dark:border-default-700/30 bg-white/80 dark:bg-white/5 backdrop-blur-xl overflow-y-auto">
      <div className={`h-32 bg-gradient-to-br ${quiz.gradient} flex items-center justify-center relative shrink-0`}>
        <span className="text-5xl">{quiz.emoji}</span>
        <button onClick={onClose} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm flex items-center justify-center" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-base text-default-900 dark:text-default-100 leading-snug">{quiz.title}</h2>
            <p className="text-xs text-default-400 mt-0.5">{quiz.categoryName}</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors w-full justify-center">
              <Share2 className="w-3 h-3" />{d.share}
            </button>
            <button onClick={() => onEdit(quiz)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 transition-colors w-full justify-center">
              <Pencil className="w-3 h-3" />{d.edit}
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <Chip size="sm" color={quiz.status === "published" ? "success" : quiz.status === "draft" ? "default" : "warning"}>
            {t.status[quiz.status]}
          </Chip>
          <Chip size="sm" color={quiz.difficulty === "easy" ? "success" : quiz.difficulty === "medium" ? "warning" : "danger"}>
            {t.difficulty[quiz.difficulty]}
          </Chip>
        </div>

        <Tabs variant="primary" onSelectionChange={(key) => setActiveTab(key as string)}>
          <TabList className="border-b border-default-200/50 dark:border-default-700/30">
            <Tab id="info" className="text-sm">{d.infoTab}</Tab>
            <Tab id="stats" className="text-sm">{d.statsTab}</Tab>
          </TabList>

          <TabPanel id="info" className="pt-3 flex flex-col gap-2">
            <p className="text-sm text-default-500 leading-relaxed">{quiz.description}</p>
            <div className="mt-2 border-t border-default-100 dark:border-default-700/30 pt-2 space-y-2">
              {[
                { icon: <HelpCircle className="w-3.5 h-3.5" />, label: d.questions, value: quiz.questionCount },
                { icon: <Clock className="w-3.5 h-3.5" />, label: d.duration(quiz.duration), value: "" },
                { icon: <Users className="w-3.5 h-3.5" />, label: d.attempts, value: quiz.totalAttempts },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-default-500">{icon}{label}</span>
                  {value !== "" && <span className="font-semibold text-default-800 dark:text-default-200">{value}</span>}
                </div>
              ))}
            </div>
            {quiz.tags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-default-400 flex items-center gap-1 mb-1.5"><Tag className="w-3 h-3" /> {d.tags}</p>
                <div className="flex flex-wrap gap-1">
                  {quiz.tags.map((tag) => (
                    <Chip key={tag} size="sm" color="default" className="text-xs">{tag}</Chip>
                  ))}
                </div>
              </div>
            )}
          </TabPanel>

          <TabPanel id="stats" className="pt-3 flex flex-col gap-4">
            <div className="bg-default-50 dark:bg-white/5 border border-default-200/40 dark:border-default-700/30 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-default-500 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{d.avgScore}</p>
                <span className="text-sm font-bold text-default-800 dark:text-default-200">{quiz.averageScore}%</span>
              </div>
              <ProgressBar value={quiz.averageScore} color={scoreColor} />
            </div>
            <div className="bg-default-50 dark:bg-white/5 border border-default-200/40 dark:border-default-700/30 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-default-500 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{d.completionRate}</p>
                <span className="text-sm font-bold text-default-800 dark:text-default-200">{quiz.completionRate}%</span>
              </div>
              <ProgressBar value={quiz.completionRate} color={completionColor} />
            </div>
            <div className="text-xs text-default-400 space-y-1">
              <p>{d.created}: {new Date(quiz.createdAt).toLocaleDateString()}</p>
              <p>{d.updated}: {new Date(quiz.updatedAt).toLocaleDateString()}</p>
            </div>
          </TabPanel>
        </Tabs>
      </div>
      
      {/* Share Modal */}
      <ShareQuizModal 
        quiz={quiz} 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
      />
    </aside>
  );
}
