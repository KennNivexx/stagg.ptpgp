"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { submitBusinessTripForEmployee } from "@/lib/business-trips-core";

const uid = () => crypto.randomUUID();

export async function submitBusinessTrip(formData: FormData) {
  // Same reasoning as submitLeave() in leaves.ts — a Kepala Divisi submits
  // their OWN business trip here; approving a subordinate's is the separate
  // updateBusinessTripStatus action below.
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  const result = await submitBusinessTripForEmployee({
    employeeId: user.id,
    employeeEmail: user.email,
    employeeName: user.name,
    destination: (formData.get("destination") as string || "").trim(),
    start_date: (formData.get("start_date") as string || "").trim(),
    end_date: (formData.get("end_date") as string || "").trim(),
    reason: (formData.get("reason") as string || "").trim(),
  });
  if ("success" in result) {
    revalidatePath("/hrd/attendance");
    revalidatePath("/employee");
    revalidatePath("/department/business-trips");
  }
  return result;
}

/**
 * Same approval convention as leave_requests: the department manager decides,
 * HRD is report-only. A department_manager may only decide on requests from
 * their own department's employees; superadmin can act on any.
 */
export async function updateBusinessTripStatus(id: string, status: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("department_manager", "superadmin");

  const { data: trip } = await supabaseAdmin.from("perjalanan_dinas").select("employee_id, department, destination, start_date, end_date, status").eq("id", id).maybeSingle();
  if (!trip) return { error: "Perjalanan dinas tidak ditemukan." };
  const t = trip as Record<string, unknown>;

  if (user.role === "department_manager") {
    const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
    const myDept = (mgr as { department?: string } | null)?.department;
    if (!myDept || myDept !== t.department) {
      return { error: "Akses ditolak: bukan karyawan departemen Anda." };
    }
  }

  const currentStatus = (trip as { status?: string }).status;
  if (currentStatus && currentStatus !== "Pending") {
    return { error: `Perjalanan dinas ini sudah diproses sebelumnya (${currentStatus}).` };
  }

  await supabaseAdmin.from("perjalanan_dinas").update({ status, approved_by: user.name, updated_at: new Date().toISOString() }).eq("id", id);

  const empEmail = await getEmployeeEmail(t.employee_id as string);
  if (empEmail) {
    await supabaseAdmin.from("notifikasi").insert({
      id: uid(), user_email: empEmail,
      title: `Perjalanan Dinas ${status === "Disetujui" ? "Disetujui" : "Ditolak"}`,
      message: `Dinas ke ${t.destination} (${t.start_date} - ${t.end_date}) ${status === "Disetujui" ? "telah disetujui" : "ditolak"} oleh atasan Anda.`,
      link: "/employee",
    });
  }

  revalidatePath("/hrd/attendance");
  revalidatePath("/department/business-trips");
  revalidatePath("/employee");
  return { success: true };
}

async function getEmployeeEmail(employeeId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("pengguna").select("email").eq("id", employeeId).maybeSingle();
  return (data as Record<string, unknown>)?.email as string || null;
}

export async function getBusinessTrips(params?: { employeeId?: string; status?: string }) {
  const user = await requireRole("hrd", "superadmin", "employee", "department_manager");
  let q = supabaseAdmin.from("perjalanan_dinas").select("*").order("created_at", { ascending: false });
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
  return data || [];
}
