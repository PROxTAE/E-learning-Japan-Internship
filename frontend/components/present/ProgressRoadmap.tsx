"use client";

import { useMemo, useRef, useEffect } from "react";
import { Avatar } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flag, MapPin } from "lucide-react";
import type { Student, AnswerCellData } from "@/types/teacher/monitoring.types";
import { useLang } from "@/lib/i18n/LanguageContext";

/* ── Types ─────────────────────────────────────────────────────── */

interface QuestionInfo {
  id: string;
  number: number;
  title: string;
}

export interface ProgressRoadmapProps {
  questions: QuestionInfo[];
  students: Student[];
  answers: AnswerCellData[];
  scale?: number;
}

/* ── Visual config ─────────────────────────────────────────────── */

/** Vertical spacing (px) between each checkpoint */
const CHECKPOINT_GAP = 160;
/** Horizontal amplitude of the S-curve */
const CURVE_AMPLITUDE = 140;
/** Total width of the roadmap canvas */
const CANVAS_W = 700;
/** Centre X of the canvas */
const CX = CANVAS_W / 2;
/** Avatar size */
const AVATAR_SIZE = 52;

/** Ring gradient per student (cycles) */
const RING_COLORS = [
  "from-violet-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-blue-400 to-cyan-500",
  "from-purple-400 to-fuchsia-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-indigo-400 to-violet-500",
  "from-rose-400 to-pink-500",
];

const GLOW_COLORS = [
  "rgba(139,92,246,0.4)",
  "rgba(236,72,153,0.35)",
  "rgba(59,130,246,0.35)",
  "rgba(168,85,247,0.4)",
  "rgba(16,185,129,0.35)",
  "rgba(245,158,11,0.3)",
  "rgba(99,102,241,0.4)",
  "rgba(244,63,94,0.35)",
];

/* ── Helpers ───────────────────────────────────────────────────── */

/** Build checkpoint positions along an S-curve (bottom → top). */
function buildCheckpoints(totalCheckpoints: number) {
  const points: { x: number; y: number; isStart: boolean; isFinish: boolean; index: number }[] = [];

  for (let i = 0; i < totalCheckpoints; i++) {
    // Y goes from bottom to top
    const y = (totalCheckpoints - 1 - i) * CHECKPOINT_GAP + 100;
    // X zigzags: even = left, odd = right
    const x = i === 0 || i === totalCheckpoints - 1
      ? CX // start and finish are centred
      : CX + (i % 2 === 0 ? -1 : 1) * CURVE_AMPLITUDE;

    points.push({
      x,
      y,
      isStart: i === 0,
      isFinish: i === totalCheckpoints - 1,
      index: i,
    });
  }

  return points;
}

