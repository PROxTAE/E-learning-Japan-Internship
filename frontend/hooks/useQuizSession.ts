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
  startTime?:       number;
  /** Student is in the waiting room (joined but quiz not started yet) */
  inLobby?:         boolean;
  /** Waiting-room "ready" flag */
  isReady?:         boolean;
}

function storageKey(quizId: string, sessionToken?: string) {
  // Scope saved progress to the current round. When the teacher ends a session
  // the backend rotates the token, so a new round gets a fresh storage key and
  // never restores stale progress from the previous round.
  return sessionToken ? `quiz_session_${quizId}_${sessionToken}` : `quiz_session_${quizId}`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useQuizSession(quizId: string, sessionToken?: string) {

  /** Load saved session from localStorage. Returns null if nothing / expired. */
  const loadSession = useCallback((): QuizSessionState | null => {
    if (!quizId || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey(quizId, sessionToken));
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      // Expire old sessions
      if (!parsed.savedAt || Date.now() - parsed.savedAt > SESSION_TTL_MS) {
        localStorage.removeItem(storageKey(quizId, sessionToken));
        return null;
      }
      return parsed as QuizSessionState;
    } catch {
      return null;
    }
  }, [quizId, sessionToken]);

  /** Persist current state to localStorage. */
  const saveSession = useCallback((state: QuizSessionState) => {
    if (!quizId || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        storageKey(quizId, sessionToken),
        JSON.stringify({ ...state, savedAt: Date.now() })
      );
    } catch { /* storage full — ignore */ }
  }, [quizId, sessionToken]);

  /** Clear session (called when quiz is finished). */
  const clearSession = useCallback(() => {
    if (!quizId || typeof window === "undefined") return;
    localStorage.removeItem(storageKey(quizId, sessionToken));
  }, [quizId, sessionToken]);

  return { loadSession, saveSession, clearSession };
}
