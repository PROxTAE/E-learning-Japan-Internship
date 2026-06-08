"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Chip, Button } from "@heroui/react";
import {
  Clock,
  HelpCircle,
  Users,
  Pencil,
  Trash2,
  Share2,
  Activity,
  History,
  BookOpen,
  Brain,
  Lightbulb,
  Target,
  Microscope,
  Globe,
  BarChart3,
  Trophy,
  Zap
} from "lucide-react";
import type { Quiz } from "@/types/teacher/quiz.types";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageContext";

interface QuizListGridProps {
  quizzes: Quiz[];
  onEdit:         (quiz: Quiz) => void;
  onDelete:       (quiz: Quiz) => void;
  onShare:        (quiz: Quiz) => void;
  onMonitor:      (quiz: Quiz) => void;
  onStatusChange: (quiz: Quiz, status: Quiz["status"]) => void;
}

// Cyber banner gradients — using theme brand colors
const CYBER_BANNERS = [
  "from-[#00BCD4] to-[#0097A7]",        // cyan
  "from-[#BAFF29] to-[#9EE010]",        // lime
  "from-[#FF6EB4] to-[#E05AA0]",        // pink
  "from-[#8C5CF6] to-[#6D3FD5]",        // purple
  "from-[#00BCD4] to-[#BAFF29]",        // cyan → lime
  "from-[#FF6EB4] to-[#8C5CF6]",        // pink → purple
];

const ICONS = [BookOpen, Brain, Lightbulb, Target, Microscope, Globe, BarChart3, Pencil, Trophy, Zap];

const EMOJI_TO_ICON: Record<string, React.ComponentType<any>> = {
  "📚": BookOpen,
  "🧠": Brain,
  "💡": Lightbulb,
  "🎯": Target,
  "🔬": Microscope,
  "🌐": Globe,
  "📊": BarChart3,
  "✏️": Pencil,
  "🏆": Trophy,
  "⚡": Zap,
};

function getBanner(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return CYBER_BANNERS[n % CYBER_BANNERS.length];
}
function getIconComponent(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ICONS[n % ICONS.length];
}

// Status badge mapping to cyber colors
const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  published: { bg: "bg-[var(--theme-secondary)]", text: "text-black", label: "LIVE" },
  draft:     { bg: "bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]", text: "text-[var(--theme-accent)]", label: "DRAFT" },
  archived:  { bg: "bg-black/30", text: "text-white", label: "ARCHIVED" },
};

const DIFF_BADGE: Record<string, string> = {
  easy:   "bg-[var(--theme-secondary)] text-black",
  medium: "bg-[#FF6EB4] text-black",
  hard:   "bg-red-500 text-white",
};

