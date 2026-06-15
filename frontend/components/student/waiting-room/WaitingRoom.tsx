"use client";

import { Avatar, Button, Spinner } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Users, Wifi, WifiOff, Play, LogOut, GraduationCap } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Student } from "@/types/teacher/monitoring.types";

/* ── Scattered dot decorations (PEEPS-style coloured bokeh) ─────────────── */
const SCATTER_DOTS = [
  { x: "6%",  y: "10%", size: 7,  color: "#a78bfa" },
  { x: "14%", y: "5%",  size: 5,  color: "#f472b6" },
  { x: "88%", y: "7%",  size: 8,  color: "#818cf8" },
  { x: "92%", y: "16%", size: 4,  color: "#c084fc" },
  { x: "78%", y: "3%",  size: 6,  color: "#34d399" },
  { x: "3%",  y: "55%", size: 6,  color: "#60a5fa" },
  { x: "95%", y: "50%", size: 5,  color: "#f472b6" },
  { x: "50%", y: "92%", size: 7,  color: "#a78bfa" },
  { x: "30%", y: "88%", size: 4,  color: "#818cf8" },
  { x: "70%", y: "95%", size: 5,  color: "#c084fc" },
  { x: "20%", y: "35%", size: 3,  color: "#34d399" },
  { x: "40%", y: "8%",  size: 5,  color: "#f9a8d4" },
  { x: "60%", y: "4%",  size: 4,  color: "#60a5fa" },
  { x: "10%", y: "80%", size: 6,  color: "#a78bfa" },
  { x: "85%", y: "85%", size: 5,  color: "#f472b6" },
] as const;

/* ── Per-bubble gradient ring colours — cycles for visual variety ──────── */
const RING_GRADIENTS = [
  "from-violet-500/60 to-indigo-500/60",
  "from-pink-500/60 to-rose-500/60",
  "from-blue-500/60 to-cyan-500/60",
  "from-purple-500/60 to-fuchsia-500/60",
  "from-emerald-500/60 to-teal-500/60",
  "from-amber-500/60 to-orange-500/60",
  "from-indigo-500/60 to-violet-500/60",
  "from-rose-500/60 to-pink-500/60",
];

const GLOW_COLORS = [
  "rgba(139,92,246,0.35)",
  "rgba(236,72,153,0.30)",
  "rgba(59,130,246,0.30)",
  "rgba(168,85,247,0.35)",
  "rgba(16,185,129,0.30)",
  "rgba(245,158,11,0.25)",
  "rgba(99,102,241,0.35)",
  "rgba(244,63,94,0.30)",
];

