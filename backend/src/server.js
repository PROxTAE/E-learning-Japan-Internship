// ─────────────────────────────────────────────
//  server.js — Express + Socket.IO entry point
// ─────────────────────────────────────────────
require("dotenv").config();
const http    = require("http");
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const { connectDB }        = require("./db");
const { getRedisClient }   = require("./redis/redisClient");
const quizRoutes           = require("./routes/quiz.routes");
const monitoringRoutes     = require("./routes/monitoring.routes");
const dashboardRoutes      = require("./routes/dashboard.routes");
const quizLogRoutes        = require("./routes/quiz-log.routes");
const sessionHistoryRoutes = require("./routes/session-history.routes");
const { getQuizByCode }    = require("./controllers/quiz.controller");
const { initSocket }       = require("./socket");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ─────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── REST Routes ────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.send("<h1>Quiz Backend + Socket.IO Running!</h1><p><a href='/api/health'>/api/health</a></p>");
});

app.use("/api/quizzes", quizRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/quiz-logs", quizLogRoutes);
app.use("/api/session-history", sessionHistoryRoutes);
app.get("/api/play/:code", getQuizByCode);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), socketio: true });
});

// ── 404 ─────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Error handler ───────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

// ── Create HTTP server & attach Socket.IO ──────────────────────
const httpServer = http.createServer(app);
initSocket(httpServer);

// ── Start ──────────────────────────────────────────────────────
// Only MongoDB is required for startup. Redis connects lazily on
// first socket event — server stays up even if Redis is offline.
connectDB()
  .then(() => {
    // Attempt Redis warm-up in the background (non-blocking)
    getRedisClient().then((rc) => {
      if (rc) console.log("[redis] ✅ Warmed up and ready");
      else    console.warn("[redis] ⚠️  Running without Redis — session state is in-memory only");
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
      console.log(`📂 Network IP: http://150.15.79.45:${PORT}`);
      console.log(`🔌 Socket.IO ready at ws://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed — cannot start:", err);
    process.exit(1);
  });
