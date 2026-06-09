// ─────────────────────────────────────
//  Quiz Builder — Zustand Store
// ─────────────────────────────────────
"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Quiz, Question, Choice, QuizFormData, Difficulty, QuestionType } from "@/types/quiz";
import { MOCK_QUIZ } from "@/services/quizApi";

// ── Helpers ────────────────────────────────────────────────────
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function makeChoice(text = ""): Choice {
  return { id: `c-${uid()}`, text, isCorrect: false };
}

function makeQuestion(type: QuestionType = "multiple_choice"): Question {
  const choices =
    type === "true_false"
      ? [makeChoice("True"), makeChoice("False")]
      : [makeChoice(), makeChoice(), makeChoice(), makeChoice()];
  return {
    id: `q-${uid()}`,
    text: "",
    type,
    choices,
    order: 0,
  };
}

// ── State shape ────────────────────────────────────────────────
interface QuizStore {
  /** MongoDB _id of the loaded quiz (null = new quiz not yet saved) */
  quizId: string | null;
  quiz: QuizFormData;
  questions: Question[];
  activeQuestionId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  previewMode: boolean;

  // Quiz-level actions
  setQuizId: (id: string | null) => void;
  setQuizField: <K extends keyof QuizFormData>(key: K, value: QuizFormData[K]) => void;
  loadQuiz: (quiz: Quiz) => void;
  loadMockQuiz: () => void;
  resetQuiz: () => void;

  // Question actions
  addQuestion: (type?: QuestionType) => void;
  removeQuestion: (id: string) => void;
  updateQuestionText: (id: string, text: string) => void;
  setQuestionType: (id: string, type: QuestionType) => void;
  setActiveQuestion: (id: string | null) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;

  // Choice actions
  addChoice: (questionId: string) => void;
  removeChoice: (questionId: string, choiceId: string) => void;
  updateChoiceText: (questionId: string, choiceId: string, text: string) => void;
  setCorrectChoice: (questionId: string, choiceId: string) => void;
  setChoiceImage: (questionId: string, choiceId: string, imageUrl: string | undefined) => void;

  // Image actions
  setQuestionImage: (questionId: string, imageUrl: string | undefined) => void;

  // UI actions
  setPreviewMode: (on: boolean) => void;
  setSaving: (on: boolean) => void;
  markClean: () => void;
  updateQuizFromAi: (data: {
    title?: string;
    description?: string;
    subject?: string;
    chapter?: string;
    difficulty?: Difficulty;
    durationMinutes?: number;
    hasTimeLimit?: boolean;
    showAnswersAfterQuiz?: boolean;
    tags?: string[];
    category?: string;
    questions?: {
      id?: string;
      text: string;
      type: QuestionType;
      choices: {
        id?: string;
        text: string;
        isCorrect: boolean;
      }[];
    }[];
  }) => void;
}

const DEFAULT_QUIZ: QuizFormData = {
  title: "",
  description: "",
  category: "",
  difficulty: "medium" as Difficulty,
  durationMinutes: 10,
  hasTimeLimit: true,
  showAnswersAfterQuiz: true,
  tags: [],
  status: "draft",
  subject: "",
  chapter: "",
};

