/**
 * useQuizSession.ts
 *
 * Persists a student's quiz progress to localStorage so that after a page
 * refresh or reconnect the student can resume exactly where they left off.
 *
 * Stored shape (key = `quiz_session_{quizId}`):
 * {
 *   studentId:       string
 *   studentName:     string
 *   currentIndex:    number
 *   selectedAnswers: Record<questionId, choiceId>
 *   currentSelection:string | null
 *   started:         boolean
 *   isFinished:      boolean
 *   savedAt:         number   (epoch ms)
 * }
 */

"use client";

import { useCallback } from "react";

const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours — auto-expire stale sessions

export interface QuizSessionState {
  studentId:        string;
  studentName:      string;
  currentIndex:     number;
  selectedAnswers:  Record<string, string>;
  currentSelection: string | null;
  started:          boolean;
  isFinished:       boolean;
}

function storageKey(quizId: string) {
  return `quiz_session_${quizId}`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useQuizSession(quizId: string) {

  /** Load saved session from localStorage. Returns null if nothing / expired. */
  const loadSession = useCallback((): QuizSessionState | null => {
    if (!quizId || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey(quizId));
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      // Expire old sessions
      if (!parsed.savedAt || Date.now() - parsed.savedAt > SESSION_TTL_MS) {
        localStorage.removeItem(storageKey(quizId));
        return null;
      }
      return parsed as QuizSessionState;
    } catch {
      return null;
    }
  }, [quizId]);

  /** Persist current state to localStorage. */
  const saveSession = useCallback((state: QuizSessionState) => {
    if (!quizId || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        storageKey(quizId),
        JSON.stringify({ ...state, savedAt: Date.now() })
      );
    } catch { /* storage full — ignore */ }
  }, [quizId]);

  /** Clear session (called when quiz is finished). */
  const clearSession = useCallback(() => {
    if (!quizId || typeof window === "undefined") return;
    localStorage.removeItem(storageKey(quizId));
  }, [quizId]);

  return { loadSession, saveSession, clearSession };
}
