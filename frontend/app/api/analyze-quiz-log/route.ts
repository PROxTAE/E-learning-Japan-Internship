// ─────────────────────────────────────────────────────────────────
//  app/api/analyze-quiz-log/route.ts
//
//  POST /api/analyze-quiz-log
//  Body: { logId?: string, log?: QuizInteractionLogPayload, lang?: string }
//
//  Generates personalised learning recommendations from a quiz log.
//
//  Built to survive a "thundering herd" of ~20 students clicking
//  "Analyse with AI" at the same moment:
//
//    1. CACHE   — if this log+language was analysed before, the cached
//                 text is streamed back instantly (no Ollama call).
//    2. QUEUE   — a semaphore caps how many generations hit Ollama at
//                 once (AI_MAX_CONCURRENCY, default 2). Students who wait
//                 receive live "queue position" frames.
//    3. STREAM  — tokens are streamed to the browser as they arrive.
//
//  Wire format: newline-delimited JSON (NDJSON). Each line is one frame:
//    {"type":"meta","model":string,"cached":boolean}
//    {"type":"queue","position":number}
//    {"type":"token","text":string}
//    {"type":"error","message":string}
//    {"type":"done"}
//
//  Fresh generations are persisted to the backend so later views hit cache.
// ─────────────────────────────────────────────────────────────────

import { buildAnalysisPrompt } from "./prompt";

export const runtime = "nodejs";

const BACKEND      = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";
const OLLAMA_URL   = process.env.OLLAMA_HOST  || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "";
// One local Ollama with a small model serves best with low parallelism.
// Default 1 → requests form a clear queue (raise via env on stronger hardware).
const MAX_CONCURRENCY = Number(process.env.AI_MAX_CONCURRENCY || 1);

// ── Async semaphore with live queue-position notifications ─────────
interface Waiter { resolve: () => void; notify?: (pos: number) => void; }
class Semaphore {
  private active = 0;
  private waiters: Waiter[] = [];
  constructor(private max: number) {}

  /** Acquire a slot. `notify(pos)` fires with the 1-based queue position
   *  on entry and again whenever the position improves. pos 0 = running. */
  async acquire(notify?: (pos: number) => void): Promise<void> {
    if (this.active < this.max) { this.active++; return; }
    await new Promise<void>((resolve) => {
      this.waiters.push({ resolve, notify });
      notify?.(this.waiters.length);
    });
    this.active++;
  }

  release(): void {
    this.active--;
    const next = this.waiters.shift();
    if (next) next.resolve();
    // Tell everyone still waiting their new (improved) position.
    this.waiters.forEach((w, i) => w.notify?.(i + 1));
  }
}

// Persist across hot reloads in dev via globalThis
const g = globalThis as any;
const aiSemaphore: Semaphore = g.__aiSemaphore || (g.__aiSemaphore = new Semaphore(MAX_CONCURRENCY));

// ── Auto-detect the first available Ollama model ───────────────────
async function detectModel(): Promise<string> {
  if (OLLAMA_MODEL) return OLLAMA_MODEL;
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) {
      const d = await r.json();
      if (d.models?.[0]?.name) return d.models[0].name;
    }
  } catch { /* Ollama not running */ }
  return "qwen3:4b-instruct";
}

function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const NL = "\n";
const frame = (enc: TextEncoder, obj: any) => enc.encode(JSON.stringify(obj) + NL);

