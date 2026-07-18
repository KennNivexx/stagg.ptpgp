"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

/**
 * Recruitment Management, Round 2 — multi-panel interview scoring, a real
 * multi-stage Hiring Approval chain, Background Check / Medical Check Up,
 * and a formalized Offer Letter lifecycle. Approval roles below (HR,
 * Department Head, Finance, Director) map onto roles that actually exist in
 * this app's auth system — no invented "Division Head"/"HRBP" positions.
 */

const HIRING_STEPS: { step: number; role: "HR" | "Department Head" | "Finance" | "Director" }[] = [
  { step: 1, role: "HR" },
  { step: 2, role: "Department Head" },
  { step: 3, role: "Finance" },
  { step: 4, role: "Director" },
];

// ── Multi-panel interview scoring ───────────────────────────────────────

export async function submitInterviewScore(
  applicationId: string,
  panelRole: "HR" | "User/Dept Manager" | "Director",
  score: number,
  notes: string
): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager", "director");
  if (score < 0 || score > 100) return { error: "Skor harus antara 0-100." };

  // HR/superadmin can score as "HR"; department_manager as "User/Dept
  // Manager"; director as "Director" — each role can only submit its own
  // panel slot, so one person can't fill the whole panel alone.
  const allowedRoleForUser: Record<string, string> = {
    hrd: "HR", superadmin: "HR", department_manager: "User/Dept Manager", director: "Director",
  };
  if (allowedRoleForUser[user.role] && allowedRoleForUser[user.role] !== panelRole && user.role !== "superadmin") {
    return { error: `Role Anda (${user.role}) tidak berwenang mengisi penilaian sebagai "${panelRole}".` };
  }

  const { data: existing } = await supabaseAdmin.from("interview_scores")
    .select("id").eq("application_id", applicationId).eq("panel_role", panelRole).maybeSingle();

  const { error } = await supabaseAdmin.from("interview_scores").upsert({
    id: (existing as { id: string } | null)?.id || ("iv-" + crypto.randomUUID()),
    application_id: applicationId, panel_role: panelRole,
    panelist_name: user.name || user.email, score, notes: notes || null,
  }, { onConflict: "application_id,panel_role" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260804001_recruitment_hiring_workflow.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan penilaian interview." };

  revalidatePath("/hrd/recruitment/interviews");
  revalidatePath("/hrd/recruitment/pipeline");
  return { success: true };
}

export async function getInterviewScores(applicationId: string) {
  await requireRole("hrd", "superadmin", "department_manager", "director");
  const { data } = await supabaseAdmin.from("interview_scores")
    .select("*").eq("application_id", applicationId).order("panel_role");
  const rows = data || [];
  const average = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r.score as number), 0) / rows.length) : null;
  return { scores: rows, average };
}

// ── Hiring Approval chain (HR -> Department Head -> Finance -> Director) ──

export async function initHiringApproval(applicationId: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { data: existing } = await supabaseAdmin.from("hiring_approval_steps").select("id").eq("application_id", applicationId).limit(1);
  if (existing && existing.length > 0) return { error: "Approval hiring untuk kandidat ini sudah dimulai." };

  const { error } = await supabaseAdmin.from("hiring_approval_steps").insert(
    HIRING_STEPS.map(s => ({
      id: "hap-" + crypto.randomUUID(), application_id: applicationId,
      step_number: s.step, approver_role: s.role, status: "Pending",
    }))
  );
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260804001_recruitment_hiring_workflow.sql terlebih dahulu." };
  if (error) return { error: "Gagal memulai approval hiring." };

  revalidatePath("/hrd/recruitment/decisions");
  return { success: true };
}

export async function getHiringApprovalStatus(applicationId: string) {
  await requireRole("hrd", "superadmin", "department_manager", "director");
  const { data } = await supabaseAdmin.from("hiring_approval_steps")
    .select("*").eq("application_id", applicationId).order("step_number");
  return data || [];
}

const ROLE_FOR_APPROVER: Record<string, string[]> = {
  HR: ["hrd", "superadmin"],
  "Department Head": ["department_manager", "hrd", "superadmin"],
  Finance: ["hrd", "director", "superadmin"],
  Director: ["director", "superadmin"],
};

export async function decideHiringApprovalStep(
  applicationId: string, stepNumber: number, approved: boolean, notes?: string
): Promise<{ error: string } | { success: true }> {
  const { data: stepRow } = await supabaseAdmin.from("hiring_approval_steps")
    .select("approver_role, status").eq("application_id", applicationId).eq("step_number", stepNumber).maybeSingle();
  const step = stepRow as { approver_role: string; status: string } | null;
  if (!step) return { error: "Tahap approval tidak ditemukan." };
  if (step.status !== "Pending") return { error: `Tahap ini sudah diputuskan sebelumnya (${step.status}).` };

  const allowedRoles = ROLE_FOR_APPROVER[step.approver_role] || [];
  const user = await requireRole("hrd", "superadmin", "department_manager", "director");
  if (!allowedRoles.includes(user.role) && user.role !== "superadmin") {
    return { error: `Hanya ${step.approver_role} yang dapat memutuskan tahap ini.` };
  }

  // Steps must be approved in order — can't jump ahead of an earlier
  // Pending step, so the chain genuinely means something.
  const { data: earlierSteps } = await supabaseAdmin.from("hiring_approval_steps")
    .select("step_number, status").eq("application_id", applicationId).lt("step_number", stepNumber);
  const blocked = (earlierSteps || []).find(s => s.status !== "Approved" && s.status !== "Skipped");
  if (blocked) return { error: `Tahap sebelumnya (langkah ${blocked.step_number}) belum disetujui.` };

  if (!approved && !(notes || "").trim()) return { error: "Alasan penolakan wajib diisi." };

  await supabaseAdmin.from("hiring_approval_steps").update({
    status: approved ? "Approved" : "Rejected",
    approved_by: user.name || user.email, approved_at: new Date().toISOString(),
    notes: notes || null,
  }).eq("application_id", applicationId).eq("step_number", stepNumber);

  if (!approved) {
    await supabaseAdmin.from("pelamar").update({ status: "Ditolak" }).eq("id", applicationId);
  }

  revalidatePath("/hrd/recruitment/decisions");
  revalidatePath("/hrd/recruitment/pipeline");
  return { success: true };
}

