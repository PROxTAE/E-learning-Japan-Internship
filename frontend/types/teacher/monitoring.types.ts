export type AnswerState = "correct" | "wrong" | "unanswered" | "answering";

export interface AnswerChange {
  answer: string;
  timestamp: number; // seconds from start
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  score: number;
  progress: number;
  speed: number;
}

export interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  answerCount: number;
}

export interface Question {
  id: string;
  number: number;
  title: string;
  type: string;
  difficulty: "easy" | "medium" | "hard";
  choices: Choice[];
  averageResponseTime: number;
  correctPercentage: number;
}

export interface AnswerCellData {
  studentId: string;
  questionId: string;
  state: AnswerState;
  finalAnswer?: string;
  correctAnswer?: string;
  responseTime: number; // in seconds
  history: AnswerChange[];
  isCorrect: boolean;
  confusionLevel: "none" | "low" | "high";
}

export interface LiveStats {
  totalStudents: number;
  activeStudents: number;
  averageScore: number;
  completionPercentage: number;
}

export interface MonitoringState {
  isPaused: boolean;
  heatmapMode: boolean;
  filter: "all" | "incorrect" | "unanswered" | "completed";
  sortBy: "score" | "completion" | "speed";
  searchQuery: string;
}
