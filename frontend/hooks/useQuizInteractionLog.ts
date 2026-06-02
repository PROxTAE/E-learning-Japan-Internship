"use client";

/**
 * useQuizInteractionLog.ts
 *
 * Tracks every meaningful student interaction during a quiz session and
 * assembles a structured log that can be submitted to the backend and
 * analysed by an LLM.
 *
 * Interaction types tracked:
 *   view      — question became visible to student
 *   select    — student chose an option (first pick)
 *   change    — student switched from one option to another
 *   deselect  — student un-checked an option (multiple-choice)
 *   heartbeat — page visibility changed (on_task / off_task)
 *
 * Usage:
 *   const log = useQuizInteractionLog({ quizId, quizTitle, studentId, studentName, lang });
 *   log.logView(0);
 *   log.logSelect(0, "opt_C", "POST");
 *   log.logChange(0, "opt_A", "opt_C", "POST");
 *   log.startHeartbeat();
 *   const payload = log.buildFinalLog(quiz, selectedAnswers, startTime);
 *   await log.submitLog(payload);
 */

import { useRef, useCallback, useEffect } from "react";
import type { Quiz } from "@/types/quiz";

// ── Public types ───────────────────────────────────────────────────

export interface InteractionEvent {
  action: "view" | "select" | "change" | "deselect" | "heartbeat";
  timestamp: string; // ISO-8601
  option_id?: string | null;
  option_text?: string | null;
  from_option_id?: string | null;
  status?: "on_task" | "off_task" | null;
}

export interface AnswerLog {
  question_index: number;
  question_id: string;
  question_text: string;
  question_type: "single" | "multiple";
  difficulty: string;
  tags: string[];
  interactions: InteractionEvent[];
  final_answer: string[];
  correct_answers: string[];
  is_correct: boolean;
  time_spent_seconds: number;
  is_confused: boolean;
}

export interface SessionSummary {
  total_score: number;
  full_score: number;
  completion_time_seconds: number;
  average_confusion_rate: number;
}

export interface QuizInteractionLogPayload {
  session_metadata: {
    student_id: string;
    student_name: string;
    quiz_id: string;
    quiz_title: string;
    device_info: string;
    start_timestamp: string;
    lang: string;
  };
  answer_logs: AnswerLog[];
  summary: SessionSummary;
}

// ── Hook options ───────────────────────────────────────────────────

