"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { resolveManagerDepartment } from "@/lib/dept-resolve";
import { auditLog } from "@/lib/audit";

/** Employee Relations & Experience — master data + engine tables from
 * 20260724001_employee_relations.sql. Menu items under "Employee Relations"
 * in hrd-menu.ts reference these; this file is the single actions source. */

// ── MASTER DATA (read-only, seeded) ─────────────────────────────────────

export async function getErPolicies() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("er_policies").select("*").order("created_at", { ascending: false });
  return data || [];
}
export async function getCompanyRegulations() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("company_regulations").select("*").order("effective_date", { ascending: false });
  return data || [];
}
export async function getCollectiveAgreements() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("collective_agreements").select("*").order("period_start", { ascending: false });
  return data || [];
}
export async function getCodeOfConducts() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("code_of_conducts").select("*").order("created_at", { ascending: false });
  return data || [];
}
export async function getCommunicationCategories() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("communication_categories").select("*").order("code");
  return data || [];
}
export async function getCaseCategories() {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data } = await supabaseAdmin.from("case_categories").select("*").order("code");
  return data || [];
}
export async function getInvestigationTypes() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("investigation_types").select("*").order("code");
  return data || [];
}
export async function getDisciplinaryCategories() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("disciplinary_categories").select("*").order("code");
  return data || [];
}
export async function getEngagementPrograms() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("engagement_programs").select("*").order("start_date", { ascending: false });
  return data || [];
}
export async function getSurveyTemplates() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("survey_templates").select("*").order("code");
  return data || [];
}
export async function getExitReasons() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("exit_reasons").select("*").order("code");
  return data || [];
}
export async function getAiRecommendationRules() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("ai_recommendation_rules").select("*").order("code");
  return data || [];
}

// ── EMPLOYEE COMMUNICATION ──────────────────────────────────────────────

const COMM_TYPES = ["Announcement", "Memo", "News", "Policy Distribution", "Circular", "Emergency"] as const;
export type CommType = (typeof COMM_TYPES)[number];

export async function getCommunications(type?: CommType) {
  await requireRole("hrd", "superadmin");
  let q = supabaseAdmin.from("communications").select("*").order("published_at", { ascending: false });
  if (type) q = q.eq("comm_type", type);
  const { data } = await q;
  return data || [];
}

export async function submitCommunication(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const type = (formData.get("comm_type") as string || "").trim() as CommType;
  const title = (formData.get("title") as string || "").trim();
  const content = (formData.get("content") as string || "").trim() || null;
  const targetAudience = (formData.get("target_audience") as string || "All Employees").trim();
  if (!COMM_TYPES.includes(type)) return { error: "Jenis komunikasi tidak valid." };
  if (!title) return { error: "Judul wajib diisi." };
  const { error } = await supabaseAdmin.from("communications").insert({
    id: "comm-" + crypto.randomUUID(), comm_type: type, title, content,
    target_audience: targetAudience, published_by: user.email, status: "Published",
    published_at: new Date().toISOString(), created_at: new Date().toISOString(),
  });
  if (error) { console.error("[employee-relations] submitCommunication error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/communication");
  return { success: true };
}

export async function getCommunicationAnalytics() {
  await requireRole("hrd", "superadmin");
  const [{ count: totalComms }, { data: comms }, { count: totalReads }, { count: totalEmployees }] = await Promise.all([
    supabaseAdmin.from("communications").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("communications").select("id, comm_type, title, published_at").order("published_at", { ascending: false }).limit(10),
    supabaseAdmin.from("communication_reads").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }).neq("status", "Inactive"),
  ]);
  const avgReadRate = totalComms && totalComms > 0 && totalEmployees
    ? Math.round(((totalReads || 0) / (totalComms * totalEmployees)) * 1000) / 10
    : 0;
  return { totalComms: totalComms || 0, totalReads: totalReads || 0, avgReadRate, recentComms: comms || [] };
}

// ── EMPLOYEE PARTICIPATION ──────────────────────────────────────────────

const PARTICIPATION_TYPES = ["Suggestion", "Innovation", "Voice of Employee", "Polling", "Feedback", "Satisfaction Survey"] as const;
export type ParticipationType = (typeof PARTICIPATION_TYPES)[number];

