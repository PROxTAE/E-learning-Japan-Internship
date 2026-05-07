"use client";

import { useEffect } from "react";
import { useMonitoringStore } from "@/store/monitoringStore";
import { monitoringApi } from "@/services/monitoringApi";
import { MonitoringStats } from "@/components/teacher/monitoring/MonitoringStats";
import { QuizSessionHeader } from "@/components/teacher/monitoring/QuizSessionHeader";
import { MonitoringGrid } from "@/components/teacher/monitoring/MonitoringGrid";
import { Spinner } from "@heroui/react";
import { motion } from "framer-motion";

export default function MonitoringQuizPage() {
  const {
    loading,
    setLoading,
    setSessionData,
    addAnswer,
    updateStudent,
    stats,
    uiState,
    updateUIState
  } = useMonitoringStore();

  const sessionId = "session-react-hooks-001";

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const data = await monitoringApi.getSessionState(sessionId);
        setSessionData(data);
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [sessionId, setLoading, setSessionData]);

  useEffect(() => {
    if (loading || uiState.isPaused) return;

    const cleanup = monitoringApi.setupRealtimeListeners(sessionId, {
      onAnswerUpdate: (newAnswer) => addAnswer(newAnswer),
      onStudentJoined: (student) => updateStudent(student),
      onStatsUpdate: () => { } // Stats updated via answers in real app
    });

    return () => cleanup();
  }, [sessionId, loading, uiState.isPaused, addAnswer, updateStudent]);

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center ">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative w-20 h-20"
        >
          <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
        </motion.div>
        <p className="mt-8 text-violet-400 font-black tracking-[0.3em] uppercase text-xs animate-pulse">Initializing Command Center</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)]  text-foreground p-6 overflow-hidden flex flex-col relative">
      {/* Dynamic Background Effects */}
      {/* <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      </div> */}

      <div className="relative z-10 flex flex-col h-full w-full max-w-[1600px] mx-auto space-y-6">
        <QuizSessionHeader
          quizTitle="Introduction to React Hooks"
          quizCode="RX-9201"
          state={uiState}
          onStateChange={updateUIState}
        />

        <MonitoringStats stats={stats} />

        <div className="flex-1 min-h-0">
          <MonitoringGrid />
        </div>
      </div>
    </div>
  );
}
