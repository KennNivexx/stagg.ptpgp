/**
 * Webhook-safe data access for the WhatsApp bot. These functions deliberately
 * do NOT call requireRole()/requireAuth() — there is no cookie session in a
 * webhook request context. Trust boundary: the caller (whatsapp-router.ts)
 * has already resolved `employeeId` by matching the inbound message's sender
 * phone number against employees.wa_number (see getEmployeeByWaNumber below)
 * — that match is this bot path's equivalent of an authenticated session.
 * Never call these with an employeeId that wasn't resolved that way.
 */
import { supabaseAdmin } from "@/lib/supabase";
import { clockInForEmployee, clockOutForEmployee } from "@/lib/attendance-core";
import { submitLeaveForEmployee } from "@/lib/leaves-core";

const MONTH_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export interface BotEmployee {
  id: string;
  full_name: string;
  email: string;
  wa_connected_at: string | null;
}

export async function getEmployeeByWaNumber(waNumber: string): Promise<(BotEmployee & { wa_opted_out: boolean }) | null> {
  const { data } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, email, wa_opted_out, wa_connected_at")
    .eq("wa_number", waNumber)
    .maybeSingle();
  const emp = data as (BotEmployee & { wa_opted_out: boolean }) | null;
  if (!emp) return null;
  return emp;
}

/** Verification flow: find employee by name + position match. */
export async function findEmployeeByDetails(name: string, position: string): Promise<BotEmployee | null> {
  const nameLower = name.toLowerCase().trim();
  const posLower = position.toLowerCase().trim();
  const { data } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, email, wa_opted_out, wa_connected_at, position")
    .ilike("full_name", `%${nameLower}%`)
    .limit(10);
  const rows = (data || []) as Array<BotEmployee & { wa_opted_out: boolean; position: string }>;
  for (const emp of rows) {
    if (emp.wa_opted_out) continue;
    const empName = (emp.full_name || "").toLowerCase().trim();
    const empPos = (emp.position || "").toLowerCase().trim();
    if (empName.includes(nameLower) && empPos.includes(posLower)) {
      return { id: emp.id, full_name: emp.full_name, email: emp.email, wa_connected_at: emp.wa_connected_at };
    }
  }
  return null;
}

/** Link a WA number to an employee after successful verification. */
export async function linkWaNumber(employeeId: string, waNumber: string): Promise<{ success: true } | { error: string }> {
  const { data: conflict } = await supabaseAdmin
    .from("employees")
    .select("id, full_name")
    .eq("wa_number", waNumber)
    .neq("id", employeeId)
    .maybeSingle();
  if (conflict) {
    return { error: `Nomor WA ini sudah terhubung ke akun ${conflict.full_name || "lain"}. Hubungi HRD.` };
  }
  const { error } = await supabaseAdmin.from("employees")
    .update({ wa_number: waNumber, wa_connected_at: new Date().toISOString(), wa_opted_out: false })
    .eq("id", employeeId);
  if (error) {
    console.error("[whatsapp] linkWaNumber error:", error.message);
    return { error: "Gagal menghubungkan nomor WA. Hubungi HRD." };
  }
  return { success: true };
}

/** Marks the connection as confirmed once the employee's first real message
 * arrives — this IS the activation step in the employee-initiates-first
 * flow (no template send to confirm it any other way). */
export async function markWaConnected(employeeId: string): Promise<void> {
  await supabaseAdmin.from("employees").update({ wa_connected_at: new Date().toISOString() }).eq("id", employeeId);
}

export async function getEmployeeProfileText(employeeId: string): Promise<string> {
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("full_name, email, phone, department, position, join_date, status")
    .eq("id", employeeId)
    .maybeSingle();
  if (!emp) return "Data profil tidak ditemukan.";
  return [
    "*Profil Anda*",
    `Nama: ${emp.full_name || "-"}`,
    `Email: ${emp.email || "-"}`,
    `Telepon: ${emp.phone || "-"}`,
    `Departemen: ${emp.department || "-"}`,
    `Posisi: ${emp.position || "-"}`,
    `Tanggal Bergabung: ${emp.join_date ? new Date(emp.join_date as string).toLocaleDateString("id-ID") : "-"}`,
    `Status: ${emp.status || "-"}`,
  ].join("\n");
}

/** Summary only (period/status/net amount) — full breakdown intentionally
 * omitted per privacy discussion: salary text sent over WA lives in the
 * employee's personal chat history. */
