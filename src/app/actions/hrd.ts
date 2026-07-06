"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { hashPassword, generateNumericPassword, generateCompanyEmailUnique } from "@/lib/auth";
import { generateOneTimeToken } from "@/lib/otp-token";
import { requireRole } from "@/lib/auth-guard";
import { sendMail, emailApplicantLoginLink, emailEmployeeLoginLink } from "@/lib/mailer";
import { auditLog } from "@/lib/audit";

// Always query fresh — a module-level cache would permanently freeze to false
// if the DB returned a transient error on the first cold request.
async function usersTableExists(): Promise<boolean> {
  const { error } = await supabaseAdmin.from("users").select("id").limit(1);
  return !error || !error.message.includes("Could not find the table");
}

export async function createJob(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;

  const { error } = await supabaseAdmin
    .from("job_postings")
    .insert([
      {
        id: crypto.randomUUID(),
        position: title,
        department,
        location,
        requirements: description || "",
      },
    ]);

  if (error) {
    console.error("[hrd] createJob error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/hrd/recruitment");
  revalidatePath("/career");
  auditLog({
    action: "job.create",
    targetName: title,
    performedBy: user,
    detail: `Departemen: ${department}`,
  });
  return { success: true };
}

export async function createEmployee(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const join_date = formData.get("join_date") as string;
  const status = formData.get("status") as string || "Tetap";
  const orgCode = (formData.get("org_code") as string) || "";
  const password = generateNumericPassword();
  const oneTimeToken = generateOneTimeToken(email || "");
  const tokenExpires = new Date(Date.now() + 86400000).toISOString();

  let normalizedEmail: string;

  if (email) {
    normalizedEmail = email.toLowerCase().trim();
    const { data: dup } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (dup) {
      return { error: `Email ${normalizedEmail} sudah digunakan. Gunakan email lain.` };
    }
  } else {
    const { data: existingEmails } = await supabaseAdmin
      .from("employees")
      .select("email");
    const usedEmails = (existingEmails || []).map((e: Record<string, unknown>) => e.email as string);
    normalizedEmail = generateCompanyEmailUnique(full_name, usedEmails);
  }

  const tableExists = await usersTableExists();
  if (tableExists) {
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1);
    if (checkError && !checkError.message.includes("Could not find the table")) {
      return { error: checkError.message };
    }
    if (existing && existing.length > 0) {
      return { error: "Email sudah terdaftar sebagai user." };
    }
  }

  const passwordHash = hashPassword(password);

  // authData is only stored in employees.address when the users table does NOT
  // exist. When the users table exists, the address column is left for the
  // employee's actual home address (saveable later via profile form).
  const authData = JSON.stringify({
    __auth__: { password_hash: passwordHash, role: "employee" },
    org_code: orgCode,
  });

  // Generate employee kode
  let kode = "";
  if (department) {
    const { data: orgUnit } = await supabaseAdmin.from("org_units").select("code").eq("name", department).maybeSingle();
    if (orgUnit) {
      const segments = (orgUnit.code as string).split(".");
      const { count } = await supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("department", department);
      const seq = (count || 0) + 1;
      const firstZero = segments.findIndex(s => Number(s) === 0);
      if (firstZero >= 0) segments[firstZero] = String(seq);
      else segments.push(String(seq));
      kode = segments.join(".");
    }
  }

  // When users table exists, store the real address; otherwise embed auth JSON
  // in address as a fallback auth mechanism.
  const storedAddress = tableExists ? (address || "") : (address || authData);

  const empData: Record<string, unknown> = {
    full_name, email: normalizedEmail, phone, address: storedAddress,
    department, position, join_date, status,
  };
  if (kode) empData.kode = kode;

  const { error: empError } = await supabaseAdmin
    .from("employees")
    .insert([empData])
    .select("id")
    .single();

  if (empError) {
    return { error: empError.message };
  }

  if (tableExists) {
    await supabaseAdmin
      .from("users")
      .insert([
        {
          email: normalizedEmail,
          password_hash: passwordHash,
          role: "employee",
          full_name,
          one_time_token: oneTimeToken,
          one_time_token_expires: tokenExpires,
        },
      ]);
  }

  revalidatePath("/hrd/employees");
  auditLog({
    action: "employee.create",
    targetId: normalizedEmail,
    targetName: full_name,
    performedBy: user,
  });

  return { success: true, email: normalizedEmail, password, phone };
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const user = await requireRole("hrd", "superadmin");

  // Fetch application email before update (needed for account deletion)
  const { data: application } = await supabaseAdmin
    .from("applications")
    .select("email, full_name")
    .eq("id", applicationId)
    .maybeSingle();

  const updates: Record<string, unknown> = { status };
  if (status === "Interview") updates.reached_interview = true;

  const { error } = await supabaseAdmin
    .from("applications")
    .update(updates)
    .eq("id", applicationId);

  if (error) {
    console.error("[hrd] updateApplicationStatus error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  // Mark temporary applicant account for deletion in 24 hours when rejected
  // so the applicant can still login and see the rejection notice.
  if (status === "Ditolak" && application) {
    const appEmail = (application as { email: string }).email;
    if (appEmail) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from("users")
        .update({ expires_at: expiresAt })
        .eq("email", appEmail)
        .eq("role", "applicant")
        .eq("is_temporary", true);
    }
  }

  revalidatePath("/hrd/recruitment");
  auditLog({
    action: "application.update",
    targetId: applicationId,
    targetName: (application as { full_name?: string } | null)?.full_name || "",
    performedBy: user,
    detail: `Status diubah menjadi ${status}`,
  });
  return { success: true };
}

export async function convertApplicantToEmployee(applicationId: string, formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const join_date = formData.get("join_date") as string || new Date().toISOString().split("T")[0];
  const status = formData.get("status") as string || "Tetap";
  const password = (formData.get("password") as string) || generateNumericPassword();

  const { data: application, error: appError } = await supabaseAdmin
    .from("applications")
    .select("full_name, email, phone")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return { error: "Data pelamar tidak ditemukan." };
  }

  const normalizedEmail = (application.email as string).toLowerCase().trim();
  const oneTimeToken = generateOneTimeToken(normalizedEmail);
  const tokenExpires = new Date(Date.now() + 86400000).toISOString();

  // Check if a non-applicant user already exists with this email
  if (await usersTableExists()) {
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("email", normalizedEmail)
      .limit(1);

    if (existing && existing.length > 0) {
      const existingRole = existing[0].role as string;
      if (existingRole !== "applicant") {
        return { error: "Email sudah terdaftar sebagai karyawan." };
      }
    }
  }

  // Generate sequential org kode: try position → department name in org_units
  let kode = "";
  {
    let orgUnitCode: string | null = null;
    const { data: byPos } = await supabaseAdmin.from("org_units").select("code").eq("name", position).maybeSingle();
    if (byPos) {
      orgUnitCode = (byPos as { code: string }).code;
    } else {
      const { data: byDept } = await supabaseAdmin.from("org_units").select("code").eq("name", department).maybeSingle();
      if (byDept) orgUnitCode = (byDept as { code: string }).code;
    }
    if (orgUnitCode) {
      const segments = orgUnitCode.split(".");
      const firstZero = segments.findIndex(s => Number(s) === 0);
      if (firstZero >= 0) {
        const prefix = segments.slice(0, firstZero).join(".");
        const { data: existing } = await supabaseAdmin
          .from("employees").select("kode").like("kode", `${prefix}.%`);
        const maxSeq = ((existing || []) as { kode: string | null }[]).reduce((max, e) => {
          if (!e.kode) return max;
          const n = Number(e.kode.split(".")[firstZero] || 0);
          return n > max ? n : max;
        }, 0);
        segments[firstZero] = String(maxSeq + 1);
        kode = segments.join(".");
      }
    }
  }

  const { error: empError } = await supabaseAdmin
    .from("employees")
    .insert([{
      full_name: application.full_name,
      email: normalizedEmail,
      phone: application.phone || null,
      department,
      position,
      join_date,
      status,
      ...(kode ? { kode } : {}),
    }]);

  if (empError) {
    return { error: empError.message };
  }

  // Upgrade the existing applicant account to employee (persist, don't delete)
  if (await usersTableExists()) {
    const passwordHash = hashPassword(password);
    const { data: existingApplicant } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("role", "applicant")
      .maybeSingle();

    if (existingApplicant) {
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          password_hash: passwordHash,
          role: "employee",
          is_temporary: false,
          expires_at: null,
          application_id: null,
          one_time_token: oneTimeToken,
          one_time_token_expires: tokenExpires,
        })
        .eq("email", normalizedEmail)
        .eq("role", "applicant");

      if (updateError) {
        return { error: "Data karyawan dibuat tetapi gagal meng-upgrade akun: " + updateError.message };
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert([{
          email: normalizedEmail,
          password_hash: passwordHash,
          role: "employee",
          full_name: application.full_name,
          one_time_token: oneTimeToken,
          one_time_token_expires: tokenExpires,
        }]);

      if (insertError) {
        return { error: "Data karyawan dibuat tetapi gagal membuat akun login: " + insertError.message };
      }
    }
  }

  await supabaseAdmin
    .from("applications")
    .update({ status: "Diterima" })
    .eq("id", applicationId);

  revalidatePath("/hrd/recruitment");
  revalidatePath("/hrd/employees");

  // Send welcome email with employee credentials
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.ptpgp.co.id";
  let emailWarning: string | undefined;
  try {
    await sendMail({
      to: normalizedEmail,
      subject: "Selamat! Anda Resmi Bergabung — PT Pratama Galuh Perkasa",
      html: emailEmployeeLoginLink({
        name: application.full_name as string,
        email: normalizedEmail,
        loginUrl: `${appUrl}/login/token?t=${oneTimeToken}`,
      }),
    });
  } catch (err) {
    console.error("Failed to send employee credentials email:", err);
    emailWarning = "Akun berhasil dibuat tetapi email kredensial gagal dikirim. Beritahu karyawan untuk login dengan email mereka.";
  }

  auditLog({
    action: "applicant.convert",
    targetId: applicationId,
    targetName: application.full_name as string,
    performedBy: user,
    detail: `Dikonversi menjadi karyawan - ${department}/${position}`,
  });
  return { success: true, password: await usersTableExists() ? password : undefined, ...(emailWarning ? { warning: emailWarning } : {}) };
}

