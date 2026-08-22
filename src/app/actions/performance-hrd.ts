"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

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
  await recomputeFinalScore(employeeId, period);
  revalidatePath("/hrd/performance/kpi");
  revalidatePath("/hrd/performance/reviews");
  revalidatePath("/hrd/performance/reports");
  return { success: true };
}

const KPI_STATUSES = ["Draft", "Reviewed", "Approved"] as const;
type KpiStatus = (typeof KPI_STATUSES)[number];

export async function updateKpiStatus(id: string, status: KpiStatus) {
  const actor = await requireRole("hrd", "superadmin", "department_manager");
  if (!KPI_STATUSES.includes(status)) return { error: "Status tidak valid." };
  const { error } = await supabaseAdmin
    .from("evaluasi_kpi")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { console.error("[performance-hrd] updateKpiStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  await auditLog({ action: "kpi.status_change", targetId: id, performedBy: actor, detail: `Status evaluasi KPI diubah ke "${status}".` });
  revalidatePath("/hrd/performance/kpi");
  revalidatePath("/hrd/performance/reviews");
  revalidatePath("/hrd/performance/reports");
  return { success: true };
}

/**
 * Kepala Departemen penilaian form: returns all karyawan in the department
 * with their KPI catalog entries and framework for assessment.
 */
export async function getDeptEmployeesForAssessment(department: string) {
  await requireRole("department_manager", "hrd", "superadmin");
  const { data } = await supabaseAdmin.from("karyawan")
    .select("id, full_name, kode_jabatan, position, department")
    .eq("department", department)
    .neq("status", "Inactive")
    .order("full_name");
  return data || [];
}

/** Get KPI evaluations with employee kode_jabatan */
export async function getKpiEvaluationsWithJabatan() {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("*, karyawan!inner(full_name, kode_jabatan, department, position)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function getKpiDetail(id: string) {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("*, karyawan!inner(full_name, department, position, kode_jabatan)")
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
  const budayaId = (formData.get("budaya_id") as string || "").trim() || null;
  const reviewerRole = (formData.get("reviewer_role") as string || "").trim() || null;
  const period = (formData.get("period") as string || "").trim() || null;

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
    budaya_id: budayaId, reviewer_role: reviewerRole, period,
    created_at: new Date().toISOString(),
  });

  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260625_performance_feedback.sql terlebih dahulu." };
  if (error) { console.error("[performance-hrd] saveFeedback error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  if (budayaId && period) await recomputeFinalScore(employeeId, period);
  revalidatePath("/hrd/performance/feedback");
  return { success: true };
}

export async function getFeedbackHistory() {
  await requireRole("hrd", "superadmin", "department_manager");

  const { data } = await supabaseAdmin
    .from("umpan_balik_kinerja")
    .select("*, karyawan!employee_id(full_name, kode, kode_jabatan, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data || []) as Array<Record<string, unknown>>;
}

/**
 * Employee Assignment chain: karyawan.formasi_id -> formasi_jabatan.jabatan_id
 * — same resolution pattern as Competency Gap Analysis / Learning TNA / Employee
 * 360 Mandatory Knowledge. Returns null when the employee has no formasi
 * assignment yet (legacy free-text position, not yet migrated).
 */
export async function resolveJabatanId(employeeId: string): Promise<string | null> {
  const { data: emp } = await supabaseAdmin.from("karyawan").select("formasi_id").eq("id", employeeId).maybeSingle();
  const formasiId = (emp as { formasi_id: string | null } | null)?.formasi_id;
  if (!formasiId) return null;
  const { data: formasi } = await supabaseAdmin.from("formasi_jabatan").select("jabatan_id").eq("id", formasiId).maybeSingle();
  return (formasi as { jabatan_id: string } | null)?.jabatan_id || null;
}

// ── KPI Catalog per Jabatan ────────────────────────────────────────────────

export async function getKpiCatalogByJabatan(jabatanId: string) {
  await requireRole("hrd", "superadmin", "department_manager");
  if (!jabatanId) return [];
  const { data } = await supabaseAdmin.from("kpi_jabatan").select("*").eq("jabatan_id", jabatanId).order("urutan", { ascending: true });
  return data || [];
}

export async function saveKpiCatalogEntry(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const jabatanId = (formData.get("jabatan_id") as string || "").trim();
  const namaKpi = (formData.get("nama_kpi") as string || "").trim();
  const sourceSystem = (formData.get("source_system") as string || "").trim() || null;
  const satuan = (formData.get("satuan") as string || "").trim() || null;
  const bobotDefault = Number(formData.get("bobot_default")) || 0;
  if (!jabatanId || !namaKpi) return { error: "Jabatan dan nama KPI wajib diisi." };

  const { error } = await supabaseAdmin.from("kpi_jabatan").insert({
    id: "kpij-" + crypto.randomUUID(), jabatan_id: jabatanId, nama_kpi: namaKpi,
    source_system: sourceSystem, satuan, bobot_default: bobotDefault, aktif: true,
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260717001_performance_management.sql terlebih dahulu." };
  if (error) { console.error("[performance-hrd] saveKpiCatalogEntry error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/performance/framework");
  return { success: true };
}

export async function deleteKpiCatalogEntry(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("kpi_jabatan").delete().eq("id", id);
  if (error) { console.error("[performance-hrd] deleteKpiCatalogEntry error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/performance/framework");
  return { success: true };
}

// ── Core Values (Culture) ──────────────────────────────────────────────────

export async function getBudayaPerusahaan() {
  await requireRole("hrd", "superadmin", "department_manager", "employee");
  const [{ data: budaya }, { data: indikator }] = await Promise.all([
    supabaseAdmin.from("budaya_perusahaan").select("*").order("urutan", { ascending: true }),
    supabaseAdmin.from("behaviour_indicator_budaya").select("*").order("urutan", { ascending: true }),
  ]);
  const indikatorList = (indikator || []) as { id: string; budaya_id: string; deskripsi: string; urutan: number }[];
  return ((budaya || []) as Record<string, unknown>[]).map(b => ({
    ...b,
    indikator: indikatorList.filter(i => i.budaya_id === b.id),
  }));
}

export async function saveBudayaPerusahaan(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const kode = (formData.get("kode") as string || "").trim() || null;
  const nama = (formData.get("nama") as string || "").trim();
  const deskripsi = (formData.get("deskripsi") as string || "").trim() || null;
  const bobotDefault = Number(formData.get("bobot_default")) || 0;
  if (!nama) return { error: "Nama budaya wajib diisi." };

  const { error } = await supabaseAdmin.from("budaya_perusahaan").insert({
    id: "budaya-" + crypto.randomUUID(), kode, nama, deskripsi,
    bobot_default: bobotDefault, aktif: true, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260717001_performance_management.sql terlebih dahulu." };
  if (error) { console.error("[performance-hrd] saveBudayaPerusahaan error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/performance/framework");
  return { success: true };
}

export async function deleteBudayaPerusahaan(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("budaya_perusahaan").delete().eq("id", id);
  if (error) { console.error("[performance-hrd] deleteBudayaPerusahaan error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/performance/framework");
  return { success: true };
}

export async function saveBehaviourIndicator(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const budayaId = (formData.get("budaya_id") as string || "").trim();
  const deskripsi = (formData.get("deskripsi") as string || "").trim();
  if (!budayaId || !deskripsi) return { error: "Budaya dan deskripsi perilaku wajib diisi." };

  const { error } = await supabaseAdmin.from("behaviour_indicator_budaya").insert({
    id: "bhv-" + crypto.randomUUID(), budaya_id: budayaId, deskripsi, created_at: new Date().toISOString(),
  });
  if (error) { console.error("[performance-hrd] saveBehaviourIndicator error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/performance/framework");
  return { success: true };
}

export async function deleteBehaviourIndicator(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("behaviour_indicator_budaya").delete().eq("id", id);
  if (error) { console.error("[performance-hrd] deleteBehaviourIndicator error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/performance/framework");
  return { success: true };
}

// ── Performance Framework (bobot Target Achievement : Culture Achievement) ─

export async function getPerformanceFrameworkList() {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data } = await supabaseAdmin.from("performance_framework").select("*, jabatan(name)").order("created_at", { ascending: false });
  return data || [];
}

/** Resolves per-jabatan weight config, falling back to the global default
 * row (jabatan_id IS NULL), falling back again to a hardcoded 70/30 split
 * when even that hasn't been configured yet — so the feature never hard-fails
 * for un-configured positions. */
export async function getPerformanceFrameworkByJabatan(jabatanId: string | null) {
  await requireRole("hrd", "superadmin", "department_manager");
  if (jabatanId) {
    const { data } = await supabaseAdmin.from("performance_framework").select("*").eq("jabatan_id", jabatanId).eq("aktif", true).maybeSingle();
    if (data) return data as { ta_weight_pct: number; culture_weight_pct: number };
  }
  const { data: def } = await supabaseAdmin.from("performance_framework").select("*").is("jabatan_id", null).eq("aktif", true).maybeSingle();
  if (def) return def as { ta_weight_pct: number; culture_weight_pct: number };
  return { ta_weight_pct: 70, culture_weight_pct: 30 };
}

export async function savePerformanceFramework(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const jabatanId = (formData.get("jabatan_id") as string || "").trim() || null;
  const taWeight = Number(formData.get("ta_weight_pct"));
  const cultureWeight = Number(formData.get("culture_weight_pct"));
  if (!Number.isFinite(taWeight) || !Number.isFinite(cultureWeight) || taWeight < 0 || cultureWeight < 0) {
    return { error: "Bobot harus berupa angka non-negatif." };
  }
  if (Math.round(taWeight + cultureWeight) !== 100) {
    return { error: "Total bobot Target Achievement + Culture Achievement harus 100%." };
  }

  const existingQuery = jabatanId
    ? await supabaseAdmin.from("performance_framework").select("id").eq("jabatan_id", jabatanId).maybeSingle()
    : await supabaseAdmin.from("performance_framework").select("id").is("jabatan_id", null).maybeSingle();

  if (existingQuery.data) {
    const { error } = await supabaseAdmin.from("performance_framework")
      .update({ ta_weight_pct: taWeight, culture_weight_pct: cultureWeight, updated_at: new Date().toISOString() })
      .eq("id", (existingQuery.data as { id: string }).id);
    if (error) { console.error("[performance-hrd] savePerformanceFramework update error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  } else {
    const { error } = await supabaseAdmin.from("performance_framework").insert({
      id: "pf-" + crypto.randomUUID(), jabatan_id: jabatanId,
      ta_weight_pct: taWeight, culture_weight_pct: cultureWeight, aktif: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260717001_performance_management.sql terlebih dahulu." };
    if (error) { console.error("[performance-hrd] savePerformanceFramework insert error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  }
  revalidatePath("/hrd/performance/framework");
  return { success: true };
}

// ── Final Performance Score ────────────────────────────────────────────────

/** Recomputes and persists culture_score/final_score on the employee's
 * evaluasi_kpi row for the given period: resolves the applicable TA:Culture
 * weight split via the jabatan chain, averages culture-tagged feedback
 * ratings (1-5 -> 0-100 scale) for that employee+period, and combines with
 * the existing KPI score. No-ops silently if no evaluasi_kpi row exists yet
 * for that employee+period (nothing to attach the score to). */
export async function recomputeFinalScore(employeeId: string, period: string) {
  // Only ever called internally by saveKpiEvaluation/saveFeedback, both of
  // which already requireRole before reaching here — guarded directly too
  // since this is itself an exported "use server" action and thus callable
  // on its own if its ID ever leaks into a client bundle.
  await requireRole("hrd", "superadmin", "department_manager");
  if (!employeeId || !period) return;

  const { data: kpiRow } = await supabaseAdmin.from("evaluasi_kpi").select("id, score").eq("employee_id", employeeId).eq("period", period).maybeSingle();
  const kpi = kpiRow as { id: string; score: number } | null;
  if (!kpi) return;

  const jabatanId = await resolveJabatanId(employeeId);
  const framework = await getPerformanceFrameworkByJabatan(jabatanId);

  const { data: feedbackRows } = await supabaseAdmin.from("umpan_balik_kinerja").select("rating, budaya_id")
    .eq("employee_id", employeeId).eq("period", period).not("budaya_id", "is", null);
  const rows = (feedbackRows || []) as { rating: number; budaya_id: string }[];

  // Average ratings per core value first (an employee may have multiple
  // feedback entries tagged to the same value), then combine values using
  // each value's configured bobot_default — a flat mean across all feedback
  // silently ignores that weighting (e.g. Integrity 30% vs Teamwork 10%).
  const byValue = new Map<string, number[]>();
  for (const r of rows) {
    if (!byValue.has(r.budaya_id)) byValue.set(r.budaya_id, []);
    byValue.get(r.budaya_id)!.push(r.rating * 20);
  }
  let cultureScore = 0;
  if (byValue.size > 0) {
    const { data: valueRows } = await supabaseAdmin.from("budaya_perusahaan")
      .select("id, bobot_default").in("id", Array.from(byValue.keys()));
    const weights = new Map(((valueRows || []) as { id: string; bobot_default: number | null }[]).map(v => [v.id, v.bobot_default ?? 0]));
    let weightedSum = 0;
    let totalWeight = 0;
    for (const [budayaId, valueRatings] of byValue) {
      const avgForValue = valueRatings.reduce((s, r) => s + r, 0) / valueRatings.length;
      const weight = weights.get(budayaId) || 0;
      weightedSum += avgForValue * weight;
      totalWeight += weight;
    }
    cultureScore = totalWeight > 0
      ? weightedSum / totalWeight
      : Array.from(byValue.values()).flat().reduce((s, r) => s + r, 0) / rows.length;
  }
  const ratings = rows;

  const finalScore = Math.round((kpi.score || 0) * (framework.ta_weight_pct / 100) + cultureScore * (framework.culture_weight_pct / 100));

  await supabaseAdmin.from("evaluasi_kpi").update({
    culture_score: ratings.length ? Math.round(cultureScore) : null,
    final_score: finalScore,
    ta_weight_used: framework.ta_weight_pct,
    culture_weight_used: framework.culture_weight_pct,
  }).eq("id", kpi.id);
}
