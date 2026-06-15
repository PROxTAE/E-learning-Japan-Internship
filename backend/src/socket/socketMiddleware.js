/**
 * Socket middleware — auth, rate-limit, validation
 */

// Simple in-memory rate limit per socket (10 events/5s)
const rateLimitMap = new Map();

function rateLimitMiddleware(socket, next) {
  const now = Date.now();
  const entry = rateLimitMap.get(socket.id) || { count: 0, resetAt: now + 5000 };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 5000;
  }
  entry.count++;
  rateLimitMap.set(socket.id, entry);

  if (entry.count > 50) {
    return next(new Error("Rate limit exceeded"));
  }
  next();
}

// Per-event rate limiter — call inside individual handlers
// Returns null if OK, or an error message string if rate-limited
const eventRateLimitMap = new Map(); // socketId → { count, resetAt }

function checkEventRateLimit(socketId, maxEvents = 10, windowMs = 5000) {
  const now = Date.now();
  const entry = eventRateLimitMap.get(socketId) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  eventRateLimitMap.set(socketId, entry);
  if (entry.count > maxEvents) {
    return "Rate limit: too many events, please slow down";
  }
  return null;
}

// Validate join_quiz payload
function validateJoinPayload(payload) {
  const { sessionId, studentId, name, role } = payload || {};
  if (!sessionId || typeof sessionId !== "string") return "Missing sessionId";
  if (role === "student" && !studentId) return "Missing studentId";
  if (role === "student" && !name) return "Missing student name";
  if (!role || !["student", "teacher"].includes(role)) return "Invalid role (student|teacher)";
  return null;
}

// Validate submit_answer payload
function validateAnswerPayload(payload) {
  const { sessionId, studentId, questionId, choiceId } = payload || {};
  if (!sessionId) return "Missing sessionId";
  if (!studentId) return "Missing studentId";
  if (!questionId) return "Missing questionId";
  if (!choiceId) return "Missing choiceId";
  return null;
}

// Cleanup on disconnect
function cleanupSocket(socketId) {
  rateLimitMap.delete(socketId);
  eventRateLimitMap.delete(socketId);
}

module.exports = { rateLimitMiddleware, checkEventRateLimit, validateJoinPayload, validateAnswerPayload, cleanupSocket };
