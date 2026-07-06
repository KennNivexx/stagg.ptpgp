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

// ── Surveys ───────────────────────────────────────────────────────────────────

export interface SurveyQuestion {
  id: string;
  type: "short_text" | "paragraph" | "multiple_choice" | "checkbox" | "rating";
  label: string;
  options?: string[];
  required: boolean;
}

const SURVEY_MISSING_TABLE = (code?: string) => code === "42P01" || code === "PGRST205";

export async function getSurveys() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("employee_surveys").select("*").order("created_at", { ascending: false }).limit(50);
  return (data || []) as Array<Record<string, unknown>>;
}

export async function createSurvey(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const surveyType = (formData.get("survey_type") as string || "").trim();
  const questionsJsonRaw = (formData.get("questions_json") as string || "").trim();
  const startDate = (formData.get("start_date") as string || "").trim() || null;
  const endDate = (formData.get("end_date") as string || "").trim() || null;
  if (!title || !surveyType || !questionsJsonRaw) return { error: "Judul, tipe, dan minimal satu pertanyaan wajib diisi." };

  let questions: SurveyQuestion[];
  try {
    questions = JSON.parse(questionsJsonRaw);
  } catch {
    return { error: "Format pertanyaan tidak valid." };
  }
  if (!Array.isArray(questions) || questions.length === 0) return { error: "Minimal satu pertanyaan wajib diisi." };
  if (questions.some((q) => !q.label?.trim())) return { error: "Setiap pertanyaan wajib memiliki teks pertanyaan." };

  const { error } = await supabaseAdmin.from("employee_surveys").insert({
    id: "srv-" + crypto.randomUUID(), title, survey_type: surveyType,
    questions: questions.map((q) => q.label).join(" | "),
    questions_json: questions,
    start_date: startDate, end_date: endDate, status: "Aktif",
    created_by: user.name || user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260625_employee_surveys.sql terlebih dahulu." };
  if (SURVEY_MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704001_knowledge_and_surveys.sql terlebih dahulu." };
  if (error) { console.error("[relations] createSurvey error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/surveys");
  return { success: true };
}

export async function closeSurvey(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("employee_surveys").update({ status: "Ditutup" }).eq("id", id);
  if (error) { console.error("[relations] closeSurvey error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/surveys");
  return { success: true };
}

export async function getSurveyResults(surveyId: string) {
  await requireRole("hrd", "superadmin");
  const { data: survey } = await supabaseAdmin.from("employee_surveys").select("*").eq("id", surveyId).maybeSingle();
  if (!survey) return null;
  const { data: responses, error } = await supabaseAdmin
    .from("survey_responses").select("*").eq("survey_id", surveyId).order("submitted_at", { ascending: false });
  if (SURVEY_MISSING_TABLE(error?.code)) return { survey, responses: [] as Array<Record<string, unknown>> };
  return { survey: survey as Record<string, unknown>, responses: (responses || []) as Array<Record<string, unknown>> };
}

// ── Survey taking (employee side) ───────────────────────────────────────────

export async function getActiveSurveysForEmployee() {
  const user = await requireRole("employee", "department_manager", "hrd", "superadmin");
  const { data: surveys, error } = await supabaseAdmin
    .from("employee_surveys").select("*").order("created_at", { ascending: false });
  if (error) return [];
  const { data: mine } = await supabaseAdmin
    .from("survey_responses").select("survey_id").eq("employee_id", user.id);
  const answeredIds = new Set((mine || []).map((r: Record<string, unknown>) => r.survey_id as string));
  return (surveys || []).map((s: Record<string, unknown>) => ({ ...s, _answered: answeredIds.has(s.id as string) }));
}

export async function getSurveyForTaking(surveyId: string) {
  const user = await requireRole("employee", "department_manager", "hrd", "superadmin");
  const { data: survey } = await supabaseAdmin.from("employee_surveys").select("*").eq("id", surveyId).maybeSingle();
  if (!survey) return null;
  const { data: existing } = await supabaseAdmin
    .from("survey_responses").select("*").eq("survey_id", surveyId).eq("employee_id", user.id).maybeSingle();
  return { survey: survey as Record<string, unknown>, existingResponse: (existing as Record<string, unknown>) || null };
}

export async function submitSurveyResponse(formData: FormData) {
  const user = await requireRole("employee", "department_manager", "hrd", "superadmin");
  const surveyId = (formData.get("survey_id") as string || "").trim();
  const answersRaw = (formData.get("answers") as string || "").trim();
  if (!surveyId || !answersRaw) return { error: "Data survei tidak lengkap." };
  let answers: Record<string, unknown>;
  try {
    answers = JSON.parse(answersRaw);
  } catch {
    return { error: "Format jawaban tidak valid." };
  }
  const { error } = await supabaseAdmin.from("survey_responses").insert({
    id: "resp-" + crypto.randomUUID(), survey_id: surveyId,
    employee_id: user.id, employee_name: user.name || user.email,
    answers, submitted_at: new Date().toISOString(),
  });
  if (SURVEY_MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704001_knowledge_and_surveys.sql terlebih dahulu." };
  if (error?.code === "23505") return { error: "Anda sudah pernah mengisi survei ini." };
  if (error) { console.error("[relations] submitSurveyResponse error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/employee/surveys");
  revalidatePath(`/employee/surveys/${surveyId}`);
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
    // Schedule permanent account deletion 24 hours from approval.
    updateData.delete_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  let { error } = await supabaseAdmin.from("resignations").update(updateData).eq("id", id);
  // Resilience: if the delete_at column hasn't been migrated yet, approve anyway
  // (without scheduling deletion) so the HRD flow is never blocked.
  if (error && updateData.delete_at && /delete_at|column/i.test(error.message)) {
    console.warn("[relations] resignations.delete_at missing — run migration 20260626_resignation_delete_at.sql to enable auto-delete");
    delete updateData.delete_at;
    ({ error } = await supabaseAdmin.from("resignations").update(updateData).eq("id", id));
  }
  if (error) { console.error("[relations] updateResignationStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/relations/resignations");
  revalidatePath("/hrd/employees");
  revalidatePath("/employee/resignation");
  return { success: true };
}
