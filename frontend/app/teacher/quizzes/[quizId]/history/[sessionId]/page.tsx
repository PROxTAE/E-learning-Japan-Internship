"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Spinner } from "@heroui/react";
import {
  ArrowLeft, Trophy, Users, CheckCircle2, Clock,
  Brain, Pencil, Check, X, LayoutDashboard, ListChecks, BarChart3
} from "lucide-react";
import { sessionHistoryApi, type SessionDetail } from "@/services/sessionHistoryApi";
import { ScoreDistributionChart }  from "@/components/teacher/session-history/ScoreDistributionChart";
import { QuestionBreakdownChart }  from "@/components/teacher/session-history/QuestionBreakdownChart";
import { ConfusionHeatmap }        from "@/components/teacher/session-history/ConfusionHeatmap";
import { AiSummaryPanel }          from "@/components/teacher/session-history/AiSummaryPanel";
import { useLang } from "@/lib/i18n/LanguageContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

type Tab = "overview" | "students" | "questions" | "ai";

function formatDate(d: string, lang: string) {
  try {
    return new Date(d).toLocaleString(
      lang === "th" ? "th-TH" : lang === "ja" ? "ja-JP" : "en-US",
      { dateStyle: "medium", timeStyle: "short" }
    );
  } catch { return d; }
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "—";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function Initials({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function SessionDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { t, lang } = useLang();
  const quizId  = params.quizId as string;
  const sessionResultId = params.sessionId as string;

  const [session, setSession]           = useState<SessionDetail | null>(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<Tab>("overview");
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelInput, setLabelInput]     = useState("");
  const [savingLabel, setSavingLabel]   = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [aiText, setAiText]             = useState("");
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sessionHistoryApi.getSession(sessionResultId);
      setSession(data);
      setLabelInput(data.sessionLabel || "");
    } catch (err) {
      console.error("Failed to load session detail:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionResultId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveLabel = async () => {
    if (!session) return;
    setSavingLabel(true);
    try {
      await sessionHistoryApi.updateLabel(sessionResultId, labelInput);
      setSession(prev => prev ? { ...prev, sessionLabel: labelInput } : prev);
      setEditingLabel(false);
    } catch (err) {
      console.error("Failed to update label:", err);
    } finally {
      setSavingLabel(false);
    }
  };

  const handleExport = () => {
    window.open(`${BASE_URL}/api/monitoring/sessions/${session?.id}/export`);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );

  if (!session) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <p className="text-lg font-bold text-foreground mb-2">Session not found</p>
      <Button onPress={() => router.back()}>Go Back</Button>
    </div>
  );

  const { stats, students = [], answers = [], questionStats = [] } = session;

  const statCards = [
    { icon: Users,        label: t.sessionHistory.students,   value: stats?.totalStudents ?? 0,                       color: "text-violet-500",  bg: "bg-violet-100 dark:bg-violet-900/30" },
    { icon: Trophy,       label: t.sessionHistory.avgScore,   value: `${stats?.averageScore ?? 0}%`,                  color: "text-amber-500",   bg: "bg-amber-100 dark:bg-amber-900/30" },
    { icon: CheckCircle2, label: t.sessionHistory.completion, value: `${stats?.completionPercentage ?? 0}%`,          color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { icon: Clock,        label: t.sessionHistory.duration,   value: session.endedAt ? formatDuration(session.startedAt, session.endedAt) : "—", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  ];

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview",   label: t.sessionHistory.overview,           icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "students",   label: t.sessionHistory.studentList,         icon: <Users className="w-4 h-4" /> },
    { key: "questions",  label: t.sessionHistory.questionBreakdown,   icon: <BarChart3 className="w-4 h-4" /> },
    { key: "ai",         label: t.sessionHistory.aiInsights,          icon: <Brain className="w-4 h-4" /> },
  ];

  return (
    <div
      className="min-h-screen text-foreground"
      data-ai-context-type="session-detail"
      data-ai-context-name={`รายละเอียดเซสชัน ${session.sessionLabel || t.sessionHistory.unlabeled}`}
      data-ai-context-data={JSON.stringify({
        sessionId: session.sessionId,
        sessionLabel: session.sessionLabel,
        quizId: session.quizId,
        quizTitle: session.quiz?.title,
        quizSubject: session.quiz?.subject,
        quizChapter: session.quiz?.chapter,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.endedAt ? formatDuration(session.startedAt, session.endedAt) : "—",
        stats: {
          totalStudents: stats?.totalStudents ?? 0,
          averageScore: stats?.averageScore ?? 0,
          completionPercentage: stats?.completionPercentage ?? 0,
        },
        students: students.map(st => ({
          studentId: st.studentId,
          name: st.name,
          score: st.score,
          scorePercent: st.scorePercent ?? st.score,
          progress: st.progress
        })),
        questionStats: questionStats.map(qs => ({
          questionId: qs.questionId,
          questionText: qs.questionText,
          order: qs.order,
          answerCount: qs.answerCount,
          correctCount: qs.correctCount,
          correctPercent: qs.correctPercent,
          avgResponseTime: qs.avgResponseTime,
          confusionCount: qs.confusionCount,
          choices: qs.choices
        }))
      })}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push(`/teacher/quizzes/${quizId}/history`)}
          className="flex items-center gap-1.5 text-sm text-default-400 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.sessionHistory.backToHistory}
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Label edit row */}
          <div className="flex items-center gap-3 flex-wrap">
            {editingLabel ? (
              <>
                <input
                  type="text"
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSaveLabel();
                    if (e.key === "Escape") { setEditingLabel(false); setLabelInput(session.sessionLabel || ""); }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-violet-400 bg-background text-foreground text-xl font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/40 w-full max-w-xs"
                />
                <button
                  onClick={handleSaveLabel}
                  disabled={savingLabel}
                  className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingLabel(false); setLabelInput(session.sessionLabel || ""); }}
                  className="w-8 h-8 rounded-lg bg-default-100 text-default-600 flex items-center justify-center hover:bg-default-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {session.sessionLabel || t.sessionHistory.unlabeled}
                </h1>
                <button
                  onClick={() => setEditingLabel(true)}
                  className="p-1.5 rounded-lg text-default-400 hover:text-foreground hover:bg-default-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Quiz meta chips */}
          <div className="flex flex-wrap gap-2 items-center text-sm text-default-500">
            {session.quiz?.title && (
              <span className="text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2.5 py-0.5 rounded-full">
                {session.quiz.title}
              </span>
            )}
            {session.quiz?.subject && (
              <span className="text-xs font-semibold bg-default-100 dark:bg-white/10 text-default-600 px-2.5 py-0.5 rounded-full">
                {session.quiz.subject}
              </span>
            )}
            {session.quiz?.chapter && (
              <span className="text-xs font-semibold bg-default-100 dark:bg-white/10 text-default-600 px-2.5 py-0.5 rounded-full">
                {session.quiz.chapter}
              </span>
            )}
            <span className="text-xs text-default-400">📅 {formatDate(session.startedAt, lang)}</span>
          </div>

          <div>
            <button
              onClick={handleExport}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-default-100 dark:bg-white/10 text-default-600 hover:bg-default-200 transition-colors"
            >
              📊 Export CSV
            </button>
          </div>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {statCards.map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="rounded-2xl p-4 bg-background/60 dark:bg-white/[0.03] border border-default-200/50 dark:border-white/10 shadow-sm flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-default-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-extrabold text-foreground tabular-nums">{value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Custom Tab Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex gap-1 border-b border-default-200 dark:border-white/10 mb-6 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-violet-500 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-default-400 hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {/* ── Overview ── */}
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div
                  data-ai-context-type="score-distribution"
                  data-ai-context-name="แผนภูมิการกระจายคะแนน (Score Distribution)"
                  data-ai-context-data={JSON.stringify({
                    scores: students.map(st => ({ name: st.name, scorePercent: st.scorePercent ?? st.score }))
                  })}
                >
                  <ScoreDistributionChart students={students} />
                </div>
                <div
                  className="space-y-3"
                  data-ai-context-type="confusion-heatmap"
                  data-ai-context-name="ฮีทแมปความสับสนและการตอบคำถาม (Answer & Confusion Heatmap)"
                  data-ai-context-data={JSON.stringify({
                    questionAccuracyAndConfusion: questionStats.map(qs => ({
                      order: qs.order,
                      text: qs.questionText,
                      correctPercent: qs.correctPercent,
                      confusionCount: qs.confusionCount
                    })),
                    studentAnswers: answers.map(ans => ({
                      studentId: ans.studentId,
                      questionId: ans.questionId,
                      isCorrect: ans.isCorrect,
                      responseTime: ans.responseTime,
                      confusionLevel: ans.confusionLevel
                    }))
                  })}
                >
                  <h4 className="text-sm font-bold text-foreground/80">Answer Heatmap</h4>
                  <ConfusionHeatmap students={students} answers={answers} questionStats={questionStats} />
                </div>
              </motion.div>
            )}

            {/* ── Student List ── */}
            {activeTab === "students" && (
              <motion.div key="students" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {students.length === 0 ? (
                  <p className="text-sm text-default-400 text-center py-8">No students recorded</p>
                ) : [...students]
                    .sort((a, b) => (b.scorePercent ?? b.score) - (a.scorePercent ?? a.score))
                    .map((student, i) => {
                  const score = student.scorePercent ?? student.score;
                  const isExpanded = expandedStudentId === student.studentId;
                  const studentAnswers = answers.filter(a => a.studentId === student.studentId);

                  return (
                    <motion.div
                      key={student.studentId}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl border border-default-200/50 dark:border-white/10 bg-background/60 dark:bg-white/[0.03] overflow-hidden"
                      data-ai-context-type="student-report"
                      data-ai-context-name={`ผลการเรียนของ ${student.name}`}
                      data-ai-context-data={JSON.stringify({
                        studentId: student.studentId,
                        name: student.name,
                        rank: i + 1,
                        scorePercent: score,
                        answers: studentAnswers.map(ans => {
                          const q = questionStats.find(qs => qs.questionId === ans.questionId);
                          return {
                            questionOrder: q?.order,
                            questionText: q?.questionText,
                            isCorrect: ans.isCorrect,
                            responseTime: ans.responseTime,
                            confusionLevel: ans.confusionLevel,
                            selectedChoiceText: ans.choiceText,
                            changeCount: ans.changeCount
                          };
                        })
                      })}
                    >
                      <button
                        onClick={() => setExpandedStudentId(isExpanded ? null : student.studentId)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-default-50 dark:hover:bg-white/[0.03] transition-colors text-left"
                      >
                        <span className="text-sm font-bold text-default-400 w-6 shrink-0">#{i + 1}</span>
                        <Initials name={student.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{student.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full bg-default-100 dark:bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${score}%` }} />
                            </div>
                            <span className="text-xs font-bold text-foreground/70 tabular-nums w-10 shrink-0">{score}%</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-default-400 shrink-0">{isExpanded ? "▲" : "▼"}</span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden border-t border-default-200/50 dark:border-white/10"
                          >
                            <div className="p-4 space-y-4">
                              {/* Answer dot grid */}
                              <div className="flex flex-wrap gap-2">
                                {questionStats.sort((a, b) => a.order - b.order).map((q, qi) => {
                                  const ans = studentAnswers.find(a => a.questionId === q.questionId);
                                  let dotClass = "bg-default-200 dark:bg-white/10";
                                  if (ans) dotClass = ans.isCorrect ? "bg-emerald-500" : ans.confusionLevel !== "none" ? "bg-amber-400" : "bg-red-400";
                                  return (
                                    <div key={q.questionId} className="flex flex-col items-center gap-1">
                                      <div className={`w-7 h-7 rounded-lg ${dotClass} flex items-center justify-center`}>
                                        <span className="text-[9px] font-bold text-white">{qi + 1}</span>
                                      </div>
                                      {ans && <span className="text-[8px] text-default-400">{ans.responseTime}s</span>}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Per-student AI */}
                              <AiSummaryPanel
                                label={t.sessionHistory.generateStudentAi}
                                onGenerate={(onToken, onDone, onError) =>
                                  sessionHistoryApi.streamAiStudent(sessionResultId, student.studentId, lang, onToken, onDone, onError)
                                }
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Question Breakdown ── */}
            {activeTab === "questions" && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                data-ai-context-type="questions-breakdown"
                data-ai-context-name="ข้อมูลวิเคราะห์รายข้อคำถาม (Question Breakdown)"
                data-ai-context-data={JSON.stringify({
                  questions: questionStats.map(qs => ({
                    order: qs.order,
                    text: qs.questionText,
                    correctPercent: qs.correctPercent,
                    avgResponseTime: qs.avgResponseTime,
                    confusionCount: qs.confusionCount,
                    choices: qs.choices.map(c => ({ text: c.choiceText, count: c.count }))
                  }))
                })}
              >
                <QuestionBreakdownChart questionStats={questionStats} />
              </motion.div>
            )}

            {/* ── AI Insights ── */}
            {activeTab === "ai" && (
              <motion.div key="ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{t.sessionHistory.generateAiSummary}</h3>
                  <p className="text-sm text-default-400 mb-4">Class-wide analysis with teaching recommendations</p>
                  <AiSummaryPanel
                    text={aiText}
                    setText={setAiText}
                    loading={aiLoading}
                    setLoading={setAiLoading}
                    error={aiError}
                    setError={setAiError}
                    onGenerate={(onToken, onDone, onError) =>
                      sessionHistoryApi.streamAiSummary(sessionResultId, lang, onToken, onDone, onError)
                    }
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}