/** Build a smooth SVG path through checkpoints. */
function buildSvgPath(checkpoints: { x: number; y: number }[]) {
  if (checkpoints.length < 2) return "";

  // We draw from the last checkpoint (top) to the first (bottom)
  // so the visual goes top-to-bottom in the SVG coordinate system
  const pts = [...checkpoints].reverse();
  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    // Cubic bezier for smooth S-curves
    const cpY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/** Count how many questions a student has answered. */
function getStudentAnsweredCount(studentId: string, answers: AnswerCellData[]) {
  const studentAnswers = answers.filter((a) => a.studentId === studentId);
  // Count unique questions answered
  const questionIds = new Set(studentAnswers.map((a) => a.questionId));
  return questionIds.size;
}

/* ── Component ─────────────────────────────────────────────────── */

export function ProgressRoadmap({ questions, students, answers, scale = 1.0 }: ProgressRoadmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTarget = useRef<number | null>(null);
  const { t } = useLang();

  // Total checkpoints = questions + 1 (the finish line)
  // checkpoint 0 = Start (0 answered), checkpoint N = Finish (all answered)
  const totalCheckpoints = questions.length + 1;
  const points = useMemo(() => buildCheckpoints(totalCheckpoints), [totalCheckpoints]);
  
  const checkpoints = useMemo(() => {
    return points.map((pt) => ({
      ...pt,
      label: pt.isStart
        ? t.present.start
        : pt.isFinish
          ? t.present.finish
          : t.present.questionAbbr(pt.index),
    }));
  }, [points, t]);

  const svgPath = useMemo(() => buildSvgPath(checkpoints), [checkpoints]);
  const canvasH = (totalCheckpoints - 1) * CHECKPOINT_GAP + 200;

  // Online students only
  const roster = students.filter((s) => s.isOnline !== false);

  // Build a map: checkpointIndex → students at that checkpoint
  const studentPositions = useMemo(() => {
    const map = new Map<number, (Student & { ringIdx: number })[]>();
    roster.forEach((s, globalIdx) => {
      const sid = s.id || s.studentId || "";
      const answered = getStudentAnsweredCount(sid, answers);
      const cpIdx = Math.min(answered, questions.length); // clamp to finish
      if (!map.has(cpIdx)) map.set(cpIdx, []);
      map.get(cpIdx)!.push({ ...s, ringIdx: globalIdx });
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster.length, answers.length, answers, questions.length]);

  // Auto-scroll to the most active checkpoint (the one with the most recent activity)
  useEffect(() => {
    if (!scrollRef.current) return;

    // Find the highest checkpoint that has students (= furthest progress)
    let maxCpWithStudents = 0;
    studentPositions.forEach((_students, cpIdx) => {
      if (cpIdx > maxCpWithStudents) maxCpWithStudents = cpIdx;
    });

    const cp = checkpoints[maxCpWithStudents];
    if (cp && cp.y !== lastScrollTarget.current) {
      lastScrollTarget.current = cp.y;
      // Scroll so the checkpoint is roughly centred vertically (accounting for scale)
      const scrollY = (cp.y * scale) - window.innerHeight / 2;
      scrollRef.current.scrollTo({ top: Math.max(0, scrollY), behavior: "smooth" });
    }
  }, [studentPositions, checkpoints, scale]);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Scrollable roadmap content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-auto relative"
        style={{ scrollBehavior: "smooth" }}
      >
        <div
          className="relative mx-auto transition-all duration-200"
          style={{
            width: CANVAS_W * scale,
            height: canvasH * scale,
            margin: "0 auto",
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 origin-top transition-transform duration-200"
            style={{
              width: CANVAS_W,
              height: canvasH,
              transform: `scale(${scale})`,
            }}
          >
        {/* ── SVG winding path ────────────────────────────────────── */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CANVAS_W}
          height={canvasH}
          viewBox={`0 0 ${CANVAS_W} ${canvasH}`}
        >
          {/* Glow layer */}
          <path
            d={svgPath}
            fill="none"
            stroke="rgba(167,139,250,0.15)"
            strokeWidth={28}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main path */}
          <path
            d={svgPath}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="12 8"
          />
        </svg>

        {/* ── Checkpoints ─────────────────────────────────────────── */}
        {checkpoints.map((cp, idx) => (
          <div
            key={idx}
            className="absolute flex flex-col items-center"
            style={{
              left: cp.x,
              top: cp.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Checkpoint circle */}
            <div
              className={`relative flex items-center justify-center rounded-full border-2 transition-all ${
                cp.isFinish
                  ? "w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300/60 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  : cp.isStart
                    ? "w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 border-emerald-300/60 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                    : studentPositions.has(idx) && (studentPositions.get(idx)?.length ?? 0) > 0
                      ? "w-12 h-12 bg-violet-500/30 border-violet-400/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                      : "w-11 h-11 bg-white/10 border-white/20"
              }`}
            >
              {cp.isFinish ? (
                <Trophy className="w-7 h-7 text-white drop-shadow" />
              ) : cp.isStart ? (
                <Flag className="w-6 h-6 text-white drop-shadow" />
              ) : (
                <span className="text-sm font-black text-white/90">{cp.label}</span>
              )}
            </div>

            {/* Checkpoint label */}
            {(cp.isStart || cp.isFinish) && (
              <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                cp.isFinish ? "text-yellow-300" : "text-emerald-300"
              }`}>
                {cp.label}
              </span>
            )}

            {/* Student count badge */}
            {studentPositions.has(idx) && (studentPositions.get(idx)?.length ?? 0) > 0 && !cp.isStart && (
              <div className="mt-1.5 bg-violet-500/40 backdrop-blur-sm border border-violet-400/30 rounded-full px-2 py-0.5">
                <span className="text-[10px] font-bold text-white/90">
                  {t.present.studentCount(studentPositions.get(idx)!.length)}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* ── Student avatars at their checkpoint positions ─────── */}
        <AnimatePresence>
          {Array.from(studentPositions.entries()).map(([cpIdx, studentsAtCp]) => {
            const cp = checkpoints[cpIdx];
            if (!cp) return null;

            // Stack offset: spread students around the checkpoint
            const isLeft = cpIdx % 2 === 0;
            const spreadDir = isLeft ? 1 : -1; // put avatars on opposite side of curve

            return studentsAtCp.map((student, stackIdx) => {
              // Calculate offset from the checkpoint centre
              const offsetX = spreadDir * (60 + stackIdx * 46);
              const offsetY = stackIdx % 2 === 0 ? -8 : 8;

              return (
                <motion.div
                  key={student.id || student.studentId}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ zIndex: 20 + stackIdx }}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    left: cp.x + offsetX,
                    top: cp.y + offsetY,
                    x: "-50%",
                    y: "-50%",
                  }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 22,
                    left: { type: "spring", stiffness: 120, damping: 18 },
                    top: { type: "spring", stiffness: 120, damping: 18 },
                  }}
                >
                  {/* Connector line from avatar to checkpoint */}
                  <svg
                    className="absolute pointer-events-none"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: Math.abs(offsetX) + 10,
                      height: Math.abs(offsetY) + 10,
                      transform: `translate(${offsetX > 0 ? "-100%" : "0"}, -50%)`,
                      zIndex: -1,
                    }}
                  >
                    <line
                      x1={offsetX > 0 ? "100%" : "0"}
                      y1="50%"
                      x2={offsetX > 0 ? "0" : "100%"}
                      y2="50%"
                      stroke="rgba(167,139,250,0.25)"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                  </svg>

                  {/* Avatar bubble */}
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{
                      duration: 2.5 + (stackIdx % 3) * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: stackIdx * 0.2,
                    }}
                  >
                    <div
                      className={`rounded-full p-[2px] bg-gradient-to-br ${RING_COLORS[student.ringIdx % RING_COLORS.length]}`}
                      style={{
                        boxShadow: `0 0 20px -2px ${GLOW_COLORS[student.ringIdx % GLOW_COLORS.length]}`,
                      }}
                    >
                      <div className="rounded-full bg-[#1a1535] p-[2px]">
                        <Avatar
                          className={`w-[${AVATAR_SIZE}px] h-[${AVATAR_SIZE}px]`}
                          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                        >
                          <Avatar.Image src={student.avatar} alt={student.name} />
                          <Avatar.Fallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-lg">
                            {student.name?.charAt(0)?.toUpperCase() || "?"}
                          </Avatar.Fallback>
                        </Avatar>
                      </div>
                    </div>
                  </motion.div>

                  {/* Name tag */}
                  <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-0.5 max-w-[80px]">
                    <span className="text-[10px] font-bold text-white truncate block text-center">
                      {student.name}
                    </span>
                  </div>

                  {/* Progress badge */}
                  {cpIdx === questions.length && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full px-1.5 py-0.5"
                    >
                      <span className="text-[9px] font-black text-black">{t.present.done}</span>
                    </motion.div>
                  )}
                </motion.div>
              );
            });
          })}
        </AnimatePresence>

        {/* ── Decorative scattered dots ─────────────────────────── */}
        {[
          { x: "10%", y: "5%", s: 6, c: "#a78bfa" },
          { x: "85%", y: "10%", s: 5, c: "#f472b6" },
          { x: "15%", y: "30%", s: 4, c: "#60a5fa" },
          { x: "90%", y: "40%", s: 7, c: "#c084fc" },
          { x: "8%", y: "60%", s: 5, c: "#34d399" },
          { x: "92%", y: "70%", s: 4, c: "#818cf8" },
          { x: "20%", y: "85%", s: 6, c: "#f472b6" },
          { x: "80%", y: "90%", s: 5, c: "#a78bfa" },
        ].map((dot, i) => (
          <motion.span
            key={`dot-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: dot.x,
              top: dot.y,
              width: dot.s,
              height: dot.s,
              background: dot.c,
            }}
            animate={{
              y: [0, -8, 0],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
          </div>
        </div>
      </div>

      {/* ── Bottom summary bar ──────────────────────────────────── */}
      <div className="bg-black/30 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-violet-400" />
          <span className="text-white/80 text-sm font-semibold">
            {t.present.summary(roster.length, questions.length)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-500" />
            <span className="text-white/60 text-xs font-semibold">{t.present.start}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500" />
            <span className="text-white/60 text-xs font-semibold">{t.present.inProgress}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500" />
            <span className="text-white/60 text-xs font-semibold">{t.present.finished}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
