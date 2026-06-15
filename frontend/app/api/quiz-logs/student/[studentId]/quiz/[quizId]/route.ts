// ─────────────────────────────────────────────────────────────────
//  app/api/quiz-logs/student/[studentId]/quiz/[quizId]/route.ts
//
//  GET /api/quiz-logs/student/:studentId/quiz/:quizId
//      → latest interaction log for a student on a given quiz
//
//  Proxies to the Express backend so the client never needs the raw
//  backend URL. Without this route Next.js returns its HTML 404 page,
//  which breaks `res.json()` on the result screen.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string; quizId: string }> }
) {
  try {
    const { studentId, quizId } = await params;
    const res  = await fetch(
      `${BACKEND}/api/quiz-logs/student/${encodeURIComponent(studentId)}/quiz/${encodeURIComponent(quizId)}`
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[/api/quiz-logs/student/:studentId/quiz/:quizId GET] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch student log", details: err.message },
      { status: 500 }
    );
  }
}
