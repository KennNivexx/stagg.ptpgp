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

  if (error || !data) {
    return null;
  }

  return data;
}

export async function submitLeave(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const leaveType = formData.get("leave_type") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const reason = formData.get("reason") as string;

  if (!leaveType || !startDate || !endDate) {
    return { error: "Jenis cuti, tanggal mulai, dan tanggal selesai wajib diisi." };
  }

  if (new Date(endDate) < new Date(startDate)) {
    return { error: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
  }

  const { error } = await supabaseAdmin.from("leaves").insert([
    {
      employee_id: user.id,
      employee_name: user.name,
      employee_email: user.email,
      type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
      status: "Pending",
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/leaves");
  revalidatePath("/hrd/relations/leaves");
  return { success: true };
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
    return { error: error.message };
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
    return { error: error.message };
  }

  revalidatePath("/employee/resignation");
  revalidatePath("/hrd/relations/resignations");
  return { success: true };
}

export async function getEmployeeLeaves(employeeId: string) {
  const { data, error } = await supabaseAdmin
    .from("leaves")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getEmployeeComplaints(employeeId: string) {
  const { data, error } = await supabaseAdmin
    .from("complaints")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error && !error.message.includes("Could not find the table")) return [];
  return data || [];
}

export async function getEmployeeResignation(employeeId: string) {
  const { data, error } = await supabaseAdmin
    .from("resignations")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error && !error.message.includes("Could not find the table")) return null;
  return data?.[0] || null;
}

export async function getEmployeeWarnings(employeeId: string) {
  const { data, error } = await supabaseAdmin
    .from("warnings")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error && !error.message.includes("Could not find the table")) return [];
  return data || [];
}

export async function issueWarning(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

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

  if (error && !error.message.includes("Could not find the table")) {
    return { error: error.message };
  }

  revalidatePath("/hrd/relations/warnings");
  revalidatePath("/employee/warnings");
  return { success: true };
}
