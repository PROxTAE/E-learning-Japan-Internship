// ─────────────────────────────────────
//  Quiz Builder — Custom Hook
//  Wraps quizStore + quizApi into one clean interface.
// ─────────────────────────────────────
"use client";

import { useCallback } from "react";
import { useQuizStore } from "@/store/quizStore";
import { quizApi } from "@/services/quizApi";
import type { Quiz } from "@/types/quiz";

export function useQuizBuilder() {
  const store = useQuizStore();

  /**
   * Save the current quiz to the backend.
   * - If quizId is set  → PUT  (update existing)
   * - If quizId is null → POST (create new, then store the returned id)
   */
  const save = useCallback(async (): Promise<Quiz | null> => {
    try {
      store.setSaving(true);
      let quiz: Quiz;

      if (store.quizId) {
        // ── Update existing ──────────────────────────────
        quiz = await quizApi.updateQuiz(store.quizId, {
          ...store.quiz,
          questions: store.questions,
        });
      } else {
        // ── Create new, then immediately update with questions ──
        const created = await quizApi.createQuiz(store.quiz);
        quiz = await quizApi.updateQuiz(created.id, {
          questions: store.questions,
        });
        store.setQuizId(quiz.id);
      }

      store.markClean();
      return quiz;
    } catch (err) {
      console.error("Save failed:", err);
      return null;
    } finally {
      store.setSaving(false);
    }
  }, [store]);

  /**
   * Load a quiz from the API by id and populate the store.
   */
  const loadQuiz = useCallback(async (id: string): Promise<void> => {
    try {
      const quiz = await quizApi.getQuiz(id);
      store.loadQuiz(quiz);
    } catch (err) {
      console.error("Load quiz failed:", err);
    }
  }, [store]);

  /** Computed helpers */
  const activeQuestion =
    store.questions.find((q) => q.id === store.activeQuestionId) ?? null;

  const isValid =
    store.quiz.title.trim().length > 0 &&
    store.quiz.category.trim().length > 0 &&
    store.quiz.durationMinutes >= 1;

  /** Image helpers */
  const setQuestionImage = (questionId: string, imageUrl: string | undefined) =>
    store.setQuestionImage(questionId, imageUrl);

  const setChoiceImage = (questionId: string, choiceId: string, imageUrl: string | undefined) =>
    store.setChoiceImage(questionId, choiceId, imageUrl);

  return {
    ...store,
    activeQuestion,
    isValid,
    save,
    loadQuiz,
    setQuestionImage,
    setChoiceImage,
  };
}
