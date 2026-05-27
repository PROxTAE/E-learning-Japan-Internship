"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle2, AlertTriangle, Trophy, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { ActivityEntry } from "@/services/dashboardApi";
import { useEffect, useState } from "react";

type ActivityType = "submission" | "achievement" | "warning" | "info";

const ICON_MAP: Record<ActivityType, React.FC<{ className?: string }>> = {
  submission:  CheckCircle2,
  achievement: Trophy,
  warning:     AlertTriangle,
  info:        Activity,
};

const COLOR_MAP: Record<ActivityType, string> = {
  submission:  "from-emerald-500 to-teal-600",
  achievement: "from-amber-500 to-orange-500",
  warning:     "from-red-500 to-rose-600",
  info:        "from-blue-500 to-cyan-600",
};

const RING_MAP: Record<ActivityType, string> = {
  submission:  "ring-emerald-200 dark:ring-emerald-800/40",
  achievement: "ring-amber-200 dark:ring-amber-800/40",
  warning:     "ring-red-200 dark:ring-red-800/40",
  info:        "ring-blue-200 dark:ring-blue-800/40",
};

function computeTimeAgo(dateStr: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) {
    if (lang === "th") return `${diff} วินาทีที่แล้ว`;
    if (lang === "ja") return `${diff}秒前`;
    return `${diff}s ago`;
  }
  const min = Math.floor(diff / 60);
  if (min < 60) {
    if (lang === "th") return `${min} นาทีที่แล้ว`;
    if (lang === "ja") return `${min}分前`;
    return `${min}m ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    if (lang === "th") return `${hr} ชั่วโมงที่แล้ว`;
    if (lang === "ja") return `${hr}時間前`;
    return `${hr}h ago`;
  }
  const day = Math.floor(hr / 24);
  if (lang === "th") return `${day} วันที่แล้ว`;
  if (lang === "ja") return `${day}日前`;
  return `${day}d ago`;
}

function ClientTimeAgo({ timestamp, lang }: { timestamp: string; lang: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(computeTimeAgo(timestamp, lang));
    const id = setInterval(() => setLabel(computeTimeAgo(timestamp, lang)), 30_000);
    return () => clearInterval(id);
  }, [timestamp, lang]);
  return (
    <span suppressHydrationWarning className="text-[10px] text-default-400 shrink-0 mt-0.5 whitespace-nowrap">
      {label}
    </span>
  );
}

function SkeletonItem() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-default-100 dark:bg-default-700/30 animate-pulse shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-default-100 dark:bg-default-700/30 rounded-full animate-pulse w-5/6" />
        <div className="h-2 bg-default-100 dark:bg-default-700/30 rounded-full animate-pulse w-2/3" />
      </div>
      <div className="w-10 h-2 bg-default-100 dark:bg-default-700/30 rounded-full animate-pulse shrink-0 mt-1" />
    </div>
  );
}

interface ActivityFeedProps {
  activities: ActivityEntry[];
  loading?: boolean;
}

export function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  const { t, lang } = useLang();
  const a = t.activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-2xl border border-default-200/40 dark:border-default-700/30 bg-white dark:bg-white/5 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-default-100 dark:border-default-700/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <p className="font-semibold text-sm text-default-900 dark:text-default-100">{a.title}</p>
        </div>
        <button className="text-xs text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-0.5 hover:gap-1.5 transition-all">
          {a.viewAll} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Activity items */}
      <div className="px-5 py-3 space-y-3 max-h-[340px] overflow-y-auto">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-sm text-default-400">
            <Activity className="w-8 h-8 mx-auto mb-2 text-default-300" />
            No recent activity
          </div>
        ) : (
          activities.map((item, idx) => {
            const type = (item.type as ActivityType) || "info";
            const Icon = ICON_MAP[type] ?? Activity;
            const grad = COLOR_MAP[type] ?? "from-default-500 to-default-600";
            const ring = RING_MAP[type] ?? "";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-full ring-2 ${ring} bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-default-700 dark:text-default-300 leading-snug">
                    <span className="font-semibold text-default-900 dark:text-default-100">
                      {item.studentName}
                    </span>{" "}
                    {item.action}
                  </p>
                  <p className="text-[10px] text-default-400 mt-0.5 truncate">{item.quizTitle}</p>
                </div>
                <ClientTimeAgo timestamp={item.timestamp} lang={lang} />
              </motion.div>
            );
          })
        )}
      </div>

      {/* Live pulse footer */}
      <div className="px-5 py-3 border-t border-default-100 dark:border-default-700/20 bg-default-50 dark:bg-white/3">
        <div className="flex items-center gap-2 text-xs text-default-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {a.liveUpdating}
        </div>
      </div>
    </motion.div>
  );
}
