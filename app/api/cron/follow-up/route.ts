import { NextRequest, NextResponse } from "next/server";
import { processFollowUpEvents } from "@/lib/data";
import { isAuthorizedCronRequest } from "@/lib/cron/authorize";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Only Vercel Cron, with the configured CRON_SECRET, may trigger the follow-up run.
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processFollowUpEvents();

  return NextResponse.json({
    ok: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
