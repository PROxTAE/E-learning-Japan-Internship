// ─────────────────────────────────────
//  Quiz Builder — Core Types
// ─────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "multiple_choice" | "true_false";
export type QuizStatus = "draft" | "published" | "archived";

export interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  /** Optional base64 data URL or remote URL */
  imageUrl?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  choices: Choice[];
  /** Order position (0-indexed) */
  order: number;
  /** Optional image shown above the question — base64 data URL or remote URL */
  imageUrl?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  durationMinutes: number;
  tags: string[];
  status: QuizStatus;
  accessCode?: string | null;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

/** Partial form state used during editing */
export type QuizFormData = Omit<Quiz, "id" | "createdAt" | "updatedAt" | "questions">;

export interface QuizBuilderState {
  quiz: QuizFormData;
  questions: Question[];
  activeQuestionId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  previewMode: boolean;
}
