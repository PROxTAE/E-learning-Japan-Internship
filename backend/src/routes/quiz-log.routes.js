// ─────────────────────────────────────────────────────────────────
//  quiz-log.routes.js
//
//  REST endpoints for student quiz interaction logs.
//
//  POST /api/quiz-logs                               — submit a log
//  GET  /api/quiz-logs                               — list (teacher view)
//  GET  /api/quiz-logs/:logId                        — full log detail
//  GET  /api/quiz-logs/student/:studentId/quiz/:quizId — latest log for student
// ─────────────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();

const {
  submitLog,
  listLogs,
  getLog,
  getLatestStudentLog,
} = require("../controllers/quizLog.controller");

// NOTE: More specific routes must be registered BEFORE /:logId
// to prevent Express treating "student" as a logId.
router.get("/student/:studentId/quiz/:quizId", getLatestStudentLog);

router.post("/",        submitLog);
router.get("/",         listLogs);
router.get("/:logId",   getLog);

module.exports = router;
