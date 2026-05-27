/**
 * redisService.js — All Redis read/write operations for live quiz sessions
 *
 * Key schema:
 *   quiz:{accessCode}:session            → HSET  (isPaused, startedAt, quizId)
 *   quiz:{accessCode}:students           → HSET  (studentId → JSON StudentRecord)
 *   quiz:{accessCode}:answers:{studentId}→ HSET  (questionId → JSON AnswerRecord)
 *
 * All values are JSON-serialised strings stored in Redis hashes.
 * TTL: 24 hours (86400 s) — prevents stale sessions accumulating.
 *
 * ⚠️  Fallback: if Redis is unavailable (getRedisClient returns null),
 *     every function delegates to the in-memory sessionManager so the
 *     server keeps working — just without persistence across restarts.
 */

const { getRedisClient } = require("./redisClient");
const fallback           = require("../socket/sessionManager"); // in-memory fallback

// ── Key builders ──────────────────────────────────────────────────────────────

const SESSION_TTL = 60 * 60 * 24; // 24 h

const keys = {
  session:  (code)            => `quiz:${code}:session`,
  students: (code)            => `quiz:${code}:students`,
  answers:  (code, studentId) => `quiz:${code}:answers:${studentId}`,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function emptyStats() {
  return { totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0, totalAnswers: 0, correctAnswers: 0, questionStats: {} };
}

async function _touch(client, code) {
  await Promise.all([
    client.expire(keys.session(code),  SESSION_TTL),
    client.expire(keys.students(code), SESSION_TTL),
  ]);
}

// ── Session ───────────────────────────────────────────────────────────────────

/**
 * Ensure a session record exists in Redis (or in-memory if Redis is down).
 * @returns {Promise<{ isPaused: boolean, startedAt: number, quizId: string }>}
 */
async function getOrCreateSession(accessCode, quizId = "") {
  const client = await getRedisClient();
  if (!client) {
    // Fallback: use in-memory sessionManager
    const s = await fallback.getOrCreate(accessCode, quizId);
    return { isPaused: s.isPaused, startedAt: s.startedAt || Date.now(), quizId: s.quizId };
  }

  const key    = keys.session(accessCode);
  const exists = await client.exists(key);

  if (!exists) {
    let totalQuestions = 0;
    if (quizId) {
      try {
        const Quiz = require("../models/Quiz.model");
        const quiz = await Quiz.findById(quizId).lean();
        if (quiz && quiz.questions) {
          totalQuestions = quiz.questions.length;
        }
      } catch (err) {
        console.error("[getOrCreateSession] Error fetching quiz:", err);
      }
    }
    const initial = {
      isPaused: "false",
      startedAt: String(Date.now()),
      quizId,
      totalQuestions: String(totalQuestions)
    };
    await client.hSet(key, initial);
    await client.expire(key, SESSION_TTL);
    return { isPaused: false, startedAt: Number(initial.startedAt), quizId, totalQuestions };
  }

  await _touch(client, accessCode);
  const raw = await client.hGetAll(key);
  let totalQuestions = Number(raw.totalQuestions || 0);

  if (!totalQuestions && (raw.quizId || quizId)) {
    try {
      const Quiz = require("../models/Quiz.model");
      const quiz = await Quiz.findById(raw.quizId || quizId).lean();
      if (quiz && quiz.questions) {
        totalQuestions = quiz.questions.length;
        await client.hSet(key, "totalQuestions", String(totalQuestions));
      }
    } catch (err) {
      console.error("[getOrCreateSession] Error fetching quiz on existing session:", err);
    }
  }

  return {
    isPaused:  raw.isPaused === "true",
    startedAt: Number(raw.startedAt),
    quizId:    raw.quizId || quizId,
    totalQuestions,
  };
}

/**
 * Get session metadata.
 * @returns {Promise<{ isPaused: boolean, startedAt: number, quizId: string } | null>}
 */
async function getSession(accessCode) {
  const client = await getRedisClient();
  if (!client) {
    const s = fallback.getSession(accessCode);
    if (!s) return null;
    return { isPaused: s.isPaused, startedAt: s.startedAt || Date.now(), quizId: s.quizId };
  }

  const raw = await client.hGetAll(keys.session(accessCode));
  if (!raw || !raw.startedAt) return null;
  return {
    isPaused:  raw.isPaused === "true",
    startedAt: Number(raw.startedAt),
    quizId:    raw.quizId || "",
  };
}

/**
 * Set pause state.
 */
async function setSessionPaused(accessCode, isPaused) {
  const client = await getRedisClient();
  if (!client) {
    fallback.setSessionPaused(accessCode, isPaused);
    return;
  }
  await client.hSet(keys.session(accessCode), "isPaused", String(isPaused));
  await _touch(client, accessCode);
}

// ── Students ──────────────────────────────────────────────────────────────────

/**
 * Insert or update a student record.
 * @returns {Promise<StudentRecord>}
 */
async function upsertStudent(accessCode, student) {
  const client = await getRedisClient();
  if (!client) {
    return fallback.upsertStudent(accessCode, student);
  }

  const key      = keys.students(accessCode);
  const raw      = await client.hGet(key, student.studentId);
  const existing = safeJSON(raw) || {};

  const updated = {
    studentId:     student.studentId,
    id:            student.studentId,    // alias so monitoring grid renders correctly
    name:          student.name,
    avatar:        student.avatar
                     || existing.avatar
                     || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.studentId}`,
    isOnline:      true,
    score:         existing.score          ?? 0,
    progress:      existing.progress       ?? 0,
    confusionLevel:existing.confusionLevel ?? "none",
    socketId:      student.socketId,
    joinedAt:      existing.joinedAt       || Date.now(),
    updatedAt:     Date.now(),
  };

  await client.hSet(key, student.studentId, JSON.stringify(updated));
  await client.expire(key, SESSION_TTL);
  return updated;
}

/**
 * Mark student as offline.
 * @returns {Promise<StudentRecord | null>}
 */
async function setStudentOffline(accessCode, studentId) {
  const client = await getRedisClient();
  if (!client) {
    return fallback.setStudentOffline(accessCode, studentId);
  }

  const key = keys.students(accessCode);
  const raw = await client.hGet(key, studentId);
  if (!raw) return null;

  const student = safeJSON(raw);
  if (!student) return null;

  student.isOnline  = false;
  student.updatedAt = Date.now();
  await client.hSet(key, studentId, JSON.stringify(student));
  await client.expire(key, SESSION_TTL);
  return student;
}

/**
 * Return all student records as an array.
 * @returns {Promise<StudentRecord[]>}
 */
async function getStudents(accessCode) {
  const client = await getRedisClient();
  if (!client) {
    return fallback.getStudents(accessCode);
  }

  const raw = await client.hGetAll(keys.students(accessCode));
  return Object.values(raw).map(safeJSON).filter(Boolean);
}

// ── Answers ───────────────────────────────────────────────────────────────────

/**
 * Record or update an answer.
 * @returns {Promise<AnswerRecord>}
 */
async function recordAnswer(accessCode, { studentId, questionId, choiceId, choiceText, isCorrect, responseTime }) {
  const client = await getRedisClient();
  if (!client) {
    return fallback.recordAnswer(accessCode, { studentId, questionId, choiceId, choiceText, isCorrect, responseTime });
  }

  const key      = keys.answers(accessCode, studentId);
  const raw      = await client.hGet(key, questionId);
  const existing = safeJSON(raw) || {};

  const history = existing.history ? [...existing.history] : [];
  history.push({
    choiceId,
    choiceText: choiceText || "",
    answer:     choiceId,
    timestamp:  Date.now(),
  });

  const confusionLevel = _calcConfusion(history, responseTime);

  const record = {
    studentId,
    questionId,
    state:           isCorrect ? "correct" : "wrong",
    finalAnswer:     choiceId,
    finalAnswerText: choiceText || "",
    isCorrect,
    responseTime:    responseTime || 0,
    history,
    confusionLevel,
    updatedAt:       Date.now(),
  };

  await client.hSet(key, questionId, JSON.stringify(record));
  await client.expire(key, SESSION_TTL);

  await _refreshStudentStats(client, accessCode, studentId);
  return record;
}

/**
 * Return all answer records for a session (across all students).
 * @returns {Promise<AnswerRecord[]>}
 */
async function getAnswers(accessCode) {
  const client = await getRedisClient();
  if (!client) {
    return fallback.getAnswers(accessCode);
  }

  const studentsRaw = await client.hGetAll(keys.students(accessCode));
  const studentIds  = Object.keys(studentsRaw);

  const all = [];
  await Promise.all(
    studentIds.map(async (sid) => {
      const raw = await client.hGetAll(keys.answers(accessCode, sid));
      Object.values(raw).forEach((v) => {
        const rec = safeJSON(v);
        if (rec) all.push(rec);
      });
    })
  );
  return all;
}

/**
 * Return all answers for a single student.
 * @returns {Promise<AnswerRecord[]>}
 */
async function getStudentAnswers(accessCode, studentId) {
  const client = await getRedisClient();
  if (!client) {
    // No equivalent in fallback; return what we can from getAnswers
    const all = await fallback.getAnswers(accessCode);
    return all.filter((a) => a.studentId === studentId);
  }

  const raw = await client.hGetAll(keys.answers(accessCode, studentId));
  return Object.values(raw).map(safeJSON).filter(Boolean);
}

// ── Full snapshot (teacher reconnect) ─────────────────────────────────────────

/**
 * Load the complete session state in one call.
 * @returns {Promise<FullSessionSnapshot | null>}
 */
async function getFullSessionState(accessCode) {
  const client = await getRedisClient();

  if (!client) {
    // Fallback: assemble from in-memory sessionManager
    const s = fallback.getSession(accessCode);
    if (!s) return null;
    const students = fallback.getStudents(accessCode);
    const answers  = fallback.getAnswers(accessCode);
    const stats    = fallback.calcStats(accessCode) || emptyStats();
    return { accessCode, isPaused: s.isPaused, startedAt: s.startedAt || Date.now(), quizId: s.quizId, students, answers, stats };
  }

  const sessionMeta = await getSession(accessCode);
  if (!sessionMeta) return null;

  const [students, answers] = await Promise.all([
    getStudents(accessCode),
    getAnswers(accessCode),
  ]);

  const stats = _calcStats(students, answers);
  return { accessCode, ...sessionMeta, students, answers, stats };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

/**
 * Compute stats live. Falls back to in-memory sessionManager when Redis is down.
 * @returns {Promise<SessionStats>}
 */
async function calcStats(accessCode) {
  const client = await getRedisClient();
  if (!client) {
    return fallback.calcStats(accessCode) || emptyStats();
  }

  const [students, answers] = await Promise.all([
    getStudents(accessCode),
    getAnswers(accessCode),
  ]);
  return _calcStats(students, answers);
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _calcStats(students, answers) {
  const totalStudents  = students.length;
  const activeStudents = students.filter((s) => s.isOnline).length;

  let totalScore = 0, totalCompleted = 0;
  students.forEach((s) => {
    totalScore += s.score || 0;
    if (s.progress === 100) totalCompleted++;
  });

  const questionStats = {};
  answers.forEach((a) => {
    if (!questionStats[a.questionId]) {
      questionStats[a.questionId] = { answerCount: 0, correctCount: 0, totalTime: 0, choices: {} };
    }
    const q = questionStats[a.questionId];
    q.answerCount++;
    if (a.isCorrect) q.correctCount++;
    q.totalTime += a.responseTime || 0;
    q.choices[a.finalAnswer] = (q.choices[a.finalAnswer] || 0) + 1;
  });

  Object.values(questionStats).forEach((q) => {
    q.avgTime           = q.answerCount > 0 ? q.totalTime / q.answerCount : 0;
    q.correctPercentage = q.answerCount > 0 ? Math.round((q.correctCount / q.answerCount) * 100) : 0;
  });

  const totalAnswers = answers.length;
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  
  // Calculate Efficiency Score
  // Accuracy weighted by speed. Optimal average time is 15 seconds.
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
    averageScore:         totalStudents ? Math.round(totalScore / totalStudents) : 0,
    completionPercentage: totalStudents ? Math.round((totalCompleted / totalStudents) * 100) : 0,
    totalAnswers,
    correctAnswers,
    efficiencyScore,
    questionStats,
  };
}

async function _refreshStudentStats(client, accessCode, studentId) {
  const studentsKey = keys.students(accessCode);
  const rawStudent  = await client.hGet(studentsKey, studentId);
  if (!rawStudent) return;

  const student    = safeJSON(rawStudent);
  const answersRaw = await client.hGetAll(keys.answers(accessCode, studentId));
  const answers    = Object.values(answersRaw).map(safeJSON).filter(Boolean);

  // Retrieve totalQuestions from session
  const sessionKey = keys.session(accessCode);
  const sessionMeta = await client.hGetAll(sessionKey);
  let totalQuestions = sessionMeta ? Number(sessionMeta.totalQuestions || 0) : 0;

  if (!totalQuestions && sessionMeta && sessionMeta.quizId) {
    try {
      const Quiz = require("../models/Quiz.model");
      const quiz = await Quiz.findById(sessionMeta.quizId).lean();
      if (quiz && quiz.questions) {
        totalQuestions = quiz.questions.length;
        await client.hSet(sessionKey, "totalQuestions", String(totalQuestions));
      }
    } catch (e) {
      console.error("[_refreshStudentStats] Error fetching quiz:", e);
    }
  }

  const correct = answers.filter((a) => a.isCorrect).length;

  if (totalQuestions > 0) {
    student.score = Math.round((correct / totalQuestions) * 100);
    student.progress = Math.round((answers.length / totalQuestions) * 100);
  } else {
    student.score = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;
    student.progress = 0;
  }

  student.confusionLevel = _dominantConfusion(answers);
  student.updatedAt      = Date.now();

  await client.hSet(studentsKey, studentId, JSON.stringify(student));
}

function _dominantConfusion(answers) {
  if (answers.some((a) => a.confusionLevel === "high")) return "high";
  if (answers.some((a) => a.confusionLevel === "low"))  return "low";
  return "none";
}

function _calcConfusion(history, responseTime) {
  const changes = history.length - 1;
  if (changes >= 2 || responseTime > 60) return "high";
  if (changes >= 1 || responseTime > 30) return "low";
  return "none";
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getOrCreateSession,
  getSession,
  setSessionPaused,
  upsertStudent,
  setStudentOffline,
  getStudents,
  recordAnswer,
  getAnswers,
  getStudentAnswers,
  getFullSessionState,
  calcStats,
};
