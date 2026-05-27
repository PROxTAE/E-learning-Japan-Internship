// ─────────────────────────────────────────────────────────────
//  dashboardApi.ts — Fetches real stats from /api/dashboard
// ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

async function apiFetch<T>(path: string): Promise<T> {
  const res  = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body.message ?? `API error ${res.status}`);
  return body.data as T;
}

// ── Types ─────────────────────────────────────────────────────

export interface WeeklyPerformance {
  week: string;      // "W1" … "W8"
  attempts: number;
  avgScore: number;
}

export interface TopQuizEntry {
  quizId: string;
  quizTitle: string;
  emoji: string;
  gradient: string;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
}

export interface ActivityEntry {
  id: string;
  studentName: string;
  action: string;
  quizTitle: string;
  type: "submission" | "achievement" | "warning" | "info";
  timestamp: string; // ISO string
}

export interface DashboardQuizStats {
  totalQuizzes: number;
  publishedQuizzes: number;
  draftQuizzes: number;
  archivedQuizzes: number;
  totalAttempts: number;
  averageScore: number;
}

export interface DashboardStats {
  quizStats: DashboardQuizStats;
  weeklyPerformance: WeeklyPerformance[];
  topQuizzes: TopQuizEntry[];
  recentActivity: ActivityEntry[];
}

// ── API surface ───────────────────────────────────────────────

export const dashboardApi = {
  /**
   * Fetch all aggregated dashboard stats in one call.
   * Returns quiz counts, 8-week performance chart data,
   * top performing quizzes, and recent student activity.
   */
  getStats: () => apiFetch<DashboardStats>("/api/dashboard/stats"),
};
