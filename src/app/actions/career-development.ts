"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

/** Career Development & Succession — master data + engine tables introduced
 * in 20260720001/20260721001/20260722001. Menu items in hrd-menu.ts under
 * "Career Development" reference these; this file is the single actions
 * source so every one of those pages has real data instead of 404ing. */

// ── MASTER DATA (read-only lookups, seeded in 20260720001) ─────────────────

export async function getCareerFrameworks() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("career_frameworks").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getCareerStreams() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("career_streams").select("*").order("code");
  return data || [];
}

export async function getCareerLevels() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("career_levels").select("*").order("urutan");
  return data || [];
}

export async function getPromotionPolicies() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("promotion_policies").select("*, grade_jabatan(nama)").order("created_at", { ascending: false });
  return data || [];
}

export async function getMutationPolicies() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("mutation_policies").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getRotationPolicies() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("rotation_policies").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getSuccessionPolicies() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("succession_policies").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getLeadershipFrameworks() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("leadership_frameworks").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getTalentClassifications() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("talent_classifications").select("*").order("performance_min", { ascending: false });
  return data || [];
}

export async function getCareerScoreFormulas() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("career_score_formulas").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getCareerReadinessRules() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("career_readiness_rules").select("*").order("urutan");
  return data || [];
}

// ── TALENT MANAGEMENT ────────────────────────────────────────────────────

export async function getTalentPool() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("talent_pools")
    .select("*, karyawan!talent_pools_karyawan_id_fkey(full_name, department, position), target:jabatan!talent_pools_target_jabatan_id_fkey(name)")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getTalentReviews() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("talent_reviews")
    .select("*, karyawan!talent_reviews_karyawan_id_fkey(full_name, department, position), talent_classifications(name, color_code)")
    .order("review_date", { ascending: false });
  return data || [];
}

export async function getLeadershipPipeline() {
  await requireRole("hrd", "superadmin");
  // Leadership pipeline = talent pool entries targeting a Manager-and-above
  // jabatan, cross-referenced with their latest talent review classification.
  const { data } = await supabaseAdmin
    .from("talent_pools")
    .select("*, karyawan!talent_pools_karyawan_id_fkey(full_name, department, position), target:jabatan!talent_pools_target_jabatan_id_fkey(name, level)")
    .in("status", ["Ready", "Development"])
    .order("created_at", { ascending: false });
  return (data || []).filter((r) => {
    const level = (r as { target?: { level?: string } }).target?.level;
    return level && ["Manager", "General Manager", "Direktur", "Direktur Utama"].includes(level);
  });
}

// ── CAREER DEVELOPMENT (per-employee) ───────────────────────────────────

export async function getCareerProfiles() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("career_profiles")
    .select("*, karyawan!inner(full_name, department, position), career_streams(name), career_levels(name), target:jabatan!career_profiles_target_jabatan_id_fkey(name)")
    .order("updated_at", { ascending: false });
  return data || [];
}

export async function getCareerAssessments() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("career_assessments")
    .select("*, karyawan!inner(full_name, department, position), career_readiness_rules(category_name, color_code)")
    .order("assessment_date", { ascending: false });
  return data || [];
}

export async function getCareerRecommendations() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("career_recommendations")
    .select("*, karyawan!inner(full_name, department, position), target:jabatan!career_recommendations_target_jabatan_id_fkey(name)")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function updateRecommendationStatus(id: string, status: "Approved" | "Rejected" | "Executed") {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("career_recommendations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) { console.error("[career-development] updateRecommendationStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/recommendation");
  return { success: true };
}

export async function getIdpList() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("individual_development_plans")
    .select("*, karyawan!inner(full_name, department, position), idp_items(id, activity_type, description, status, target_date)")
    .order("created_at", { ascending: false });
  return data || [];
}

