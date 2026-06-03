/**
 * monitoringApi.ts — Socket.IO + REST monitoring service
 * Fixed: no listener leak, proper room joining, questions preserved
 */

import { io, Socket } from "socket.io-client";
import { Student, Question, AnswerCellData, LiveStats } from "@/types/teacher/monitoring.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

// ── REST: initial session state ────────────────────────────────

async function getSessionState(sessionId: string): Promise<{
  students: Student[];
  questions: Question[];
  answers: AnswerCellData[];
  stats: LiveStats;
}> {
  try {
    const res = await fetch(`${BASE_URL}/api/monitoring/${sessionId}`);
    if (res.ok) {
      const body = await res.json();
      if (body.success) return body.data;
    }
  } catch (err) {
    console.warn("[monitoringApi] REST load failed, waiting for socket snapshot:", err);
  }

  // Return empty — socket snapshot will populate the real data on connect
  return {
    students:  [],
    questions: [],
    answers:   [],
    stats: { totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0 } as LiveStats,
  };
}

// ── Socket.IO singleton ────────────────────────────────────────
// One persistent socket per browser tab; rooms are joined per session.

let _socket: Socket | null = null;

function getSocket(): Socket {
  if (!_socket || _socket.disconnected) {
    _socket = io(BASE_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });
  }
  return _socket;
}

// ── Setup real-time listeners for Teacher Dashboard ────────────

function setupRealtimeListeners(
  sessionId: string,
  callbacks: {
    onAnswerUpdate:  (answer: AnswerCellData) => void;
    onStudentJoined: (student: Student) => void;
    onStatsUpdate:   (stats: LiveStats) => void;
  },
  onSnapshot?: (data: { students: Student[]; answers: AnswerCellData[]; stats: LiveStats }) => void
) {
  const socket = getSocket();

  // ── Join + snapshot request (called on every connect / reconnect) ──
  const doJoin = () => {
    console.log(`[monitoringApi] Teacher joining room: ${sessionId}`);
    socket.emit("join_quiz",         { sessionId, role: "teacher" });
    // Ask for full Redis snapshot — restores dashboard after page refresh
    socket.emit("get_session_state", { sessionId });
  };

  // Remove any stale listeners before adding new ones (prevents duplicates)
  socket.off("connect",        doJoin);
  socket.off("session_joined");
  socket.off("session_state");
  socket.off("answer_update");
  socket.off("student_joined");
  socket.off("student_left");

  socket.on("connect", doJoin);

  // Join immediately if socket is already connected
  if (socket.connected) doJoin();

  // ── Full snapshot via session_joined (initial connect) ──────
  socket.on("session_joined", (data: any) => {
    console.log("[monitoringApi] session_joined:", data);
    if (data.role === "teacher" && onSnapshot) {
      onSnapshot({
        students: data.students || [],
        answers:  data.answers  || [],
        stats:    data.stats    || {
          totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0
        },
      });
    }
  });

  // ── Full snapshot via session_state (reconnect / refresh) ────
  // Sent by Redis after get_session_state request
  socket.on("session_state", (data: any) => {
    console.log("[monitoringApi] session_state (Redis restore):", data?.students?.length, "students");
    if (onSnapshot) {
      onSnapshot({
        students: data.students || [],
        answers:  data.answers  || [],
        stats:    data.stats    || {
          totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0
        },
      });
    }
  });

  // ── Real-time answer updates ───────────────────────────────
  socket.on("answer_update", ({ answer, stats }: { answer: AnswerCellData; stats: LiveStats }) => {
    console.log("[monitoringApi] answer_update:", answer.studentId, answer.questionId);
    callbacks.onAnswerUpdate(answer);
    if (stats) callbacks.onStatsUpdate(stats);
  });

  // ── Student join / leave ───────────────────────────────────
  socket.on("student_joined", ({ student, stats }: { student: Student; stats: LiveStats }) => {
    console.log("[monitoringApi] student_joined:", student);
    callbacks.onStudentJoined(student);
    if (stats) callbacks.onStatsUpdate(stats);
  });

  socket.on("student_left", ({ student, stats }: { student: Student; stats: LiveStats }) => {
    callbacks.onStudentJoined({ ...student, isOnline: false });
    if (stats) callbacks.onStatsUpdate(stats);
  });

  socket.on("error", (err: { message: string }) => {
    console.warn("[monitoringApi] error:", err.message);
  });

  // ── Cleanup: remove listeners but keep socket alive ────────
  return () => {
    socket.off("connect",        doJoin);
    socket.off("session_joined");
    socket.off("session_state");
    socket.off("answer_update");
    socket.off("student_joined");
    socket.off("student_left");
    socket.off("error");
    console.log("[monitoringApi] cleanup listeners for", sessionId);
  };
}

// ── Teacher session control ────────────────────────────────────

function controlSession(sessionId: string, action: "pause" | "resume" | "stop" | "end") {
  getSocket().emit("control_session", { sessionId, action });
}

// ── Export and History reports ─────────────────────────────────

async function getQuizSessions(quizId: string): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/monitoring/quiz/${quizId}/sessions`);
    if (res.ok) {
      const body = await res.json();
      if (body.success) return body.data;
    }
  } catch (err) {
    console.error("[monitoringApi] getQuizSessions error:", err);
  }
  return [];
}

function getExportUrl(sessionId: string): string {
  return `${BASE_URL}/api/monitoring/sessions/${sessionId}/export`;
}

export const monitoringApi = {
  getSessionState,
  setupRealtimeListeners,
  controlSession,
  getQuizSessions,
  getExportUrl,
};
