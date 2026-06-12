"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { hashPassword, generateRandomPassword, generateCompanyEmailUnique } from "@/lib/auth";

let usersTableCache: boolean | null = null;

async function usersTableExists(): Promise<boolean> {
  if (usersTableCache !== null) return usersTableCache;
  const { error } = await supabaseAdmin.from("users").select("id").limit(1);
  usersTableCache = !error || !error.message.includes("Could not find the table");
  return usersTableCache;
}

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const location = formData.get("location") as string;
  const type = formData.get("type") as string;
  const description = formData.get("description") as string;
  const deadline = formData.get("deadline") as string;

  const { error } = await supabaseAdmin
    .from("jobs")
    .insert([
      {
        title,
        department,
        location,
        type,
        description,
        deadline: deadline || null,
      },
    ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hrd/recruitment");
  revalidatePath("/career");
  return { success: true };
}

export async function createEmployee(formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const join_date = formData.get("join_date") as string;
  const status = formData.get("status") as string || "Tetap";
  const orgCode = (formData.get("org_code") as string) || "";
  const password = generateRandomPassword();

  const { data: existingEmails } = await supabaseAdmin
    .from("employees")
    .select("email");

  const usedEmails = (existingEmails || []).map((e: Record<string, unknown>) => e.email as string);

  const companyEmail = email
    ? email.toLowerCase().trim()
    : generateCompanyEmailUnique(full_name, usedEmails);

  const normalizedEmail = companyEmail.toLowerCase().trim();

  if (usedEmails.includes(normalizedEmail) && !email) {
    return { error: "Gagal membuat email unik. Silakan masukkan email manual." };
  }

  if (usedEmails.includes(normalizedEmail) && email) {
    return { error: `Email ${normalizedEmail} sudah digunakan. Gunakan email lain.` };
  }

  let usersTableExists = true;
  const { data: existing, error: checkError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .limit(1);

  if (checkError) {
    if (checkError.message.includes("Could not find the table")) {
      usersTableExists = false;
    } else {
      return { error: checkError.message };
    }
  }

  if (usersTableExists && existing && existing.length > 0) {
    return { error: "Email sudah terdaftar sebagai user." };
  }

  const passwordHash = hashPassword(password);
  const authData = JSON.stringify({
    __auth__: { password_hash: passwordHash, role: "employee" },
    org_code: orgCode,
  });

  const { error: empError } = await supabaseAdmin
    .from("employees")
    .insert([
      {
        full_name,
        email: normalizedEmail,
        phone,
        address: address || authData,
        department,
        position,
        join_date,
        status,
      },
    ])
    .select("id")
    .single();

  if (empError) {
    return { error: empError.message };
  }

  if (usersTableExists) {
    await supabaseAdmin
      .from("users")
      .insert([
        {
          email: normalizedEmail,
          password_hash: passwordHash,
          role: "employee",
          full_name,
        },
      ]);
  }

  revalidatePath("/hrd/employees");
  return { success: true, email: normalizedEmail, password };
}

export async function updateLeaveStatus(leaveId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("leaves")
    .update({ status })
    .eq("id", leaveId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hrd/attendance");
  return { success: true };
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hrd/recruitment");
  return { success: true };
}

export async function convertApplicantToEmployee(applicationId: string, formData: FormData) {
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const join_date = formData.get("join_date") as string || new Date().toISOString().split("T")[0];
  const status = formData.get("status") as string || "Tetap";
  const password = (formData.get("password") as string) || generateRandomPassword();

  const { data: application, error: appError } = await supabaseAdmin
    .from("applications")
    .select("full_name, email, phone")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return { error: "Data pelamar tidak ditemukan." };
  }

  const normalizedEmail = (application.email as string).toLowerCase().trim();

  if (await usersTableExists()) {
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: "Email sudah terdaftar sebagai user." };
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
    }]);

  if (empError) {
    return { error: empError.message };
  }

  if (await usersTableExists()) {
    const passwordHash = hashPassword(password);

    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert([{
        email: normalizedEmail,
        password_hash: passwordHash,
        role: "employee",
        full_name: application.full_name,
      }]);

    if (userError) {
      return { error: "Akun karyawan dibuat tetapi gagal membuat login: " + userError.message };
    }
  }

  await supabaseAdmin
    .from("applications")
    .update({ status: "Diterima" })
    .eq("id", applicationId);

  revalidatePath("/hrd/recruitment");
  revalidatePath("/hrd/employees");
  return { success: true, password: await usersTableExists() ? password : undefined };
}

