// ─────────────────────────────────────────────────────────────────
//  quizLog.controller.js
//
//  Controllers for the /api/quiz-logs endpoint:
//    POST /api/quiz-logs        — Student submits full interaction log
//    GET  /api/quiz-logs        — List logs (filter by quizId / studentId)
//    GET  /api/quiz-logs/:logId — Single log detail
// ─────────────────────────────────────────────────────────────────

const QuizInteractionLog = require("../models/QuizInteractionLog.model");

// ── POST /api/quiz-logs ────────────────────────────────────────────
/**
 * Student submits a full quiz interaction log after finishing a quiz.
 * Body: { session_metadata, answer_logs, summary }
 */
async function submitLog(req, res) {
  try {
    const { session_metadata, answer_logs, summary } = req.body;

    // Basic validation
    if (!session_metadata?.student_id || !session_metadata?.quiz_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: session_metadata.student_id and quiz_id",
      });
    }
    if (!Array.isArray(answer_logs) || answer_logs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "answer_logs must be a non-empty array",
      });
    }

    // Compute confusion rate if not provided
    const confusedCount = answer_logs.filter((q) => q.is_confused).length;
    const computedSummary = {
      total_score:             summary?.total_score ?? 0,
      full_score:              summary?.full_score  ?? answer_logs.length,
      completion_time_seconds: summary?.completion_time_seconds ?? 0,
      average_confusion_rate:
        summary?.average_confusion_rate ??
        (answer_logs.length > 0 ? confusedCount / answer_logs.length : 0),
    };

    const log = await QuizInteractionLog.create({
      session_metadata,
      answer_logs,
      summary: computedSummary,
    });

    return res.status(201).json({
      success: true,
      data: { logId: log._id, createdAt: log.createdAt },
      message: "Quiz interaction log saved successfully",
    });
  } catch (err) {
    console.error("[quizLog] submitLog error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/quiz-logs ─────────────────────────────────────────────
/**
 * List logs. Supports query params:
 *   ?quizId=xxx          — filter by quiz
 *   ?studentId=xxx       — filter by student
 *   ?page=1&limit=20     — pagination
 */
async function listLogs(req, res) {
  try {
    const { quizId, studentId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (quizId)    filter["session_metadata.quiz_id"]    = quizId;
    if (studentId) filter["session_metadata.student_id"] = studentId;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await QuizInteractionLog.countDocuments(filter);
    const logs  = await QuizInteractionLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      // Only return metadata + summary in list view (not full interaction detail)
      .select("session_metadata summary createdAt")
      .lean();

    return res.json({
      success: true,
      data: { logs, total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error("[quizLog] listLogs error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/quiz-logs/:logId ──────────────────────────────────────
/**
 * Full detail of a single student log (including all interactions).
 */
async function getLog(req, res) {
  try {
    const { logId } = req.params;
    const log = await QuizInteractionLog.findById(logId).lean();
    if (!log) {
      return res.status(404).json({ success: false, message: "Log not found" });
    }
    return res.json({ success: true, data: log });
  } catch (err) {
    console.error("[quizLog] getLog error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/quiz-logs/student/:studentId/quiz/:quizId ────────────
/**
 * Get the most recent log for a specific student + quiz combination.
 * Useful for the result screen AI analysis button.
 */
async function getLatestStudentLog(req, res) {
  try {
    const { studentId, quizId } = req.params;
    const log = await QuizInteractionLog.findOne({
      "session_metadata.student_id": studentId,
      "session_metadata.quiz_id":    quizId,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!log) {
      return res.status(404).json({ success: false, message: "No log found for this student and quiz" });
    }
    return res.json({ success: true, data: log });
  } catch (err) {
    console.error("[quizLog] getLatestStudentLog error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { submitLog, listLogs, getLog, getLatestStudentLog };
