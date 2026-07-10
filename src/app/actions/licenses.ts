"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "lic-" + crypto.randomUUID();

export interface EmployeeLicense {
  id: string; employee_id: string; employee_name: string;
  category: string; license_type: string; license_number: string;
  issued_date: string | null; expiry_date: string; document_url: string;
  notes: string; created_at: string; updated_at: string;
}

export async function getLicenses(): Promise<EmployeeLicense[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("sim_sertifikasi_karyawan").select("*").order("expiry_date", { ascending: true });
  return (data as EmployeeLicense[]) || [];
}

/** SIM/sertifikasi milik karyawan yang login sendiri, untuk reminder pribadi. */
export async function getMyLicenses(): Promise<EmployeeLicense[]> {
  const user = await requireRole("employee", "department_manager", "hrd", "superadmin");
  const { data: emp } = await supabaseAdmin.from("karyawan").select("id").eq("email", user.email).maybeSingle();
  const employeeId = (emp as { id?: string } | null)?.id;
  if (!employeeId) return [];
  const { data } = await supabaseAdmin.from("sim_sertifikasi_karyawan").select("*").eq("employee_id", employeeId).order("expiry_date");
  return (data as EmployeeLicense[]) || [];
}

/** Generik untuk semua departemen — lihat komentar getFleetForDept di vehicles.ts. */
export async function getLicensesForDept(): Promise<{ licenses: EmployeeLicense[]; department: string | null }> {
  const user = await requireRole("department_manager", "superadmin");
  if (user.role === "superadmin") return { licenses: [], department: null };

  const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
  const myDept = (mgr as { department?: string } | null)?.department || null;
  if (!myDept) return { licenses: [], department: null };

  const { data: deptEmployees } = await supabaseAdmin.from("karyawan").select("id").eq("department", myDept);
  const employeeIds = (deptEmployees || []).map((e: { id: string }) => e.id);
  if (employeeIds.length === 0) return { licenses: [], department: myDept };

  const { data } = await supabaseAdmin.from("sim_sertifikasi_karyawan").select("*").in("employee_id", employeeIds).order("expiry_date");
  return { licenses: (data as EmployeeLicense[]) || [], department: myDept };
}

export async function saveLicense(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const employee_id = (formData.get("employee_id") as string || "").trim();
  const category = (formData.get("category") as string || "SIM").trim();
  const license_type = (formData.get("license_type") as string || "").trim();
  const license_number = (formData.get("license_number") as string || "").trim();
  const issued_date = (formData.get("issued_date") as string || "").trim() || null;
  const expiry_date = (formData.get("expiry_date") as string || "").trim();
  const document_url = (formData.get("document_url") as string || "").trim();
  const notes = (formData.get("notes") as string || "").trim();

  if (!employee_id || !license_type || !expiry_date) {
    return { error: "Karyawan, jenis, dan tanggal expiry wajib diisi." };
  }

  const { data: emp } = await supabaseAdmin.from("karyawan").select("full_name").eq("id", employee_id).maybeSingle();

  const { error } = await supabaseAdmin.from("sim_sertifikasi_karyawan").upsert({
    id: id || uid(),
    employee_id,
    employee_name: emp?.full_name || "",
    category, license_type, license_number, issued_date, expiry_date,
    document_url, notes,
    updated_at: new Date().toISOString(),
  });
  if (error) { console.error("[licenses] saveLicense error:", error.message); return { error: "Gagal menyimpan data." }; }
  revalidatePath("/hrd/infrastructure/licenses");
  return { success: true };
}

export async function deleteLicense(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("sim_sertifikasi_karyawan").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus data." };
  revalidatePath("/hrd/infrastructure/licenses");
  return { success: true };
}