// ── Store ──────────────────────────────────────────────────────
export const useQuizStore = create<QuizStore>()(
  immer((set) => ({
    quizId: null,
    quiz: { ...DEFAULT_QUIZ },
    questions: [],
    activeQuestionId: null,
    isDirty: false,
    isSaving: false,
    previewMode: false,

    // ── Quiz-level ──────────────────────────────────────
    setQuizId: (id) => set((s) => { s.quizId = id; }),

    setQuizField: (key, value) =>
      set((s) => {
        (s.quiz as Record<string, unknown>)[key] = value;
        s.isDirty = true;
      }),

    /** Load a full Quiz object from the API into the store */
    loadQuiz: (quiz: Quiz) =>
      set((s) => {
        s.quizId = quiz.id;
        const { id, createdAt, updatedAt, questions, ...rest } = quiz;
        void id; void createdAt; void updatedAt;
        s.quiz = rest;
        s.questions = questions.map((q, i) => ({ ...q, order: i }));
        s.activeQuestionId = questions[0]?.id ?? null;
        s.isDirty = false;
      }),

    loadMockQuiz: () =>
      set((s) => {
        const { id, createdAt, updatedAt, questions, ...rest } = MOCK_QUIZ;
        void id; void createdAt; void updatedAt;
        s.quizId = null; // mock quiz is not persisted
        s.quiz = rest;
        s.questions = questions.map((q, i) => ({ ...q, order: i }));
        s.activeQuestionId = questions[0]?.id ?? null;
        s.isDirty = true; // mark dirty so user knows they need to save
      }),

    resetQuiz: () =>
      set((s) => {
        s.quizId = null;
        s.quiz = { ...DEFAULT_QUIZ };
        s.questions = [];
        s.activeQuestionId = null;
        s.isDirty = false;
      }),

    // ── Questions ───────────────────────────────────────
    addQuestion: (type = "multiple_choice") =>
      set((s) => {
        const q = makeQuestion(type);
        q.order = s.questions.length;
        s.questions.push(q);
        s.activeQuestionId = q.id;
        s.isDirty = true;
      }),

    removeQuestion: (id) =>
      set((s) => {
        s.questions = s.questions
          .filter((q) => q.id !== id)
          .map((q, i) => ({ ...q, order: i }));
        if (s.activeQuestionId === id) {
          s.activeQuestionId = s.questions[s.questions.length - 1]?.id ?? null;
        }
        s.isDirty = true;
      }),

    updateQuestionText: (id, text) =>
      set((s) => {
        const q = s.questions.find((q) => q.id === id);
        if (q) { q.text = text; s.isDirty = true; }
      }),

    setQuestionType: (id, type) =>
      set((s) => {
        const q = s.questions.find((q) => q.id === id);
        if (!q) return;
        q.type = type;
        q.choices =
          type === "true_false"
            ? [makeChoice("True"), makeChoice("False")]
            : [makeChoice(), makeChoice(), makeChoice(), makeChoice()];
        s.isDirty = true;
      }),

    setActiveQuestion: (id) =>
      set((s) => { s.activeQuestionId = id; }),

    reorderQuestions: (fromIndex, toIndex) =>
      set((s) => {
        const [moved] = s.questions.splice(fromIndex, 1);
        s.questions.splice(toIndex, 0, moved);
        s.questions.forEach((q, i) => { q.order = i; });
        s.isDirty = true;
      }),

    // ── Choices ─────────────────────────────────────────
    addChoice: (questionId) =>
      set((s) => {
        const q = s.questions.find((q) => q.id === questionId);
        if (q) { q.choices.push(makeChoice()); s.isDirty = true; }
      }),

    removeChoice: (questionId, choiceId) =>
      set((s) => {
        const q = s.questions.find((q) => q.id === questionId);
        if (q) {
          q.choices = q.choices.filter((c) => c.id !== choiceId);
          s.isDirty = true;
        }
      }),

    updateChoiceText: (questionId, choiceId, text) =>
      set((s) => {
        const q = s.questions.find((q) => q.id === questionId);
        const c = q?.choices.find((c) => c.id === choiceId);
        if (c) { c.text = text; s.isDirty = true; }
      }),

    setCorrectChoice: (questionId, choiceId) =>
      set((s) => {
        const q = s.questions.find((q) => q.id === questionId);
        if (q) {
          q.choices.forEach((c) => { c.isCorrect = c.id === choiceId; });
          s.isDirty = true;
        }
      }),

    setChoiceImage: (questionId, choiceId, imageUrl) =>
      set((s) => {
        const q = s.questions.find((q) => q.id === questionId);
        const c = q?.choices.find((c) => c.id === choiceId);
        if (c) { c.imageUrl = imageUrl; s.isDirty = true; }
      }),

    // ── Images ──────────────────────────────────────────
    setQuestionImage: (questionId, imageUrl) =>
      set((s) => {
        const q = s.questions.find((q) => q.id === questionId);
        if (q) { q.imageUrl = imageUrl; s.isDirty = true; }
      }),

    // ── UI ───────────────────────────────────────────────
    setPreviewMode: (on) => set((s) => { s.previewMode = on; }),
    setSaving: (on) => set((s) => { s.isSaving = on; }),
    markClean: () => set((s) => { s.isDirty = false; }),

    updateQuizFromAi: (data) =>
      set((s) => {
        if (data.title !== undefined) s.quiz.title = data.title;
        if (data.description !== undefined) s.quiz.description = data.description;
        if (data.subject !== undefined) s.quiz.subject = data.subject;
        if (data.chapter !== undefined) s.quiz.chapter = data.chapter;
        if (data.difficulty !== undefined) s.quiz.difficulty = data.difficulty;
        if (data.durationMinutes !== undefined) s.quiz.durationMinutes = data.durationMinutes;
        if (data.hasTimeLimit !== undefined) s.quiz.hasTimeLimit = data.hasTimeLimit;
        if (data.showAnswersAfterQuiz !== undefined) s.quiz.showAnswersAfterQuiz = data.showAnswersAfterQuiz;
        if (data.tags !== undefined) s.quiz.tags = data.tags;
        if (data.category !== undefined) s.quiz.category = data.category;
        
        if (data.questions !== undefined) {
          const currentQuestions = [...s.questions];

          data.questions.forEach((q) => {
            const existingQ = q.id
              ? currentQuestions.find((eq) => eq.id === q.id)
              : currentQuestions.find((eq) => eq.text.trim().toLowerCase() === q.text.trim().toLowerCase());

            const questionId = existingQ ? existingQ.id : (q.id || `q-${uid()}`);

            const mappedQuestion = {
              text: q.text,
              type: q.type,
              id: questionId,
              order: existingQ ? existingQ.order : currentQuestions.length,
              choices: (q.choices || []).map((c) => {
                const existingC = existingQ
                  ? (c.id ? existingQ.choices.find((ec) => ec.id === c.id) : existingQ.choices.find((ec) => ec.text.trim().toLowerCase() === c.text.trim().toLowerCase()))
                  : null;
                const choiceId = existingC ? existingC.id : (c.id || `c-${uid()}`);
                return {
                  text: c.text,
                  isCorrect: c.isCorrect,
                  id: choiceId
                };
              })
            };

            if (existingQ) {
              const idx = currentQuestions.findIndex((eq) => eq.id === existingQ.id);
              if (idx !== -1) {
                currentQuestions[idx] = mappedQuestion;
              }
            } else {
              currentQuestions.push(mappedQuestion);
            }
          });

          // Sort by order and re-index sequentially
          s.questions = currentQuestions
            .sort((a, b) => a.order - b.order)
            .map((q, idx) => ({ ...q, order: idx }));

          if (s.questions.length > 0) {
            if (!s.questions.some(q => q.id === s.activeQuestionId)) {
              s.activeQuestionId = s.questions[0].id;
            }
          } else {
            s.activeQuestionId = null;
          }
        }
        s.isDirty = true;
      }),
  }))
);
