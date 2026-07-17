import { supabaseAdmin } from "@/lib/supabase";
import { Users, UserPlus, UserX, Building2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ExportExcelButton from "@/components/ExportExcelButton";
import RankedBar from "@/components/charts/RankedBar";
import TrendArea from "@/components/charts/TrendArea";

export const dynamic = "force-dynamic";

export default async function LaporanKaryawan() {
  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("*")
    .order("full_name");

  const { count: totalEmployees } = await supabaseAdmin
    .from("karyawan")
    .select("*", { count: "exact", head: true });

  const { count: tetapCount } = await supabaseAdmin
    .from("karyawan")
    .select("*", { count: "exact", head: true })
    .eq("status", "Tetap");

  const { count: kontrakCount } = await supabaseAdmin
    .from("karyawan")
    .select("*", { count: "exact", head: true })
    .eq("status", "Kontrak");

  const { count: resignedCount } = await supabaseAdmin
    .from("karyawan")
    .select("*", { count: "exact", head: true })
    .eq("status", "Resigned");

  const deptCounts: Record<string, number> = {};
  (employees || []).forEach((e: Record<string, unknown>) => {
    const dept = (e.department as string) || "Tidak Ada";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const statusCounts: Record<string, number> = {};
  (employees || []).forEach((e: Record<string, unknown>) => {
    const s = (e.status as string) || "Lainnya";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const monthlyJoin = (employees || []).reduce((acc: Record<string, number>, e: Record<string, unknown>) => {
    if (e.join_date) {
      const d = new Date(e.join_date as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const months = Object.keys(monthlyJoin).sort();

  const rows = (employees || []).map((e: Record<string, unknown>) => ({
    Nama: e.full_name as string,
    Departemen: (e.department as string) || "-",
    Jabatan: (e.position as string) || "-",
    Status: (e.status as string) || "-",
    "Tanggal Bergabung": e.join_date ? new Date(e.join_date as string).toLocaleDateString("id-ID") : "-",
    Email: (e.email as string) || "-",
  }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Karyawan</h1>
          <p className="text-sm text-gray-500">Demografi karyawan, tren headcount, dan statistik tenaga kerja.</p>
        </div>
        <ExportExcelButton filename="Laporan_Karyawan" sheetName="Karyawan" rows={rows} />
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
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><UserPlus size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tetap</p>
              <p className="text-xl font-extrabold text-slate-800">{tetapCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Building2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kontrak</p>
              <p className="text-xl font-extrabold text-slate-800">{kontrakCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><UserX size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Resign</p>
              <p className="text-xl font-extrabold text-slate-800">{resignedCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Distribusi per Departemen</h3>
              <p className="text-xs text-slate-400 mt-0.5">Jumlah karyawan tiap departemen</p>
            </div>
          </div>
          {Object.keys(deptCounts).length === 0 ? (
            <EmptyState icon={Building2} title="Belum ada data departemen." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departemen</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Jumlah</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.entries(deptCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([dept, count]) => (
                    <tr key={dept} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">{dept}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">{count}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className="h-full bg-pgp-red rounded-full"
                              style={{ width: `${((count / (totalEmployees || 1)) * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {((count / (totalEmployees || 1)) * 100).toFixed(0)}%
                          </span>
                        </div>
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
              <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Perbandingan status karyawan</p>
            </div>
            <div className="p-6">
              <RankedBar
                data={Object.entries(statusCounts).map(([status, count]) => ({
                  label: status,
                  value: count,
                  color: status === "Tetap" ? "var(--chart-status-good)"
                    : status === "Kontrak" ? "var(--chart-status-warning)"
                    : status === "Resigned" ? "var(--chart-status-critical)"
                    : "var(--chart-5)",
                }))}
                height={Object.keys(statusCounts).length * 44}
                barLabel="Karyawan"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Tren Headcount</h3>
              <p className="text-xs text-slate-400 mt-0.5">Karyawan baru per bulan</p>
            </div>
            <div className="p-6">
              {months.length > 0 ? (
                <TrendArea
                  data={months.slice(-6).map((m) => ({ month: m, value: monthlyJoin[m] || 0 }))}
                  xKey="month"
                  series={[{ key: "value", label: "Karyawan Baru" }]}
                  height={200}
                />
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada data.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
