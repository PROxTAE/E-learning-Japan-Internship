// ─────────────────────────────────────────────
//  auth.routes.js — Teacher authentication
// ─────────────────────────────────────────────
const express = require("express");
const { loginTeacher, getMe } = require("../controllers/auth.controller");
const { requireTeacher }      = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", loginTeacher);     // POST  /api/auth/login
router.get("/me",    requireTeacher, getMe); // GET   /api/auth/me

module.exports = router;
