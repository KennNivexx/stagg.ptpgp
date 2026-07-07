import { NextRequest, NextResponse } from "next/server";
import { archiveYesterdayAttendance } from "@/lib/attendance-archive";

/**
 * Explicit endpoint for archiving the previous day's attendance into
 * attendance_archives and clearing the source rows. Intentionally NOT wired
 * into login or any page load — call this from an external scheduled job
 * once a day shortly after midnight (Asia/Jakarta).
 *
 * Requires header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET belum dikonfigurasi di server." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await archiveYesterdayAttendance();
  return NextResponse.json(result);
}
