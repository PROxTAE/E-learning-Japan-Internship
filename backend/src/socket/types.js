/**
 * Socket Event Types & Constants
 * Shared definitions for all socket events
 */

// ─── Client → Server Events ───────────────────────────────────
const CLIENT_EVENTS = {
  JOIN_QUIZ:      "join_quiz",      // Student joins a session
  SUBMIT_ANSWER:  "submit_answer",  // Student submits/changes answer
  CONTROL_SESSION:"control_session",// Teacher pauses/resumes/stops
};

// ─── Server → Client Events ───────────────────────────────────
const SERVER_EVENTS = {
  SESSION_JOINED:   "session_joined",   // Ack to student after join
  STUDENT_JOINED:   "student_joined",   // Broadcast to teacher
  STUDENT_LEFT:     "student_left",     // Broadcast when student disconnects
  ANSWER_UPDATE:    "answer_update",    // Broadcast new/updated answer
  SESSION_STATS:    "session_stats",    // Aggregated stats update
  SESSION_CONTROL:  "session_control",  // Teacher control broadcast
  ERROR:            "error",
};

// ─── Room naming ──────────────────────────────────────────────
function teacherRoom(sessionId) { return `teacher:${sessionId}`; }
function studentRoom(sessionId) { return `students:${sessionId}`; }
function sessionRoom(sessionId) { return `session:${sessionId}`; }

module.exports = { CLIENT_EVENTS, SERVER_EVENTS, teacherRoom, studentRoom, sessionRoom };