export async function updateEmployeeStatus(employeeId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("employees")
    .update({ status })
    .eq("id", employeeId);

  if (error) {
    return { error: error.message };
  }

  if (status === "Inactive" || status === "Suspended" || status === "Resigned" || status === "Terminated") {
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
  }

  revalidatePath("/hrd/employees");
  return { success: true };
}

export async function updateEmployee(formData: FormData) {
  const id = formData.get("id") as string;
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const join_date = formData.get("join_date") as string;
  const status = formData.get("status") as string;

  if (!id || !full_name || !email) {
    return { error: "ID, nama, dan email wajib diisi." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Get old employee data to know if email changed
  const { data: oldEmp, error: fetchError } = await supabaseAdmin
    .from("employees")
    .select("email")
    .eq("id", id)
    .single();

  if (fetchError || !oldEmp) {
    return { error: "Karyawan tidak ditemukan." };
  }

  const oldEmail = (oldEmp.email as string).toLowerCase().trim();

  const { error } = await supabaseAdmin
    .from("employees")
    .update({
      full_name,
      email: normalizedEmail,
      phone,
      address,
      department,
      position,
      join_date,
      status,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
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
        const passwordHash = hashPassword("password");
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
  return { success: true };
}

export async function resetEmployeePassword(employeeId: string) {
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("email, full_name")
    .eq("id", employeeId)
    .single();

  if (!emp) {
    return { error: "Karyawan tidak ditemukan." };
  }

  const newPassword = generateRandomPassword();

  if (await usersTableExists()) {
    const passwordHash = hashPassword(newPassword);

    const { error } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", emp.email as string);

    if (error) {
      return { error: error.message };
    }
  }

  return { success: true, password: newPassword, email: emp.email as string };
}

export async function deleteEmployee(employeeId: string) {
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
    return { error: error.message };
  }

  revalidatePath("/hrd/employees");
  return { success: true };
}

export async function updateJobStatus(jobId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("jobs")
    .update({ status })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hrd/recruitment");
  revalidatePath("/career");
  return { success: true };
}

export async function submitApplication(formData: FormData) {
  const job_id = formData.get("job_id") as string;
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const cv_filename = formData.get("cv_filename") as string;
  const profile_data = formData.get("profile_data") as string;

  if (!job_id || !full_name || !email) {
    return { error: "Nama dan email wajib diisi." };
  }

  const { error } = await supabaseAdmin
    .from("applications")
    .insert([{
      job_id,
      full_name,
      email,
      phone: phone || null,
      resume_url: JSON.stringify({
        cv_filename: cv_filename || null,
        profile: profile_data ? JSON.parse(profile_data) : null,
      }),
      status: "Menunggu Review",
    }]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hrd/recruitment");
  return { success: true };
}

export async function updateEmployeeAsSuperadmin(formData: FormData) {
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
      } catch {}
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

  if (error) return { error: error.message };

  revalidatePath("/superadmin/employees");
  return { success: true, password: newPassword || undefined };
}

export async function getEmployeeById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getEmployees(status?: string) {
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
  const [{ data: application }, { data: job }] = await Promise.all([
    supabaseAdmin.from("applications").select("*").eq("id", applicantId).single(),
    supabaseAdmin.from("jobs").select("title, department").eq("id", jobId).single(),
  ]);

  return { application, job };
}
