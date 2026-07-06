"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

// ── CAREER REQUESTS (lamaran internal & konsultasi karir dari karyawan) ─────

export async function getCareerRequests() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("career_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return (data || []) as Array<Record<string, unknown>>;
}

const CAREER_REQUEST_STATUSES = ["Pending", "Reviewed", "Completed", "Rejected"] as const;
type CareerRequestStatus = (typeof CAREER_REQUEST_STATUSES)[number];

export async function updateCareerRequestStatus(id: string, status: CareerRequestStatus, notes = "") {
  await requireRole("hrd", "superadmin");
  if (!CAREER_REQUEST_STATUSES.includes(status)) return { error: "Status tidak valid." };
  const { error } = await supabaseAdmin.from("career_requests").update({
    status, notes, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) { console.error("[career-hrd] updateCareerRequestStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/requests");
  return { success: true };
}

// ── MUTATIONS ──────────────────────────────────────────────────────────────

export async function getMutations() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("career_mutations")
    .select("*, employees!inner(full_name, position, department)")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function submitMutation(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const fromDepartment = (formData.get("from_department") as string || "").trim();
  const toDepartment = (formData.get("to_department") as string || "").trim();
  const effectiveDate = (formData.get("effective_date") as string) || null;
  const reason = (formData.get("reason") as string || "").trim() || null;
  if (!employeeId || !fromDepartment || !toDepartment)
    return { error: "Karyawan, departemen asal, dan departemen tujuan wajib diisi." };
  const { error } = await supabaseAdmin.from("career_mutations").insert({
    id: "mut-" + crypto.randomUUID(),
    employee_id: employeeId, from_department: fromDepartment, to_department: toDepartment,
    effective_date: effectiveDate || null, reason, status: "Menunggu",
    requested_by: user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[career-hrd] submitMutation error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/mutations");
  return { success: true };
}

export async function updateMutationStatus(id: string, status: "Disetujui" | "Ditolak") {
  await requireRole("hrd", "superadmin");

  if (status === "Disetujui") {
    const { data: mutation, error: fetchError } = await supabaseAdmin
      .from("career_mutations").select("employee_id, to_department").eq("id", id).maybeSingle();
    if (fetchError || !mutation) return { error: "Data mutasi tidak ditemukan." };
    const m = mutation as { employee_id: string; to_department: string };

    // Update the employee record FIRST — only flip the request to "Disetujui"
    // if this actually succeeds, so the request never ends up approved without
    // the department change actually having taken effect.
    const { error: empError } = await supabaseAdmin
      .from("employees").update({ department: m.to_department }).eq("id", m.employee_id);
    if (empError) {
      console.error("[career-hrd] updateMutationStatus employee update error:", empError.message);
      return { error: "Gagal memperbarui data departemen karyawan. Status mutasi tidak diubah." };
    }
  }

  const { error } = await supabaseAdmin.from("career_mutations").update({ status }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL." };
  if (error) { console.error("[career-hrd] updateMutationStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/mutations");
  revalidatePath("/hrd/employees");
  return { success: true };
}

// ── PROMOTIONS ─────────────────────────────────────────────────────────────

export async function getPromotions() {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data } = await supabaseAdmin
    .from("career_promotions")
    .select("*, employees!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function submitPromotion(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const fromPosition = (formData.get("from_position") as string || "").trim();
  const toPosition = (formData.get("to_position") as string || "").trim();
  const effectiveDate = (formData.get("effective_date") as string) || null;
  const reason = (formData.get("reason") as string || "").trim() || null;
  const criteria = (formData.get("criteria") as string || "").trim() || null;
  if (!employeeId || !toPosition) return { error: "Karyawan dan posisi tujuan wajib diisi." };
  const { error } = await supabaseAdmin.from("career_promotions").insert({
    id: "prm-" + crypto.randomUUID(),
    employee_id: employeeId, from_position: fromPosition, to_position: toPosition,
    effective_date: effectiveDate || null, reason, criteria, status: "Menunggu",
    requested_by: user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[career-hrd] submitPromotion error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/promotions");
  return { success: true };
}

export async function updatePromotionStatus(id: string, status: "Disetujui" | "Ditolak") {
  await requireRole("hrd", "superadmin", "department_manager");

  if (status === "Disetujui") {
    const { data: promotion, error: fetchError } = await supabaseAdmin
      .from("career_promotions").select("employee_id, to_position").eq("id", id).maybeSingle();
    if (fetchError || !promotion) return { error: "Data promosi tidak ditemukan." };
    const p = promotion as { employee_id: string; to_position: string };

    // Update the employee record FIRST — only flip the request to "Disetujui"
    // if this actually succeeds, so the request never ends up approved without
    // the position change actually having taken effect.
    const { error: empError } = await supabaseAdmin
      .from("employees").update({ position: p.to_position }).eq("id", p.employee_id);
    if (empError) {
      console.error("[career-hrd] updatePromotionStatus employee update error:", empError.message);
      return { error: "Gagal memperbarui data jabatan karyawan. Status promosi tidak diubah." };
    }
  }

  const { error } = await supabaseAdmin.from("career_promotions").update({ status }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL." };
  if (error) { console.error("[career-hrd] updatePromotionStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/promotions");
  revalidatePath("/hrd/employees");
  return { success: true };
}

// ── DEVELOPMENT PLANS ──────────────────────────────────────────────────────

export async function getDevelopmentPlans() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("development_plans")
    .select("*, employees!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function createDevelopmentPlan(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const goals = (formData.get("goals") as string || "").trim();
  const trainings = (formData.get("trainings") as string || "").trim() || null;
  const timeline = (formData.get("timeline") as string || "").trim() || null;
  const mentor = (formData.get("mentor") as string || "").trim() || null;
  if (!employeeId || !goals) return { error: "Karyawan dan tujuan pengembangan wajib diisi." };
  const { error } = await supabaseAdmin.from("development_plans").insert({
    id: "dp-" + crypto.randomUUID(), employee_id: employeeId,
    goals, trainings, timeline, mentor, progress: 0, status: "Aktif",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[career-hrd] createDevelopmentPlan error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/plans");
  return { success: true };
}

export async function updatePlanProgress(id: string, progress: number) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("development_plans")
    .update({ progress: Math.max(0, Math.min(100, progress)), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Gagal memperbarui progres." };
  revalidatePath("/hrd/career/plans");
  return { success: true };
}

// ── CAREER PATH ────────────────────────────────────────────────────────────

export async function addCareerPathPosition(formData: FormData) {
  await requireRole("hrd", "superadmin", "department_manager");
  const name = (formData.get("name") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const level = (formData.get("level") as string || "").trim();
  const code = (formData.get("code") as string || "").trim() || null;
  if (!name || !department || !level) return { error: "Nama posisi, departemen, level, dan kode wajib diisi." };
  const positionCode = code || `${department.substring(0, 3).toUpperCase()}-${Date.now().toString(36)}`;
  const { error } = await supabaseAdmin.from("positions").insert({
    id: "pos-" + crypto.randomUUID(), code: positionCode, name, department, level,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "23505") return { error: `Posisi "${name}" atau kode sudah ada. Coba lagi.` };
  if (error) { console.error("[career-hrd] addCareerPathPosition error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/path");
  return { success: true };
}
