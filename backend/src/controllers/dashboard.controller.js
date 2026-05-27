// ─────────────────────────────────────────────────────────────────
//  dashboard.controller.js
//
//  Aggregates real quiz + session data for the teacher dashboard.
//  All calculations happen in MongoDB so the frontend just renders.
// ─────────────────────────────────────────────────────────────────
const Quiz               = require("../models/Quiz.model");
const QuizSessionResult  = require("../models/QuizSessionResult.model");

function ok(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}
function fail(res, message, status = 500) {
  res.status(status).json({ success: false, message });
}

// ─────────────────────────────────────────────────────────────────
//  GET /api/dashboard/stats
//
//  Returns:
//   - quizStats     : totals, published, draft, archived, attempts, avgScore
//   - weeklyPerformance : 8-week array { week, attempts, avgScore }
//   - topQuizzes    : top 5 by completionRate (from session results)
//   - recentActivity: last 10 session completions with student name & quiz title
// ─────────────────────────────────────────────────────────────────
async function getDashboardStats(req, res) {
  try {
    const [quizzes, sessions] = await Promise.all([
      Quiz.find({}).select("-questions").lean(),
      QuizSessionResult.find({})
        .sort({ endedAt: -1 })
        .populate("quizId", "title category emoji gradient")
        .lean(),
    ]);

    // ── 1. Quiz Stats ──────────────────────────────────────────
    const totalQuizzes     = quizzes.length;
    const publishedQuizzes = quizzes.filter((q) => q.status === "published").length;
    const draftQuizzes     = quizzes.filter((q) => q.status === "draft").length;
    const archivedQuizzes  = quizzes.filter((q) => q.status === "archived").length;

    // totalAttempts = sum of all students across all sessions
    const totalAttempts = sessions.reduce((s, sess) => s + (sess.stats?.totalStudents || 0), 0);

    // averageScore = average of session averageScores (weighted by student count)
    let weightedScore = 0;
    let totalStudents = 0;
    for (const sess of sessions) {
      const n = sess.stats?.totalStudents || 0;
      weightedScore += (sess.stats?.averageScore || 0) * n;
      totalStudents += n;
    }
    const averageScore = totalStudents > 0 ? Math.round(weightedScore / totalStudents) : 0;

    // ── 2. Weekly Performance (last 8 calendar weeks) ─────────
    const now = new Date();
    const weeklyPerformance = [];

    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekSessions = sessions.filter((s) => {
        const d = new Date(s.endedAt || s.createdAt);
        return d >= weekStart && d < weekEnd;
      });

      const wAttempts = weekSessions.reduce((s, sess) => s + (sess.stats?.totalStudents || 0), 0);
      let wScore = 0, wStudents = 0;
      for (const sess of weekSessions) {
        const n = sess.stats?.totalStudents || 0;
        wScore   += (sess.stats?.averageScore || 0) * n;
        wStudents += n;
      }
      const wAvgScore = wStudents > 0 ? Math.round(wScore / wStudents) : 0;

      // Label: "W1"…"W8" (W8 = oldest, W1 = most recent)
      weeklyPerformance.push({
        week:     `W${8 - w}`,
        attempts: wAttempts,
        avgScore: wAvgScore,
      });
    }

    // ── 3. Top Performing Quizzes (by avg completion rate) ────
    // Aggregate per quiz from session results
    const quizAgg = {};
    for (const sess of sessions) {
      const qid = String(sess.quizId?._id || sess.quizId);
      if (!quizAgg[qid]) {
        quizAgg[qid] = {
          quizId:        qid,
          quizTitle:     sess.quizId?.title || "Unknown",
          emoji:         sess.quizId?.emoji || "📄",
          gradient:      sess.quizId?.gradient || "from-gray-500 to-slate-600",
          totalStudents: 0,
          totalScore:    0,
          totalCompletion: 0,
          sessionCount:  0,
        };
      }
      const entry = quizAgg[qid];
      entry.sessionCount++;
      const n = sess.stats?.totalStudents || 0;
      entry.totalStudents  += n;
      entry.totalScore     += (sess.stats?.averageScore || 0) * n;
      entry.totalCompletion += (sess.stats?.completionPercentage || 0);
    }

    const topQuizzes = Object.values(quizAgg)
      .map((entry) => ({
        quizId:         entry.quizId,
        quizTitle:      entry.quizTitle,
        emoji:          entry.emoji,
        gradient:       entry.gradient,
        totalAttempts:  entry.totalStudents,
        averageScore:   entry.totalStudents > 0
          ? Math.round(entry.totalScore / entry.totalStudents)
          : 0,
        completionRate: entry.sessionCount > 0
          ? Math.round(entry.totalCompletion / entry.sessionCount)
          : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    // ── 4. Recent Activity ────────────────────────────────────
    // Last 10 student completions across sessions
    const recentActivity = [];
    for (const sess of sessions.slice(0, 20)) {
      const quizTitle = sess.quizId?.title || "Unknown Quiz";
      // Pick the most recent student from this session
      const latestStudent = (sess.students || [])
        .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))[0];

      if (!latestStudent) continue;

      const score = latestStudent.score;
      let type = "submission";
      let action = "completed";
      if (score >= 90) { type = "achievement"; action = `scored ${score}% — excellent! 🎉`; }
      else if (score < 50) { type = "warning"; action = `scored ${score}% and may need help`; }
      else { action = `completed with ${score}%`; }

      recentActivity.push({
        id:           String(sess._id),
        studentName:  latestStudent.name,
        action,
        quizTitle,
        type,
        timestamp:    (sess.endedAt || sess.createdAt).toISOString(),
      });

      if (recentActivity.length >= 8) break;
    }

    ok(res, {
      quizStats: {
        totalQuizzes,
        publishedQuizzes,
        draftQuizzes,
        archivedQuizzes,
        totalAttempts,
        averageScore,
      },
      weeklyPerformance,
      topQuizzes,
      recentActivity,
    });
  } catch (err) {
    console.error("[dashboard] Error:", err);
    fail(res, err.message);
  }
}

module.exports = { getDashboardStats };
