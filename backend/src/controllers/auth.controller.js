// ─────────────────────────────────────────────
//  auth.controller.js — Teacher auth handlers
// ─────────────────────────────────────────────
const jwt     = require("jsonwebtoken");
const Teacher = require("../models/Teacher.model");

const JWT_SECRET  = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES = "7d";

function ok(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function fail(res, message, status = 400) {
  res.status(status).json({ success: false, message });
}

/** Sign a teacher JWT payload */
function signToken(teacher) {
  return jwt.sign(
    { id: teacher.id, name: teacher.name, email: teacher.email, role: "teacher" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── POST /api/auth/login ────────────────────────────────────────
async function loginTeacher(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, "Email and password are required.");

    const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
    if (!teacher) return fail(res, "Invalid email or password.", 401);
    if (!teacher.isActive) return fail(res, "Account is disabled. Contact admin.", 403);

    const valid = await teacher.verifyPassword(password);
    if (!valid) return fail(res, "Invalid email or password.", 401);

    const token = signToken(teacher);

    ok(res, {
      token,
      teacher: teacher.toJSON(),
    });
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── GET /api/auth/me ────────────────────────────────────────────
async function getMe(req, res) {
  try {
    // req.teacher is set by requireTeacher middleware
    const teacher = await Teacher.findById(req.teacher.id);
    if (!teacher || !teacher.isActive) return fail(res, "Teacher not found or inactive.", 404);
    ok(res, teacher.toJSON());
  } catch (err) {
    fail(res, err.message, 500);
  }
}

module.exports = { loginTeacher, getMe };
