"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { getEmployeeSalaryComponentsCore, type EmployeeSalaryComponent as EmployeeSalaryComponentType } from "@/lib/payroll-components-core";

const MISSING_TABLE = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || /relation .* does not exist|could not find the table/i.test(error.message || ""));
const MIGRATION_ERROR = "Jalankan migrasi 20260813001_dynamic_payroll_components.sql terlebih dahulu.";

export interface JenisKomponenGaji {
  id: string;
  nama: string;
  tipe: "tunjangan" | "potongan";
  deskripsi: string | null;
  is_active: boolean;
  sort_order: number;
  taxable: boolean;
  formula_type: "fixed" | "percent_of_basic";
  formula_percent: number | null;
}

/** Master list of allowance/deduction types — HRD-managed, no code change
 * needed to add a new one (per boss's request). */
export async function getJenisKomponenGaji(includeInactive = false): Promise<JenisKomponenGaji[]> {
  await requireRole("hrd", "superadmin");
  let q = supabaseAdmin.from("jenis_komponen_gaji").select("*").order("tipe").order("sort_order");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) return [];
  return (data as JenisKomponenGaji[]) || [];
}

export async function saveJenisKomponenGaji(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const nama = (formData.get("nama") as string || "").trim();
  const tipe = (formData.get("tipe") as string || "").trim();
  const deskripsi = (formData.get("deskripsi") as string || "").trim() || null;
  const taxable = formData.get("taxable") !== "false"; // default true unless explicitly unchecked
  const formulaType = (formData.get("formula_type") as string || "fixed").trim();
  const formulaPercentRaw = (formData.get("formula_percent") as string || "").trim();
  if (!nama) return { error: "Nama komponen wajib diisi." };
  if (tipe !== "tunjangan" && tipe !== "potongan") return { error: "Tipe harus tunjangan atau potongan." };
  if (formulaType !== "fixed" && formulaType !== "percent_of_basic") return { error: "Jenis formula tidak valid." };
  if (formulaType === "percent_of_basic" && (!formulaPercentRaw || Number(formulaPercentRaw) <= 0)) {
    return { error: "Persentase wajib diisi (lebih dari 0) untuk formula % dari gaji pokok." };
  }
  const formulaPercent = formulaType === "percent_of_basic" ? Math.max(0, Number(formulaPercentRaw)) : null;

  const { data: maxRow } = await supabaseAdmin.from("jenis_komponen_gaji").select("sort_order").eq("tipe", tipe).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const nextSort = ((maxRow as { sort_order?: number } | null)?.sort_order ?? 0) + 1;

  const { error } = await supabaseAdmin.from("jenis_komponen_gaji").upsert({
    id: id || ("komp-" + crypto.randomUUID()),
    nama, tipe, deskripsi, is_active: true,
    taxable, formula_type: formulaType, formula_percent: formulaPercent,
    sort_order: id ? undefined : nextSort,
    updated_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error)) return { error: MIGRATION_ERROR };
  if (error?.code === "PGRST204" || /column .* does not exist/i.test(error?.message || "")) {
    return { error: "Jalankan migrasi 20260818002_payroll_component_formula.sql terlebih dahulu." };
  }
  if (error) { console.error("[payroll-components] saveJenisKomponenGaji error:", error.message); return { error: "Gagal menyimpan komponen." }; }
  revalidatePath("/hrd/rewards/komponen-gaji");
  revalidatePath("/hrd/rewards/salary");
  return { success: true };
}

/** Deactivate rather than delete — existing employees may already have a
 * value against this component; hiding it from "add new" pickers is enough,
 * and hard-deleting would cascade-wipe their historical salary data. */
export async function deactivateJenisKomponenGaji(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID komponen wajib diisi." };
  const { error } = await supabaseAdmin.from("jenis_komponen_gaji").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (MISSING_TABLE(error)) return { error: MIGRATION_ERROR };
  if (error) { console.error("[payroll-components] deactivateJenisKomponenGaji error:", error.message); return { error: "Gagal menonaktifkan komponen." }; }
  revalidatePath("/hrd/rewards/komponen-gaji");
  revalidatePath("/hrd/rewards/salary");
  return { success: true };
}

export type { EmployeeSalaryComponent } from "@/lib/payroll-components-core";

/** Guarded wrapper for the salary editor (SalaryForm.tsx, a client component).
 * The unguarded implementation lives in src/lib/payroll-components-core.ts —
 * it takes an arbitrary employeeId, so exporting it from this "use server"
 * file made it a directly-replayable RPC that leaked ANY employee's full
 * salary breakdown to anyone who knew the action id. Server-side payroll code
 * (admin.ts, rewards.ts) calls the core function directly instead; only this
 * role-gated wrapper is reachable from a browser. */
export async function getEmployeeSalaryComponents(employeeId: string, basicSalary = 0): Promise<EmployeeSalaryComponentType[]> {
  await requireRole("hrd", "superadmin");
  return getEmployeeSalaryComponentsCore(employeeId, basicSalary);
}

/** Replaces an employee's full component set in one call (the salary editor
 * submits its whole row list at once) — deletes components no longer present
 * and upserts the rest, so removing a row in the UI actually removes it. */
export async function saveEmployeeSalaryComponents(employeeId: string, items: { komponen_id: string; jumlah: number; alasan?: string }[]): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (!employeeId) return { error: "Pilih karyawan terlebih dahulu." };
  const negative = items.find(i => i.jumlah < 0);
  if (negative) return { error: `Nilai komponen tidak boleh negatif (komponen "${negative.komponen_id}").` };

  const { data: existing, error: existErr } = await supabaseAdmin.from("struktur_gaji_komponen").select("id, komponen_id").eq("employee_id", employeeId);
  if (MISSING_TABLE(existErr)) return { error: MIGRATION_ERROR };

  const keepIds = new Set(items.map(i => i.komponen_id));
  const toDelete = ((existing || []) as { id: string; komponen_id: string }[]).filter(e => !keepIds.has(e.komponen_id)).map(e => e.id);
  if (toDelete.length > 0) await supabaseAdmin.from("struktur_gaji_komponen").delete().in("id", toDelete);

  const existingMap = new Map(((existing || []) as { id: string; komponen_id: string }[]).map(e => [e.komponen_id, e.id]));
  const rows = items.filter(i => i.jumlah > 0 || existingMap.has(i.komponen_id)).map(i => ({
    id: existingMap.get(i.komponen_id) || ("sgk-" + crypto.randomUUID()),
    employee_id: employeeId,
    komponen_id: i.komponen_id,
    jumlah: i.jumlah,
    alasan: i.alasan || null,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("struktur_gaji_komponen").upsert(rows, { onConflict: "employee_id,komponen_id" });
    if (MISSING_TABLE(error)) return { error: MIGRATION_ERROR };
    if (error) { console.error("[payroll-components] saveEmployeeSalaryComponents error:", error.message); return { error: "Gagal menyimpan komponen gaji." }; }
  }
  revalidatePath("/hrd/rewards/salary");
  return { success: true };
}
