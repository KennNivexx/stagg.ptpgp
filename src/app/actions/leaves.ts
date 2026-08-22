"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { submitLeaveForEmployee } from "@/lib/leaves-core";
import { auditLog } from "@/lib/audit";

const uid = () => crypto.randomUUID();

export async function submitLeave(formData: FormData) {
  // department_manager submits their OWN leave here same as any employee —
  // approving a subordinate's leave (updateLeaveStatus below) is a
  // different, separate action. Previously excluded, which meant a Kepala
  // Divisi had no way to request their own cuti at all (kasbon already
  // allowed this same role for the same "acting as an employee" reason).
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
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

  // The SELECT+check above isn't atomic on its own — two near-simultaneous
  // calls (double-click, network retry) can both read "Pending" before
  // either write lands. Making the UPDATE itself conditional on
  // status=Pending turns this into a compare-and-swap: only the first call
  // actually affects a row, so the balance-deduction block below can never
  // run twice for the same request.
  const { data: updatedRows } = await supabaseAdmin.from("pengajuan_cuti")
    .update({ status, approved_by: user.name, updated_at: new Date().toISOString() })
    .eq("id", id).eq("status", "Pending").select("id");
  if (!updatedRows || updatedRows.length === 0) {
    return { error: "Cuti ini sudah diproses sebelumnya." };
  }

  await auditLog({
    action: "leave.status_change", targetId: id, targetName: l.employee_name as string,
    performedBy: user, detail: `${l.type} (${l.start_date} - ${l.end_date}) ${status === "Disetujui" ? "disetujui" : "ditolak"}.`,
  });

  // Saldo Cuti (leave balance) was previously a completely separate,
  // manually-maintained number — approving a request here never touched it,
  // so the "sisa cuti" HRD sees was only ever as accurate as someone's last
  // manual edit. Only "Cuti Tahunan" maps to a tracked balance (saldo_cuti's
  // own default jenis_cuti is "Tahunan"; Cuti Sakit/Izin Khusus have no
  // agreed balance semantics in this app, so deducting from an invented
  // bucket for those would be fabricating policy, not fixing a bug).
  if (status === "Disetujui" && l.type === "Cuti Tahunan") {
    try {
      const empEmailForBalance = await getEmployeeEmail(l.employee_id as string);
      const { data: karyawanRow } = empEmailForBalance
        ? await supabaseAdmin.from("karyawan").select("id").eq("email", empEmailForBalance).maybeSingle()
        : { data: null };
      const karyawanId = (karyawanRow as { id?: string } | null)?.id;
      if (karyawanId) {
        const start = new Date(l.start_date as string);
        const end = new Date(l.end_date as string);
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
        const tahun = start.getFullYear();
        const { data: existingSaldo } = await supabaseAdmin.from("saldo_cuti")
          .select("id, terpakai").eq("karyawan_id", karyawanId).eq("tahun", tahun).eq("jenis_cuti", "Tahunan").maybeSingle();
        const saldo = existingSaldo as { id: string; terpakai: number } | null;
        if (saldo) {
          await supabaseAdmin.from("saldo_cuti").update({ terpakai: (Number(saldo.terpakai) || 0) + days }).eq("id", saldo.id);
        } else {
          await supabaseAdmin.from("saldo_cuti").insert({
            id: crypto.randomUUID(), karyawan_id: karyawanId, tahun, jenis_cuti: "Tahunan", total_hari: 12, terpakai: days,
          });
        }
      }
    } catch (e) {
      // Non-fatal — the leave approval itself must not fail because the
      // balance bookkeeping had a problem; HRD can still correct it manually
      // via Saldo Cuti.
      console.error("[leaves] updateLeaveStatus: gagal memotong saldo cuti otomatis:", (e as Error).message);
    }
  }

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
