"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, LogOut, GraduationCap,
  Search, Plus, History, Play, Edit, Folder, ChevronDown,
  MoreVertical, Activity, Share2, Trash2
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { quizApi } from "@/services/quizApi";
import { sessionHistoryApi } from "@/services/sessionHistoryApi";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Dropdown, Button } from "@heroui/react";

interface TeacherSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

export function TeacherSidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
  isMobile = false
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();

  const isQuizzesSectionActive =
    pathname.startsWith("/teacher/quizzes") ||
    pathname.startsWith("/teacher/monitoring") ||
    pathname.startsWith("/teacher/create-quiz");

  // Dynamic Data States
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Tree View Expand States
  const [folderExpanded, setFolderExpanded] = useState(true);
  const [expandedQuizIds, setExpandedQuizIds] = useState<Record<string, boolean>>({});

  // Active query ID parsed dynamically to prevent Next.js Suspense bailout
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);

  // Fetch quizzes and past session history on load
  useEffect(() => {
    async function loadSidebarData() {
      try {
        const quizRes = await quizApi.listQuizzes();
        setQuizzes(quizRes.quizzes || []);

        const historyRes = await sessionHistoryApi.listAllSessions();
        setHistory(historyRes || []);
      } catch (err) {
        console.error("Failed to load sidebar navigation data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSidebarData();
  }, []);

  // Update query id parameter on route change safely on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setActiveQueryId(params.get("id"));
    }
  }, [pathname]);

  // Group completed session runs by their quizId
  const sessionsByQuiz = useMemo(() => {
    const map: Record<string, any[]> = {};
    history.forEach(session => {
      const qId = session.quizId;
      if (qId) {
        if (!map[qId]) map[qId] = [];
        map[qId].push(session);
      }
    });
    return map;
  }, [history]);

  // Auto-expand parent quiz folder if viewing one of its sub-sessions
  useEffect(() => {
    if (history.length > 0 && pathname) {
      const match = pathname.match(/^\/teacher\/quizzes\/([^/]+)\/history\/([^/]+)/i);
      if (match) {
        const activeQuizId = match[1];
        setExpandedQuizIds(prev => ({
          ...prev,
          [activeQuizId]: true
        }));
      }
    }
  }, [history, pathname]);

  // Filter and sort quizzes based on sidebar search input and last updated (updatedAt) date
  const filteredQuizzes = useMemo(() => {
    return quizzes
      .filter(quiz =>
        quiz.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateB - dateA;
      });
  }, [quizzes, searchQuery]);

  const toggleQuizExpand = (quizId: string) => {
    setExpandedQuizIds(prev => ({
      ...prev,
      [quizId]: !prev[quizId]
    }));
  };

  const handleCreateQuizClick = () => {
    onMobileClose?.();
    router.push("/teacher/create-quiz");
  };

  const handleLogoutClick = () => {
    onMobileClose?.();
    router.push("/");
  };

  return (
    <motion.aside
      animate={{
        width: isMobile ? 260 : (collapsed ? 72 : 260),
        x: isMobile ? (mobileOpen ? 0 : -260) : 0
      }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full z-50 flex flex-col bg-white dark:bg-[#0b0b14] border-r border-default-200 dark:border-[#1a1a2e] text-default-600 dark:text-slate-300 overflow-hidden"
    >
      {/* Brand & User Profile */}
      <div className="flex flex-col border-b border-default-150 dark:border-[#16162a]">
        <button
          onClick={isMobile ? onMobileClose : onToggle}
          className="flex items-center gap-3 px-4 h-16 w-full hover:bg-default-100 dark:hover:bg-white/[0.03] transition-colors text-left border-none bg-transparent cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00bcd4] to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left overflow-hidden">
              <p className="text-sm font-bold text-default-900 dark:text-white whitespace-nowrap">
                {t.nav.brand}
              </p>
              <p className="text-xs text-default-500 dark:text-slate-400 whitespace-nowrap">{t.nav.portalSubtitle}</p>
            </motion.div>
          )}
        </button>

        {/* User Profile Info Card */}
        <div className="p-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-[#00bcd4] p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-default-100 dark:bg-[#121225] flex items-center justify-center text-default-900 dark:text-white font-bold text-sm">
                T
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0b0b14]" />
          </div>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="text-xs font-semibold text-default-800 dark:text-white leading-tight truncate">Mr. Takajo</p>
              <p className="text-[10px] text-violet-600 dark:text-cyan-400 leading-tight">Teacher Pro+</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Sidebar Search */}
      {(!collapsed || isMobile) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-2"
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-default-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t.dashboardNew.searchQuizzes}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-default-100 dark:bg-[#121225] border border-default-200 dark:border-[#1e1e38] text-default-900 dark:text-white placeholder-default-400 dark:placeholder-slate-500 outline-none focus:border-violet-500 dark:focus:border-cyan-400 transition-colors"
            />
          </div>
        </motion.div>
      )}

      {/* Scrollable Navigation Sections */}
      <div className="flex-1 px-3 py-4 flex flex-col gap-6 overflow-y-auto scrollbar-none">
        
        {/* Navigation Section */}
        <div>
          <p className="px-3 text-[10px] font-bold text-default-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            {(!collapsed || isMobile) ? t.nav.dashboard : "•"}
          </p>
          <div className="flex flex-col gap-1">
            <Link
              href="/teacher"
              onClick={() => onMobileClose?.()}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                pathname === "/teacher" || pathname === "/teacher/dashboard"
                  ? "bg-gradient-to-r from-violet-600/10 to-violet-600/20 dark:from-violet-600/30 dark:to-cyan-500/10 text-violet-600 dark:text-cyan-400 border border-violet-500/20 dark:border-cyan-500/20 font-semibold"
                  : "hover:bg-default-100 dark:hover:bg-white/[0.03] text-default-500 dark:text-slate-400 hover:text-default-900 dark:hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {(!collapsed || isMobile) && <span className="text-xs">{t.nav.dashboard}</span>}
            </Link>

            <Link
              href="/teacher/quizzes"
              onClick={() => onMobileClose?.()}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                pathname === "/teacher/quizzes"
                  ? "bg-gradient-to-r from-violet-600/10 to-violet-600/20 dark:from-violet-600/30 dark:to-cyan-500/10 text-violet-600 dark:text-cyan-400 border border-violet-500/20 dark:border-cyan-500/20 font-semibold"
                  : "hover:bg-default-100 dark:hover:bg-white/[0.03] text-default-500 dark:text-slate-400 hover:text-default-900 dark:hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              {(!collapsed || isMobile) && <span className="text-xs">{t.nav.quizzes}</span>}
            </Link>
          </div>
        </div>

        {/* Quiz Library Section (Accordion Capsule Folder) */}
        <div>
          <button
            onClick={() => setFolderExpanded(!folderExpanded)}
            className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between font-semibold cursor-pointer border-none transition-all active:scale-[0.98] mb-3 ${
              isQuizzesSectionActive
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/10"
                : "bg-default-100 dark:bg-white/5 text-default-700 dark:text-slate-300 hover:bg-default-200 dark:hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 shrink-0" />
              {(!collapsed || isMobile) && <span className="text-xs font-bold uppercase tracking-wider">{t.nav.quizzes}</span>}
            </div>
            {(!collapsed || isMobile) && (
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${folderExpanded ? "rotate-180" : ""}`}
              />
            )}
          </button>
          
          <AnimatePresence>
            {folderExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col gap-1.5"
              >
                {loading ? (
                  <div className="px-3 py-2 text-[10px] text-default-400 dark:text-slate-500">Loading...</div>
                ) : filteredQuizzes.length === 0 ? (
                  <div className="px-3 py-2 text-[10px] text-default-400 dark:text-slate-500">No quizzes found</div>
                ) : (
                  filteredQuizzes.map(quiz => {
                    const qId = quiz.id || quiz._id;
                    const isDraft = quiz.status !== "published";
                    const quizSessions = sessionsByQuiz[qId] || [];
                    const isExpanded = !!expandedQuizIds[qId];

                    // Active styles for editing, monitoring, or history
                    const isQuizDirectActive = pathname === `/teacher/monitoring/${qId}` || (pathname === "/teacher/create-quiz" && activeQueryId === qId);
                    const isQuizHistoryActive = pathname.startsWith(`/teacher/quizzes/${qId}`);
                    const isQuizActive = isQuizDirectActive || isQuizHistoryActive;

                    return (
                      <div key={qId} className="flex flex-col">
                        {/* Quiz Parent Row */}
                        <div
                          onClick={(e) => {
                            // If the click is inside the actions button container, ignore it to prevent toggling/navigation
                            const target = e.target as HTMLElement;
                            if (target.closest("[data-actions-container]")) {
                              return;
                            }

                            if (quizSessions.length > 0) {
                              toggleQuizExpand(qId);
                            } else {
                              onMobileClose?.();
                              if (isDraft) {
                                router.push(`/teacher/create-quiz?id=${qId}`);
                              } else {
                                router.push(`/teacher/monitoring/${qId}`);
                              }
                            }
                          }}
                          className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                            isQuizDirectActive
                              ? "bg-gradient-to-r from-violet-600/10 to-violet-600/20 dark:from-violet-600/30 dark:to-cyan-500/10 text-violet-600 dark:text-cyan-400 border border-violet-500/20 dark:border-cyan-500/20 font-bold"
                              : isQuizHistoryActive
                                ? "bg-violet-600/[0.04] dark:bg-cyan-500/[0.04] text-violet-600 dark:text-cyan-400 border border-dashed border-violet-500/20 dark:border-cyan-500/20 font-semibold"
                                : isExpanded
                                  ? "bg-default-100/50 dark:bg-white/[0.02]"
                                  : "hover:bg-default-100 dark:hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm shrink-0 select-none">{quiz.emoji || "📄"}</span>
                            {(!collapsed || isMobile) && (
                              <span className="text-xs font-semibold truncate">
                                {quiz.title}
                              </span>
                            )}
                          </div>

                           {(!collapsed || isMobile) && (
                            <div className="flex items-center gap-1.5 shrink-0 relative" data-actions-container="true">
                              {/* Session Count Badge */}
                              {quizSessions.length > 0 && (
                                <span className="w-5 h-5 rounded-full bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-cyan-400 text-[9px] flex items-center justify-center font-extrabold font-mono">
                                  {quizSessions.length}
                                </span>
                              )}

                              {/* HeroUI Actions Dropdown */}
                              <Dropdown>
                                <Button
                                  {...{ isIconOnly: true, size: "sm", variant: "light" } as any}
                                  className="w-7 h-7 min-w-0 p-0 rounded-lg bg-default-100 dark:bg-white/5 hover:bg-default-200 dark:hover:bg-white/10 transition-colors border-none cursor-pointer text-slate-500 dark:text-slate-400 flex items-center justify-center relative"
                                  title="Actions"
                                >
                                  <MoreVertical size={11} className="stroke-[2.5]" />
                                </Button>
                                <Dropdown.Popover className="bg-white dark:bg-[#121225] border border-default-200 dark:border-[#1e1e38] rounded-xl shadow-xl z-50">
                                  <Dropdown.Menu 
                                    aria-label="Quiz actions menu"
                                    onAction={async (key) => {
                                      onMobileClose?.();
                                      if (key === "start") {
                                        router.push(`/teacher/monitoring/${qId}`);
                                      } else if (key === "edit") {
                                        router.push(`/teacher/create-quiz?id=${qId}`);
                                      } else if (key === "history") {
                                        router.push(`/teacher/quizzes/${qId}/history`);
                                      } else if (key === "share") {
                                        let accessCode = quiz.accessCode;
                                        if (!accessCode) {
                                          try {
                                            const updated = await quizApi.generateCode(qId);
                                            accessCode = updated.accessCode;
                                            setQuizzes(prev => prev.map(q => (q.id || q._id) === qId ? { ...q, accessCode } : q));
                                          } catch (err) {
                                            console.error("Failed to generate access code on share:", err);
                                          }
                                        }
                                        if (accessCode) {
                                          const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                                          const joinUrl = `${baseUrl}/play/${accessCode}`;
                                          navigator.clipboard.writeText(joinUrl);
                                          alert("Copied share link to clipboard: " + joinUrl);
                                        }
                                      } else if (key === "delete") {
                                        const confirmDelete = window.confirm(t.quizList.deleteConfirmText || "Are you sure you want to delete this quiz?");
                                        if (confirmDelete) {
                                          try {
                                            await quizApi.deleteQuiz(qId);
                                            setQuizzes(prev => prev.filter(q => (q.id || q._id) !== qId));
                                          } catch (err) {
                                            console.error("Delete failed:", err);
                                          }
                                        }
                                      }
                                    }}
                                  >
                                    {!isDraft ? (
                                      <Dropdown.Item id="start" textValue={t.dashboardNew.startSession}>
                                        <div className="flex items-center gap-2 py-0.5">
                                          <Activity size={11} className="text-purple-600 dark:text-purple-400 shrink-0" />
                                          <span className="text-xs text-default-700 dark:text-slate-200">{t.dashboardNew.startSession}</span>
                                        </div>
                                      </Dropdown.Item>
                                    ) : (
                                      null as any
                                    )}
                                    <Dropdown.Item id="history" textValue={t.quizList.viewHistory}>
                                      <div className="flex items-center gap-2 py-0.5">
                                        <History size={11} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                        <span className="text-xs text-default-700 dark:text-slate-200">{t.quizList.viewHistory}</span>
                                      </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item id="share" textValue={t.quizList.share}>
                                      <div className="flex items-center gap-2 py-0.5">
                                        <Share2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span className="text-xs text-default-700 dark:text-slate-200">{t.quizList.share}</span>
                                      </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item id="edit" textValue={t.dashboardNew.edit}>
                                      <div className="flex items-center gap-2 py-0.5">
                                        <Edit size={11} className="text-slate-600 dark:text-slate-400 shrink-0" />
                                        <span className="text-xs text-default-700 dark:text-slate-200">{t.dashboardNew.edit}</span>
                                      </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item id="delete" textValue={t.quizList.delete} className="hover:bg-red-500/10 dark:hover:bg-red-950/20">
                                      <div className="flex items-center gap-2 py-0.5">
                                        <Trash2 size={11} className="text-red-600 dark:text-red-400 shrink-0" />
                                        <span className="text-xs text-red-600 dark:text-red-400 font-semibold">{t.quizList.delete}</span>
                                      </div>
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown.Popover>
                              </Dropdown>
                            </div>
                          )}
                        </div>

                        {/* Sessions Sub-Tree Connector System */}
                        {quizSessions.length > 0 && isExpanded && (!collapsed || isMobile) && (
                          <div className="flex flex-col ml-3.5">
                            {quizSessions.map((session, sIndex) => {
                              const isLast = sIndex === quizSessions.length - 1;
                              const isSessionActive = pathname === `/teacher/quizzes/${qId}/history/${session.id}`;

                              return (
                                <div key={session.id || session.sessionId} className="relative pl-7 py-1.5 flex items-center">
                                  {/* Top half curved left connector */}
                                  <div className={`absolute left-3.5 top-0 w-3.5 h-[50%] border-l border-b rounded-bl-lg transition-colors ${
                                    isSessionActive
                                      ? "border-violet-500 dark:border-cyan-500/50"
                                      : "border-default-250 dark:border-slate-800"
                                  }`} />
                                  {/* Bottom vertical guide extension if not last */}
                                  {!isLast && (
                                    <div className="absolute left-3.5 top-[50%] bottom-0 border-l border-default-250 dark:border-slate-800" />
                                  )}

                                  {/* Session leaf node link */}
                                  <button
                                    onClick={() => {
                                      onMobileClose?.();
                                      router.push(`/teacher/quizzes/${qId}/history/${session.id}`);
                                    }}
                                    className={`flex items-center gap-2 text-[10px] transition-all px-2 py-1 rounded-md border text-left min-w-0 w-full ${
                                      isSessionActive
                                        ? "bg-violet-600/10 dark:bg-cyan-500/10 text-violet-600 dark:text-cyan-400 border-violet-500/20 dark:border-cyan-500/20 font-semibold"
                                        : "bg-transparent border-transparent text-default-500 dark:text-slate-400 hover:text-default-900 dark:hover:text-white hover:bg-default-100 dark:hover:bg-white/[0.03]"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full border shrink-0 transition-colors ${
                                      isSessionActive
                                        ? "bg-violet-600 dark:bg-cyan-400 border-violet-600 dark:border-cyan-400 shadow shadow-cyan-400/50"
                                        : "border-default-300 dark:border-slate-600 bg-white dark:bg-transparent"
                                    }`} />
                                    <span className="truncate">{session.sessionLabel || session.sessionId}</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Footer Area with Theme Switcher & Actions */}
      <div className="p-3 border-t border-default-150 dark:border-[#16162a] flex flex-col gap-2 bg-default-50/50 dark:bg-[#090910]">
        {/* Toggle Theme Action Row */}
        <div className="flex items-center justify-between px-2">
          {(!collapsed || isMobile) && <span className="text-xs text-default-400 dark:text-slate-500">Theme</span>}
          <ThemeToggle />
        </div>

        {/* Custom Create Quiz block matching visual layout button */}
        {(!collapsed || isMobile) ? (
          <button
            onClick={handleCreateQuizClick}
            className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer border-none transition-all active:scale-95 ${
              pathname === "/teacher/create-quiz" && !activeQueryId
                ? "shadow-violet-600/30 ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-[#0b0b14]"
                : "shadow-violet-600/10"
            }`}
          >
            <Plus size={14} />
            <span>{t.welcome.actions.createQuiz}</span>
          </button>
        ) : (
          <button
            onClick={handleCreateQuizClick}
            className={`w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center mx-auto cursor-pointer border-none transition-all active:scale-95 ${
              pathname === "/teacher/create-quiz" && !activeQueryId
                ? "shadow-violet-600/30 ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-[#0b0b14]"
                : "shadow-violet-600/10"
            }`}
            title={t.welcome.actions.createQuiz}
          >
            <Plus size={16} />
          </button>
        )}

        {/* Log out */}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-default-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs cursor-pointer border-none bg-transparent"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || isMobile) && <span>{t.nav.logout}</span>}
        </button>
      </div>
    </motion.aside>
  );
}
