// ─────────────────────────────────────────────────────────────────
//  app/api/analyze-quiz-log/route.ts
//
//  POST /api/analyze-quiz-log
//
//  Body: { logId?: string, log?: QuizInteractionLogPayload, lang?: string }
//
//  Fetches the log (if logId given) or uses the log object directly,
//  builds a structured LLM prompt, and calls local Ollama to generate
//  personalised learning recommendations for the student.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

const BACKEND      = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";
const OLLAMA_URL   = process.env.OLLAMA_HOST  || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "";

/** Auto-detect the first available Ollama model */
async function detectModel(): Promise<string> {
  if (OLLAMA_MODEL) return OLLAMA_MODEL;
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    if (r.ok) {
      const d = await r.json();
      if (d.models?.[0]?.name) return d.models[0].name;
    }
  } catch { /* Ollama not running */ }
  return "gemma2:9b";
}

/** Build the analysis system + user prompt from a log payload */
function buildAnalysisPrompt(log: any, lang: string): string {
  const langName = lang === "th" ? "Thai" : lang === "ja" ? "Japanese" : "English";
  const { session_metadata, answer_logs, summary } = log;

  // Summarise the per-question results in a compact text block for the LLM
  const questionSummary = answer_logs
    .map((q: any) => {
      const result = q.is_correct ? "✅ Correct" : "❌ Wrong";
      const confused = q.is_confused ? " (showed hesitation / changed answer)" : "";
      const timeNote = q.time_spent_seconds < 6 ? " [answered very quickly]" : "";
      return `Q${q.question_index}: "${q.question_text}" → ${result}${confused}${timeNote}. Time: ${q.time_spent_seconds}s`;
    })
    .join("\n");

  return `
You are an expert learning coach embedded in an E-Learning platform. 
Analyse the following quiz interaction log for a student and provide **personalised, actionable recommendations**.

IMPORTANT: Respond ONLY in ${langName}. Keep your response well-structured with clear sections.

---
Student: ${session_metadata.student_name}
Quiz: ${session_metadata.quiz_title}
Score: ${summary.total_score} / ${summary.full_score}
Total time: ${summary.completion_time_seconds}s
Confusion rate: ${Math.round(summary.average_confusion_rate * 100)}% of questions (student hesitated or changed answer)

Per-question breakdown:
${questionSummary}
---

Please provide:
1. **Overall Assessment** (2-3 sentences about the student's performance)
2. **Strengths** (what the student clearly understood)
3. **Weak Areas / Topics to Review** (specific questions or concepts that need work, especially confused + wrong answers)
4. **Concrete Study Recommendations** (specific, actionable next steps)
5. **Encouragement** (a motivating closing message)

Keep the tone friendly, supportive, and educational.
`.trim();
}

export async function POST(req: Request) {
  try {
    const { logId, log: logBody, lang = "en" } = await req.json();

    // 1. Resolve the log payload
    let logData = logBody;
    if (!logData && logId) {
      const r = await fetch(`${BACKEND}/api/quiz-logs/${logId}`);
      const d = await r.json();
      if (!r.ok || !d.success) {
        return NextResponse.json(
          { success: false, message: "Log not found" },
          { status: 404 }
        );
      }
      logData = d.data;
    }

    if (!logData) {
      return NextResponse.json(
        { success: false, message: "Provide either logId or log payload" },
        { status: 400 }
      );
    }

    // 2. Build prompt
    const userPrompt = buildAnalysisPrompt(logData, lang);
    const model      = await detectModel();

    // 3. Call Ollama
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature: 0.6 },
        messages: [
          {
            role: "system",
            content:
              "You are a helpful, empathetic learning coach. Provide structured, actionable feedback based on quiz performance data.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      return NextResponse.json(
        { success: false, message: `Ollama error: ${errText}` },
        { status: 500 }
      );
    }

    const ollamaData = await ollamaRes.json();
    const analysis   = ollamaData.message?.content || "";

    return NextResponse.json({ success: true, data: { analysis, model } });
  } catch (err: any) {
    console.error("[/api/analyze-quiz-log] error:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          "Could not analyse the quiz log. Please check if Ollama is running.",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
