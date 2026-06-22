"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Award, Save, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BookOpen, Plus, X } from "lucide-react";
import { getDeptEmployees, getSkills, getEmployeeSkills, getPositionSkills, assessEmployee } from "@/app/actions/skills";
import { addDeptSkill, getSkillGuidesMap, type LevelGuide } from "@/app/actions/competency-guides";
import { getMyDept } from "@/app/actions/department";

interface Employee { id: string; full_name: string; department: string; position: string }
interface Skill { id: string; name: string; category: string; department?: string | null }
interface EmployeeSkill { id: string; employee_id: string; skill_id: string; current_level: number }
interface PositionSkill { id: string; position: string; skill_id: string; required_level: number }

const LEVEL_LABELS: Record<number, string> = {
  0: "Tidak Ada", 1: "Dasar", 2: "Terbimbing", 3: "Mandiri", 4: "Mahir", 5: "Ahli"
};

const CATEGORY_OPTIONS = ["Teknis", "Soft Skills", "Manajemen", "Operasional", "K3", "HR", "Lainnya"];

function GuidesModal({ skill, dept, onClose }: { skill: Skill; dept: string; onClose: () => void }) {
  const [guides, setGuides] = useState<Record<number, LevelGuide>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSkillGuidesMap(skill.id, dept).then((map) => { setGuides(map); setLoading(false); });
  }, [skill.id, dept]);

  const hasAny = Object.keys(guides).length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800">Panduan: {skill.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Deskripsi per level yang dibuat HRD</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-8">Memuat panduan...</p>
          ) : !hasAny ? (
            <div className="text-center py-8">
              <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 font-bold">Panduan belum diisi HRD</p>
              <p className="text-xs text-slate-400 mt-1">HRD belum mengisi deskripsi level untuk kompetensi ini.</p>
            </div>
          ) : (
            [1, 2, 3, 4, 5].map((level) => {
              const g = guides[level];
              if (!g) return null;
              const COLORS: Record<number, string> = {
                1: "border-red-200 bg-red-50 text-red-700",
                2: "border-orange-200 bg-orange-50 text-orange-700",
                3: "border-yellow-200 bg-yellow-50 text-yellow-700",
                4: "border-blue-200 bg-blue-50 text-blue-700",
                5: "border-emerald-200 bg-emerald-50 text-emerald-700",
              };
              return (
                <div key={level} className={`border rounded-xl p-4 ${COLORS[level]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center font-black text-sm shadow-sm shrink-0">{level}</span>
                    <p className="font-extrabold text-sm">{g.title || `Level ${level}`}</p>
                  </div>
                  {g.description && <p className="text-xs leading-relaxed opacity-80 mb-3">{g.description}</p>}
                  {g.indicators && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Indikator</p>
                      <ul className="space-y-1">
                        {g.indicators.split("\n").filter(Boolean).map((ind, i) => (
                          <li key={i} className="text-xs flex gap-2 opacity-80 leading-relaxed">
                            <span className="shrink-0">•</span>{ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {g.example && (
                    <div className="bg-white/60 rounded-lg p-2.5">
                      <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Contoh</p>
                      <p className="text-xs opacity-80 leading-relaxed">{g.example}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AddKompetensiForm({ dept, onSuccess }: { dept: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Teknis");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleAdd() {
    if (!name.trim()) { setErr("Nama kompetensi wajib diisi."); return; }
    setLoading(true); setErr("");
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("category", category);
    fd.append("department", dept);
    const result = await addDeptSkill(fd);
    setLoading(false);
    if ("error" in result && result.error) { setErr(result.error); return; }
    setName(""); setCategory("Teknis"); setOpen(false);
    onSuccess();
  }

  return (
    <div className="mb-6">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A2530] text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors">
          <Plus size={14} /> Tambah Kompetensi Departemen
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2"><Plus size={14} /> Tambah Kompetensi untuk {dept}</h4>
            <button onClick={() => { setOpen(false); setErr(""); }} className="p-1 hover:bg-slate-100 rounded-full"><X size={16} className="text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Kompetensi *</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Analisis Data Logistik"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {err && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-3">
              <AlertTriangle size={12} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{err}</p>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setOpen(false); setErr(""); }}
              className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">Batal</button>
            <button onClick={handleAdd} disabled={loading}
              className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60 flex items-center gap-1.5">
              <Save size={12} /> {loading ? "Menyimpan..." : "Tambahkan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
  const [guideModal, setGuideModal] = useState<Skill | null>(null);

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
            const existing = (es as EmployeeSkill[]).find((x) => x.employee_id === e.id && x.skill_id === s.id);
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
      if (dept) { setDeptName(dept); loadData(dept); }
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, [loadData]);

  const handleLevelChange = (employeeId: string, skillId: string, value: number) => {
    setLevels((prev) => ({ ...prev, [`${employeeId}__${skillId}`]: Math.max(0, Math.min(5, value)) }));
  };

  const handleSave = async (employeeId: string) => {
    setSavingId(employeeId);
    try {
      const empSkillsToSave = skills.map((s) => ({ skill_id: s.id, current_level: levels[`${employeeId}__${s.id}`] ?? 0 }));
      const result = await assessEmployee(employeeId, empSkillsToSave);
      if (result && (result as unknown as { error?: string }).error) {
        showToast("error", (result as unknown as { error: string }).error); return;
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
    const allGaps: number[] = [];
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
    return { total, assessed: assessedCount, notAssessed: total - assessedCount, pctKompeten: pct };
  }, [employees, skills, levels, positionSkills]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-72" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-current opacity-50 hover:opacity-100">&times;</button>
        </div>
      )}

      {guideModal && (
        <GuidesModal skill={guideModal} dept={deptName} onClose={() => setGuideModal(null)} />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Kompetensi Karyawan</h1>
        <p className="text-sm text-gray-500 mt-1">
          {deptName || "Departemen tidak ditemukan"} &mdash; Nilai kompetensi setiap karyawan di departemen Anda.
        </p>
      </div>

      {deptName && (
        <AddKompetensiForm dept={deptName} onSuccess={() => loadData(deptName)} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Karyawan", value: stats.total, icon: <Users size={14} />, color: "bg-blue-50 text-blue-600" },
          { label: "Sudah Dinilai", value: stats.assessed, icon: <CheckCircle2 size={14} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Belum Dinilai", value: stats.notAssessed, icon: <AlertTriangle size={14} />, color: "bg-amber-50 text-amber-600" },
          { label: "% Kompeten", value: `${stats.pctKompeten}%`, icon: <Award size={14} />, color: "bg-purple-50 text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
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
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{emp.position}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold ${kompetenCount === totalSkills ? "text-emerald-600" : "text-slate-500"}`}>
                      {kompetenCount}/{totalSkills} kompeten
                    </span>
                    {negativeGaps > 0 && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-[10px] font-bold">{negativeGaps} gap</span>
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
                            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Kompetensi</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-28">Dibutuhkan</th>
                            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-36">Level Saat Ini</th>
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
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <p className="text-xs text-slate-700 font-medium">{sk.name}</p>
                                      <p className="text-[9px] text-slate-400">{sk.category}{sk.department ? ` · ${sk.department}` : ""}</p>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setGuideModal(sk); }}
                                      title="Lihat panduan level"
                                      className="p-1 rounded-lg hover:bg-sky-100 text-sky-500 transition-colors shrink-0">
                                      <BookOpen size={12} />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className="inline-flex flex-col items-center">
                                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5">
                                      Lv. {requiredLevel}
                                    </span>
                                    <span className="text-[9px] text-slate-400 mt-0.5">{LEVEL_LABELS[requiredLevel]}</span>
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <div className="inline-flex flex-col items-center gap-0.5">
                                    <div className="inline-flex items-center gap-0.5">
                                      <button type="button" onClick={() => handleLevelChange(emp.id, sk.id, currentLevel - 1)}
                                        disabled={currentLevel <= 0}
                                        className="w-6 h-6 rounded-l-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30">
                                        <ChevronDown size={12} />
                                      </button>
                                      <input type="number" min={0} max={5} value={currentLevel}
                                        onChange={(e) => handleLevelChange(emp.id, sk.id, parseInt(e.target.value) || 0)}
                                        className="w-10 text-center py-1.5 border-y border-slate-200 text-xs font-bold outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                      <button type="button" onClick={() => handleLevelChange(emp.id, sk.id, currentLevel + 1)}
                                        disabled={currentLevel >= 5}
                                        className="w-6 h-6 rounded-r-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30">
                                        <ChevronUp size={12} />
                                      </button>
                                    </div>
                                    <span className="text-[9px] text-slate-400">{LEVEL_LABELS[currentLevel]}</span>
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
                      <span className="text-[10px] text-slate-400">{skills.length} kompetensi · {kompetenCount} kompeten · {negativeGaps} gap</span>
                      <button onClick={() => handleSave(emp.id)} disabled={savingId === emp.id}
                        className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors inline-flex items-center gap-2 disabled:opacity-50">
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
