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

  const { error } = await supabaseAdmin.from("career_transactions").insert({
    id: "ctx-" + crypto.randomUUID(), transaction_type: type, karyawan_id: karyawanId,
    current_jabatan_id: currentJabatanId, current_unit_id: currentUnitId,
    target_jabatan_id: targetJabatanId, target_unit_id: (targetUnit as { id?: string } | null)?.id || null,
    effective_date: effectiveDate, reason, status: "In Review",
    created_at: new Date().toISOString(),
  });
  if (error) { console.error("[career-development] submitCareerTransaction error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
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

export async function decideCareerApproval(id: string, decision: "Approved" | "Rejected", notes = "") {
  await requireRole("hrd", "superadmin", "director");
  const { error } = await supabaseAdmin.from("career_approvals").update({
    status: decision, notes, approved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) { console.error("[career-development] decideCareerApproval error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
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