export async function getParticipationEntries(type: ParticipationType) {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("participation_entries")
    .select("*, karyawan(full_name, department)")
    .eq("participation_type", type)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function submitParticipationEntry(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const type = (formData.get("participation_type") as string || "").trim() as ParticipationType;
  const karyawanId = (formData.get("karyawan_id") as string || "").trim() || null;
  const title = (formData.get("title") as string || "").trim();
  const description = (formData.get("description") as string || "").trim() || null;
  const scoreRaw = formData.get("score") as string;
  const score = scoreRaw ? Number(scoreRaw) : null;
  if (!PARTICIPATION_TYPES.includes(type)) return { error: "Jenis partisipasi tidak valid." };
  if (!title) return { error: "Judul wajib diisi." };
  const { error } = await supabaseAdmin.from("participation_entries").insert({
    id: "part-" + crypto.randomUUID(), participation_type: type, karyawan_id: karyawanId,
    title, description, score, status: "Submitted", created_at: new Date().toISOString(),
  });
  if (error) { console.error("[employee-relations] submitParticipationEntry error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/participation");
  return { success: true };
}

export async function getParticipationAnalytics() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("participation_entries").select("participation_type, score, status");
  const rows = (data || []) as { participation_type: string; score: number | null; status: string }[];
  const satisfactionScores = rows.filter((r) => r.participation_type === "Satisfaction Survey" && r.score != null).map((r) => r.score as number);
  const avgSatisfaction = satisfactionScores.length > 0 ? Math.round((satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length) * 10) / 10 : 0;
  const enpsScores = rows.filter((r) => r.participation_type === "Polling" && r.score != null).map((r) => r.score as number);
  const avgEnps = enpsScores.length > 0 ? Math.round(enpsScores.reduce((a, b) => a + b, 0) / enpsScores.length) : 0;
  const totalByType: Record<string, number> = {};
  rows.forEach((r) => { totalByType[r.participation_type] = (totalByType[r.participation_type] || 0) + 1; });
  return { avgSatisfaction, avgEnps, totalByType, total: rows.length };
}

// ── EMPLOYEE CASE MANAGEMENT ─────────────────────────────────────────────

const CASE_TYPES = ["Complaint", "Grievance", "Ethics Violation", "Fraud", "Harassment", "Whistleblowing"] as const;
export type CaseType = (typeof CASE_TYPES)[number];
const CASE_WORKFLOW = ["Case Created", "Validation", "Investigation", "Evidence Collection", "Interview", "Committee Review", "Decision", "Corrective Action", "Monitoring", "Case Closed", "Rejected"] as const;

export async function getCases(type?: CaseType) {
  await requireRole("hrd", "superadmin");
  let q = supabaseAdmin.from("employee_cases")
    .select("*, reporter:karyawan!employee_cases_reporter_karyawan_id_fkey(full_name), subject:karyawan!employee_cases_subject_karyawan_id_fkey(full_name, department), pic:karyawan!employee_cases_pic_karyawan_id_fkey(full_name), case_categories(name, severity)")
    .order("created_at", { ascending: false });
  if (type) q = q.eq("case_type", type);
  const { data } = await q;
  return data || [];
}

export async function submitCase(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const type = (formData.get("case_type") as string || "").trim() as CaseType;
  const categoryId = (formData.get("case_category_id") as string || "").trim() || null;
  const subjectKaryawanId = (formData.get("subject_karyawan_id") as string || "").trim() || null;
  const reporterKaryawanId = (formData.get("reporter_karyawan_id") as string || "").trim() || null;
  const picKaryawanId = (formData.get("pic_karyawan_id") as string || "").trim() || null;
  const title = (formData.get("title") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const anonymous = formData.get("anonymous") === "on";
  if (!CASE_TYPES.includes(type)) return { error: "Jenis kasus tidak valid." };
  if (!title || !description) return { error: "Judul dan deskripsi wajib diisi." };

  // A department_manager may only file cases about their own team — without
  // this check they could report on any employee company-wide, which is
  // HRD's/Case Committee's authority, not a line manager's.
  if (user.role === "department_manager" && subjectKaryawanId) {
    const [ownDept, { data: subjectRow }] = await Promise.all([
      resolveManagerDepartment(user.email),
      supabaseAdmin.from("karyawan").select("department").eq("id", subjectKaryawanId).maybeSingle(),
    ]);
    const subjectDept = (subjectRow as { department?: string } | null)?.department;
    if (!ownDept || subjectDept !== ownDept) {
      return { error: "Anda hanya dapat melaporkan kasus untuk karyawan di departemen Anda sendiri." };
    }
  }
  if (user.role === "department_manager" && picKaryawanId) {
    return { error: "Penetapan PIC hanya dapat dilakukan oleh HRD." };
  }

  const category = categoryId ? await supabaseAdmin.from("case_categories").select("sla_days").eq("id", categoryId).maybeSingle() : null;
  const slaDays = (category?.data as { sla_days?: number } | null)?.sla_days || 14;
  const slaDueDate = new Date(); slaDueDate.setDate(slaDueDate.getDate() + slaDays);

  const { error } = await supabaseAdmin.from("employee_cases").insert({
    id: "case-" + crypto.randomUUID(), case_type: type, case_category_id: categoryId,
    reporter_karyawan_id: anonymous ? null : reporterKaryawanId, subject_karyawan_id: subjectKaryawanId,
    pic_karyawan_id: picKaryawanId,
    title, description, status: "Case Created", sla_due_date: slaDueDate.toISOString().split("T")[0],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error) { console.error("[employee-relations] submitCase error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  void user;
  revalidatePath("/hrd/relations/cases");
  revalidatePath("/department/relations/cases");
  return { success: true };
}

/** Kepala Departemen's own case list — cases whose subject employee belongs
 * to their department. Read-only view of workflow/status; only HRD can
 * advance stages or assign PIC (updateCaseStatus/assignCasePic stay
 * hrd/superadmin-only). */
export async function getDeptCases(department: string) {
  await requireRole("department_manager", "hrd", "superadmin");
  if (!department) return [];
  const { data } = await supabaseAdmin.from("employee_cases")
    .select("*, reporter:karyawan!employee_cases_reporter_karyawan_id_fkey(full_name), subject:karyawan!employee_cases_subject_karyawan_id_fkey(full_name, department), pic:karyawan!employee_cases_pic_karyawan_id_fkey(full_name), case_categories(name, severity)")
    .order("created_at", { ascending: false });
  // Filtered client-side (not via a PostgREST embedded-resource filter,
  // which needs an !inner join to work reliably) — acceptable given the
  // low expected case volume.
  return (data || []).filter((c) => (c as { subject?: { department?: string } | null }).subject?.department === department);
}

export async function updateCaseStatus(id: string, status: (typeof CASE_WORKFLOW)[number]) {
  const actor = await requireRole("hrd", "superadmin");
  if (!CASE_WORKFLOW.includes(status)) return { error: "Status tidak valid." };
  const { error } = await supabaseAdmin.from("employee_cases").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) { console.error("[employee-relations] updateCaseStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  await auditLog({ action: "case.status_change", targetId: id, performedBy: actor, detail: `Status kasus diubah ke "${status}".` });
  revalidatePath("/hrd/relations/cases");
  return { success: true };
}

export async function assignCasePic(id: string, picKaryawanId: string) {
  const actor = await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("employee_cases")
    .update({ pic_karyawan_id: picKaryawanId || null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) { console.error("[employee-relations] assignCasePic error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  await auditLog({ action: "case.pic_assign", targetId: id, targetName: picKaryawanId, performedBy: actor, detail: `PIC investigasi ditetapkan.` });
  revalidatePath("/hrd/relations/cases");
  return { success: true };
}

export async function getCasesInStage(stage: "Investigation" | "Corrective Action") {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("employee_cases")
    .select("*, subject:karyawan!employee_cases_subject_karyawan_id_fkey(full_name, department), case_categories(name, severity)")
    .eq("status", stage)
    .order("sla_due_date");
  return data || [];
}

// ── INDUSTRIAL RELATIONS ─────────────────────────────────────────────────

export async function getLabourUnions() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("labour_unions").select("*, karyawan(full_name)").order("created_at", { ascending: false });
  return data || [];
}

const MEETING_TYPES = ["Bipartite", "Tripartite", "Mediation", "Dispute", "PHI Documentation"] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];

export async function getIndustrialMeetings(type: MeetingType) {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("industrial_meetings").select("*").eq("meeting_type", type).order("meeting_date", { ascending: false });
  return data || [];
}

export async function submitIndustrialMeeting(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const type = (formData.get("meeting_type") as string || "").trim() as MeetingType;
  const title = (formData.get("title") as string || "").trim();
  const agenda = (formData.get("agenda") as string || "").trim() || null;
  const meetingDate = (formData.get("meeting_date") as string || "").trim();
  if (!MEETING_TYPES.includes(type)) return { error: "Jenis pertemuan tidak valid." };
  if (!title || !meetingDate) return { error: "Judul dan tanggal wajib diisi." };
  const { error } = await supabaseAdmin.from("industrial_meetings").insert({
    id: "im-" + crypto.randomUUID(), meeting_type: type, title, agenda, meeting_date: meetingDate,
    status: "Scheduled", created_at: new Date().toISOString(),
  });
  if (error) { console.error("[employee-relations] submitIndustrialMeeting error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/industrial");
  return { success: true };
}

export async function getIndustrialCompliance() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("industrial_compliance_items").select("*").order("due_date");
  return data || [];
}

// ── EMPLOYEE SEPARATION ──────────────────────────────────────────────────

const SEPARATION_TYPES = ["Retirement", "End of Contract", "Termination", "Death"] as const;
export type SeparationType = (typeof SEPARATION_TYPES)[number];

export async function getSeparations(type: SeparationType) {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("employee_separations")
    .select("*, karyawan!inner(full_name, department, position), exit_reasons(name)")
    .eq("separation_type", type)
    .order("effective_date", { ascending: false });
  return data || [];
}

export async function submitSeparation(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const type = (formData.get("separation_type") as string || "").trim() as SeparationType;
  const karyawanId = (formData.get("karyawan_id") as string || "").trim();
  const exitReasonId = (formData.get("exit_reason_id") as string || "").trim() || null;
  const effectiveDate = (formData.get("effective_date") as string || "").trim();
  const reason = (formData.get("reason") as string || "").trim() || null;
  if (!SEPARATION_TYPES.includes(type)) return { error: "Jenis pemisahan hubungan kerja tidak valid." };
  if (!karyawanId || !effectiveDate) return { error: "Karyawan dan tanggal efektif wajib diisi." };
  const { error } = await supabaseAdmin.from("employee_separations").insert({
    id: "sep-" + crypto.randomUUID(), separation_type: type, karyawan_id: karyawanId,
    exit_reason_id: exitReasonId, effective_date: effectiveDate, reason, status: "Diajukan",
    created_at: new Date().toISOString(),
  });
  if (error) { console.error("[employee-relations] submitSeparation error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/separation");
  return { success: true };
}

export async function getExitInterviews() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("employee_separations")
    .select("*, karyawan!inner(full_name, department, position)")
    .order("effective_date", { ascending: false });
  return data || [];
}

export async function submitExitInterview(id: string, notes: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("employee_separations").update({
    exit_interview_done: true, exit_interview_notes: notes, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: "Gagal menyimpan hasil exit interview." };
  revalidatePath("/hrd/relations/separation/exit-interview");
  return { success: true };
}

export async function getSeparationAnalytics() {
  await requireRole("hrd", "superadmin");
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const [{ data: separations }, { data: resignations }] = await Promise.all([
    supabaseAdmin.from("employee_separations").select("separation_type, effective_date").gte("effective_date", yearStart),
    supabaseAdmin.from("pengunduran_diri").select("last_day").gte("last_day", yearStart),
  ]);
  const byType: Record<string, number> = { Resignation: (resignations || []).length };
  (separations || []).forEach((s) => { byType[s.separation_type as string] = (byType[s.separation_type as string] || 0) + 1; });
  const total = Object.values(byType).reduce((a, b) => a + b, 0);
  return { byType, total };
}

// ── APPROVAL (generic er_approvals routing) ──────────────────────────────

export async function getErApprovals(category: "Complaint" | "Investigation" | "Corrective Action" | "Industrial" | "Separation" | "Case Closure") {
  await requireRole("hrd", "superadmin", "director");
  const { data } = await supabaseAdmin.from("er_approvals").select("*").eq("category", category).order("created_at", { ascending: false });
  return data || [];
}

export async function decideErApproval(id: string, decision: "Approved" | "Rejected", notes = "") {
  const actor = await requireRole("hrd", "superadmin", "director");
  // .eq("status","Pending") in the WHERE clause makes this an atomic
  // compare-and-swap — a double-click/retry that lands after the first
  // write already flipped the row away from Pending affects zero rows
  // instead of silently re-deciding an already-decided approval.
  const { data: updated, error } = await supabaseAdmin.from("er_approvals").update({
    status: decision, notes, decided_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "Pending").select("id");
  if (error) { console.error("[employee-relations] decideErApproval error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  if (!updated || updated.length === 0) return { error: "Persetujuan ini sudah diproses sebelumnya." };
  await auditLog({
    action: "er.approval_decision",
    targetId: id, performedBy: actor, detail: `Persetujuan ER ${decision === "Approved" ? "disetujui" : "ditolak"}${notes ? ` — ${notes}` : ""}.`,
  });
  revalidatePath("/hrd/relations/approval");
  return { success: true };
}

// ── ANALYTICS / EXECUTIVE DASHBOARD (derived, rule-based) ────────────────

export async function getRelationsExecutiveMetrics() {
  await requireRole("hrd", "superadmin");
  const [
    { data: cases }, { data: participation }, { data: separations }, { data: resignations },
    { count: totalEmployees },
  ] = await Promise.all([
    supabaseAdmin.from("employee_cases").select("status, case_type, sla_due_date"),
    supabaseAdmin.from("participation_entries").select("participation_type, score"),
    supabaseAdmin.from("employee_separations").select("separation_type"),
    supabaseAdmin.from("pengunduran_diri").select("id"),
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }).neq("status", "Inactive"),
  ]);
  const caseRows = (cases || []) as { status: string; case_type: string; sla_due_date: string | null }[];
  const openCases = caseRows.filter((c) => !["Case Closed", "Rejected"].includes(c.status)).length;
  const closedCases = caseRows.filter((c) => c.status === "Case Closed").length;
  const overdueCases = caseRows.filter((c) => c.sla_due_date && new Date(c.sla_due_date) < new Date() && !["Case Closed", "Rejected"].includes(c.status)).length;

  const satScores = (participation || []).filter((p) => p.participation_type === "Satisfaction Survey" && p.score != null).map((p) => p.score as number);
  const engagementIndex = satScores.length > 0 ? Math.round((satScores.reduce((a, b) => a + b, 0) / satScores.length) * 10) / 10 : 0;
  const enpsScores = (participation || []).filter((p) => p.participation_type === "Polling" && p.score != null).map((p) => p.score as number);
  const enps = enpsScores.length > 0 ? Math.round(enpsScores.reduce((a, b) => a + b, 0) / enpsScores.length) : 0;

  const totalSeparations = (separations || []).length + (resignations || []).length;
  const turnoverPct = totalEmployees && totalEmployees > 0 ? Math.round((totalSeparations / totalEmployees) * 1000) / 10 : 0;

  return {
    openCases, closedCases, overdueCases, totalCases: caseRows.length,
    engagementIndex, enps, totalSeparations, turnoverPct,
    resolutionRate: caseRows.length > 0 ? Math.round((closedCases / caseRows.length) * 100) : 0,
  };
}

/** AI ER Engine — rule-based, evaluates ai_recommendation_rules against
 * real computed metrics. No ML model — honest threshold-based recommendations
 * matching this app's established "Smart Insights" pattern. */
export async function getAiRecommendations() {
  await requireRole("hrd", "superadmin");
  const [rules, metrics] = await Promise.all([getAiRecommendationRules(), getRelationsExecutiveMetrics()]);

  const metricValues: Record<string, number> = {
    department_turnover_pct: metrics.turnoverPct,
    case_overdue_days: metrics.overdueCases,
    avg_satisfaction_score: metrics.engagementIndex,
  };

  type Rule = { id: string; trigger_metric: string; threshold_value: number; comparison: string; recommendation_text: string; name: string };
  const triggered = (rules as Rule[]).filter((r) => {
    const value = metricValues[r.trigger_metric];
    if (value === undefined) return false;
    if (r.comparison === "gte") return value >= r.threshold_value;
    if (r.comparison === "lte") return value <= r.threshold_value;
    return value === r.threshold_value;
  });

  return { triggered, metrics };
}
