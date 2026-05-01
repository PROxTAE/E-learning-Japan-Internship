// ─────────────────────────────────────────────
//  quiz.routes.js — Express router
// ─────────────────────────────────────────────
const express = require("express");
const {
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
} = require("../controllers/quiz.controller");
const { upload } = require("../middleware/upload.middleware");

const router = express.Router();

// ── Quiz CRUD ──────────────────────────────────────────────────
router.get(   "/",                        listQuizzes);  // GET    /api/quizzes
router.get(   "/:id",                     getQuiz);      // GET    /api/quizzes/:id
router.post(  "/",                        createQuiz);   // POST   /api/quizzes
router.put(   "/:id",                     updateQuiz);   // PUT    /api/quizzes/:id
router.patch( "/:id/status",              setStatus);    // PATCH  /api/quizzes/:id/status
router.post(  "/:id/generate-code",       generateCode); // POST   /api/quizzes/:id/generate-code
router.delete("/:id",                     deleteQuiz);   // DELETE /api/quizzes/:id

// ── Image endpoints ────────────────────────────────────────────
router.post(  "/images/upload",    upload.single("image"), uploadImage);
router.delete("/images/:filename", deleteImage);

module.exports = router;
