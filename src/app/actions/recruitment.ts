"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { hashPassword, generateRandomPassword } from "@/lib/auth";

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
    await supabaseAdmin.from("users").insert([
      {
        email: normalizedEmail,
        password_hash: passwordHash,
        role: "employee",
        full_name,
      },
    ]);
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

  return { success: true };
}

export async function updateJobPostingStatus(id: string, status: string) {
  await requireRole("hrd", "superadmin");

  const { error } = await supabaseAdmin
    .from("job_postings")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hrd/recruitment");
  return { success: true };
}
