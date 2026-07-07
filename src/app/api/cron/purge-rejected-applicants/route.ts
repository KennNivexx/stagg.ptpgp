import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredRejectedApplicants } from "@/lib/applicant-purge";

/**
 * Explicit endpoint for permanently deleting rejected-applicant temp accounts
 * whose 24h grace period has passed. Intentionally NOT wired into login or
 * any page load — call this from an external scheduled job (same convention
 * as /api/cron/purge-resigned-accounts).
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

  const purged = await purgeExpiredRejectedApplicants();
  return NextResponse.json({ purged });
}
