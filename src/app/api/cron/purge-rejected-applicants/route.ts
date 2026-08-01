import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredRejectedApplicants } from "@/lib/applicant-purge";

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

    const purged = await purgeExpiredRejectedApplicants();
    return NextResponse.json({ purged });
  } catch (e) {
    console.error("[cron/purge-applicants] Error:", e);
    return NextResponse.json({ error: "Gagal membersihkan akun pelamar." }, { status: 500 });
  }
}
