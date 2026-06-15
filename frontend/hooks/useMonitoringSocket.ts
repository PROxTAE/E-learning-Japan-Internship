"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Student, AnswerCellData, LiveStats } from "@/types/teacher/monitoring.types";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

// ── Event type constants (must match backend types.js) ─────────
const CLIENT_EVENTS = {
  JOIN_QUIZ:         "join_quiz",
  SUBMIT_ANSWER:     "submit_answer",
  CONTROL_SESSION:   "control_session",
  GET_SESSION_STATE: "get_session_state",   // ← teacher refresh/reconnect
  SET_READY:         "set_ready",           // ← student waiting-room ready toggle
  GET_LOBBY:         "get_lobby",           // ← request current roster
  LEAVE_QUIZ:        "leave_quiz",          // ← student permanently leaves
} as const;

const SERVER_EVENTS = {
  SESSION_JOINED:  "session_joined",
  SESSION_STATE:   "session_state",         // ← full snapshot for reconnect
  STUDENT_JOINED:  "student_joined",
  STUDENT_LEFT:    "student_left",
  ANSWER_UPDATE:   "answer_update",
  SESSION_STATS:   "session_stats",
  SESSION_CONTROL: "session_control",
  LOBBY_UPDATE:    "lobby_update",          // ← waiting-room roster broadcast
  ERROR:           "error",
} as const;

// ── Hook options ───────────────────────────────────────────────
export interface UseTeacherSocketOptions {
  sessionId: string;
  quizId?: string;
  onStudentJoined?:   (student: Student, stats: LiveStats) => void;
  onStudentLeft?:     (student: Student, stats: LiveStats) => void;
  onAnswerUpdate?:    (answer: AnswerCellData, stats: LiveStats) => void;
  onSessionControl?:  (payload: any) => void;
  onLobbyUpdate?:     (students: Student[]) => void;
  onError?:           (message: string) => void;
}

// ── Full session snapshot on join / reconnect ──────────────────
export interface SessionSnapshot {
  students:   Student[];
  answers:    AnswerCellData[];
  stats:      LiveStats;
  isPaused?:  boolean;
  startedAt?: number;
}

export interface UseTeacherSocketReturn {
  isConnected:      boolean;
  controlSession:   (action: "pause" | "resume" | "stop") => void;
  /** Start the quiz for everyone in the waiting room */
  startSession:     () => void;
  /** Manually request a fresh state snapshot (e.g., after teacher-side refresh) */
  requestSnapshot:  () => void;
  /** Manually request the current waiting-room roster */
  requestLobby:     () => void;
}

