/**
 * loadtest-students.js — simulate many students joining a quiz waiting room.
 *
 * It speaks the same Socket.IO events as the real student client
 * (join_quiz / set_ready / leave_quiz), so it exercises the actual
 * backend + Redis lobby path — handy for testing the waiting room with
 * ~20 bots before a real class.
 *
 * Usage (from the `frontend` folder):
 *   node scripts/loadtest-students.js --quiz <QUIZ_ID> [options]
 *
 * Options:
 *   --quiz   <id>     Quiz id to join (required)
 *   --count  <n>      Number of students to spawn        (default 20)
 *   --url    <url>    Backend socket URL                 (default NEXT_PUBLIC_API_URL or http://localhost:5000)
 *   --ready           Mark every bot "ready" after joining
 *   --stagger <ms>    Delay between each join             (default 250ms)
 *
 * Example:
 *   node scripts/loadtest-students.js --quiz 671f0b... --count 20 --ready
 *
 * Press Ctrl+C to make all bots leave and disconnect cleanly.
 */

const { io } = require("socket.io-client");

// ── Parse CLI args ──────────────────────────────────────────────
function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : true; // bare flag → true
}

const QUIZ_ID = arg("--quiz");
const COUNT   = parseInt(arg("--count", "20"), 10);
const URL     = arg("--url", process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");
const READY   = !!arg("--ready", false);
const STAGGER = parseInt(arg("--stagger", "250"), 10);

if (!QUIZ_ID) {
  console.error("❌ Missing --quiz <QUIZ_ID>. Example:\n   node scripts/loadtest-students.js --quiz 671f0b... --count 20 --ready");
  process.exit(1);
}

const sessionId = `quiz-session-${QUIZ_ID}`;

// A small pool of believable names; cycles + numbers if COUNT > pool.
const NAMES = [
  "Alex", "Bua", "Chai", "Dao", "Em", "Fah", "Gun", "Ho", "Ice", "Jay",
  "Kan", "Lek", "Mint", "Nan", "Oat", "Ploy", "Q", "Rin", "Som", "Tan",
  "Ueng", "View", "Wai", "Yok", "Zen",
];

console.log(`\n🎯 Spawning ${COUNT} students → ${URL}`);
console.log(`   sessionId: ${sessionId}`);
console.log(`   ready:     ${READY}\n`);

const bots = [];

function spawnBot(i) {
  const studentId = `bot-${Date.now().toString(36)}-${i}`;
  const name = `${NAMES[i % NAMES.length]}${i >= NAMES.length ? " " + (Math.floor(i / NAMES.length) + 1) : ""}`;
  const avatar = `https://api.dicebear.com/10.x/big-smile/svg?seed=${studentId}`;

  const socket = io(URL, {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    socket.emit("join_quiz", {
      sessionId,
      quizId: QUIZ_ID,
      studentId,
      name,
      avatar,
      role: "student",
    });
  });

  socket.on("session_joined", () => {
    console.log(`✅ ${name} joined (${studentId})`);
    if (READY) {
      socket.emit("set_ready", { sessionId, studentId, isReady: true });
    }
  });

  socket.on("error", ({ message }) => {
    console.warn(`⚠️  ${name}: ${message}`);
  });

  socket.on("disconnect", () => {
    // silent — expected during shutdown
  });

  bots.push({ socket, studentId, name });
}

// Stagger joins so the "new student" animation fires one-by-one,
// just like real students trickling in.
let idx = 0;
const timer = setInterval(() => {
  if (idx >= COUNT) {
    clearInterval(timer);
    console.log(`\n👥 All ${COUNT} bots spawned. Press Ctrl+C to make them leave.\n`);
    return;
  }
  spawnBot(idx++);
}, STAGGER);

// ── Clean shutdown: every bot leaves, then disconnects ──────────
function shutdown() {
  console.log("\n👋 Leaving session…");
  clearInterval(timer);
  for (const { socket, studentId } of bots) {
    try {
      socket.emit("leave_quiz", { sessionId, studentId });
      socket.disconnect();
    } catch (_) { /* ignore */ }
  }
  setTimeout(() => process.exit(0), 500);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
