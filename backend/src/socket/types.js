/**
 * Socket Event Types & Constants
 * Shared definitions for all socket events
 */

// ─── Client → Server Events ───────────────────────────────────
const CLIENT_EVENTS = {
  JOIN_QUIZ:         "join_quiz",         // Student / teacher joins a session
  SUBMIT_ANSWER:     "submit_answer",     // Student submits / changes answer
  CONTROL_SESSION:   "control_session",   // Teacher pauses / resumes / stops
  GET_SESSION_STATE: "get_session_state", // Teacher requests full snapshot (refresh/reconnect)
  SET_READY:         "set_ready",         // Student toggles "ready" in the waiting room
  GET_LOBBY:         "get_lobby",         // Anyone requests the current waiting-room roster
  LEAVE_QUIZ:        "leave_quiz",        // Student permanently leaves (removes their record)
};

// ─── Server → Client Events ───────────────────────────────────
const SERVER_EVENTS = {
  SESSION_JOINED:  "session_joined",  // Ack to student/teacher after join
  SESSION_STATE:   "session_state",   // Full snapshot response to GET_SESSION_STATE
  STUDENT_JOINED:  "student_joined",  // Broadcast to teacher when student connects
  STUDENT_LEFT:    "student_left",    // Broadcast when student disconnects
  ANSWER_UPDATE:   "answer_update",   // Broadcast new/updated answer
  SESSION_STATS:   "session_stats",   // Aggregated stats update
  SESSION_CONTROL: "session_control", // Teacher control broadcast (pause/resume)
  LOBBY_UPDATE:    "lobby_update",    // Waiting-room roster broadcast to everyone in session
  STUDENT_REMOVED: "student_removed", // A student record was permanently removed
  ERROR:           "error",
};

// ─── Room naming ──────────────────────────────────────────────
function teacherRoom(sessionId) { return `teacher:${sessionId}`; }
function studentRoom(sessionId) { return `students:${sessionId}`; }
function sessionRoom(sessionId) { return `session:${sessionId}`; }

module.exports = { CLIENT_EVENTS, SERVER_EVENTS, teacherRoom, studentRoom, sessionRoom };
