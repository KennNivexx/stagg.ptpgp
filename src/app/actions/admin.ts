"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { testMailConfig } from "@/lib/mailer";

export async function testGmailConfig() {
  await requireRole("hrd", "superadmin");
  return testMailConfig();
}

export async function createAdminUser(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  if (!name || !email) return { error: "Nama dan email wajib diisi." };
  if (!email.includes("@")) return { error: "Format email tidak valid." };
  const { data: existing } = await supabaseAdmin
    .from("employees").select("id").eq("email", email).maybeSingle();
  if (existing) return { error: "Email sudah terdaftar dalam sistem." };
  const { error } = await supabaseAdmin.from("employees").insert({
    id: "emp-" + crypto.randomUUID(), full_name: name, email,
    status: "Active", created_at: new Date().toISOString(),
  });
  if (error) { console.error("[admin] createAdminUser error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/admin/users");
  return { success: true };
}

export async function saveSystemSetting(key: string, value: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("system_settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[admin] saveSystemSetting error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  return { success: true };
}

export async function saveMultipleSettings(settings: Record<string, string>) {
  await requireRole("hrd", "superadmin");
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
  const { error } = await supabaseAdmin.from("system_settings").upsert(rows, { onConflict: "key" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[admin] saveMultipleSettings error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/admin/settings");
  return { success: true };
}

export async function getSettings(): Promise<Record<string, string>> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("system_settings").select("key, value");
  if (!data) return {};
  return Object.fromEntries((data as Array<{ key: string; value: string }>).map(r => [r.key, r.value]));
}

export async function saveApprovalConfig(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const workflow = (formData.get("workflow") as string || "").trim();
  const steps = parseInt(formData.get("steps") as string || "3", 10);
  const approver1 = (formData.get("approver_1") as string || "").trim() || null;
  const approver2 = (formData.get("approver_2") as string || "").trim() || null;
  const approver3 = (formData.get("approver_3") as string || "").trim() || null;
  if (!workflow) return { error: "Pilih workflow terlebih dahulu." };
  const { error } = await supabaseAdmin.from("approval_configs").upsert({
    id: "apcfg-" + crypto.randomUUID(), workflow_name: workflow,
    steps, approver_1: approver1, approver_2: approver2, approver_3: approver3,
    created_at: new Date().toISOString(),
  }, { onConflict: "workflow_name" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[admin] saveApprovalConfig error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/admin/approvals");
  return { success: true };
}

export async function saveNotificationTemplate(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const eventType = (formData.get("event_type") as string || "").trim();
  const subject = (formData.get("subject") as string || "").trim();
  const body = (formData.get("body") as string || "").trim();
  if (!eventType) return { error: "Pilih template notifikasi." };
  const { error } = await supabaseAdmin.from("notification_settings").upsert(
    { event_type: eventType, subject, body, updated_at: new Date().toISOString() },
    { onConflict: "event_type" }
  );
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[admin] saveNotificationTemplate error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  return { success: true };
}

export async function saveEmployeeContract(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employeeId") as string || "").trim();
  const contractType = (formData.get("contractType") as string || "Kontrak").trim();
  const startDate = (formData.get("startDate") as string || "").trim();
  const endDate = (formData.get("endDate") as string || "").trim();
  const notes = (formData.get("notes") as string || "").trim();
  if (!employeeId || !startDate) return { error: "Karyawan dan tanggal mulai wajib diisi." };
  const { error } = await supabaseAdmin.from("employee_contracts").insert({
    id: "ctr-" + crypto.randomUUID(),
    employee_id: employeeId,
    contract_type: contractType,
    start_date: startDate,
    end_date: endDate || null,
    notes: notes || null,
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi tabel employee_contracts terlebih dahulu." };
  if (error) { console.error("[admin] saveEmployeeContract error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/infrastructure/contracts");
  return { success: true };
}

export async function updateEmployeeStatus(employeeId: string, newStatus: string) {
  await requireRole("hrd", "superadmin");
  const valid = ["Tetap", "Kontrak", "Magang", "Resigned"];
  if (!valid.includes(newStatus)) return { error: "Status tidak valid." };
  const { error } = await supabaseAdmin
    .from("employees")
    .update({ status: newStatus })
    .eq("id", employeeId);
  if (error) { console.error("[admin] updateEmployeeStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/infrastructure/contracts");
  revalidatePath("/hrd/employees");
  return { success: true };
}

export async function generatePayslip(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const month = parseInt(formData.get("month") as string || "0", 10);
  const year = parseInt(formData.get("year") as string || "0", 10);
  if (!employeeId || !month || !year) return { error: "Pilih karyawan, bulan, dan tahun." };
  const { data: existing } = await supabaseAdmin.from("payroll")
    .select("id").eq("employee_id", employeeId).eq("month", month).eq("year", year).maybeSingle();
  if (existing) return { error: "Slip gaji untuk periode ini sudah dibuat." };
  const { data: salaryData } = await supabaseAdmin.from("salary_structures")
    .select("basic_salary, transport_allowance, meal_allowance, housing_allowance")
    .eq("employee_id", employeeId).maybeSingle();
  const basic = Number(salaryData?.basic_salary) || 0;
  const allowances = (Number(salaryData?.transport_allowance) || 0) +
    (Number(salaryData?.meal_allowance) || 0) +
    (Number(salaryData?.housing_allowance) || 0);
  if (basic === 0) return { error: "Belum ada struktur gaji untuk karyawan ini. Isi di menu Komponen Gaji terlebih dahulu." };
  const { error } = await supabaseAdmin.from("payroll").insert({
    id: "pay-" + crypto.randomUUID(),
    employee_id: employeeId,
    month, year,
    basic_salary: basic,
    allowances,
    deductions: 0,
    net_salary: basic + allowances,
    status: "Draft",
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Tabel payroll belum tersedia. Jalankan migrasi terlebih dahulu." };
  if (error) { console.error("[admin] generatePayslip error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/payroll");
  return { success: true };
}
