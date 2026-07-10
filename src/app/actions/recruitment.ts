"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { hashPassword, generateRandomPassword } from "@/lib/auth";
import { generateOneTimeToken } from "@/lib/otp-token";
import { sendMail, emailEmployeeLoginLink } from "@/lib/mailer";

export async function getJobPostings() {
  await requireRole("hrd", "superadmin", "director");

  const { data, error } = await supabaseAdmin
    .from("lowongan_kerja")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function hireCandidate(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const job_posting_id = formData.get("job_posting_id") as string;
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const position = formData.get("position") as string;
  const department = formData.get("department") as string;

  if (!job_posting_id || !full_name || !email) {
    return { error: "Lowongan, nama, dan email wajib diisi." };
  }

  const { data: jobPosting, error: postingError } = await supabaseAdmin
    .from("lowongan_kerja")
    .select("*")
    .eq("id", job_posting_id)
    .single();

  if (postingError || !jobPosting) {
    return { error: "Lowongan tidak ditemukan." };
  }

  const dept = department || (jobPosting.department as string);

  let kode = "";
  const { data: orgUnit } = await supabaseAdmin
    .from("unit_organisasi")
    .select("code")
    .eq("name", dept)
    .maybeSingle();

  if (orgUnit) {
    const segments = (orgUnit.code as string).split(".");
    const { count } = await supabaseAdmin
      .from("karyawan")
      .select("*", { count: "exact", head: true })
      .eq("department", dept);
    const seq = (count || 0) + 1;
    const firstZero = segments.findIndex(s => Number(s) === 0);
    if (firstZero >= 0) {
      segments[firstZero] = String(seq);
    } else {
      segments.push(String(seq));
    }
    kode = segments.join(".");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const password = generateRandomPassword();
  const passwordHash = hashPassword(password);
  const oneTimeToken = generateOneTimeToken(normalizedEmail);
  const tokenExpires = new Date(Date.now() + 86400000).toISOString();

  const { error: usersCheckError } = await supabaseAdmin
    .from("pengguna")
    .select("id")
    .limit(1);
  const hasUsersTable = !usersCheckError || !usersCheckError.message.includes("Could not find the table");

  // The address column stores the actual home address. Only when there's no
  // `users` table to hold login credentials do we fall back to stashing the
  // auth blob there (tryEmployeesAuth in auth.ts reads it in that case).
  const addressValue = hasUsersTable
    ? ""
    : JSON.stringify({ __auth__: { password_hash: passwordHash, role: "employee" } });

  const { error: empError } = await supabaseAdmin
    .from("karyawan")
    .insert([
      {
        full_name,
        email: normalizedEmail,
        department: dept,
        position: position || jobPosting.position,
        join_date: new Date().toISOString().split("T")[0],
        status: "Tetap",
        kode: kode || null,
        address: addressValue,
      },
    ]);

  if (empError) {
    return { error: empError.message };
  }

  if (hasUsersTable) {
    // Upsert: if they had an applicant account, upgrade it; otherwise insert
    const { data: existingUser } = await supabaseAdmin
      .from("pengguna")
      .select("id, role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      await supabaseAdmin.from("pengguna").update({
        password_hash: passwordHash,
        role: "employee",
        full_name,
        is_temporary: false,
        expires_at: null,
        application_id: null,
        one_time_token: oneTimeToken,
        one_time_token_expires: tokenExpires,
      }).eq("email", normalizedEmail);
    } else {
      await supabaseAdmin.from("pengguna").insert([{
        email: normalizedEmail,
        password_hash: passwordHash,
        role: "employee",
        full_name,
        one_time_token: oneTimeToken,
        one_time_token_expires: tokenExpires,
      }]);
    }
  }

  const newFilled = ((jobPosting.quantity_filled as number) || 0) + 1;
  const updates: Record<string, unknown> = { quantity_filled: newFilled };

  if (newFilled >= ((jobPosting.quantity as number) || 1)) {
    updates.status = "Closed";
  }

  const { error: updateError } = await supabaseAdmin
    .from("lowongan_kerja")
    .update(updates)
    .eq("id", job_posting_id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/hrd/recruitment");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workforce/headcount");

  // Send welcome email with employee credentials
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.ptpgp.co.id";
  let emailWarning: string | undefined;
  try {
    await sendMail({
      to: normalizedEmail,
      subject: "Selamat! Anda Resmi Bergabung — PT Pratama Galuh Perkasa",
      html: emailEmployeeLoginLink({
        name: full_name,
        email: normalizedEmail,
        loginUrl: `${appUrl}/login/token?t=${oneTimeToken}`,
      }),
    });
  } catch (err) {
    console.error("Failed to send employee credentials email:", err);
    emailWarning = "Akun berhasil dibuat tetapi email kredensial gagal dikirim. Beritahu karyawan untuk login dengan email mereka.";
  }

  return { success: true, password, ...(emailWarning ? { warning: emailWarning } : {}) };
}

