"use client";

import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, Users, ChevronRight, Zap } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { MOCK_SCHEDULE } from "@/lib/teacher/dashboard.mock";

function getStatusColor(status: string) {
  switch (status) {
    case "today":    return "bg-emerald-400";
    case "tomorrow": return "bg-amber-400";
    default:         return "bg-default-300 dark:bg-default-600";
  }
}

function getStatusLabel(status: string, t: ReturnType<typeof useLang>["t"]) {
  const s = t.schedule;
  switch (status) {
    case "today":    return s.today;
    case "tomorrow": return s.tomorrow;
    default:         return s.upcoming;
  }
}

export function UpcomingSchedule() {
  const { t } = useLang();
  const s = t.schedule;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border border-default-200/40 dark:border-default-700/30 bg-white dark:bg-white/5 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-default-100 dark:border-default-700/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="font-semibold text-sm text-default-900 dark:text-default-100">{s.title}</p>
        </div>
        <button className="text-xs text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-0.5 hover:gap-1.5 transition-all">
          {s.viewAll} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Schedule Items */}
      <div className="divide-y divide-default-100/50 dark:divide-default-700/20">
        {MOCK_SCHEDULE.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + idx * 0.06 }}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-default-50 dark:hover:bg-white/5 transition-colors group"
          >
            {/* Status dot */}
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColor(item.status)}`} />

            {/* Quiz icon */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-default-100 dark:bg-white/10 shrink-0">
              {item.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-default-900 dark:text-default-100 truncate leading-tight">
                {item.quizTitle}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  item.status === "today" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                  item.status === "tomorrow" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                  "bg-default-100 dark:bg-default-700/30 text-default-500"
                }`}>
                  {getStatusLabel(item.status, t)}
                </span>
                <span className="text-[10px] text-default-400 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {item.time}
                </span>
              </div>
            </div>

            {/* Student count */}
            <div className="flex items-center gap-1 text-xs text-default-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
              <span>{item.students}</span>
            </div>
          </motion.div>
        ))}

        {MOCK_SCHEDULE.length === 0 && (
          <div className="px-5 py-8 text-center">
            <BookOpen className="w-8 h-8 text-default-300 mx-auto mb-2" />
            <p className="text-sm text-default-400">{s.empty}</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 bg-default-50 dark:bg-white/3 border-t border-default-100 dark:border-default-700/20">
        <button className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors py-1">
          <Zap className="w-3.5 h-3.5" />
          {s.createSession}
        </button>
      </div>
    </motion.div>
  );
}
