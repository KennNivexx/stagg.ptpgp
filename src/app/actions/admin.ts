"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { testMailConfig } from "@/lib/mailer";
import { sumEmployeeComponentsByType } from "@/app/actions/payroll-components";
import { resolveManagerDepartment } from "@/lib/dept-resolve";

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
    .from("karyawan").select("id").eq("email", email).maybeSingle();
  if (existing) return { error: "Email sudah terdaftar dalam sistem." };
  const { error } = await supabaseAdmin.from("karyawan").insert({
    id: "emp-" + crypto.randomUUID(), full_name: name, email,
    position: "Administrator", join_date: new Date().toISOString().slice(0, 10),
    status: "Active", created_at: new Date().toISOString(),
  });
  if (error) { console.error("[admin] createAdminUser error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/admin/users");
  return { success: true };
}

export async function saveSystemSetting(key: string, value: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("pengaturan_sistem").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[admin] saveSystemSetting error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  return { success: true };
}

export async function saveMultipleSettings(settings: Record<string, string>) {
  await requireRole("hrd", "superadmin");
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(settings)) {
    if (k === "mail_gmail_user") {
      cleaned[k] = (v || "").trim();
    } else if (k === "mail_gmail_app_password") {
      cleaned[k] = (v || "").replace(/\s+/g, "");
    } else {
      cleaned[k] = v;
    }
  }
  const rows = Object.entries(cleaned).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
  const { error } = await supabaseAdmin.from("pengaturan_sistem").upsert(rows, { onConflict: "key" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[admin] saveMultipleSettings error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/admin/settings");
  return { success: true };
}

export async function getSettings(): Promise<Record<string, string>> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("pengaturan_sistem").select("key, value");
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
  const { error } = await supabaseAdmin.from("konfigurasi_approval").upsert({
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
  const { error } = await supabaseAdmin.from("pengaturan_notifikasi").upsert(
    { event_type: eventType, subject, body, updated_at: new Date().toISOString() },
    { onConflict: "event_type" }
  );
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[admin] saveNotificationTemplate error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  return { success: true };
}

/** Employees only ever have ONE current contract editable from this page — no
 * separate "add contract" flow, so this always updates the employee's latest
 * contract row (creating one only the first time) instead of inserting a new
 * row every save, which would otherwise accumulate duplicate contract history. */
export async function saveEmployeeContract(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employeeId") as string || "").trim();
  const contractType = (formData.get("contractType") as string || "Kontrak").trim();
  const startDate = (formData.get("startDate") as string || "").trim();
  const endDate = (formData.get("endDate") as string || "").trim();
  const notes = (formData.get("notes") as string || "").trim();
  if (!employeeId || !startDate) return { error: "Karyawan dan tanggal mulai wajib diisi." };

  const { data: existing } = await supabaseAdmin
    .from("kontrak_kerja")
    .select("id")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    contract_type: contractType,
    start_date: startDate,
    end_date: endDate || null,
    notes: notes || null,
  };

  const { error } = existing
    ? await supabaseAdmin.from("kontrak_kerja").update(payload).eq("id", (existing as { id: string }).id)
    : await supabaseAdmin.from("kontrak_kerja").insert({
        id: "ctr-" + crypto.randomUUID(),
        employee_id: employeeId,
        ...payload,
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
    .from("karyawan")
    .update({ status: newStatus })
    .eq("id", employeeId);
  if (error) { console.error("[admin] updateEmployeeStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/infrastructure/contracts");
  revalidatePath("/hrd/employees");
  return { success: true };
}

/** Shared PPh21 (progressive income tax) + BPJS employee-share calculation —
 * previously hand-duplicated between generatePayslip and computePayrollEntry
 * (single-payslip vs batch generation), which meant a future tweak to one
 * copy (e.g. a bracket change) could silently produce different net salaries
 * for the same employee/period depending on which button was clicked. Both
 * now call this one implementation. */
async function computeTaxAndBpjs(basic: number, allowances: number, ptkpStatus: string): Promise<{ monthlyTax: number; bpjsHealth: number; bpjsEmployment: number }> {
  let monthlyTax = 0;
  try {
    const { data: taxRow } = await supabaseAdmin
      .from("pengaturan_sistem").select("value").eq("key", "pph21_config").maybeSingle();
    const cfg = taxRow?.value ? JSON.parse(taxRow.value as string) : null;
    const ptkpMap: Record<string, number> = {
      "TK/0": cfg?.ptkp_tk0 ?? 54_000_000,
      "TK/1": cfg?.ptkp_tk1 ?? 58_500_000,
      "TK/2": cfg?.ptkp_tk2 ?? 63_000_000,
      "TK/3": cfg?.ptkp_tk3 ?? 67_500_000,
      "K/0":  cfg?.ptkp_k0  ?? 58_500_000,
      "K/1":  cfg?.ptkp_k1  ?? 63_000_000,
      "K/2":  cfg?.ptkp_k2  ?? 67_500_000,
      "K/3":  cfg?.ptkp_k3  ?? 72_000_000,
    };
    const ptkp = ptkpMap[ptkpStatus] ?? 54_000_000;
    const brackets: Array<{ min: number; max: number | null; rate: number }> = cfg?.brackets ?? [
      { min: 0,              max: 60_000_000,    rate: 5  },
      { min: 60_000_000,     max: 250_000_000,   rate: 15 },
      { min: 250_000_000,    max: 500_000_000,   rate: 25 },
      { min: 500_000_000,    max: 5_000_000_000, rate: 30 },
      { min: 5_000_000_000,  max: null,          rate: 35 },
    ];
    const annualGross = (basic + allowances) * 12;
    // Biaya jabatan (Indonesian tax law): 5% of gross income, capped at
    // Rp500,000/month (Rp6,000,000/year) — deducted before PTKP. Omitting
    // this overstates PKP and overtaxes every employee.
    const biayaJabatanPercent = cfg?.biaya_jabatan_percent ?? 5;
    const biayaJabatanCapAnnual = cfg?.biaya_jabatan_cap_annual ?? 6_000_000;
    const biayaJabatan = Math.min(annualGross * (biayaJabatanPercent / 100), biayaJabatanCapAnnual);
    const pkp = Math.max(0, annualGross - biayaJabatan - ptkp);
    let annualTax = 0;
    let remaining = pkp;
    for (const br of brackets) {
      if (remaining <= 0) break;
      const bracketSize = br.max !== null ? br.max - br.min : remaining;
      const taxable = Math.min(remaining, bracketSize);
      annualTax += taxable * (br.rate / 100);
      remaining -= taxable;
    }
    monthlyTax = Math.round(annualTax / 12);
  } catch { monthlyTax = 0; }

  let bpjsHealth = 0;
  let bpjsEmployment = 0;
  try {
    const { data: bpjsRow } = await supabaseAdmin
      .from("pengaturan_sistem").select("value").eq("key", "bpjs_config").maybeSingle();
    const bcfg = bpjsRow?.value ? JSON.parse(bpjsRow.value as string) : null;
    const grossForBpjs = basic + allowances;

    const healthPercent = bcfg?.health_employee_percent ?? 1;
    const healthCap = bcfg?.health_wage_cap ?? 12_000_000;
    bpjsHealth = Math.round(Math.min(grossForBpjs, healthCap) * (healthPercent / 100));

    const jhtPercent = bcfg?.jht_employee_percent ?? 2;
    const jht = Math.round(grossForBpjs * (jhtPercent / 100));

    let jp = 0;
    if (bcfg?.jp_enabled ?? true) {
      const jpPercent = bcfg?.jp_employee_percent ?? 1;
      const jpCap = bcfg?.jp_wage_cap ?? 10_547_400;
      jp = Math.round(Math.min(grossForBpjs, jpCap) * (jpPercent / 100));
    }
    bpjsEmployment = jht + jp;
  } catch { bpjsHealth = 0; bpjsEmployment = 0; }

  return { monthlyTax, bpjsHealth, bpjsEmployment };
}

export async function generatePayslip(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const month = parseInt(formData.get("month") as string || "0", 10);
  const year = parseInt(formData.get("year") as string || "0", 10);
  if (!employeeId || !month || !year) return { error: "Pilih karyawan, bulan, dan tahun." };
  const { data: existing } = await supabaseAdmin.from("penggajian")
    .select("id").eq("employee_id", employeeId).eq("month", month).eq("year", year).maybeSingle();
  if (existing) return { error: "Slip gaji untuk periode ini sudah dibuat." };
  const { data: salaryData } = await supabaseAdmin.from("struktur_gaji")
    .select("basic_salary, ptkp_status")
    .eq("employee_id", employeeId).maybeSingle();
  const basic = Number(salaryData?.basic_salary) || 0;
  // Dynamic components (tunjangan/potongan) — see payroll-components.ts.
  // Falls back to the legacy fixed struktur_gaji columns until the dynamic-
  // components migration has run, so this doesn't hard-break in the meantime.
  const { tunjangan: allowances, potongan: amalJariyah } = await sumEmployeeComponentsByType(employeeId);
  if (basic === 0) return { error: "Belum ada struktur gaji untuk karyawan ini. Isi di menu Komponen Gaji terlebih dahulu." };

  // ── Bonus/insentif yang sudah final (Disetujui/Dibayarkan) untuk periode
  // yang sama — periode disimpan sebagai "MM/YYYY" di form Bonus/Insentif
  // agar pencocokan dengan month+year di sini bisa diandalkan.
  const periodKey = `${String(month).padStart(2, "0")}/${year}`;
  const { data: bonusRows } = await supabaseAdmin
    .from("insentif")
    .select("amount")
    .eq("employee_id", employeeId)
    .eq("period", periodKey)
    .in("status", ["Disetujui", "Dibayarkan"]);
  const bonus = (bonusRows || []).reduce((s, r) => s + (Number((r as Record<string, unknown>).amount) || 0), 0);

  const { monthlyTax, bpjsHealth, bpjsEmployment } = await computeTaxAndBpjs(basic, allowances, (salaryData?.ptkp_status as string) || "TK/0");

  // `deductions` represents OTHER non-tax, non-BPJS deductions — currently
  // just Potongan Amal Jariyah (a fixed per-employee amount from struktur_gaji,
  // matching the real PGP payslip format). Tax and BPJS each have their own
  // dedicated columns/rows on the payslip so nothing is double-counted.
  const deductions = amalJariyah;
  const netSalary = basic + allowances + bonus - monthlyTax - bpjsHealth - bpjsEmployment - deductions;

  const { error } = await supabaseAdmin.from("penggajian").insert({
    id: crypto.randomUUID(),
    employee_id: employeeId,
    month, year,
    basic_salary: basic,
    allowances,
    bonus,
    tax: monthlyTax,
    bpjs_health: bpjsHealth,
    bpjs_employment: bpjsEmployment,
    deductions,
    net_salary: netSalary,
    status: "Draft",
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Tabel payroll belum tersedia. Jalankan migrasi terlebih dahulu." };
  if (error?.code === "PGRST204" || /column .* does not exist/i.test(error?.message || "")) {
    return { error: "Jalankan migrasi 20260704006_rewards_payroll_bonus_schema.sql terlebih dahulu." };
  }
  if (error) { console.error("[admin] generatePayslip error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  revalidatePath("/hrd/rewards/payslips");
  return { success: true };
}

export async function saveTaxConfig(config: Record<string, unknown>) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("pengaturan_sistem").upsert(
    { key: "pph21_config", value: JSON.stringify(config), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) return { error: error.message };
  return { success: true };
}

export async function getTaxConfig(): Promise<Record<string, unknown> | null> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("pengaturan_sistem").select("value").eq("key", "pph21_config").maybeSingle();
  if (!data?.value) return null;
  try { return JSON.parse(data.value as string) as Record<string, unknown>; } catch { return null; }
}

export async function saveBpjsConfig(config: Record<string, unknown>) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("pengaturan_sistem").upsert(
    { key: "bpjs_config", value: JSON.stringify(config), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) return { error: error.message };
  return { success: true };
}

export async function getBpjsConfig(): Promise<Record<string, unknown> | null> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("pengaturan_sistem").select("value").eq("key", "bpjs_config").maybeSingle();
  if (!data?.value) return null;
  try { return JSON.parse(data.value as string) as Record<string, unknown>; } catch { return null; }
}

// Mirrors PR-SDM-06's 3-tier verification chain (Ka Div SDM & Aset -> Spv
// Keuangan -> Direktur Utama tanda tangan akhir) instead of the old flat
// Draft -> Approved -> Paid, which let a single hrd/superadmin user push
// payroll straight through with no finance or director sign-off at all.
const PAYROLL_STATUSES = ["Draft", "Verified_SDM", "Verified_Keuangan", "Approved", "Paid"] as const;
type PayrollStatus = (typeof PAYROLL_STATUSES)[number];

const PAYROLL_TRANSITIONS: Record<PayrollStatus, PayrollStatus | null> = {
  Draft: "Verified_SDM",
  Verified_SDM: "Verified_Keuangan",
  Verified_Keuangan: "Approved",
  Approved: "Paid",
  Paid: null,
};

// Each tier requires a specific verifier: SDM & Aset dept manager (or
// hrd/superadmin), then Keuangan dept manager (or superadmin), then
// director/superadmin for the final sign-off. department_manager is scoped
// by a case-insensitive substring match against their resolved department
// name, since there's no dedicated "finance" role in this app's auth model
// (see src/lib/auth-guard.ts) — reusing the existing department_manager +
// department-name-check pattern already used for promotions/salary review.
async function assertPayrollTransitionAllowed(nextStatus: PayrollStatus): Promise<{ error: string } | null> {
  if (nextStatus === "Verified_SDM") {
    const user = await requireRole("hrd", "superadmin", "department_manager");
    if (user.role === "department_manager") {
      const dept = (await resolveManagerDepartment(user.email) || "").toLowerCase();
      if (!dept.includes("sdm") && !dept.includes("hr") && !dept.includes("aset") && !dept.includes("asset")) {
        return { error: "Hanya Kepala Divisi SDM & Aset (atau HRD) yang dapat memverifikasi tahap ini." };
      }
    }
    return null;
  }
  if (nextStatus === "Verified_Keuangan") {
    const user = await requireRole("superadmin", "department_manager");
    if (user.role === "department_manager") {
      const dept = (await resolveManagerDepartment(user.email) || "").toLowerCase();
      if (!dept.includes("keuangan") && !dept.includes("finance")) {
        return { error: "Hanya Supervisor Keuangan yang dapat memverifikasi tahap ini." };
      }
    }
    return null;
  }
  if (nextStatus === "Approved") {
    await requireRole("director", "superadmin");
    return null;
  }
  if (nextStatus === "Paid") {
    await requireRole("hrd", "superadmin", "director");
    return null;
  }
  return { error: "Status tidak valid." };
}

export async function updatePayrollStatus(id: string, statusInput: string): Promise<{ error: string } | { success: true }> {
  if (!PAYROLL_STATUSES.includes(statusInput as PayrollStatus)) return { error: "Status tidak valid." };
  const status = statusInput as PayrollStatus;
  const { data: current } = await supabaseAdmin.from("penggajian").select("status").eq("id", id).maybeSingle();
  const currentStatus = (current as { status?: PayrollStatus } | null)?.status;
  if (!currentStatus) return { error: "Data payroll tidak ditemukan." };
  if (PAYROLL_TRANSITIONS[currentStatus] !== status) {
    return { error: `Tidak dapat mengubah status dari "${currentStatus}" langsung ke "${status}" — ikuti urutan verifikasi.` };
  }
  const guardResult = await assertPayrollTransitionAllowed(status);
  if (guardResult) return guardResult;

  const { error } = await supabaseAdmin.from("penggajian").update({ status }).eq("id", id);
  if (error?.code === "23514") return { error: "Jalankan migrasi SQL 20260815001 terlebih dahulu." };
  if (error) { console.error("[admin] updatePayrollStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  revalidatePath("/hrd/rewards/payslips");
  return { success: true };
}

export async function generateBatchPayroll(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const month = parseInt(formData.get("month") as string || "0", 10);
  const year = parseInt(formData.get("year") as string || "0", 10);
  if (!month || !year) return { error: "Pilih bulan dan tahun." };
  const { data: employees } = await supabaseAdmin
    .from("karyawan").select("id, full_name, status")
    .in("status", ["Tetap", "Kontrak", "Magang"]).order("full_name");
  if (!employees || employees.length === 0) return { error: "Tidak ada karyawan aktif." };
  let created = 0; let skipped = 0;
  const warnings: string[] = [];
  for (const emp of employees) {
    const result = await computePayrollEntry(emp.id as string, month, year);
    if ("error" in result) {
      if (result.error === "exists") { skipped++; continue; }
      warnings.push(`${emp.full_name}: ${result.error}`);
      continue;
    }
    created++;
  }
  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  return { success: true, created, skipped, ...(warnings.length > 0 ? { warnings: warnings.slice(0, 5) } : {}) };
}

export async function updatePayrollAmounts(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const bonus = parseFloat(formData.get("bonus") as string || "0") || 0;
  const deductions = parseFloat(formData.get("deductions") as string || "0") || 0;
  if (!id) return { error: "ID payroll tidak valid." };
  const { data: existing } = await supabaseAdmin.from("penggajian")
    .select("status, basic_salary, allowances, tax, bpjs_health, bpjs_employment").eq("id", id).maybeSingle();
  if (!existing) return { error: "Data payroll tidak ditemukan." };
  if ((existing as Record<string, unknown>).status !== "Draft") return { error: "Hanya payroll Draft yang dapat diedit." };
  const row = existing as Record<string, unknown>;
  const net = (Number(row.basic_salary) || 0) + (Number(row.allowances) || 0) + bonus
    - (Number(row.tax) || 0) - (Number(row.bpjs_health) || 0) - (Number(row.bpjs_employment) || 0) - deductions;
  const { error } = await supabaseAdmin.from("penggajian").update({ bonus, deductions, net_salary: net }).eq("id", id);
  if (error) { console.error("[admin] updatePayrollAmounts:", error.message); return { error: "Gagal." }; }
  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  return { success: true };
}

export async function batchUpdatePayrollStatus(formData: FormData): Promise<{ error: string } | { success: true; updated: number }> {
  const month = parseInt(formData.get("month") as string || "0", 10);
  const year = parseInt(formData.get("year") as string || "0", 10);
  const status = (formData.get("status") as string || "").trim() as PayrollStatus;
  if (!month || !year) return { error: "Pilih bulan dan tahun." };
  if (!PAYROLL_STATUSES.includes(status)) return { error: "Status tidak valid." };
  const fromStatus = (Object.keys(PAYROLL_TRANSITIONS) as PayrollStatus[]).find((s) => PAYROLL_TRANSITIONS[s] === status);
  if (!fromStatus) return { error: "Tidak ada tahap sebelumnya untuk status ini." };
  const guardResult = await assertPayrollTransitionAllowed(status);
  if (guardResult) return guardResult;
  const { count, error } = await supabaseAdmin.from("penggajian")
    .update({ status }, { count: "exact" }).eq("month", month).eq("year", year).eq("status", fromStatus);
  if (error) { console.error("[admin] batchUpdatePayrollStatus:", error.message); return { error: "Gagal." }; }
  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  return { success: true, updated: count || 0 };
}

async function computePayrollEntry(employeeId: string, month: number, year: number): Promise<{ success: true } | { error: string }> {
  const { data: existing } = await supabaseAdmin.from("penggajian")
    .select("id").eq("employee_id", employeeId).eq("month", month).eq("year", year).maybeSingle();
  if (existing) return { error: "exists" };
  const { data: sd } = await supabaseAdmin.from("struktur_gaji")
    .select("basic_salary, ptkp_status").eq("employee_id", employeeId).maybeSingle();
  const basic = Number(sd?.basic_salary) || 0;
  const { tunjangan: allowances, potongan: amalJariyah } = await sumEmployeeComponentsByType(employeeId);
  if (basic === 0) return { error: "Struktur gaji belum diisi." };
  const periodKey = `${String(month).padStart(2, "0")}/${year}`;
  const { data: bonusRows } = await supabaseAdmin.from("insentif").select("amount")
    .eq("employee_id", employeeId).eq("period", periodKey).in("status", ["Disetujui", "Dibayarkan"]);
  const bonus = (bonusRows || []).reduce((s, r) => s + (Number((r as Record<string, unknown>).amount) || 0), 0);
  const { monthlyTax: tax, bpjsHealth: bpH, bpjsEmployment: bpE } = await computeTaxAndBpjs(basic, allowances, (sd?.ptkp_status as string) || "TK/0");
  const net = basic + allowances + bonus - tax - bpH - bpE - amalJariyah;
  const { error } = await supabaseAdmin.from("penggajian").insert({
    id: crypto.randomUUID(), employee_id: employeeId, month, year,
    basic_salary: basic, allowances, bonus, tax, bpjs_health: bpH, bpjs_employment: bpE,
    deductions: amalJariyah, net_salary: net, status: "Draft", created_at: new Date().toISOString(),
  });
  if (error) { console.error("[admin] computePayrollEntry:", error.message); return { error: "Gagal" }; }
  return { success: true };
}
