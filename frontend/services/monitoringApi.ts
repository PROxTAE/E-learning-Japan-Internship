import { Student, Question, AnswerCellData, LiveStats } from "@/types/teacher/monitoring.types";
import { MOCK_STUDENTS, MOCK_QUESTIONS, MOCK_ANSWERS, MOCK_LIVE_STATS } from "@/lib/teacher/monitoring.mock";

class MonitoringApi {
  async getSessionState(sessionId: string): Promise<{
    students: Student[];
    questions: Question[];
    answers: AnswerCellData[];
    stats: LiveStats;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          students: [...MOCK_STUDENTS],
          questions: [...MOCK_QUESTIONS],
          answers: [...MOCK_ANSWERS],
          stats: { ...MOCK_LIVE_STATS }
        });
      }, 800);
    });
  }

  setupRealtimeListeners(
    sessionId: string, 
    callbacks: {
      onAnswerUpdate: (answer: AnswerCellData) => void;
      onStudentJoined: (student: Student) => void;
      onStatsUpdate: (stats: LiveStats) => void;
    }
  ) {
    const interval = setInterval(() => {
      // Simulate random student answering
      const randomStudent = MOCK_STUDENTS[Math.floor(Math.random() * MOCK_STUDENTS.length)];
      const randomQuestion = MOCK_QUESTIONS[Math.floor(Math.random() * MOCK_QUESTIONS.length)];
      
      const newAnswer: AnswerCellData = {
        studentId: randomStudent.id,
        questionId: randomQuestion.id,
        state: Math.random() > 0.5 ? "correct" : "wrong",
        responseTime: Math.floor(Math.random() * 20) + 5,
        history: [],
        isCorrect: true,
        confusionLevel: "none"
      };
      
      callbacks.onAnswerUpdate(newAnswer);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }
}

export const monitoringApi = new MonitoringApi();
