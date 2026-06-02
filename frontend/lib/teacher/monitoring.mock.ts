import type { Student, Question, AnswerCellData, LiveStats } from "@/types/teacher/monitoring.types";

export const MOCK_STUDENTS: Student[] = [
  { id: "s1", name: "Alex Chen", avatar: "https://i.pravatar.cc/150?u=s1", isOnline: true, score: 85, progress: 80, speed: 4.5 },
  { id: "s2", name: "Sarah Smith", avatar: "https://i.pravatar.cc/150?u=s2", isOnline: true, score: 92, progress: 100, speed: 3.2 },
  { id: "s3", name: "Mike Johnson", avatar: "https://i.pravatar.cc/150?u=s3", isOnline: false, score: 40, progress: 40, speed: 6.0 },
  { id: "s4", name: "Emily Davis", avatar: "https://i.pravatar.cc/150?u=s4", isOnline: true, score: 0, progress: 0, speed: 0 },
  { id: "s5", name: "David Wilson", avatar: "https://i.pravatar.cc/150?u=s5", isOnline: true, score: 65, progress: 70, speed: 5.1 },
];

export const MOCK_QUESTIONS: Question[] = Array.from({ length: 10 }, (_, i) => ({
  id: `q${i + 1}`,
  number: i + 1,
  title: `Question ${i + 1}: Sample Topic`,
  type: "Multiple Choice",
  difficulty: i < 3 ? "easy" : i < 7 ? "medium" : "hard",
  averageResponseTime: 4.5,
  correctPercentage: 70,
  choices: [
    { id: `q${i + 1}_c1`, text: "Option A", isCorrect: i % 4 === 0, answerCount: 1 },
    { id: `q${i + 1}_c2`, text: "Option B", isCorrect: i % 4 === 1, answerCount: 2 },
    { id: `q${i + 1}_c3`, text: "Option C", isCorrect: i % 4 === 2, answerCount: 1 },
    { id: `q${i + 1}_c4`, text: "Option D", isCorrect: i % 4 === 3, answerCount: 1 },
  ],
}));

export const MOCK_ANSWERS: AnswerCellData[] = [];

// Generate random answers for 5 students x 10 questions
MOCK_STUDENTS.forEach(student => {
  MOCK_QUESTIONS.forEach(question => {
    const isAnswered = Math.random() > (student.id === "s4" ? 0.9 : 0.2);
    if (isAnswered) {
      const correctChoice = question.choices.find(c => c.isCorrect);
      const isCorrect = Math.random() > 0.3;
      const finalAnswer = isCorrect ? correctChoice?.id : question.choices.find(c => !c.isCorrect)?.id;
      
      const changesCount = Math.floor(Math.random() * 4);
      const history = [];
      let lastTime = 0;
      for (let j = 0; j < changesCount; j++) {
        lastTime += Math.floor(Math.random() * 5) + 1;
        const choiceId = question.choices[Math.floor(Math.random() * 4)].id;
        history.push({
          choiceId,
          answer: choiceId,
          timestamp: lastTime
        });
      }
      
      const responseTime = lastTime + Math.floor(Math.random() * 10) + 2;
      const finalAns = finalAnswer || "";
      history.push({
        choiceId: finalAns,
        answer: finalAns,
        timestamp: responseTime
      });

      MOCK_ANSWERS.push({
        studentId: student.id,
        questionId: question.id,
        state: isCorrect ? "correct" : "wrong",
        finalAnswer,
        correctAnswer: correctChoice?.id,
        responseTime,
        history,
        isCorrect,
        confusionLevel: changesCount > 2 ? "high" : changesCount > 1 ? "low" : "none"
      });
    }
  });
});

export const MOCK_LIVE_STATS: LiveStats = {
  totalStudents: 5,
  activeStudents: 4,
  averageScore: 56.4,
  completionPercentage: 58,
};
