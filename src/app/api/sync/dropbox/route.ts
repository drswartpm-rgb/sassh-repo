import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/lib/sync-utils";

export const maxDuration = 300; // 5 minutes for Vercel

export async function GET(req: NextRequest) {
  // Vercel Cron sends this header automatically
  const isVercelCron =
    req.headers.get("x-vercel-cron") === process.env.CRON_SECRET;

  // Also allow manual trigger with bearer token
  const authHeader = req.headers.get("authorization");
  const isBearer =
    authHeader === `Bearer ${process.env.SYNC_API_SECRET}` &&
    !!process.env.SYNC_API_SECRET;

  if (!isVercelCron && !isBearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runSync();
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    console.error("Sync failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
