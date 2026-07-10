/**
 * Shared leave-submission logic, callable both by the "use server" submitLeave
 * action (web UI, gated by requireRole) and the WhatsApp bot path (gated by
 * wa_number match instead of a cookie session). Deliberately NOT exported from
 * a "use server" file — a plain lib export here can only be called from other
 * server-side code, never directly invoked by a client.
 */
import { supabaseAdmin } from "@/lib/supabase";

const uid = () => crypto.randomUUID();

export async function submitLeaveForEmployee(params: {
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
}): Promise<{ error: string } | { success: true }> {
  const { employeeId, employeeEmail, employeeName, type, start_date, end_date, reason } = params;

  if (!type || !start_date || !end_date) return { error: "Tipe cuti, mulai, dan selesai wajib diisi." };
  if (new Date(end_date) < new Date(start_date)) return { error: "Tanggal selesai harus setelah tanggal mulai." };

  const { data: emp } = await supabaseAdmin.from("karyawan").select("full_name, department").eq("email", employeeEmail).maybeSingle();

  const { error } = await supabaseAdmin.from("pengajuan_cuti").insert({
    id: uid(), employee_id: employeeId, employee_name: emp?.full_name || employeeName,
    department: emp?.department || "", type, start_date, end_date, reason, status: "Pending",
  });
  if (error) return { error: "Gagal mengajukan cuti." };

  await supabaseAdmin.from("notifikasi").insert({
    id: uid(), user_email: "hrd@ptpgp.co.id",
    title: "Pengajuan Cuti Baru",
    message: `${emp?.full_name || employeeName} mengajukan ${type} (${start_date} - ${end_date})`,
    link: "/hrd/leaves",
  });

  return { success: true };
}