export async function POST(req: Request) {
  let logId: string | undefined;
  let logBody: any;
  let lang = "en";
  try {
    const parsed = await req.json();
    logId   = parsed.logId;
    logBody = parsed.log;
    lang    = parsed.lang || "en";
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const enc = new TextEncoder();

  // ── 1. Cache hit? Stream the stored analysis straight back ────────
  if (logId) {
    try {
      const c = await fetch(`${BACKEND}/api/quiz-logs/${logId}/analysis?lang=${encodeURIComponent(lang)}`);
      if (c.ok) {
        const body = await c.json();
        if (body?.data?.content) {
          return ndjsonStream((controller) => {
            controller.enqueue(frame(enc, { type: "meta", model: body.data.model || "", cached: true }));
            const text: string = body.data.content;
            const size = 48;
            for (let i = 0; i < text.length; i += size) {
              controller.enqueue(frame(enc, { type: "token", text: text.slice(i, i + size) }));
            }
            controller.enqueue(frame(enc, { type: "done" }));
            controller.close();
          });
        }
      }
    } catch { /* fall through to generate */ }
  }

  // ── 2. Resolve the log payload ────────────────────────────────────
  let logData = logBody;
  if (!logData && logId) {
    try {
      const r = await fetch(`${BACKEND}/api/quiz-logs/${logId}`);
      const d = await r.json();
      if (!r.ok || !d.success) return jsonError("Log not found", 404);
      logData = d.data;
    } catch (err: any) {
      return jsonError("Failed to load quiz log: " + err.message, 502);
    }
  }
  if (!logData) return jsonError("Provide either logId or log payload", 400);

  const userPrompt = buildAnalysisPrompt(logData, lang);
  const model = await detectModel();

  // ── 3. Queue (with live position) → stream a fresh generation ─────
  const decoder = new TextDecoder();
  let full = "";
  let released = false;
  const release = () => { if (!released) { released = true; aiSemaphore.release(); } };

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(frame(enc, { type: "meta", model, cached: false }));

      // Wait for a slot, streaming queue-position updates while we wait.
      let lastPos = -1;
      await aiSemaphore.acquire((pos) => {
        if (pos !== lastPos) {
          lastPos = pos;
          try { controller.enqueue(frame(enc, { type: "queue", position: pos })); } catch { /* closed */ }
        }
      });

      // We're running now.
      try { controller.enqueue(frame(enc, { type: "queue", position: 0 })); } catch { /* closed */ }

      let ollamaRes: Response;
      try {
        ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream: true,
            options: { temperature: 0.6 },
            messages: [
              { role: "system", content: "You are a helpful, empathetic learning coach. Provide structured, actionable feedback based on quiz performance data." },
              { role: "user", content: userPrompt },
            ],
          }),
        });
      } catch (err: any) {
        controller.enqueue(frame(enc, { type: "error", message: "Could not reach Ollama. Please check if it is running." }));
        controller.close();
        release();
        return;
      }

      if (!ollamaRes.ok || !ollamaRes.body) {
        const errText = await ollamaRes.text().catch(() => "");
        controller.enqueue(frame(enc, { type: "error", message: `Ollama error: ${errText || ollamaRes.status}` }));
        controller.close();
        release();
        return;
      }

      const reader = ollamaRes.body.getReader();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const obj = JSON.parse(trimmed);
              const token = obj.message?.content || "";
              if (token) {
                full += token;
                controller.enqueue(frame(enc, { type: "token", text: token }));
              }
            } catch { /* ignore partial / non-JSON lines */ }
          }
        }
        controller.enqueue(frame(enc, { type: "done" }));
        controller.close();

        // Persist for future cache hits (best-effort).
        if (logId && full.trim()) {
          fetch(`${BACKEND}/api/quiz-logs/${logId}/analysis`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lang, content: full, model }),
          }).catch(() => {});
        }
      } catch (err) {
        try { controller.error(err); } catch { /* already closed */ }
      } finally {
        release();
      }
    },
    cancel() {
      // Client navigated away / aborted — free the slot.
      release();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // disable proxy buffering so queue frames flush live
      "X-AI-Model": model,
    },
  });
}

// ── Helper: build an NDJSON ReadableStream response ────────────────
function ndjsonStream(fill: (controller: ReadableStreamDefaultController) => void) {
  const stream = new ReadableStream({ start: fill });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
