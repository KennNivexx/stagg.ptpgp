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
    if (error) { console.error("[performance-hrd] saveKpiEvaluation update error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  } else {
    const { error } = await supabaseAdmin.from("kpi_evaluations").insert({
      id: "kpi-" + crypto.randomUUID(), employee_id: employeeId, period,
      score, comments, status: "Draft",
      evaluator_id: user.email, created_at: new Date().toISOString(),
    });
    if (error) { console.error("[performance-hrd] saveKpiEvaluation insert error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
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
  if (error) { console.error("[performance-hrd] saveOkr error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
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

export async function saveReadinessAssessment(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const score = Math.max(0, Math.min(100, Math.round(parseFloat(formData.get("score") as string || "0"))));
  if (!employeeId) return { error: "Pilih kandidat terlebih dahulu." };

  const period = `Readiness-${new Date().getFullYear()}`;
  const { data: existing } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("period", period)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from("kpi_evaluations")
      .update({ score, updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id);
    if (error) { console.error("[performance-hrd] saveReadinessAssessment update error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  } else {
    const { error } = await supabaseAdmin.from("kpi_evaluations").insert({
      id: "kpi-" + crypto.randomUUID(), employee_id: employeeId, period,
      score, status: "Final", created_at: new Date().toISOString(),
    });
    if (error) { console.error("[performance-hrd] saveReadinessAssessment insert error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  }

  revalidatePath("/hrd/succession/readiness");
  return { success: true };
}

export async function saveFeedback(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "department_manager", "employee");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const reviewerId = (formData.get("reviewer_id") as string || "").trim();
  const category = (formData.get("category") as string || "").trim();
  const ratingRaw = formData.get("rating") as string || "0";
  const comment = (formData.get("comment") as string || "").trim();

  if (!employeeId || !category) return { error: "Karyawan dan kategori wajib diisi." };
  const rating = Math.max(1, Math.min(5, parseInt(ratingRaw, 10) || 0));
  if (rating === 0) return { error: "Rating wajib dipilih (1–5 bintang)." };

  const { error } = await supabaseAdmin.from("performance_feedback").insert({
    id: "fb-" + crypto.randomUUID(),
    employee_id: employeeId,
    reviewer_id: reviewerId || user.id,
    reviewer_name: user.name || user.email,
    category, rating, comment,
    created_at: new Date().toISOString(),
  });

  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260625_performance_feedback.sql terlebih dahulu." };
  if (error) { console.error("[performance-hrd] saveFeedback error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  revalidatePath("/hrd/performance/feedback");
  return { success: true };
}

export async function getFeedbackHistory() {
  await requireRole("hrd", "superadmin", "department_manager");

  const { data } = await supabaseAdmin
    .from("performance_feedback")
    .select("*, employees!employee_id(full_name, department)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data || []) as Array<Record<string, unknown>>;
}
