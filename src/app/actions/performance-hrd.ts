"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function saveKpiEvaluation(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const period = (formData.get("period") as string || "").trim();
  const scoreRaw = formData.get("score") as string || "0";
  const comments = (formData.get("comments") as string || "").trim() || null;
  if (!employeeId || !period) return { error: "Karyawan dan periode wajib diisi." };
  const score = Math.max(0, Math.min(100, parseInt(scoreRaw, 10) || 0));
  const { data: existing } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("period", period)
    .maybeSingle();
  if (existing) {
    const { error } = await supabaseAdmin
      .from("kpi_evaluations")
      .update({ score, comments, status: "Draft", updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: "Gagal memperbarui: " + error.message };
  } else {
    const { error } = await supabaseAdmin.from("kpi_evaluations").insert({
      id: "kpi-" + crypto.randomUUID(), employee_id: employeeId, period,
      score, comments, status: "Draft",
      evaluator_id: user.email, created_at: new Date().toISOString(),
    });
    if (error) return { error: "Gagal menyimpan: " + error.message };
  }
  revalidatePath("/hrd/performance/kpi");
  revalidatePath("/hrd/performance/reviews");
  return { success: true };
}

export async function saveOkr(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const department = (formData.get("department") as string || "").trim();
  const period = (formData.get("period") as string || "").trim();
  const objective = (formData.get("objective") as string || "").trim();
  const keyResults = (formData.get("key_results") as string || "").trim();
  if (!department || !objective) return { error: "Departemen dan objective wajib diisi." };
  const { error } = await supabaseAdmin.from("okr_objectives").insert({
    id: "okr-" + crypto.randomUUID(), department,
    period: period || null, objective,
    key_results: keyResults || null, progress: 0, status: "On Track",
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/performance/okr");
  return { success: true };
}

export async function getKpiDetail(id: string) {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("*, employees!inner(full_name, department, position)")
    .eq("id", id)
    .maybeSingle();
  return data || null;
}
