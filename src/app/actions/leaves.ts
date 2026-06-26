"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => crypto.randomUUID();

export async function submitLeave(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const type = (formData.get("type") as string || "").trim();
  const start_date = (formData.get("start_date") as string || "").trim();
  const end_date = (formData.get("end_date") as string || "").trim();
  const reason = (formData.get("reason") as string || "").trim();

  if (!type || !start_date || !end_date) return { error: "Tipe cuti, mulai, dan selesai wajib diisi." };
  if (new Date(end_date) < new Date(start_date)) return { error: "Tanggal selesai harus setelah tanggal mulai." };

  const { data: emp } = await supabaseAdmin.from("employees").select("full_name, department").eq("email", user.email).maybeSingle();

  const { error } = await supabaseAdmin.from("leave_requests").insert({
    id: uid(), employee_id: user.id, employee_name: emp?.full_name || user.name,
    department: emp?.department || "", type, start_date, end_date, reason, status: "Pending",
  });
  if (error) return { error: "Gagal mengajukan cuti." };

  // Notify HRD
  await supabaseAdmin.from("notifications").insert({
    id: uid(), user_email: "hrd@ptpgp.co.id",
    title: "Pengajuan Cuti Baru",
    message: `${emp?.full_name || user.name} mengajukan ${type} (${start_date} - ${end_date})`,
    link: "/hrd/leaves",
  });

  revalidatePath("/hrd/leaves");
  revalidatePath("/employee");
  return { success: true };
}

export async function updateLeaveStatus(id: string, status: string) {
  const user = await requireRole("hrd", "superadmin");

  const { data: leave } = await supabaseAdmin.from("leave_requests").select("employee_id, employee_name, type, start_date, end_date").eq("id", id).maybeSingle();
  if (!leave) return { error: "Cuti tidak ditemukan." };

  await supabaseAdmin.from("leave_requests").update({ status, approved_by: user.name, updated_at: new Date().toISOString() }).eq("id", id);

  // Notify employee
  const l = leave as Record<string, unknown>;
  const empEmail = await getEmployeeEmail(l.employee_id as string);
  if (empEmail) {
    await supabaseAdmin.from("notifications").insert({
      id: uid(), user_email: empEmail,
      title: `Cuti ${status === "Disetujui" ? "Disetujui" : "Ditolak"}`,
      message: `${l.type} (${l.start_date} - ${l.end_date}) ${status === "Disetujui" ? "telah disetujui" : "ditolak"}.`,
      link: "/employee",
    });
  }

  revalidatePath("/hrd/leaves");
  revalidatePath("/employee");
  return { success: true };
}

async function getEmployeeEmail(employeeId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("employees").select("email").eq("id", employeeId).maybeSingle();
  return (data as Record<string, unknown>)?.email as string || null;
}

export async function getLeaves(params?: { employeeId?: string; status?: string }) {
  const user = await requireRole("hrd", "superadmin", "employee");
  let q = supabaseAdmin.from("leave_requests").select("*").order("created_at", { ascending: false });
  if (user.role === "employee") {
    q = q.eq("employee_id", user.id);
  } else {
    if (params?.employeeId) q = q.eq("employee_id", params.employeeId);
  }
  if (params?.status) q = q.eq("status", params.status);
  const { data } = await q.limit(100);
  return (data || []);
}
