"use client";

import { Avatar, Button, Card, CardContent, Spinner } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Users, Wifi, WifiOff, Play, LogOut, GraduationCap } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Student } from "@/types/teacher/monitoring.types";

export interface WaitingRoomProps {
  role: "student" | "teacher";
  quizTitle: string;
  code?: string;
  questionCount?: number;
  students: Student[];
  /** The current student's id (used to highlight "You" and read ready state) */
  myStudentId?: string;
  isReady?: boolean;
  isConnected: boolean;
  onToggleReady?: () => void;
  onStart?: () => void;
  onLeave?: () => void;
  /** Display-only projector mode: hides interactive footer, larger layout */
  presentation?: boolean;
}

/**
 * WaitingRoom — shared lobby shown before a quiz starts.
 *
 * Students see who else has joined (name + avatar) and can flag themselves
 * "ready". Teachers see the same roster plus a "Start Quiz" control. The same
 * component renders for both roles, differing only by the action footer.
 */
export function WaitingRoom({
  role,
  quizTitle,
  code,
  questionCount,
  students,
  myStudentId,
  isReady = false,
  isConnected,
  onToggleReady,
  onStart,
  onLeave,
  presentation = false,
}: WaitingRoomProps) {
  const { t } = useLang();

  // Only count online students in the roster
  const roster = students.filter((s) => s.isOnline !== false);
  const readyCount = roster.filter((s) => s.isReady).length;

  return (
    <div className={`relative min-h-full flex flex-col items-center justify-start px-4 sm:px-6 py-6 sm:py-10 w-full mx-auto ${presentation ? "max-w-6xl" : "max-w-4xl"}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col gap-5 sm:gap-6"
      >
        {/* ── Header (on gradient, no banner) ─────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">
              {role === "teacher" ? t.play.waitingTeacherView : t.play.waitingTitle}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-sm truncate">
              {quizTitle}
            </h1>
            <p className="text-white/70 text-sm">{t.play.waitingSubtitle}</p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className={`flex items-center gap-1.5 backdrop-blur-md border border-white/25 rounded-full px-3 py-1.5 ${isConnected ? "bg-emerald-500/25" : "bg-white/10"}`}>
              {isConnected
                ? <Wifi className="w-3.5 h-3.5 text-emerald-200" />
                : <WifiOff className="w-3.5 h-3.5 text-white/60" />}
              <span className="font-bold text-[11px] uppercase tracking-tight text-white/90">
                {isConnected ? t.play.live : t.play.waitingConnecting}
              </span>
            </div>
            {code && (
              <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3 py-1.5 text-white font-mono font-bold tracking-[0.2em] text-sm">
                {code}
              </div>
            )}
          </div>
        </div>

        {/* ── Count strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3">
            <Users className="w-5 h-5 text-white/80 shrink-0" />
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{roster.length}</span>
              <span className="text-white/70 text-xs font-semibold truncate">{t.play.waitingStudentsJoined}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-500/25 backdrop-blur-md border border-emerald-300/30 rounded-2xl px-4 py-3">
            <Check className="w-5 h-5 text-emerald-200 shrink-0" />
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{readyCount}</span>
              <span className="text-white/80 text-xs font-semibold truncate">{t.play.waitingReadyOf}</span>
            </div>
          </div>
        </div>

        {/* ── Roster — the focus ──────────────────────────────────── */}
        <Card className="w-full rounded-[28px] border-0 shadow-2xl bg-white dark:bg-zinc-900">
          <CardContent className="p-4 sm:p-6 min-h-[260px] sm:min-h-[320px] flex">
            {roster.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 w-full text-center">
                <Spinner size="lg" />
                <p className="text-zinc-400 dark:text-zinc-500 font-semibold text-sm">
                  {t.play.waitingNoStudents}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 w-full content-start">
                <AnimatePresence>
                  {roster.map((s) => {
                    const isMe = !!myStudentId && (s.studentId === myStudentId || s.id === myStudentId);
                    return (
                      <motion.div
                        key={s.id || s.studentId}
                        layout
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: "spring", stiffness: 320, damping: 22 }}
                        className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border transition-colors ${
                          isMe
                            ? "border-violet-300 dark:border-violet-500/60 bg-violet-50 dark:bg-violet-900/25"
                            : s.isReady
                              ? "border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-900/15"
                              : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                        }`}
                      >
                        <div className="relative">
                          <Avatar
                            className={`w-16 h-16 sm:w-20 sm:h-20 border-2 transition-all ${s.isReady ? "border-emerald-400 ring-4 ring-emerald-400/25" : "border-zinc-200 dark:border-zinc-700"}`}
                          >
                            <Avatar.Image src={s.avatar} alt={s.name} />
                            <Avatar.Fallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-xl">
                              {s.name?.charAt(0)?.toUpperCase() || "?"}
                            </Avatar.Fallback>
                          </Avatar>
                          {/* Ready / waiting badge */}
                          <span
                            className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-[3px] border-white dark:border-zinc-900 ${
                              s.isReady ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                            }`}
                          >
                            {s.isReady
                              ? <Check className="w-4 h-4 text-white" strokeWidth={3} />
                              : <Clock className="w-3.5 h-3.5 text-white" />}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-100 truncate max-w-full leading-tight">
                          {s.name}
                        </span>
                        {isMe ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-violet-500 -mt-1">
                            {t.play.waitingYou}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold -mt-1 ${s.isReady ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`}>
                            {s.isReady ? t.play.waitingReady : t.play.waitingNotReady}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Action footer ───────────────────────────────────────── */}
        {presentation ? (
          <p className="text-center text-white/80 text-lg font-bold flex items-center justify-center gap-2 py-2">
            <GraduationCap className="w-5 h-5" />
            {t.play.waitingForTeacher}
          </p>
        ) : (
        <div className="flex flex-col gap-3">
          {role === "student" ? (
            <>
              <Button
                size="lg"
                onPress={onToggleReady}
                className={`w-full h-16 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${
                  isReady
                    ? "bg-white/90 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100"
                    : "bg-gradient-to-r from-emerald-400 to-green-500 text-white hover:shadow-green-500/30 hover:-translate-y-0.5"
                }`}
              >
                {isReady ? <Clock className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                {isReady ? t.play.waitingCancelReady : t.play.waitingImReady}
              </Button>
              <p className="text-center text-white/70 text-sm font-semibold flex items-center justify-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {t.play.waitingForTeacher}
              </p>
            </>
          ) : (
            <Button
              size="lg"
              onPress={onStart}
              isDisabled={roster.length === 0}
              className="w-full h-16 rounded-2xl font-black text-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6" fill="currentColor" />
              {t.play.waitingStartQuiz}
            </Button>
          )}

          {onLeave && (
            <button
              onClick={onLeave}
              className="text-white/60 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 py-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t.play.waitingLeave}
            </button>
          )}
        </div>
        )}
      </motion.div>
    </div>
  );
}
