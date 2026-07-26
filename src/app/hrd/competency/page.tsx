import { supabaseAdmin } from "@/lib/supabase";
import { Users, Award, Star, Target, AlertTriangle, ShieldAlert, Search, Plus } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";
import RankedBar from "@/components/charts/RankedBar";
import { HrdPageHeader, HrdStatsCard, HrdCard, HrdActionButton } from "@/components/hrd/HrdUi";

export const dynamic = "force-dynamic";

export default async function HRDCompetency() {
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [skillsRes, posSkillsRes, empSkillsRes, employeesRes, expiringLicensesRes] = await Promise.all([
    supabaseAdmin.from("master_kompetensi").select("id, name, category").order("category"),
    supabaseAdmin.from("kompetensi_jabatan").select("position_code, skill_id, required_level"),
    supabaseAdmin.from("kompetensi_karyawan").select("employee_id, skill_id, current_level"),
    supabaseAdmin.from("karyawan").select("id, full_name, department, position, status, kode_jabatan").order("full_name", { ascending: true }),
    supabaseAdmin.from("sim_sertifikasi_karyawan").select("id, expiry_date").gte("expiry_date", today).lte("expiry_date", in30Days),
  ]);

  const skills = skillsRes.data || [];
  const posSkills = posSkillsRes.data || [];
  const empSkills = empSkillsRes.data || [];
  const employees = employeesRes.data || [];
  const expiringLicenses = expiringLicensesRes.data || [];

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
    ? [0, 1, 2, 3, 4, 5].map((lvl) => ({ level: lvl, count: levelCount[lvl] || 0, pct: Math.round(((levelCount[lvl] || 0) / totalAssessed) * 100), }))
    : [];

  const categoryDistribution = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, cnt]) => ({ category: cat, count: cnt, pct: Math.round((cnt / (totalSkills || 1)) * 100) }));

  return (
    <div className="space-y-8">
      <HrdPageHeader
        title="Competency Management"
        subtitle="Pengelolaan kompetensi dan standar keahlian karyawan"
      >
        <HrdActionButton href="/hrd/competency/library/new" icon={<Plus size={14} />} variant="primary">Tambah Kompetensi</HrdActionButton>
      </HrdPageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <HrdStatsCard label="Total Karyawan" value={totalEmployees} icon={<Users size={18} />} color="blue" />
        <HrdStatsCard label="Total Kompetensi" value={totalSkills} icon={<Award size={18} />} color="emerald" />
        <HrdStatsCard label="Posisi dengan Standar" value={positionSet.size} icon={<Star size={18} />} color="amber" />
        <HrdStatsCard label="Karyawan Dinilai" value={assessedEmployees.size} icon={<Target size={18} />} color="purple" />
        <HrdStatsCard label="Kompetensi Kritis" value={criticalSkillCount} icon={<AlertTriangle size={18} />} color="red" />
        <HrdStatsCard label="Sertifikasi Kedaluwarsa" value={expiringLicenses.length} icon={<ShieldAlert size={18} />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <HrdCard title="Kategori Kompetensi" subtitle="Distribusi kompetensi berdasarkan kategori" icon={<Award size={16} />} iconColor="emerald">
          <RankedBar data={categoryDistribution.map((cat) => ({ label: cat.category, value: cat.count }))} height={categoryDistribution.length * 44} barLabel="Kompetensi" />
        </HrdCard>

        {totalAssessed > 0 && (
          <HrdCard title="Distribusi Level" subtitle="Level karyawan yang sudah dinilai" icon={<Target size={16} />} iconColor="purple">
            <RankedBar
              data={levelDistribution.map((lv) => {
                const levelNames: Record<number, string> = { 0: "Tidak Kompeten", 1: "Basic", 2: "Intermediate", 3: "Advanced", 4: "Expert", 5: "Master" };
                return { label: levelNames[lv.level] || `Level ${lv.level}`, value: lv.count };
              })}
              height={levelDistribution.length * 44}
              valueSuffix=" orang"
              barLabel="Karyawan"
            />
          </HrdCard>
        )}

        <div className={totalAssessed > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <HrdCard title="Daftar Karyawan" subtitle="Pemetaan keahlian dan departemen" icon={<Users size={16} />} iconColor="blue">
            {employeesRes.error ? (
              <div className="p-12 text-center text-red-600 text-sm">{employeesRes.error.message}</div>
            ) : employees.length === 0 ? (
              <EmptyState icon={Award} title="Belum ada data karyawan." description="Tambahkan karyawan untuk memulai pemetaan kompetensi." />
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Posisi</th>
                      <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(employees as Record<string, string>[]).map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {emp.full_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{emp.full_name}</p>
                              {emp.kode_jabatan && <p className="text-[10px] text-slate-500 font-mono">{emp.kode_jabatan}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-semibold">{emp.department || "-"}</span>
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-700 font-medium">{emp.position || "-"}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${emp.status === "Tetap" ? "bg-emerald-50 text-emerald-700" : emp.status === "Kontrak" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{emp.status || "-"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </HrdCard>
        </div>
      </div>

      <HrdCard title="Menu Lengkap Competency Management" subtitle="Akses cepat ke semua fitur modul ini" icon={<Search size={16} />} iconColor="slate">
        <SectionQuickLinks groupLabel="Competency Management" excludeHref="/hrd/competency" />
      </HrdCard>
    </div>
  );
}
