/**
 * Quiz socket handlers — join, answer, control, disconnect
 *
 * State is now persisted in Redis via redisService.
 * In-memory sessionManager has been removed from this file.
 */

const {
  CLIENT_EVENTS, SERVER_EVENTS,
  teacherRoom, sessionRoom,
} = require("./types");

const redis = require("../redis/redisService");
const { validateJoinPayload, validateAnswerPayload, cleanupSocket } = require("./socketMiddleware");
const Quiz = require("../models/Quiz.model");

module.exports = function registerHandlers(io, socket) {

  // ── JOIN_QUIZ ────────────────────────────────────────────────────────────────
  socket.on(CLIENT_EVENTS.JOIN_QUIZ, async (payload) => {
    try {
      const error = validateJoinPayload(payload);
      if (error) return socket.emit(SERVER_EVENTS.ERROR, { message: error });

      const { sessionId, quizId, studentId, name, avatar, role } = payload;
      console.log(`[join_quiz] role=${role} sessionId=${sessionId} studentId=${studentId || "N/A"}`);

      // Ensure session exists in Redis (creates if absent)
      await redis.getOrCreateSession(sessionId, quizId || "");

      // Join socket rooms
      socket.join(sessionRoom(sessionId));
      socket.data = { sessionId, studentId, role };

      // ── Teacher ────────────────────────────────────────────────────────────
      if (role === "teacher") {
        socket.join(teacherRoom(sessionId));
        console.log(`[join_quiz] Teacher joined teacherRoom: ${teacherRoom(sessionId)}`);

        const [students, answers, stats] = await Promise.all([
          redis.getStudents(sessionId),
          redis.getAnswers(sessionId),
          redis.calcStats(sessionId),
        ]);

        const quiz = quizId
          ? await Quiz.findById(quizId).lean().catch(() => null)
          : null;

        return socket.emit(SERVER_EVENTS.SESSION_JOINED, {
          role: "teacher",
          sessionId,
          students,
          answers,
          stats,
          quiz,
        });
      }

      // ── Student ────────────────────────────────────────────────────────────
      const student = await redis.upsertStudent(sessionId, {
        studentId, name, avatar, socketId: socket.id,
      });
      const stats = await redis.calcStats(sessionId);

      console.log(`[join_quiz] Student joined. Broadcasting to: ${teacherRoom(sessionId)}`);
      socket.emit(SERVER_EVENTS.SESSION_JOINED, { role: "student", sessionId, student });
      io.to(teacherRoom(sessionId)).emit(SERVER_EVENTS.STUDENT_JOINED, { student, stats });

    } catch (err) {
      console.error("[join_quiz] error:", err);
      socket.emit(SERVER_EVENTS.ERROR, { message: "Internal error joining session" });
    }
  });

  // ── SUBMIT_ANSWER ────────────────────────────────────────────────────────────
  socket.on(CLIENT_EVENTS.SUBMIT_ANSWER, async (payload) => {
    try {
      const error = validateAnswerPayload(payload);
      if (error) return socket.emit(SERVER_EVENTS.ERROR, { message: error });

      const { sessionId, studentId, questionId, choiceId, choiceText, responseTime, quizId } = payload;
      console.log(`[submit_answer] sessionId=${sessionId} student=${studentId} question=${questionId} choice=${choiceId}`);

      // Check pause state
      const sessionMeta = await redis.getSession(sessionId);
      if (sessionMeta?.isPaused) {
        return socket.emit(SERVER_EVENTS.ERROR, { message: "Session is paused" });
      }

      // Determine correctness from MongoDB
      let isCorrect = payload.isCorrect ?? false;
      if (quizId) {
        try {
          const quiz = await Quiz.findById(quizId).lean();
          if (quiz) {
            const question = quiz.questions.find(
              (q) => q._id.toString() === questionId || q.id === questionId
            );
            if (question) {
              const correctChoice = question.choices.find((c) => c.isCorrect);
              isCorrect =
                correctChoice?._id.toString() === choiceId ||
                correctChoice?.id === choiceId;
            }
          }
        } catch { /* fallback to client flag */ }
      }

      // Persist answer to Redis
      const answer = await redis.recordAnswer(sessionId, {
        studentId, questionId, choiceId, choiceText,
        isCorrect, responseTime: responseTime || 0,
      });

      const stats = await redis.calcStats(sessionId);

      const room = teacherRoom(sessionId);
      console.log(`[submit_answer] Broadcasting answer_update to room: ${room}`);
      io.to(room).emit(SERVER_EVENTS.ANSWER_UPDATE, { answer, stats });
      socket.emit(SERVER_EVENTS.ANSWER_UPDATE, { answer });

    } catch (err) {
      console.error("[submit_answer] error:", err);
      socket.emit(SERVER_EVENTS.ERROR, { message: "Internal error submitting answer" });
    }
  });

  // ── GET_SESSION_STATE (teacher refresh/reconnect) ────────────────────────────
  /**
   * Teacher emits this after a page refresh to restore the monitoring dashboard.
   * Loads full session snapshot from Redis and replies directly to the requesting socket.
   */
  socket.on(CLIENT_EVENTS.GET_SESSION_STATE, async (payload) => {
    try {
      const { sessionId, quizId } = payload || {};
      if (!sessionId) {
        return socket.emit(SERVER_EVENTS.ERROR, { message: "Missing sessionId" });
      }
      console.log(`[get_session_state] Restoring state for sessionId=${sessionId}`);

      const snapshot = await redis.getFullSessionState(sessionId);
      if (!snapshot) {
        // Session not found — create a fresh one so teacher can start fresh
        await redis.getOrCreateSession(sessionId, quizId || "");
        return socket.emit(SERVER_EVENTS.SESSION_STATE, {
          sessionId,
          isPaused: false,
          startedAt: Date.now(),
          students: [],
          answers: [],
          stats: { totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0, totalAnswers: 0, correctAnswers: 0, questionStats: {} },
        });
      }

      socket.emit(SERVER_EVENTS.SESSION_STATE, snapshot);

    } catch (err) {
      console.error("[get_session_state] error:", err);
      socket.emit(SERVER_EVENTS.ERROR, { message: "Failed to restore session state" });
    }
  });

  // ── CONTROL_SESSION (teacher only) ──────────────────────────────────────────
  socket.on(CLIENT_EVENTS.CONTROL_SESSION, async (payload) => {
    try {
      const { sessionId, action } = payload || {};
      if (!sessionId || !action) {
        return socket.emit(SERVER_EVENTS.ERROR, { message: "Missing sessionId or action" });
      }

      if (action === "pause")  await redis.setSessionPaused(sessionId, true);
      if (action === "resume") await redis.setSessionPaused(sessionId, false);
      
      if (action === "end") {
        const snapshot = await redis.getFullSessionState(sessionId);
        const actualQuizId = snapshot?.quizId || sessionId.replace("quiz-session-", "");
        
        if (snapshot && actualQuizId) {
          const QuizSessionResult = require("../models/QuizSessionResult.model");
          
          const studentScores = snapshot.students.map(st => {
            const studentAnswers = snapshot.answers.filter(a => a.studentId === st.studentId);
            const score = studentAnswers.filter(a => a.isCorrect).length;
            return {
              studentId: st.studentId,
              name: st.name,
              score,
              joinedAt: st.joinedAt
            };
          });

          await QuizSessionResult.create({
            sessionId,
            quizId: actualQuizId,
            startedAt: new Date(snapshot.startedAt || Date.now()),
            endedAt: new Date(),
            stats: {
              totalStudents: snapshot.stats?.totalStudents || 0,
              averageScore: snapshot.stats?.averageScore || 0,
              completionPercentage: snapshot.stats?.completionPercentage || 0,
            },
            students: studentScores,
            answers: snapshot.answers,
          }).catch(err => console.error("[control_session] Archive error:", err));
        }
      }

      // Broadcast control state to all in session
      io.to(sessionRoom(sessionId)).emit(SERVER_EVENTS.SESSION_CONTROL, { action });

    } catch (err) {
      console.error("[control_session] error:", err);
      socket.emit(SERVER_EVENTS.ERROR, { message: "Internal error controlling session" });
    }
  });

  // ── DISCONNECT ───────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    const { sessionId, studentId, role } = socket.data || {};
    cleanupSocket(socket.id);

    if (sessionId && studentId && role === "student") {
      try {
        const student = await redis.setStudentOffline(sessionId, studentId);
        const stats   = await redis.calcStats(sessionId);
        if (student) {
          io.to(teacherRoom(sessionId)).emit(SERVER_EVENTS.STUDENT_LEFT, { student, stats });
        }
      } catch (err) {
        console.error("[disconnect] Redis error:", err);
      }
    }
    console.log(`[socket] disconnected: ${socket.id}`);
  });
};
