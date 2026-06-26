import { supabaseAdmin } from "@/lib/supabase";

/**
 * Permanently delete employee accounts whose approved resignation has passed its
 * 24-hour deletion deadline (`resignations.delete_at`).
 *
 * There is no cron in this environment, so this runs lazily — called on login
 * attempts and on the notification poll. It is safe to call frequently: when no
 * account is due it performs a single cheap SELECT and returns.
 *
 * A person may exist in BOTH `users` and `employees` with the same email but
 * different ids (see dual-table identity), so deletion is keyed on email and
 * sweeps every candidate id for face data.
 */
export async function purgeExpiredResignedAccounts(): Promise<number> {
  try {
    const now = new Date().toISOString();
    const { data: due, error } = await supabaseAdmin
      .from("resignations")
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
          supabaseAdmin.from("employees").select("id").eq("email", email).maybeSingle(),
          supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle(),
        ]);
        const e = emp as Record<string, unknown> | null;
        const u = usr as Record<string, unknown> | null;
        if (e?.id) ids.add(e.id as string);
        if (u?.id) ids.add(u.id as string);
      }

      // Permanently delete the account + biometric data.
      if (ids.size > 0) {
        await supabaseAdmin.from("employee_faces").delete().in("employee_id", [...ids]);
      }
      if (email) {
        await supabaseAdmin.from("employees").delete().eq("email", email);
        await supabaseAdmin.from("users").delete().eq("email", email);
      } else if (empId) {
        await supabaseAdmin.from("employees").delete().eq("id", empId);
      }

      // Clear delete_at so this resignation is not processed again.
      await supabaseAdmin.from("resignations").update({ delete_at: null }).eq("id", row.id as string);
      purged++;
    }
    return purged;
  } catch (e) {
    console.error("[account-purge] error:", (e as Error).message);
    return 0;
  }
}