// ── Reject applicant + set temp account expiry to 24h ──────────────────
export async function rejectApplicant(applicantId: string, applicantEmail: string) {
  await requireRole("hrd", "superadmin");

  const { error } = await supabaseAdmin
    .from("pelamar")
    .update({ status: "Ditolak" })
    .eq("id", applicantId);

  if (error) { console.error("[recruitment] rejectApplicant error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  // Mark temp applicant account for deletion in 24h (not immediate)
  // so the applicant can login and see the rejection notice.
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("pengguna")
    .update({ expires_at: expiresAt })
    .eq("email", applicantEmail.toLowerCase().trim())
    .eq("role", "applicant");

  revalidatePath("/hrd/recruitment");
  revalidatePath("/applicant");
  return { success: true };
}

export async function createJobPosting(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const location = (formData.get("location") as string || "").trim();
  const status = (formData.get("status") as string || "Draft").trim();
  const description = (formData.get("description") as string || "").trim();
  if (!title || !department) return { error: "Judul posisi dan departemen wajib diisi." };
  const { error } = await supabaseAdmin.from("lowongan_kerja").insert({
    id: "job-" + crypto.randomUUID(),
    title, department, location: location || null,
    status, description: description || null,
    quantity: 1, quantity_filled: 0,
    created_at: new Date().toISOString(),
  });
  if (error) { console.error("[recruitment] createJobPosting error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/workforce/vacancy");
  revalidatePath("/hrd/recruitment");
  return { success: true };
}

export async function updateJobPostingStatus(id: string, status: string) {
  await requireRole("hrd", "superadmin");

  const { error } = await supabaseAdmin
    .from("lowongan_kerja")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[recruitment] updateJobPostingStatus error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/hrd/recruitment");
  return { success: true };
}

// ── Negosiasi Gaji ──────────────────────────────────────────────────────────

export async function getCandidatesForNegotiation() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("pelamar")
    .select("id, full_name, email, position, department, offered_salary, salary_expectation, final_salary, negotiation_status, negotiation_notes, status")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []).filter((a: Record<string, unknown>) =>
    ["Wawancara", "Interview", "Lulus", "offered", "negotiating", "agreed"].includes(
      (a.negotiation_status && a.negotiation_status !== "none") ? a.negotiation_status as string : a.status as string
    )
  );
}

export async function setOfferedSalary(applicationId: string, offeredSalary: number, notes: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin
    .from("pelamar")
    .update({ offered_salary: offeredSalary, negotiation_status: "offered", negotiation_notes: notes || null })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  revalidatePath("/hrd/recruitment/negotiations");
  return { success: true };
}

export async function finalizeNegotiation(applicationId: string, finalSalary: number, agreed: boolean) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin
    .from("pelamar")
    .update({ final_salary: finalSalary || null, negotiation_status: agreed ? "agreed" : "rejected" })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  revalidatePath("/hrd/recruitment/negotiations");
  return { success: true };
}

export async function getMyNegotiation() {
  const session = await requireRole("applicant");
  const { data: user } = await supabaseAdmin
    .from("pengguna").select("application_id").eq("email", session.email).maybeSingle();
  if (!user?.application_id) return null;
  const { data } = await supabaseAdmin
    .from("pelamar")
    .select("id, offered_salary, salary_expectation, final_salary, negotiation_status, negotiation_notes, position")
    .eq("id", user.application_id).maybeSingle();
  return data;
}

