"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export interface KpiMetric { metric: string; weight: number; value: number }

/** Parses the JSON array of {metric, weight, value} rows built by KpiForm.tsx's
 * row-based metrics builder. Returns null if the raw text is empty, or an
 * array (possibly empty if the JSON was malformed/invalid — callers should
 * treat empty as an error). */
function parseKpiMetrics(raw: string): KpiMetric[] | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const parsed: KpiMetric[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const metric = String((item as Record<string, unknown>).metric || "").trim();
    const weight = Number((item as Record<string, unknown>).weight);
    const value = Number((item as Record<string, unknown>).value);
    if (!metric || Number.isNaN(weight) || Number.isNaN(value) || weight <= 0) continue;
    parsed.push({ metric, weight, value });
  }
  return parsed;
}

export async function saveKpiEvaluation(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const period = (formData.get("period") as string || "").trim();
  const scoreRaw = formData.get("score") as string || "0";
  const metricsRaw = (formData.get("metrics") as string || "").trim();
  const comments = (formData.get("comments") as string || "").trim() || null;
  if (!employeeId || !period) return { error: "Karyawan dan periode wajib diisi." };

  let score: number;
  let metrics: KpiMetric[] | null = null;
  if (metricsRaw) {
    const parsedMetrics = parseKpiMetrics(metricsRaw);
    if (!parsedMetrics || parsedMetrics.length === 0) {
      return { error: "Rincian KPI Metrics tidak valid. Pastikan setiap baris memiliki nama metrik dan bobot lebih dari 0." };
    }
    const totalWeight = parsedMetrics.reduce((s, m) => s + m.weight, 0);
    const weightedSum = parsedMetrics.reduce((s, m) => s + m.value * m.weight, 0);
    score = Math.max(0, Math.min(100, Math.round(weightedSum / totalWeight)));
    metrics = parsedMetrics;
  } else {
    score = Math.max(0, Math.min(100, parseInt(scoreRaw, 10) || 0));
  }

  const { data: existing } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("period", period)
    .maybeSingle();
  if (existing) {
    // Don't touch status here — this path is also hit when re-saving an
    // already-Reviewed/Approved evaluation (e.g. editing a comment), and
    // hardcoding "Draft" would silently revert it out of Approved, dropping
    // it from any Approved-gated reports with no warning to the editor.
    const { error } = await supabaseAdmin
      .from("evaluasi_kpi")
      .update({ score, comments, metrics, updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id);
    if (error) { console.error("[performance-hrd] saveKpiEvaluation update error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  } else {
    const { error } = await supabaseAdmin.from("evaluasi_kpi").insert({
      id: "kpi-" + crypto.randomUUID(), employee_id: employeeId, period,
      score, comments, metrics, status: "Draft",
      evaluator_id: user.email, created_at: new Date().toISOString(),
    });
    if (error) { console.error("[performance-hrd] saveKpiEvaluation insert error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  }
  revalidatePath("/hrd/performance/kpi");
  revalidatePath("/hrd/performance/reviews");
  revalidatePath("/hrd/performance/reports");
  return { success: true };
}

const KPI_STATUSES = ["Draft", "Reviewed", "Approved"] as const;
type KpiStatus = (typeof KPI_STATUSES)[number];

export async function updateKpiStatus(id: string, status: KpiStatus) {
  await requireRole("hrd", "superadmin", "department_manager");
  if (!KPI_STATUSES.includes(status)) return { error: "Status tidak valid." };
  const { error } = await supabaseAdmin
    .from("evaluasi_kpi")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { console.error("[performance-hrd] updateKpiStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/performance/kpi");
  revalidatePath("/hrd/performance/reviews");
  revalidatePath("/hrd/performance/reports");
  return { success: true };
}

export async function saveOkr(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const department = (formData.get("department") as string || "").trim();
  const period = (formData.get("period") as string || "").trim();
  const objective = (formData.get("objective") as string || "").trim();
  const keyResults = (formData.get("key_results") as string || "").trim();
  if (!department || !objective) return { error: "Departemen dan objective wajib diisi." };
  const { error } = await supabaseAdmin.from("okr").insert({
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

const OKR_STATUSES = ["On Track", "At Risk", "Behind", "Achieved"] as const;
type OkrStatus = (typeof OKR_STATUSES)[number];

export async function updateOkrProgress(id: string, progress: number, status?: string) {
  await requireRole("hrd", "superadmin", "department_manager");
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    return { error: "Progress harus di antara 0 dan 100." };
  }
  const updateData: Record<string, unknown> = { progress: Math.round(progress) };
  if (status) {
    if (!OKR_STATUSES.includes(status as OkrStatus)) return { error: "Status tidak valid." };
    updateData.status = status;
  } else if (progress >= 100) {
    updateData.status = "Achieved";
  }
  const { error } = await supabaseAdmin.from("okr").update(updateData).eq("id", id);
  if (error) { console.error("[performance-hrd] updateOkrProgress error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/performance/okr");
  return { success: true };
}

export async function getKpiDetail(id: string) {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("*, karyawan!inner(full_name, department, position)")
    .eq("id", id)
    .maybeSingle();
  return data || null;
}

export async function saveFeedback(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "department_manager", "employee");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const reviewerName = (formData.get("reviewer_name") as string || "").trim();
  const category = (formData.get("category") as string || "").trim();
  const ratingRaw = formData.get("rating") as string || "0";
  const comment = (formData.get("comment") as string || "").trim();

  if (!employeeId || !category) return { error: "Karyawan dan kategori wajib diisi." };
  const parsedRating = parseInt(ratingRaw, 10);
  if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
    return { error: "Rating wajib dipilih (1–5 bintang)." };
  }
  const rating = parsedRating;

  const { error } = await supabaseAdmin.from("umpan_balik_kinerja").insert({
    id: "fb-" + crypto.randomUUID(),
    employee_id: employeeId,
    reviewer_id: user.id,
    reviewer_name: reviewerName || user.name || user.email,
    category, rating, comment,
    created_at: new Date().toISOString(),
  });

  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260625_performance_feedback.sql terlebih dahulu." };
  if (error) { console.error("[performance-hrd] saveFeedback error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  revalidatePath("/hrd/performance/feedback");
  return { success: true };
}

export async function getFeedbackHistory() {
  await requireRole("hrd", "superadmin", "department_manager");

  const { data } = await supabaseAdmin
    .from("umpan_balik_kinerja")
    .select("*, karyawan!employee_id(full_name, kode, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data || []) as Array<Record<string, unknown>>;
}
