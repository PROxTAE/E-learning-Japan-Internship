// ─────────────────────────────────────────────────────────────────
//  app/api/quiz-logs/[logId]/route.ts
//
//  GET /api/quiz-logs/:logId         → full log detail
//  (also handles /api/quiz-logs/student/:sid/quiz/:qid via backend)
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://150.15.79.45:5000";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await params;
    const res  = await fetch(`${BACKEND}/api/quiz-logs/${logId}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[/api/quiz-logs/:logId GET] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch log", details: err.message },
      { status: 500 }
    );
  }
}
