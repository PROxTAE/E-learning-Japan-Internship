// ─────────────────────────────────────────────
//  admin.controller.js — Super Admin handlers
//  Authentication is via a static secret key,
//  not a DB user — keeps setup simple.
// ─────────────────────────────────────────────
const jwt     = require("jsonwebtoken");
const Teacher = require("../models/Teacher.model");

const JWT_SECRET        = process.env.JWT_SECRET        || "dev-secret-change-in-production";
const ADMIN_SECRET_KEY  = process.env.ADMIN_SECRET_KEY  || "admin-secret-change-in-production";
const ADMIN_JWT_EXPIRES = "8h";

function ok(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function fail(res, message, status = 400) {
  res.status(status).json({ success: false, message });
}

// ── POST /api/admin/login ───────────────────────────────────────
async function loginAdmin(req, res) {
  try {
    const { secretKey } = req.body;
    if (!secretKey) return fail(res, "Secret key is required.");
    if (secretKey !== ADMIN_SECRET_KEY) return fail(res, "Invalid secret key.", 401);

    const token = jwt.sign(
      { role: "admin" },
      JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES }
    );

    ok(res, { token });
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── GET /api/admin/teachers ─────────────────────────────────────
async function listTeachers(req, res) {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    ok(res, teachers.map(t => t.toJSON()));
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── POST /api/admin/teachers ────────────────────────────────────
async function createTeacher(req, res) {
  try {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password) return fail(res, "name, email, and password are required.");
    if (password.length < 6) return fail(res, "Password must be at least 6 characters.");

    const existing = await Teacher.findOne({ email: email.toLowerCase().trim() });
    if (existing) return fail(res, "Email is already registered.", 409);

    const passwordHash = await Teacher.hashPassword(password);
    const teacher = await Teacher.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      department: department || "",
    });

    ok(res, teacher.toJSON(), 201);
  } catch (err) {
    if (err.code === 11000) return fail(res, "Email is already registered.", 409);
    fail(res, err.message, 500);
  }
}

// ── PUT /api/admin/teachers/:id ─────────────────────────────────
async function updateTeacher(req, res) {
  try {
    const { name, email, password, department, isActive } = req.body;

    const update = {};
    if (name       !== undefined) update.name       = name.trim();
    if (email      !== undefined) update.email      = email.toLowerCase().trim();
    if (department !== undefined) update.department = department;
    if (isActive   !== undefined) update.isActive   = isActive;
    if (password) {
      if (password.length < 6) return fail(res, "Password must be at least 6 characters.");
      update.passwordHash = await Teacher.hashPassword(password);
    }

    if (email) {
      const conflict = await Teacher.findOne({ email: email.toLowerCase().trim(), _id: { $ne: req.params.id } });
      if (conflict) return fail(res, "Email is already in use by another teacher.", 409);
    }

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!teacher) return fail(res, "Teacher not found.", 404);
    ok(res, teacher.toJSON());
  } catch (err) {
    fail(res, err.message, 500);
  }
}

// ── DELETE /api/admin/teachers/:id ─────────────────────────────
// Soft-delete: sets isActive = false rather than removing the record.
// This preserves quiz data ownership.
async function deactivateTeacher(req, res) {
  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!teacher) return fail(res, "Teacher not found.", 404);
    ok(res, teacher.toJSON());
  } catch (err) {
    fail(res, err.message, 500);
  }
}

module.exports = { loginAdmin, listTeachers, createTeacher, updateTeacher, deactivateTeacher };