export function QuizListGrid({ quizzes, onEdit, onDelete, onShare, onMonitor, onStatusChange }: QuizListGridProps) {
  const router = useRouter();
  const { t } = useLang();
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
              onHistory={() => router.push(`/teacher/quizzes/${quiz.id}/history`)}
              onStatusChange={onStatusChange}
              t={t}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function QuizCard({ quiz, onEdit, onDelete, onShare, onMonitor, onHistory, onStatusChange, t }: {
  quiz: Quiz;
  onEdit: (q: Quiz) => void;
  onDelete: (q: Quiz) => void;
  onShare: (q: Quiz) => void;
  onMonitor: (q: Quiz) => void;
  onHistory: () => void;
  onStatusChange: (q: Quiz, s: Quiz["status"]) => void;
  t: any;
}) {
  const ql = t.quizList;
  const customEmoji = (quiz as any).emoji;
  const MappedIcon = customEmoji ? EMOJI_TO_ICON[customEmoji] : null;
  const statusBadge = STATUS_BADGE[quiz.status] ?? STATUS_BADGE.draft;

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer
        border-2 border-[var(--theme-text-main)] dark:border-[var(--theme-border)]
        bg-[var(--theme-card-bg)]
        shadow-[4px_4px_0px_var(--theme-text-main)] dark:shadow-[4px_4px_0px_var(--theme-border)]
        hover:translate-x-[-2px] hover:translate-y-[-2px]
        hover:shadow-[6px_6px_0px_var(--theme-text-main)] dark:hover:shadow-[6px_6px_0px_var(--theme-border)]
        transition-all duration-150"
      data-ai-context-type="quiz"
      data-ai-context-name={quiz.title}
      data-ai-context-data={JSON.stringify(quiz)}
    >
      {/* Banner */}
      <div className={`h-28 bg-gradient-to-br ${getBanner(quiz.id)} relative flex items-center justify-center`}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        {MappedIcon ? (
          <MappedIcon className="w-14 h-14 text-white drop-shadow-lg relative z-10" />
        ) : customEmoji ? (
          <span className="text-5xl drop-shadow-lg relative z-10">{customEmoji}</span>
        ) : (
          (() => {
            const FallbackIcon = getIconComponent(quiz.id);
            return <FallbackIcon className="w-14 h-14 text-white drop-shadow-lg relative z-10" />;
          })()
        )}

        {/* Hover actions overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
          {quiz.status === "published" && (
            <CyberActionBtn onClick={() => onMonitor(quiz)} title={ql.monitorLive} icon={Activity} color="bg-[var(--theme-primary)]" textColor="text-black" />
          )}
          <CyberActionBtn onClick={onHistory} title={ql.viewHistory} icon={History} color="bg-[var(--theme-accent)]" textColor="text-white" />
          <CyberActionBtn onClick={() => onShare(quiz)} title={ql.share} icon={Share2} color="bg-[var(--theme-secondary)]" textColor="text-black" />
          <CyberActionBtn onClick={() => onEdit(quiz)} title={ql.edit} icon={Pencil} color="bg-white" textColor="text-black" />
          <CyberActionBtn onClick={() => onDelete(quiz)} title={ql.delete} icon={Trash2} color="bg-red-500" textColor="text-white" />
        </div>

        {/* Status badge top-left */}
        <div className="absolute top-2 left-2 z-10">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-black/20 ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-black text-[var(--theme-text-main)] text-sm line-clamp-2 leading-snug uppercase tracking-tight">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-xs text-[var(--theme-text-muted)] mt-1 line-clamp-2 font-medium">{quiz.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-black/20 ${DIFF_BADGE[quiz.difficulty] ?? "bg-gray-200 text-black"}`}>
            {ql.diffLabel[quiz.difficulty] ?? quiz.difficulty}
          </span>
          {(quiz as any).category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--theme-bg-secondary)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]">
              {(quiz as any).category}
            </span>
          )}
          {quiz.subject && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/40">
              {quiz.subject}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-[var(--theme-text-muted)] pt-2 border-t-2 border-[var(--theme-text-main)]/10 dark:border-[var(--theme-border)] font-bold">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            {(quiz as any).questionCount ?? (quiz as any).questions?.length ?? 0} Qs
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {quiz.hasTimeLimit === false ? ql.noLimit : `${(quiz as any).duration ?? (quiz as any).durationMinutes ?? 0}m`}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Users className="w-3 h-3" />
            {(quiz as any).totalAttempts ?? 0}
          </span>
        </div>
      </div>

      {/* Quick status toggle bar */}
      <div className="flex border-t-2 border-[var(--theme-text-main)]/10 dark:border-[var(--theme-border)]">
        {(["draft", "published", "archived"] as Quiz["status"][]).map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(quiz, s)}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border-none
              ${quiz.status === s
                ? "bg-[var(--theme-primary)] text-black"
                : "bg-transparent text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-secondary)]"
              }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function CyberActionBtn({ onClick, title, icon: Icon, color, textColor }: {
  onClick: () => void;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className={`w-8 h-8 min-w-0 rounded-lg ${color} ${textColor}
        flex items-center justify-center
        border border-black/30
        shadow-[1px_1px_0px_rgba(0,0,0,0.5)]
        hover:scale-110 transition-transform cursor-pointer`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
