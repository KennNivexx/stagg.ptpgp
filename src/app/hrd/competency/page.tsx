import { supabaseAdmin } from "@/lib/supabase";
import { Users, Award, Star, Search, Target, AlertTriangle, ShieldAlert } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";
import RankedBar from "@/components/charts/RankedBar";

export default async function HRDCompetency() {
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [skillsRes, posSkillsRes, empSkillsRes, employeesRes, expiringLicensesRes] = await Promise.all([
    supabaseAdmin.from("master_kompetensi").select("id, name, category").order("category"),
    supabaseAdmin.from("kompetensi_jabatan").select("position_code, skill_id, required_level"),
    supabaseAdmin.from("kompetensi_karyawan").select("employee_id, skill_id, current_level"),
    supabaseAdmin.from("karyawan").select("id, full_name, department, position, status").order("full_name", { ascending: true }),
    // Sertifikasi mendekati kedaluwarsa (30 hari ke depan) — tabel sudah ada
    // dari Infrastruktur/Employee 360°, bukan tabel baru.
    supabaseAdmin.from("sim_sertifikasi_karyawan").select("id, expiry_date").gte("expiry_date", today).lte("expiry_date", in30Days),
  ]);

  const skills = skillsRes.data || [];
  const posSkills = posSkillsRes.data || [];
  const empSkills = empSkillsRes.data || [];
  const employees = employeesRes.data || [];
  const expiringLicenses = expiringLicensesRes.data || [];

  // Kompetensi Kritis: skill dengan jumlah karyawan ber-gap-negatif
  // terbanyak (perkiraan cepat via position_code == karyawan.position,
  // sama seperti perhitungan lama di gap/page.tsx — Gap Analysis penuh di
  // halamannya sendiri sudah pakai rantai Employee Assignment yang benar).
  const posReqMap: Record<string, Record<string, number>> = {};
  for (const ps of posSkills as { position_code: string; skill_id: string; required_level: number }[]) {
    if (!posReqMap[ps.position_code]) posReqMap[ps.position_code] = {};
    posReqMap[ps.position_code][ps.skill_id] = ps.required_level;
  }
  const empCurrentMap: Record<string, Record<string, number>> = {};
  for (const es of empSkills as { employee_id: string; skill_id: string; current_level: number }[]) {
    if (!empCurrentMap[es.employee_id]) empCurrentMap[es.employee_id] = {};
    empCurrentMap[es.employee_id][es.skill_id] = es.current_level;
  }
  const criticalCount: Record<string, number> = {};
  for (const emp of employees as { id: string; position: string }[]) {
    const req = posReqMap[emp.position];
    if (!req) continue;
    for (const [skillId, reqLevel] of Object.entries(req)) {
      const current = empCurrentMap[emp.id]?.[skillId] ?? 0;
      if (current - reqLevel < 0) criticalCount[skillId] = (criticalCount[skillId] || 0) + 1;
    }
  }
  const skillNameById = new Map((skills as { id: string; name: string }[]).map(s => [s.id, s.name]));
  const topCritical = Object.entries(criticalCount).sort((a, b) => b[1] - a[1])[0];
  const criticalSkillName = topCritical ? skillNameById.get(topCritical[0]) || "—" : null;
  const criticalSkillCount = topCritical ? topCritical[1] : 0;

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

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Competency Management</h1>
        <p className="text-sm text-gray-500">Pengelolaan kompetensi dan standar keahlian karyawan</p>
      </div>

      <SectionQuickLinks groupLabel="Competency Management" excludeHref="/hrd/competency" />

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kompetensi Kritis</p>
              <p className="text-sm font-extrabold text-slate-800 truncate max-w-[140px]" title={criticalSkillName || undefined}>{criticalSkillName || "—"}</p>
              {topCritical && <p className="text-[9px] text-red-500 font-semibold">{criticalSkillCount} karyawan bergap</p>}
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><ShieldAlert size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sertifikasi Kedaluwarsa</p>
              <p className="text-xl font-extrabold text-slate-800">{expiringLicenses.length}</p>
              <p className="text-[9px] text-orange-500 font-semibold">dalam 30 hari</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4">Kategori Kompetensi</h3>
          <RankedBar
            data={categoryDistribution.map((cat) => ({ label: cat.category, value: cat.count }))}
            height={categoryDistribution.length * 44}
            barLabel="Kompetensi"
          />
        </div>

        {totalAssessed > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Distribusi Level</h3>
            <RankedBar
              data={levelDistribution.map((lv) => {
                const levelNames: Record<number, string> = {
                  0: "Tidak Kompeten", 1: "Basic", 2: "Intermediate", 3: "Advanced", 4: "Expert", 5: "Master",
                };
                return { label: levelNames[lv.level] || `Level ${lv.level}`, value: lv.count };
              })}
              height={levelDistribution.length * 44}
              valueSuffix=" orang"
              barLabel="Karyawan"
            />
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
              <EmptyState
                icon={Award}
                title="Belum ada data karyawan."
                description="Tambahkan karyawan untuk memulai pemetaan kompetensi."
              />
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