// ── Career Score computation (real data, no fabrication) ──────────────────
// career_assessments/talent_reviews previously only held one-time seed rows —
// nothing ever recomputed final_career_score/potential_score. This computes
// them from real signals actually available in this schema: performance
// (evaluasi_kpi), competency (kompetensi_karyawan), learning (peserta_pelatihan
// completion), attendance (absensi), and tenure (karyawan.join_date). Spec
// dimensions with no real data source in this schema (skills, leadership,
// discipline, innovation, assessment center) are left null rather than
// invented, and weights are renormalized across only the computed dimensions.
async function computeRealScoreComponents(karyawanId: string) {
  const [{ data: emp }, { data: kpiRows }, { data: compRows }, { data: trainingRows }, { data: attRows }] = await Promise.all([
    supabaseAdmin.from("karyawan").select("join_date").eq("id", karyawanId).maybeSingle(),
    supabaseAdmin.from("evaluasi_kpi").select("final_score, score, created_at").eq("employee_id", karyawanId).order("created_at", { ascending: false }).limit(1),
    supabaseAdmin.from("kompetensi_karyawan").select("current_level").eq("employee_id", karyawanId),
    supabaseAdmin.from("peserta_pelatihan").select("status").eq("employee_id", karyawanId),
    supabaseAdmin.from("absensi").select("status").eq("employee_id", karyawanId).order("date", { ascending: false }).limit(60),
  ]);

  const kpi = (kpiRows || [])[0] as { final_score?: number; score?: number } | undefined;
  const performance_score = kpi ? (kpi.final_score ?? kpi.score ?? null) : null;

  const levels = ((compRows || []) as { current_level: number }[]).map(r => r.current_level).filter(v => v != null);
  const competency_score = levels.length ? Math.round((levels.reduce((s, v) => s + v, 0) / levels.length) * 20) : null;

  const trainings = (trainingRows || []) as { status: string }[];
  const learning_score = trainings.length
    ? Math.round((trainings.filter(t => ["Selesai", "Completed", "Lulus"].includes(t.status)).length / trainings.length) * 100)
    : null;

  const attendance = (attRows || []) as { status: string }[];
  const attendance_score = attendance.length
    ? Math.round((attendance.filter(a => a.status === "Hadir").length / attendance.length) * 100)
    : null;

  const joinDate = (emp as { join_date?: string } | null)?.join_date;
  const experience_score = joinDate
    ? Math.min(100, Math.round((((Date.now() - new Date(joinDate).getTime()) / (365.25 * 24 * 3600 * 1000)) / 10) * 100))
    : null;

  return { performance_score, competency_score, learning_score, attendance_score, experience_score };
}

function weightedAverage(components: Record<string, number | null>, weights: Record<string, number>): number | null {
  let sum = 0, totalWeight = 0;
  for (const [key, value] of Object.entries(components)) {
    if (value == null) continue;
    const w = weights[key] ?? 0;
    sum += value * w;
    totalWeight += w;
  }
  if (totalWeight === 0) {
    // No formula weights matched any computed dimension — fall back to a
    // plain average of whatever real components exist, not a fabricated 0.
    const vals = Object.values(components).filter((v): v is number => v != null);
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
  }
  return Math.round(sum / totalWeight);
}

export async function computeCareerAssessment(karyawanId: string, period: string): Promise<{ error: string } | { success: true; finalScore: number | null }> {
  await requireRole("hrd", "superadmin");
  const c = await computeRealScoreComponents(karyawanId);

  const { data: formulaRows } = await supabaseAdmin.from("career_score_formulas").select("*").order("created_at", { ascending: false }).limit(1);
  const formula = (formulaRows || [])[0] as Record<string, number> | undefined;
  const weights = {
    performance_score: formula?.performance_weight_pct ?? 25,
    competency_score: formula?.competency_weight_pct ?? 20,
    learning_score: formula?.learning_weight_pct ?? 10,
    attendance_score: formula?.attendance_weight_pct ?? 5,
    experience_score: formula?.experience_weight_pct ?? 5,
  };
  const finalScore = weightedAverage(c, weights);

  let readinessRuleId: string | null = null;
  if (finalScore != null) {
    const { data: rules } = await supabaseAdmin.from("career_readiness_rules").select("id, min_score, max_score").order("urutan");
    const match = ((rules || []) as { id: string; min_score: number; max_score: number }[])
      .find(r => finalScore >= r.min_score && finalScore <= r.max_score);
    readinessRuleId = match?.id || null;
  }

  const { data: existing } = await supabaseAdmin.from("career_assessments").select("id").eq("karyawan_id", karyawanId).eq("period", period).maybeSingle();
  const { error } = await supabaseAdmin.from("career_assessments").upsert({
    id: (existing as { id: string } | null)?.id || ("ca-" + crypto.randomUUID()),
    karyawan_id: karyawanId, period,
    performance_score: c.performance_score, competency_score: c.competency_score,
    learning_score: c.learning_score, attendance_score: c.attendance_score, experience_score: c.experience_score,
    final_career_score: finalScore, readiness_rule_id: readinessRuleId,
    assessment_date: new Date().toISOString().split("T")[0],
  }, { onConflict: "karyawan_id,period" });
  if (error) { console.error("[career-development] computeCareerAssessment error:", error.message); return { error: "Gagal menghitung career score." }; }

  revalidatePath("/hrd/career/assessment");
  return { success: true, finalScore };
}

