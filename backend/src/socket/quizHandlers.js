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
const { validateJoinPayload, validateAnswerPayload, checkEventRateLimit, cleanupSocket } = require("./socketMiddleware");
const Quiz = require("../models/Quiz.model");

module.exports = function registerHandlers(io, socket) {

  // ── Debounced stats broadcast ───────────────────────────────────────────────
  // When 20 students submit answers within 300ms, only ONE stats update is sent
  // to the teacher room instead of 20. Individual answer_update events are still
  // sent immediately — only the heavy stats calculation is batched.
  const _statsBroadcastTimers = registerHandlers._statsBroadcastTimers || (registerHandlers._statsBroadcastTimers = new Map());

  function debouncedStatsBroadcast(sessionId, delayMs = 300) {
    if (_statsBroadcastTimers.has(sessionId)) {
      clearTimeout(_statsBroadcastTimers.get(sessionId));
    }
    _statsBroadcastTimers.set(sessionId, setTimeout(async () => {
      try {
        const stats = await redis.calcStats(sessionId);
        io.to(teacherRoom(sessionId)).emit(SERVER_EVENTS.SESSION_STATS, { stats });
      } catch (err) {
        console.error("[debouncedStatsBroadcast] error:", err);
      }
      _statsBroadcastTimers.delete(sessionId);
    }, delayMs));
  }

  // ── Waiting-room roster broadcast ───────────────────────────────────────────
  // Sends the full student list to EVERYONE in the session (students + teacher)
  // so the waiting room stays in sync as people join, leave, or toggle "ready".
  async function broadcastLobby(sessionId) {
    try {
      const students = await redis.getStudents(sessionId);
      io.to(sessionRoom(sessionId)).emit(SERVER_EVENTS.LOBBY_UPDATE, { students });
    } catch (err) {
      console.error("[broadcastLobby] error:", err);
    }
  }


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

        // Cache quiz in Redis for fast access during submit_answer
        let quiz = null;
        if (quizId) {
          quiz = await redis.cacheQuizForSession(sessionId, quizId);
        }

        const [students, answers, stats] = await Promise.all([
          redis.getStudents(sessionId),
          redis.getAnswers(sessionId),
          redis.calcStats(sessionId),
        ]);

        socket.emit(SERVER_EVENTS.SESSION_JOINED, {
          role: "teacher",
          sessionId,
          students,
          answers,
          stats,
          quiz,
        });
        // Send the waiting-room roster to the teacher right away
        socket.emit(SERVER_EVENTS.LOBBY_UPDATE, { students });
        return;
      }

      // ── Student ────────────────────────────────────────────────────────────
      // Check if session is locked
      const sessionMeta = await redis.getSession(sessionId);
      if (sessionMeta && sessionMeta.isLocked) {
        return socket.emit(SERVER_EVENTS.ERROR, { message: "ROOM_LOCKED" });
      }

      const student = await redis.upsertStudent(sessionId, {
        studentId, name, avatar, socketId: socket.id,
      });
      const stats = await redis.calcStats(sessionId);

      console.log(`[join_quiz] Student joined. Broadcasting to: ${teacherRoom(sessionId)}`);
      socket.emit(SERVER_EVENTS.SESSION_JOINED, {
        role: "student",
        sessionId,
        student,
        isTeacherLed: sessionMeta?.isTeacherLed,
        currentQuestionIndex: sessionMeta?.currentQuestionIndex,
        timer: sessionMeta?.timer,
        timerActive: sessionMeta?.timerActive,
      });
      io.to(teacherRoom(sessionId)).emit(SERVER_EVENTS.STUDENT_JOINED, { student, stats });

      // Broadcast updated waiting-room roster to everyone in the session
      await broadcastLobby(sessionId);

    } catch (err) {
      console.error("[join_quiz] error:", err);
      socket.emit(SERVER_EVENTS.ERROR, { message: "Internal error joining session" });
    }
  });

  // ── SUBMIT_ANSWER ────────────────────────────────────────────────────────────
  socket.on(CLIENT_EVENTS.SUBMIT_ANSWER, async (payload) => {
    try {
      // Per-event rate limit: max 10 answer submissions per 5 seconds per socket
      const rateLimitError = checkEventRateLimit(socket.id, 10, 5000);
      if (rateLimitError) return socket.emit(SERVER_EVENTS.ERROR, { message: rateLimitError });

      const error = validateAnswerPayload(payload);
      if (error) return socket.emit(SERVER_EVENTS.ERROR, { message: error });

      const { sessionId, studentId, questionId, choiceId, choiceText, responseTime, quizId } = payload;
      console.log(`[submit_answer] sessionId=${sessionId} student=${studentId} question=${questionId} choice=${choiceId}`);

      // Check pause state
      const sessionMeta = await redis.getSession(sessionId);
      if (sessionMeta?.isPaused) {
        return socket.emit(SERVER_EVENTS.ERROR, { message: "Session is paused" });
      }

      // Determine correctness from cached quiz (Redis) instead of MongoDB
      let isCorrect = payload.isCorrect ?? false;
      if (quizId) {
        try {
          const quiz = await redis.getCachedQuiz(sessionId, quizId);
          if (quiz) {
            const question = quiz.questions.find(
              (q) => (q._id && q._id.toString() === questionId) || q.id === questionId
            );
            if (question) {
              const correctChoice = question.choices.find((c) => c.isCorrect);
              isCorrect =
                (correctChoice?._id && correctChoice._id.toString() === choiceId) ||
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

      // Send individual answer to teacher immediately (lightweight)
      const room = teacherRoom(sessionId);
      io.to(room).emit(SERVER_EVENTS.ANSWER_UPDATE, { answer });
      socket.emit(SERVER_EVENTS.ANSWER_UPDATE, { answer });

      // Debounce the heavy stats recalculation — batches rapid submissions
      debouncedStatsBroadcast(sessionId);

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

  // ── SET_READY (student waiting room) ─────────────────────────────────────────
  socket.on(CLIENT_EVENTS.SET_READY, async (payload) => {
    try {
      const { sessionId, studentId, isReady } = payload || {};
      if (!sessionId || !studentId) {
        return socket.emit(SERVER_EVENTS.ERROR, { message: "Missing sessionId or studentId" });
      }
      await redis.setStudentReady(sessionId, studentId, !!isReady);
      await broadcastLobby(sessionId);
    } catch (err) {
      console.error("[set_ready] error:", err);
      socket.emit(SERVER_EVENTS.ERROR, { message: "Internal error updating ready state" });
    }
  });

  // ── LEAVE_QUIZ (student leaves the waiting room) ─────────────────────────────
  // Permanently removes the student record so changing name / re-joining doesn't
  // leave a stale "disconnected" row on the teacher's monitoring grid.
  socket.on(CLIENT_EVENTS.LEAVE_QUIZ, async (payload) => {
    try {
      const { sessionId, studentId } = payload || {};
      if (!sessionId || !studentId) {
        return socket.emit(SERVER_EVENTS.ERROR, { message: "Missing sessionId or studentId" });
      }
      const removed = await redis.removeStudent(sessionId, studentId);
      const stats   = await redis.calcStats(sessionId);
      if (removed) {
        io.to(teacherRoom(sessionId)).emit(SERVER_EVENTS.STUDENT_REMOVED, { studentId, stats });
      }
      await broadcastLobby(sessionId);
      // Forget this socket's identity so the disconnect handler won't re-mark offline
      socket.data = {};
    } catch (err) {
      console.error("[leave_quiz] error:", err);
    }
  });

  // ── GET_LOBBY (refresh roster on demand) ─────────────────────────────────────
  socket.on(CLIENT_EVENTS.GET_LOBBY, async (payload) => {
    try {
      const { sessionId } = payload || {};
      if (!sessionId) return socket.emit(SERVER_EVENTS.ERROR, { message: "Missing sessionId" });
      const students = await redis.getStudents(sessionId);
      socket.emit(SERVER_EVENTS.LOBBY_UPDATE, { students });
    } catch (err) {
      console.error("[get_lobby] error:", err);
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
      if (action === "lock")   await redis.setSessionLocked(sessionId, true);
      if (action === "unlock") await redis.setSessionLocked(sessionId, false);
      
      if (action === "teacher_led") {
        await redis.setSessionTeacherLed(sessionId, !!payload.isTeacherLed);
      }
      
      if (action === "set_question_index") {
        await redis.setSessionQuestionIndex(sessionId, Number(payload.index || 0));
      }
      
      if (action === "set_timer") {
        await redis.setSessionTimer(sessionId, Number(payload.timer || 0), !!payload.timerActive);
      }

      if (action === "reset_student") {
        const { studentId } = payload;
        if (studentId) {
          await redis.resetStudentAnswers(sessionId, studentId);
          // Emit updated state to teacher room so stats/students list is immediately refreshed
          const [students, stats] = await Promise.all([
            redis.getStudents(sessionId),
            redis.calcStats(sessionId),
          ]);
          io.to(teacherRoom(sessionId)).emit(SERVER_EVENTS.SESSION_STATE, {
            sessionId,
            students,
            stats,
          });
        }
      }

      if (action === "regenerate_code") {
        const snapshot = await redis.getFullSessionState(sessionId);
        const quizId = snapshot?.quizId || sessionId.replace("quiz-session-", "");
        if (quizId) {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let newCode, exists;
          do {
            newCode = "";
            for (let i = 0; i < 6; i++) {
              newCode += chars[Math.floor(Math.random() * chars.length)];
            }
            exists = await Quiz.findOne({ accessCode: newCode });
          } while (exists);

          await Quiz.findByIdAndUpdate(quizId, { accessCode: newCode });
          payload.accessCode = newCode;
        }
      }
      
      if (action === "end") {
        // Clean up debounce timer for this session
        if (_statsBroadcastTimers.has(sessionId)) {
          clearTimeout(_statsBroadcastTimers.get(sessionId));
          _statsBroadcastTimers.delete(sessionId);
        }

        const snapshot = await redis.getFullSessionState(sessionId);
        const actualQuizId = snapshot?.quizId || sessionId.replace("quiz-session-", "");
        const sessionLabel = payload.sessionLabel || "";

        if (snapshot && actualQuizId) {
          const QuizSessionResult = require("../models/QuizSessionResult.model");

          // Use cached quiz first, fallback to MongoDB
          let quizQuestions = [];
          try {
            const quizDoc = await redis.getCachedQuiz(sessionId, actualQuizId);
            quizQuestions = quizDoc?.questions || [];
          } catch (_) { /* ignore */ }
          const totalQuestions = quizQuestions.length;

          const studentScores = snapshot.students.map(st => {
            const studentAnswers = snapshot.answers.filter(a => a.studentId === st.studentId);
            const correctCount   = studentAnswers.filter(a => a.isCorrect).length;
            return {
              studentId:    st.studentId,
              name:         st.name,
              score:        correctCount,
              scorePercent: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
              progress:     totalQuestions > 0 ? Math.round((studentAnswers.length / totalQuestions) * 100) : 0,
              joinedAt:     st.joinedAt,
            };
          });

          const totalStudents  = studentScores.length;
          const totalAnswers   = snapshot.answers.length;
          const correctAnswers = snapshot.answers.filter(a => a.isCorrect).length;
          const avgScore = totalStudents > 0
            ? Math.round(studentScores.reduce((s, st) => s + st.scorePercent, 0) / totalStudents) : 0;
          const completed    = studentScores.filter(st => st.progress === 100).length;
          const completionPct = totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0;

          const questionStats = quizQuestions.map((q, idx) => {
            const qId      = q._id.toString();
            const qAnswers = snapshot.answers.filter(a => a.questionId === qId);
            const correctCount = qAnswers.filter(a => a.isCorrect).length;
            const totalTime    = qAnswers.reduce((s, a) => s + (a.responseTime || 0), 0);
            const confusionCount = qAnswers.filter(a => a.confusionLevel && a.confusionLevel !== "none").length;
            const choiceMap = {};
            qAnswers.forEach(a => {
              if (a.finalAnswer) {
                if (!choiceMap[a.finalAnswer]) choiceMap[a.finalAnswer] = { choiceId: a.finalAnswer, choiceText: a.finalAnswerText || "", count: 0 };
                choiceMap[a.finalAnswer].count++;
              }
            });
            return {
              questionId:      qId,
              questionText:    q.text || `Question ${idx + 1}`,
              order:           q.order ?? idx,
              answerCount:     qAnswers.length,
              correctCount,
              correctPercent:  qAnswers.length > 0 ? Math.round((correctCount / qAnswers.length) * 100) : 0,
              avgResponseTime: qAnswers.length > 0 ? Math.round(totalTime / qAnswers.length) : 0,
              confusionCount,
              choices:         Object.values(choiceMap),
            };
          });

          const enrichedAnswers = snapshot.answers.map(a => ({
            studentId:     a.studentId,
            questionId:    a.questionId,
            choiceId:      a.finalAnswer || a.choiceId,
            choiceText:    a.finalAnswerText || a.choiceText || "",
            isCorrect:     a.isCorrect,
            responseTime:  a.responseTime || 0,
            confusionLevel: a.confusionLevel || "none",
            changeCount:   Math.max(0, (a.history || []).length - 1),
            submittedAt:   new Date(a.updatedAt || Date.now()),
          }));

          await QuizSessionResult.create({
            sessionId,
            quizId:       actualQuizId,
            sessionLabel,
            startedAt:    new Date(snapshot.startedAt || Date.now()),
            endedAt:      new Date(),
            stats: { totalStudents, averageScore: avgScore, completionPercentage: completionPct, correctAnswers, totalAnswers },
            students:      studentScores,
            answers:       enrichedAnswers,
            questionStats,
          })
            .then(async () => {
              console.log(`[control_session] Session ${sessionId} archived successfully. Cleaning active state.`);
              await redis.deleteSession(sessionId);
            })
            .catch(err => console.error("[control_session] Archive error:", err));
        }
      }

      // Broadcast control state and payload to all in session
      io.to(sessionRoom(sessionId)).emit(SERVER_EVENTS.SESSION_CONTROL, payload);

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
        // Keep the waiting-room roster in sync after a student leaves
        await broadcastLobby(sessionId);
      } catch (err) {
        console.error("[disconnect] Redis error:", err);
      }
    }
    console.log(`[socket] disconnected: ${socket.id}`);
  });
};
