"use client";

import { memo, useMemo } from "react";
import { Avatar } from "@heroui/react";
import { motion } from "framer-motion";
import { Trophy, Award } from "lucide-react";
import type { Student, AnswerCellData } from "@/types/teacher/monitoring.types";
import { useLang } from "@/lib/i18n/LanguageContext";

export interface PresentLeaderboardProps {
  students: Student[];
  answers: AnswerCellData[];
  questionsCount: number;
}

const RANK_STYLES = [
  {
    border: "border-amber-400/40 bg-amber-500/10",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.25)]",
    badge: "bg-amber-400 text-black",
    emoji: "🥇",
  },
  {
    border: "border-slate-300/40 bg-slate-300/10",
    glow: "shadow-[0_0_25px_rgba(203,213,225,0.2)]",
    badge: "bg-slate-300 text-black",
    emoji: "🥈",
  },
  {
    border: "border-amber-700/40 bg-amber-700/10",
    glow: "shadow-[0_0_20px_rgba(180,83,9,0.15)]",
    badge: "bg-amber-700 text-white",
    emoji: "🥉",
  },
];

function PresentLeaderboardInner({ students, answers, questionsCount }: PresentLeaderboardProps) {
  const { t } = useLang();

  // Filter out offline students if any
  const roster = useMemo(() => {
    return students.filter((s) => s.isOnline !== false);
  }, [students]);

  // Tally answers per student in a SINGLE pass (was O(students × answers)).
  const statsByStudent = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const a of answers) {
      let s = map.get(a.studentId);
      if (!s) {
        s = { total: 0, correct: 0 };
        map.set(a.studentId, s);
      }
      s.total += 1;
      if (a.isCorrect) s.correct += 1;
    }
    return map;
  }, [answers]);

  // Compute stats and sort
  const leaderboardData = useMemo(() => {
    const list = roster.map((student) => {
      const studentId = student.id || (student as any).studentId || "";
      const tally = statsByStudent.get(studentId);
      const totalAnswers = tally?.total ?? 0;
      const correctAnswers = tally?.correct ?? 0;

      const progress = questionsCount > 0 ? Math.round((totalAnswers / questionsCount) * 100) : 0;
      const score = questionsCount > 0 ? Math.round((correctAnswers / questionsCount) * 100) : 0;

      return {
        ...student,
        correctCount: correctAnswers,
        progress,
        score,
      };
    });

    // Sort by score (percentage correct) desc, then by progress percentage desc, then by name
    return list.sort((a, b) => b.score - a.score || b.progress - a.progress || a.name.localeCompare(b.name));
  }, [roster, statsByStudent, questionsCount]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-8 px-4 h-full overflow-y-auto pb-24">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2 mb-10 text-center"
      >
        <div className="relative">
          <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-bounce" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1"
          >
            <Award className="w-6 h-6 text-amber-300" />
          </motion.div>
        </div>
        <h2 className="text-3xl font-black text-white tracking-wide uppercase mt-3">
          {t.present?.leaderboard || "Leaderboard"}
        </h2>
        <p className="text-sm text-white/50 tracking-wider">
          {t.present?.liveProgress || "Live Progress"}
        </p>
      </motion.div>

      {/* List */}
      <div className="flex flex-col gap-4 w-full">
        {leaderboardData.slice(0, 10).map((student, index) => {
          const rankStyle = RANK_STYLES[index] || {
            border: "border-white/10 bg-white/5",
            glow: "",
            badge: "bg-white/10 text-white/80",
            emoji: `${index + 1}`,
          };

          return (
            <motion.div
              key={student.id || (student as any).studentId}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
              className={`flex items-center gap-4 border rounded-2xl p-4 backdrop-blur-md transition-all ${rankStyle.border} ${rankStyle.glow}`}
            >
              {/* Rank indicator */}
              <div className="w-12 flex justify-center text-2xl font-black">
                {index < 3 ? (
                  <span className="text-3xl drop-shadow">{rankStyle.emoji}</span>
                ) : (
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${rankStyle.badge}`}>
                    {rankStyle.emoji}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-14 h-14 border-2 border-white/20">
                  <Avatar.Image src={student.avatar} alt={student.name} />
                  <Avatar.Fallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-lg">
                    {student.name?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar.Fallback>
                </Avatar>
                {index === 0 && (
                  <span className="absolute -top-2 -left-2 text-lg transform -rotate-12">👑</span>
                )}
              </div>

              {/* Student info */}
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-white truncate max-w-[200px] sm:max-w-xs">
                  {student.name}
                </h3>
                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 max-w-xs overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
              </div>

              {/* Scores info */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                    {t.present?.questions || "Questions"}
                  </span>
                  <span className="text-sm font-extrabold text-white/80">
                    {student.correctCount} / {questionsCount}
                  </span>
                </div>
                <div className="flex flex-col items-end justify-center min-w-[70px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                    {t.present?.score || "Score"}
                  </span>
                  <span className="text-2xl font-black text-violet-400">
                    {student.score}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {leaderboardData.length === 0 && (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-white/40 font-bold">
              {t.play?.waitingNoStudents || "No students have joined yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const PresentLeaderboard = memo(PresentLeaderboardInner);
