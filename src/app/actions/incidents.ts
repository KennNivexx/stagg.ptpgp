"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { submitIncidentForEmployee } from "@/lib/incidents-core";

const uid = () => crypto.randomUUID();

export async function submitIncident(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  const lat = (formData.get("latitude") as string || "").trim();
  const lng = (formData.get("longitude") as string || "").trim();
  const result = await submitIncidentForEmployee({
    employeeId: user.id,
    employeeEmail: user.email,
    employeeName: user.name,
    vehicle_id: (formData.get("vehicle_id") as string || "").trim() || undefined,
    title: (formData.get("title") as string || "").trim(),
    description: (formData.get("description") as string || "").trim(),
    severity: (formData.get("severity") as string || "Ringan").trim(),
    photo_url: (formData.get("photo_url") as string || "").trim() || undefined,
    latitude: lat ? parseFloat(lat) : undefined,
    longitude: lng ? parseFloat(lng) : undefined,
  });
  if ("success" in result) {
    revalidatePath("/hrd/incidents");
    revalidatePath("/department/incidents");
    revalidatePath("/employee");
  }
  return result;
}

/** Tombol SOS darurat — versi ringkas dari submitIncident, judul & severity
 * otomatis, langsung notify HRD + kepala departemen (lihat incidents-core.ts). */
export async function triggerSOS(latitude?: number, longitude?: number): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  return submitIncidentForEmployee({
    employeeId: user.id,
    employeeEmail: user.email,
    employeeName: user.name,
    title: "SOS Darurat",
    description: "Karyawan menekan tombol SOS darurat dari lapangan.",
    severity: "Berat",
    latitude, longitude,
    isSos: true,
  });
}

/**
 * Same approval convention as leave_requests/business_trips: the department
 * manager decides on reports from their own department, HRD is report-only.
 */
export async function updateIncidentStatus(id: string, status: string, resolutionNotes?: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("department_manager", "superadmin");

  const { data: report } = await supabaseAdmin.from("laporan_insiden").select("employee_id, department, title, status").eq("id", id).maybeSingle();
  if (!report) return { error: "Laporan tidak ditemukan." };
  const r = report as Record<string, unknown>;

  if (user.role === "department_manager") {
    const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
    const myDept = (mgr as { department?: string } | null)?.department;
    if (!myDept || myDept !== r.department) {
      return { error: "Akses ditolak: bukan karyawan departemen Anda." };
    }
  }

  await supabaseAdmin.from("laporan_insiden").update({
    status, resolved_by: user.name, resolution_notes: resolutionNotes || null, updated_at: new Date().toISOString(),
  }).eq("id", id);

  const empEmail = await getEmployeeEmail(r.employee_id as string);
  if (empEmail) {
    await supabaseAdmin.from("notifikasi").insert({
      id: uid(), user_email: empEmail,
      title: `Laporan Insiden: ${status}`,
      message: `Laporan "${r.title}" Anda diperbarui menjadi status "${status}".`,
      link: "/employee",
    });
  }

  revalidatePath("/hrd/incidents");
  revalidatePath("/department/incidents");
  revalidatePath("/employee");
  return { success: true };
}

async function getEmployeeEmail(employeeId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("pengguna").select("email").eq("id", employeeId).maybeSingle();
  return (data as Record<string, unknown>)?.email as string || null;
}

export async function getIncidents(params?: { status?: string }) {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  let q = supabaseAdmin.from("laporan_insiden").select("*").order("created_at", { ascending: false });
  if (user.role === "employee") {
    q = q.eq("employee_id", user.id);
  } else if (user.role === "department_manager") {
    const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
    const myDept = (mgr as { department?: string } | null)?.department;
    q = q.eq("department", myDept || "__none__");
  }
  if (params?.status) q = q.eq("status", params.status);
  const { data } = await q.limit(100);
  return data || [];
}
