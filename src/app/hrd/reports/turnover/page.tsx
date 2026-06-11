import { supabaseAdmin } from "@/lib/supabase";
import { FileText, UserX, TrendingUp, AlertTriangle, Users } from "lucide-react";

export default async function LaporanTurnover() {
  const { count: totalEmployees } = await supabaseAdmin
    .from("employees")
    .select("*", { count: "exact", head: true });

  const { count: resignedCount } = await supabaseAdmin
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "Resigned");

  const { data: activeEmployees } = await supabaseAdmin
    .from("employees")
    .select("*")
    .neq("status", "Resigned");

  const { data: resignedEmployees } = await supabaseAdmin
    .from("employees")
    .select("*")
    .eq("status", "Resigned")
    .order("full_name");

  const turnoverRate = totalEmployees && totalEmployees > 0
    ? ((resignedCount || 0) / totalEmployees * 100).toFixed(1)
    : "0.0";

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Turnover</h1>
        <p className="text-sm text-gray-500">Analisis tingkat turnover karyawan, alasan resign, dan tren retensi.</p>
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
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><UserX size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Resign</p>
              <p className="text-xl font-extrabold text-slate-800">{resignedCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tingkat Turnover</p>
              <p className="text-xl font-extrabold text-slate-800">{turnoverRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{activeEmployees?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Karyawan Resign</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat pengunduran diri</p>
          </div>

          {!resignedEmployees || resignedEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <UserX size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada karyawan yang resign.</p>
              <p className="text-xs text-slate-400 mt-1">Data akan muncul saat ada karyawan dengan status resign.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departemen</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Bergabung</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {resignedEmployees.map((emp: Record<string, unknown>) => (
                    <tr key={emp.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <p className="text-xs font-bold text-slate-800">{emp.full_name as string}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{emp.position as string || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                          {emp.department as string || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {emp.join_date ? new Date(emp.join_date as string).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold">Resign</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Indikator Turnover</h3>
              <p className="text-xs text-slate-400 mt-0.5">Metrik kunci</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">Turnover Rate</span>
                  <span className={`text-lg font-extrabold ${Number(turnoverRate) > 10 ? "text-red-600" : Number(turnoverRate) > 5 ? "text-amber-600" : "text-emerald-600"}`}>
                    {turnoverRate}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${Number(turnoverRate) > 10 ? "bg-red-500" : Number(turnoverRate) > 5 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, Number(turnoverRate) * 5)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {Number(turnoverRate) > 10 ? "Tingkat turnover tinggi - perlu perhatian!" :
                   Number(turnoverRate) > 5 ? "Tingkat turnover moderat" :
                   "Tingkat turnover sehat"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Karyawan</span>
                <span className="text-sm font-extrabold text-slate-800">{totalEmployees || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Resign</span>
                <span className="text-sm font-extrabold text-red-600">{resignedCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Aktif</span>
                <span className="text-sm font-extrabold text-emerald-600">{activeEmployees?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Retensi Karyawan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Persentase retensi</p>
            </div>
            <div className="p-8 text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                  <circle
                    cx="50" cy="50" r="40"
                    stroke={Number(turnoverRate) > 10 ? "#ef4444" : Number(turnoverRate) > 5 ? "#f59e0b" : "#10b981"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(100 - Number(turnoverRate)) * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-extrabold text-slate-800">{100 - Number(turnoverRate)}%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">Tingkat Retensi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
