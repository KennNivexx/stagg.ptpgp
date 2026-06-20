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

// Returns the authenticated manager's own department, looked up from the
// employees table by their session email. Superadmin can receive an override
// via the optional deptName param; department_manager always gets their own.
export async function getMyDept(): Promise<{ dept: string | null }> {
  const user = await requireRole("department_manager", "superadmin");
  if (user.role === "superadmin") return { dept: null };

  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("department")
    .eq("email", user.email)
    .maybeSingle();

  return { dept: (emp as { department?: string } | null)?.department || null };
}

export async function getDeptData(deptName: string) {
  const user = await requireRole("department_manager", "superadmin");

  // A department_manager may only query their OWN department — the name comes
  // from the client so it must be validated against the server-side session.
  if (user.role === "department_manager") {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("department")
      .eq("email", user.email)
      .maybeSingle();
    const myDept = (emp as { department?: string } | null)?.department;
    if (!myDept || myDept !== deptName) {
      throw new Error("Akses ditolak: bukan departemen Anda.");
    }
  }

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
  const user = await requireRole("department_manager", "superadmin");

  const department = (formData.get("department") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();

  // Validate that a department_manager is only submitting for their own dept
  if (user.role === "department_manager") {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("department")
      .eq("email", user.email)
      .maybeSingle();
    const myDept = (emp as { department?: string } | null)?.department;
    if (!myDept || myDept !== department) {
      return { error: "Akses ditolak: bukan departemen Anda." };
    }
  }
  const quantity = parseInt(formData.get("quantity") as string || "1");
  const urgency = (formData.get("urgency") as string || "Sedang").trim();
  const reason = (formData.get("reason") as string || "").trim();
  const requested_by = user.name || user.email;

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
