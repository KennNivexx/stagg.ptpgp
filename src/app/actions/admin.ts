"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuth } from "@/lib/auth-guard";
import { testMailConfig } from "@/lib/mailer";
import { sumEmployeeComponentsByTypeCore as sumEmployeeComponentsByType, getEmployeeSalaryComponentsCore, type EmployeeSalaryComponent } from "@/lib/payroll-components-core";
import { resolveManagerDepartment } from "@/lib/dept-resolve";
import { auditLog } from "@/lib/audit";

/** Snapshots a penggajian row's state into riwayat_penggajian before/after a
 * mutation — see 20260818001_payroll_history_and_unique.sql. Distinct from
 * auditLog(): this is a structured, payroll-domain snapshot for "what were
 * the actual numbers before/after", while auditLog is the general
 * cross-module security/action trail. Both are written on every mutation. */
async function recordPayrollHistory(
  penggajianId: string,
  action: "created" | "edited" | "status_change" | "paid",
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  changedBy: { id: string; name: string; role: string },
  note?: string
) {
  const { error } = await supabaseAdmin.from("riwayat_penggajian").insert({
    id: crypto.randomUUID(),
    penggajian_id: penggajianId,
    action,
    changed_by_id: changedBy.id,
    changed_by_name: changedBy.name,
    changed_by_role: changedBy.role,
    snapshot_before: before,
    snapshot_after: after,
    note: note || null,
    changed_at: new Date().toISOString(),
  });
  // Non-fatal by design: a history-write failure (e.g. migration not yet
  // run) must never block the actual payroll operation from completing.
  if (error) console.error("[admin] recordPayrollHistory error:", error.message);
}

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
 * now call this one implementation.
 *
 * `taxableAllowances` vs `allowances` — these are deliberately DIFFERENT
 * sums (see sumEmployeeComponentsByType in payroll-components.ts):
 * `taxableAllowances` (only components marked taxable=true) feeds the PPh21
 * base; `allowances` (every active tunjangan, unfiltered) feeds the BPJS
 * wage base. Reusing one sum for both would incorrectly shrink BPJS
 * contributions for any component HRD marks PPh21-exempt — BPJS's wage base
 * and PPh21's taxable-income base are legally distinct concepts in
 * Indonesian payroll, not interchangeable. */
async function computeTaxAndBpjs(basic: number, allowances: number, taxableAllowances: number, ptkpStatus: string): Promise<{ monthlyTax: number; bpjsHealth: number; bpjsEmployment: number }> {
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
    const annualGross = (basic + taxableAllowances) * 12;
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

async function getPayrollConfig(): Promise<Record<string, number | string>> {
  const { data } = await supabaseAdmin.from("konfigurasi_penggajian").select("key, value");
  if (!data) return {};
  const config: Record<string, number | string> = {};
  for (const row of data as Array<{ key: string; value: unknown }>) {
    const v = row.value;
    if (typeof v === "string" && !isNaN(Number(v))) {
      config[row.key] = Number(v);
    } else {
      config[row.key] = String(v ?? "");
    }
  }
  return config;
}

/** Real work-day count for the period: weekdays (Mon-Fri) minus registered
 * public holidays that fall on a weekday — replaces the old flat
 * `config.work_days_per_month` constant (default 22 for every month
 * regardless of actual calendar), which was wrong for any month that
 * doesn't happen to have exactly 22 working weekdays and never excluded
 * holidays at all. Reads the EXISTING `kalender_kerja` table (HRD ->
 * Workforce Time -> Kalender Kerja, src/app/actions/workforce-time.ts) — a
 * working holiday-calendar feature already built in this app; a first draft
 * of this function mistakenly invented a brand-new `hari_libur` table
 * before noticing this one already existed and is the one HRD actually
 * uses. Falls back to the config constant if the query errors. */
async function computeActualWorkDays(firstDay: Date, lastDay: Date, fallback: number): Promise<number> {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  let weekdays = 0;
  const holidaySet = new Set<string>();
  const { data: holidays, error } = await supabaseAdmin
    .from("kalender_kerja").select("tanggal").gte("tanggal", fmt(firstDay)).lte("tanggal", fmt(lastDay));
  if (!error) {
    for (const h of (holidays || []) as { tanggal: string }[]) holidaySet.add(h.tanggal);
  }
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); // 0=Sun, 6=Sat
    if (dow === 0 || dow === 6) continue;
    if (error) continue; // table missing — can't reliably exclude holidays, just count weekdays below via fallback path instead
    if (!holidaySet.has(fmt(d))) weekdays++;
  }
  if (error) return fallback;
  return weekdays;
}

