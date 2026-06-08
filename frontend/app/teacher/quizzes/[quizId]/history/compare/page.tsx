"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Spinner } from "@heroui/react";
import { ArrowLeft, BarChart2, TrendingUp, Brain } from "lucide-react";
import { sessionHistoryApi, type AggregateData } from "@/services/sessionHistoryApi";
import { CrossSessionChart } from "@/components/teacher/session-history/CrossSessionChart";
import { AiSummaryPanel }   from "@/components/teacher/session-history/AiSummaryPanel";
import { useLang } from "@/lib/i18n/LanguageContext";

type Section = "charts" | "table" | "ai";

function formatDate(d: string, lang: string) {
  try {
    return new Date(d).toLocaleString(
      lang === "th" ? "th-TH" : lang === "ja" ? "ja-JP" : "en-US",
      { dateStyle: "short", timeStyle: "short" }
    );
  } catch { return d; }
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (score >= 60) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export default function CompareSessionsPage() {
  const params  = useParams();
  const router  = useRouter();
  const { t, lang } = useLang();
  const quizId  = params.quizId as string;

  const [aggregate, setAggregate]     = useState<AggregateData | null>(null);
  const [loading,   setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("charts");
  const [aiText, setAiText]           = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiError, setAiError]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sessionHistoryApi.getAggregate(quizId);
      setAggregate(data);
    } catch (err) {
      console.error("Failed to load aggregate:", err);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => { load(); }, [load]);

  const SECTIONS: { key: Section; icon: React.ReactNode; label: string }[] = [
    { key: "charts", icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Charts" },
    { key: "table",  icon: <BarChart2  className="w-3.5 h-3.5" />, label: "Table" },
    { key: "ai",     icon: <Brain      className="w-3.5 h-3.5" />, label: t.sessionHistory.aiInsights },
  ];

  return (
    <div 
      className="min-h-screen text-foreground"
      data-ai-context-type="quiz-compare"
      data-ai-context-name="รายงานเปรียบเทียบผลการเรียนย้อนหลัง (Cross-Session Compare)"
      data-ai-context-data={JSON.stringify({
        quizId,
        sessionsCount: aggregate?.sessions.length || 0,
        sessions: aggregate?.sessions.map(s => ({
          id: s.id,
          label: s.sessionLabel,
          endedAt: s.endedAt,
          studentCount: s.studentCount,
          averageScore: s.stats?.averageScore,
          completionPercentage: s.stats?.completionPercentage
        })),
        questionsPerformance: aggregate?.questionAggregate?.map(q => ({
          id: q.questionId,
          text: q.questionText,
          order: q.order,
          sessionsAccuracy: q.sessions.map(s => ({
            sessionLabel: s.sessionLabel,
            correctPercent: s.correctPercent,
            avgResponseTime: s.avgResponseTime,
            confusionCount: s.confusionCount
          }))
        }))
      })}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button
            onClick={() => router.push(`/teacher/quizzes/${quizId}/history`)}
            className="flex items-center gap-1.5 text-sm text-default-400 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.sessionHistory.backToHistory}
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {t.sessionHistory.crossSessionTitle}
            </h1>
            <p className="text-sm text-default-500 mt-1">
              <BarChart2 className="w-4 h-4 inline mr-1 mb-0.5" />
              {aggregate ? `${aggregate.sessions.length} sessions` : "Loading..."}
            </p>
          </div>

          {/* Section nav */}
          <div className="flex gap-2 flex-wrap">
            {SECTIONS.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeSection === key
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-default-100 dark:bg-white/10 text-default-600 dark:text-default-400 hover:bg-default-200"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !aggregate || aggregate.sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <p className="text-4xl mb-4">📊</p>
            <h3 className="text-lg font-bold text-foreground mb-2">{t.sessionHistory.noSessions}</h3>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>

            {/* Charts */}
            {activeSection === "charts" && (
              <div
                className="rounded-2xl border border-default-200/50 dark:border-white/10 bg-background/60 dark:bg-white/[0.03] p-6"
                data-ai-context-type="compare-charts"
                data-ai-context-name="แผนภูมิเปรียบเทียบระหว่างเซสชัน (Cross-Session Compare Charts)"
                data-ai-context-data={JSON.stringify({
                  sessions: aggregate.sessions.map(s => ({
                    label: s.sessionLabel || t.sessionHistory.unlabeled,
                    studentCount: s.studentCount,
                    avgScore: s.stats?.averageScore,
                    completionPercent: s.stats?.completionPercentage
                  }))
                })}
              >
                <CrossSessionChart aggregate={aggregate} />
              </div>
            )}

            {/* Session summary table */}
            {activeSection === "table" && (
              <div className="rounded-2xl border border-default-200/50 dark:border-white/10 bg-background/60 dark:bg-white/[0.03] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-default-200 dark:border-white/10 bg-default-50 dark:bg-white/[0.03]">
                        {["#", t.sessionHistory.sessionLabel, t.sessionHistory.endedAt, t.sessionHistory.students, t.sessionHistory.avgScore, t.sessionHistory.completion, ""].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left text-xs font-bold text-default-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {aggregate.sessions.map((s, i) => (
                        <tr
                          key={s.id}
                          className="border-b border-default-100 dark:border-white/5 hover:bg-default-50 dark:hover:bg-white/[0.02]"
                          data-ai-context-type="compare-session-item"
                          data-ai-context-name={`ข้อมูลเซสชัน ${s.sessionLabel || t.sessionHistory.unlabeled}`}
                          data-ai-context-data={JSON.stringify({
                            id: s.id,
                            label: s.sessionLabel,
                            endedAt: s.endedAt || s.startedAt,
                            studentCount: s.studentCount,
                            averageScore: s.stats?.averageScore,
                            completionPercentage: s.stats?.completionPercentage
                          })}
                        >
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-default-400">#{i + 1}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">{s.sessionLabel || t.sessionHistory.unlabeled}</p>
                          </td>
                          <td className="px-4 py-3 text-default-500">
                            {formatDate(s.endedAt || s.startedAt, lang)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold">{s.studentCount}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(s.stats?.averageScore ?? 0)}`}>
                              {s.stats?.averageScore ?? 0}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-default-500">
                            {s.stats?.completionPercentage ?? 0}%
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              onPress={() => router.push(`/teacher/quizzes/${quizId}/history/${s.id}`)}
                              className="text-xs font-semibold"
                            >
                              {t.sessionHistory.viewDetail}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI cross-session analysis */}
            {activeSection === "ai" && (
              <div className="rounded-2xl border border-default-200/50 dark:border-white/10 bg-background/60 dark:bg-white/[0.03] p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">{t.sessionHistory.generateCrossAi}</h3>
                  <p className="text-sm text-default-400 mb-4">
                    Analyzes trends across all {aggregate.sessions.length} sessions to provide curriculum improvement recommendations.
                  </p>
                </div>
                <AiSummaryPanel
                  label={t.sessionHistory.generateCrossAi}
                  text={aiText}
                  setText={setAiText}
                  loading={aiLoading}
                  setLoading={setAiLoading}
                  error={aiError}
                  setError={setAiError}
                  onGenerate={(onToken, onDone, onError) =>
                    sessionHistoryApi.streamAiCrossSession(quizId, lang, onToken, onDone, onError)
                  }
                />
              </div>
            )}

          </motion.div>
        )}

      </div>
    </div>
  );
}