export async function updateEmployeeStatus(employeeId: string, status: string) {
  const user = await requireRole("hrd", "superadmin");

  const { error } = await supabaseAdmin
    .from("employees")
    .update({ status })
    .eq("id", employeeId);

  if (error) {
    console.error("[hrd] updateEmployeeStatus error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  if (status === "Inactive" || status === "Suspended" || status === "Resigned" || status === "Terminated") {
    if (await usersTableExists()) {
      const { data: emp } = await supabaseAdmin
        .from("employees")
        .select("email")
        .eq("id", employeeId)
        .single();

      if (emp) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from("users")
          .update({ expires_at: expiresAt })
          .eq("email", emp.email as string);
      }
    }
  } else if (await usersTableExists()) {
    // Reactivation (e.g. status set back to active) — clear any pending
    // expiry from a previous suspension so the account doesn't still
    // expire on the old schedule.
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("email")
      .eq("id", employeeId)
      .single();
    if (emp) {
      await supabaseAdmin
        .from("users")
        .update({ expires_at: null })
        .eq("email", emp.email as string);
    }
  }

  revalidatePath("/hrd/employees");
  auditLog({
    action: "employee.status_change",
    targetId: employeeId,
    performedBy: user,
    detail: `Status diubah menjadi ${status}`,
  });
  return { success: true };
}

