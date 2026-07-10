/**
 * Shared incident-report submission logic — same pattern as leaves-core.ts /
 * business-trips-core.ts: a plain lib export, not "use server", only
 * reachable from other server-side code.
 */
import { supabaseAdmin } from "@/lib/supabase";

const uid = () => crypto.randomUUID();

export async function submitIncidentForEmployee(params: {
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  vehicle_id?: string;
  title: string;
  description: string;
  severity: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  isSos?: boolean;
}): Promise<{ error: string } | { success: true }> {
  const { employeeId, employeeEmail, employeeName, title, description, severity, isSos } = params;

  if (!title.trim()) return { error: "Judul laporan wajib diisi." };

  const { data: emp } = await supabaseAdmin.from("karyawan").select("full_name, department").eq("email", employeeEmail).maybeSingle();

  const { error } = await supabaseAdmin.from("laporan_insiden").insert({
    id: uid(),
    employee_id: employeeId,
    employee_name: emp?.full_name || employeeName,
    department: emp?.department || "",
    vehicle_id: params.vehicle_id || null,
    title: title.trim(),
    description: description.trim(),
    severity: severity || "Ringan",
    photo_url: params.photo_url || "",
    latitude: params.latitude ?? null,
    longitude: params.longitude ?? null,
    is_sos: !!isSos,
    status: "Dilaporkan",
  });
  if (error) return { error: "Gagal mengirim laporan." };

  // Same convention as leaves-core.ts / business-trips-core.ts: notify HRD
  // directly (report-only for HRD); the department manager sees pending
  // items by pulling their own dept-scoped list, not via a push notification
  // — there's no reliable "this employee is the manager" flag to target one.
  const empName = emp?.full_name || employeeName;
  const locationNote = params.latitude != null && params.longitude != null
    ? ` Lokasi: https://maps.google.com/?q=${params.latitude},${params.longitude}`
    : "";
  const notifyEmails = new Set<string>(["hrd@ptpgp.co.id"]);
  // SOS darurat juga langsung notify kepala departemen (role department_manager
  // di tabel users, dicocokkan lewat email ke employees.department si supir) —
  // laporan insiden biasa cukup ke HRD saja (dept manager pull via list-nya sendiri).
  if (isSos && emp?.department) {
    const { data: deptEmployeeEmails } = await supabaseAdmin.from("karyawan").select("email").eq("department", emp.department);
    const emails = (deptEmployeeEmails || []).map((e: { email?: string }) => e.email).filter(Boolean) as string[];
    if (emails.length > 0) {
      const { data: managers } = await supabaseAdmin.from("pengguna").select("email").eq("role", "department_manager").in("email", emails);
      (managers || []).forEach((m: { email?: string }) => { if (m.email) notifyEmails.add(m.email); });
    }
  }

  for (const email of notifyEmails) {
    await supabaseAdmin.from("notifikasi").insert({
      id: uid(),
      user_email: email,
      title: isSos ? `🆘 SOS DARURAT — ${empName}` : "Laporan Insiden Baru",
      message: `${empName} ${isSos ? "menekan tombol SOS darurat" : "melaporkan"}: ${title} (${severity}).${locationNote}`,
      link: "/hrd/incidents",
    });
  }

  return { success: true };
}
