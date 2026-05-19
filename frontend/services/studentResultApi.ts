import type { Quiz } from "@/types/quiz";

export interface AnswerReview {
  questionId: string;
  questionText: string;
  selectedChoiceId: string | null;
  selectedChoiceText: string | null;
  correctChoiceId: string;
  correctChoiceText: string;
  isCorrect: boolean;
}

export interface StudentResult {
  score: number;
  total: number;
  percentage: number;
  reviews: AnswerReview[];
}

/**
 * Service for fetching student's quiz results.
 * Currently returns mock data. Ready to be hooked up to the backend.
 */
export const studentResultApi = {
  getStudentResult: async (quizId: string, studentId: string): Promise<StudentResult> => {
    // TODO: Replace with real backend call
    // const res = await fetch(`/api/quizzes/${quizId}/results/${studentId}`);
    // return res.json();
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          score: 3,
          total: 4,
          percentage: 75,
          reviews: [
            {
              questionId: "q1",
              questionText: "What does HTML stand for?",
              selectedChoiceId: "c1",
              selectedChoiceText: "Hyper Text Markup Language",
              correctChoiceId: "c1",
              correctChoiceText: "Hyper Text Markup Language",
              isCorrect: true,
            },
            {
              questionId: "q2",
              questionText: "Which of the following is a CSS framework?",
              selectedChoiceId: "c2",
              selectedChoiceText: "Tailwind",
              correctChoiceId: "c2",
              correctChoiceText: "Tailwind",
              isCorrect: true,
            },
            {
              questionId: "q3",
              questionText: "What is Next.js?",
              selectedChoiceId: "c3",
              selectedChoiceText: "A database",
              correctChoiceId: "c4",
              correctChoiceText: "A React framework",
              isCorrect: false,
            },
            {
              questionId: "q4",
              questionText: "What does API stand for?",
              selectedChoiceId: "c5",
              selectedChoiceText: "Application Programming Interface",
              correctChoiceId: "c5",
              correctChoiceText: "Application Programming Interface",
              isCorrect: true,
            },
          ]
        });
      }, 1000);
    });
  }
};
