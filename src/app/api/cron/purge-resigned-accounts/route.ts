import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredResignedAccounts } from "@/lib/account-purge";

/**
 * Explicit endpoint for permanently deleting resigned-employee accounts whose
 * 24h `delete_at` deadline has passed. Intentionally NOT wired into login or
 * any page load — call this from an external scheduled job (e.g. Supabase
 * Cron, GitHub Actions cron, or any HTTP-capable scheduler) on whatever cadence
 * fits (e.g. every 15-30 minutes).
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

  const purged = await purgeExpiredResignedAccounts();
  return NextResponse.json({ purged });
}
