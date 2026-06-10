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
const { upload }          = require("../middleware/upload.middleware");
const { requireTeacher }  = require("../middleware/auth.middleware");

const router = express.Router();

// ── Quiz CRUD (all require teacher auth) ───────────────────────
router.get(   "/",                        requireTeacher, listQuizzes);  // GET    /api/quizzes
router.get(   "/:id",                     requireTeacher, getQuiz);      // GET    /api/quizzes/:id
router.post(  "/",                        requireTeacher, createQuiz);   // POST   /api/quizzes
router.put(   "/:id",                     requireTeacher, updateQuiz);   // PUT    /api/quizzes/:id
router.patch( "/:id/status",              requireTeacher, setStatus);    // PATCH  /api/quizzes/:id/status
router.post(  "/:id/generate-code",       requireTeacher, generateCode); // POST   /api/quizzes/:id/generate-code
router.delete("/:id",                     requireTeacher, deleteQuiz);   // DELETE /api/quizzes/:id

// ── Image endpoints (require teacher auth) ─────────────────────
router.post(  "/images/upload",    requireTeacher, upload.single("image"), uploadImage);
router.delete("/images/:filename", requireTeacher, deleteImage);

module.exports = router;