export async function getMyPayslipsSummaryText(employeeId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("payroll")
    .select("month, year, status, net_salary")
    .eq("employee_id", employeeId)
    .in("status", ["Approved", "Paid"])
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(3);
  if (!data || data.length === 0) return "Belum ada slip gaji yang tersedia.";
  const lines = (data as Array<Record<string, unknown>>).map((s) =>
    `${MONTH_NAMES[Number(s.month)] || s.month} ${s.year} — ${s.status} — Rp ${(Number(s.net_salary) || 0).toLocaleString("id-ID")}`
  );
  return ["*Slip Gaji Terbaru*", ...lines, "", "Buka aplikasi untuk rincian lengkap (tunjangan, potongan, dsb)."].join("\n");
}

export async function getMyTrainingsText(employeeId: string): Promise<string> {
  const { data: enrollments } = await supabaseAdmin
    .from("training_enrollments")
    .select("training_id, status, enrolled_at")
    .eq("employee_id", employeeId)
    .order("enrolled_at", { ascending: false })
    .limit(5);
  if (!enrollments || enrollments.length === 0) return "Belum ada pelatihan yang diikuti.";

  const rows = enrollments as Array<Record<string, unknown>>;
  const trainingIds = [...new Set(rows.map((e) => e.training_id as string))];
  const { data: trainings } = await supabaseAdmin.from("trainings").select("id, title").in("id", trainingIds);
  const titleMap = Object.fromEntries((trainings || []).map((t: Record<string, unknown>) => [t.id, t.title]));
  const { data: certs } = await supabaseAdmin
    .from("training_certificates")
    .select("training_id, status")
    .eq("employee_id", employeeId)
    .in("training_id", trainingIds);
  const certMap = Object.fromEntries((certs || []).map((c: Record<string, unknown>) => [c.training_id, c.status]));

  const lines = rows.map((e) => {
    const title = titleMap[e.training_id as string] || e.training_id;
    const certStatus = certMap[e.training_id as string];
    return `${title} — ${e.status}${certStatus ? ` (Sertifikat: ${certStatus})` : ""}`;
  });
  return ["*Pelatihan Anda*", ...lines].join("\n");
}

export async function getMyLatestKpiText(employeeId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("period, score, status")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(3);
  if (!data || data.length === 0) return "Belum ada data KPI/performa.";
  const lines = (data as Array<Record<string, unknown>>).map((k) => `${k.period}: ${k.score} (${k.status})`);
  return ["*KPI & Performa Terbaru*", ...lines].join("\n");
}

export async function getMyJobDescText(employeeId: string): Promise<string> {
  const { data: emp } = await supabaseAdmin.from("employees").select("position").eq("id", employeeId).maybeSingle();
  const position = emp?.position as string | undefined;
  if (!position) return "Posisi Anda belum tercatat, hubungi HRD.";

  const { data } = await supabaseAdmin.from("job_descriptions").select("*").eq("position", position);
  if (!data || data.length === 0) return `Belum ada deskripsi kerja untuk posisi ${position}.`;

  const jd = data[0] as Record<string, unknown>;
  const responsibilities = (jd.responsibilities as string[] | null) || [];
  const requirements = (jd.requirements as string[] | null) || [];
  const respText = responsibilities.length > 0 ? responsibilities.map((r, i) => `${i + 1}. ${r}`).join("\n") : "-";
  const reqText = requirements.length > 0 ? requirements.map((r, i) => `${i + 1}. ${r}`).join("\n") : "-";

  return [`*Deskripsi Kerja — ${position}*`, "", "*Tanggung Jawab:*", respText, "", "*Persyaratan:*", reqText].join("\n");
}

export async function getMyWarningsText(employeeId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("warnings")
    .select("sp_level, reason, status, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (!data || data.length === 0) return "Tidak ada Surat Peringatan (SP) tercatat.";
  const lines = (data as Array<Record<string, unknown>>).map((w) =>
    `*${w.sp_level}* — ${w.status} (${new Date(w.created_at as string).toLocaleDateString("id-ID")})\n${w.reason}`
  );
  return ["*Surat Peringatan (SP)*", ...lines].join("\n\n");
}

export async function submitLeaveViaBot(
  employeeId: string,
  employeeEmail: string,
  employeeName: string,
  leave: { type: string; start_date: string; end_date: string; reason: string },
) {
  return submitLeaveForEmployee({ employeeId, employeeEmail, employeeName, ...leave });
}

export async function clockInViaBot(employeeId: string, employeeEmail: string, employeeName: string, photoBase64: string) {
  return clockInForEmployee({ employeeId, employeeEmail, employeeName, photoBase64 });
}

export async function clockOutViaBot(employeeId: string, photoBase64?: string) {
  return clockOutForEmployee({ employeeId, photoBase64 });
}
