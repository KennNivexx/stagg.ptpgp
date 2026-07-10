import { supabaseAdmin } from "@/lib/supabase";
import { auditLog } from "@/lib/audit";

/**
 * Permanently delete employee accounts whose approved resignation has passed its
 * 24-hour deletion deadline (`resignations.delete_at`).
 *
 * Not called automatically on page/login access — only from the
 * /api/cron/purge-resigned-accounts route, meant to be invoked by an external
 * scheduled job. Each deletion is written to audit_logs BEFORE the row is
 * removed, so there is a durable trail of what was deleted and when even
 * though the underlying employee/user rows are gone afterward.
 *
 * A person may exist in BOTH `users` and `employees` with the same email but
 * different ids (see dual-table identity), so deletion is keyed on email and
 * sweeps every candidate id for face data.
 */
export async function purgeExpiredResignedAccounts(): Promise<number> {
  try {
    const now = new Date().toISOString();
    const { data: due, error } = await supabaseAdmin
      .from("pengunduran_diri")
      .select("id, employee_email, employee_id")
      .eq("status", "Disetujui")
      .not("delete_at", "is", null)
      .lte("delete_at", now);

    // delete_at column not migrated yet, or no accounts due — nothing to do.
    if (error || !due || due.length === 0) return 0;

    let purged = 0;
    for (const row of due as Record<string, unknown>[]) {
      const email = (row.employee_email as string | null)?.toLowerCase().trim() || "";
      const empId = (row.employee_id as string | null) || "";

      // Collect every candidate account id for this person (dual-table identity)
      const ids = new Set<string>();
      if (empId) ids.add(empId);
      if (email) {
        const [{ data: emp }, { data: usr }] = await Promise.all([
          supabaseAdmin.from("karyawan").select("id").eq("email", email).maybeSingle(),
          supabaseAdmin.from("pengguna").select("id").eq("email", email).maybeSingle(),
        ]);
        const e = emp as Record<string, unknown> | null;
        const u = usr as Record<string, unknown> | null;
        if (e?.id) ids.add(e.id as string);
        if (u?.id) ids.add(u.id as string);
      }

      // Audit trail BEFORE deletion — the row won't exist to reference afterward.
      await auditLog({
        action: "account.purge_resigned",
        targetId: empId || email || (row.id as string),
        targetName: email || empId,
        performedBy: { id: "system", role: "system", name: "Scheduled Job", email: "system@ptpgp.co.id" },
        detail: `Resignation ${row.id} disetujui, delete_at terlampaui. Menghapus permanen akun (email: ${email || "-"}, employee_id: ${empId || "-"}) beserta data wajah terkait.`,
      });

      // Permanently delete the account + biometric data.
      if (ids.size > 0) {
        await supabaseAdmin.from("data_wajah_karyawan").delete().in("employee_id", [...ids]);
      }
      if (email) {
        await supabaseAdmin.from("karyawan").delete().eq("email", email);
        await supabaseAdmin.from("pengguna").delete().eq("email", email);
      } else if (empId) {
        await supabaseAdmin.from("karyawan").delete().eq("id", empId);
      }

      // Clear delete_at so this resignation is not processed again.
      await supabaseAdmin.from("pengunduran_diri").update({ delete_at: null }).eq("id", row.id as string);
      purged++;
    }
    return purged;
  } catch (e) {
    console.error("[account-purge] error:", (e as Error).message);
    return 0;
  }
}
