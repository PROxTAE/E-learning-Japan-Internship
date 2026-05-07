/**
 * monitoring.routes.js — REST endpoints for initial dashboard load
 */
const express = require("express");
const router  = express.Router();
const session = require("../socket/sessionManager");

/**
 * GET /api/monitoring/:sessionId
 * Returns the current live session state for teacher dashboard init.
 */
router.get("/:sessionId", (req, res) => {
  // Accept both quizId (MongoDB ObjectId) and full sessionId
  let { sessionId } = req.params;
  if (!sessionId.startsWith("quiz-session-")) {
    sessionId = `quiz-session-${sessionId}`;
  }

  const students = session.getStudents(sessionId);
  const answers  = session.getAnswers(sessionId);
  const stats    = session.calcStats(sessionId) || {
    totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0
  };

  res.json({
    success: true,
    data: { sessionId, students, answers, stats }
  });
});

/**
 * GET /api/monitoring/:sessionId/stats
 * Returns aggregated stats only.
 */
router.get("/:sessionId/stats", (req, res) => {
  const stats = session.calcStats(req.params.sessionId) || {
    totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0
  };
  res.json({ success: true, data: stats });
});

module.exports = router;
