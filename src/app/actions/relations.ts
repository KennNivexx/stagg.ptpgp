"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

// ── Complaints ────────────────────────────────────────────────────────────────

export async function getComplaints() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data || []) as Array<Record<string, unknown>>;
}

export async function submitComplaint(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  let employeeId = (formData.get("employee_id") as string || "").trim();
  
  // Non-HRD users can only submit for themselves
  if (user.role === "employee" || user.role === "department_manager") {
    employeeId = user.id;
  }
  if (!employeeId) return { error: "ID karyawan wajib diisi." };

  const subject = (formData.get("subject") as string || "").trim();
  const category = (formData.get("category") as string || "Umum").trim();
  const description = (formData.get("description") as string || "").trim();
  if (!subject || !description) return { error: "Subjek dan deskripsi wajib diisi." };

  const { data: emp } = await supabaseAdmin.from("employees").select("full_name").eq("id", employeeId).maybeSingle();
  const { error } = await supabaseAdmin.from("complaints").insert({
    employee_id: employeeId,
    employee_name: (emp as Record<string, unknown>)?.full_name as string || user.name || "",
    employee_email: user.email,
    subject, category, description, status: "Diajukan",
    created_at: new Date().toISOString(),
  });
  if (error) { console.error("[relations] submitComplaint error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/complaints");
  return { success: true };
}

export async function updateComplaintStatus(id: string, status: string, notes = "") {
  const user = await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("complaints").update({
    status, notes, resolved_by: user.name || user.email,
    resolved_at: status === "Selesai" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) { console.error("[relations] updateComplaintStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/complaints");
  return { success: true };
}

// ── Resignations ──────────────────────────────────────────────────────────────

export async function getResignations() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("resignations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data || []) as Array<Record<string, unknown>>;
}

export async function submitResignation(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  let employeeId = (formData.get("employee_id") as string || "").trim();
  
  // Non-HRD users can only submit for themselves
  if (user.role === "employee" || user.role === "department_manager") {
    employeeId = user.id;
  }
  if (!employeeId) return { error: "ID karyawan wajib diisi." };

  const lastDay = (formData.get("last_day") as string || "").trim();
  const reason = (formData.get("reason") as string || "").trim();
  const notes = (formData.get("notes") as string || "").trim();
  if (!lastDay || !reason) return { error: "Tanggal terakhir bekerja dan alasan wajib diisi." };

  const { data: emp } = await supabaseAdmin.from("employees").select("full_name, email").eq("id", employeeId).maybeSingle();
  const { error } = await supabaseAdmin.from("resignations").insert({
    employee_id: employeeId,
    employee_name: (emp as Record<string, unknown>)?.full_name as string || user.name || "",
    employee_email: (emp as Record<string, unknown>)?.email as string || user.email,
    last_day: lastDay, reason, notes, status: "Diajukan",
    created_at: new Date().toISOString(),
  });
  if (error) { console.error("[relations] submitResignation error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/resignations");
  return { success: true };
}

// ── Surveys ───────────────────────────────────────────────────────────────────

export async function getSurveys() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("employee_surveys").select("*").order("created_at", { ascending: false }).limit(50);
  return (data || []) as Array<Record<string, unknown>>;
}

export async function createSurvey(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const surveyType = (formData.get("survey_type") as string || "").trim();
  const questions = (formData.get("questions") as string || "").trim();
  const startDate = (formData.get("start_date") as string || "").trim() || null;
  const endDate = (formData.get("end_date") as string || "").trim() || null;
  if (!title || !surveyType || !questions) return { error: "Judul, tipe, dan pertanyaan wajib diisi." };
  const { error } = await supabaseAdmin.from("employee_surveys").insert({
    id: "srv-" + crypto.randomUUID(), title, survey_type: surveyType,
    questions, start_date: startDate, end_date: endDate, status: "Aktif",
    created_by: user.name || user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260625_employee_surveys.sql terlebih dahulu." };
  if (error) { console.error("[relations] createSurvey error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/surveys");
  return { success: true };
}

export async function updateResignationStatus(id: string, status: string) {
  const user = await requireRole("hrd", "superadmin");
  const updateData: Record<string, unknown> = {
    status, reviewed_by: user.name || user.email,
    reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  if (status === "Disetujui") {
    const { data: res } = await supabaseAdmin.from("resignations").select("employee_id, last_day").eq("id", id).maybeSingle();
    if (res) {
      const r = res as Record<string, unknown>;
      await supabaseAdmin.from("employees").update({ status: "Resigned" }).eq("id", r.employee_id as string);
    }
  }
  const { error } = await supabaseAdmin.from("resignations").update(updateData).eq("id", id);
  if (error) { console.error("[relations] updateResignationStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/resignations");
  revalidatePath("/hrd/employees");
  return { success: true };
}
