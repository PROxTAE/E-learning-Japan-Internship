/**
 * session-history.routes.js
 *
 * REST API for quiz session history, per-session analytics, cross-session
 * comparison, and AI-powered insights via Ollama.
 *
 * Routes:
 *   GET  /api/session-history/quiz/:quizId            — list sessions for a quiz
 *   GET  /api/session-history/:sessionResultId        — full session detail
 *   PATCH /api/session-history/:sessionResultId/label — update session label
 *   GET  /api/session-history/quiz/:quizId/aggregate  — cross-session aggregate
 *   POST /api/session-history/:sessionResultId/ai-summary          — stream class AI
 *   POST /api/session-history/:sessionResultId/ai-student/:studentId — stream per-student AI
 */

const express = require("express");
const router  = express.Router();
const http    = require("http");
const https   = require("https");

const QuizSessionResult = require("../models/QuizSessionResult.model");
const Quiz              = require("../models/Quiz.model");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(res, data)  { res.json({ success: true, data }); }
function fail(res, msg, status = 400) { res.status(status).json({ success: false, message: msg }); }

/** Stream Ollama generate response as SSE to client */
async function streamOllamaSSE(res, prompt) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const body = JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: true });
  const url  = new URL(`${OLLAMA_URL}/api/generate`);
  const lib  = url.protocol === "https:" ? https : http;

  const req = lib.request({ hostname: url.hostname, port: url.port || 11434, path: url.pathname, method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
  }, (ollamaRes) => {
    ollamaRes.on("data", (chunk) => {
      try {
        const lines = chunk.toString().split("\n").filter(Boolean);
        lines.forEach(line => {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            res.write(`data: ${JSON.stringify({ token: parsed.response })}\n\n`);
          }
          if (parsed.done) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          }
        });
      } catch (_) { /* ignore malformed chunks */ }
    });
    ollamaRes.on("end", () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); });
  });

  req.on("error", (err) => {
    console.error("[ollama] Error:", err.message);
    res.write(`data: ${JSON.stringify({ error: "AI service unavailable: " + err.message })}\n\n`);
    res.end();
  });

  req.write(body);
  req.end();
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/session-history/quiz/:quizId
 * List all past sessions for a quiz, sorted by newest first.
 */
router.get("/quiz/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const sessions = await QuizSessionResult.find({ quizId })
      .select("sessionId sessionLabel startedAt endedAt stats students createdAt")
      .sort({ endedAt: -1 })
      .lean();

    const data = sessions.map(s => ({
      id:           s._id.toString(),
      sessionId:    s.sessionId,
      sessionLabel: s.sessionLabel || "",
      startedAt:    s.startedAt,
      endedAt:      s.endedAt,
      stats:        s.stats,
      studentCount: (s.students || []).length,
    }));

    ok(res, data);
  } catch (err) {
    console.error("[session-history] list error:", err);
    fail(res, err.message, 500);
  }
});

/**
 * GET /api/session-history/quiz/:quizId/aggregate
 * Cross-session aggregate: per-question correct%, avg score trend, confusion trend.
 */
router.get("/quiz/:quizId/aggregate", async (req, res) => {
  try {
    const { quizId } = req.params;
    const sessions = await QuizSessionResult.find({ quizId })
      .select("sessionId sessionLabel endedAt stats questionStats students")
      .sort({ endedAt: 1 })
      .lean();

    if (!sessions.length) return ok(res, { sessions: [], questionAggregate: [] });

    // Aggregate per-question across all sessions
    const questionMap = {}; // questionId → { text, sessions: [] }
    sessions.forEach(sess => {
      (sess.questionStats || []).forEach(qs => {
        if (!questionMap[qs.questionId]) {
          questionMap[qs.questionId] = { questionId: qs.questionId, questionText: qs.questionText, order: qs.order, sessions: [] };
        }
        questionMap[qs.questionId].sessions.push({
          sessionId:    sess.sessionId,
          sessionLabel: sess.sessionLabel,
          correctPercent: qs.correctPercent,
          avgResponseTime: qs.avgResponseTime,
          confusionCount:  qs.confusionCount,
          answerCount:     qs.answerCount,
        });
      });
    });

    const questionAggregate = Object.values(questionMap).sort((a, b) => a.order - b.order);

    const sessionSummaries = sessions.map(s => ({
      id:           s._id.toString(),
      sessionId:    s.sessionId,
      sessionLabel: s.sessionLabel || "",
      endedAt:      s.endedAt,
      stats:        s.stats,
      studentCount: (s.students || []).length,
    }));

    ok(res, { sessions: sessionSummaries, questionAggregate });
  } catch (err) {
    console.error("[session-history] aggregate error:", err);
    fail(res, err.message, 500);
  }
});

