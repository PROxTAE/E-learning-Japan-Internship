const express = require("express");
const router  = express.Router();
const redis   = require("../redis/redisService");
const QuizSessionResult = require("../models/QuizSessionResult.model");
const Quiz = require("../models/Quiz.model");

// Helper to escape values for CSV
function csvEscape(val) {
  if (val === undefined || val === null) return '""';
  let str = String(val);
  // Escape double quotes by doubling them
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

// Helper to resolve/normalize sessionId (supports short accessCode and full sessionId)
async function resolveSessionId(param) {
  if (!param) return param;

  let code = param;
  if (code.startsWith("quiz-session-")) {
    code = code.replace("quiz-session-", "");
  }

  // Look up Quiz by accessCode (case-insensitive)
  try {
    const quizObj = await Quiz.findOne({ accessCode: code.toUpperCase() }).lean();
    if (quizObj) {
      return `quiz-session-${quizObj._id.toString()}`;
    }
  } catch (err) {
    console.error("[resolveSessionId] Error querying Quiz:", err);
  }

  // Fallback: prepend quiz-session- if it doesn't have it
  if (!param.startsWith("quiz-session-")) {
    return `quiz-session-${param}`;
  }
  return param;
}

/**
 * GET /api/monitoring/quiz/:quizId/sessions
 * Returns a list of past completed sessions for a specific quizId.
 * Declared before /:sessionId to avoid conflicts.
 */
router.get("/quiz/:quizId/sessions", async (req, res) => {
  try {
    const { quizId } = req.params;
    const sessions = await QuizSessionResult.find({ quizId })
      .select("sessionId startedAt endedAt stats students")
      .sort({ endedAt: -1 })
      .lean();

    const formattedSessions = sessions.map(s => ({
      id: s._id.toString(),
      sessionId: s.sessionId,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      stats: s.stats,
      studentCount: s.students ? s.students.length : 0
    }));

    res.json({ success: true, data: formattedSessions });
  } catch (err) {
    console.error("[monitoring REST] List sessions error:", err);
    res.status(500).json({ success: false, message: "Failed to list sessions" });
  }
});

/**
 * GET /api/monitoring/sessions/:sessionId/export
 * Exports a quiz session's results to CSV.
 * Supports both live active session (Redis) and completed session (MongoDB).
 */
router.get("/sessions/:sessionId/export", async (req, res) => {
  try {
    const sessionId = await resolveSessionId(req.params.sessionId);

    let session = await QuizSessionResult.findOne({ sessionId }).lean();
    let isLive = false;

    // If not in MongoDB, try reading live state from Redis
    if (!session) {
      const snapshot = await redis.getFullSessionState(sessionId);
      if (snapshot && snapshot.startedAt) {
        isLive = true;

        // Compute scores like socket end_session does
        const studentScores = (snapshot.students || []).map(st => {
          const studentAnswers = (snapshot.answers || []).filter(a => a.studentId === st.studentId);
          const score = studentAnswers.filter(a => a.isCorrect).length;
          return {
            studentId: st.studentId,
            name: st.name,
            score,
            joinedAt: st.joinedAt
          };
        });

        session = {
          sessionId,
          quizId: snapshot.quizId || sessionId.replace("quiz-session-", ""),
          startedAt: new Date(snapshot.startedAt),
          endedAt: null,
          stats: {
            totalStudents: snapshot.stats?.totalStudents || 0,
            averageScore: snapshot.stats?.averageScore || 0,
            completionPercentage: snapshot.stats?.completionPercentage || 0,
          },
          students: studentScores,
          answers: (snapshot.answers || []).map(a => ({
            studentId: a.studentId,
            questionId: a.questionId,
            choiceId: a.choiceId,
            choiceText: a.choiceText,
            isCorrect: a.isCorrect,
            responseTime: a.responseTime,
            submittedAt: a.submittedAt || new Date()
          }))
        };
      }
    }

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Fetch quiz metadata to map question texts
    const quiz = await Quiz.findById(session.quizId).lean();
    const quizTitle = quiz ? quiz.title : "Unknown Quiz";
    const questions = quiz ? quiz.questions : [];

    const csvRows = [];
    
    // 1. Metadata Block
    csvRows.push([csvEscape("Quiz Session Assessment Report")]);
    csvRows.push([csvEscape("Quiz Title:"), csvEscape(quizTitle)]);
    csvRows.push([csvEscape("Session Code:"), csvEscape(sessionId.replace("quiz-session-", ""))]);
    csvRows.push([csvEscape("Status:"), csvEscape(isLive ? "Live (In Progress)" : "Completed")]);
    csvRows.push([csvEscape("Started At:"), csvEscape(session.startedAt ? new Date(session.startedAt).toLocaleString("th-TH") : "-")]);
    csvRows.push([csvEscape("Ended At:"), csvEscape(session.endedAt ? new Date(session.endedAt).toLocaleString("th-TH") : "-")]);
    csvRows.push([csvEscape("Total Students:"), csvEscape(session.stats?.totalStudents || 0)]);
    csvRows.push([csvEscape("Average Score:"), csvEscape(`${session.stats?.averageScore || 0}%`)]);
    csvRows.push([csvEscape("Completion Rate:"), csvEscape(`${session.stats?.completionPercentage || 0}%`)]);
    csvRows.push([]); // Empty row
    
    // 2. Student Summary
    csvRows.push([csvEscape("STUDENT PERFORMANCE SUMMARY")]);
    csvRows.push([
      csvEscape("Student Name"),
      csvEscape("Student ID"),
      csvEscape("Score"),
      csvEscape("Max Score"),
      csvEscape("Percentage"),
      csvEscape("Joined At")
    ]);

    const maxScore = questions.length;
    for (const student of (session.students || [])) {
      let rawScore = student.score;
      let percentage = 0;
      if (rawScore > maxScore && maxScore > 0) {
        // It's a percentage (seeded mock data)
        percentage = rawScore;
        rawScore = Math.round((percentage / 100) * maxScore);
      } else {
        // It's a raw score (live data)
        percentage = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
      }

      csvRows.push([
        csvEscape(student.name),
        csvEscape(student.studentId || "-"),
        csvEscape(rawScore),
        csvEscape(maxScore),
        csvEscape(`${percentage}%`),
        csvEscape(student.joinedAt ? new Date(student.joinedAt).toLocaleString("th-TH") : "-")
      ]);
    }
    csvRows.push([]); // Empty row

    // 3. Question Breakdown
    csvRows.push([csvEscape("DETAILED STUDENT ANSWERS (CORRECTNESS / CHOICE TEXT / RESPONSE TIME)")]);
    const detailedHeaders = [csvEscape("Student Name")];
    for (let i = 0; i < questions.length; i++) {
      const qText = questions[i].text || `Question ${i + 1}`;
      detailedHeaders.push(csvEscape(`Q${i + 1}: ${qText}`));
    }
    csvRows.push(detailedHeaders);

    for (const student of (session.students || [])) {
      const row = [csvEscape(student.name)];
      for (const question of questions) {
        const qIdStr = question._id ? question._id.toString() : question.id;
        const ans = (session.answers || []).find(a => 
          a.studentId === student.studentId && 
          (a.questionId === qIdStr || a.questionId === question.id)
        );

        if (ans) {
          const accuracyText = ans.isCorrect ? "Correct" : "Incorrect";
          const responseTimeText = ans.responseTime !== undefined ? `${ans.responseTime}s` : "0s";
          const text = `${accuracyText} (${ans.choiceText || "-"} / ${responseTimeText})`;
          row.push(csvEscape(text));
        } else {
          row.push(csvEscape("Unanswered"));
        }
      }
      row.push();
      csvRows.push(row);
    }

    const csvContent = csvRows.map(r => r.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="quiz-report-${sessionId.replace("quiz-session-", "")}.csv"`);
    
    // Write UTF-8 Byte Order Mark (BOM) so Excel respects Thai character encoding
    res.write(Buffer.from("\uFEFF"));
    res.write(csvContent);
    res.end();

  } catch (err) {
    console.error("[monitoring REST] Export CSV error:", err);
    res.status(500).json({ success: false, message: "Failed to export report" });
  }
});


/**
 * GET /api/monitoring/:sessionId
 * Returns the current live session state for teacher dashboard init.
 * Works in both Redis mode and in-memory fallback mode.
 */
router.get("/:sessionId", async (req, res) => {
  try {
    const sessionId = await resolveSessionId(req.params.sessionId);

    // getFullSessionState reads from Redis → falls back to in-memory automatically
    const snapshot = await redis.getFullSessionState(sessionId);

    if (!snapshot) {
      // Session doesn't exist yet — return empty (not an error)
      return res.json({
        success: true,
        data: {
          sessionId,
          students: [],
          answers:  [],
          stats: { totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0, totalAnswers: 0, correctAnswers: 0, questionStats: {} },
        },
      });
    }

    res.json({ success: true, data: snapshot });
  } catch (err) {
    console.error("[monitoring REST] Error:", err);
    res.status(500).json({ success: false, message: "Failed to load session state" });
  }
});

/**
 * GET /api/monitoring/:sessionId/stats
 */
router.get("/:sessionId/stats", async (req, res) => {
  try {
    const sessionId = await resolveSessionId(req.params.sessionId);
    const stats = await redis.calcStats(sessionId) || {
      totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0,
    };
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