async function computeAttendancePayrollData(employeeId: string, month: number, year: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const { data: attendanceRows } = await supabaseAdmin
    .from("absensi")
    .select("date, status, late_minutes, total_hours, absent_marked, check_out")
    .eq("employee_id", employeeId)
    .gte("date", fmt(firstDay))
    .lte("date", fmt(lastDay));

  const { data: overtimeRows } = await supabaseAdmin
    .from("lembur")
    .select("hours, amount")
    .eq("karyawan_id", employeeId)
    .eq("status", "Disetujui")
    .gte("tanggal", fmt(firstDay))
    .lte("tanggal", fmt(lastDay));

  const { data: leaveRows } = await supabaseAdmin
    .from("pengajuan_cuti")
    .select("start_date, end_date, type")
    .eq("employee_id", employeeId)
    .eq("status", "Disetujui");

  // Shift allowance (Tunjangan Shift) — graceful no-op if shift_schedules
  // was never deployed (its own migration, 20260707001, is independent of
  // this payroll work): sums shifts.bonus_amount for every day this
  // employee was scheduled on a bonus-eligible shift in the period.
  let shiftAllowance = 0;
  const { data: shiftRows, error: shiftErr } = await supabaseAdmin
    .from("shift_schedules")
    .select("shift_date, shifts!inner(has_bonus, bonus_amount)")
    .eq("employee_id", employeeId)
    .gte("shift_date", fmt(firstDay))
    .lte("shift_date", fmt(lastDay));
  if (!shiftErr) {
    for (const r of (shiftRows || []) as unknown as { shifts: { has_bonus: boolean; bonus_amount: number } | { has_bonus: boolean; bonus_amount: number }[] }[]) {
      const s = Array.isArray(r.shifts) ? r.shifts[0] : r.shifts;
      if (s?.has_bonus) shiftAllowance += Number(s.bonus_amount) || 0;
    }
  }

  const config = await getPayrollConfig();
  const lateDeductionPerMin = Number(config.late_deduction_per_minute) || 5000;
  const absentDeductionPerDay = Number(config.absent_deduction_per_day) || 100000;
  const overtimeRatePerHour = Number(config.overtime_rate_per_hour) || 25000;
  const attendanceAllowancePerDay = Number(config.attendance_allowance_per_day) || 30000;
  const workDaysPerMonthConfig = Number(config.work_days_per_month) || 22;
  const workDaysPerMonth = await computeActualWorkDays(firstDay, lastDay, workDaysPerMonthConfig);

  // Pulang Cepat (early leave): compares actual check-out time-of-day
  // against a standard expected checkout time — there's no per-employee
  // shift-end lookup wired in yet (shift_schedules gives allowance, not a
  // per-day expected end time contract), so this uses one company-wide
  // standard, configurable via pengaturan_sistem so it isn't hardcoded to a
  // guess. Only counted for days actually marked present with a real
  // check-out timestamp.
  const standardCheckoutTime = String(config.standard_checkout_time || "17:00"); // "HH:MM"
  const earlyLeaveGraceMinutes = Number(config.early_leave_grace_minutes) || 0;
  const earlyLeaveDeductionPerMin = Number(config.early_leave_deduction_per_minute) || lateDeductionPerMin;
  const [stdHour, stdMin] = standardCheckoutTime.split(":").map(Number);

  let attendanceDays = 0;
  let absentDays = 0;
  let lateCount = 0;
  let totalLateMinutes = 0;
  let totalWorkHours = 0;
  let earlyLeaveMinutes = 0;

  if (attendanceRows) {
    for (const row of attendanceRows as Array<Record<string, unknown>>) {
      if (row.absent_marked) {
        absentDays++;
      } else {
        attendanceDays++;
        const checkOut = row.check_out ? new Date(row.check_out as string) : null;
        if (checkOut && !isNaN(checkOut.getTime())) {
          const expected = new Date(checkOut);
          expected.setHours(stdHour || 17, stdMin || 0, 0, 0);
          const earlyMins = Math.round((expected.getTime() - checkOut.getTime()) / 60000) - earlyLeaveGraceMinutes;
          if (earlyMins > 0) earlyLeaveMinutes += earlyMins;
        }
      }
      const lateMins = Number(row.late_minutes) || 0;
      if (lateMins > 0) {
        lateCount++;
        totalLateMinutes += lateMins;
      }
      totalWorkHours += Number(row.total_hours) || 0;
    }
  }

  let overtimeHours = 0;
  let overtimePay = 0;
  if (overtimeRows) {
    for (const row of overtimeRows as Array<Record<string, unknown>>) {
      overtimeHours += Number(row.hours) || 0;
      overtimePay += Number(row.amount) || 0;
    }
  }
  if (overtimePay === 0 && overtimeHours > 0) {
    overtimePay = overtimeHours * overtimeRatePerHour;
  }

  // Izin/Sakit/Cuti — real leave types in this system are "Cuti Tahunan",
  // "Cuti Sakit", "Izin Khusus" (confirmed against live data; the previous
  // code matched "unpaid"/"tidak dibayar"/"alpha", none of which exist as a
  // real `type` value, so unpaid-leave deduction never actually fired for
  // any real request). Which types deduct pay is a company policy decision,
  // not something to hardcode — `unpaid_leave_types` in pengaturan_sistem is
  // a comma-separated list of exact type names; default matches only "Izin
  // Khusus" (Cuti Tahunan and Cuti Sakit are paid leave by default, matching
  // common Indonesian company practice and UU Ketenagakerjaan sick-leave
  // protections). Sakit/Izin/Cuti day counts are tracked separately
  // regardless of pay policy, per the spec's explicit ask to report them.
  const unpaidLeaveTypes = new Set(
    String(config.unpaid_leave_types || "Izin Khusus").split(",").map((t) => t.trim()).filter(Boolean)
  );
  let unpaidLeaveDays = 0;
  let sakitDays = 0;
  let izinDays = 0;
  let cutiDays = 0;
  if (leaveRows) {
    for (const row of leaveRows as Array<Record<string, unknown>>) {
      const type = String(row.type || "");
      const start = new Date(row.start_date as string);
      const end = new Date(row.end_date as string);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
      if (type === "Cuti Sakit") sakitDays += days;
      else if (type === "Cuti Tahunan") cutiDays += days;
      else izinDays += days; // "Izin Khusus" and anything unrecognized reported as izin
      if (unpaidLeaveTypes.has(type)) unpaidLeaveDays += days;
    }
  }

  const lateDeduction = totalLateMinutes * lateDeductionPerMin;
  const earlyLeaveDeduction = earlyLeaveMinutes * earlyLeaveDeductionPerMin;
  const absentDeduction = (absentDays + unpaidLeaveDays) * absentDeductionPerDay;
  const attendanceAllowance = attendanceDays * attendanceAllowancePerDay;

  return {
    attendanceDays,
    absentDays: absentDays + unpaidLeaveDays,
    lateCount,
    totalLateMinutes,
    totalWorkHours,
    overtimeHours,
    overtimePay,
    lateDeduction,
    absentDeduction,
    attendanceAllowance,
    workDaysPerMonth,
    earlyLeaveMinutes,
    earlyLeaveDeduction,
    shiftAllowance,
    sakitDays,
    izinDays,
    cutiDays,
  };
}

/** Opt-in Performance Appraisal -> payroll bonus link (spec §16). OFF by
 * default (`kpi_bonus_enabled` unset/false) so no employee's pay changes
 * unless HRD explicitly turns this on and sets a rate — this is a company
 * compensation-policy decision, not something to silently auto-apply.
 * evaluasi_kpi is scored per quarter ("Q2/2026"), not per payroll month, so
 * this looks up the employee's most recent Completed evaluation rather than
 * trying to match an exact period — a best-effort link, not a guarantee
 * every payroll run has a fresh score to react to. */
