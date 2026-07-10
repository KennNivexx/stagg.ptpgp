import { supabaseAdmin } from "@/lib/supabase";

/**
 * Snapshots yesterday's attendance rows into attendance_archives (one row per
 * day, full JSONB payload) then deletes the source rows — attendance is meant
 * to be edit-proof for the day it happens, but shouldn't grow unbounded once
 * the day is over. Idempotent: re-running for a day already archived just
 * skips it (unique constraint on archive_date).
 */
export async function archiveYesterdayAttendance(): Promise<{ archived: number; date: string } | { skipped: true; date: string }> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const { data: existing } = await supabaseAdmin
    .from("arsip_absensi")
    .select("id")
    .eq("archive_date", dateStr)
    .maybeSingle();
  if (existing) return { skipped: true, date: dateStr };

  const { data: rows, error } = await supabaseAdmin.from("absensi").select("*").eq("date", dateStr);
  if (error) {
    console.error("[attendance-archive] fetch error:", error.message);
    return { skipped: true, date: dateStr };
  }
  if (!rows || rows.length === 0) return { archived: 0, date: dateStr };

  const { error: insertErr } = await supabaseAdmin.from("arsip_absensi").insert({
    id: "att-arch-" + dateStr,
    archive_date: dateStr,
    record_count: rows.length,
    records: rows,
  });
  if (insertErr) {
    console.error("[attendance-archive] insert error:", insertErr.message);
    return { skipped: true, date: dateStr };
  }

  const ids = rows.map((r: { id: string }) => r.id);
  const { error: deleteErr } = await supabaseAdmin.from("absensi").delete().in("id", ids);
  if (deleteErr) {
    console.error("[attendance-archive] delete error:", deleteErr.message);
  }

  return { archived: rows.length, date: dateStr };
}
