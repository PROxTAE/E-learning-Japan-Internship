// ─────────────────────────────────────────────
//  quiz.controller.js — CRUD handlers
// ─────────────────────────────────────────────
const Quiz = require("../models/Quiz.model");
const mongoose = require("mongoose");
const fs   = require("fs");
const path = require("path");

// ── helpers ─────────────────────────────────────────────────────

function ok(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function fail(res, message, status = 400) {
  res.status(status).json({ success: false, message });
}

// ── Generate a unique 6-char alphanumeric access code ────────────
function makeCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateUniqueCode() {
  let code, exists;
  do {
    code = makeCode();
    exists = await Quiz.findOne({ accessCode: code });
  } while (exists);
  return code;
}

// ── List quizzes for the logged-in teacher ───────────────────────────
// GET /api/quizzes?status=published&category=Math&page=1&limit=50
async function listQuizzes(req, res) {
  try {
    const { status, category, page = 1, limit = 50 } = req.query;
    // Scope to the authenticated teacher's quizzes only
    const filter = { createdBy: req.teacher.id };
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-questions"); // exclude heavy questions list for overview

    const total = await Quiz.countDocuments(filter);
    ok(res, { quizzes, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Get single quiz with all questions ─────────────────────────
// GET /api/quizzes/:id
async function getQuiz(req, res) {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.teacher.id });
    if (!quiz) return fail(res, "Quiz not found", 404);
    ok(res, quiz);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Create quiz ─────────────────────────────────────────────────
// POST /api/quizzes
async function createQuiz(req, res) {
  try {
    const { title, description, category, difficulty, durationMinutes, tags, status, hasTimeLimit, showAnswersAfterQuiz, subject, chapter } = req.body;
    if (!title) return fail(res, "title is required");

    const quiz = await Quiz.create({
      title, description, category, difficulty, durationMinutes,
      hasTimeLimit: hasTimeLimit !== undefined ? hasTimeLimit : true,
      showAnswersAfterQuiz: showAnswersAfterQuiz !== undefined ? showAnswersAfterQuiz : true,
      tags: Array.isArray(tags) ? tags : (tags || "").split(",").map(t => t.trim()).filter(Boolean),
      status: status || "draft",
      questions: [],
      subject: subject || "",
      chapter: chapter || "",
      createdBy: req.teacher.id, // ← set to the authenticated teacher
    });
    ok(res, quiz, 201);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Full update (PUT) — replaces quiz metadata + questions ──────
// PUT /api/quizzes/:id
async function updateQuiz(req, res) {
  try {
    const { title, description, category, difficulty, durationMinutes, tags, status, questions, hasTimeLimit, showAnswersAfterQuiz, subject, chapter } = req.body;

    if (questions && Array.isArray(questions)) {
      questions.forEach(q => {
        if (q.id && mongoose.Types.ObjectId.isValid(q.id)) {
          q._id = q.id;
        } else {
          delete q._id;
          delete q.id;
        }
        if (q.choices && Array.isArray(q.choices)) {
          q.choices.forEach(c => {
            if (c.id && mongoose.Types.ObjectId.isValid(c.id)) {
              c._id = c.id;
            } else {
              delete c._id;
              delete c.id;
            }
          });
        }
      });
    }

    const update = {
      ...(title            !== undefined && { title }),
      ...(description      !== undefined && { description }),
      ...(category         !== undefined && { category }),
      ...(difficulty       !== undefined && { difficulty }),
      ...(durationMinutes  !== undefined && { durationMinutes }),
      ...(status           !== undefined && { status }),
      ...(tags             !== undefined && {
        tags: Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim()).filter(Boolean)
      }),
      ...(questions        !== undefined && { questions }),
      ...(hasTimeLimit     !== undefined && { hasTimeLimit }),
      ...(showAnswersAfterQuiz !== undefined && { showAnswersAfterQuiz }),
      ...(subject          !== undefined && { subject }),
      ...(chapter          !== undefined && { chapter }),
    };

    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.teacher.id },
      { $set: update },
      { returnDocument: "after", runValidators: true }
    );
    if (!quiz) return fail(res, "Quiz not found", 404);
    ok(res, quiz);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Generate (or regenerate) an access code ────────────────────
// POST /api/quizzes/:id/generate-code
async function generateCode(req, res) {
  try {
    const code = await generateUniqueCode();
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.teacher.id },
      { $set: { accessCode: code, status: "published" } },
      { returnDocument: "after" }
    );
    if (!quiz) return fail(res, "Quiz not found", 404);
    ok(res, quiz);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Public: get quiz by access code (for students) ───────────────
// GET /api/play/:code
// Returns quiz WITHOUT isCorrect fields — students must not see answers
async function getQuizByCode(req, res) {
  try {
    const code = req.params.code.toUpperCase().trim();
    console.log(`🔍 [STUDENT] Fetching quiz by code: "${code}" (from ${req.ip})`);
    
    const quiz = await Quiz.findOne({ accessCode: code, status: "published" });
    if (!quiz) {
      console.warn(`❌ [STUDENT] Quiz not found or not published for code: "${code}"`);
      return fail(res, "Quiz not found or not published", 404);
    }

    console.log(`✅ [STUDENT] Quiz found: "${quiz.title}" (ID: ${quiz._id})`);
    // Strip correct-answer info before sending to student
    const safeQuiz = quiz.toJSON();
    safeQuiz.questions = safeQuiz.questions.map((q) => ({
      ...q,
      choices: q.choices.map(({ isCorrect: _removed, ...c }) => c),
    }));

    // Attach the current round's session token (if a live session exists) so
    // the student can scope their saved progress to this round. When the
    // teacher ends a session the token rotates, invalidating stale state.
    try {
      const redis = require("../redis/redisService");
      const meta  = await redis.getSession(`quiz-session-${quiz._id}`);
      safeQuiz.sessionToken = meta?.sessionToken || "";
    } catch (_) {
      safeQuiz.sessionToken = "";
    }

    ok(res, safeQuiz);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Partial update (PATCH) — e.g. status only ──────────────────
// PATCH /api/quizzes/:id/status
async function setStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ["draft", "published", "archived"];
    if (!allowed.includes(status)) return fail(res, `status must be one of: ${allowed.join(", ")}`);

    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.teacher.id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    if (!quiz) return fail(res, "Quiz not found", 404);
    ok(res, quiz);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Delete quiz ─────────────────────────────────────────────────
// DELETE /api/quizzes/:id
async function deleteQuiz(req, res) {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.teacher.id });
    if (!quiz) return fail(res, "Quiz not found", 404);
    ok(res, { id: req.params.id });
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Upload image (for question or choice) ───────────────────────
// POST /api/images/upload  (multipart/form-data, field: "image")
// Returns: { url: "/uploads/filename.jpg" }
async function uploadImage(req, res) {
  try {
    if (!req.file) return fail(res, "No image file provided");
    const url = `/uploads/${req.file.filename}`;
    ok(res, { url }, 201);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── Delete image ────────────────────────────────────────────────
// DELETE /api/images/:filename
async function deleteImage(req, res) {
  try {
    const { UPLOAD_DIR } = require("../middleware/upload.middleware");
    const filepath = path.join(UPLOAD_DIR, req.params.filename);

    if (!fs.existsSync(filepath)) return fail(res, "File not found", 404);
    fs.unlinkSync(filepath);
    ok(res, { deleted: req.params.filename });
  } catch (err) {
    fail(res, err.message, 500);
  }
}

module.exports = {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  setStatus,
  generateCode,
  getQuizByCode,
  deleteQuiz,
  uploadImage,
  deleteImage,
};
