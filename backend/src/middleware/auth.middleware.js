// ─────────────────────────────────────────────
//  auth.middleware.js
//  requireTeacher — validates JWT from Authorization header
//  requireAdmin   — validates admin JWT
// ─────────────────────────────────────────────
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

function fail(res, message, status = 401) {
  res.status(status).json({ success: false, message });
}

/**
 * requireTeacher
 * Verifies Bearer token → attaches req.teacher = { id, name, email, role }
 */
function requireTeacher(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail(res, "Authentication required. Please log in.");
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "teacher") {
      return fail(res, "Access denied — teacher account required.", 403);
    }
    req.teacher = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return fail(res, "Session expired. Please log in again.");
    }
    return fail(res, "Invalid authentication token.");
  }
}

/**
 * requireAdmin
 * Verifies admin Bearer token → attaches req.admin = { role: "admin" }
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail(res, "Admin authentication required.");
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return fail(res, "Access denied — admin account required.", 403);
    }
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return fail(res, "Admin session expired.");
    }
    return fail(res, "Invalid admin token.");
  }
}

/**
 * optionalTeacher
 * Tries to decode token but never blocks the request.
 * Attaches req.teacher if valid, otherwise leaves it undefined.
 */
function optionalTeacher(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === "teacher") {
        req.teacher = decoded;
      }
    } catch (_) {
      // ignore errors — optional auth
    }
  }
  next();
}

module.exports = { requireTeacher, requireAdmin, optionalTeacher };
