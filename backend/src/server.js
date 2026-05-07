// ─────────────────────────────────────────────
//  server.js — Express app entry point
// ─────────────────────────────────────────────
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const { connectDB }  = require("./db");
const quizRoutes     = require("./routes/quiz.routes");
const { getQuizByCode } = require("./controllers/quiz.controller");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors()); // Permit all origins for testing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ─────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Test Route ────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.send("<h1>Quiz Backend is Running!</h1><p>Try <a href='/api/health'>/api/health</a></p>");
});

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/quizzes", quizRoutes);

// Public student endpoint — look up quiz by access code
// GET /api/play/:code
app.get("/api/play/:code", getQuizByCode);

// ── Health check ───────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler ───────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

// ── Start ──────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT} (All interfaces)`);
    console.log(`📂 IP Address for mobile: http://150.15.79.45:${PORT}`);
  });
});
