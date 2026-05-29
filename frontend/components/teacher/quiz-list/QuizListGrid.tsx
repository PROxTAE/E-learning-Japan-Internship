"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Chip } from "@heroui/react";
import { Clock, HelpCircle, Users, Pencil, Trash2, Share2, Activity } from "lucide-react";
import type { Quiz } from "@/types/teacher/quiz.types";

interface QuizListGridProps {
  quizzes: Quiz[];
  onEdit:         (quiz: Quiz) => void;
  onDelete:       (quiz: Quiz) => void;
  onShare:        (quiz: Quiz) => void;
  onMonitor:      (quiz: Quiz) => void;
  onStatusChange: (quiz: Quiz, status: Quiz["status"]) => void;
}

const STATUS_COLOR = { published: "success", draft: "default", archived: "warning" } as const;
const DIFF_COLOR   = { easy: "success", medium: "warning", hard: "danger" } as const;
const DIFF_LABEL   = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

const EMOJIS = ["📚", "🧠", "💡", "🎯", "🔬", "🌐", "📊", "✏️", "🏆", "⚡"];

function getGradient(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[n % GRADIENTS.length];
}
function getEmoji(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return EMOJIS[n % EMOJIS.length];
}

export function QuizListGrid({ quizzes, onEdit, onDelete, onShare, onMonitor, onStatusChange }: QuizListGridProps) {
  return (
    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {quizzes.map((quiz, i) => (
          <motion.div
            key={quiz.id}
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
          >
            <QuizCard
              quiz={quiz}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
              onMonitor={onMonitor}
              onStatusChange={onStatusChange}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function QuizCard({ quiz, onEdit, onDelete, onShare, onMonitor, onStatusChange }: {
  quiz: Quiz;
  onEdit: (q: Quiz) => void;
  onDelete: (q: Quiz) => void;
  onShare: (q: Quiz) => void;
  onMonitor: (q: Quiz) => void;
  onStatusChange: (q: Quiz, s: Quiz["status"]) => void;
}) {
  const gradient = (quiz as any).gradient || `bg-gradient-to-br ${getGradient(quiz.id)}`;
  const emoji    = (quiz as any).emoji     || getEmoji(quiz.id);

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden"
      data-ai-context-type="quiz"
      data-ai-context-name={quiz.title}
      data-ai-context-data={JSON.stringify(quiz)}
    >
      
      {/* Banner */}
      <div className={`h-28 bg-gradient-to-br ${getGradient(quiz.id)} relative flex items-center justify-center`}>
        <span className="text-5xl drop-shadow-lg">{emoji}</span>

        {/* Hover actions overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {quiz.status === "published" && (
            <ActionButton onClick={() => onMonitor(quiz)} title="Monitor Live" icon={Activity} color="bg-violet-600 hover:bg-violet-700" />
          )}
          <ActionButton onClick={() => onShare(quiz)} title="Share" icon={Share2} color="bg-emerald-600 hover:bg-emerald-700" />
          <ActionButton onClick={() => onEdit(quiz)} title="Edit" icon={Pencil} color="bg-blue-600 hover:bg-blue-700" />
          <ActionButton onClick={() => onDelete(quiz)} title="Delete" icon={Trash2} color="bg-red-600 hover:bg-red-700" />
        </div>

        {/* Status badge top-left */}
        <div className="absolute top-2 left-2">
          <Chip size="sm" color={STATUS_COLOR[quiz.status]} className="text-[10px] h-5 capitalize font-semibold">
            {quiz.status}
          </Chip>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-xs text-gray-500 dark:text-default-400 mt-1 line-clamp-2">{quiz.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Chip size="sm" color={DIFF_COLOR[quiz.difficulty]} variant="flat" className="text-[10px] h-5">
            {DIFF_LABEL[quiz.difficulty]}
          </Chip>
          {quiz.category && (
            <Chip size="sm" variant="flat" className="text-[10px] h-5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-default-400">
              {quiz.category}
            </Chip>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-default-400 pt-2 border-t border-gray-100 dark:border-white/5">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            {(quiz as any).questionCount ?? quiz.questions?.length ?? 0} Qs
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {quiz.hasTimeLimit === false ? "No limit" : `${(quiz as any).duration ?? (quiz as any).durationMinutes ?? 0}m`}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Users className="w-3 h-3" />
            {(quiz as any).totalAttempts ?? 0}
          </span>
        </div>
      </div>

      {/* Quick status toggle bar */}
      <div className="flex border-t border-gray-100 dark:border-white/5">
        {(["draft", "published", "archived"] as Quiz["status"][]).map((s) => (
          <button
            suppressHydrationWarning
            key={s}
            onClick={() => onStatusChange(quiz, s)}
            className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
              quiz.status === s
                ? "bg-violet-600 text-white"
                : "text-gray-400 dark:text-default-500 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ onClick, title, icon: Icon, color }: {
  onClick: () => void;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <button
      suppressHydrationWarning
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className={`w-8 h-8 rounded-lg ${color} text-white flex items-center justify-center shadow-md transition-transform hover:scale-110`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
