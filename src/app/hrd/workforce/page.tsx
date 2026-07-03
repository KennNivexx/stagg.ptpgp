import { supabaseAdmin } from "@/lib/supabase";
import { Users, Briefcase, TrendingUp, BarChart3, PieChart } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default async function HRDWorkforce() {
  const [{ data: employees }] = await Promise.all([
    supabaseAdmin.from("employees").select("department, position"),
  ]);

  const deptCounts: Record<string, number> = {};
  let totalEmployees = 0;
  if (employees) {
    for (const emp of employees as Record<string, string>[]) {
      const dept = emp.department || "Unknown";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      totalEmployees++;
    }
  }

  const sortedDepts = Object.entries(deptCounts).sort(([, a], [, b]) => b - a);
  const maxCount = sortedDepts.length > 0 ? sortedDepts[0][1] : 1;

  const deptColors = [
    "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-500",
    "bg-purple-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Workforce Planning</h1>
        <p className="text-sm text-gray-500">Analisis kebutuhan tenaga kerja dan perencanaan SDM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Tenaga Kerja</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Briefcase size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Departemen</p>
              <p className="text-xl font-extrabold text-slate-800">{sortedDepts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rasio per Dept</p>
              <p className="text-xl font-extrabold text-slate-800">
                {totalEmployees > 0 && sortedDepts.length > 0
                  ? (totalEmployees / sortedDepts.length).toFixed(1)
                  : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Distribusi per Departemen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Komposisi tenaga kerja berdasarkan unit organisasi</p>
              </div>
            </div>
          </div>

          {sortedDepts.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada data karyawan." description="Data akan muncul setelah karyawan ditambahkan." />
          ) : (
            <div className="p-6 space-y-5">
              {sortedDepts.map(([dept, count], idx) => {
                const pct = ((count / totalEmployees) * 100).toFixed(0);
                return (
                  <div key={dept}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700">{dept}</span>
                      <span className="text-xs font-semibold text-slate-500">{count} orang ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${deptColors[idx % deptColors.length]}`}
                        style={{ width: `${Math.max((count / maxCount) * 100, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Headcount Planning</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kebutuhan perencanaan tenaga kerja</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {sortedDepts.map(([dept, count], idx) => (
              <div key={dept} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${deptColors[idx % deptColors.length]}`} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{dept}</p>
                    <p className="text-[10px] text-slate-400">{count} personel aktif</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                  {count} HC
                </span>
              </div>
            ))}

            {sortedDepts.length === 0 && (
              <EmptyState icon={TrendingUp} title="Belum ada data untuk dianalisis." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
