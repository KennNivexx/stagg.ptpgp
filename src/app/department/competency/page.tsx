"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Award, Save, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { getDeptEmployees, getSkills, getEmployeeSkills, getPositionSkills, assessEmployee } from "@/app/actions/skills";
import PanduanLevel from "@/components/PanduanLevel";
import { getMyDept } from "@/app/actions/department";

interface Employee {
  id: string;
  full_name: string;
  department: string;
  position: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_id: string;
  current_level: number;
}

interface PositionSkill {
  id: string;
  position: string;
  skill_id: string;
  required_level: number;
}

export default function DeptCompetencyPage() {
  const [deptName, setDeptName] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [positionSkills, setPositionSkills] = useState<PositionSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async (department: string) => {
    setLoading(true);
    try {
      const [emps, sk, posSkillsData] = await Promise.all([
        getDeptEmployees(department),
        getSkills(),
        getPositionSkills(),
      ]);

      const skillsData = sk as Skill[];
      const empsData = emps as Employee[];

      setEmployees(empsData);
      setSkills(skillsData);
      setPositionSkills((posSkillsData as PositionSkill[]) || []);

      if (empsData.length > 0) {
        const ids = empsData.map((e) => e.id);
        const es = await getEmployeeSkills(ids);

        const initLevels: Record<string, number> = {};
        for (const e of empsData) {
          for (const s of skillsData) {
            const existing = (es as EmployeeSkill[]).find(
              (x) => x.employee_id === e.id && x.skill_id === s.id
            );
            initLevels[`${e.id}__${s.id}`] = existing?.current_level ?? 0;
          }
        }
        setLevels(initLevels);

        const initExpanded: Record<string, boolean> = {};
        empsData.forEach((e) => { initExpanded[e.id] = false; });
        setExpandedCards(initExpanded);
      }
    } catch {
      showToast("error", "Gagal memuat data kompetensi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getMyDept().then(({ dept }) => {
      if (dept) {
        setDeptName(dept);
        loadData(dept);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [loadData]);

  const handleLevelChange = (employeeId: string, skillId: string, value: number) => {
    setLevels((prev) => ({
      ...prev,
      [`${employeeId}__${skillId}`]: Math.max(0, Math.min(5, value)),
    }));
  };

  const handleSave = async (employeeId: string) => {
    setSavingId(employeeId);
    try {
      const empSkillsToSave = skills.map((s) => ({
        skill_id: s.id,
        current_level: levels[`${employeeId}__${s.id}`] ?? 0,
      }));

      const result = await assessEmployee(employeeId, empSkillsToSave);
      if (result && (result as unknown as { error?: string }).error) {
        showToast("error", (result as unknown as { error: string }).error);
        return;
      }

      showToast("success", "Penilaian kompetensi berhasil disimpan!");
    } catch {
      showToast("error", "Gagal menyimpan penilaian.");
    } finally {
      setSavingId(null);
    }
  };

  const getRequiredLevel = (position: string, skillId: string): number => {
    const ps = positionSkills.find((p) => p.position === position && p.skill_id === skillId);
    return ps?.required_level ?? 1;
  };

  const getGap = (employeeId: string, skillId: string): number => {
    const current = levels[`${employeeId}__${skillId}`] ?? 0;
    const employee = employees.find((e) => e.id === employeeId);
    const required = employee ? getRequiredLevel(employee.position, skillId) : 1;
    return current - required;
  };

  const getGapBadge = (gap: number) => {
    if (gap < 0) return "bg-red-50 text-red-700";
    if (gap === 0) return "bg-amber-50 text-amber-700";
    return "bg-emerald-50 text-emerald-700";
  };

  const stats = useMemo(() => {
    const total = employees.length;
    if (total === 0) return { total: 0, assessed: 0, notAssessed: 0, pctKompeten: "0" };

    let assessedCount = 0;
    let allGaps: number[] = [];

    for (const emp of employees) {
      let hasAny = false;
      for (const sk of skills) {
        const current = levels[`${emp.id}__${sk.id}`] ?? 0;
        if (current > 0) hasAny = true;
        const required = getRequiredLevel(emp.position, sk.id);
        allGaps.push(current - required);
      }
      if (hasAny) assessedCount++;
    }

    const kompeten = allGaps.filter((g) => g >= 0).length;
    const pct = allGaps.length > 0 ? ((kompeten / allGaps.length) * 100).toFixed(1) : "0";

    return {
      total,
      assessed: assessedCount,
      notAssessed: total - assessedCount,
      pctKompeten: pct,
    };
  }, [employees, skills, levels, positionSkills]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-72" />
          <div className="h-10 bg-slate-200 rounded-xl w-56" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-current opacity-50 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Kompetensi Karyawan</h1>
        <p className="text-sm text-gray-500 mt-1">
          {deptName || "Departemen tidak ditemukan"} &mdash; Nilai kompetensi setiap karyawan di departemen Anda.
        </p>
      </div>

      <PanduanLevel />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-lg font-extrabold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Sudah Dinilai</p>
              <p className="text-lg font-extrabold text-slate-800">{stats.assessed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Belum Dinilai</p>
              <p className="text-lg font-extrabold text-slate-800">{stats.notAssessed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Award size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">% Kompeten</p>
              <p className="text-lg font-extrabold text-purple-700">{stats.pctKompeten}%</p>
            </div>
          </div>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Belum ada data karyawan di departemen ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((emp) => {
            const isExpanded = expandedCards[emp.id] === true;
            const totalSkills = skills.length;
            const kompetenCount = skills.filter((s) => getGap(emp.id, s.id) >= 0).length;
            const negativeGaps = skills.filter((s) => getGap(emp.id, s.id) < 0).length;

            return (
              <div key={emp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedCards((prev) => ({ ...prev, [emp.id]: !isExpanded }))}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {emp.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-slate-800">{emp.full_name}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                          {emp.position}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold ${kompetenCount === totalSkills ? "text-emerald-600" : "text-slate-500"}`}>
                      {kompetenCount}/{totalSkills} kompeten
                    </span>
                    {negativeGaps > 0 && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-[10px] font-bold">
                        {negativeGaps} gap
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Skill</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-28">Level Dibutuhkan</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-32">Level Saat Ini</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-20">Gap</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {skills.map((sk) => {
                            const currentLevel = levels[`${emp.id}__${sk.id}`] ?? 0;
                            const requiredLevel = getRequiredLevel(emp.position, sk.id);
                            const gap = currentLevel - requiredLevel;

                            return (
                              <tr key={sk.id} className="hover:bg-slate-50/30">
                                <td className="px-4 py-2.5">
                                  <p className="text-xs text-slate-700 font-medium">{sk.name}</p>
                                  <p className="text-[9px] text-slate-400">{sk.category}</p>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5">
                                    Lv. {requiredLevel}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <div className="inline-flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleLevelChange(emp.id, sk.id, currentLevel - 1)}
                                      disabled={currentLevel <= 0}
                                      className="w-6 h-6 rounded-l-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronDown size={12} />
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      max={5}
                                      value={currentLevel}
                                      onChange={(e) => handleLevelChange(emp.id, sk.id, parseInt(e.target.value) || 0)}
                                      className="w-10 text-center py-1.5 border-y border-slate-200 text-xs font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleLevelChange(emp.id, sk.id, currentLevel + 1)}
                                      disabled={currentLevel >= 5}
                                      className="w-6 h-6 rounded-r-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronUp size={12} />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className={`inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg text-[10px] font-bold px-1.5 ${getGapBadge(gap)}`}>
                                    {gap > 0 ? `+${gap}` : gap}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {skills.length} skill &middot; {kompetenCount} kompeten &middot; {negativeGaps} gap
                      </span>
                      <button
                        onClick={() => handleSave(emp.id)}
                        disabled={savingId === emp.id}
                        className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save size={12} />
                        {savingId === emp.id ? "Menyimpan..." : "Simpan Penilaian"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
