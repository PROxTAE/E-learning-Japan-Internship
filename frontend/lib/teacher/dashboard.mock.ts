// dashboard.mock.ts — Mock data for new dashboard widgets

export interface ScheduleItem {
  id: string;
  quizTitle: string;
  emoji: string;
  time: string;
  students: number;
  status: "today" | "tomorrow" | "upcoming";
}

export interface ActivityItem {
  id: string;
  studentName: string;
  action: string;
  quizTitle: string;
  type: "submission" | "achievement" | "warning" | "info";
  timestamp: string; // ISO string
}

export interface WeeklyPerformance {
  week: string;
  attempts: number;
  avgScore: number;
}

export const MOCK_SCHEDULE: ScheduleItem[] = [
  {
    id: "sched-1",
    quizTitle: "Algebra Fundamentals",
    emoji: "📐",
    time: "09:00 – 09:30",
    students: 24,
    status: "today",
  },
  {
    id: "sched-2",
    quizTitle: "Cell Biology Basics",
    emoji: "🔬",
    time: "11:00 – 11:25",
    students: 18,
    status: "today",
  },
  {
    id: "sched-3",
    quizTitle: "English Grammar Mastery",
    emoji: "📖",
    time: "14:00 – 14:40",
    students: 31,
    status: "tomorrow",
  },
  {
    id: "sched-4",
    quizTitle: "Python Programming Basics",
    emoji: "💻",
    time: "10:00 – 10:35",
    students: 22,
    status: "upcoming",
  },
];

// Generate timestamps relative to now for realism
const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    studentName: "Yuki Tanaka",
    action: "submitted quiz with",
    quizTitle: "Algebra Fundamentals — Score: 95%",
    type: "achievement",
    timestamp: ago(4),
  },
  {
    id: "act-2",
    studentName: "Priya Sharma",
    action: "completed",
    quizTitle: "Cell Biology Basics",
    type: "submission",
    timestamp: ago(12),
  },
  {
    id: "act-3",
    studentName: "Akira Sato",
    action: "is struggling with",
    quizTitle: "Advanced Calculus — 3 wrong answers in a row",
    type: "warning",
    timestamp: ago(18),
  },
  {
    id: "act-4",
    studentName: "Maria Lopez",
    action: "started",
    quizTitle: "World War II History",
    type: "info",
    timestamp: ago(27),
  },
  {
    id: "act-5",
    studentName: "James Wong",
    action: "achieved perfect score on",
    quizTitle: "English Grammar Mastery — 100%! 🎉",
    type: "achievement",
    timestamp: ago(45),
  },
  {
    id: "act-6",
    studentName: "Nadia Hassan",
    action: "re-submitted",
    quizTitle: "Python Programming Basics",
    type: "submission",
    timestamp: ago(58),
  },
];

export const MOCK_WEEKLY_PERFORMANCE: WeeklyPerformance[] = [
  { week: "W1",  attempts: 42, avgScore: 68 },
  { week: "W2",  attempts: 67, avgScore: 71 },
  { week: "W3",  attempts: 58, avgScore: 65 },
  { week: "W4",  attempts: 89, avgScore: 74 },
  { week: "W5",  attempts: 103, avgScore: 78 },
  { week: "W6",  attempts: 91, avgScore: 72 },
  { week: "W7",  attempts: 134, avgScore: 82 },
  { week: "W8",  attempts: 156, avgScore: 79 },
];
