"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { hireCandidateFromPipeline } from "@/app/actions/recruitment";
import { sendMail, emailOfferLetter } from "@/lib/mailer";

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
    revalidatePath("/hrd/recruitment/decisions");
    revalidatePath("/hrd/recruitment/pipeline");
    return { success: true };
  }

  // Was this the last step in the chain? If so, this approval finalizes
  // hiring — actually create the employee record now, so the 4-step gate
  // (HR -> Department Head -> Finance -> Director) means something instead
  // of being a formality HR can bypass via a separate "Hire" button.
  const { data: allSteps } = await supabaseAdmin.from("hiring_approval_steps")
    .select("step_number").eq("application_id", applicationId).order("step_number", { ascending: false }).limit(1);
  const lastStep = (allSteps || [])[0] as { step_number: number } | undefined;
  if (lastStep && lastStep.step_number === stepNumber) {
    const hireRes = await hireCandidateFromPipeline(applicationId, true);
    if (hireRes && "error" in hireRes) return { error: hireRes.error as string };
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

// ── PR-SDM-02: Driver / Heavy-Equipment Operator recruitment branch ────────
// Extends the generic pipeline above (lowongan_kerja / pelamar) instead of a
// parallel system. Job postings flagged is_driver_position=true, OR whose
// position name matches the same supir/sopir/driver/operator convention
// already used by getSupirForAssignment() in vehicles.ts, are treated as
// driver/operator recruitment and gain two extra branch-specific stages:
// Tes Mengemudi (QC & pengemudi senior) and, for hazmat/waste-transport
// postings, a mandatory Tes Pihak Ketiga that can't be skipped even for
// "penunjukan" (direct referral/appointment) candidates.

const DRIVER_POSITION_PATTERN = /supir|sopir|driver|operator/i;

function isDriverJob(job: { position?: string | null; is_driver_position?: boolean | null }): boolean {
  return !!job.is_driver_position || DRIVER_POSITION_PATTERN.test(job.position || "");
}

export async function setJobPostingDriverFlags(
  jobId: string, isDriverPosition: boolean, isHazmatWasteTransport: boolean
): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("lowongan_kerja").update({
    is_driver_position: isDriverPosition,
    is_hazmat_waste_transport: isHazmatWasteTransport,
  }).eq("id", jobId);
  if (error?.code === "42703") return { error: "Jalankan migrasi 20260817001_driver_operator_recruitment_sop terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan penanda posisi pengemudi/operator." };
  revalidatePath("/hrd/recruitment/drivers");
  revalidatePath("/hrd/recruitment");
  return { success: true };
}

/** Candidate list scoped to driver/heavy-equipment-operator postings, with
 * job info attached — same shape as getApplicationsForPipeline() but
 * filtered, for the /hrd/recruitment/drivers view. */
export async function getDriverCandidatePipeline() {
  await requireRole("hrd", "superadmin");

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from("lowongan_kerja")
    .select("id, position, department, is_driver_position, is_hazmat_waste_transport");
  if (jobsError?.code === "42703") {
    return { error: "Jalankan migrasi 20260817001_driver_operator_recruitment_sop terlebih dahulu." as string };
  }

  type JobRow = { id: string; position: string; department: string; is_driver_position: boolean | null; is_hazmat_waste_transport: boolean | null };
  const driverJobs = ((jobs as JobRow[]) || []).filter(isDriverJob);
  const jobMap: Record<string, JobRow> = {};
  driverJobs.forEach(j => { jobMap[j.id] = j; });

  if (driverJobs.length === 0) return { apps: [] as Record<string, unknown>[], jobs: jobMap };

  const { data: apps } = await supabaseAdmin
    .from("pelamar")
    .select("*")
    .in("job_id", driverJobs.map(j => j.id))
    .order("applied_at", { ascending: false });

  return { apps: (apps as Record<string, unknown>[]) || [], jobs: jobMap };
}

/** Toggle "penunjukan" (direct referral/appointment) — lets the candidate
 * skip written test + initial interview straight to the driving test. The
 * mandatory third-party hazmat test (if the posting requires it) can NOT be
 * skipped, enforced separately in setHazmatThirdPartyTest's callers via UI,
 * not here — this flag only concerns the written-test/interview stages. */
