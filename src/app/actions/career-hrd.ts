"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

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
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/career/mutations");
  return { success: true };
}

export async function updateMutationStatus(id: string, status: "Disetujui" | "Ditolak") {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("career_mutations").update({ status }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL." };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/career/mutations");
  return { success: true };
}

// ── PROMOTIONS ─────────────────────────────────────────────────────────────

export async function getPromotions() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("career_promotions")
    .select("*, employees!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function submitPromotion(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const fromPosition = (formData.get("from_position") as string || "").trim();
  const toPosition = (formData.get("to_position") as string || "").trim();
  const effectiveDate = (formData.get("effective_date") as string) || null;
  const reason = (formData.get("reason") as string || "").trim() || null;
  if (!employeeId || !toPosition) return { error: "Karyawan dan posisi tujuan wajib diisi." };
  const { error } = await supabaseAdmin.from("career_promotions").insert({
    id: "prm-" + crypto.randomUUID(),
    employee_id: employeeId, from_position: fromPosition, to_position: toPosition,
    effective_date: effectiveDate || null, reason, status: "Menunggu",
    requested_by: user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/career/promotions");
  return { success: true };
}

export async function updatePromotionStatus(id: string, status: "Disetujui" | "Ditolak") {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("career_promotions").update({ status }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL." };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/career/promotions");
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
  if (error) return { error: "Gagal: " + error.message };
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
  await requireRole("hrd", "superadmin");
  const name = (formData.get("name") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const level = (formData.get("level") as string || "").trim();
  if (!name || !department || !level) return { error: "Nama posisi, departemen, dan level wajib diisi." };
  const arr = new Uint16Array(2);
  crypto.getRandomValues(arr);
  const major = (arr[0] % 9) + 1;
  const minor = (arr[1] % 9000) + 1000;
  const code = `${major}.${minor}`;
  const { error } = await supabaseAdmin.from("positions").insert({
    id: "pos-" + crypto.randomUUID(), code, name, department, level,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "23505") return { error: `Posisi "${name}" atau kode sudah ada. Coba lagi.` };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/career/path");
  return { success: true };
}
