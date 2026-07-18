"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "dept-" + crypto.randomUUID();

interface EmployeeRow {
  id: string; full_name: string; email: string; department: string;
  position: string; status: string; join_date: string;
}

interface RequestRow {
  id: string; department: string; position: string;
  quantity: number; reason: string; urgency: string; status: string;
  requested_by: string; created_at: string;
  grade_code?: string; job_desc?: string;
  request_type?: string; need_by_date?: string; rejection_reason?: string;
  cancel_reason?: string; recruitment_stage?: string;
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
// Falls back to checking the pengguna table's department field if the manager
// is not yet registered as an employee (e.g. account created before karyawan entry).
export async function getMyDept(): Promise<{ dept: string | null }> {
  const user = await requireRole("department_manager", "superadmin");
  if (user.role === "superadmin") return { dept: null };

  // Primary lookup: karyawan table
  const { data: emp } = await supabaseAdmin
    .from("karyawan")
    .select("department")
    .eq("email", user.email)
    .maybeSingle();

  const deptFromKaryawan = (emp as { department?: string } | null)?.department || null;
  if (deptFromKaryawan) return { dept: deptFromKaryawan };

  // Fallback: pengguna table may carry a department field
  const { data: usr } = await supabaseAdmin
    .from("pengguna")
    .select("department")
    .eq("email", user.email)
    .maybeSingle();

  return { dept: (usr as { department?: string } | null)?.department || null };
}

export async function getDeptData(deptName: string) {
  const user = await requireRole("department_manager", "superadmin");

  // A department_manager may only query their OWN department — the name comes
  // from the client so it must be validated against the server-side session.
  if (user.role === "department_manager") {
    const { data: emp } = await supabaseAdmin
      .from("karyawan")
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
    { data: mainUnit },
  ] = await Promise.all([
    supabaseAdmin.from("karyawan").select("*").eq("department", deptName).order("full_name"),
    supabaseAdmin.from("permintaan_sdm").select("*").eq("department", deptName).order("created_at", { ascending: false }),
    supabaseAdmin.from("departemen").select("*").eq("name", deptName).maybeSingle(),
    supabaseAdmin.from("unit_organisasi").select("id, code, name, level, leader_name").eq("name", deptName).maybeSingle(),
  ]);

  const headcount = (departments as DeptRow | null)?.headcount ?? 0;

  // Ambil seluruh sub-unit divisi berdasarkan prefix kode divisi utama
  // Contoh: divisi HR & GA punya kode "1.1.2.1.0.0", prefix = "1.1.2.1"
  // Semua sub-unitnya punya kode "1.1.2.1.x.x"
  let orgUnits: OrgUnitRow[] = [];
  const mu = mainUnit as OrgUnitRow | null;
  if (mu?.code) {
    const parts = mu.code.split(".");
    const nonZeroParts = parts.filter((p, i) => {
      // Ambil semua segmen hingga segmen terakhir yang bukan 0
      return parts.slice(i).some(v => v !== "0");
    });
    const prefix = nonZeroParts.join(".");
    const { data: units } = await supabaseAdmin
      .from("unit_organisasi")
      .select("id, code, name, level, leader_name")
      .like("code", `${prefix}%`)
      .order("level")
      .order("name");
    orgUnits = (units as OrgUnitRow[]) || [];
  } else if (mu) {
    orgUnits = [mu];
  }

  return {
    employees: (employees as EmployeeRow[]) || [],
    requests: (requests as RequestRow[]) || [],
    headcount,
    orgUnits,
  };
}

export async function submitRequest(formData: FormData, asDraft?: boolean) {
  const user = await requireRole("department_manager", "superadmin");

  const department = (formData.get("department") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();

  // Validate that a department_manager is only submitting for their own dept
  if (user.role === "department_manager") {
    const { data: emp } = await supabaseAdmin
      .from("karyawan")
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
  const grade_code = (formData.get("grade_code") as string || "").trim() || null;
  const job_desc = (formData.get("job_desc") as string || "").trim() || null;
  const request_type = (formData.get("request_type") as string || "").trim() || null;
  const need_by_date = (formData.get("need_by_date") as string || "").trim() || null;
  const site_location = (formData.get("site_location") as string || "").trim() || null;
  const cost_center = (formData.get("cost_center") as string || "").trim() || null;
  const salary_range_min = formData.get("salary_range_min") ? parseFloat(formData.get("salary_range_min") as string) : null;
  const salary_range_max = formData.get("salary_range_max") ? parseFloat(formData.get("salary_range_max") as string) : null;
  const budget_recruitment = formData.get("budget_recruitment") ? parseFloat(formData.get("budget_recruitment") as string) : null;
  const budget_available = formData.get("budget_available") === "on" || formData.get("budget_available") === "true";
  const requested_by = user.name || user.email;

  if (!asDraft && (!department || !position)) return { error: "Departemen dan posisi wajib diisi." };

  const id = uid();
  const now = new Date().toISOString();
  const status = asDraft ? "Draft" : "Pending";
  const { error } = await supabaseAdmin.from("permintaan_sdm").insert({
    id, department, position, quantity, reason, urgency, status,
    requested_by, grade_code, job_desc, request_type, need_by_date,
    site_location, cost_center, salary_range_min, salary_range_max,
    budget_recruitment, budget_available, created_at: now,
  });
  if (error) {
    console.error("submitRequest error:", error);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  await supabaseAdmin.from("riwayat_permintaan_sdm").insert({
    id: "wrh-" + crypto.randomUUID(),
    request_id: id,
    action: asDraft ? "Disimpan sebagai Draft" : "Diajukan",
    actor_name: requested_by,
    actor_role: user.role,
    to_status: status,
  });

  revalidatePath("/department");
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

// Rantai breadcrumb organisasi berjenjang (Organisasi > Divisi > Department >
// Seksi > Unit Kerja) berdasarkan tabel org_units yang sudah ada (code
// berjenjang, mis. "1.1.2.1.0.0"), dari root sampai unit departemen ini.
export async function getOrgBreadcrumb(deptName: string): Promise<string[]> {
  await requireRole("department_manager", "hrd", "director", "superadmin");

  const { data: mainUnit } = await supabaseAdmin
    .from("unit_organisasi").select("id, code, name, level").eq("name", deptName).maybeSingle();
  const mu = mainUnit as { code?: string; name?: string } | null;
  if (!mu?.code) return mu?.name ? [mu.name] : [];

  // Ambil semua org_units lalu susun path dari root ke node saat ini dengan
  // menaiki parent_code — lebih andal daripada menebak dari prefix code.
  const { data: allUnits } = await supabaseAdmin.from("unit_organisasi").select("code, name, parent_code");
  const units = (allUnits as { code: string; name: string; parent_code: string | null }[]) || [];
  const byCode = new Map(units.map(u => [u.code, u]));

  let node = byCode.get(mu.code) || null;
  const path: string[] = [];
  const seen = new Set<string>();
  while (node && !seen.has(node.code)) {
    path.unshift(node.name);
    seen.add(node.code);
    node = node.parent_code ? byCode.get(node.parent_code) || null : null;
  }
  return path.length ? path : (mu.name ? [mu.name] : []);
}
