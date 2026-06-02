// ─────────────────────────────────────────────────────────────────
//  app/api/quiz-logs/route.ts
//
//  Next.js API Route — proxies quiz interaction log requests to the
//  Express backend so the client never needs the raw backend URL.
//
//  POST  /api/quiz-logs                               → submit a log
//  GET   /api/quiz-logs?quizId=xxx&studentId=xxx      → list logs
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

// ── POST ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res  = await fetch(`${BACKEND}/api/quiz-logs`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[/api/quiz-logs POST] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to submit quiz log", details: err.message },
      { status: 500 }
    );
  }
}

// ── GET ──────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qs = searchParams.toString();
    const res = await fetch(`${BACKEND}/api/quiz-logs${qs ? `?${qs}` : ""}`, {
      method:  "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[/api/quiz-logs GET] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch quiz logs", details: err.message },
      { status: 500 }
    );
  }
}
