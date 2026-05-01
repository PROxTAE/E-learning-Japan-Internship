export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuizStatus = "draft" | "published" | "archived";
export type QuizViewMode = "grid" | "list";

export interface QuizCategory {
  id: string;
  name: string;
  icon: string;
  quizCount: number;
  totalStudents: number;
  description: string;
  gradient: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  questionCount: number;
  duration: number;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  emoji: string;
  gradient: string;
}

export interface QuizStats {
  totalQuizzes: number;
  publishedQuizzes: number;
  draftQuizzes: number;
  archivedQuizzes: number;
  totalAttempts: number;
  averageScore: number;
}

export interface CreateQuizFormData {
  title: string;
  description: string;
  categoryId: string;
  difficulty: QuizDifficulty;
  duration: number;
  tags: string;
}
