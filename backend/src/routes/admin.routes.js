// ─────────────────────────────────────────────
//  admin.routes.js — Super Admin endpoints
// ─────────────────────────────────────────────
const express = require("express");
const {
  loginAdmin,
  listTeachers,
  createTeacher,
  updateTeacher,
  deactivateTeacher,
} = require("../controllers/admin.controller");
const { requireAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login",           loginAdmin);                    // POST   /api/admin/login
router.get( "/teachers",        requireAdmin, listTeachers);   // GET    /api/admin/teachers
router.post("/teachers",        requireAdmin, createTeacher);  // POST   /api/admin/teachers
router.put( "/teachers/:id",    requireAdmin, updateTeacher);  // PUT    /api/admin/teachers/:id
router.delete("/teachers/:id",  requireAdmin, deactivateTeacher); // DELETE /api/admin/teachers/:id

module.exports = router;
