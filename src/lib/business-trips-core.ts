/**
 * Shared "Perjalanan Dinas" (business trip) submission logic — same pattern
 * as leaves-core.ts (submitLeaveForEmployee): a plain lib export, not a "use
 * server" export, so it's only reachable from other server-side code.
 */
import { supabaseAdmin } from "@/lib/supabase";

const uid = () => crypto.randomUUID();

export async function submitBusinessTripForEmployee(params: {
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  destination: string;
  start_date: string;
  end_date: string;
  reason: string;
  estimasi_biaya?: number | null;
}): Promise<{ error: string } | { success: true }> {
  const { employeeId, employeeEmail, employeeName, destination, start_date, end_date, reason, estimasi_biaya } = params;

  if (!destination || !start_date || !end_date) return { error: "Tujuan, tanggal mulai, dan tanggal selesai wajib diisi." };
  if (new Date(end_date) < new Date(start_date)) return { error: "Tanggal selesai harus setelah tanggal mulai." };

  const { data: emp } = await supabaseAdmin.from("karyawan").select("full_name, department").eq("email", employeeEmail).maybeSingle();

  const { error } = await supabaseAdmin.from("perjalanan_dinas").insert({
    id: uid(),
    employee_id: employeeId,
    employee_name: emp?.full_name || employeeName,
    department: emp?.department || "",
    destination,
    start_date,
    end_date,
    reason,
    // Optional — lets this trip's cost contribute to getFinancialSummary()
    // once approved. Nullable since most historical/existing trips never
    // had a cost estimate and shouldn't be forced to invent one.
    estimasi_biaya: estimasi_biaya ?? null,
    status: "Pending",
  });
  if (error) return { error: "Gagal mengajukan perjalanan dinas." };

  await supabaseAdmin.from("notifikasi").insert({
    id: uid(),
    user_email: "hrd@ptpgp.co.id",
    title: "Pengajuan Perjalanan Dinas Baru",
    message: `${emp?.full_name || employeeName} mengajukan dinas ke ${destination} (${start_date} - ${end_date})`,
    link: "/hrd/attendance",
  });

  return { success: true };
}
