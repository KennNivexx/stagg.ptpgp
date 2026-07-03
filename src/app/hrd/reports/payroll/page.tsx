import { supabaseAdmin } from "@/lib/supabase";
import { FileText, DollarSign, TrendingUp, Users, Building2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default async function LaporanPayroll() {
  const { data: payrolls } = await supabaseAdmin
    .from("payroll")
    .select("*, employees!inner(full_name, department)")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(50);

  const { count: totalPayrollRecords } = await supabaseAdmin
    .from("payroll")
    .select("*", { count: "exact", head: true });

  const totalCost = (payrolls || []).reduce((sum: number, p: Record<string, unknown>) => sum + (Number(p.net_salary) || 0), 0);
  const avgSalary = (payrolls || []).length > 0 ? Math.round(totalCost / (payrolls || []).length) : 0;

  const deptCosts: Record<string, number> = {};
  const deptCounts: Record<string, number> = {};
  (payrolls || []).forEach((p: Record<string, unknown>) => {
    const emp = p.employees as Record<string, string> | undefined;
    const dept = emp?.department || "Tidak Diketahui";
    deptCosts[dept] = (deptCosts[dept] || 0) + (Number(p.net_salary) || 0);
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Payroll</h1>
        <p className="text-sm text-gray-500">Ringkasan penggajian bulanan, total biaya, dan analisis per departemen.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Slip</p>
              <p className="text-xl font-extrabold text-slate-800">{totalPayrollRecords || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Biaya Payroll</p>
              <p className="text-xl font-extrabold text-slate-800">
                Rp {(totalCost / 1_000_000).toFixed(0)} Jt
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Gaji</p>
              <p className="text-xl font-extrabold text-slate-800">
                Rp {(avgSalary / 1_000_000).toFixed(1)} Jt
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Building2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Departemen</p>
              <p className="text-xl font-extrabold text-slate-800">{Object.keys(deptCosts).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Payroll</h3>
              <p className="text-xs text-slate-400 mt-0.5">Data penggajian terbaru</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="month" className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none" />
            </div>
          </div>

          {!payrolls || payrolls.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="Belum ada data payroll."
              description="Generate slip gaji untuk melihat laporan payroll."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Karyawan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Periode</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Gaji Pokok</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tunjangan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Potongan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(payrolls || []).map((p: Record<string, unknown>) => {
                    const emp = p.employees as Record<string, string> | undefined;
                    return (
                      <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-800">{emp?.full_name || "-"}</p>
                          <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                          {monthNames[Number(p.month) || 0] || "-"} {String(p.year || "")}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700">
                          Rp {(Number(p.basic_salary) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs text-emerald-600">
                          Rp {(Number(p.allowances) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs text-red-600">
                          Rp {(Number(p.deductions) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-800">
                          Rp {(Number(p.net_salary) || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Breakdown per Departemen</h3>
              <p className="text-xs text-slate-400 mt-0.5">Total biaya payroll tiap departemen</p>
            </div>
            <div className="p-6">
              {Object.keys(deptCosts).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(deptCosts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([dept, cost]) => (
                    <div key={dept}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-600">{dept}</span>
                        <span className="text-[10px] font-bold text-slate-800">
                          Rp {(cost / 1_000_000).toFixed(0)} Jt
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#CC0000] rounded-full"
                          style={{ width: `${((cost / (totalCost || 1)) * 100).toFixed(0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada data.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik payroll</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Biaya</span>
                <span className="text-sm font-extrabold text-slate-800">
                  Rp {totalCost.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Rata-rata Gaji</span>
                <span className="text-sm font-extrabold text-emerald-600">
                  Rp {avgSalary.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Slip</span>
                <span className="text-sm font-extrabold text-blue-600">{totalPayrollRecords || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
