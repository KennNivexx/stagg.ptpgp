import { supabaseAdmin } from "@/lib/supabase";
import { DollarSign, Download, Gift, TrendingUp, FileText, Users } from "lucide-react";

export default async function HRDRewards() {
  const { data: payrolls, error } = await supabaseAdmin
    .from("payroll")
    .select("*, employees!inner(full_name, department)")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(20);

  const { count: totalEmployees } = await supabaseAdmin
    .from("employees")
    .select("*", { count: "exact", head: true });

  const totalNetSalary = (payrolls || []).reduce(
    (sum: number, p: Record<string, unknown>) => sum + (Number(p.net_salary) || 0), 0
  );

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Rewards & Recognition</h1>
        <p className="text-sm text-gray-500">Kompensasi, benefit, payroll, dan penghargaan karyawan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEmployees || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Slip Gaji</p>
              <p className="text-xl font-extrabold text-slate-800">{payrolls?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Gift size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Tunjangan</p>
              <p className="text-xl font-extrabold text-slate-800">
                Rp {(payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.allowances) || 0), 0).toLocaleString("id-ID").split(",")[0]}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Gaji Bersih</p>
              <p className="text-xl font-extrabold text-slate-800">
                Rp {totalNetSalary.toLocaleString("id-ID").split(",")[0]}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4">Ringkasan Kompensasi</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Rata-rata Gaji Pokok</span>
              <span className="text-xs font-bold text-slate-800">
                Rp {((payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.basic_salary) || 0), 0) / Math.max(payrolls?.length || 1, 1)).toLocaleString("id-ID").split(",")[0]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Tunjangan</span>
              <span className="text-xs font-bold text-emerald-600">
                Rp {(payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.allowances) || 0), 0).toLocaleString("id-ID").split(",")[0]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Potongan</span>
              <span className="text-xs font-bold text-red-600">
                Rp {(payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.deductions) || 0), 0).toLocaleString("id-ID").split(",")[0]}
              </span>
            </div>
            <hr className="border-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Total Bersih</span>
              <span className="text-xs font-bold text-blue-600">
                Rp {totalNetSalary.toLocaleString("id-ID").split(",")[0]}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Payroll</h3>
            <p className="text-xs text-slate-400 mt-0.5">Slip gaji terbaru</p>
          </div>

          {error ? (
            <div className="p-12 text-center text-red-600 text-sm">{error.message}</div>
          ) : !payrolls || payrolls.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data payroll.</p>
              <p className="text-xs text-slate-400 mt-1">Data payroll akan muncul setelah slip gaji dibuat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gaji Pokok</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tunjangan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Potongan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bersih</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(payrolls as Record<string, unknown>[]).map((p) => {
                    const emp = p.employees as Record<string, string> | undefined;
                    return (
                      <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                          <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                          {monthNames[Number(p.month) || 0] || "-"} {String(p.year || "")}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700 font-medium">
                          Rp {(Number(p.basic_salary) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs text-emerald-600 font-medium">
                          Rp {(Number(p.allowances) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs text-red-600 font-medium">
                          Rp {(Number(p.deductions) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-800">
                          Rp {(Number(p.net_salary) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="p-2 rounded-lg text-slate-300 cursor-not-allowed inline-flex" title="Segera tersedia">
                            <Download size={14} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">Menampilkan <span className="font-bold text-slate-800">{payrolls?.length || 0}</span> slip gaji terbaru</p>
          </div>
        </div>
      </div>
    </div>
  );
}
