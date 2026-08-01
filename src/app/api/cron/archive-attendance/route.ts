import { NextRequest, NextResponse } from "next/server";
import { archiveYesterdayAttendance } from "@/lib/attendance-archive";

export async function POST(request: NextRequest) {
  try {
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
  } catch (e) {
    console.error("[cron/archive-attendance] Error:", e);
    return NextResponse.json({ error: "Gagal mengarsipkan absensi." }, { status: 500 });
  }
}
