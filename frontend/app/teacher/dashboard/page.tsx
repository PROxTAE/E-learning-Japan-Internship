"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ── Dashboard feature components ───────────────────────────────────
import { WelcomeBanner } from "@/components/teacher/dashboard/WelcomeBanner";
import { QuizStatsOverview } from "@/components/teacher/dashboard/QuizStatsOverview";
import { PerformanceChart } from "@/components/teacher/dashboard/PerformanceChart";
import { UpcomingSchedule } from "@/components/teacher/dashboard/UpcomingSchedule";
import { ActivityFeed } from "@/components/teacher/dashboard/ActivityFeed";
import { TopQuizzes } from "@/components/teacher/dashboard/TopQuizzes";

// ── API clients ────────────────────────────────────────────────────
import { dashboardApi } from "@/services/dashboardApi";
import type { DashboardStats } from "@/services/dashboardApi";

// ── Types ──────────────────────────────────────────────────────────
import type { QuizStats } from "@/types/teacher/quiz.types";

export default function TeacherDashboardPage() {
  // ── Dashboard stats state ──────────────────────────────────────
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Fetch dashboard stats from API ─────────────────────────────
  const fetchDashStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await dashboardApi.getStats();
      setDashStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashStats();
  }, [fetchDashStats]);

  // Use real stats from API when available
  const stats = useMemo((): QuizStats => {
    if (dashStats) return dashStats.quizStats;
    return {
      totalQuizzes: 0,
      publishedQuizzes: 0,
      draftQuizzes: 0,
      archivedQuizzes: 0,
      totalAttempts: 0,
      averageScore: 0,
    };
  }, [dashStats]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* ── Main scrollable area ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="w-full mx-auto p-4 lg:p-6 space-y-6">

          {/* ① Welcome Hero Banner */}
          <WelcomeBanner />

          {/* ② Stats Overview Cards */}
          <QuizStatsOverview stats={stats} loading={statsLoading} />

          {/* ③ Performance chart + Upcoming schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PerformanceChart
                data={dashStats?.weeklyPerformance ?? []}
                loading={statsLoading}
              />
            </div>
            <div className="lg:col-span-1">
              <UpcomingSchedule />
            </div>
          </div>

          {/* ④ Activity feed + Top quizzes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityFeed
              activities={dashStats?.recentActivity ?? []}
              loading={statsLoading}
            />
            <TopQuizzes
              quizzes={dashStats?.topQuizzes ?? []}
              loading={statsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