// ── Pipeline: get all applications with job info ────────────────────────────
export async function getApplicationsForPipeline() {
  await requireRole("hrd", "superadmin");
  const { data: apps, error } = await supabaseAdmin
    .from("pelamar")
    .select("*")
    .order("applied_at", { ascending: false })
    .limit(500);
  if (error) return { apps: [], jobs: {} as Record<string, { position: string; department: string }> };

  const jobIds = [...new Set((apps || []).map((a: Record<string, unknown>) => a.job_id as string).filter(Boolean))];
  const { data: jobs } = jobIds.length > 0
    ? await supabaseAdmin.from("lowongan_kerja").select("id, position, department").in("id", jobIds)
    : { data: [] };

  const jobMap: Record<string, { position: string; department: string }> = {};
  (jobs || []).forEach((j: Record<string, string>) => { jobMap[j.id] = { position: j.position, department: j.department }; });

  return { apps: apps || [], jobs: jobMap };
}

// ── Pipeline: move application to new status ────────────────────────────────
export async function moveApplicationStatus(applicationId: string, newStatus: string) {
  await requireRole("hrd", "superadmin");
  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "Interview") updates.reached_interview = true;
  const { error } = await supabaseAdmin
    .from("pelamar")
    .update(updates)
    .eq("id", applicationId);
  if (error) return { error: error.message };
  revalidatePath("/hrd/recruitment/pipeline");
  revalidatePath("/hrd/recruitment/decisions");
  revalidatePath("/hrd/recruitment/interviews");
  revalidatePath("/applicant/test");
  return { success: true };
}

// ── Interview: schedule / update date, time, interviewer, location, notes ───
export async function scheduleInterview(
  applicationId: string,
  payload: {
    interview_date: string;
    interview_time?: string;
    interviewer?: string;
    interview_location?: string;
    interview_online_link?: string;
    interview_notes?: string;
  }
): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (!payload.interview_date) return { error: "Tanggal interview wajib diisi." };
  const { data: appRow, error } = await supabaseAdmin
    .from("pelamar")
    .update({
      interview_date: payload.interview_date,
      interview_time: payload.interview_time || null,
      interviewer: payload.interviewer || null,
      interview_location: payload.interview_location || null,
      interview_online_link: payload.interview_online_link || null,
      interview_notes: payload.interview_notes || null,
    })
    .eq("id", applicationId)
    .select("email")
    .maybeSingle();
  if (error?.code === "PGRST204" || error?.code === "42703") {
    return { error: "Jalankan migrasi 20260706001 terlebih dahulu." };
  }
  if (error) return { error: error.message };

  const applicantEmail = (appRow as { email?: string } | null)?.email;
  if (applicantEmail) {
    const when = [payload.interview_date, payload.interview_time].filter(Boolean).join(" ");
    const where = payload.interview_online_link || payload.interview_location || "";
    await supabaseAdmin.from("notifikasi").insert({
      id: crypto.randomUUID(),
      user_email: applicantEmail,
      title: "Jadwal Interview Ditentukan",
      message: `Interview Anda dijadwalkan pada ${when}${where ? ` — ${where}` : ""}.`,
      link: "/applicant/status",
    });
  }

  revalidatePath("/hrd/recruitment/interviews");
  return { success: true };
}

// ── Pipeline: hire candidate (creates employee record + sends email) ─────────
export async function hireCandidateFromPipeline(applicationId: string) {
  await requireRole("hrd", "superadmin");

  const { data: app } = await supabaseAdmin
    .from("pelamar").select("*").eq("id", applicationId).single();
  if (!app) return { error: "Lamaran tidak ditemukan." };

  const { data: job } = await supabaseAdmin
    .from("lowongan_kerja").select("position, department").eq("id", app.job_id as string).single();

  const fd = new FormData();
  fd.set("job_posting_id", app.job_id as string);
  fd.set("full_name", app.full_name as string);
  fd.set("email", app.email as string);
  fd.set("position", (job?.position as string) || (app.position as string) || "");
  fd.set("department", (job?.department as string) || (app.department as string) || "");

  // Mark as Diterima before creating employee
  await supabaseAdmin.from("pelamar").update({ status: "Diterima" }).eq("id", applicationId);

  return hireCandidate(fd);
}

// ── Talent Pool: add applicant ──────────────────────────────────────────────
export async function addToTalentPool(applicationId: string, notes: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin
    .from("pelamar")
    .update({
      in_talent_pool: true,
      talent_pool_notes: notes || "",
      talent_pool_added_at: new Date().toISOString(),
    })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  revalidatePath("/hrd/recruitment/talentpool");
  revalidatePath("/hrd/recruitment/decisions");
  return { success: true };
}