async function computeKpiBonus(employeeId: string, basicSalary: number): Promise<number> {
  const config = await getPayrollConfig();
  if (!config.kpi_bonus_enabled || String(config.kpi_bonus_enabled) === "0" || String(config.kpi_bonus_enabled) === "false") return 0;
  const threshold = Number(config.kpi_bonus_threshold) || 80;
  const perPoint = Number(config.kpi_bonus_per_point) || 0;
  if (perPoint <= 0) return 0;

  const { data } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("final_score")
    .eq("employee_id", employeeId)
    .eq("status", "Completed")
    .not("final_score", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const finalScore = Number((data as { final_score?: number } | null)?.final_score) || 0;
  if (finalScore <= threshold) return 0;
  // Percentage-of-basic-salary rate per point above threshold, not a flat
  // rupiah-per-point figure — keeps the bonus proportional across pay grades
  // instead of being meaningless for a junior vs. senior salary.
  return Math.round(basicSalary * ((finalScore - threshold) * perPoint) / 100);
}

const MONTH_NAMES_ID = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/** Payroll Period is a LOCKING/GROUPING layer above the existing per-row
 * approval chain, not a replacement for it — see 20260818006_payroll_period.sql.
 * Every payroll-generating call (single or batch) attaches its rows to the
 * period for that month/year, creating one on first use. Blocks entirely if
 * the period is already Closed/Cancelled — you can't add rows to a period
 * that's been locked. */
async function getOrCreatePayrollPeriod(month: number, year: number, actor: { id: string; name: string }): Promise<{ id: string } | { error: string }> {
  const { data: existing, error: fetchErr } = await supabaseAdmin.from("periode_payroll").select("id, status").eq("bulan", month).eq("tahun", year).maybeSingle();
  if (fetchErr?.code === "42P01") return { error: "Jalankan migrasi 20260818006_payroll_period.sql terlebih dahulu." };
  if (existing) {
    const row = existing as { id: string; status: string };
    if (row.status === "Closed" || row.status === "Cancelled") {
      return { error: `Periode ${MONTH_NAMES_ID[month]} ${year} sudah berstatus "${row.status}" dan tidak dapat diproses lagi.` };
    }
    return { id: row.id };
  }
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const { data: created, error } = await supabaseAdmin.from("periode_payroll").insert({
    id: crypto.randomUUID(),
    nama_periode: `Payroll ${MONTH_NAMES_ID[month]} ${year}`,
    bulan: month, tahun: year,
    tanggal_awal: firstDay.toISOString().slice(0, 10),
    tanggal_akhir: lastDay.toISOString().slice(0, 10),
    status: "Processing",
    created_by_id: actor.id, created_by_name: actor.name,
    created_at: new Date().toISOString(),
  }).select("id").single();
  if (error) {
    if (error.code === "42P01") return { error: "Jalankan migrasi 20260818006_payroll_period.sql terlebih dahulu." };
    console.error("[admin] getOrCreatePayrollPeriod error:", error.message);
    return { error: "Gagal membuat periode payroll." };
  }
  return { id: (created as { id: string }).id };
}

export async function getPayrollPeriods(): Promise<Record<string, unknown>[]> {
  await requireRole("hrd", "superadmin", "director");
  const { data, error } = await supabaseAdmin.from("periode_payroll").select("*").order("tahun", { ascending: false }).order("bulan", { ascending: false });
  if (error) return [];
  return (data || []) as Record<string, unknown>[];
}

/** Returns an error string if the given period is locked (Closed or
 * Cancelled), else null. Rows created before this migration have
 * `period_id = null` and are never blocked — only rows explicitly attached
 * to a period can be period-locked. Cancelled must be treated as locked too:
 * getOrCreatePayrollPeriod already refuses to add rows to a Cancelled period,
 * so letting existing rows in one still march to Paid would be inconsistent. */
const LOCKED_PERIOD_STATUSES = ["Closed", "Cancelled"];

async function assertPeriodNotClosed(periodId: string | null | undefined): Promise<string | null> {
  if (!periodId) return null;
  const { data } = await supabaseAdmin.from("periode_payroll").select("status").eq("id", periodId).maybeSingle();
  const status = (data as { status?: string } | null)?.status;
  if (status && LOCKED_PERIOD_STATUSES.includes(status)) {
    return `Periode payroll ini sudah berstatus "${status}" dan tidak dapat diubah.`;
  }
  return null;
}

/** Closed is terminal and hard-locks every row in the period — checked in
 * updatePayrollAmounts/updatePayrollStatus/batchUpdatePayrollStatus below,
 * on top of (not instead of) the existing per-row Draft-only-edit rule. */
export async function closePayrollPeriod(id: string): Promise<{ error: string } | { success: true }> {
  const actor = await requireRole("hrd", "superadmin");
  const { data: existing } = await supabaseAdmin.from("periode_payroll").select("status, bulan, tahun").eq("id", id).maybeSingle();
  if (!existing) return { error: "Periode tidak ditemukan." };
  const row = existing as { status: string; bulan: number; tahun: number };
  if (row.status === "Closed") return { error: "Periode ini sudah Closed." };
  const { data: unpaid } = await supabaseAdmin.from("penggajian").select("id").eq("period_id", id).neq("status", "Paid").limit(1);
  if ((unpaid || []).length > 0) {
    return { error: "Masih ada slip gaji yang belum Paid di periode ini — semua slip harus Dibayar sebelum periode bisa di-Closed." };
  }
  const { error } = await supabaseAdmin.from("periode_payroll").update({ status: "Closed", closed_at: new Date().toISOString() }).eq("id", id);
  if (error) { console.error("[admin] closePayrollPeriod error:", error.message); return { error: "Gagal menutup periode." }; }
  auditLog({ action: "payroll.status_change", targetId: id, targetName: `${MONTH_NAMES_ID[row.bulan]} ${row.tahun}`, performedBy: actor, detail: `Periode payroll ditutup (Closed).` });
  revalidatePath("/hrd/rewards/periode");
  return { success: true };
}

/** Sum of any Kasbon (employee loan) installments due this exact
 * employee+period — see 20260818005_kasbon.sql / kasbon.ts. Returns the
 * matching kasbon_cicilan row ids too, so the caller can mark them
 * 'Terpotong' + link penggajian_id ONLY after the penggajian insert
 * actually succeeds (mirrors the existing notify-after-success pattern in
 * this file) — never before, so a failed payroll insert can't silently
 * consume an installment. */
async function getKasbonDeductionForPeriod(employeeId: string, month: number, year: number): Promise<{ amount: number; cicilanIds: string[] }> {
  const { data } = await supabaseAdmin
    .from("kasbon_cicilan")
    .select("id, jumlah")
    .eq("employee_id", employeeId)
    .eq("target_month", month)
    .eq("target_year", year)
    .eq("status", "Belum Dibayar");
  const rows = (data || []) as { id: string; jumlah: number }[];
  return { amount: rows.reduce((s, r) => s + (Number(r.jumlah) || 0), 0), cicilanIds: rows.map((r) => r.id) };
}

async function markKasbonInstallmentsPaid(cicilanIds: string[], penggajianId: string) {
  if (cicilanIds.length === 0) return;
  await supabaseAdmin.from("kasbon_cicilan")
    .update({ status: "Terpotong", penggajian_id: penggajianId, tanggal_potong: new Date().toISOString() })
    .in("id", cicilanIds);
  // Peeking at just the first row's kasbon_id is safe here (not a bug) only
  // because submitKasbon() enforces one active kasbon per employee at a
  // time — every cicilanId passed in for a single employee+period always
  // belongs to the same kasbon. If that invariant ever changes (e.g.
  // allowing concurrent loans), this needs to loop per distinct kasbon_id.
  const { data: cicilanRow } = await supabaseAdmin.from("kasbon_cicilan").select("kasbon_id").in("id", cicilanIds).limit(1).maybeSingle();
  const kasbonId = (cicilanRow as { kasbon_id?: string } | null)?.kasbon_id;
  if (!kasbonId) return;
  const { data: remaining } = await supabaseAdmin.from("kasbon_cicilan").select("id").eq("kasbon_id", kasbonId).eq("status", "Belum Dibayar");
  if ((remaining || []).length === 0) {
    await supabaseAdmin.from("kasbon").update({ status: "Lunas" }).eq("id", kasbonId);
  }
}

export async function generatePayslip(formData: FormData) {
  const actor = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const month = parseInt(formData.get("month") as string || "0", 10);
  const year = parseInt(formData.get("year") as string || "0", 10);
  if (!employeeId || !month || !year) return { error: "Pilih karyawan, bulan, dan tahun." };
  const { data: existing } = await supabaseAdmin.from("penggajian")
    .select("id").eq("employee_id", employeeId).eq("month", month).eq("year", year).maybeSingle();
  if (existing) return { error: "Slip gaji untuk periode ini sudah dibuat." };
  const periodResult = await getOrCreatePayrollPeriod(month, year, actor);
  if ("error" in periodResult) return periodResult;
  const { data: salaryData } = await supabaseAdmin.from("struktur_gaji")
    .select("basic_salary, ptkp_status")
    .eq("employee_id", employeeId).maybeSingle();
  const basic = Number(salaryData?.basic_salary) || 0;
  if (basic === 0) return { error: "Belum ada struktur gaji untuk karyawan ini. Isi di menu Komponen Gaji terlebih dahulu." };
  const { tunjangan: allowances, potongan: amalJariyah, taxableTunjangan } = await sumEmployeeComponentsByType(employeeId, basic);

  const periodKey = `${String(month).padStart(2, "0")}/${year}`;
  const { data: bonusRows } = await supabaseAdmin
    .from("insentif")
    .select("amount")
    .eq("employee_id", employeeId)
    .eq("period", periodKey)
    .in("status", ["Disetujui", "Dibayarkan"]);
  const bonus = Math.max(0, (bonusRows || []).reduce((s, r) => s + (Number((r as Record<string, unknown>).amount) || 0), 0));

  const attData = await computeAttendancePayrollData(employeeId, month, year);
  const kpiBonus = await computeKpiBonus(employeeId, basic);

  const { monthlyTax, bpjsHealth, bpjsEmployment } = await computeTaxAndBpjs(basic, allowances, taxableTunjangan, (salaryData?.ptkp_status as string) || "TK/0");
  const kasbonDue = await getKasbonDeductionForPeriod(employeeId, month, year);

  // `deductions` stays MANUAL-ONLY (what HRD can edit via updatePayrollAmounts)
  // — kasbon is tracked in its own kasbon_deduction column so editing Potongan
  // Lain can never silently wipe out this period's loan installment.
  const grossSalary = basic + allowances + bonus + kpiBonus + attData.overtimePay + attData.attendanceAllowance + attData.shiftAllowance;
  const totalDeductions = monthlyTax + bpjsHealth + bpjsEmployment + amalJariyah + kasbonDue.amount + attData.lateDeduction + attData.absentDeduction + attData.earlyLeaveDeduction;
  const netSalary = grossSalary - totalDeductions;
  const takeHomePay = netSalary;

  const newRow = {
    id: crypto.randomUUID(),
    employee_id: employeeId,
    month, year,
    basic_salary: basic,
    allowances,
    bonus,
    tax: monthlyTax,
    bpjs_health: bpjsHealth,
    bpjs_employment: bpjsEmployment,
    deductions: amalJariyah,
    kasbon_deduction: kasbonDue.amount,
    overtime_pay: attData.overtimePay,
    attendance_allowance: attData.attendanceAllowance,
    late_deduction: attData.lateDeduction,
    absent_deduction: attData.absentDeduction,
    early_leave_minutes: attData.earlyLeaveMinutes,
    early_leave_deduction: attData.earlyLeaveDeduction,
    shift_allowance: attData.shiftAllowance,
    kpi_bonus: kpiBonus,
    sakit_days: attData.sakitDays,
    izin_days: attData.izinDays,
    cuti_days: attData.cutiDays,
    work_days_actual: attData.workDaysPerMonth,
    gross_salary: grossSalary,
    take_home_pay: takeHomePay,
    attendance_days: attData.attendanceDays,
    absent_days: attData.absentDays,
    late_count: attData.lateCount,
    overtime_hours: attData.overtimeHours,
    net_salary: netSalary,
    status: "Draft",
    created_at: new Date().toISOString(),
    period_id: periodResult.id,
  };
  const { error } = await supabaseAdmin.from("penggajian").insert(newRow);
  if (error?.code === "42P01") return { error: "Tabel payroll belum tersedia. Jalankan migrasi terlebih dahulu." };
  if (error?.code === "PGRST204" || /column .* does not exist/i.test(error?.message || "")) {
    return { error: "Jalankan migrasi 20260801002_payroll_attendance_integration.sql dan 20260818009_payroll_attendance_detail.sql terlebih dahulu." };
  }
  if (error) { console.error("[admin] generatePayslip error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  await markKasbonInstallmentsPaid(kasbonDue.cicilanIds, newRow.id);
  await recordPayrollHistory(newRow.id, "created", null, newRow, actor);
  auditLog({ action: "payroll.generate", targetId: newRow.id, targetName: `${periodKey}`, performedBy: actor, detail: `Slip gaji dibuat untuk periode ${periodKey}.` });

  // Notify employee
  const { data: empData } = await supabaseAdmin.from("karyawan").select("email, full_name").eq("id", employeeId).maybeSingle();
  const empEmail = (empData as Record<string, unknown> | null)?.email as string | undefined;
  if (empEmail) {
    const { data: penggunaRow } = await supabaseAdmin.from("pengguna").select("email").eq("email", empEmail).maybeSingle();
    const notifyEmail = (penggunaRow as Record<string, unknown> | null)?.email as string || empEmail;
    await supabaseAdmin.from("notifikasi").insert({
      id: crypto.randomUUID(),
      user_email: notifyEmail,
      title: "Slip Gaji Tersedia",
      message: `Slip gaji bulan ${month}/${year} telah dibuat. Total: Rp ${netSalary.toLocaleString("id-ID")}`,
      link: "/employee/payroll",
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

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

export async function updatePayrollStatus(
  id: string,
  statusInput: string,
  paymentMeta?: { payment_method?: string; transfer_date?: string; payment_reference?: string; payment_notes?: string }
): Promise<{ error: string } | { success: true }> {
  if (!PAYROLL_STATUSES.includes(statusInput as PayrollStatus)) return { error: "Status tidak valid." };
  const status = statusInput as PayrollStatus;
  // Authorize BEFORE touching the DB — reading the row first and returning
  // "Data payroll tidak ditemukan." vs. a period-locked message gave an
  // unauthenticated caller a record existence/state oracle.
  const guardResult = await assertPayrollTransitionAllowed(status);
  if (guardResult) return guardResult;
  const actor = await requireAuth();

  const { data: current } = await supabaseAdmin.from("penggajian").select("status, period_id").eq("id", id).maybeSingle();
  const currentStatus = (current as { status?: PayrollStatus; period_id?: string } | null)?.status;
  if (!currentStatus) return { error: "Data payroll tidak ditemukan." };
  const closedErr = await assertPeriodNotClosed((current as { period_id?: string } | null)?.period_id);
  if (closedErr) return { error: closedErr };
  if (PAYROLL_TRANSITIONS[currentStatus] !== status) {
    return { error: `Tidak dapat mengubah status dari "${currentStatus}" langsung ke "${status}" — ikuti urutan verifikasi.` };
  }

  if (status === "Paid" && !paymentMeta?.payment_method) {
    return { error: "Metode pembayaran wajib diisi saat menandai Dibayar." };
  }

  const updatePayload: Record<string, unknown> = { status };
  if (status === "Paid" && paymentMeta) {
    updatePayload.payment_method = paymentMeta.payment_method || null;
    updatePayload.transfer_date = paymentMeta.transfer_date || null;
    updatePayload.payment_reference = paymentMeta.payment_reference || null;
    updatePayload.payment_notes = paymentMeta.payment_notes || null;
  }

  const { error } = await supabaseAdmin.from("penggajian").update(updatePayload).eq("id", id);
  if (error?.code === "23514") return { error: "Jalankan migrasi SQL 20260815001 terlebih dahulu." };
  if (error?.code === "PGRST204" || /column .* does not exist/i.test(error?.message || "")) {
    return { error: "Jalankan migrasi 20260818004_payroll_payment_metadata.sql terlebih dahulu." };
  }
  if (error) { console.error("[admin] updatePayrollStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  await recordPayrollHistory(id, status === "Paid" ? "paid" : "status_change", { status: currentStatus }, { status, ...updatePayload }, actor);
  auditLog({ action: status === "Paid" ? "payroll.paid" : "payroll.status_change", targetId: id, performedBy: actor, detail: `Status diubah dari "${currentStatus}" ke "${status}".` });

  // Notify employee on key status transitions
  if (status === "Approved" || status === "Paid") {
    const { data: slipData } = await supabaseAdmin.from("penggajian").select("employee_id, month, year, net_salary").eq("id", id).maybeSingle();
    if (slipData) {
      const s = slipData as Record<string, unknown>;
      const { data: empRow } = await supabaseAdmin.from("karyawan").select("email").eq("id", s.employee_id).maybeSingle();
      const notifyEmail = (empRow as Record<string, unknown> | null)?.email as string | undefined;
      if (notifyEmail) {
        const statusLabel = status === "Approved" ? "disetujui" : "telah dibayarkan";
        await supabaseAdmin.from("notifikasi").insert({
          id: crypto.randomUUID(),
          user_email: notifyEmail,
          title: `Payroll ${statusLabel === "disetujui" ? "Disetujui" : "Dibayarkan"}`,
          message: `Slip gaji bulan ${s.month}/${s.year} telah ${statusLabel}. Total: Rp ${(Number(s.net_salary) || 0).toLocaleString("id-ID")}`,
          link: "/employee/payroll",
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  revalidatePath("/hrd/rewards/payslips");
  return { success: true };
}

export async function generateBatchPayroll(formData: FormData): Promise<{ error: string } | { success: true; created: number; skipped: number; warnings?: string[] }> {
  const actor = await requireRole("hrd", "superadmin");
  const month = parseInt(formData.get("month") as string || "0", 10);
  const year = parseInt(formData.get("year") as string || "0", 10);
  if (!month || !year) return { error: "Pilih bulan dan tahun." };
  const periodResult = await getOrCreatePayrollPeriod(month, year, actor);
  if ("error" in periodResult) return periodResult;
  const { data: employees } = await supabaseAdmin
    .from("karyawan").select("id, full_name, status")
    .in("status", ["Tetap", "Kontrak", "Magang"]).order("full_name");
  if (!employees || employees.length === 0) return { error: "Tidak ada karyawan aktif." };
  let created = 0; let skipped = 0;
  const warnings: string[] = [];
  for (const emp of employees) {
    const result = await computePayrollEntry(emp.id as string, month, year, actor, periodResult.id);
    if ("error" in result) {
      if (result.error === "exists") { skipped++; continue; }
      warnings.push(`${emp.full_name}: ${result.error}`);
      continue;
    }
    created++;
  }
  const periodKey = `${String(month).padStart(2, "0")}/${year}`;
  auditLog({ action: "payroll.generate", targetName: periodKey, performedBy: actor, detail: `Generate batch payroll periode ${periodKey}: ${created} dibuat, ${skipped} dilewati.` });
  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  return { success: true, created, skipped, ...(warnings.length > 0 ? { warnings: warnings.slice(0, 5) } : {}) };
}

export async function updatePayrollAmounts(formData: FormData) {
  const actor = await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const bonus = Math.max(0, parseFloat(formData.get("bonus") as string || "0") || 0);
  const deductions = Math.max(0, parseFloat(formData.get("deductions") as string || "0") || 0);
  if (!id) return { error: "ID payroll tidak valid." };
  // Select EVERY income/deduction column that feeds gross/net, not just the
  // ones this function edits — shift_allowance, kpi_bonus,
  // early_leave_deduction and kasbon_deduction were previously left out of
  // both the select and the recompute below, so saving a Bonus/Potongan Lain
  // edit here silently zeroed them out of gross_salary/net_salary even
  // though the underlying columns were untouched (a real, user-visible bug —
  // kasbon deductions in particular would disappear from the take-home pay
  // the moment HRD edited anything else on a Draft payroll).
  const FULL_COLUMNS = "status, period_id, basic_salary, allowances, bonus, deductions, kasbon_deduction, tax, bpjs_health, bpjs_employment, overtime_pay, attendance_allowance, shift_allowance, kpi_bonus, late_deduction, absent_deduction, early_leave_deduction, net_salary, gross_salary, take_home_pay";
  const BASE_COLUMNS = "status, period_id, basic_salary, allowances, bonus, deductions, tax, bpjs_health, bpjs_employment, overtime_pay, attendance_allowance, late_deduction, absent_deduction, net_salary, gross_salary, take_home_pay";
  const first = await supabaseAdmin.from("penggajian").select(FULL_COLUMNS).eq("id", id).maybeSingle();
  let existing = first.data as Record<string, unknown> | null;
  let selectErr = first.error;
  // shift_allowance/kpi_bonus/early_leave_deduction (20260818009) and
  // kasbon_deduction (20260818010) may not be migrated on this DB yet — a
  // missing column fails the WHOLE select (data becomes null), which
  // previously surfaced as the misleading "Data payroll tidak ditemukan."
  // Retry with the pre-migration column set instead of hard-failing Save for
  // every payroll row until the migration runs; those components just read
  // as 0 until then; the DB update itself never touches them, only reads.
  if (selectErr && (selectErr.code === "42703" || /column .* does not exist/i.test(selectErr.message || ""))) {
    const fallback = await supabaseAdmin.from("penggajian").select(BASE_COLUMNS).eq("id", id).maybeSingle();
    existing = fallback.data as Record<string, unknown> | null; selectErr = fallback.error;
  }
  if (!existing) return { error: "Data payroll tidak ditemukan." };
  const row = existing;
  if (row.status !== "Draft") return { error: "Hanya payroll Draft yang dapat diedit." };
  const closedErr = await assertPeriodNotClosed(row.period_id as string | null);
  if (closedErr) return { error: closedErr };
  const overtimePay = Number(row.overtime_pay) || 0;
  const attendanceAllowance = Number(row.attendance_allowance) || 0;
  const shiftAllowance = Number(row.shift_allowance) || 0;
  const kpiBonus = Number(row.kpi_bonus) || 0;
  const lateDeduction = Number(row.late_deduction) || 0;
  const absentDeduction = Number(row.absent_deduction) || 0;
  const earlyLeaveDeduction = Number(row.early_leave_deduction) || 0;
  const kasbonDeduction = Number(row.kasbon_deduction) || 0;
  const gross = (Number(row.basic_salary) || 0) + (Number(row.allowances) || 0) + bonus + kpiBonus + overtimePay + attendanceAllowance + shiftAllowance;
  const totalDeductions = (Number(row.tax) || 0) + (Number(row.bpjs_health) || 0) + (Number(row.bpjs_employment) || 0) + deductions + kasbonDeduction + lateDeduction + absentDeduction + earlyLeaveDeduction;
  const net = gross - totalDeductions;
  const { error } = await supabaseAdmin.from("penggajian").update({
    bonus, deductions, net_salary: net, gross_salary: gross, take_home_pay: net
  }).eq("id", id);
  if (error) { console.error("[admin] updatePayrollAmounts:", error.message); return { error: "Gagal." }; }
  await recordPayrollHistory(
    id, "edited",
    { bonus: row.bonus, deductions: row.deductions, net_salary: row.net_salary, gross_salary: row.gross_salary, take_home_pay: row.take_home_pay },
    { bonus, deductions, net_salary: net, gross_salary: gross, take_home_pay: net },
    actor
  );
  auditLog({ action: "payroll.edit", targetId: id, performedBy: actor, detail: `Bonus/potongan diubah — net sebelumnya Rp ${Number(row.net_salary) || 0}, sekarang Rp ${net}.` });
  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  return { success: true };
}

export async function batchUpdatePayrollStatus(
  formData: FormData,
  paymentMeta?: { payment_method?: string; transfer_date?: string; payment_reference?: string; payment_notes?: string }
): Promise<{ error: string } | { success: true; updated: number }> {
  const month = parseInt(formData.get("month") as string || "0", 10);
  const year = parseInt(formData.get("year") as string || "0", 10);
  const status = (formData.get("status") as string || "").trim() as PayrollStatus;
  if (!month || !year) return { error: "Pilih bulan dan tahun." };
  if (!PAYROLL_STATUSES.includes(status)) return { error: "Status tidak valid." };
  const fromStatus = (Object.keys(PAYROLL_TRANSITIONS) as PayrollStatus[]).find((s) => PAYROLL_TRANSITIONS[s] === status);
  if (!fromStatus) return { error: "Tidak ada tahap sebelumnya untuk status ini." };
  // Authorize before any DB read — same existence-oracle reasoning as
  // updatePayrollStatus above.
  const guardResult = await assertPayrollTransitionAllowed(status);
  if (guardResult) return guardResult;
  const actor = await requireAuth();

  const { data: periodRow } = await supabaseAdmin.from("periode_payroll").select("id, status").eq("bulan", month).eq("tahun", year).maybeSingle();
  const periodStatus = (periodRow as { status?: string } | null)?.status;
  if (periodStatus && LOCKED_PERIOD_STATUSES.includes(periodStatus)) {
    return { error: `Periode payroll ini sudah berstatus "${periodStatus}" dan tidak dapat diubah.` };
  }

  if (status === "Paid" && !paymentMeta?.payment_method) {
    return { error: "Metode pembayaran wajib diisi saat menandai Dibayar." };
  }
  const updatePayload: Record<string, unknown> = { status };
  if (status === "Paid" && paymentMeta) {
    updatePayload.payment_method = paymentMeta.payment_method || null;
    updatePayload.transfer_date = paymentMeta.transfer_date || null;
    updatePayload.payment_reference = paymentMeta.payment_reference || null;
    updatePayload.payment_notes = paymentMeta.payment_notes || null;
  }

  const { data: affectedRows } = await supabaseAdmin.from("penggajian").select("id")
    .eq("month", month).eq("year", year).eq("status", fromStatus);
  const { count, error } = await supabaseAdmin.from("penggajian")
    .update(updatePayload, { count: "exact" }).eq("month", month).eq("year", year).eq("status", fromStatus);
  if (error) { console.error("[admin] batchUpdatePayrollStatus:", error.message); return { error: "Gagal." }; }

  const periodKey = `${String(month).padStart(2, "0")}/${year}`;
  for (const r of (affectedRows || []) as { id: string }[]) {
    await recordPayrollHistory(r.id, status === "Paid" ? "paid" : "status_change", { status: fromStatus }, { status, ...updatePayload }, actor);
  }
  auditLog({ action: status === "Paid" ? "payroll.paid" : "payroll.status_change", targetName: periodKey, performedBy: actor, detail: `Batch update ${count || 0} slip gaji periode ${periodKey} dari "${fromStatus}" ke "${status}".` });

  revalidatePath("/hrd/payroll");
  revalidatePath("/hrd/rewards/payroll");
  return { success: true, updated: count || 0 };
}

async function computePayrollEntry(employeeId: string, month: number, year: number, actor: { id: string; name: string; role: string }, periodId?: string): Promise<{ success: true } | { error: string }> {
  const { data: existing } = await supabaseAdmin.from("penggajian")
    .select("id").eq("employee_id", employeeId).eq("month", month).eq("year", year).maybeSingle();
  if (existing) return { error: "exists" };
  const { data: sd } = await supabaseAdmin.from("struktur_gaji")
    .select("basic_salary, ptkp_status").eq("employee_id", employeeId).maybeSingle();
  const basic = Number(sd?.basic_salary) || 0;
  if (basic === 0) return { error: "Struktur gaji belum diisi." };
  const { tunjangan: allowances, potongan: amalJariyah, taxableTunjangan } = await sumEmployeeComponentsByType(employeeId, basic);
  const periodKey = `${String(month).padStart(2, "0")}/${year}`;
  const { data: bonusRows } = await supabaseAdmin.from("insentif").select("amount")
    .eq("employee_id", employeeId).eq("period", periodKey).in("status", ["Disetujui", "Dibayarkan"]);
  const bonus = Math.max(0, (bonusRows || []).reduce((s, r) => s + (Number((r as Record<string, unknown>).amount) || 0), 0));

  const attData = await computeAttendancePayrollData(employeeId, month, year);
  const kpiBonus = await computeKpiBonus(employeeId, basic);

  const { monthlyTax: tax, bpjsHealth: bpH, bpjsEmployment: bpE } = await computeTaxAndBpjs(basic, allowances, taxableTunjangan, (sd?.ptkp_status as string) || "TK/0");
  const kasbonDue = await getKasbonDeductionForPeriod(employeeId, month, year);

  const gross = basic + allowances + bonus + kpiBonus + attData.overtimePay + attData.attendanceAllowance + attData.shiftAllowance;
  const totalDeductions = tax + bpH + bpE + amalJariyah + kasbonDue.amount + attData.lateDeduction + attData.absentDeduction + attData.earlyLeaveDeduction;
  const net = gross - totalDeductions;

  const newRow = {
    id: crypto.randomUUID(), employee_id: employeeId, month, year,
    basic_salary: basic, allowances, bonus, tax, bpjs_health: bpH, bpjs_employment: bpE,
    deductions: amalJariyah,
    kasbon_deduction: kasbonDue.amount,
    overtime_pay: attData.overtimePay,
    attendance_allowance: attData.attendanceAllowance,
    late_deduction: attData.lateDeduction,
    absent_deduction: attData.absentDeduction,
    early_leave_minutes: attData.earlyLeaveMinutes,
    early_leave_deduction: attData.earlyLeaveDeduction,
    shift_allowance: attData.shiftAllowance,
    kpi_bonus: kpiBonus,
    sakit_days: attData.sakitDays,
    izin_days: attData.izinDays,
    cuti_days: attData.cutiDays,
    work_days_actual: attData.workDaysPerMonth,
    gross_salary: gross, take_home_pay: net,
    attendance_days: attData.attendanceDays,
    absent_days: attData.absentDays,
    late_count: attData.lateCount,
    overtime_hours: attData.overtimeHours,
    net_salary: net, status: "Draft", created_at: new Date().toISOString(),
    ...(periodId ? { period_id: periodId } : {}),
  };
  const { error } = await supabaseAdmin.from("penggajian").insert(newRow);
  if (error?.code === "PGRST204" || /column .* does not exist/i.test(error?.message || "")) {
    return { error: "Jalankan migrasi 20260818009_payroll_attendance_detail.sql terlebih dahulu." };
  }
  if (error) { console.error("[admin] computePayrollEntry:", error.message); return { error: "Gagal" }; }
  await markKasbonInstallmentsPaid(kasbonDue.cicilanIds, newRow.id);
  await recordPayrollHistory(newRow.id, "created", null, newRow, actor);
  return { success: true };
}

/** THR (Tunjangan Hari Raya) — mandated under PP 78/2015 & Permenaker No.
 * 6/2016: 1x gaji pokok for employees with >=12 months tenure, pro-rated
 * (months worked / 12) for less. There was previously no way to actually
 * create a THR record — the payroll dashboard's "Total THR" stat queries
 * `insentif` for type='THR', but nothing in the app ever inserted one
 * (confirmed live: only type='incentive' rows exist), so that stat was
 * always Rp 0 regardless of whether THR had genuinely been paid. This
 * generates one `insentif` row per active employee for the target payment
 * month/year, which then flows into that month's payroll exactly like any
 * other bonus (existing lookup in computePayrollEntry/generatePayslip
 * already matches by period + status, unchanged).
 *
 * `status: "Disetujui"` — HRD generating this IS the approval; there's no
 * separate sign-off step for THR in this app's role model. */
export async function generateThr(month: number, year: number): Promise<{ error: string } | { success: true; created: number; skipped: number; totalAmount: number }> {
  const actor = await requireRole("hrd", "superadmin");
  if (!month || !year) return { error: "Pilih bulan dan tahun pembayaran THR." };
  const periodKey = `${String(month).padStart(2, "0")}/${year}`;

  const { data: employees } = await supabaseAdmin
    .from("karyawan").select("id, full_name, join_date, status")
    .in("status", ["Tetap", "Kontrak", "Magang"]);
  if (!employees || employees.length === 0) return { error: "Tidak ada karyawan aktif." };

  const paymentDate = new Date(year, month - 1, 1);
  let created = 0, skipped = 0, totalAmount = 0;
  for (const emp of employees as { id: string; full_name: string; join_date: string | null }[]) {
    const { data: existingThr } = await supabaseAdmin
      .from("insentif").select("id").eq("employee_id", emp.id).eq("period", periodKey).eq("type", "THR").maybeSingle();
    if (existingThr) { skipped++; continue; }

    const { data: sd } = await supabaseAdmin.from("struktur_gaji").select("basic_salary").eq("employee_id", emp.id).maybeSingle();
    const basic = Number((sd as { basic_salary?: number } | null)?.basic_salary) || 0;
    if (basic === 0) { skipped++; continue; }

    let monthsWorked = 12;
    if (emp.join_date) {
      const join = new Date(emp.join_date);
      monthsWorked = Math.max(0, (paymentDate.getFullYear() - join.getFullYear()) * 12 + (paymentDate.getMonth() - join.getMonth()));
    }
    const proration = Math.min(1, monthsWorked / 12);
    const thrAmount = Math.round(basic * proration);
    if (thrAmount <= 0) { skipped++; continue; }

    const { error } = await supabaseAdmin.from("insentif").insert({
      id: "thr-" + crypto.randomUUID(), employee_id: emp.id, type: "THR",
      program: `THR Keagamaan ${year}`,
      period: periodKey, amount: thrAmount, status: "Disetujui",
      notes: `Masa kerja ${monthsWorked} bulan (prorata ${Math.round(proration * 100)}%)`,
      created_at: new Date().toISOString(),
    });
    if (error) { console.error("[admin] generateThr insert error:", error.message); skipped++; continue; }
    created++;
    totalAmount += thrAmount;
  }

  auditLog({ action: "payroll.generate", targetName: `THR ${periodKey}`, performedBy: actor, detail: `THR digenerate untuk ${created} karyawan, total Rp ${totalAmount.toLocaleString("id-ID")}.` });
  revalidatePath("/hrd/rewards/bonuses");
  return { success: true, created, skipped, totalAmount };
}

export interface PayrollDetail {
  payroll: Record<string, unknown>;
  employee: { full_name: string; department: string; position: string; nik: string | null } | null;
  components: EmployeeSalaryComponent[];
  history: Record<string, unknown>[];
  kasbon: { status: string; jumlah_pengajuan: number; sisa_pokok: number; cicilan_periode_ini: number } | null;
}

/** Feeds the Edit Payroll modal — HRD only ever VIEWS the tunjangan
 * breakdown, kasbon status and change history here; the only editable
 * fields stay Bonus/Potongan Lain via updatePayrollAmounts. One call
 * instead of several round-trips from the client. Tables that haven't been
 * migrated yet (riwayat_penggajian, kasbon) degrade to an empty/null result
 * rather than failing the whole detail view. */
export async function getPayrollDetail(id: string): Promise<PayrollDetail | { error: string }> {
  await requireRole("hrd", "superadmin", "director");
  if (!id) return { error: "ID payroll tidak valid." };
  const { data: payrollRow, error } = await supabaseAdmin
    .from("penggajian")
    .select("*, karyawan!inner(full_name, department, position, nik)")
    .eq("id", id).maybeSingle();
  if (error || !payrollRow) return { error: "Data payroll tidak ditemukan." };
  const row = payrollRow as Record<string, unknown>;
  const karyawanRaw = row.karyawan as Record<string, unknown> | Record<string, unknown>[] | undefined;
  const karyawan = Array.isArray(karyawanRaw) ? karyawanRaw[0] : karyawanRaw;
  const employeeId = row.employee_id as string;
  const basic = Number(row.basic_salary) || 0;

  const components = await getEmployeeSalaryComponentsCore(employeeId, basic);

  const { data: historyRows, error: historyErr } = await supabaseAdmin
    .from("riwayat_penggajian")
    .select("id, action, changed_by_name, changed_by_role, changed_at, note, snapshot_before, snapshot_after")
    .eq("penggajian_id", id)
    .order("changed_at", { ascending: false });
  const history = historyErr ? [] : ((historyRows || []) as Record<string, unknown>[]);

  let kasbon: PayrollDetail["kasbon"] = null;
  const { data: kasbonRow, error: kasbonErr } = await supabaseAdmin
    .from("kasbon")
    .select("id, status, jumlah_pengajuan")
    .eq("employee_id", employeeId)
    .in("status", ["Berjalan", "Disetujui", "Diajukan"])
    .order("created_at", { ascending: false })
    .limit(1).maybeSingle();
  if (!kasbonErr && kasbonRow) {
    const k = kasbonRow as { id: string; status: string; jumlah_pengajuan: number };
    const { data: cicilanRows } = await supabaseAdmin.from("kasbon_cicilan").select("jumlah, status").eq("kasbon_id", k.id);
    const paid = ((cicilanRows || []) as { jumlah: number; status: string }[])
      .filter((r) => r.status === "Terpotong").reduce((s, r) => s + (Number(r.jumlah) || 0), 0);
    kasbon = {
      status: k.status,
      jumlah_pengajuan: Number(k.jumlah_pengajuan) || 0,
      sisa_pokok: Math.max(0, (Number(k.jumlah_pengajuan) || 0) - paid),
      cicilan_periode_ini: Number(row.kasbon_deduction) || 0,
    };
  }

  return {
    payroll: row,
    employee: karyawan ? {
      full_name: String(karyawan.full_name || ""), department: String(karyawan.department || ""),
      position: String(karyawan.position || ""), nik: karyawan.nik ? String(karyawan.nik) : null,
    } : null,
    components, history, kasbon,
  };
}
