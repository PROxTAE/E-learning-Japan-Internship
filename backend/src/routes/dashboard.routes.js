// ─────────────────────────────────────────────
//  dashboard.routes.js
//  GET /api/dashboard/stats
// ─────────────────────────────────────────────
const express = require("express");
const { getDashboardStats } = require("../controllers/dashboard.controller");

const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", getDashboardStats);

module.exports = router;
