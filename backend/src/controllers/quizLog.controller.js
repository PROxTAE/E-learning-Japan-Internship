// ─────────────────────────────────────────────────────────────────
//  quizLog.controller.js
//
//  Controllers for the /api/quiz-logs endpoint:
//    POST /api/quiz-logs        — Student submits full interaction log
//    GET  /api/quiz-logs        — List logs (filter by quizId / studentId)
//    GET  /api/quiz-logs/:logId — Single log detail
// ─────────────────────────────────────────────────────────────────

const QuizInteractionLog = require("../models/QuizInteractionLog.model");
const Quiz = require("../models/Quiz.model");

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

    // Fetch quiz to check correct answers and populate correct_answers/is_correct
    let quiz = null;
    try {
      quiz = await Quiz.findById(session_metadata.quiz_id).lean();
    } catch (err) {
      console.error("[quizLog] Error fetching quiz:", err);
    }

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: `Quiz with ID ${session_metadata.quiz_id} not found`,
      });
    }

    let totalScore = 0;
    const validatedAnswerLogs = answer_logs.map((ansLog) => {
      // Find the corresponding question in the quiz
      const question = quiz.questions.find((q) => {
        const qIdStr = q._id ? q._id.toString() : q.id;
        return qIdStr === ansLog.question_id || q.id === ansLog.question_id;
      });

      if (!question) {
        // If question not found in quiz, keep as is
        return ansLog;
      }

      // Find correct choices
      const correctChoices = question.choices.filter((c) => c.isCorrect);
      const correctIds = correctChoices.map((c) => (c._id ? c._id.toString() : c.id));

      // Verify student's final answer
      const finalAnswers = ansLog.final_answer || [];

      // Check correctness: every final answer must be correct, and every correct answer must be selected.
      let isCorrect = false;
      if (finalAnswers.length > 0 && correctIds.length > 0) {
        isCorrect = finalAnswers.every(ans => correctIds.includes(ans)) && 
                    correctIds.every(corr => finalAnswers.includes(corr));
      }

      if (isCorrect) {
        totalScore++;
      }

      // Extract difficulty and tags from the root quiz
      const qDifficulty = quiz.difficulty ? (quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)) : "Medium";
      const qTags = quiz.tags || [];

      return {
        ...ansLog,
        difficulty: qDifficulty,
        tags: qTags,
        correct_answers: correctIds,
        is_correct: isCorrect
      };
    });

    // Compute confusion rate if not provided
    const confusedCount = validatedAnswerLogs.filter((q) => q.is_confused).length;
    const computedSummary = {
      total_score:             totalScore,
      full_score:              quiz.questions.length,
      completion_time_seconds: summary?.completion_time_seconds ?? 0,
      average_confusion_rate:
        summary?.average_confusion_rate ??
        (validatedAnswerLogs.length > 0 ? confusedCount / validatedAnswerLogs.length : 0),
    };

    const log = await QuizInteractionLog.create({
      session_metadata,
      answer_logs: validatedAnswerLogs,
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
