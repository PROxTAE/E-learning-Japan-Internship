import { create } from "zustand";
import { MonitoringState, Student, Question, AnswerCellData, LiveStats } from "@/types/teacher/monitoring.types";


interface MonitoringStore {
  students: Student[];
  questions: Question[];
  answers: AnswerCellData[];
  stats: LiveStats;
  uiState: MonitoringState;
  loading: boolean;

  // Timer State
  timer: number; // in seconds
  timerActive: boolean;

  // Access Code & Room Lock State
  accessCode: string;
  isLocked: boolean;


  // Teacher-Led Presentation Mode
  isTeacherLed: boolean;
  currentQuestionIndex: number;

  setLoading: (loading: boolean) => void;
  setSessionData: (data: { students: Student[]; questions: Question[]; answers: AnswerCellData[]; stats: LiveStats }) => void;
  updateUIState: (updates: Partial<MonitoringState>) => void;
  addAnswer: (answer: AnswerCellData) => void;
  updateStudent: (student: Student) => void;
  removeStudent: (studentId: string) => void;
  updateStats: (stats: LiveStats) => void;
  setQuestions: (questions: Question[]) => void;

  // New Actions
  setTimer: (time: number) => void;
  setTimerActive: (active: boolean) => void;
  adjustTimer: (offsetSeconds: number) => void;
  tickTimer: () => void;
  setAccessCode: (code: string) => void;
  setRoomLocked: (locked: boolean) => void;
  setTeacherLed: (enabled: boolean) => void;
  setCurrentQuestionIndex: (index: number) => void;

  resetStudentProgress: (studentId: string) => void;
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

  // New States defaults
  timer: 0,
  timerActive: false,
  accessCode: "",
  isLocked: false,

  isTeacherLed: false,
  currentQuestionIndex: 0,

  setLoading: (loading) => set({ loading }),
  
  setSessionData: (data) => set((state) => {
    // Normalize students: in-memory fallback sends { studentId } but grid needs { id }
    const normalizeStudents = (arr: (Student & { studentId?: string })[]) =>
      arr.map((s) => ({
        ...s,
        id: s.id || s.studentId || "",
      }));

    const nextStudents  = data.students  !== undefined ? normalizeStudents(data.students as (Student & { studentId?: string })[])  : state.students;
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
    const newAnswers = [...state.answers];
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = answer;
    } else {
      newAnswers.push(answer);
    }

    // Dynamic real-time calculation of student's progress and score
    const totalQuestions = state.questions.length;
    const studentAnswers = newAnswers.filter(a => a.studentId === answer.studentId);
    const correctCount = studentAnswers.filter(a => a.isCorrect).length;

    const progress = totalQuestions > 0 ? Math.round((studentAnswers.length / totalQuestions) * 100) : 0;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const nextStudents = state.students.map((s) => {
      const studentKey = s.id || (s as Student & { studentId?: string }).studentId || "";
      if (studentKey === answer.studentId) {
        return {
          ...s,
          score,
          progress,
        };
      }
      return s;
    });

    return { 
      answers: newAnswers,
      students: nextStudents
    };
  }),

  updateStudent: (student: Student) => set((state) => {
    const normalized: Student = {
      ...student,
      id: student.id || (student as Student & { studentId?: string }).studentId || "",
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

  removeStudent: (studentId) => set((state) => ({
    students: state.students.filter(
      (s) => (s.id || (s as Student & { studentId?: string }).studentId) !== studentId
    ),
    answers: state.answers.filter((a) => a.studentId !== studentId),
  })),

  updateStats: (stats) => set((state) => ({
    stats,
    questions: mergeQuestionStats(state.questions, stats)
  })),

  // New Actions implementation
  setTimer: (time) => set({ timer: time }),
  setTimerActive: (active) => set({ timerActive: active }),
  adjustTimer: (offsetSeconds) => set((state) => ({ timer: Math.max(0, state.timer + offsetSeconds) })),
  tickTimer: () => set((state) => {
    if (state.timer <= 1) {
      return { timer: 0, timerActive: false };
    }
    return { timer: state.timer - 1 };
  }),
  setAccessCode: (code) => set({ accessCode: code }),
  setRoomLocked: (locked) => set({ isLocked: locked }),
  setTeacherLed: (enabled) => set({ isTeacherLed: enabled }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  resetStudentProgress: (studentId) => set((state) => {
    const nextAnswers = state.answers.filter((a) => a.studentId !== studentId);
    const nextStudents = state.students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          score: 0,
          progress: 0,
        };
      }
      return s;
    });
    return {
      answers: nextAnswers,
      students: nextStudents
    };
  })
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
