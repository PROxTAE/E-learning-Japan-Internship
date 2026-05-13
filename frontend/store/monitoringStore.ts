import { create } from "zustand";
import { MonitoringState, Student, Question, AnswerCellData, LiveStats } from "@/types/teacher/monitoring.types";

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
  updateStats: (stats: LiveStats) => void;
  setQuestions: (questions: Question[]) => void;
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
  
  setSessionData: (data) => set((state) => {
    // Normalize students: in-memory fallback sends { studentId } but grid needs { id }
    const normalizeStudents = (arr: Student[]) =>
      arr.map((s: any) => ({
        ...s,
        id: s.id || s.studentId || "",
      }));

    const nextStudents  = data.students  !== undefined ? normalizeStudents(data.students as any[])  : state.students;
    const nextAnswers   = data.answers   !== undefined ? data.answers   : state.answers;
    const nextStats     = data.stats     !== undefined ? data.stats     : state.stats;
    // Keep existing questions if snapshot didn't include them (questions come from MongoDB)
    const nextQuestions = (data.questions !== undefined && data.questions.length > 0)
      ? data.questions
      : state.questions;

    return {
      students:  nextStudents,
      questions: mergeQuestionStats(nextQuestions, nextStats),
      answers:   nextAnswers,
      stats:     nextStats,
      loading:   false,
    };
  }),

  setQuestions: (questions) => set((state) => ({ 
    questions: mergeQuestionStats(questions, state.stats) 
  })),

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

  updateStudent: (student: Student) => set((state) => {
    const normalized: Student = {
      ...student,
      id: student.id || (student as any).studentId || "",
    };
    if (!normalized.id) return {};
    const existsAt = state.students.findIndex((s) => s.id === normalized.id);
    if (existsAt >= 0) {
      const next = [...state.students];
      next[existsAt] = { ...next[existsAt], ...normalized };
      return { students: next };
    }
    return { students: [...state.students, normalized] };
  }),

  updateStats: (stats) => set((state) => ({ 
    stats,
    questions: mergeQuestionStats(state.questions, stats)
  })),
}));

/**
 * Merges question-level stats (from backend calcStats) into the frontend question objects
 */
function mergeQuestionStats(questions: Question[], stats: LiveStats): Question[] {
  if (!stats.questionStats) return questions;

  return questions.map(q => {
    const qStat = stats.questionStats![q.id];
    if (!qStat) return q;

    return {
      ...q,
      averageResponseTime: qStat.avgTime,
      correctPercentage: qStat.correctPercentage,
      choices: q.choices.map(c => ({
        ...c,
        answerCount: qStat.choices[c.id] || 0
      }))
    };
  });
}