/**
 * GET /api/session-history/:sessionResultId
 * Full session detail: students, answers, questionStats.
 */
router.get("/:sessionResultId", async (req, res) => {
  try {
    const session = await QuizSessionResult.findById(req.params.sessionResultId).lean();
    if (!session) return fail(res, "Session not found", 404);

    // Also fetch quiz metadata for question texts
    const quiz = await Quiz.findById(session.quizId).lean();

    ok(res, { ...session, id: session._id.toString(), quiz: quiz ? { title: quiz.title, subject: quiz.subject, chapter: quiz.chapter } : null });
  } catch (err) {
    console.error("[session-history] detail error:", err);
    fail(res, err.message, 500);
  }
});

/**
 * PATCH /api/session-history/:sessionResultId/label
 * Update session label after the fact.
 */
router.patch("/:sessionResultId/label", async (req, res) => {
  try {
    const { sessionLabel } = req.body;
    if (typeof sessionLabel !== "string") return fail(res, "sessionLabel must be a string");

    const session = await QuizSessionResult.findByIdAndUpdate(
      req.params.sessionResultId,
      { $set: { sessionLabel } },
      { returnDocument: "after" }
    ).lean();
    if (!session) return fail(res, "Session not found", 404);

    ok(res, { id: session._id.toString(), sessionLabel: session.sessionLabel });
  } catch (err) {
    fail(res, err.message, 500);
  }
});

/**
 * POST /api/session-history/:sessionResultId/ai-summary
 * Stream AI class-wide summary for a session.
 */
router.post("/:sessionResultId/ai-summary", async (req, res) => {
  try {
    const { lang = "th" } = req.body;
    const session = await QuizSessionResult.findById(req.params.sessionResultId).lean();
    if (!session) return fail(res, "Session not found", 404);

    const quiz = await Quiz.findById(session.quizId).lean();
    const quizTitle = quiz?.title || "Unknown Quiz";

    // Build prompt
    const questionLines = (session.questionStats || []).map((qs, i) =>
      `  Q${i + 1}: "${qs.questionText}" — ${qs.correctPercent}% correct, avg time ${qs.avgResponseTime}s, confusion count: ${qs.confusionCount}`
    ).join("\n");

    const studentLines = (session.students || []).map(s =>
      `  - ${s.name}: ${s.scorePercent || s.score}%`
    ).join("\n");

    let systemRole = "You are an expert educational data analyst.";
    let sectionsInstruction = `Please provide:
1. Overall class performance summary (2-3 sentences)
2. Top 3 questions students struggled with most and WHY they likely struggled
3. Top 3 questions students mastered well
4. 3-5 specific, actionable teaching recommendations to improve understanding of weak areas
5. Suggested teaching strategies for the next class`;
    let responseLang = "English";

    if (lang === "th") {
      systemRole = "คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลทางการศึกษา";
      sectionsInstruction = `โปรดระบุหัวข้อต่อไปนี้เป็นภาษาไทย:
1. สรุปภาพรวมผลการเรียนของห้องเรียนนี้ (2-3 ประโยค)
2. คำถาม 3 ข้อแรกที่นักเรียนทำได้ยากที่สุด และเหตุผลที่นักเรียนน่าจะติดขัด/สับสน
3. คำถาม 3 ข้อแรกที่นักเรียนทำได้ดีมาก
4. คำแนะนำการสอนเฉพาะเจาะจง 3-5 ข้อที่นำไปปฏิบัติได้จริงเพื่อปรับปรุงในจุดที่นักเรียนอ่อนข้อดังกล่าว
5. แนะนำกลยุทธ์การสอนสำหรับการสอนในคาบถัดไป`;
      responseLang = "ภาษาไทย (Thai)";
    } else if (lang === "ja") {
      systemRole = "あなたは教育データ分析の専門家です。";
      sectionsInstruction = `日本語で以下の分析を提供してください：
1. クラス全体のパフォーマンスの概要（2〜3文）
2. 学生が最も苦戦した上位3つの問題とその主な理由
3. 学生がよく理解できている上位3つの問題
4. 弱い領域の理解を深めるための具体的かつ実践的な3〜5つの指導上の推奨事項
5. 次の授業のための推奨される指導戦略`;
      responseLang = "日本語 (Japanese)";
    }

    const prompt = `${systemRole}
Analyze the following quiz session results and provide actionable teaching insights.

Quiz: "${quizTitle}"
Session: "${session.sessionLabel || session.sessionId}"
Total Students: ${session.stats?.totalStudents || 0}
Average Score: ${session.stats?.averageScore || 0}%
Completion Rate: ${session.stats?.completionPercentage || 0}%

Per-Question Analysis:
${questionLines || "  (no question data)"}

Student Scores:
${studentLines || "  (no students)"}

${sectionsInstruction}

IMPORTANT CRITICAL INSTRUCTION: You MUST write your entire response, headings, analysis, and recommendations in ${responseLang}. Do not use English for headings or summaries if the target language is different. Be concise but specific. Use bullet points where helpful.`;

    await streamOllamaSSE(res, prompt);
  } catch (err) {
    console.error("[session-history] ai-summary error:", err);
    fail(res, err.message, 500);
  }
});

