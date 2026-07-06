"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function getCurrentEmployee() {
  const user = await requireRole("employee", "hrd", "superadmin");

  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("*")
    .eq("email", user.email)
    .single();

  if (error || !data) return null;

  const emp = data as Record<string, unknown>;

  // When employees.address contains the legacy auth JSON blob, extract the
  // actual home address from home_address so the profile form shows a readable
  // value instead of a raw JSON string.
  let displayAddress = emp.address as string || "";
  try {
    const parsed = JSON.parse(emp.address as string || "{}");
    if (parsed.__auth__) displayAddress = parsed.home_address || "";
  } catch { /* plain address, already correct */ }

  return { ...emp, address: displayAddress };
}

export async function submitComplaint(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const subject = formData.get("subject") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;

  if (!subject || !description) {
    return { error: "Subjek dan deskripsi keluhan wajib diisi." };
  }

  const { error } = await supabaseAdmin.from("complaints").insert([
    {
      employee_id: user.id,
      employee_name: user.name,
      employee_email: user.email,
      subject,
      category: category || "Umum",
      description,
      status: "Diajukan",
    },
  ]);

  if (error && !error.message.includes("Could not find the table")) {
    console.error("[employee] submitComplaint error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/employee/complaints");
  revalidatePath("/hrd/relations/complaints");
  return { success: true };
}

export async function submitResignation(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const reason = formData.get("reason") as string;
  const lastDay = formData.get("last_day") as string;
  const notes = formData.get("notes") as string;

  if (!reason || !lastDay) {
    return { error: "Alasan dan tanggal terakhir kerja wajib diisi." };
  }

  const { error } = await supabaseAdmin.from("resignations").insert([
    {
      employee_id: user.id,
      employee_name: user.name,
      employee_email: user.email,
      reason,
      last_day: lastDay,
      notes: notes || null,
      status: "Diajukan",
    },
  ]);

  if (error && !error.message.includes("Could not find the table")) {
    console.error("[employee] submitResignation error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/employee/resignation");
  revalidatePath("/hrd/relations/resignations");
  return { success: true };
}

export async function getEmployeeLeaves(employeeId: string) {
  const user = await requireRole("employee", "hrd", "superadmin");
  // Employee can only see own leaves; HRD/superadmin can see any
  const targetId = user.role === "employee" ? user.id : employeeId;

  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("employee_id", targetId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getEmployeeComplaints(employeeId: string) {
  const user = await requireRole("employee", "hrd", "superadmin");
  const targetId = user.role === "employee" ? user.id : employeeId;

  const { data, error } = await supabaseAdmin
    .from("complaints")
    .select("*")
    .eq("employee_id", targetId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getEmployeeResignation(employeeId: string) {
  const user = await requireRole("employee", "hrd", "superadmin");
  const targetId = user.role === "employee" ? user.id : employeeId;

  const { data, error } = await supabaseAdmin
    .from("resignations")
    .select("*")
    .eq("employee_id", targetId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return null;
  return data?.[0] || null;
}

export async function getEmployeeWarnings(employeeId: string) {
  const user = await requireRole("employee", "hrd", "superadmin", "department_manager");
  const targetId = user.role === "employee" ? user.id : employeeId;

  const { data, error } = await supabaseAdmin
    .from("warnings")
    .select("*")
    .eq("employee_id", targetId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function issueWarning(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "department_manager");

  const employeeId = formData.get("employee_id") as string;
  const employeeName = formData.get("employee_name") as string;
  const employeeEmail = formData.get("employee_email") as string;
  const spLevel = formData.get("sp_level") as string;
  const reason = formData.get("reason") as string;
  const validUntil = formData.get("valid_until") as string;

  if (!employeeId || !spLevel || !reason) {
    return { error: "Karyawan, level SP, dan alasan wajib diisi." };
  }

  const { error } = await supabaseAdmin.from("warnings").insert([
    {
      employee_id: employeeId,
      employee_name: employeeName,
      employee_email: employeeEmail,
      sp_level: spLevel,
      reason,
      valid_until: validUntil || null,
      issued_by: user.name,
      status: "Aktif",
    },
  ]);

  if (error?.code === "42P01" || error?.message?.includes("Could not find the table")) {
    return { error: "Tabel surat peringatan belum tersedia. Jalankan migrasi terlebih dahulu." };
  }
  if (error) {
    console.error("[employee] issueWarning error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/hrd/relations/warnings");
  revalidatePath("/employee/warnings");
  return { success: true };
}

/** Flips any "Aktif" warning whose valid_until has passed to "Kadaluarsa".
 * Called at warnings page load — no cron in this environment, so expiry is
 * applied lazily whenever the list is viewed. */
export async function expireOldWarnings() {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabaseAdmin
    .from("warnings")
    .update({ status: "Kadaluarsa" })
    .eq("status", "Aktif")
    .not("valid_until", "is", null)
    .lt("valid_until", today);

  if (error && error.code !== "42P01" && !error.message?.includes("Could not find the table")) {
    console.error("[employee] expireOldWarnings error:", error.message);
  }
}

export async function markWarningExpired(id: string) {
  await requireRole("hrd", "superadmin", "department_manager");
  const { error } = await supabaseAdmin
    .from("warnings")
    .update({ status: "Kadaluarsa" })
    .eq("id", id);

  if (error) {
    console.error("[employee] markWarningExpired error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }
  revalidatePath("/hrd/relations/warnings");
  revalidatePath("/employee/warnings");
  return { success: true };
}