export async function updateEmployee(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const id = formData.get("id") as string;
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const join_date = formData.get("join_date") as string;
  const status = formData.get("status") as string;

  if (!id || !full_name || !email) {
    return { error: "ID, nama, dan email wajib diisi." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Get old employee data to know if email changed.
  const { data: oldEmp, error: fetchError } = await supabaseAdmin
    .from("employees")
    .select("email")
    .eq("id", id)
    .single();

  if (fetchError || !oldEmp) {
    return { error: "Karyawan tidak ditemukan." };
  }

  const oldEmail = (oldEmp.email as string).toLowerCase().trim();

  // Personal/family data (phone, address, NIK, KTP details, emergency contact,
  // etc.) is intentionally NOT accepted here — it's self-service only, filled
  // by the employee via their own account after face registration. HRD can
  // only view it (see infrastructure/employees), never overwrite it from here.
  const { error } = await supabaseAdmin
    .from("employees")
    .update({
      full_name,
      email: normalizedEmail,
      department,
      position,
      join_date,
      status,
    })
    .eq("id", id);

  if (error) {
    console.error("[hrd] updateEmployee error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  if (await usersTableExists()) {
    // Check if user exists with old email
    const { data: oldUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", oldEmail)
      .limit(1);

    if (oldUser && oldUser.length > 0) {
      // User exists with old email, update their email and full_name
      const { error: userUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          email: normalizedEmail,
          full_name,
        })
        .eq("email", oldEmail);

      if (userUpdateError) {
        return { error: "Data karyawan diperbarui, tetapi gagal memperbarui akun login: " + userUpdateError.message };
      }
    } else {
      // User did not exist, create new login account!
      // Check first if the new email already exists in users table (to avoid conflicts)
      const { data: newUserCheck } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .limit(1);

      if (!newUserCheck || newUserCheck.length === 0) {
        const newPw = generateNumericPassword();
        const passwordHash = hashPassword(newPw);
        const { error: userInsertError } = await supabaseAdmin
          .from("users")
          .insert([
            {
              email: normalizedEmail,
              password_hash: passwordHash,
              role: "employee",
              full_name,
            },
          ]);

        if (userInsertError) {
          return { error: "Data karyawan diperbarui, tetapi gagal membuat akun login baru: " + userInsertError.message };
        }
      }
    }
  }

  revalidatePath("/hrd/employees");
  auditLog({
    action: "employee.update",
    targetId: id,
    targetName: full_name,
    performedBy: user,
  });
  return { success: true };
}

export async function resetEmployeePassword(employeeId: string) {
  const user = await requireRole("superadmin");

  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("email, full_name, phone")
    .eq("id", employeeId)
    .single();

  if (!emp) {
    return { error: "Karyawan tidak ditemukan." };
  }

  const newPassword = generateNumericPassword();

  if (await usersTableExists()) {
    const passwordHash = hashPassword(newPassword);

    const { error } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", emp.email as string);

    if (error) {
      console.error("[hrd] resetEmployeePassword error:", error.message);
      return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
    }
  }

  auditLog({
    action: "employee.password_reset",
    targetId: employeeId,
    targetName: emp.full_name as string,
    performedBy: user,
  });

  const phone = (emp.phone as string) || "";

  revalidatePath("/superadmin/employees");

  return { success: true, password: newPassword, email: emp.email as string, phone };
}

export async function resetUserPasswordByEmail(userEmail: string) {
  await requireRole("superadmin");

  const newPassword = generateNumericPassword();
  const passwordHash = hashPassword(newPassword);

  const { error } = await supabaseAdmin
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("email", userEmail.toLowerCase().trim());

  if (error) {
    console.error("[hrd] resetUserPasswordByEmail error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/superadmin/employees");
  return { success: true, password: newPassword, email: userEmail };
}

export async function deleteEmployee(employeeId: string) {
  const user = await requireRole("hrd", "superadmin");

  if (await usersTableExists()) {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("email")
      .eq("id", employeeId)
      .single();

    if (emp) {
      await supabaseAdmin
        .from("users")
        .delete()
        .eq("email", emp.email as string);
    }
  }

  const { error } = await supabaseAdmin
    .from("employees")
    .delete()
    .eq("id", employeeId);

  if (error) {
    console.error("[hrd] deleteEmployee error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  auditLog({
    action: "employee.delete",
    targetId: employeeId,
    performedBy: user,
  });

  revalidatePath("/hrd/employees");
  return { success: true };
}

export async function updateJobStatus(jobId: string, status: string) {
  const user = await requireRole("hrd", "superadmin");

  const { error } = await supabaseAdmin
    .from("job_postings")
    .update({ status })
    .eq("id", jobId);

  if (error) {
    console.error("[hrd] updateJobStatus error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/hrd/recruitment");
  revalidatePath("/career");
  auditLog({
    action: "job.status_change",
    targetId: jobId,
    performedBy: user,
    detail: `Status diubah menjadi ${status}`,
  });
  return { success: true };
}

export async function submitApplication(formData: FormData) {
  const job_id = formData.get("job_id") as string;
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string || "";
  const profile_data = formData.get("profile_data") as string || "{}";

  if (!job_id || !full_name || !email) {
    return { error: "Nama dan email wajib diisi." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Prevent duplicate application with same email for same job
  const { data: dupApp } = await supabaseAdmin
    .from("applications")
    .select("id, status")
    .eq("email", normalizedEmail)
    .eq("job_id", job_id)
    .maybeSingle();

  if (dupApp && (dupApp.status as string) !== "Ditolak") {
    return { error: "Anda sudah pernah melamar untuk posisi ini." };
  }

  const applicationId = "app-" + crypto.randomUUID();

  const { error } = await supabaseAdmin
    .from("applications")
    .insert([{
      id: applicationId,
      job_id,
      full_name,
      email: normalizedEmail,
      phone,
      resume_url: profile_data,
      status: "Menunggu Review",
    }]);

  if (error) {
    console.error("[hrd] submitApplication error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  // Handle CV file upload
  let cvUploadError: string | undefined;
  const cvFile = formData.get("cv_file") as File | null;
  if (cvFile && cvFile.size > 0) {
    const MAX_CV_SIZE = 5 * 1024 * 1024;
    if (cvFile.size > MAX_CV_SIZE) {
      cvUploadError = "File CV terlalu besar (maksimal 5 MB). Lamaran tetap tercatat.";
    } else {
      try {
        const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
        const cvFilename = `applications/${normalizedEmail}/${crypto.randomUUID()}.pdf`;
        const { error: cvErr } = await supabaseAdmin.storage
          .from("attendance-photos")
          .upload(cvFilename, cvBuffer, { contentType: "application/pdf", upsert: true });
        if (!cvErr) {
          const { data: cvUrlData } = await supabaseAdmin.storage
            .from("attendance-photos")
            .createSignedUrl(cvFilename, 7200);
          if (cvUrlData?.signedUrl) {
            // Merge cv_url into the existing profile JSON instead of overwriting it
            let merged: Record<string, unknown> = {};
            try { merged = JSON.parse(profile_data) || {}; } catch { /* ignore */ }
            merged.cv_url = cvUrlData.signedUrl;
            await supabaseAdmin.from("applications").update({ resume_url: JSON.stringify(merged) }).eq("id", applicationId);
          }
        }
      } catch {
        cvUploadError = "Gagal mengunggah CV. Lamaran tetap tercatat tanpa CV.";
      }
    }
  }

  // Create temporary applicant account so they can track their application
  let tempPassword: string | undefined;
  let oneTimeToken = "";
  let accountCreated = false;
  let accountWarning: string | undefined;

  try {
    // Check if user with this email already exists (might have applied before)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!existingUser) {
      // Generate a readable temp password: 3 words style e.g. "Lamar2026!"
      const numArr = new Uint16Array(1);
      crypto.getRandomValues(numArr);
      const randomNum = 1000 + (numArr[0] % 9000);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const charArr = new Uint8Array(1);
      crypto.getRandomValues(charArr);
      const suffix = chars[charArr[0] % chars.length];
      tempPassword = `Lamar${randomNum}${suffix}`;

      const passwordHash = hashPassword(tempPassword);
      oneTimeToken = generateOneTimeToken(normalizedEmail);
      const tokenExpires = new Date(Date.now() + 86400000).toISOString();

      const { error: insertErr } = await supabaseAdmin.from("users").insert([{
        email: normalizedEmail,
        password_hash: passwordHash,
        role: "applicant",
        full_name,
        application_id: applicationId,
        is_temporary: true,
        one_time_token: oneTimeToken,
        one_time_token_expires: tokenExpires,
      }]);

      if (insertErr) {
        console.error("Failed to create applicant user record:", insertErr);
        accountWarning = "Akun portal pelamar gagal dibuat. Silakan hubungi HRD untuk mendapatkan akun.";
      } else {
        accountCreated = true;
      }
    } else if (existingUser.role === "applicant") {
      // Update application_id and full_name to the latest application
      const { error: updateErr } = await supabaseAdmin.from("users").update({ application_id: applicationId, full_name }).eq("email", normalizedEmail);
      if (updateErr) {
        console.error("Failed to update applicant user application_id:", updateErr);
      } else {
        accountWarning = "Anda sudah memiliki akun pelamar. Gunakan password yang sama seperti sebelumnya untuk login.";
      }
    } else {
      // Existing user is employee/hrd/etc — don't overwrite their account
      accountWarning = "Email Anda sudah terdaftar sebagai karyawan. Gunakan akun karyawan Anda untuk login.";
    }
  } catch (e) {
    // Account creation failure is non-fatal — application still submitted
    console.error("Failed to create applicant account:", e);
    accountWarning = "Akun portal pelamar gagal dibuat. Silakan hubungi HRD.";
  }

  // Send credentials via Gmail (non-fatal)
  let emailWarning: string | undefined;
  if (accountCreated && tempPassword) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.ptpgp.co.id";
    await sendMail({
      to: normalizedEmail,
      subject: "Akun Portal Pelamar Anda — PT Pratama Galuh Perkasa",
      html: emailApplicantLoginLink({
        name: full_name,
        email: normalizedEmail,
        loginUrl: `${appUrl}/login/token?t=${oneTimeToken}`,
      }),
    }).catch(err => {
      console.error("Failed to send applicant credentials email:", err);
      emailWarning = "Lamaran tercatat tetapi email kredensial gagal dikirim.";
    });
  }

  revalidatePath("/career");
  revalidatePath("/hrd/recruitment");

  return {
    success: true,
    applicationId,
    accountCreated,
    credentials: accountCreated ? { email: normalizedEmail, password: tempPassword } : null,
    accountWarning: accountWarning || emailWarning || cvUploadError || null,
  };
}

export async function updateEmployeeAsSuperadmin(formData: FormData) {
  const user = await requireRole("superadmin");

  const id = formData.get("id") as string;
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const status = formData.get("status") as string;
  const role = formData.get("role") as string;
  const newPassword = formData.get("new_password") as string;

  const authData: Record<string, unknown> = { role };

  if (newPassword) {
    authData.password_hash = hashPassword(newPassword);
  } else {
    const { data: existing } = await supabaseAdmin
      .from("employees")
      .select("address")
      .eq("id", id)
      .single();
    if (existing?.address) {
      try {
        const parsed = JSON.parse(existing.address as string);
        if (parsed.__auth__?.password_hash) {
          authData.password_hash = parsed.__auth__.password_hash;
        }
      } catch {
        // address JSON is malformed, skip auth data
      }
    }
  }

  const { error } = await supabaseAdmin
    .from("employees")
    .update({
      full_name,
      email: email.toLowerCase().trim(),
      department,
      position,
      status,
      address: JSON.stringify({ __auth__: authData }),
    })
    .eq("id", id);

  if (error) { console.error("[hrd] updateEmployeeAsSuperadmin error:", error.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  // Also update the users table if it exists
  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      const userUpdates: Record<string, unknown> = {
        full_name: full_name || undefined,
      };
      if (newPassword) {
        userUpdates.password_hash = hashPassword(newPassword);
      }
      if (role) {
        userUpdates.role = role;
      }
      await supabaseAdmin.from("users").update(userUpdates).eq("email", normalizedEmail);
    }
  }

  revalidatePath("/superadmin/employees");
  auditLog({
    action: "employee.update",
    targetId: id,
    targetName: full_name,
    performedBy: user,
    detail: `Superadmin update - role: ${role}, status: ${status}`,
  });
  return { success: true, password: newPassword || undefined };
}

export async function getEmployeeById(id: string) {
  await requireRole("hrd", "superadmin");

  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;

  // When employees.address holds the legacy auth JSON blob, extract the real
  // home address (if any) so the edit form shows a readable value instead of
  // the raw JSON string.
  const emp = data as Record<string, unknown>;
  let displayAddress = emp.address as string || "";
  try {
    const parsed = JSON.parse(emp.address as string || "{}");
    if (parsed.__auth__) displayAddress = parsed.home_address || "";
  } catch { /* plain address, already correct */ }

  return { ...emp, address: displayAddress };
}

export async function getEmployees(status?: string) {
  await requireRole("hrd", "superadmin");

  let query = supabaseAdmin
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function getApplicantDetail(applicantId: string, jobId: string) {
  await requireRole("hrd", "superadmin");

  const [{ data: application }, { data: job }] = await Promise.all([
    supabaseAdmin.from("applications").select("*").eq("id", applicantId).single(),
    supabaseAdmin.from("job_postings").select("position, department").eq("id", jobId).single(),
  ]);

  return { application, job };
}
