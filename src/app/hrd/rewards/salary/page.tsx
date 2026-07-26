import { supabaseAdmin } from "@/lib/supabase";
import { DollarSign, Users, Briefcase } from "lucide-react";
import SalaryForm from "./SalaryForm";
import { getJenisKomponenGaji } from "@/app/actions/payroll-components";

export default async function SalaryPage() {
  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, department, position, kode_jabatan, nik")
    .neq("status", "Inactive")
    .order("department")
    .order("full_name")
    .limit(100);

  const jenisKomponen = await getJenisKomponenGaji();

  // salary_structures.employee_id has no FK constraint registered in the
  // schema cache, so PostgREST's `employees(...)` embed shorthand fails
  // outright (PGRST200) — join manually in JS instead.
  let salaryRecords: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("struktur_gaji")
    .select("id, employee_id, basic_salary, ptkp_status")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    const rawRecords = data || [];
    const employeeIds = rawRecords.map((r) => r.employee_id as string).filter(Boolean);
    const [{ data: relatedEmployees }, { data: komponenRows }] = await Promise.all([
      employeeIds.length > 0
        ? supabaseAdmin.from("karyawan").select("id, full_name, department, position").in("id", employeeIds)
        : Promise.resolve({ data: [] }),
      employeeIds.length > 0
        ? supabaseAdmin.from("struktur_gaji_komponen").select("employee_id, jumlah, jenis_komponen_gaji!inner(tipe)").in("employee_id", employeeIds)
        : Promise.resolve({ data: [] }),
    ]);
    const employeeMap = new Map((relatedEmployees || []).map((e: Record<string, unknown>) => [e.id as string, e]));
    // Sum dynamic components per employee by tipe — used for the "Tunjangan"
    // and "Total Kotor" columns below. Empty map (table not migrated yet) is
    // fine — every employee just shows Rp 0 tunjangan until it's run.
    const compTotals = new Map<string, { tunjangan: number; potongan: number }>();
    for (const row of (komponenRows || []) as unknown as { employee_id: string; jumlah: number; jenis_komponen_gaji: { tipe: string } }[]) {
      const cur = compTotals.get(row.employee_id) || { tunjangan: 0, potongan: 0 };
      if (row.jenis_komponen_gaji.tipe === "tunjangan") cur.tunjangan += Number(row.jumlah) || 0;
      else cur.potongan += Number(row.jumlah) || 0;
      compTotals.set(row.employee_id, cur);
    }
    salaryRecords = rawRecords.map((r) => ({
      ...r,
      employees: employeeMap.get(r.employee_id as string) || null,
      tunjangan_total: compTotals.get(r.employee_id as string)?.tunjangan || 0,
      potongan_total: compTotals.get(r.employee_id as string)?.potongan || 0,
    }));
  }

  const totalPayroll = salaryRecords.reduce((s, r) => {
    const base = Number(r.basic_salary) || 0;
    const allow = Number(r.tunjangan_total) || 0;
    return s + base + allow;
  }, 0);

  function fmt(n: number) { return n.toLocaleString("id-ID"); }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Struktur Gaji</h1>
        <p className="text-sm text-gray-500">Kelola komponen dan struktur penggajian karyawan. Ini langkah pertama sebelum bisa Generate Payroll — tanpa data di sini, slip gaji karyawan tidak bisa dibuat.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Karyawan Terdaftar", value: salaryRecords.length, color: "bg-blue-50 text-blue-600" },
          { icon: DollarSign, label: "Total Payroll", value: `Rp ${fmt(totalPayroll)}`, color: "bg-emerald-50 text-emerald-600" },
          { icon: Briefcase, label: "Total Karyawan", value: (employees || []).length, color: "bg-purple-50 text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SalaryForm
        employees={(employees || []) as Array<{ id: string; full_name: string; department: string; position: string; kode_jabatan?: string | null; nik?: string | null }>}
        salaryRecords={salaryRecords}
        jenisKomponen={jenisKomponen}
      />
    </div>
  );
}