export interface WaitingRoomProps {
  role: "student" | "teacher";
  quizTitle: string;
  code?: string;
  questionCount?: number;
  students: Student[];
  myStudentId?: string;
  isReady?: boolean;
  isConnected: boolean;
  onToggleReady?: () => void;
  onStart?: () => void;
  onLeave?: () => void;
  presentation?: boolean;
}

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
  const roster = students.filter((s) => s.isOnline !== false);
  const readyCount = roster.filter((s) => s.isReady).length;

  return (
    <div className={`relative min-h-full flex flex-col items-center justify-start px-4 sm:px-6 py-6 sm:py-10 w-full mx-auto ${presentation ? "max-w-7xl" : "max-w-5xl"}`}>
      {/* ── Scattered bokeh dots ──────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
        {SCATTER_DOTS.map((dot, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: dot.x,
              top: dot.y,
              width: dot.size,
              height: dot.size,
              background: dot.color,
            }}
            animate={{
              y: [0, -10 - (i % 3) * 5, 0],
              opacity: [0.7, 0.3, 0.7],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + (i % 4) * 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 5) * 0.4,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full flex flex-col gap-5 sm:gap-6"
      >
        {/* ── Compact Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
              {role === "teacher" ? t.play.waitingTeacherView : t.play.waitingTitle}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-sm truncate">
              {quizTitle}
            </h1>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {code && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white font-mono font-bold tracking-[0.2em] text-sm">
                {code}
              </div>
            )}
            <div className={`flex items-center gap-1.5 backdrop-blur-md border border-white/20 rounded-full px-3 py-2 ${isConnected ? "bg-emerald-500/20" : "bg-white/10"}`}>
              {isConnected
                ? <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                : <WifiOff className="w-3.5 h-3.5 text-white/60" />}
              <span className="font-bold text-[11px] uppercase tracking-tight text-white/90">
                {isConnected ? t.play.live : t.play.waitingConnecting}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5">
            <Users className="w-4 h-4 text-violet-300 shrink-0" />
            <span className="text-xl font-black text-white tabular-nums">{roster.length}</span>
            <span className="text-white/60 text-xs font-semibold">{t.play.waitingStudentsJoined}</span>
          </div>
          <div className="flex items-center gap-2.5 bg-emerald-500/15 backdrop-blur-md border border-emerald-300/20 rounded-2xl px-4 py-2.5">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="text-xl font-black text-white tabular-nums">{readyCount}</span>
            <span className="text-white/70 text-xs font-semibold">{t.play.waitingReadyOf}</span>
          </div>
        </div>

        {/* ── PEEPS Avatar Grid ───────────────────────────────────── */}
        <div className="w-full min-h-[320px] sm:min-h-[400px]">
          {roster.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 w-full text-center py-20">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Users className="w-16 h-16 text-white/20" />
              </motion.div>
              <p className="text-white/50 font-semibold text-sm">
                {t.play.waitingNoStudents}
              </p>
            </div>
          ) : (
            <div className={`grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 w-full content-start justify-items-center ${
              presentation
                ? "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8"
                : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            }`}>
              <AnimatePresence>
                {roster.map((s, idx) => {
                  const isMe = !!myStudentId && (s.studentId === myStudentId || s.id === myStudentId);
                  const ringGradient = RING_GRADIENTS[idx % RING_GRADIENTS.length];
                  const glowColor = GLOW_COLORS[idx % GLOW_COLORS.length];
                  const bobDuration = 2.8 + ((idx % 5) * 0.4);
                  const bobDelay = (idx % 7) * 0.25;

                  return (
                    <motion.div
                      key={s.id || s.studentId}
                      layout
                      initial={{ opacity: 0, scale: 0.3, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.3, y: 20 }}
                      transition={{ type: "spring", stiffness: 350, damping: 20, delay: idx * 0.03 }}
                      className="relative flex flex-col items-center gap-2"
                    >
                      <motion.div
                        className="relative"
                        animate={{ y: [0, -5, 0], rotate: [0, 1, 0, -1, 0] }}
                        transition={{ duration: bobDuration, repeat: Infinity, ease: "easeInOut", delay: bobDelay }}
                        whileHover={{ scale: 1.12, rotate: -3 }}
                      >
                        {/* Pop-in ripple */}
                        <motion.span
                          className="absolute inset-0 rounded-full"
                          style={{ background: glowColor }}
                          initial={{ scale: 0.6, opacity: 0.8 }}
                          animate={{ scale: 2.2, opacity: 0 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />

                        {/* Gradient ring container */}
                        <div
                          className={`relative rounded-full p-[3px] bg-gradient-to-br ${
                            isMe
                              ? "from-violet-400 to-purple-600"
                              : s.isReady
                                ? "from-emerald-400 to-teal-500"
                                : ringGradient
                          }`}
                          style={{
                            boxShadow: isMe
                              ? "0 0 30px -4px rgba(139,92,246,0.6), 0 0 60px -8px rgba(139,92,246,0.3)"
                              : s.isReady
                                ? "0 0 25px -4px rgba(52,211,153,0.5), 0 0 50px -8px rgba(52,211,153,0.2)"
                                : `0 0 25px -4px ${glowColor}, 0 0 50px -10px ${glowColor}`,
                          }}
                        >
                          {/* Dark inner circle */}
                          <div
                            className="rounded-full bg-[#1a1535] p-[3px] relative overflow-hidden"
                            style={{
                              backgroundImage:
                                "radial-gradient(circle at 50% 25%, rgba(255,255,255,0.08), rgba(255,255,255,0) 70%)",
                            }}
                          >
                            <Avatar
                              className={`${
                                presentation
                                  ? "w-[80px] h-[80px] sm:w-[90px] sm:h-[90px]"
                                  : "w-[76px] h-[76px] sm:w-[96px] sm:h-[96px]"
                              }`}
                            >
                              <Avatar.Image src={s.avatar} alt={s.name} />
                              <Avatar.Fallback
                                className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-2xl sm:text-3xl"
                              >
                                {s.name?.charAt(0)?.toUpperCase() || "?"}
                              </Avatar.Fallback>
                            </Avatar>
                          </div>
                        </div>

                        {/* Ready badge */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-[3px] border-[#1a1535] shadow-lg ${
                            s.isReady ? "bg-emerald-500" : "bg-zinc-600"
                          }`}
                        >
                          {s.isReady
                            ? <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            : <Clock className="w-3.5 h-3.5 text-white/80" />}
                        </span>
                      </motion.div>

                      {/* Name label */}
                      <div className="flex flex-col items-center gap-0.5 min-w-0 w-full">
                        <span className="text-sm font-bold text-white truncate max-w-full leading-tight drop-shadow">
                          {s.name}
                        </span>
                        {isMe ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-violet-300 bg-violet-500/20 rounded-full px-2 py-0.5">
                            {t.play.waitingYou}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold ${s.isReady ? "text-emerald-300" : "text-white/40"}`}>
                            {s.isReady ? t.play.waitingReady : t.play.waitingNotReady}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

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
