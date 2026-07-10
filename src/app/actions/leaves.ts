"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { submitLeaveForEmployee } from "@/lib/leaves-core";

const uid = () => crypto.randomUUID();

export async function submitLeave(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const result = await submitLeaveForEmployee({
    employeeId: user.id,
    employeeEmail: user.email,
    employeeName: user.name,
    type: (formData.get("type") as string || "").trim(),
    start_date: (formData.get("start_date") as string || "").trim(),
    end_date: (formData.get("end_date") as string || "").trim(),
    reason: (formData.get("reason") as string || "").trim(),
  });
  if ("success" in result) {
    revalidatePath("/hrd/leaves");
    revalidatePath("/employee");
  }
  return result;
}

/**
 * Only the department manager decides Cuti & Izin — HRD is report-only (per
 * user's explicit workflow spec: "HRD hanya menerima laporan saja"). A
 * department_manager may only decide on requests from their own department's
 * employees; superadmin can act on any.
 */
export async function updateLeaveStatus(id: string, status: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("department_manager", "superadmin");

  const { data: leave } = await supabaseAdmin.from("pengajuan_cuti").select("employee_id, employee_name, department, type, start_date, end_date, status").eq("id", id).maybeSingle();
  if (!leave) return { error: "Cuti tidak ditemukan." };
  const l = leave as Record<string, unknown>;

  if (user.role === "department_manager") {
    const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
    const myDept = (mgr as { department?: string } | null)?.department;
    if (!myDept || myDept !== l.department) {
      return { error: "Akses ditolak: bukan karyawan departemen Anda." };
    }
  }

  // Guard against re-processing an already-decided request (double-click,
  // network retry, or re-approving/re-rejecting later) — without this, the
  // employee gets a duplicate notification each time and status can flip-flop.
  const currentStatus = (leave as { status?: string }).status;
  if (currentStatus && currentStatus !== "Pending") {
    return { error: `Cuti ini sudah diproses sebelumnya (${currentStatus}).` };
  }

  await supabaseAdmin.from("pengajuan_cuti").update({ status, approved_by: user.name, updated_at: new Date().toISOString() }).eq("id", id);

  // Notify employee
  const empEmail = await getEmployeeEmail(l.employee_id as string);
  if (empEmail) {
    await supabaseAdmin.from("notifikasi").insert({
      id: uid(), user_email: empEmail,
      title: `Cuti ${status === "Disetujui" ? "Disetujui" : "Ditolak"}`,
      message: `${l.type} (${l.start_date} - ${l.end_date}) ${status === "Disetujui" ? "telah disetujui" : "ditolak"} oleh atasan Anda.`,
      link: "/employee",
    });
  }

  revalidatePath("/hrd/leaves");
  revalidatePath("/department/leaves");
  revalidatePath("/employee");
  return { success: true };
}

async function getEmployeeEmail(employeeId: string): Promise<string | null> {
  // leave_requests.employee_id stores the submitter's users.id, not
  // employees.id — those are different ids for the same person, so the
  // email must be resolved via the users table, not employees.
  const { data } = await supabaseAdmin.from("pengguna").select("email").eq("id", employeeId).maybeSingle();
  return (data as Record<string, unknown>)?.email as string || null;
}

export async function getLeaves(params?: { employeeId?: string; status?: string }) {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  let q = supabaseAdmin.from("pengajuan_cuti").select("*").order("created_at", { ascending: false });
  if (user.role === "employee") {
    q = q.eq("employee_id", user.id);
  } else if (user.role === "department_manager") {
    const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
    const myDept = (mgr as { department?: string } | null)?.department;
    q = q.eq("department", myDept || "__none__");
  } else {
    if (params?.employeeId) q = q.eq("employee_id", params.employeeId);
  }
  if (params?.status) q = q.eq("status", params.status);
  const { data } = await q.limit(100);
  return (data || []);
}
