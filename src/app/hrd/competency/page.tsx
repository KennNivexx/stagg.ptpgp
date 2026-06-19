import { supabaseAdmin } from "@/lib/supabase";
import { Users, Award, Star, Search, Target } from "lucide-react";

export default async function HRDCompetency() {
  const [skillsRes, posSkillsRes, empSkillsRes, employeesRes] = await Promise.all([
    supabaseAdmin.from("skills").select("id, name, category").order("category"),
    supabaseAdmin.from("position_skills").select("position_code, skill_id"),
    supabaseAdmin.from("employee_skills").select("employee_id, current_level"),
    supabaseAdmin.from("employees").select("id, full_name, department, position, status").order("full_name", { ascending: true }),
  ]);

  const skills = skillsRes.data || [];
  const posSkills = posSkillsRes.data || [];
  const empSkills = empSkillsRes.data || [];
  const employees = employeesRes.data || [];

  const totalSkills = skills.length;
  const totalEmployees = employees.length;

  const positionSet = new Set(posSkills.map((ps: Record<string, string>) => ps.position_code));
  const assessedEmployees = new Set(empSkills.map((es: Record<string, string>) => es.employee_id));

  const categoryCount: Record<string, number> = {};
  for (const sk of skills as Record<string, string>[]) {
    const cat = sk.category || "Uncategorized";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  const levelCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const es of empSkills as Record<string, number>[]) {
    const lvl = es.current_level;
    if (lvl >= 0 && lvl <= 5) levelCount[lvl] = (levelCount[lvl] || 0) + 1;
  }
  const totalAssessed = empSkills.length;
  const levelDistribution = totalAssessed > 0
    ? [0, 1, 2, 3, 4, 5].map((lvl) => ({
        level: lvl,
        count: levelCount[lvl] || 0,
        pct: Math.round(((levelCount[lvl] || 0) / totalAssessed) * 100),
      }))
    : [];

  const categoryDistribution = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, cnt]) => ({ category: cat, count: cnt, pct: Math.round((cnt / (totalSkills || 1)) * 100) }));

  const catColors: Record<string, string> = {
    "Manajemen": "bg-blue-500",
    "Soft Skills": "bg-emerald-500",
    "Teknis": "bg-amber-500",
    "HR": "bg-red-500",
    "K3": "bg-orange-500",
    "Operasional": "bg-purple-500",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Competency Management</h1>
        <p className="text-sm text-gray-500">Pengelolaan kompetensi dan standar keahlian karyawan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Kompetensi</p>
              <p className="text-xl font-extrabold text-slate-800">{totalSkills}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Star size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Posisi dgn Standar</p>
              <p className="text-xl font-extrabold text-slate-800">{positionSet.size}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Dinilai</p>
              <p className="text-xl font-extrabold text-slate-800">{assessedEmployees.size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4">Kategori Kompetensi</h3>
          <div className="space-y-4">
            {categoryDistribution.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">{cat.category}</span>
                  <span className="text-[10px] text-slate-400">{cat.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${catColors[cat.category] || "bg-slate-500"}`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalAssessed > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Distribusi Level</h3>
            <div className="space-y-4">
              {levelDistribution.map((lv) => {
                const levelLabels: Record<number, { label: string; color: string; text: string }> = {
                  0: { label: "Tidak Kompeten", color: "bg-slate-400", text: "text-slate-600" },
                  1: { label: "Basic", color: "bg-sky-500", text: "text-sky-600" },
                  2: { label: "Intermediate", color: "bg-emerald-500", text: "text-emerald-600" },
                  3: { label: "Advanced", color: "bg-amber-500", text: "text-amber-600" },
                  4: { label: "Expert", color: "bg-orange-500", text: "text-orange-600" },
                  5: { label: "Master", color: "bg-red-500", text: "text-red-600" },
                };
                const lbl = levelLabels[lv.level] || { label: `Level ${lv.level}`, color: "bg-slate-400", text: "text-slate-600" };
                return (
                  <div key={lv.level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${lbl.text}`}>{lbl.label}</span>
                      <span className="text-[10px] text-slate-400">{lv.count} ({lv.pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${lbl.color}`}
                        style={{ width: `${lv.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={totalAssessed > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daftar Karyawan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pemetaan keahlian dan departemen</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
                <Search size={13} className="text-slate-400" />
                <span className="text-[10px] text-slate-500">{totalEmployees} orang</span>
              </div>
            </div>

            {employeesRes.error ? (
              <div className="p-12 text-center text-red-600 text-sm">{employeesRes.error.message}</div>
            ) : employees.length === 0 ? (
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
              <p className="text-xs text-slate-500">Total: <span className="font-bold text-slate-800">{totalEmployees}</span> karyawan &bull; <span className="font-bold text-slate-800">{totalSkills}</span> kompetensi &bull; <span className="font-bold text-slate-800">{positionSet.size}</span> posisi dengan standar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
