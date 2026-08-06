import { supabaseAdmin } from "@/lib/supabase";

// Plain lib (NO "use server") — every export from a "use server" file is a
// directly client-callable RPC endpoint whether or not any UI references it,
// so shared payroll logic that takes an arbitrary employeeId must NOT live
// there. These two functions previously WERE exported from
// src/app/actions/payroll-components.ts with no auth guard at all, meaning
// anyone could read any employee's full salary-component breakdown by
// replaying the action id. They're moved here (callable only from
// already-guarded server code) and the actions file now exposes guarded
// wrappers instead. Same pattern as attendance-core.ts / leaves-core.ts.

const MISSING_TABLE = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || /relation .* does not exist|could not find the table/i.test(error.message || ""));

export interface EmployeeSalaryComponent {
  komponen_id: string;
  nama: string;
  tipe: "tunjangan" | "potongan";
  jumlah: number;
  taxable: boolean;
  alasan?: string;
}

/** `basicSalary` resolves 'percent_of_basic' components at read time (e.g. a
 * "Tunjangan Jabatan = 10% gaji pokok" component type) — struktur_gaji_komponen's
 * `jumlah` column is only meaningful for 'fixed' components; for
 * 'percent_of_basic' ones it's ignored in favor of computing basicSalary *
 * formula_percent / 100, so HRD never has to keep a stale rupiah number in
 * sync by hand when someone's gaji pokok changes. Callers MUST pass the real
 * basic salary — omitting it silently zeroes every percent-based component. */
export async function getEmployeeSalaryComponentsCore(employeeId: string, basicSalary = 0): Promise<EmployeeSalaryComponent[]> {
  const { data, error } = await supabaseAdmin
    .from("struktur_gaji_komponen")
    .select("komponen_id, jumlah, jenis_komponen_gaji!inner(nama, tipe, taxable, formula_type, formula_percent)")
    .eq("employee_id", employeeId);

  if (!MISSING_TABLE(error) && !error) {
    return ((data || []) as unknown as { komponen_id: string; jumlah: number; jenis_komponen_gaji: { nama: string; tipe: "tunjangan" | "potongan"; taxable?: boolean; formula_type?: string; formula_percent?: number | null } }[])
      .map(r => {
        const j = r.jenis_komponen_gaji;
        const resolvedAmount = j.formula_type === "percent_of_basic"
          ? Math.round(basicSalary * (Number(j.formula_percent) || 0) / 100)
          : Number(r.jumlah) || 0;
        return {
          komponen_id: r.komponen_id, nama: j.nama, tipe: j.tipe,
          jumlah: Math.max(0, resolvedAmount), // negative components are never valid — see spec §15
          taxable: j.taxable !== false,
        };
      });
  }

  // Fallback: legacy fixed columns, mapped to the same seeded built-in ids
  // the migration creates — once the migration runs, this branch is dead code.
  // Legacy components have no taxable/formula concept yet, so they default
  // taxable=true (matches the pre-existing behavior — everything was taxable
  // before this column existed) and are always treated as fixed amounts.
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
    .map(l => ({ komponen_id: l.id, nama: l.nama, tipe: "tunjangan" as const, jumlah: Number((sd as Record<string, unknown>)[l.col]) || 0, taxable: true }));
  const amal = Number((sd as Record<string, unknown>).potongan_amal_jariyah) || 0;
  if (amal > 0) result.push({ komponen_id: "komp-amal-jariyah", nama: "Potongan Amal Jariyah", tipe: "potongan", jumlah: amal, taxable: true });
  return result;
}

/** `taxableTunjangan` is the subset of allowances that count toward the PPh21
 * taxable-income base — kept separate from `tunjangan` (the full BPJS-wage-base
 * sum) because BPJS's wage base and PPh21's taxable-income base are legally
 * distinct; a component marked non-taxable for income tax still counts for BPJS. */
export async function sumEmployeeComponentsByTypeCore(employeeId: string, basicSalary = 0): Promise<{ tunjangan: number; potongan: number; taxableTunjangan: number }> {
  const components = await getEmployeeSalaryComponentsCore(employeeId, basicSalary);
  const tunjanganRows = components.filter(c => c.tipe === "tunjangan");
  return {
    tunjangan: tunjanganRows.reduce((s, c) => s + c.jumlah, 0),
    potongan: components.filter(c => c.tipe === "potongan").reduce((s, c) => s + c.jumlah, 0),
    taxableTunjangan: tunjanganRows.filter(c => c.taxable).reduce((s, c) => s + c.jumlah, 0),
  };
}
