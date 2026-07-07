import { supabaseAdmin } from "@/lib/supabase";
import { auditLog } from "@/lib/audit";

/**
 * Permanently delete rejected-applicant temp accounts whose 24h grace period
 * (`users.expires_at`, set by rejectApplicant) has passed.
 *
 * Not called automatically on page/login access — only from the
 * /api/cron/purge-rejected-applicants route, meant to be invoked by an
 * external scheduled job. Mirrors the pattern in account-purge.ts
 * (purgeExpiredResignedAccounts) for resigned employees.
 */
export async function purgeExpiredRejectedApplicants(): Promise<number> {
  const now = new Date().toISOString();
  const { data: due, error } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("role", "applicant")
    .not("expires_at", "is", null)
    .lte("expires_at", now);

  if (error || !due || due.length === 0) return 0;

  let purged = 0;
  for (const row of due as Record<string, unknown>[]) {
    const email = (row.email as string | null)?.toLowerCase().trim() || "";
    const userId = row.id as string;

    await auditLog({
      action: "account.purge_rejected_applicant",
      targetId: userId,
      targetName: email,
      performedBy: { id: "system", role: "system", name: "Scheduled Job", email: "system@ptpgp.co.id" },
      detail: `Akun pelamar ditolak (email: ${email || "-"}), masa tenggat 24 jam terlampaui. Menghapus permanen akun sementara.`,
    });

    const { error: delErr } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (!delErr) purged++;
  }

  return purged;
}
