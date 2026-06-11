import { supabaseAdmin } from "@/lib/supabase";
import { Users, Award, Star, Search } from "lucide-react";

export default async function HRDCompetency() {
  const { data: employees, error } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position, status")
    .order("full_name", { ascending: true });

  const totalEmployees = employees?.length || 0;
  const deptSet = new Set((employees || []).map((e: Record<string, string>) => e.department));
  const positionSet = new Set((employees || []).map((e: Record<string, string>) => e.position));

  const competencyLevels = [
    { level: "Junior", pct: 40, color: "bg-blue-500", text: "text-blue-600" },
    { level: "Mid-Level", pct: 35, color: "bg-emerald-500", text: "text-emerald-600" },
    { level: "Senior", pct: 18, color: "bg-amber-500", text: "text-amber-600" },
    { level: "Expert", pct: 7, color: "bg-red-500", text: "text-red-600" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Competency Management</h1>
        <p className="text-sm text-gray-500">Pengelolaan kompetensi dan standar keahlian karyawan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Award size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Posisi Terdaftar</p>
              <p className="text-xl font-extrabold text-slate-800">{positionSet.size}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Star size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Standar Kompetensi</p>
              <p className="text-xl font-extrabold text-slate-800">{deptSet.size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4">Distribusi Level</h3>
          <div className="space-y-4">
            {competencyLevels.map((cl) => (
              <div key={cl.level}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${cl.text}`}>{cl.level}</span>
                  <span className="text-[10px] text-slate-400">{cl.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${cl.color}`}
                    style={{ width: `${cl.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Kompetensi Karyawan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pemetaan keahlian dan departemen</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-slate-400" />
              <span className="text-[10px] text-slate-500">{totalEmployees} orang</span>
            </div>
          </div>

          {error ? (
            <div className="p-12 text-center text-red-600 text-sm">{error.message}</div>
          ) : !employees || employees.length === 0 ? (
            <div className="p-12 text-center">
              <Award size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data karyawan.</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan karyawan untuk memulai pemetaan kompetensi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Posisi</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(employees as Record<string, string>[]).map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {emp.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <p className="font-bold text-slate-800 text-xs">{emp.full_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-semibold">
                          {emp.department || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-medium">{emp.position || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          emp.status === "Tetap" ? "bg-emerald-50 text-emerald-700" :
                          emp.status === "Kontrak" ? "bg-amber-50 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {emp.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">Total: <span className="font-bold text-slate-800">{totalEmployees}</span> karyawan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
