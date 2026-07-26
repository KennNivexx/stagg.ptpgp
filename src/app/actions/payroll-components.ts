"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

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
  if (!nama) return { error: "Nama komponen wajib diisi." };
  if (tipe !== "tunjangan" && tipe !== "potongan") return { error: "Tipe harus tunjangan atau potongan." };

  const { data: maxRow } = await supabaseAdmin.from("jenis_komponen_gaji").select("sort_order").eq("tipe", tipe).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const nextSort = ((maxRow as { sort_order?: number } | null)?.sort_order ?? 0) + 1;

  const { error } = await supabaseAdmin.from("jenis_komponen_gaji").upsert({
    id: id || ("komp-" + crypto.randomUUID()),
    nama, tipe, deskripsi, is_active: true,
    sort_order: id ? undefined : nextSort,
    updated_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error)) return { error: MIGRATION_ERROR };
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

export interface EmployeeSalaryComponent { komponen_id: string; nama: string; tipe: "tunjangan" | "potongan"; jumlah: number; alasan?: string }

/** Sums an employee's dynamic components by tipe — the single source both
 * the salary editor and payroll generation (admin.ts) call, so the two never
 * drift apart. Falls back to reading the legacy fixed struktur_gaji columns
 * (mapped onto the same 6 built-in component ids) when the migration hasn't
 * run yet, so payroll/salary pages don't hard-break in the meantime. */
export async function getEmployeeSalaryComponents(employeeId: string): Promise<EmployeeSalaryComponent[]> {
  const { data, error } = await supabaseAdmin
    .from("struktur_gaji_komponen")
    .select("komponen_id, jumlah, jenis_komponen_gaji!inner(nama, tipe)")
    .eq("employee_id", employeeId);

  if (!MISSING_TABLE(error) && !error) {
    return ((data || []) as unknown as { komponen_id: string; jumlah: number; jenis_komponen_gaji: { nama: string; tipe: "tunjangan" | "potongan" } }[])
      .map(r => ({ komponen_id: r.komponen_id, nama: r.jenis_komponen_gaji.nama, tipe: r.jenis_komponen_gaji.tipe, jumlah: Number(r.jumlah) || 0 }));
  }

  // Fallback: legacy fixed columns, mapped to the same seeded built-in ids
  // the migration creates — once the migration runs, this branch is dead code.
  const { data: sd } = await supabaseAdmin.from("struktur_gaji").select("*").eq("employee_id", employeeId).maybeSingle();
  if (!sd) return [];
  const legacy: Array<{ id: string; nama: string; col: string }> = [
    { id: "komp-transport", nama: "Tunjangan Transport", col: "transport_allowance" },
    { id: "komp-makan", nama: "Tunjangan Makan", col: "meal_allowance" },
    { id: "komp-perumahan", nama: "Tunjangan Perumahan", col: "housing_allowance" },
    { id: "komp-jabatan", nama: "Tunjangan Jabatan", col: "position_allowance" },
    { id: "komp-kompensasi", nama: "Kompensasi", col: "kompensasi" },
  ];
  const result: EmployeeSalaryComponent[] = legacy
    .filter(l => Number((sd as Record<string, unknown>)[l.col]) > 0)
    .map(l => ({ komponen_id: l.id, nama: l.nama, tipe: "tunjangan" as const, jumlah: Number((sd as Record<string, unknown>)[l.col]) || 0 }));
  const amal = Number((sd as Record<string, unknown>).potongan_amal_jariyah) || 0;
  if (amal > 0) result.push({ komponen_id: "komp-amal-jariyah", nama: "Potongan Amal Jariyah", tipe: "potongan", jumlah: amal });
  return result;
}

/** Sum of dynamic components by tipe, for payroll generation — allowances
 * (tunjangan) add to gross, deductions (potongan) subtract before net. */
export async function sumEmployeeComponentsByType(employeeId: string): Promise<{ tunjangan: number; potongan: number }> {
  const components = await getEmployeeSalaryComponents(employeeId);
  return {
    tunjangan: components.filter(c => c.tipe === "tunjangan").reduce((s, c) => s + c.jumlah, 0),
    potongan: components.filter(c => c.tipe === "potongan").reduce((s, c) => s + c.jumlah, 0),
  };
}

/** Replaces an employee's full component set in one call (the salary editor
 * submits its whole row list at once) — deletes components no longer present
 * and upserts the rest, so removing a row in the UI actually removes it. */
export async function saveEmployeeSalaryComponents(employeeId: string, items: { komponen_id: string; jumlah: number; alasan?: string }[]): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (!employeeId) return { error: "Pilih karyawan terlebih dahulu." };

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
