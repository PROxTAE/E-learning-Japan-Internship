"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { WeeklyPerformance } from "@/services/dashboardApi";

interface PerformanceChartProps {
  data: WeeklyPerformance[];
  loading?: boolean;
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 72;
  const H = 28;
  const step = W / Math.max(values.length - 1, 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const last = values[values.length - 1];
  const lx   = (values.length - 1) * step;
  const ly   = H - ((last - min) / range) * (H - 4) - 2;

  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.8"
      />
      {values.length > 0 && <circle cx={lx} cy={ly} r="3" fill={color} />}
    </svg>
  );
}

// Skeleton bar for loading state
function SkeletonBars() {
  return (
    <div className="flex items-end gap-1.5 h-24">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg bg-default-100 dark:bg-default-700/30 animate-pulse"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function PerformanceChart({ data, loading = false }: PerformanceChartProps) {
  const { t } = useLang();
  const pc = t.performance;

  const totalAttempts = data.reduce((s, d) => s + d.attempts, 0);
  const avgScore = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.avgScore, 0) / data.filter(d => d.avgScore > 0).length || 0)
    : 0;
  const maxBar = Math.max(...data.map((d) => d.attempts), 1);

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const trend = last && prev ? last.attempts - prev.attempts : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-500" : "text-default-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-default-200/40 dark:border-default-700/30 bg-white dark:bg-white/5 backdrop-blur-sm p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">{pc.title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-default-100 dark:bg-default-700/30 rounded-lg animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-extrabold text-default-900 dark:text-default-100 mt-1">
              {totalAttempts.toLocaleString()}
              <span className="text-sm font-normal text-default-400 ml-1">{pc.attemptsLabel}</span>
            </p>
          )}
          {!loading && data.length > 1 && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{Math.abs(trend)} {pc.vsLastWeek}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-default-400">{pc.avgScoreLabel}</p>
          {loading ? (
            <div className="h-8 w-16 bg-default-100 dark:bg-default-700/30 rounded-lg animate-pulse mt-1 ml-auto" />
          ) : (
            <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{avgScore}%</p>
          )}
          {!loading && data.length > 0 && (
            <MiniSparkline values={data.map((d) => d.avgScore)} color="#7c3aed" />
          )}
        </div>
      </div>

      {/* Bar Chart */}
      {loading ? (
        <SkeletonBars />
      ) : (
        <div className="flex items-end gap-1.5 h-24">
          {data.map((d, idx) => {
            const heightPct = (d.attempts / maxBar) * 100;
            const isLast = idx === data.length - 1;
            return (
              <motion.div
                key={d.week}
                className="flex flex-col items-center gap-1 flex-1"
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.25 + idx * 0.07, type: "spring", stiffness: 200 }}
              >
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isLast
                      ? "bg-gradient-to-t from-violet-600 to-purple-400 shadow-lg shadow-violet-500/30"
                      : "bg-default-200 dark:bg-default-700/50 hover:bg-violet-200 dark:hover:bg-violet-700/40"
                  }`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                  title={`${d.week}: ${d.attempts} attempts`}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* X labels */}
      <div className="flex gap-1.5 mt-1.5">
        {(loading ? Array.from({ length: 8 }, (_, i) => `W${i + 1}`) : data.map((d) => d.week)).map((w) => (
          <p key={w} className="flex-1 text-center text-[9px] text-default-400 font-medium truncate">
            {w}
          </p>
        ))}
      </div>

      {/* Empty state */}
      {!loading && data.length === 0 && (
        <div className="flex items-center justify-center h-24 text-default-400 text-sm">
          No data yet
        </div>
      )}
    </motion.div>
  );
}