// ─────────────────────────────────────────────────────────────
//  useTeacherSocket — Teacher Dashboard real-time hook
//
//  On every connect (including after page refresh) the hook
//  emits GET_SESSION_STATE so the teacher's monitoring dashboard
//  is instantly restored from Redis.
// ─────────────────────────────────────────────────────────────
export function useTeacherSocket(
  options: UseTeacherSocketOptions,
  onSnapshot?: (snap: SessionSnapshot) => void
): UseTeacherSocketReturn {
  const socketRef    = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const { sessionId, quizId, onStudentJoined, onStudentLeft, onAnswerUpdate, onSessionControl, onLobbyUpdate, onError } = options;

  useEffect(() => {
    // Create socket with auto-reconnect
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    // ── On (re)connect: restore full state from Redis ──────────
    socket.on("connect", () => {
      console.log("[teacher socket] connected:", socket.id);
      setIsConnected(true);

      // 1. Join the session room so we receive future broadcasts
      socket.emit(CLIENT_EVENTS.JOIN_QUIZ, {
        sessionId,
        quizId,
        role: "teacher",
      });

      // 2. Also explicitly request current snapshot.
      //    This handles reconnects where JOIN_QUIZ alone may not
      //    re-send the full state (e.g., server already has session).
      socket.emit(CLIENT_EVENTS.GET_SESSION_STATE, { sessionId, quizId });
    });

    // ── Initial snapshot via SESSION_JOINED (first connect) ────
    socket.on(SERVER_EVENTS.SESSION_JOINED, (data: any) => {
      if (data.role === "teacher" && onSnapshot) {
        onSnapshot({
          students:  data.students  || [],
          answers:   data.answers   || [],
          stats:     data.stats     || buildEmptyStats(),
          isPaused:  data.isPaused  ?? false,
          startedAt: data.startedAt,
        });
      }
    });

    // ── Full snapshot via SESSION_STATE (refresh / reconnect) ──
    socket.on(SERVER_EVENTS.SESSION_STATE, (data: any) => {
      if (onSnapshot) {
        onSnapshot({
          students:  data.students  || [],
          answers:   data.answers   || [],
          stats:     data.stats     || buildEmptyStats(),
          isPaused:  data.isPaused  ?? false,
          startedAt: data.startedAt,
        });
      }
    });

    // ── Realtime incremental updates ───────────────────────────
    socket.on(SERVER_EVENTS.STUDENT_JOINED, ({ student, stats }: { student: Student; stats: LiveStats }) => {
      onStudentJoined?.(student, stats);
    });

    socket.on(SERVER_EVENTS.STUDENT_LEFT, ({ student, stats }: { student: Student; stats: LiveStats }) => {
      onStudentLeft?.(student, stats);
    });

    socket.on(SERVER_EVENTS.ANSWER_UPDATE, ({ answer, stats }: { answer: AnswerCellData; stats: LiveStats }) => {
      onAnswerUpdate?.(answer, stats);
    });

    socket.on(SERVER_EVENTS.SESSION_CONTROL, (payload: any) => {
      onSessionControl?.(payload);
    });

    socket.on(SERVER_EVENTS.LOBBY_UPDATE, ({ students }: { students: Student[] }) => {
      onLobbyUpdate?.(students || []);
    });

    socket.on(SERVER_EVENTS.ERROR, ({ message }: { message: string }) => {
      console.warn("[teacher socket] error:", message);
      onError?.(message);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[teacher socket] disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const controlSession = useCallback((action: "pause" | "resume" | "stop") => {
    socketRef.current?.emit(CLIENT_EVENTS.CONTROL_SESSION, { sessionId, action });
  }, [sessionId]);

  /** Start the quiz for all students currently in the waiting room */
  const startSession = useCallback(() => {
    socketRef.current?.emit(CLIENT_EVENTS.CONTROL_SESSION, { sessionId, action: "start" });
  }, [sessionId]);

  /** Imperatively pull the latest state (e.g. a "Refresh" button) */
  const requestSnapshot = useCallback(() => {
    socketRef.current?.emit(CLIENT_EVENTS.GET_SESSION_STATE, { sessionId, quizId });
  }, [sessionId, quizId]);

  /** Imperatively pull the latest waiting-room roster */
  const requestLobby = useCallback(() => {
    socketRef.current?.emit(CLIENT_EVENTS.GET_LOBBY, { sessionId });
  }, [sessionId]);

  return {
    isConnected,
    controlSession,
    startSession,
    requestSnapshot,
    requestLobby,
  };
}

// ─────────────────────────────────────────────────────────────
//  useStudentSocket — Student Play Page real-time hook
// ─────────────────────────────────────────────────────────────
export interface UseStudentSocketOptions {
  sessionId: string;
  quizId?:   string;
  studentId: string;   // empty string = not ready yet
  name:      string;
  avatar?:   string;
  onSessionControl?: (payload: any) => void;
  onLobbyUpdate?:    (students: Student[]) => void;
  onError?:          (message: string) => void;
}

export interface UseStudentSocketReturn {
  isConnected:  boolean;
  submitAnswer: (args: {
    questionId:   string;
    choiceId:     string;
    choiceText?:  string;
    isCorrect?:   boolean;
    responseTime: number;
  }) => void;
  /** Toggle this student's waiting-room "ready" flag */
  setReady: (isReady: boolean) => void;
  /** Permanently leave the session (removes this student's record) */
  leaveSession: () => void;
}

export function useStudentSocket(options: UseStudentSocketOptions): UseStudentSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const { sessionId, quizId, studentId, name, avatar, onSessionControl, onLobbyUpdate, onError } = options;

  useEffect(() => {
    // Don't connect until we have a real student identity
    if (!sessionId || !studentId) return;

    console.log(`[studentSocket] connecting — session: ${sessionId}, student: ${studentId}`);

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[studentSocket] connected (${socket.id}), joining room…`);
      setIsConnected(true);
      socket.emit(CLIENT_EVENTS.JOIN_QUIZ, {
        sessionId,
        quizId,
        studentId,
        name,
        avatar,
        role: "student",
      });
    });

    socket.on(SERVER_EVENTS.SESSION_JOINED, (data: any) => {
      console.log("[studentSocket] session_joined ack:", data);
      if (data && data.role === "student") {
        onSessionControl?.({
          action: "init",
          isTeacherLed: data.isTeacherLed,
          currentQuestionIndex: data.currentQuestionIndex,
          timer: data.timer,
          timerActive: data.timerActive,
        });
      }
    });

    socket.on(SERVER_EVENTS.SESSION_CONTROL, (payload: any) => {
      onSessionControl?.(payload);
    });

    socket.on(SERVER_EVENTS.LOBBY_UPDATE, ({ students }: { students: Student[] }) => {
      onLobbyUpdate?.(students || []);
    });

    socket.on(SERVER_EVENTS.ERROR, ({ message }: { message: string }) => {
      console.warn("[studentSocket] error:", message);
      onError?.(message);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[studentSocket] disconnected");
    });

    return () => {
      console.log("[studentSocket] cleanup");
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  // Re-run only when real identity is ready or session changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, studentId]);

  const submitAnswer = useCallback((args: {
    questionId:   string;
    choiceId:     string;
    choiceText?:  string;
    isCorrect?:   boolean;
    responseTime: number;
  }) => {
    if (!socketRef.current?.connected) {
      console.warn("[studentSocket] submitAnswer: socket not connected, skipping");
      return;
    }
    const payload = { sessionId, quizId, studentId, ...args };
    console.log("[studentSocket] emit submit_answer:", payload);
    socketRef.current.emit(CLIENT_EVENTS.SUBMIT_ANSWER, payload);
  }, [sessionId, quizId, studentId]);

  const setReady = useCallback((isReady: boolean) => {
    socketRef.current?.emit(CLIENT_EVENTS.SET_READY, { sessionId, studentId, isReady });
  }, [sessionId, studentId]);

  const leaveSession = useCallback(() => {
    socketRef.current?.emit(CLIENT_EVENTS.LEAVE_QUIZ, { sessionId, studentId });
  }, [sessionId, studentId]);

  return { isConnected, submitAnswer, setReady, leaveSession };
}

// ── Utility ────────────────────────────────────────────────────
function buildEmptyStats(): LiveStats {
  return {
    totalStudents:        0,
    activeStudents:       0,
    averageScore:         0,
    completionPercentage: 0,
    totalAnswers:         0,
    correctAnswers:       0,
  } as LiveStats;
}
