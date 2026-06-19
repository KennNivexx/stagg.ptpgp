"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "dept-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);

interface EmployeeRow {
  id: string; full_name: string; email: string; department: string;
  position: string; status: string; join_date: string;
}

interface RequestRow {
  id: string; department: string; position: string;
  quantity: number; reason: string; urgency: string; status: string;
  requested_by: string; created_at: string;
}

interface DeptRow {
  id: string; name: string; headcount: number;
}

interface OrgUnitRow {
  id: string; code: string; name: string; level: number;
  parent_code: string | null; leader_name: string | null; leader_email: string | null;
}

export async function getDeptData(deptName: string) {
  await requireRole("department_manager", "superadmin");

  const [
    { data: employees },
    { data: requests },
    { data: departments },
    { data: orgUnits },
  ] = await Promise.all([
    supabaseAdmin.from("employees").select("*").eq("department", deptName).order("full_name"),
    supabaseAdmin.from("workforce_requests").select("*").eq("department", deptName).order("created_at", { ascending: false }),
    supabaseAdmin.from("departments").select("*").eq("name", deptName).maybeSingle(),
    supabaseAdmin.from("org_units").select("*").ilike("name", `${deptName}%`).order("level").order("name"),
  ]);

  const headcount = (departments as DeptRow | null)?.headcount ?? 0;

  return {
    employees: (employees as EmployeeRow[]) || [],
    requests: (requests as RequestRow[]) || [],
    headcount,
    orgUnits: (orgUnits as OrgUnitRow[]) || [],
  };
}

export async function submitRequest(formData: FormData) {
  await requireRole("department_manager", "superadmin");

  const department = (formData.get("department") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();
  const quantity = parseInt(formData.get("quantity") as string || "1");
  const urgency = (formData.get("urgency") as string || "Sedang").trim();
  const reason = (formData.get("reason") as string || "").trim();
  const requested_by = (formData.get("requested_by") as string || "").trim();

  if (!department || !position) return { error: "Departemen dan posisi wajib diisi." };

  const id = uid();
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("workforce_requests").insert({
    id, department, position, quantity, reason, urgency, status: "Pending", requested_by, created_at: now,
  });
  if (error) {
    console.error("submitRequest error:", error);
    return { error: `Gagal: ${error.message || "Silakan coba lagi."}` };
  }

  revalidatePath("/department");
  return { success: true };
}
