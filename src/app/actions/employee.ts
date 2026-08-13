"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

export async function getCurrentEmployee() {
  const user = await requireRole("employee", "hrd", "superadmin");

  const { data, error } = await supabaseAdmin
    .from("karyawan")
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

  // "Data Pribadi (KK)" fields moved to the standalone data_pribadi_karyawan
  // table (keyed by email, no FK) — merge them in here, falling back to the
  // old karyawan columns for anyone who filled this in before the migration
  // and hasn't re-saved since, so nothing appears blank.
  const { data: pribadi } = await supabaseAdmin
    .from("data_pribadi_karyawan")
    .select("*")
    .eq("email", (user.email || "").toLowerCase())
    .maybeSingle();
  const p = (pribadi as Record<string, unknown> | null) || {};
  const pick = (key: string) => (p[key] ?? emp[key]) as unknown;

  return {
    ...emp,
    // phone/address now come from data_pribadi_karyawan too (falling back to
    // the legacy-blob-aware karyawan value for anyone who hasn't re-saved
    // since the migration) — see saveBasicProfile/saveContactProfile.
    phone: (p.phone as string) || (emp.phone as string) || "",
    address: (p.address as string) || displayAddress,
    nik: pick("nik"), birth_place: pick("birth_place"), birth_date: pick("birth_date"),
    religion: pick("religion"), blood_type: pick("blood_type"), marital_status: pick("marital_status"),
    spouse_name: pick("spouse_name"), children_count: pick("children_count"),
    ktp_address: pick("ktp_address"), last_education: pick("last_education"),
    emergency_name: pick("emergency_name"), emergency_phone: pick("emergency_phone"),
    npwp: pick("npwp"), bank_name: pick("bank_name"),
    bank_account_number: pick("bank_account_number"), bank_account_holder: pick("bank_account_holder"),
  };
}

export async function submitComplaint(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin", "department_manager");

  const subject = formData.get("subject") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;

  if (!subject || !description) {
    return { error: "Subjek dan deskripsi keluhan wajib diisi." };
  }

  const { error } = await supabaseAdmin.from("keluhan").insert([
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
  const user = await requireRole("employee", "hrd", "superadmin", "department_manager");

  const reason = formData.get("reason") as string;
  const lastDay = formData.get("last_day") as string;
  const notes = formData.get("notes") as string;

  if (!reason || !lastDay) {
    return { error: "Alasan dan tanggal terakhir kerja wajib diisi." };
  }

  const { error } = await supabaseAdmin.from("pengunduran_diri").insert([
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

  await auditLog({
    action: "resignation.submit", targetId: user.id, targetName: user.name,
    performedBy: user, detail: `Mengajukan pengunduran diri, hari terakhir kerja ${lastDay}.`,
  });

  revalidatePath("/employee/resignation");
  revalidatePath("/hrd/relations/resignations");
  return { success: true };
}

export async function getEmployeeLeaves(employeeId: string) {
  const user = await requireRole("employee", "hrd", "superadmin");
  // Employee can only see own leaves; HRD/superadmin can see any
  const targetId = user.role === "employee" ? user.id : employeeId;

  const { data, error } = await supabaseAdmin
    .from("pengajuan_cuti")
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
    .from("keluhan")
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
    .from("pengunduran_diri")
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
    .from("surat_peringatan")
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

  const { error } = await supabaseAdmin.from("surat_peringatan").insert([
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

  await auditLog({
    action: "warning.issue", targetId: employeeId, targetName: employeeName,
    performedBy: user, detail: `${spLevel} diterbitkan untuk ${employeeName} — ${reason}`,
  });

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
    .from("surat_peringatan")
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
    .from("surat_peringatan")
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

/**
 * Search employees with kode_jabatan & NIK, returns full employee data
 * including position/jabatan credentials for auto-fill on selection.
 */
export async function searchEmployees(query: string) {
  await requireRole("hrd", "superadmin");
  const trimmed = query.trim();
  if (!trimmed) {
    const { data } = await supabaseAdmin
      .from("karyawan")
      .select("id, full_name, kode, kode_jabatan, nik, position, department, email, status, join_date")
      .neq("status", "Inactive")
      .order("full_name")
      .limit(50);
    return data || [];
  }
  const { data } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, kode, kode_jabatan, nik, position, department, email, status, join_date")
    .neq("status", "Inactive")
    .or(`full_name.ilike.%${trimmed}%,nik.ilike.%${trimmed}%,kode.ilike.%${trimmed}%,kode_jabatan.ilike.%${trimmed}%`)
    .order("full_name")
    .limit(50);
  return data || [];
}

/**
 * Get single employee with complete data for auto-fill on selection.
 */
export async function getEmployeeById(employeeId: string) {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, kode, kode_jabatan, nik, position, department, email, status, join_date, phone, address")
    .eq("id", employeeId)
    .maybeSingle();
  return data || null;
}
