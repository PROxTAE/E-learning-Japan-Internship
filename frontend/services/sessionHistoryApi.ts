/**
 * sessionHistoryApi.ts — Session History REST client + streaming AI
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

export interface SessionSummary {
  id: string;
  sessionId: string;
  sessionLabel: string;
  startedAt: string;
  endedAt: string;
  stats: {
    totalStudents: number;
    averageScore: number;
    completionPercentage: number;
    correctAnswers?: number;
    totalAnswers?: number;
  };
  studentCount: number;
}

export interface StudentResult {
  studentId: string;
  name: string;
  score: number;
  scorePercent: number;
  progress: number;
  joinedAt?: string;
}

export interface AnswerResult {
  studentId: string;
  questionId: string;
  choiceId: string;
  choiceText: string;
  isCorrect: boolean;
  responseTime: number;
  confusionLevel: "none" | "low" | "high";
  changeCount: number;
  submittedAt?: string;
}

export interface QuestionStat {
  questionId: string;
  questionText: string;
  order: number;
  answerCount: number;
  correctCount: number;
  correctPercent: number;
  avgResponseTime: number;
  confusionCount: number;
  choices: { choiceId: string; choiceText: string; count: number }[];
}

export interface SessionDetail {
  id: string;
  sessionId: string;
  sessionLabel: string;
  quizId: string;
  startedAt: string;
  endedAt: string;
  stats: SessionSummary["stats"];
  students: StudentResult[];
  answers: AnswerResult[];
  questionStats: QuestionStat[];
  quiz?: { title: string; subject?: string; chapter?: string };
}

export interface AggregateData {
  sessions: SessionSummary[];
  questionAggregate: {
    questionId: string;
    questionText: string;
    order: number;
    sessions: {
      sessionId: string;
      sessionLabel: string;
      correctPercent: number;
      avgResponseTime: number;
      confusionCount: number;
      answerCount: number;
    }[];
  }[];
}

// ── Session List ──────────────────────────────────────────────────────────────

async function listSessions(quizId: string): Promise<SessionSummary[]> {
  const res = await fetch(`${BASE_URL}/api/session-history/quiz/${quizId}`);
  if (!res.ok) throw new Error("Failed to load sessions");
  const body = await res.json();
  return body.data ?? [];
}

async function listAllSessions(): Promise<(SessionSummary & { quizId: string; quizTitle?: string; quizEmoji?: string; quizGradient?: string })[]> {
  const res = await fetch(`${BASE_URL}/api/session-history/all`);
  if (!res.ok) throw new Error("Failed to load all sessions");
  const body = await res.json();
  return body.data ?? [];
}

// ── Session Detail ────────────────────────────────────────────────────────────

async function getSession(sessionResultId: string): Promise<SessionDetail> {
  const res = await fetch(`${BASE_URL}/api/session-history/${sessionResultId}`);
  if (!res.ok) throw new Error("Failed to load session detail");
  const body = await res.json();
  return body.data;
}

// ── Update Label ──────────────────────────────────────────────────────────────

async function updateLabel(sessionResultId: string, sessionLabel: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/session-history/${sessionResultId}/label`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionLabel }),
  });
  if (!res.ok) throw new Error("Failed to update label");
}

// ── Cross-Session Aggregate ───────────────────────────────────────────────────

async function getAggregate(quizId: string): Promise<AggregateData> {
  const res = await fetch(`${BASE_URL}/api/session-history/quiz/${quizId}/aggregate`);
  if (!res.ok) throw new Error("Failed to load aggregate data");
  const body = await res.json();
  return body.data;
}

// ── AI Summary (Streaming SSE) ────────────────────────────────────────────────

/**
 * Streams AI class summary. Calls `onToken` for each streamed token, `onDone` when finished.
 */
function streamAiSummary(
  sessionResultId: string,
  lang: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): () => void {
  const ctrl = new AbortController();

  fetch(`${BASE_URL}/api/session-history/${sessionResultId}/ai-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lang }),
    signal: ctrl.signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) { onError("AI service error"); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.token) onToken(parsed.token);
          if (parsed.done)  onDone();
          if (parsed.error) onError(parsed.error);
        } catch { /* ignore */ }
      }
    }
    onDone();
  }).catch((err) => {
    if (err.name !== "AbortError") onError(err.message);
  });

  return () => ctrl.abort();
}

/**
 * Streams AI per-student analysis.
 */
function streamAiStudent(
  sessionResultId: string,
  studentId: string,
  lang: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): () => void {
  const ctrl = new AbortController();

  fetch(`${BASE_URL}/api/session-history/${sessionResultId}/ai-student/${studentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lang }),
    signal: ctrl.signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) { onError("AI service error"); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.token) onToken(parsed.token);
          if (parsed.done)  onDone();
          if (parsed.error) onError(parsed.error);
        } catch { /* ignore */ }
      }
    }
    onDone();
  }).catch((err) => {
    if (err.name !== "AbortError") onError(err.message);
  });

  return () => ctrl.abort();
}

/**
 * Streams AI cross-session analysis.
 */
function streamAiCrossSession(
  quizId: string,
  lang: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): () => void {
  const ctrl = new AbortController();

  fetch(`${BASE_URL}/api/session-history/quiz/${quizId}/ai-cross-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lang }),
    signal: ctrl.signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) { onError("AI service error"); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.token) onToken(parsed.token);
          if (parsed.done)  onDone();
          if (parsed.error) onError(parsed.error);
        } catch { /* ignore */ }
      }
    }
    onDone();
  }).catch((err) => {
    if (err.name !== "AbortError") onError(err.message);
  });

  return () => ctrl.abort();
}

async function deleteSession(sessionResultId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/session-history/${sessionResultId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete session");
}

export const sessionHistoryApi = {
  listSessions,
  listAllSessions,
  getSession,
  updateLabel,
  deleteSession,
  getAggregate,
  streamAiSummary,
  streamAiStudent,
  streamAiCrossSession,
};