export async function recomputeAllCareerAssessments(period: string): Promise<{ error: string } | { success: true; count: number }> {
  await requireRole("hrd", "superadmin");
  const { data: employees } = await supabaseAdmin.from("karyawan").select("id").neq("status", "Inactive");
  const ids = ((employees || []) as { id: string }[]).map(e => e.id);
  let count = 0;
  for (const id of ids) {
    const res = await computeCareerAssessment(id, period);
    if ("success" in res) count++;
  }
  revalidatePath("/hrd/career/assessment");
  return { success: true, count };
}

// ── 9-Box Talent Matrix (real data — performance x potential, no Math.random) ──
export async function getNineBoxData() {
  await requireRole("hrd", "superadmin");
  const { data: employees } = await supabaseAdmin.from("karyawan").select("id, full_name, department").neq("status", "Inactive");
  const emps = (employees || []) as { id: string; full_name: string; department: string }[];

  const results = await Promise.all(emps.map(async (e) => {
    const c = await computeRealScoreComponents(e.id);
    const performance = c.performance_score;
    // Potential = growth-oriented signals (competency, learning, tenure) —
    // distinct from raw output (performance), matching the 9-box's two axes.
    const potential = weightedAverage(
      { competency_score: c.competency_score, learning_score: c.learning_score, experience_score: c.experience_score },
      { competency_score: 50, learning_score: 30, experience_score: 20 }
    );
    return { id: e.id, full_name: e.full_name, department: e.department, performance, potential };
  }));

  const bucket = (score: number | null) => score == null ? null : score >= 80 ? 2 : score >= 60 ? 1 : 0;
  const cells: Record<string, { count: number; employees: { id: string; full_name: string; department: string }[] }> = {};
  for (let x = 0; x <= 2; x++) for (let y = 0; y <= 2; y++) cells[`${x},${y}`] = { count: 0, employees: [] };

  let unscored = 0;
  for (const r of results) {
    const x = bucket(r.performance);
    const y = bucket(r.potential);
    if (x == null || y == null) { unscored++; continue; }
    const key = `${x},${y}`;
    cells[key].count++;
    cells[key].employees.push({ id: r.id, full_name: r.full_name, department: r.department });
  }
  return { cells, unscored, totalScored: results.length - unscored };
}

// ── CAREER SIMULATION / HISTORY / ANALYTICS (derived, no new tables) ──────

export async function getCareerHistory() {
  await requireRole("hrd", "superadmin");
  // Real cross-table history: promosi_karir + mutasi_karir combined chronologically.
  const [{ data: promotions }, { data: mutations }] = await Promise.all([
    supabaseAdmin.from("promosi_karir").select("*, karyawan!inner(full_name, department)").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("mutasi_karir").select("*, karyawan!inner(full_name, department)").is("review_type", null).order("created_at", { ascending: false }).limit(100),
  ]);
  const combined = [
    ...(promotions || []).map((p) => ({ type: "Promosi" as const, ...p })),
    ...(mutations || []).map((m) => ({ type: "Mutasi" as const, ...m })),
  ];
  return combined.sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
}

