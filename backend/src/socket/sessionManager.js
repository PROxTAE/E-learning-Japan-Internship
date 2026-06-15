/**
 * SessionManager — In-memory live session state
 * Production: replace Map storage with Redis (pattern shown in comments)
 */

// ── In-memory store ────────────────────────────────────────────
// Redis equivalent: HSET quiz:{sessionId}:students ...
const sessions = new Map(); // sessionId → SessionState

/**
 * SessionState shape:
 * {
 *   sessionId: string,
 *   quizId: string,
 *   isPaused: boolean,
 *   students: Map<studentId, StudentRecord>,
 *   answers:  Map<`${studentId}:${questionId}`, AnswerRecord>
 * }
 */

function getOrCreate(sessionId, quizId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      quizId: quizId || "unknown",
      sessionToken: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      startedAt: Date.now(),
      isPaused: false,
      students: new Map(),
      answers: new Map(),
      isLocked: false,
      isTeacherLed: false,
      currentQuestionIndex: 0,
      timer: 0,
      timerActive: false,
    });
  }
  return sessions.get(sessionId);
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

// ── Student management ─────────────────────────────────────────

function upsertStudent(sessionId, student) {
  const session = getOrCreate(sessionId);
  const existing = session.students.get(student.studentId) || {};
  const updated = {
    studentId: student.studentId,
    id:        student.studentId,   // ← alias so monitoring grid can render
    name: student.name,
    avatar: student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.studentId}`,
    isOnline: true,
    isReady: existing.isReady || false,
    score: existing.score || 0,
    progress: existing.progress || 0,
    speed: existing.speed || 0,
    socketId: student.socketId,
    joinedAt: existing.joinedAt || Date.now(),
  };
  session.students.set(student.studentId, updated);
  return updated;
}

function setStudentReady(sessionId, studentId, isReady) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const student = session.students.get(studentId);
  if (student) {
    student.isReady = !!isReady;
    session.students.set(studentId, student);
  }
  return student;
}

function removeStudent(sessionId, studentId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const student = session.students.get(studentId) || null;
  session.students.delete(studentId);
  for (const key of session.answers.keys()) {
    if (key.startsWith(`${studentId}:`)) session.answers.delete(key);
  }
  return student;
}

function setStudentOffline(sessionId, studentId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const student = session.students.get(studentId);
  if (student) {
    student.isOnline = false;
    session.students.set(studentId, student);
  }
  return student;
}

function getStudents(sessionId) {
  const session = sessions.get(sessionId);
  return session ? Array.from(session.students.values()) : [];
}

// ── Answer management ──────────────────────────────────────────

async function recordAnswer(sessionId, { studentId, questionId, choiceId, choiceText, isCorrect, responseTime }) {
  const session = getOrCreate(sessionId);
  const key = `${studentId}:${questionId}`;
  const existing = session.answers.get(key);

  const history = existing ? [...existing.history] : [];
  // Store both choiceId and choiceText so frontend can display label
  history.push({
    choiceId,
    choiceText: choiceText || "",
    answer: choiceId,          // backward-compat alias
    timestamp: Date.now(),
  });

  const confusionLevel = calcConfusion(history, responseTime);

  const record = {
    studentId,
    questionId,
    state: isCorrect ? "correct" : "wrong",
    finalAnswer: choiceId,
    finalAnswerText: choiceText || "",   // ← human-readable label
    isCorrect,
    responseTime,
    history,
    confusionLevel,
    updatedAt: Date.now(),
  };

  session.answers.set(key, record);
  await _refreshStudentStats(session, studentId);
  return record;
}

function getAnswers(sessionId) {
  const session = sessions.get(sessionId);
  return session ? Array.from(session.answers.values()) : [];
}

// ── Stats aggregation ──────────────────────────────────────────

function calcStats(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const students = Array.from(session.students.values());
  const answers = Array.from(session.answers.values());
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.isOnline).length;

  let totalScore = 0;
  let totalCompleted = 0;
  students.forEach(s => {
    totalScore += s.score;
    if (s.progress === 100) totalCompleted++;
  });

  const totalAnswers = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  
  let efficiencyScore = 0;
  if (totalAnswers > 0) {
    const accuracy = correctAnswers / totalAnswers;
    const avgResponseTime = answers.reduce((acc, a) => acc + (a.responseTime || 0), 0) / totalAnswers;
    const timeFactor = avgResponseTime > 15 ? (15 / avgResponseTime) : 1;
    efficiencyScore = Math.round(accuracy * timeFactor * 100);
  }

  return {
    totalStudents,
    activeStudents,
    averageScore: totalStudents ? Math.round(totalScore / totalStudents) : 0,
    completionPercentage: totalStudents ? Math.round((totalCompleted / totalStudents) * 100) : 0,
    totalAnswers,
    correctAnswers,
    efficiencyScore,
    questionStats: getQuestionStats(sessionId),
  };
}

// ── Session control ────────────────────────────────────────────

function setSessionPaused(sessionId, isPaused) {
  const session = sessions.get(sessionId);
  if (session) session.isPaused = isPaused;
}

function setSessionLocked(sessionId, isLocked) {
  const session = sessions.get(sessionId);
  if (session) session.isLocked = isLocked;
}

function setSessionTeacherLed(sessionId, isTeacherLed) {
  const session = sessions.get(sessionId);
  if (session) session.isTeacherLed = isTeacherLed;
}

function setSessionQuestionIndex(sessionId, index) {
  const session = sessions.get(sessionId);
  if (session) session.currentQuestionIndex = index;
}

function setSessionTimer(sessionId, timer, timerActive) {
  const session = sessions.get(sessionId);
  if (session) {
    session.timer = timer;
    session.timerActive = timerActive;
  }
}

function resetStudentAnswers(sessionId, studentId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  for (const key of session.answers.keys()) {
    if (key.startsWith(`${studentId}:`)) {
      session.answers.delete(key);
    }
  }

  const student = session.students.get(studentId);
  if (student) {
    student.score = 0;
    student.progress = 0;
    student.confusionLevel = "none";
  }
}

// ── Private helpers ────────────────────────────────────────────

function calcConfusion(history, responseTime) {
  const changes = history.length - 1;
  if (changes >= 2 || responseTime > 60) return "high";
  if (changes >= 1 || responseTime > 30) return "low";
  return "none";
}

async function _refreshStudentStats(session, studentId) {
  const student = session.students.get(studentId);
  if (!student) return;

  const allAnswers = Array.from(session.answers.values());
  const studentAnswers = allAnswers.filter(a => a.studentId === studentId);
  const correct = studentAnswers.filter(a => a.isCorrect).length;

  let totalQuestions = session.totalQuestions || 0;
  if (!totalQuestions && session.quizId && session.quizId !== "unknown" && session.quizId !== "undefined") {
    try {
      const Quiz = require("../models/Quiz.model");
      const quiz = await Quiz.findById(session.quizId).lean();
      if (quiz && quiz.questions) {
        totalQuestions = quiz.questions.length;
        session.totalQuestions = totalQuestions;
      }
    } catch (e) {
      console.error("[sessionManager _refreshStudentStats] Error fetching quiz:", e);
    }
  }

  if (totalQuestions > 0) {
    student.score = Math.round((correct / totalQuestions) * 100);
    student.progress = Math.round((studentAnswers.length / totalQuestions) * 100);
  } else {
    student.score = studentAnswers.length > 0 ? Math.round((correct / studentAnswers.length) * 100) : 0;
    student.progress = 0;
  }

  session.students.set(studentId, student);
}

/**
 * Aggregates stats for each question based on current answers
 */
function getQuestionStats(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return {};

  const answers = Array.from(session.answers.values());
  const stats = {}; // questionId -> { answerCount, correctCount, avgTime, choices: { choiceId -> count } }

  answers.forEach(a => {
    if (!stats[a.questionId]) {
      stats[a.questionId] = { 
        answerCount: 0, 
        correctCount: 0, 
        totalTime: 0, 
        choices: {} 
      };
    }
    const q = stats[a.questionId];
    q.answerCount++;
    if (a.isCorrect) q.correctCount++;
    q.totalTime += (a.responseTime || 0);
    
    const choiceId = a.finalAnswer;
    q.choices[choiceId] = (q.choices[choiceId] || 0) + 1;
  });

  // Finalize averages
  Object.keys(stats).forEach(id => {
    const q = stats[id];
    q.avgTime = q.answerCount > 0 ? q.totalTime / q.answerCount : 0;
    q.correctPercentage = q.answerCount > 0 ? Math.round((q.correctCount / q.answerCount) * 100) : 0;
  });

  return stats;
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  getOrCreate,
  getSession,
  upsertStudent,
  setStudentReady,
  removeStudent,
  setStudentOffline,
  getStudents,
  recordAnswer,
  getAnswers,
  calcStats,
  getQuestionStats,
  setSessionPaused,
  setSessionLocked,
  setSessionTeacherLed,
  setSessionQuestionIndex,
  setSessionTimer,
  resetStudentAnswers,
  deleteSession,
};
