/**
 * Quiz socket handlers — join, answer, control, disconnect
 */

const {
  CLIENT_EVENTS, SERVER_EVENTS,
  teacherRoom, sessionRoom,
} = require("./types");

const session = require("./sessionManager");
const { validateJoinPayload, validateAnswerPayload, cleanupSocket } = require("./socketMiddleware");
const Quiz = require("../models/Quiz.model");

module.exports = function registerHandlers(io, socket) {
  // ── join_quiz ──────────────────────────────────────────────────
  socket.on(CLIENT_EVENTS.JOIN_QUIZ, async (payload) => {
    try {
      const error = validateJoinPayload(payload);
      if (error) return socket.emit(SERVER_EVENTS.ERROR, { message: error });

      const { sessionId, quizId, studentId, name, avatar, role } = payload;
      console.log(`[join_quiz] role=${role} sessionId=${sessionId} studentId=${studentId || 'N/A'}`);

      // Join room
      socket.join(sessionRoom(sessionId));
      socket.data = { sessionId, studentId, role };

      if (role === "teacher") {
        socket.join(teacherRoom(sessionId));
        console.log(`[join_quiz] Teacher joined teacherRoom: ${teacherRoom(sessionId)}`);
        const students = session.getStudents(sessionId);
        const answers  = session.getAnswers(sessionId);
        const stats    = session.calcStats(sessionId);
        const quiz     = quizId ? await Quiz.findById(quizId).lean().catch(() => null) : null;

        return socket.emit(SERVER_EVENTS.SESSION_JOINED, {
          role: "teacher",
          sessionId,
          students,
          answers,
          stats,
          quiz,
        });
      }

      // ── Student joins ─────────────────────────────────────────
      const student = session.upsertStudent(sessionId, { studentId, name, avatar, socketId: socket.id });
      const stats   = session.calcStats(sessionId);
      console.log(`[join_quiz] Student joined. Broadcasting to: ${teacherRoom(sessionId)}`);

      socket.emit(SERVER_EVENTS.SESSION_JOINED, { role: "student", sessionId, student });
      io.to(teacherRoom(sessionId)).emit(SERVER_EVENTS.STUDENT_JOINED, { student, stats });

    } catch (err) {
      console.error("[join_quiz] error:", err);
      socket.emit(SERVER_EVENTS.ERROR, { message: "Internal error joining session" });
    }
  });

  // ── submit_answer ──────────────────────────────────────────────
  socket.on(CLIENT_EVENTS.SUBMIT_ANSWER, async (payload) => {
    try {
      const error = validateAnswerPayload(payload);
      if (error) return socket.emit(SERVER_EVENTS.ERROR, { message: error });

      const { sessionId, studentId, questionId, choiceId, choiceText, responseTime, quizId } = payload;
      console.log(`[submit_answer] sessionId=${sessionId} student=${studentId} question=${questionId} choice=${choiceId}`);

      const s = session.getSession(sessionId);
      if (s?.isPaused) return socket.emit(SERVER_EVENTS.ERROR, { message: "Session is paused" });

      let isCorrect = payload.isCorrect ?? false;
      if (quizId) {
        try {
          const quiz = await Quiz.findById(quizId).lean();
          if (quiz) {
            const question = quiz.questions.find(q => q._id.toString() === questionId || q.id === questionId);
            if (question) {
              const correctChoice = question.choices.find(c => c.isCorrect);
              isCorrect = correctChoice?._id.toString() === choiceId || correctChoice?.id === choiceId;
            }
          }
        } catch { /* fallback to client flag */ }
      }

      const answer = session.recordAnswer(sessionId, {
        studentId, questionId, choiceId, choiceText, isCorrect,
        responseTime: responseTime || 0,
      });

      const stats = session.calcStats(sessionId);

      const room = teacherRoom(sessionId);
      console.log(`[submit_answer] Broadcasting answer_update to room: ${room}`);
      io.to(room).emit(SERVER_EVENTS.ANSWER_UPDATE, { answer, stats });
      socket.emit(SERVER_EVENTS.ANSWER_UPDATE, { answer });

    } catch (err) {
      console.error("[submit_answer] error:", err);
      socket.emit(SERVER_EVENTS.ERROR, { message: "Internal error submitting answer" });
    }
  });

  // ── control_session (teacher only) ────────────────────────────
  socket.on(CLIENT_EVENTS.CONTROL_SESSION, (payload) => {
    try {
      const { sessionId, action } = payload || {};
      if (!sessionId || !action) return socket.emit(SERVER_EVENTS.ERROR, { message: "Missing sessionId or action" });

      if (action === "pause") session.setSessionPaused(sessionId, true);
      else if (action === "resume") session.setSessionPaused(sessionId, false);

      // Broadcast control state to all in session
      io.to(sessionRoom(sessionId)).emit(SERVER_EVENTS.SESSION_CONTROL, { action });
    } catch (err) {
      console.error("[control_session] error:", err);
    }
  });

  // ── disconnect ─────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const { sessionId, studentId, role } = socket.data || {};
    cleanupSocket(socket.id);

    if (sessionId && studentId && role === "student") {
      const student = session.setStudentOffline(sessionId, studentId);
      const stats   = session.calcStats(sessionId);
      if (student) {
        io.to(teacherRoom(sessionId)).emit(SERVER_EVENTS.STUDENT_LEFT, { student, stats });
      }
    }
    console.log(`[socket] disconnected: ${socket.id}`);
  });
};
