// ─────────────────────────────────────────────────────────────────
//  prompt.ts — builds the LLM analysis prompt from a quiz log payload
// ─────────────────────────────────────────────────────────────────

/** Build the analysis user prompt from a quiz interaction log. */
export function buildAnalysisPrompt(log: any, lang: string): string {
  const langName = lang === "th" ? "Thai" : lang === "ja" ? "Japanese" : "English";
  const { session_metadata, answer_logs, summary } = log;

  // Compact per-question summary for the LLM.
  const questionSummary = (answer_logs || [])
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