export async function getCareerAnalytics() {
  await requireRole("hrd", "superadmin");
  const [
    { count: readyForPromotion },
    { count: highPotential },
    { count: criticalPositions },
    { data: successionPlans },
    { data: assessments },
    { count: promotionsThisYear },
    { count: mutationsThisYear },
  ] = await Promise.all([
    supabaseAdmin.from("career_assessments").select("*", { count: "exact", head: true }).gte("final_career_score", 80),
    supabaseAdmin.from("talent_reviews").select("*", { count: "exact", head: true }).gte("potential_score", 85),
    supabaseAdmin.from("critical_positions").select("*", { count: "exact", head: true }).eq("status", "Active"),
    supabaseAdmin.from("succession_plans").select("readiness_status"),
    supabaseAdmin.from("career_assessments").select("final_career_score"),
    supabaseAdmin.from("promosi_karir").select("*", { count: "exact", head: true }).gte("created_at", `${new Date().getFullYear()}-01-01`),
    supabaseAdmin.from("mutasi_karir").select("*", { count: "exact", head: true }).is("review_type", null).gte("created_at", `${new Date().getFullYear()}-01-01`),
  ]);
  const plans = (successionPlans || []) as { readiness_status: string }[];
  const readyNow = plans.filter((p) => p.readiness_status === "Ready Now").length;
  const successionReadinessPct = plans.length > 0 ? Math.round((readyNow / plans.length) * 100) : 0;
  const scores = (assessments || []) as { final_career_score: number }[];
  const avgCareerScore = scores.length > 0 ? Math.round((scores.reduce((s, r) => s + (r.final_career_score || 0), 0) / scores.length) * 10) / 10 : 0;
  return {
    readyForPromotion: readyForPromotion || 0,
    highPotential: highPotential || 0,
    criticalPositions: criticalPositions || 0,
    successionReadinessPct,
    avgCareerScore,
    promotionsThisYear: promotionsThisYear || 0,
    mutationsThisYear: mutationsThisYear || 0,
  };
}

// ── TRANSACTIONS (career_transactions table) ────────────────────────────

const TRANSACTION_TYPES = ["Promotion", "Mutation", "Rotation", "Demotion", "Acting Assignment", "Temporary Assignment", "Succession Assignment"] as const;
export type CareerTransactionType = (typeof TRANSACTION_TYPES)[number];

