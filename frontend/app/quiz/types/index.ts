export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface QuizResultData {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
}