/**
 * POST /api/session-history/:sessionResultId/ai-student/:studentId
 * Stream AI per-student analysis.
 */
router.post("/:sessionResultId/ai-student/:studentId", async (req, res) => {
  try {
    const { lang = "th" } = req.body;
    const session = await QuizSessionResult.findById(req.params.sessionResultId).lean();
    if (!session) return fail(res, "Session not found", 404);

    const student = (session.students || []).find(s => s.studentId === req.params.studentId);
    if (!student) return fail(res, "Student not found in session", 404);

    const quiz = await Quiz.findById(session.quizId).lean();
    const quizTitle = quiz?.title || "Unknown Quiz";

    const studentAnswers = (session.answers || []).filter(a => a.studentId === req.params.studentId);
    const answerLines = studentAnswers.map((a, i) => {
      const qs = (session.questionStats || []).find(q => q.questionId === a.questionId);
      return `  Q${i + 1}: "${qs?.questionText || a.questionId}" — ${a.isCorrect ? "✓ Correct" : "✗ Wrong"} (chose: "${a.choiceText || a.choiceId}"), time: ${a.responseTime}s, confusion: ${a.confusionLevel}, changed answer: ${a.changeCount || 0} times`;
    }).join("\n");

    let systemRole = "You are an educational advisor analyzing an individual student's quiz performance.";
    let sectionsInstruction = `Please provide:
1. Brief overall assessment of this student's performance (2 sentences)
2. Specific concepts they understood well
3. Specific concepts they struggled with and need more help
4. 2-3 personalized learning recommendations for this student
5. One encouraging note for the student`;
    let responseLang = "English";

    if (lang === "th") {
      systemRole = "คุณคืออาจารย์ผู้แนะแนวทางการศึกษาที่วิเคราะห์ผลการทำแบบทดสอบของนักเรียนรายบุคคล";
      sectionsInstruction = `โปรดระบุหัวข้อต่อไปนี้เป็นภาษาไทย:
1. การประเมินภาพรวมของการทำแบบทดสอบของนักเรียนรายนี้สั้นๆ (2 ประโยค)
2. แนวคิดหรือหัวข้อเฉพาะที่นักเรียนเข้าใจได้ดี
3. แนวคิดหรือหัวข้อเฉพาะที่นักเรียนยังติดขัดและต้องการความช่วยเหลือเพิ่มเติม
4. คำแนะนำการเรียนรู้เฉพาะบุคคล 2-3 ข้อสำหรับนักเรียนรายนี้
5. ข้อความสั้นๆ เพื่อให้กำลังใจนักเรียน`;
      responseLang = "ภาษาไทย (Thai)";
    } else if (lang === "ja") {
      systemRole = "あなたは個々の生徒のクイズ結果を分析する教育アドバイザーです。";
      sectionsInstruction = `日本語で以下の分析を提供してください：
1. この生徒のパフォーマンスに関する簡単な全体評価（2文）
2. 生徒がよく理解している具体的な概念
3. 生徒が苦戦しており、さらなる支援が必要な具体的な概念
4. この生徒のための2〜3のパーソナライズされた学習アドバイス
5. 生徒への励ましの言葉`;
      responseLang = "日本語 (Japanese)";
    }

    const prompt = `${systemRole}
Analyze the student performance:

Quiz: "${quizTitle}"
Student: ${student.name}
Score: ${student.scorePercent || student.score}%

Answer Details:
${answerLines || "  (no answer data)"}

${sectionsInstruction}

IMPORTANT CRITICAL INSTRUCTION: You MUST write your entire response, headings, analysis, and recommendations in ${responseLang}. Do not use English for headings or summaries if the target language is different. Be supportive and constructive.`;

    await streamOllamaSSE(res, prompt);
  } catch (err) {
    console.error("[session-history] ai-student error:", err);
    fail(res, err.message, 500);
  }
});

/**
 * POST /api/session-history/quiz/:quizId/ai-cross-session
 * Stream AI cross-room/cross-session summary.
 */