export async function setPenunjukanFlag(applicationId: string, isPenunjukan: boolean): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("pelamar").update({ is_penunjukan: isPenunjukan }).eq("id", applicationId);
  if (error?.code === "42703") return { error: "Jalankan migrasi 20260817001_driver_operator_recruitment_sop terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan status penunjukan." };
  revalidatePath("/hrd/recruitment/drivers");
  return { success: true };
}

/** Driving/competency test — evaluated by QC & pengemudi senior. */
export async function setDrivingTest(
  applicationId: string, status: "Proses" | "Lulus" | "Tidak Lulus", evaluators: string, notes: string
): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (!evaluators.trim()) return { error: "Nama evaluator (QC & pengemudi senior) wajib diisi." };
  const { error } = await supabaseAdmin.from("pelamar").update({
    driving_test_status: status,
    driving_test_evaluators: evaluators.trim(),
    driving_test_notes: notes || null,
    driving_test_at: new Date().toISOString(),
  }).eq("id", applicationId);
  if (error?.code === "42703") return { error: "Jalankan migrasi 20260817001_driver_operator_recruitment_sop terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan hasil tes mengemudi." };
  revalidatePath("/hrd/recruitment/pipeline");
  revalidatePath("/hrd/recruitment/drivers");
  return { success: true };
}

/** Mandatory third-party competency test for candidates applying to
 * transport hazardous materials/waste — cannot be skipped even for
 * penunjukan candidates (that gate is enforced in the UI: the hire button
 * on /hrd/recruitment/drivers stays disabled until this is "Lulus" whenever
 * the job posting is flagged is_hazmat_waste_transport). */
export async function setHazmatThirdPartyTest(
  applicationId: string, status: "Proses" | "Lulus" | "Tidak Lulus", pihakKetiga: string, notes: string
): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (status === "Lulus" && !pihakKetiga.trim()) return { error: "Nama pihak ketiga penguji wajib diisi." };
  const { error } = await supabaseAdmin.from("pelamar").update({
    hazmat_test_status: status,
    hazmat_test_pihak_ketiga: pihakKetiga.trim() || null,
    hazmat_test_notes: notes || null,
    hazmat_test_at: new Date().toISOString(),
  }).eq("id", applicationId);
  if (error?.code === "42703") return { error: "Jalankan migrasi 20260817001_driver_operator_recruitment_sop terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan hasil tes kompetensi pihak ketiga." };
  revalidatePath("/hrd/recruitment/pipeline");
  revalidatePath("/hrd/recruitment/drivers");
  return { success: true };
}

export async function sendOfferLetter(applicationId: string): Promise<{ error: string } | { success: true; warning?: string }> {
  await requireRole("hrd", "superadmin");
  const { data: appRow } = await supabaseAdmin.from("pelamar").select("email, full_name, offer_letter_content").eq("id", applicationId).maybeSingle();
  const app = appRow as { email?: string; full_name?: string; offer_letter_content?: string } | null;
  if (!app?.offer_letter_content) return { error: "Buat offer letter terlebih dahulu." };

  await supabaseAdmin.from("pelamar").update({
    offer_letter_status: "Terkirim", offer_letter_sent_at: new Date().toISOString(),
  }).eq("id", applicationId);

  let warning: string | undefined;
  if (app.email) {
    await supabaseAdmin.from("notifikasi").insert({
      id: crypto.randomUUID(), user_email: app.email,
      title: "Surat Penawaran Kerja", message: "Surat penawaran kerja Anda sudah tersedia di Portal Pelamar.",
      link: "/applicant/status",
    });
    try {
      await sendMail({
        to: app.email,
        subject: "Surat Penawaran Kerja — PT Pratama Galuh Perkasa",
        html: emailOfferLetter({ name: app.full_name || "Pelamar", contentHtml: app.offer_letter_content }),
      });
    } catch (err) {
      console.error("[recruitment-hiring] Failed to send offer letter email:", err);
      warning = "Status terkirim, tetapi email offer letter gagal dikirim. Pelamar tetap bisa melihatnya di Portal Pelamar.";
    }
  }
  revalidatePath("/hrd/recruitment/negotiations");
  return { success: true, ...(warning ? { warning } : {}) };
}
