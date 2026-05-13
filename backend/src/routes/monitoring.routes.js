/**
 * monitoring.routes.js — REST endpoint for initial teacher dashboard load
 *
 * Reads from redisService (which falls back to in-memory if Redis is down).
 * This ensures the teacher gets real session data on page refresh,
 * not an empty result from the old sessionManager.
 */
const express = require("express");
const router  = express.Router();
const redis   = require("../redis/redisService");

/**
 * GET /api/monitoring/:sessionId
 * Returns the current live session state for teacher dashboard init.
 * Works in both Redis mode and in-memory fallback mode.
 */
router.get("/:sessionId", async (req, res) => {
  try {
    let { sessionId } = req.params;

    // Accept both short quizId and full sessionId
    if (!sessionId.startsWith("quiz-session-")) {
      sessionId = `quiz-session-${sessionId}`;
    }

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
    const stats = await redis.calcStats(req.params.sessionId) || {
      totalStudents: 0, activeStudents: 0, averageScore: 0, completionPercentage: 0,
    };
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
