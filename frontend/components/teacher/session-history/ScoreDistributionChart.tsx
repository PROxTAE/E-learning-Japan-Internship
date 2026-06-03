"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { StudentResult } from "@/services/sessionHistoryApi";

interface ScoreDistributionChartProps {
  students: StudentResult[];
}

const BUCKETS = [
  { label: "0–20%",  range: [0, 20],   color: "bg-red-500" },
  { label: "21–40%", range: [20, 40],  color: "bg-orange-500" },
  { label: "41–60%", range: [40, 60],  color: "bg-yellow-500" },
  { label: "61–80%", range: [60, 80],  color: "bg-blue-500" },
  { label: "81–100%",range: [80, 101], color: "bg-emerald-500" },
];

export function ScoreDistributionChart({ students = [] }: ScoreDistributionChartProps) {
  const { t } = useLang();

  const bucketCounts = useMemo(() => {
    return BUCKETS.map(b => ({
      ...b,
      count: students.filter(s => {
        const pct = s.scorePercent ?? s.score;
        return pct >= b.range[0] && pct < b.range[1];
      }).length,
    }));
  }, [students]);

  const max = Math.max(...bucketCounts.map(b => b.count), 1);

  if (!students.length) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-foreground/80">{t.sessionHistory.scoreDistribution}</h4>
      <div className="flex items-end gap-3 h-32">
        {bucketCounts.map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-xs font-bold text-foreground/70">{b.count}</span>
            <motion.div
              className={`w-full rounded-t-lg ${b.color} opacity-85`}
              initial={{ height: 0 }}
              animate={{ height: `${(b.count / max) * 100}%` }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
              style={{ minHeight: b.count > 0 ? 6 : 2 }}
            />
            <span className="text-[9px] text-default-400 text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
