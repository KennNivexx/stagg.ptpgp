"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PanduanLevel from "@/components/PanduanLevel";
import { Plus, Pencil, Trash2, Award, Lightbulb, Save, X, AlertTriangle, CheckCircle2, Layers, Search } from "lucide-react";
import {
  saveSkill, deleteSkill, saveRequiredLevel, getSkills, getPositionSkills,
} from "@/app/actions/skills";

type Skill = { id: string; name: string; category: string };
type Position = { id: string; name: string; department: string; level?: string };
type PositionSkill = { id: string; position: string; skill_id: string; required_level: number };

interface Props {
  skills: Skill[];
  positionSkills: PositionSkill[];
  positions: Position[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Teknis": "bg-blue-50 text-blue-700 border-blue-200",
  "Soft Skills": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Manajemen": "bg-amber-50 text-amber-700 border-amber-200",
  "HR": "bg-purple-50 text-purple-700 border-purple-200",
  "K3": "bg-orange-50 text-orange-700 border-orange-200",
  "Operasional": "bg-cyan-50 text-cyan-700 border-cyan-200",
};

function getCategoryBadge(category: string) {
  return CATEGORY_COLORS[category] || "bg-slate-100 text-slate-600";
}

function getLevelColor(level: number) {
  if (level >= 4) return "bg-emerald-50 text-emerald-700";
  if (level >= 2) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function getLevelLabel(level: number) {
  if (level === 0) return "Tidak Dibutuhkan";
  if (level === 1) return "Basic";
  if (level === 2) return "Intermediate";
  if (level === 3) return "Advanced";
  if (level === 4) return "Expert";
  if (level === 5) return "Master";
  return "-";
}

export default function LibraryClient({ skills: initialSkills, positionSkills: initialPosSkills, positions }: Props) {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [posSkills, setPosSkills] = useState<PositionSkill[]>(initialPosSkills);
  const [activeTab, setActiveTab] = useState<"catalog" | "required">("catalog");
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const [skillModal, setSkillModal] = useState<null | "add" | "edit" | "del">(null);
  const [skillForm, setSkillForm] = useState({ id: "", name: "", category: "" });
  const [skillFormErr, setSkillFormErr] = useState("");
  const [skillFormLoading, setSkillFormLoading] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState("");
  const [levelMap, setLevelMap] = useState<Record<string, number>>({});
  const [addSkillModal, setAddSkillModal] = useState(false);
  const [addSkillForm, setAddSkillForm] = useState({ skill_id: "", level: 0 });
  const [savingLevelIds, setSavingLevelIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const map: Record<string, number> = {};
    posSkills
      .filter((ps) => ps.position === selectedPosition)
      .forEach((ps) => { map[ps.skill_id] = ps.required_level; });
    setLevelMap(map);
  }, [posSkills, selectedPosition]);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshData = async () => {
    const [s, ps] = await Promise.all([getSkills(), getPositionSkills()]);
    setSkills(s as Skill[]);
    setPosSkills(ps as PositionSkill[]);
    router.refresh();
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => { if (s.category) set.add(s.category); });
    return Array.from(set).sort();
  }, [skills]);

  const currentPosSkills = useMemo(() => {
    if (!selectedPosition) return [];
    return posSkills.filter((ps) => ps.position === selectedPosition);
  }, [posSkills, selectedPosition]);

  const availableSkills = useMemo(() => {
    const usedIds = new Set(currentPosSkills.map((ps) => ps.skill_id));
    return skills.filter((s) => !usedIds.has(s.id));
  }, [skills, currentPosSkills]);

  const selectedPosInfo = useMemo(() => {
    return positions.find((p) => p.name === selectedPosition);
  }, [positions, selectedPosition]);

  const positionsWithStandard = useMemo(() => {
    const set = new Set(posSkills.map((ps) => ps.position));
    return set.size;
  }, [posSkills]);

  const openAddSkill = () => {
    setSkillForm({ id: "", name: "", category: "" });
    setSkillFormErr("");
    setSkillModal("add");
  };

  const openEditSkill = (s: Skill) => {
    setSkillForm({ id: s.id, name: s.name, category: s.category });
    setSkillFormErr("");
    setSkillModal("edit");
  };

  const openDelSkill = (s: Skill) => {
    setSkillForm({ id: s.id, name: s.name, category: s.category });
    setSkillFormErr("");
    setSkillModal("del");
  };

  const closeSkillModal = () => {
    setSkillModal(null);
    setSkillForm({ id: "", name: "", category: "" });
    setSkillFormErr("");
  };

  const doSaveSkill = async () => {
    const name = skillForm.name.trim();
    const category = skillForm.category.trim();
    if (!name) { setSkillFormErr("Nama skill wajib diisi."); return; }
    if (!category) { setSkillFormErr("Kategori wajib diisi."); return; }

    setSkillFormLoading(true);
    setSkillFormErr("");
    const fd = new FormData();
    if (skillForm.id) fd.append("id", skillForm.id);
    fd.append("name", name);
    fd.append("category", category);
    const r = await saveSkill(fd);
    setSkillFormLoading(false);
    if (r?.error) { showToast("error", r.error); setSkillFormErr(r.error); return; }
    showToast("success", skillForm.id ? "Skill berhasil diupdate." : "Skill berhasil ditambahkan.");
    closeSkillModal();
    await refreshData();
  };

  const doDeleteSkill = async () => {
    if (!skillForm.id) return;
    setSkillFormLoading(true);
    const r = await deleteSkill(skillForm.id);
    setSkillFormLoading(false);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Skill berhasil dihapus.");
    closeSkillModal();
    await refreshData();
  };

  const doSaveLevel = async (skillId: string) => {
    const level = levelMap[skillId] ?? 0;
    setSavingLevelIds((prev) => new Set(prev).add(skillId));
    const fd = new FormData();
    fd.append("position", selectedPosition);
    fd.append("skill_id", skillId);
    fd.append("required_level", String(level));
    const r = await saveRequiredLevel(fd);
    setSavingLevelIds((prev) => {
      const next = new Set(prev);
      next.delete(skillId);
      return next;
    });
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Level berhasil disimpan.");
    await refreshData();
  };

  const doAddSkillToPos = async () => {
    if (!addSkillForm.skill_id) return;
    const fd = new FormData();
    fd.append("position", selectedPosition);
    fd.append("skill_id", addSkillForm.skill_id);
    fd.append("required_level", String(addSkillForm.level));
    const r = await saveRequiredLevel(fd);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Skill berhasil ditambahkan ke jabatan.");
    setAddSkillModal(false);
    setAddSkillForm({ skill_id: "", level: 0 });
    await refreshData();
  };

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Pustaka Kompetensi</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola katalog skill dan required level per jabatan.</p>
      </div>

      <PanduanLevel />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Lightbulb size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Skills</p>
              <p className="text-lg font-extrabold text-slate-800">{skills.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><Layers size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Kategori</p>
              <p className="text-lg font-extrabold text-slate-800">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Award size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Jabatan dgn Standard</p>
              <p className="text-lg font-extrabold text-slate-800">{positionsWithStandard}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "catalog" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        >
          Katalog Skill
        </button>
        <button
          onClick={() => setActiveTab("required")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "required" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        >
          Required Level per Jabatan
        </button>
      </div>

      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{skills.length} skill dalam katalog</p>
            <button
              onClick={openAddSkill}
              className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
            >
              <Plus size={14} /> Tambah Skill
            </button>
          </div>

          {skills.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Lightbulb size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500 font-bold">Belum ada skill.</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan skill untuk memulai katalog kompetensi.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Skill</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {skills.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-slate-800">{s.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${getCategoryBadge(s.category)}`}>{s.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditSkill(s)} className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600 transition-colors" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => openDelSkill(s)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors" title="Hapus">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "required" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Jabatan</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full max-w-md border border-slate-200 p-2.5 rounded-xl text-sm text-slate-800 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none"
            >
              <option value="">-- Pilih Jabatan --</option>
              {positions.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} {p.department ? `(${p.department})` : ""}
                </option>
              ))}
            </select>
          </div>

          {!selectedPosition ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Search size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500 font-bold">Pilih jabatan untuk melihat required skill.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{selectedPosition}</p>
                  {selectedPosInfo && (
                    <p className="text-[10px] text-slate-400">{selectedPosInfo.department} / {selectedPosInfo.level || "-"}</p>
                  )}
                </div>
                <button
                  onClick={() => { setAddSkillForm({ skill_id: "", level: 0 }); setAddSkillModal(true); }}
                  className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Tambah Skill ke Jabatan
                </button>
              </div>

              {currentPosSkills.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                  <Layers size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-sm text-slate-500 font-bold">Belum ada required skill untuk jabatan ini.</p>
                  <p className="text-xs text-slate-400 mt-1">Klik &ldquo;Tambah Skill ke Jabatan&rdquo; untuk menambahkan.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skill</th>
                        <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-52">Required Level</th>
                        <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentPosSkills.map((ps) => {
                        const skill = skills.find((s) => s.id === ps.skill_id);
                        const localLevel = levelMap[ps.skill_id] ?? ps.required_level;
                        return (
                          <tr key={ps.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="text-xs font-bold text-slate-800">{skill?.name || ps.skill_id}</span>
                            </td>
                            <td className="py-3 px-4">
                              {skill?.category ? (
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${getCategoryBadge(skill.category)}`}>{skill.category}</span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3 justify-center">
                                <input
                                  type="range"
                                  min={0}
                                  max={5}
                                  value={localLevel}
                                  onChange={(e) => setLevelMap((prev) => ({ ...prev, [ps.skill_id]: Number(e.target.value) }))}
                                  className="w-24 h-1.5 accent-[#CC0000]"
                                />
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold min-w-[60px] text-center ${getLevelColor(localLevel)}`}>
                                  {localLevel} — {getLevelLabel(localLevel)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => doSaveLevel(ps.skill_id)}
                                  disabled={savingLevelIds.has(ps.skill_id)}
                                  className="px-3 py-1.5 bg-[#1A2530] text-white text-xs font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                                >
                                  <Save size={11} /> Simpan
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {skillModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[8vh]" onClick={closeSkillModal}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className={`px-5 py-4 flex items-center justify-between ${skillModal === "del" ? "bg-red-500" : "bg-slate-900"}`}>
              <div className="flex items-center gap-2.5">
                {skillModal === "add" && <Plus size={18} className="text-emerald-400" />}
                {skillModal === "edit" && <Pencil size={18} className="text-sky-400" />}
                {skillModal === "del" && <Trash2 size={18} className="text-white" />}
                <h3 className="text-white font-bold text-sm">
                  {skillModal === "add" && "Tambah Skill Baru"}
                  {skillModal === "edit" && `Edit: ${skillForm.name}`}
                  {skillModal === "del" && "Hapus Skill?"}
                </h3>
              </div>
              <button onClick={closeSkillModal} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>

            {skillModal === "del" ? (
              <div className="p-5">
                <p className="text-slate-600 text-sm mb-1">
                  Anda akan menghapus skill <span className="font-black text-slate-900">&ldquo;{skillForm.name}&rdquo;</span>.
                  Tindakan ini tidak dapat diurungkan dan akan menghapus semua data terkait.
                </p>
                {skillFormErr && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mt-3">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{skillFormErr}</p>
                  </div>
                )}
                <div className="flex gap-3 mt-5">
                  <button onClick={closeSkillModal} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                  <button onClick={doDeleteSkill} disabled={skillFormLoading}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                    {skillFormLoading ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Skill <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={skillForm.name}
                    onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                    placeholder="Contoh: Pemrograman Web"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={skillForm.category}
                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                    placeholder="Ketik atau pilih kategori..."
                    list="category-list"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  />
                  <datalist id="category-list">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {categories.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSkillForm({ ...skillForm, category: c })}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-600 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {skillFormErr && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{skillFormErr}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={closeSkillModal} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                  <button onClick={doSaveSkill} disabled={skillFormLoading}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                    {skillFormLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {addSkillModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[8vh]" onClick={() => setAddSkillModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2.5">
                <Plus size={18} className="text-emerald-400" />
                <h3 className="text-white font-bold text-sm">Tambah Skill ke Jabatan</h3>
              </div>
              <button onClick={() => setAddSkillModal(false)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jabatan</label>
                <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3.5 py-2.5 rounded-xl">{selectedPosition}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Skill <span className="text-red-500">*</span>
                </label>
                <select
                  value={addSkillForm.skill_id}
                  onChange={(e) => setAddSkillForm({ ...addSkillForm, skill_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                >
                  <option value="">Pilih Skill</option>
                  {availableSkills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
                {availableSkills.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">Semua skill sudah ditambahkan ke jabatan ini.</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Required Level: {addSkillForm.level} — {getLevelLabel(addSkillForm.level)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={addSkillForm.level}
                  onChange={(e) => setAddSkillForm({ ...addSkillForm, level: Number(e.target.value) })}
                  className="w-full h-1.5 accent-[#CC0000]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                  <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                </div>
              </div>
              <button
                onClick={doAddSkillToPos}
                disabled={!addSkillForm.skill_id}
                className="w-full bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors inline-flex items-center justify-center gap-2"
              >
                <Save size={14} /> Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
