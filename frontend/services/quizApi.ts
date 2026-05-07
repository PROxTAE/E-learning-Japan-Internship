// ─────────────────────────────────────────────────────────────
//  quizApi.ts — Real API client (connects to Express + MongoDB)
//  Base URL: http://localhost:5000
// ─────────────────────────────────────────────────────────────

import type { Quiz, QuizFormData, Question } from "@/types/quiz";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";
console.log("Quiz API BASE_URL:", BASE_URL);

// ── internal fetch helper ─────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? `API error ${res.status}`);
  }
  return body.data as T;
}

// ── types returned by list endpoint ──────────────────────────

export interface QuizListResult {
  quizzes: Omit<Quiz, "questions">[];
  total: number;
  page: number;
  limit: number;
}

// ── API surface ───────────────────────────────────────────────

export const quizApi = {
  // ─── Quizzes ─────────────────────────────────────────────

  /** List all quizzes (no questions). Optional status/category filter. */
  listQuizzes: (params?: { status?: string; category?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return apiFetch<QuizListResult>(`/api/quizzes${qs ? `?${qs}` : ""}`);
  },

  /** Fetch a single quiz with all questions */
  getQuiz: (id: string) =>
    apiFetch<Quiz>(`/api/quizzes/${id}`),

  /** Create a new quiz (metadata only, questions added separately) */
  createQuiz: (data: QuizFormData) =>
    apiFetch<Quiz>("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Full save: update quiz metadata AND questions in one PUT.
   * This is the main "Save" action from the Quiz Builder.
   */
  updateQuiz: (id: string, data: Partial<Quiz> & { questions?: Question[] }) =>
    apiFetch<Quiz>(`/api/quizzes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /** Change status only (draft / published / archived) */
  setStatus: (id: string, status: Quiz["status"]) =>
    apiFetch<Quiz>(`/api/quizzes/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  /** Delete a quiz permanently */
  deleteQuiz: (id: string) =>
    apiFetch<{ id: string }>(`/api/quizzes/${id}`, { method: "DELETE" }),

  /** Generate or regenerate an access code for a quiz */
  generateCode: (id: string) =>
    apiFetch<Quiz>(`/api/quizzes/${id}/generate-code`, { method: "POST" }),

  /** Student: Fetch a quiz by its access code */
  getQuizByCode: (code: string) =>
    apiFetch<Quiz>(`/api/play/${code}`),

  // ─── Images ──────────────────────────────────────────────

  /**
   * Upload an image file.
   * Returns a server URL string like "/uploads/1234567-abc.jpg"
   * that can be set as imageUrl on a question or choice.
   */
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`${BASE_URL}/api/quizzes/images/upload`, {
      method: "POST",
      body: form, // no Content-Type header — browser sets multipart boundary
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message ?? "Upload failed");
    // Prepend BASE_URL so <img src> works from any origin
    return `${BASE_URL}${body.data.url}`;
  },

  /** Delete an uploaded image by filename (last segment of the URL) */
  deleteImage: (filename: string) =>
    apiFetch<{ deleted: string }>(`/api/quizzes/images/${filename}`, {
      method: "DELETE",
    }),
};

// ── Backward-compat mock quiz (used as fallback / dev seed) ──

export const MOCK_QUIZ: Quiz = {
  id: "mock-001",
  title: "JavaScript Fundamentals",
  description: "Test your knowledge of core JavaScript concepts.",
  category: "Programming",
  difficulty: "medium",
  durationMinutes: 15,
  tags: ["javascript", "web"],
  status: "draft",
  createdAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
  updatedAt: new Date().toISOString(),
  questions: [
    {
      id: "q-001",
      order: 0,
      type: "multiple_choice",
      text: "Which keyword declares a block-scoped variable?",
      choices: [
        { id: "c-001", text: "var",   isCorrect: false },
        { id: "c-002", text: "let",   isCorrect: true  },
        { id: "c-003", text: "const", isCorrect: false },
        { id: "c-004", text: "def",   isCorrect: false },
      ],
    },
    {
      id: "q-002",
      order: 1,
      type: "true_false",
      text: "JavaScript is a statically typed language.",
      choices: [
        { id: "c-005", text: "True",  isCorrect: false },
        { id: "c-006", text: "False", isCorrect: true  },
      ],
    },
  ],
};
