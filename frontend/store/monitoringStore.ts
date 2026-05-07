import { create } from "zustand";
import { MonitoringState, Student, Question, AnswerCellData, LiveStats } from "@/types/teacher/monitoring.types";
import { MOCK_STUDENTS, MOCK_QUESTIONS, MOCK_ANSWERS, MOCK_LIVE_STATS } from "@/lib/teacher/monitoring.mock";

interface MonitoringStore {
  students: Student[];
  questions: Question[];
  answers: AnswerCellData[];
  stats: LiveStats;
  uiState: MonitoringState;
  loading: boolean;

  setLoading: (loading: boolean) => void;
  setSessionData: (data: { students: Student[]; questions: Question[]; answers: AnswerCellData[]; stats: LiveStats }) => void;
  updateUIState: (updates: Partial<MonitoringState>) => void;
  addAnswer: (answer: AnswerCellData) => void;
  updateStudent: (student: Student) => void;
}

export const useMonitoringStore = create<MonitoringStore>((set) => ({
  students: [],
  questions: [],
  answers: [],
  stats: {
    totalStudents: 0,
    activeStudents: 0,
    averageScore: 0,
    completionPercentage: 0
  },
  uiState: {
    isPaused: false,
    heatmapMode: false,
    filter: "all",
    sortBy: "score",
    searchQuery: ""
  },
  loading: true,

  setLoading: (loading) => set({ loading }),
  setSessionData: (data) => set({ ...data, loading: false }),
  updateUIState: (updates) => set((state) => ({ uiState: { ...state.uiState, ...updates } })),
  addAnswer: (answer) => set((state) => {
    const existingIndex = state.answers.findIndex(a => a.studentId === answer.studentId && a.questionId === answer.questionId);
    let newAnswers = [...state.answers];
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = answer;
    } else {
      newAnswers.push(answer);
    }
    return { answers: newAnswers };
  }),
  updateStudent: (student) => set((state) => ({
    students: state.students.map(s => s.id === student.id ? student : s)
  })),
}));
