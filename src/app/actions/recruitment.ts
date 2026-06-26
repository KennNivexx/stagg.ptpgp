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
    .from("job_postings")
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
    .from("job_postings")
    .select("*")
    .eq("id", job_posting_id)
    .single();

  if (postingError || !jobPosting) {
    return { error: "Lowongan tidak ditemukan." };
  }

  const dept = department || (jobPosting.department as string);

  let kode = "";
  const { data: orgUnit } = await supabaseAdmin
    .from("org_units")
    .select("code")
    .eq("name", dept)
    .maybeSingle();

  if (orgUnit) {
    const segments = (orgUnit.code as string).split(".");
    const { count } = await supabaseAdmin
      .from("employees")
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
  const authData = JSON.stringify({
    __auth__: { password_hash: passwordHash, role: "employee" },
  });

  const { error: empError } = await supabaseAdmin
    .from("employees")
    .insert([
      {
        full_name,
        email: normalizedEmail,
        department: dept,
        position: position || jobPosting.position,
        join_date: new Date().toISOString().split("T")[0],
        status: "Tetap",
        kode: kode || null,
        address: authData,
      },
    ]);

  if (empError) {
    return { error: empError.message };
  }

  const { error: usersCheckError } = await supabaseAdmin
    .from("users")
    .select("id")
    .limit(1);
  const hasUsersTable = !usersCheckError || !usersCheckError.message.includes("Could not find the table");
  if (hasUsersTable) {
    // Upsert: if they had an applicant account, upgrade it; otherwise insert
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      await supabaseAdmin.from("users").update({
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
      await supabaseAdmin.from("users").insert([{
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
    .from("job_postings")
    .update(updates)
    .eq("id", job_posting_id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/hrd/recruitment");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workforce/headcount");

  // Send welcome email with employee credentials (non-fatal)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.ptpgp.co.id";
  sendMail({
    to: normalizedEmail,
    subject: "Selamat! Anda Resmi Bergabung — PT Pratama Galuh Perkasa",
    html: emailEmployeeLoginLink({
      name: full_name,
      email: normalizedEmail,
      loginUrl: `${appUrl}/login/token?t=${oneTimeToken}`,
    }),
  }).catch(err => console.error("Failed to send employee credentials email:", err));

  return { success: true };
}

// ── Reject applicant + set temp account expiry to 24h ──────────────────
export async function rejectApplicant(applicantId: string, applicantEmail: string) {
  await requireRole("hrd", "superadmin");

  const { error } = await supabaseAdmin
    .from("applications")
    .update({ status: "Ditolak" })
    .eq("id", applicantId);

  if (error) { console.error("[recruitment] rejectApplicant error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  // Mark temp applicant account for deletion in 24h (not immediate)
  // so the applicant can login and see the rejection notice.
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("users")
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
  const { error } = await supabaseAdmin.from("job_postings").insert({
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
    .from("job_postings")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[recruitment] updateJobPostingStatus error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/hrd/recruitment");
  return { success: true };
}
