"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Card, Chip, Spinner } from "@heroui/react";
import {
  Plus, BookOpen, Activity, Award, CheckCircle2,
  Calendar, Flame, Sparkles, ChevronRight, Settings,
  Copy, Play, Layers, FileText, Check, Search, Bell, Share2, Link as LinkIcon
} from "lucide-react";
import { quizApi } from "@/services/quizApi";
import { dashboardApi } from "@/services/dashboardApi";
import { sessionHistoryApi } from "@/services/sessionHistoryApi";
import type { Quiz } from "@/types/teacher/quiz.types";

function normaliseQuiz(raw: any): Quiz {
  return {
    id: raw.id ?? raw._id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    categoryId: raw.category ?? "",
    categoryName: raw.category ?? "",
    difficulty: raw.difficulty ?? "medium",
    status: raw.status ?? "draft",
    accessCode: raw.accessCode ?? null,
    questionCount: raw.questionCount ?? (Array.isArray(raw.questions) ? raw.questions.length : 0),
    duration: raw.duration ?? raw.durationMinutes ?? 0,
    totalAttempts: raw.totalAttempts ?? 0,
    averageScore: raw.averageScore ?? 0,
    completionRate: raw.completionRate ?? 0,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    tags: raw.tags ?? [],
    emoji: raw.emoji || "📄",
    gradient: raw.gradient || "from-violet-500 to-purple-700",
    hasTimeLimit: raw.hasTimeLimit,
    showAnswersAfterQuiz: raw.showAnswersAfterQuiz,
  };
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { t } = useLang();

  // Page States
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [timePeriod, setTimePeriod] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetching data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Quizzes
      const quizRes = await quizApi.listQuizzes();
      const normalised = quizRes.quizzes.map(normaliseQuiz);
      setQuizzes(normalised);

      // 2. Completed History
      const historyRes = await sessionHistoryApi.listAllSessions();
      setHistory(historyRes);

      // 3. Stats
      try {
        const statsRes = await dashboardApi.getStats();
        setStats(statsRes);
      } catch (err) {
        console.warn("Failed to load dashboard stats endpoint:", err);
      }
    } catch (err) {
      console.error("Dashboard page failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Group Quizzes
  const publishedQuizzes = useMemo(() => quizzes.filter(q => q.status === "published"), [quizzes]);
  const draftQuizzes = useMemo(() => quizzes.filter(q => q.status === "draft"), [quizzes]);

  // Find most recent active running session (published quiz with accessCode)
  const activeLiveRoom = useMemo(() => {
    return publishedQuizzes.find(q => q.accessCode) || null;
  }, [publishedQuizzes]);

  // Setup Checklist Calculation
  const checklist = useMemo(() => {
    return [
      { id: "create", label: t.dashboardNew.checklistItems.create, checked: quizzes.length > 0 },
      { id: "questions", label: t.dashboardNew.checklistItems.questions, checked: quizzes.some(q => q.questionCount >= 3) },
      { id: "publish", label: t.dashboardNew.checklistItems.publish, checked: publishedQuizzes.length > 0 },
      { id: "share", label: t.dashboardNew.checklistItems.share, checked: quizzes.some(q => q.accessCode) },
      { id: "host", label: t.dashboardNew.checklistItems.host, checked: history.length > 0 },
      { id: "insights", label: t.dashboardNew.checklistItems.insights, checked: history.length > 0 },
    ];
  }, [quizzes, publishedQuizzes, history, t]);

  const completedChecklistCount = useMemo(() => checklist.filter(item => item.checked).length, [checklist]);
  const checklistCompletionPercentage = Math.round((completedChecklistCount / checklist.length) * 100);

  // Computed local statistics if API fails or lacks totals
  const totalAttempts = useMemo(() => {
    if (stats?.quizStats?.totalAttempts) return stats.quizStats.totalAttempts;
    return history.reduce((sum, s) => sum + (s.stats?.totalStudents || 0), 0);
  }, [stats, history]);

  const averageAccuracy = useMemo(() => {
    if (stats?.quizStats?.averageScore) return stats.quizStats.averageScore;
    if (history.length === 0) return 0;
    const scoredHistory = history.filter(s => s.stats?.averageScore !== undefined);
    if (scoredHistory.length === 0) return 0;
    return Math.round(scoredHistory.reduce((sum, s) => sum + s.stats.averageScore, 0) / scoredHistory.length);
  }, [stats, history]);

  // Chart data (top quizzes score)
  const topQuizzesData = useMemo(() => {
    if (stats?.topQuizzes?.length) return stats.topQuizzes.slice(0, 5);
    // fallback to sorting completed sessions by score
    const items = [...history]
      .sort((a, b) => (b.stats?.averageScore || 0) - (a.stats?.averageScore || 0))
      .slice(0, 5);
    return items.map(i => ({
      quizTitle: i.quizTitle || "Quiz",
      averageScore: i.stats?.averageScore || 0,
      gradient: i.quizGradient || "from-violet-600 to-cyan-500",
    }));
  }, [stats, history]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center gap-3 text-slate-400 bg-[#0d0d1a]">
        <Spinner size="lg" color="current" className="text-violet-500" />
        <p className="text-sm font-medium">{t.dashboardNew.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-default-50 dark:!bg-[#0d0d1a] text-default-900 dark:text-slate-200 px-6 py-8">
      <div className="max-w-[1280px] mx-auto space-y-8">

        {/* ── HEADER ROW ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-default-200 dark:border-[#1c1c38] pb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-[#00bcd4] bg-clip-text text-transparent">
              {t.nav.portalSubtitle}
            </h1>
            <p className="text-default-500 dark:text-slate-400 text-xs mt-1">
              {t.welcome.quote}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle Group */}
            <div className="flex rounded-xl bg-default-100 dark:bg-[#14142b] p-1 border border-default-200 dark:border-[#222244]">
              <button
                onClick={() => setViewMode("card")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all ${
                  viewMode === "card"
                    ? "bg-violet-600 text-white shadow"
                    : "text-default-500 hover:text-default-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all ${
                  viewMode === "table"
                    ? "bg-violet-600 text-white shadow"
                    : "text-default-500 hover:text-default-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Table
              </button>
            </div>

            {/* Time Period Select */}
            <select
              value={timePeriod}
              onChange={e => setTimePeriod(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-default-100 dark:bg-[#14142b] border border-default-200 dark:border-[#222244] text-default-700 dark:text-slate-300 outline-none focus:border-violet-500 dark:focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">{t.header.periods[0]}</option>
              <option value="week">{t.header.periods[1]}</option>
              <option value="month">{t.header.periods[2]}</option>
              <option value="year">{t.header.periods[3]}</option>
            </select>

            {/* Actions */}
            <button
              onClick={() => router.push("/teacher/create-quiz")}
              className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-violet-600/10 cursor-pointer border-none transition-all active:scale-95"
            >
              <Plus size={14} />
              <span>{t.welcome.actions.createQuiz}</span>
            </button>
          </div>
        </div>

        {/* ── COLUMNS / GRID LAYOUT (Mon, Tue, Wed, Checklist Style) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* COLUMN 1: LIVE SESSION STATUS */}
          <Card className="bg-white dark:bg-[#121226]/60 border border-default-200 dark:border-[#1e1e3b] p-5 rounded-2xl flex flex-col justify-between h-[360px]">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#00bcd4] dark:text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00bcd4] dark:bg-cyan-400 animate-ping" />
                  {t.dashboardNew.liveSession}
                </p>
                <Chip {...{ size: "sm", variant: "flat", color: "secondary" } as any} className="font-semibold text-[9px] uppercase">
                  {activeLiveRoom ? t.dashboardNew.activeNow : "Offline"}
                </Chip>
              </div>

              {activeLiveRoom ? (
                <div className="mt-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-xl shadow-md border border-cyan-400/20">
                    {activeLiveRoom.emoji || "📄"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-default-900 dark:text-white truncate">{activeLiveRoom.title}</h3>
                    <p className="text-[10px] text-default-500 dark:text-slate-400 mt-1">{activeLiveRoom.categoryName || "Uncategorized"}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-default-100/90 dark:bg-[#181835]/90 border border-default-200/50 dark:border-cyan-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-default-400 dark:text-slate-400 uppercase leading-none">Access Code</p>
                      <p className="text-xl font-black text-violet-600 dark:text-cyan-400 tracking-wider mt-1">{activeLiveRoom.accessCode}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeLiveRoom.accessCode || "")}
                      className="p-2 rounded-lg bg-default-50 dark:bg-white/[0.04] hover:bg-default-100 dark:hover:bg-white/10 text-cyan-400 transition-colors border-none cursor-pointer"
                      title="Copy Join Code"
                    >
                      {copiedCode === activeLiveRoom.accessCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 text-center py-6">
                  <Flame size={36} className="text-default-400 dark:text-slate-600 mx-auto opacity-35" />
                  <p className="text-xs text-default-400 dark:text-slate-500 mt-3 max-w-[180px] mx-auto leading-relaxed">
                    {t.dashboardNew.noLiveSession}
                  </p>
                </div>
              )}
            </div>

            {activeLiveRoom ? (
              <button
                onClick={() => router.push(`/teacher/monitoring/${activeLiveRoom.id}`)}
                className="w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center gap-1 border border-cyan-500/20 transition-all cursor-pointer"
              >
                <span>{t.dashboardNew.goToMonitor}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => {
                  const firstPub = publishedQuizzes[0];
                  if (firstPub) router.push(`/teacher/monitoring/${firstPub.id}`);
                  else router.push("/teacher/quizzes");
                }}
                disabled={publishedQuizzes.length === 0}
                className="w-full py-2.5 rounded-xl bg-default-200 dark:bg-slate-800 text-default-400 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-1 border border-default-300 dark:border-slate-700/50 disabled:opacity-50 border-none cursor-pointer"
              >
                <span>{t.dashboardNew.startSession}</span>
                <ChevronRight size={14} />
              </button>
            )}
          </Card>

          {/* COLUMN 2: PUBLISHED QUIZZES */}
          <Card className="bg-white dark:bg-[#121226]/60 border border-default-200 dark:border-[#1e1e3b] p-5 rounded-2xl flex flex-col justify-between h-[360px]">
            <div>
              <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest">
                {t.dashboardNew.publishedQuizzes}
              </p>
              <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {publishedQuizzes.length === 0 ? (
                  <p className="text-xs text-default-400 dark:text-slate-500 text-center py-8">No published quizzes</p>
                ) : (
                  publishedQuizzes.map(quiz => (
                    <div
                      key={quiz.id}
                      className="p-2.5 rounded-xl bg-default-50/50 dark:bg-[#181835]/50 hover:bg-default-100 dark:hover:bg-[#181835] border border-default-200/50 dark:border-[#222244] flex items-center justify-between gap-3 group transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{quiz.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-default-900 dark:text-white truncate">{quiz.title}</p>
                          <p className="text-[9px] text-default-400 dark:text-slate-400 leading-none mt-0.5">{quiz.questionCount} {t.detail.questions}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/teacher/monitoring/${quiz.id}`)}
                        className="p-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white transition-colors border-none cursor-pointer"
                      >
                        <Play size={10} fill="currentColor" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => router.push("/teacher/quizzes")}
              className="w-full py-2.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 font-bold text-xs flex items-center justify-center gap-1 border border-violet-600/20 transition-all cursor-pointer"
            >
              <span>{t.dashboardNew.viewAll}</span>
              <ChevronRight size={14} />
            </button>
          </Card>

          {/* COLUMN 3: DRAFT QUIZZES */}
          <Card className="bg-white dark:bg-[#121226]/60 border border-default-200 dark:border-[#1e1e3b] p-5 rounded-2xl flex flex-col justify-between h-[360px]">
            <div>
              <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest">
                {t.dashboardNew.draftQuizzes}
              </p>
              <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {draftQuizzes.length === 0 ? (
                  <div className="mt-2">
                    {/* Dashed Add New Quiz card */}
                    <button
                      onClick={() => router.push("/teacher/create-quiz")}
                      className="w-full h-24 rounded-2xl border-2 border-dashed border-default-200 dark:border-[#2d2d54] hover:border-violet-500 bg-transparent flex flex-col items-center justify-center text-default-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-bold mt-2 uppercase tracking-wider">Add New Quiz</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {draftQuizzes.slice(0, 3).map(quiz => (
                      <div
                        key={quiz.id}
                        className="p-2.5 rounded-xl bg-default-50/50 dark:bg-[#181835]/50 hover:bg-default-100 dark:hover:bg-[#181835] border border-default-200/50 dark:border-[#222244] flex items-center justify-between gap-3 group transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{quiz.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-default-900 dark:text-white truncate">{quiz.title}</p>
                            <p className="text-[9px] text-default-400 dark:text-slate-400 leading-none mt-0.5">{quiz.questionCount} {t.detail.questions}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/teacher/create-quiz?id=${quiz.id}`)}
                          className="p-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white transition-colors border-none cursor-pointer"
                        >
                          <ChevronRight size={10} />
                        </button>
                      </div>
                    ))}
                    {draftQuizzes.length < 3 && (
                      <button
                        onClick={() => router.push("/teacher/create-quiz")}
                        className="w-full p-2.5 rounded-xl border-2 border-dashed border-default-200 dark:border-[#2d2d54] hover:border-violet-500 bg-transparent flex items-center justify-center gap-1.5 text-default-500 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Add Quiz</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => router.push("/teacher/quizzes")}
              className="w-full py-2.5 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 hover:text-white font-bold text-xs flex items-center justify-center gap-1 border border-amber-600/20 transition-all cursor-pointer"
            >
              <span>{t.dashboardNew.viewAll}</span>
              <ChevronRight size={14} />
            </button>
          </Card>

          {/* COLUMN 4: SETUP CHECKLIST GUIDE */}
          <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 p-5 rounded-2xl text-white flex flex-col justify-between h-[360px] shadow-xl shadow-violet-600/10">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-85">
                  {t.dashboardNew.setupChecklist}
                </p>
                <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full">
                  {completedChecklistCount}/{checklist.length}
                </span>
              </div>

              {/* Progress strip */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                  <span>{t.dashboardNew.setupGuide}</span>
                  <span>{checklistCompletionPercentage}%</span>
                </div>
                {/* Visual custom progress bar - diagonal strip pattern */}
                <div className="w-full h-3.5 bg-black/20 rounded-full overflow-hidden p-[2px]">
                  <div
                    className="h-full rounded-full bg-cyan-300 relative transition-all duration-500"
                    style={{
                      width: `${checklistCompletionPercentage}%`,
                      backgroundImage: "linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)",
                      backgroundSize: "1rem 1rem"
                    }}
                  />
                </div>
              </div>

              {/* Tasks Checklist */}
              <div className="mt-5 space-y-2.5">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      item.checked ? "bg-cyan-300 border-cyan-300 text-slate-900" : "border-white/40 bg-white/5"
                    }`}>
                      {item.checked && <Check size={10} className="stroke-[3]" />}
                    </div>
                    <span className={`truncate leading-none ${item.checked ? "opacity-60 line-through" : "font-medium"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] opacity-75 font-semibold text-center italic mt-2">
              Ready, Set, Teach! 🚀
            </div>
          </Card>

        </div>

        {/* ── BOTTOM AREA: HISTORY LIST & ANALYTICS INSIGHTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: RECENT SESSIONS HISTORY */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold tracking-wider text-slate-400 uppercase">
                {t.dashboardNew.recentSessionHistory}
              </h2>
              <button
                onClick={() => router.push("/teacher/reports")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
              >
                <span>{t.schedule.viewAll}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {history.length === 0 ? (
                <Card className="bg-white/40 dark:bg-[#121226]/40 border border-dashed border-default-200 dark:border-[#222244] p-8 text-center rounded-2xl">
                  <p className="text-default-450 dark:text-slate-500 text-xs">{t.sessionHistory.noHistory}</p>
                </Card>
              ) : (
                history.slice(0, 3).map((session) => (
                  <Card
                    key={session.id || session.sessionId}
                    className="p-4 bg-white dark:bg-[#121226]/60 border border-default-200 dark:border-[#1e1e3b] rounded-2xl hover:border-cyan-500/20 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-lg shadow-sm border border-violet-600/20">
                          {session.quizEmoji || "📄"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xs text-default-900 dark:text-white">
                              {session.sessionLabel || session.sessionId}
                            </h3>
                            <Chip {...{ size: "sm", variant: "dot", color: "success" } as any} className="text-[8px] font-bold py-0 h-4 border-none text-slate-400">
                              {session.quizTitle}
                            </Chip>
                          </div>
                          <p className="text-[10px] text-default-500 dark:text-slate-500 mt-1">
                            {t.dashboardNew.completedAt}: {new Date(session.endedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Right: Score, Students, Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-default-200 dark:border-[#222244]">
                        <div className="text-center sm:text-right">
                          <p className="text-[9px] text-default-400 dark:text-slate-500 uppercase leading-none">{t.dashboardNew.totalStudents}</p>
                          <p className="text-sm font-extrabold text-default-900 dark:text-white mt-1">{session.studentCount} {t.dashboardNew.students}</p>
                        </div>

                        <div className="text-center sm:text-right">
                          <p className="text-[9px] text-default-400 dark:text-slate-500 uppercase leading-none">{t.dashboardNew.avgScore}</p>
                          <p className="text-sm font-extrabold text-cyan-400 mt-1">{session.stats?.averageScore ?? 0}%</p>
                        </div>

                        <button
                          onClick={() => router.push(`/teacher/quizzes/${session.quizId}/history/${session.id}`)}
                          className="flex items-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-all cursor-pointer shrink-0"
                        >
                          <span>{t.sessionHistory.viewDetail}</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: CLASS INSIGHTS & ANALYTICS */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold tracking-wider text-default-450 dark:text-slate-400 uppercase">
              {t.dashboardNew.classAnalytics}
            </h2>

            <Card className="bg-white dark:bg-[#121226]/60 border border-default-200 dark:border-[#1e1e3b] p-5 rounded-2xl space-y-6 flex flex-col justify-between min-h-[300px]">
              {/* Circular accuracy details */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] text-default-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                    {t.dashboardNew.averageAccuracy}
                  </p>
                  <p className="text-2xl font-black text-default-900 dark:text-white">{averageAccuracy}%</p>
                  <p className="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-0.5 font-semibold">
                    <Activity size={10} />
                    <span>Active attempts: {totalAttempts}</span>
                  </p>
                </div>

                {/* Accuracy gauge dial */}
                <div className="relative w-16 h-16 rounded-full border-4 border-default-200 dark:border-slate-800 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-cyan-400 border-b-violet-500 border-l-transparent dark:border-l-slate-800 animate-spin"
                    style={{ animationDuration: "10s" }}
                  />
                  <span className="text-[11px] font-black text-cyan-400">{averageAccuracy}%</span>
                </div>
              </div>

              {/* Vertical score bar charts (Custom CSS graphs) */}
              <div className="space-y-3">
                <p className="text-[9px] text-default-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                  {t.dashboardNew.averageScoreTrend}
                </p>

                {topQuizzesData.length === 0 ? (
                  <p className="text-[10px] text-default-450 dark:text-slate-500 text-center py-6">No session data available</p>
                ) : (
                  <div className="h-28 flex items-end justify-around gap-2 px-2 border-b border-default-200 dark:border-[#222244] pb-1">
                    {topQuizzesData.map((quiz: any, i: number) => (
                      <div key={i} className="flex flex-col items-center flex-1 group relative">
                        {/* Tooltip on hover */}
                        <span className="absolute -top-6 bg-default-900 text-cyan-400 font-bold text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow border border-cyan-500/20">
                          {quiz.averageScore}%
                        </span>
                        
                        {/* The vertical bar */}
                        <div
                          className="w-4 rounded-t-md bg-gradient-to-t from-violet-600 to-cyan-500 group-hover:brightness-110 transition-all duration-300 shadow-lg"
                          style={{ height: `${quiz.averageScore * 0.9}px` }}
                        />
                        
                        {/* Abbreviated label */}
                        <span className="text-[8px] text-default-400 dark:text-slate-500 truncate max-w-[40px] mt-1">
                          {quiz.quizTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Statistics items counter */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-default-200 dark:border-[#1e1e3b]">
                <div className="p-2 rounded-xl bg-violet-500/5 dark:bg-violet-950/20 border border-violet-500/10 dark:border-violet-900/10">
                  <p className="text-[9px] text-default-400 dark:text-slate-500 uppercase">Library</p>
                  <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{quizzes.length}</p>
                </div>
                <div className="p-2 rounded-xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/10 dark:border-cyan-900/10">
                  <p className="text-[9px] text-default-400 dark:text-slate-500 uppercase">Live</p>
                  <p className="text-sm font-bold text-[#00bcd4] dark:text-cyan-400">{publishedQuizzes.length}</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/10 dark:border-amber-900/10">
                  <p className="text-[9px] text-default-400 dark:text-slate-500 uppercase">Drafts</p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{draftQuizzes.length}</p>
                </div>
              </div>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