export async function getCareerTransactions(type: CareerTransactionType) {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("career_transactions")
    .select("*, karyawan!inner(full_name, department, position), from:jabatan!career_transactions_current_jabatan_id_fkey(name), to:jabatan!career_transactions_target_jabatan_id_fkey(name)")
    .eq("transaction_type", type)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function submitCareerTransaction(formData: FormData) {
  await requireRole("hrd", "superadmin", "department_manager");
  const type = (formData.get("transaction_type") as string || "").trim() as CareerTransactionType;
  const karyawanId = (formData.get("karyawan_id") as string || "").trim();
  const targetJabatanId = (formData.get("target_jabatan_id") as string || "").trim();
  const effectiveDate = (formData.get("effective_date") as string || "").trim();
  const reason = (formData.get("reason") as string || "").trim() || null;
  if (!TRANSACTION_TYPES.includes(type)) return { error: "Jenis transaksi tidak valid." };
  if (!karyawanId || !targetJabatanId || !effectiveDate) return { error: "Karyawan, jabatan tujuan, dan tanggal efektif wajib diisi." };

  const { data: emp } = await supabaseAdmin.from("karyawan").select("formasi_id").eq("id", karyawanId).maybeSingle();
  let currentJabatanId: string | null = null;
  let currentUnitId: string | null = null;
  if ((emp as { formasi_id?: string } | null)?.formasi_id) {
    const { data: formasi } = await supabaseAdmin.from("formasi_jabatan").select("jabatan_id, unit_organisasi_id").eq("id", (emp as { formasi_id: string }).formasi_id).maybeSingle();
    const f = formasi as { jabatan_id?: string; unit_organisasi_id?: string } | null;
    currentJabatanId = f?.jabatan_id || null;
    currentUnitId = f?.unit_organisasi_id || null;
  }

  const { data: targetJabatan } = await supabaseAdmin.from("jabatan").select("department").eq("id", targetJabatanId).maybeSingle();
  const { data: targetUnit } = await supabaseAdmin.from("unit_organisasi").select("id").eq("name", (targetJabatan as { department?: string } | null)?.department || "").maybeSingle();

  const transactionId = "ctx-" + crypto.randomUUID();
  const { error } = await supabaseAdmin.from("career_transactions").insert({
    id: transactionId, transaction_type: type, karyawan_id: karyawanId,
    current_jabatan_id: currentJabatanId, current_unit_id: currentUnitId,
    target_jabatan_id: targetJabatanId, target_unit_id: (targetUnit as { id?: string } | null)?.id || null,
    effective_date: effectiveDate, reason, status: "In Review",
    created_at: new Date().toISOString(),
  });
  if (error) { console.error("[career-development] submitCareerTransaction error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  // Every new transaction needs its own approval chain — without this, only
  // seed-data transactions ever had approval steps, and decideCareerApproval
  // had nothing to gate for anything created through this form.
  await supabaseAdmin.from("career_approvals").insert([
    { id: "capp-" + crypto.randomUUID(), transaction_id: transactionId, step_number: 1, approver_role: "Department Head", status: "Pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "capp-" + crypto.randomUUID(), transaction_id: transactionId, step_number: 2, approver_role: "Career Committee", status: "Pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);

  revalidatePath("/hrd/career/transactions");
  return { success: true };
}

// ── APPROVALS (career_approvals routed via its parent career_transactions'
//    transaction_type — the table itself has no "category" column). ─────

const APPROVAL_TYPE_MAP: Record<string, CareerTransactionType> = {
  promotion: "Promotion",
  mutation: "Mutation",
  succession: "Succession Assignment",
};

export async function getCareerApprovals(category: "promotion" | "mutation" | "succession") {
  await requireRole("hrd", "superadmin", "director");
  const type = APPROVAL_TYPE_MAP[category];
  const { data } = await supabaseAdmin
    .from("career_approvals")
    .select("*, career_transactions!inner(transaction_type, karyawan_id, effective_date, reason, karyawan!inner(full_name, department))")
    .eq("career_transactions.transaction_type", type)
    .order("created_at", { ascending: false });
  return data || [];
}

/** Career Committee approval step — routed by approver_role rather than
 * transaction type, since committee review can apply to any transaction. */
export async function getCareerCommitteeApprovals() {
  await requireRole("hrd", "superadmin", "director");
  const { data } = await supabaseAdmin
    .from("career_approvals")
    .select("*, career_transactions!inner(transaction_type, karyawan_id, effective_date, reason, karyawan!inner(full_name, department))")
    .ilike("approver_role", "%committee%")
    .order("created_at", { ascending: false });
  return data || [];
}

// Maps the spec's named approval roles onto roles that actually exist in
// this app's auth system (see manpower-approval.ts / recruitment-hiring.ts
// for the same pattern) — no invented "HR Business Partner" account.
const ROLE_FOR_CAREER_APPROVER: Record<string, string[]> = {
  "Department Head": ["department_manager", "hrd", "superadmin"],
  "Division Head": ["department_manager", "hrd", "superadmin"],
  "HR Business Partner": ["hrd", "superadmin"],
  "HR Director": ["director", "hrd", "superadmin"],
  "Finance": ["hrd", "director", "superadmin"],
  "Managing Director": ["director", "superadmin"],
  "Director": ["director", "superadmin"],
  "Career Committee": ["hrd", "director", "superadmin"],
};

/** Applies a fully-approved career_transactions row's effect: updates the
 * employee's position/department, cascades grade/salary via the target
 * jabatan's grade, and reassigns formasi — mirroring the promotion/mutation
 * cascade in career-hrd.ts so approving via THIS workflow isn't a dead-end
 * status change either. */
async function applyCareerTransaction(transactionId: string) {
  const { data: txRow } = await supabaseAdmin.from("career_transactions")
    .select("karyawan_id, target_jabatan_id, target_unit_id").eq("id", transactionId).maybeSingle();
  const tx = txRow as { karyawan_id: string; target_jabatan_id: string | null; target_unit_id: string | null } | null;
  if (!tx?.target_jabatan_id) {
    await supabaseAdmin.from("career_transactions").update({ status: "Approved", updated_at: new Date().toISOString() }).eq("id", transactionId);
    return;
  }

  const { data: targetJabatan } = await supabaseAdmin.from("jabatan").select("name, department, grade_id").eq("id", tx.target_jabatan_id).maybeSingle();
  const jb = targetJabatan as { name?: string; department?: string; grade_id?: string } | null;
  const { data: emp } = await supabaseAdmin.from("karyawan").select("formasi_id").eq("id", tx.karyawan_id).maybeSingle();
  const oldFormasiId = (emp as { formasi_id?: string } | null)?.formasi_id;

  const empUpdate: Record<string, unknown> = {};
  if (jb?.name) empUpdate.position = jb.name;
  if (jb?.department) empUpdate.department = jb.department;

  if (jb?.grade_id) {
    const { data: grade } = await supabaseAdmin.from("grade_jabatan").select("salary_min").eq("id", jb.grade_id).maybeSingle();
    const salaryMin = (grade as { salary_min?: number } | null)?.salary_min;
    if (salaryMin) {
      const { data: existingStruktur } = await supabaseAdmin.from("struktur_gaji").select("id, basic_salary").eq("employee_id", tx.karyawan_id).maybeSingle();
      const s = existingStruktur as { id?: string; basic_salary?: number } | null;
      await supabaseAdmin.from("struktur_gaji").upsert({
        id: s?.id || ("sal-" + crypto.randomUUID()), employee_id: tx.karyawan_id,
        basic_salary: Math.max(s?.basic_salary || 0, salaryMin), updated_at: new Date().toISOString(),
      }, { onConflict: "employee_id" });
    }
  }

  if (tx.target_unit_id) {
    const { data: vacantFormasi } = await supabaseAdmin.from("formasi_jabatan")
      .select("id").eq("jabatan_id", tx.target_jabatan_id).eq("unit_organisasi_id", tx.target_unit_id).eq("status", "Vacant").limit(1).maybeSingle();
    const newFormasiId = (vacantFormasi as { id?: string } | null)?.id;
    if (newFormasiId) {
      if (oldFormasiId) await supabaseAdmin.from("formasi_jabatan").update({ status: "Vacant", karyawan_id: null }).eq("id", oldFormasiId);
      await supabaseAdmin.from("formasi_jabatan").update({ status: "Filled", karyawan_id: tx.karyawan_id }).eq("id", newFormasiId);
      empUpdate.formasi_id = newFormasiId;
    }
  }

  if (Object.keys(empUpdate).length > 0) {
    await supabaseAdmin.from("karyawan").update(empUpdate).eq("id", tx.karyawan_id);
  }
  await supabaseAdmin.from("career_transactions").update({ status: "Approved", updated_at: new Date().toISOString() }).eq("id", transactionId);
}

export async function decideCareerApproval(id: string, decision: "Approved" | "Rejected", notes = "") {
  const { data: stepRow } = await supabaseAdmin.from("career_approvals")
    .select("transaction_id, step_number, approver_role, status").eq("id", id).maybeSingle();
  const step = stepRow as { transaction_id: string; step_number: number; approver_role: string; status: string } | null;
  if (!step) return { error: "Tahap approval tidak ditemukan." };
  if (step.status !== "Pending") return { error: `Tahap ini sudah diputuskan sebelumnya (${step.status}).` };

  const allowedRoles = ROLE_FOR_CAREER_APPROVER[step.approver_role] || ["hrd", "superadmin"];
  const user = await requireRole("hrd", "superadmin", "director", "department_manager");
  if (!allowedRoles.includes(user.role)) {
    return { error: `Hanya role "${step.approver_role}" yang dapat memutuskan tahap ini.` };
  }

  const { data: earlierSteps } = await supabaseAdmin.from("career_approvals")
    .select("step_number, status").eq("transaction_id", step.transaction_id).lt("step_number", step.step_number);
  const blocked = (earlierSteps || []).find(s => s.status !== "Approved");
  if (blocked) return { error: `Tahap sebelumnya (langkah ${blocked.step_number}) belum disetujui.` };

  const { error } = await supabaseAdmin.from("career_approvals").update({
    status: decision, notes, approved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) { console.error("[career-development] decideCareerApproval error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  if (decision === "Rejected") {
    await supabaseAdmin.from("career_transactions").update({ status: "Rejected", updated_at: new Date().toISOString() }).eq("id", step.transaction_id);
    revalidatePath("/hrd/career/approval");
    return { success: true };
  }

  // Was this the last step? If so, apply the transaction's effect for real —
  // otherwise "Approved" transactions never actually changed anything.
  const { data: allSteps } = await supabaseAdmin.from("career_approvals")
    .select("step_number").eq("transaction_id", step.transaction_id).order("step_number", { ascending: false }).limit(1);
  const lastStep = (allSteps || [])[0] as { step_number: number } | undefined;
  if (lastStep && lastStep.step_number === step.step_number) {
    await applyCareerTransaction(step.transaction_id);
  }

  revalidatePath("/hrd/career/approval");
  return { success: true };
}

/** Salary Approval reuses the existing Salary Review flow in rewards.ts
 * (mutasi_karir rows with review_type set) rather than a new table — same
 * underlying feature, this just surfaces it under the Career Development
 * menu where the spec expects it. */
export async function getPendingSalaryApprovals() {
  await requireRole("hrd", "superadmin", "director");
  const { data } = await supabaseAdmin
    .from("mutasi_karir")
    .select("*, karyawan!inner(full_name, department, position)")
    .not("review_type", "is", null)
    .eq("status", "Menunggu")
    .order("created_at", { ascending: false });
  return data || [];
}