// ── Talent Pool: fetch all entries ─────────────────────────────────────────
export async function getTalentPool() {
  await requireRole("hrd", "superadmin");
  const { data: apps, error } = await supabaseAdmin
    .from("pelamar")
    .select("*")
    .eq("in_talent_pool", true)
    .order("talent_pool_added_at", { ascending: false });
  if (error) return [];

  const jobIds = [...new Set((apps || []).map((a: Record<string, unknown>) => a.job_id as string).filter(Boolean))];
  const { data: jobs } = jobIds.length > 0
    ? await supabaseAdmin.from("lowongan_kerja").select("id, position, department").in("id", jobIds)
    : { data: [] };

  const jobMap: Record<string, { position: string; department: string }> = {};
  (jobs || []).forEach((j: Record<string, string>) => { jobMap[j.id] = { position: j.position, department: j.department }; });

  return (apps || []).map((a: Record<string, unknown>) => ({
    ...a,
    job: jobMap[a.job_id as string] || null,
  }));
}

// ── Talent Pool: remove ─────────────────────────────────────────────────────
export async function removeFromTalentPool(applicationId: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin
    .from("pelamar")
    .update({ in_talent_pool: false, talent_pool_notes: "", talent_pool_added_at: null })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  revalidatePath("/hrd/recruitment/talentpool");
  revalidatePath("/hrd/recruitment/decisions");
  return { success: true };
}

// ── Keputusan Hiring: get all outcomes ──────────────────────────────────────
export async function getHiringDecisions() {
  await requireRole("hrd", "superadmin");
  // Talent-pool candidates can be added while still at an earlier pipeline
  // stage (e.g. "Wawancara") — filtering strictly on status would silently
  // drop them from the talentPool bucket below even though they're correctly
  // shown on the dedicated /hrd/recruitment/talentpool page.
  const { data: apps, error } = await supabaseAdmin
    .from("pelamar")
    .select("*")
    .or("status.in.(Diterima,Ditolak),in_talent_pool.eq.true")
    .order("applied_at", { ascending: false });
  if (error) return { diterima: [], ditolak: [], talentPool: [] };

  const allApps = apps || [];
  const jobIds = [...new Set(allApps.map((a: Record<string, unknown>) => a.job_id as string).filter(Boolean))];
  const { data: jobs } = jobIds.length > 0
    ? await supabaseAdmin.from("lowongan_kerja").select("id, position, department").in("id", jobIds)
    : { data: [] };

  const jobMap: Record<string, { position: string; department: string }> = {};
  (jobs || []).forEach((j: Record<string, string>) => { jobMap[j.id] = { position: j.position, department: j.department }; });

  const withJob = allApps.map((a: Record<string, unknown>) => ({
    ...a,
    job: jobMap[a.job_id as string] || null,
  }));

  return {
    diterima: withJob.filter((a: Record<string, unknown>) => a.status === "Diterima"),
    ditolak: withJob.filter((a: Record<string, unknown>) => a.status === "Ditolak" && !a.in_talent_pool),
    talentPool: withJob.filter((a: Record<string, unknown>) => a.in_talent_pool === true),
  };
}

export async function respondToOffer(response: "accepted" | "counter", counterSalary?: number) {
  const session = await requireRole("applicant");
  const { data: user } = await supabaseAdmin
    .from("pengguna").select("application_id").eq("email", session.email).maybeSingle();
  if (!user?.application_id) return { error: "Lamaran tidak ditemukan." };

  const updates: Record<string, unknown> = {};
  if (response === "accepted") {
    const { data: app } = await supabaseAdmin
      .from("pelamar").select("offered_salary").eq("id", user.application_id).single();
    updates.final_salary = app?.offered_salary;
    updates.negotiation_status = "agreed";
  } else {
    updates.negotiation_status = "negotiating";
    updates.salary_expectation = counterSalary || null;
  }

  const { error } = await supabaseAdmin
    .from("pelamar").update(updates).eq("id", user.application_id);
  if (error) return { error: error.message };
  revalidatePath("/applicant/test");
  return { success: true };
}