interface UseQuizInteractionLogOptions {
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  lang?: string;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useQuizInteractionLog({
  quizId,
  quizTitle,
  studentId,
  studentName,
  lang = "en",
}: UseQuizInteractionLogOptions) {
  // Per-question interaction event lists: Map<questionIndex, events[]>
  const interactionsRef = useRef<Map<number, InteractionEvent[]>>(new Map());
  // Per-question question-view timestamp (for time_spent calculation)
  const questionViewTime = useRef<Map<number, number>>(new Map());
  // Cleanup ref for the visibility listener
  const visibilityCleanup = useRef<(() => void) | null>(null);
  // Global heartbeat events (not tied to a specific question)
  const heartbeatEvents = useRef<Array<{ questionIndex: number; event: InteractionEvent }>>([]);
  // Track current question index for heartbeat attribution
  const currentQuestionIndexRef = useRef<number>(0);

  // ── Internal helpers ─────────────────────────────────────────────

  function getOrCreateEvents(questionIndex: number): InteractionEvent[] {
    if (!interactionsRef.current.has(questionIndex)) {
      interactionsRef.current.set(questionIndex, []);
    }
    return interactionsRef.current.get(questionIndex)!;
  }

  function pushEvent(questionIndex: number, event: InteractionEvent) {
    getOrCreateEvents(questionIndex).push(event);
  }

  // ── Public log methods ───────────────────────────────────────────

  /** Call when a question becomes visible to the student */
  const logView = useCallback((questionIndex: number) => {
    currentQuestionIndexRef.current = questionIndex;
    questionViewTime.current.set(questionIndex, Date.now());
    pushEvent(questionIndex, {
      action: "view",
      timestamp: new Date().toISOString(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Call when student selects an option for the first time */
  const logSelect = useCallback((questionIndex: number, optionId: string, optionText?: string) => {
    pushEvent(questionIndex, {
      action: "select",
      timestamp: new Date().toISOString(),
      option_id: optionId,
      option_text: optionText ?? null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Call when student changes from one option to another */
  const logChange = useCallback((
    questionIndex: number,
    fromOptionId: string,
    toOptionId: string,
    toOptionText?: string
  ) => {
    pushEvent(questionIndex, {
      action: "change",
      timestamp: new Date().toISOString(),
      from_option_id: fromOptionId,
      option_id: toOptionId,
      option_text: toOptionText ?? null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Call when student de-selects an option (multiple-choice) */
  const logDeselect = useCallback((questionIndex: number, optionId: string) => {
    pushEvent(questionIndex, {
      action: "deselect",
      timestamp: new Date().toISOString(),
      option_id: optionId,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Heartbeat (Page Visibility API) ──────────────────────────────

  /** Start tracking whether the student switches away from the quiz tab */
  const startHeartbeat = useCallback(() => {
    if (typeof document === "undefined") return;

    const handler = () => {
      const status: "on_task" | "off_task" = document.hidden ? "off_task" : "on_task";
      const event: InteractionEvent = {
        action: "heartbeat",
        timestamp: new Date().toISOString(),
        status,
      };
      // Attribute heartbeat to whichever question is currently showing
      const qi = currentQuestionIndexRef.current;
      pushEvent(qi, event);
      heartbeatEvents.current.push({ questionIndex: qi, event });
    };

    document.addEventListener("visibilitychange", handler);
    visibilityCleanup.current = () =>
      document.removeEventListener("visibilitychange", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Stop heartbeat listener */
  const stopHeartbeat = useCallback(() => {
    visibilityCleanup.current?.();
    visibilityCleanup.current = null;
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      visibilityCleanup.current?.();
    };
  }, []);

  // ── Build final payload ──────────────────────────────────────────

  /**
   * Build the full log payload ready to POST to /api/quiz-logs.
   *
   * @param quiz           The Quiz object (from quizApi)
   * @param selectedAnswers Record<questionId, choiceId> collected during play
   * @param startTime      epoch ms when the quiz started (from useState)
   */
  const buildFinalLog = useCallback((
    quiz: Quiz,
    selectedAnswers: Record<string, string>,
    startTime: number | null
  ): QuizInteractionLogPayload => {
    const now = Date.now();
    const completionSeconds = startTime ? Math.round((now - startTime) / 1000) : 0;

    const answer_logs: AnswerLog[] = quiz.questions.map((q, index) => {
      const qId            = (q as any)._id?.toString() || q.id;
      const interactions   = interactionsRef.current.get(index) ?? [];
      const viewedAt       = questionViewTime.current.get(index) ?? now;
      const timeSpent      = Math.round((now - viewedAt) / 1000);
      const selectedId     = selectedAnswers[qId] ?? null;
      const correctChoice  = q.choices.find((c) => c.isCorrect);
      const correctId      = (correctChoice as any)?._id?.toString() || correctChoice?.id || "";
      const isCorrect      = !!selectedId && (selectedId === correctId);
      const selectedChoice = q.choices.find((c) =>
        ((c as any)._id?.toString() || c.id) === selectedId
      );

      // is_confused = true if student changed their mind or deselected
      const isConfused = interactions.some(
        (ev) => ev.action === "change" || ev.action === "deselect"
      );

      return {
        question_index:     index + 1,
        question_id:        qId,
        question_text:      q.text,
        question_type:      "single",
        difficulty:         "Medium",  // Quiz type doesn't carry per-question difficulty yet
        tags:               [],
        interactions,
        final_answer:       selectedId ? [selectedId] : [],
        correct_answers:    correctId  ? [correctId]  : [],
        is_correct:         isCorrect,
        time_spent_seconds: Math.max(0, timeSpent),
        is_confused:        isConfused,
      };
    });

    const totalScore   = answer_logs.filter((l) => l.is_correct).length;
    const confusedCount = answer_logs.filter((l) => l.is_confused).length;

    return {
      session_metadata: {
        student_id:      studentId,
        student_name:    studentName,
        quiz_id:         quiz.id || (quiz as any)._id?.toString(),
        quiz_title:      quiz.title,
        device_info:     typeof navigator !== "undefined" ? navigator.userAgent : "",
        start_timestamp: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        lang,
      },
      answer_logs,
      summary: {
        total_score:             totalScore,
        full_score:              quiz.questions.length,
        completion_time_seconds: completionSeconds,
        average_confusion_rate:
          quiz.questions.length > 0 ? confusedCount / quiz.questions.length : 0,
      },
    };
  }, [studentId, studentName, lang]);

  // ── Submit ────────────────────────────────────────────────────────

  /**
   * POST the log to the Next.js API proxy → backend.
   * Returns the server-assigned logId on success.
   */
  const submitLog = useCallback(async (payload: QuizInteractionLogPayload): Promise<string | null> => {
    try {
      const res = await fetch("/api/quiz-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        console.error("[useQuizInteractionLog] submitLog failed:", body);
        return null;
      }
      return body.data?.logId ?? null;
    } catch (err) {
      console.error("[useQuizInteractionLog] submitLog error:", err);
      return null;
    }
  }, []);

  /** Reset all accumulated events (call on quiz restart) */
  const resetLog = useCallback(() => {
    interactionsRef.current.clear();
    questionViewTime.current.clear();
    heartbeatEvents.current = [];
    currentQuestionIndexRef.current = 0;
  }, []);

  return {
    logView,
    logSelect,
    logChange,
    logDeselect,
    startHeartbeat,
    stopHeartbeat,
    buildFinalLog,
    submitLog,
    resetLog,
  };
}