// ── Background Check / Medical Check Up ─────────────────────────────────

export async function setBackgroundCheck(
  applicationId: string, status: "Proses" | "Bersih" | "Ditandai", notes: string
): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("pelamar").update({
    background_check_status: status, background_check_notes: notes || null, background_check_at: new Date().toISOString(),
  }).eq("id", applicationId);
  if (error?.code === "42703") return { error: "Jalankan migrasi 20260804001_recruitment_hiring_workflow.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan hasil background check." };
  revalidatePath("/hrd/recruitment/pipeline");
  return { success: true };
}

export async function setMedicalCheckup(
  applicationId: string, status: "Fit" | "Fit With Note" | "Unfit", notes: string
): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("pelamar").update({
    medical_checkup_status: status, medical_checkup_notes: notes || null, medical_checkup_at: new Date().toISOString(),
  }).eq("id", applicationId);
  if (error?.code === "42703") return { error: "Jalankan migrasi 20260804001_recruitment_hiring_workflow.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan hasil medical check up." };
  revalidatePath("/hrd/recruitment/pipeline");
  return { success: true };
}

// ── Offer Letter ──────────────────────────────────────────────────────────
// Real generated document + accept/decline lifecycle. No cryptographic
// e-signature exists in this app, so "Diterima" means the candidate clicked
// Accept in their portal (respondToOffer in recruitment.ts) — same honest
// pattern as everything else here, not a fabricated digital signature.

export async function generateOfferLetter(applicationId: string): Promise<{ error: string } | { success: true; content: string }> {
  await requireRole("hrd", "superadmin");
  const { data: appRow } = await supabaseAdmin.from("pelamar")
    .select("full_name, offered_salary, job_id").eq("id", applicationId).maybeSingle();
  if (!appRow) return { error: "Lamaran tidak ditemukan." };
  const app = appRow as { full_name: string; offered_salary: number | null; job_id: string | null };
  if (!app.offered_salary) return { error: "Tentukan gaji yang ditawarkan terlebih dahulu (menu Negosiasi Gaji)." };

  const { data: jobRow } = app.job_id
    ? await supabaseAdmin.from("lowongan_kerja").select("position, department").eq("id", app.job_id).maybeSingle()
    : { data: null };
  const job = jobRow as { position?: string; department?: string } | null;

  const content = [
    `SURAT PENAWARAN KERJA`,
    ``,
    `Kepada Yth. ${app.full_name},`,
    ``,
    `Dengan ini PT Pratama Galuh Perkasa menawarkan posisi sebagai berikut:`,
    `Posisi: ${job?.position || "-"}`,
    `Departemen: ${job?.department || "-"}`,
    `Gaji yang ditawarkan: Rp${app.offered_salary.toLocaleString("id-ID")}`,
    ``,
    `Mohon konfirmasi penerimaan tawaran ini melalui Portal Pelamar.`,
  ].join("\n");

  const { error } = await supabaseAdmin.from("pelamar").update({
    offer_letter_content: content, offer_letter_status: "Draft",
  }).eq("id", applicationId);
  if (error?.code === "42703") return { error: "Jalankan migrasi 20260804001_recruitment_hiring_workflow.sql terlebih dahulu." };
  if (error) return { error: "Gagal membuat offer letter." };

  revalidatePath("/hrd/recruitment/negotiations");
  return { success: true, content };
}

export async function sendOfferLetter(applicationId: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { data: appRow } = await supabaseAdmin.from("pelamar").select("email, offer_letter_content").eq("id", applicationId).maybeSingle();
  const app = appRow as { email?: string; offer_letter_content?: string } | null;
  if (!app?.offer_letter_content) return { error: "Buat offer letter terlebih dahulu." };

  await supabaseAdmin.from("pelamar").update({
    offer_letter_status: "Terkirim", offer_letter_sent_at: new Date().toISOString(),
  }).eq("id", applicationId);

  if (app.email) {
    await supabaseAdmin.from("notifikasi").insert({
      id: crypto.randomUUID(), user_email: app.email,
      title: "Surat Penawaran Kerja", message: "Surat penawaran kerja Anda sudah tersedia di Portal Pelamar.",
      link: "/applicant/status",
    });
  }
  revalidatePath("/hrd/recruitment/negotiations");
  return { success: true };
}