router.post("/quiz/:quizId/ai-cross-session", async (req, res) => {
  try {
    const { lang = "th" } = req.body;
    const { quizId } = req.params;

    const sessions = await QuizSessionResult.find({ quizId })
      .select("sessionId sessionLabel stats questionStats students")
      .sort({ endedAt: 1 })
      .lean();

    if (!sessions.length) return fail(res, "No sessions found", 404);

    const quiz = await Quiz.findById(quizId).lean();
    const quizTitle = quiz?.title || "Unknown Quiz";

    const sessionLines = sessions.map((s, i) =>
      `  Session ${i + 1} "${s.sessionLabel || s.sessionId}": ${s.stats?.totalStudents || 0} students, avg score ${s.stats?.averageScore || 0}%, completion ${s.stats?.completionPercentage || 0}%`
    ).join("\n");

    // Find hardest questions across sessions
    const questionScores = {};
    sessions.forEach(s => {
      (s.questionStats || []).forEach(qs => {
        if (!questionScores[qs.questionId]) questionScores[qs.questionId] = { text: qs.questionText, percents: [], confusions: [] };
        questionScores[qs.questionId].percents.push(qs.correctPercent);
        questionScores[qs.questionId].confusions.push(qs.confusionCount);
      });
    });

    const qLines = Object.values(questionScores).map(q => {
      const avg = Math.round(q.percents.reduce((a, b) => a + b, 0) / q.percents.length);
      const totalConf = q.confusions.reduce((a, b) => a + b, 0);
      return `  "${q.text}": avg correct ${avg}% across sessions, total confusion ${totalConf}`;
    }).join("\n");

    let systemRole = "You are an educational data analyst reviewing a teacher's quiz results across multiple classes/rooms.";
    let sectionsInstruction = `Please provide:
1. Overall trend across sessions (improving, declining, consistent)
2. Which concepts are universally difficult across all rooms/sessions
3. Which sessions/rooms performed best and why (hypothesize)
4. 3-5 curriculum or teaching strategy improvements for future classes
5. Specific recommendations for re-teaching certain concepts`;
    let responseLang = "English";

    if (lang === "th") {
      systemRole = "คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลทางการศึกษาที่ทบทวนผลสัมฤทธิ์ของแบบทดสอบของครูในหลายๆ ห้องเรียน/เซสชัน";
      sectionsInstruction = `โปรดระบุหัวข้อต่อไปนี้เป็นภาษาไทย:
1. แนวโน้มโดยรวมของเซสชันทั้งหมด (ดีขึ้น, แย่ลง, คงที่)
2. แนวคิดหรือหัวข้อใดที่เป็นเรื่องยากสากลสำหรับนักเรียนทุกๆ ห้องเรียน/เซสชัน
3. ห้องเรียน/เซสชันใดทำคะแนนได้ดีที่สุดและเป็นเพราะเหตุใด (วิเคราะห์สมมติฐาน)
4. แนวทางการปรับปรุงการจัดหลักสูตรหรือกลยุทธ์การสอนในอนาคต 3-5 ข้อ
5. คำแนะนำเฉพาะเจาะจงสำหรับการนำหัวข้อบางข้อกลับมาสอนซ้ำ`;
      responseLang = "ภาษาไทย (Thai)";
    } else if (lang === "ja") {
      systemRole = "あなたは複数のクラス/ルームにおける教師のクイズ結果を分析する教育データ専門家です。";
      sectionsInstruction = `日本語で以下の分析を提供してください：
1. セッション全体の傾向（改善、低下、一定）
2. すべてのクラス/セッションで共通して難しいと思われる具体的な概念
3. どのセッション/クラスが最高のパフォーマンスを示したかとその理由（仮説）
4. 将来の授業のための3〜5のカリキュラムまたは指導戦略の改善点
5. 特定の概念を再指導するための具体的な推奨事項`;
      responseLang = "日本語 (Japanese)";
    }

    const prompt = `${systemRole}
Analyze the cross-session results:

Quiz: "${quizTitle}"
Number of sessions: ${sessions.length}

Session Summaries:
${sessionLines}

Cross-Session Question Analysis:
${qLines || "  (no question data)"}

${sectionsInstruction}

IMPORTANT CRITICAL INSTRUCTION: You MUST write your entire response, headings, analysis, and recommendations in ${responseLang}. Do not use English for headings or summaries if the target language is different. Focus on actionable insights for curriculum improvement.`;

    await streamOllamaSSE(res, prompt);
  } catch (err) {
    console.error("[session-history] ai-cross-session error:", err);
    fail(res, err.message, 500);
  }
});

module.exports = router;
