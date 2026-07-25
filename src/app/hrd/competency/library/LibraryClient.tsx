"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Award, Lightbulb, Save, X, AlertTriangle, CheckCircle2, Layers, Search, BookOpen, ChevronDown } from "lucide-react";
import {
  saveSkill, deleteSkill, saveRequiredLevel, removeSkillFromPosition,
  getDeptSkillList, saveDeptSkillList, getSkills, getPositionSkills,
  getCompetencyRequests,
} from "@/app/actions/skills";
import PanduanLevelForm from "./PanduanLevelForm";
import EmptyState from "@/components/EmptyState";

type Skill = { id: string; name: string; category: string; department?: string | null; jenis_kompetensi?: string; kode?: string | null; deskripsi?: string | null; status?: string | null };
type Position = { id: string; name: string; department: string; level?: string };
type PositionSkill = { id?: string; position_code: string; skill_id: string; required_level: number; jabatan_id?: string | null };

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
  const [activeTab, setActiveTab] = useState<"catalog" | "required" | "guides" | "dept">("catalog");
  const [deptTab, setDeptTab] = useState("");
  const [deptSkillMap, setDeptSkillMap] = useState<Record<string, Set<string>>>({});
  const [deptSelected, setDeptSelected] = useState<Set<string>>(new Set());
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const [skillModal, setSkillModal] = useState<null | "add" | "edit" | "del">(null);
  const [skillForm, setSkillForm] = useState({ id: "", name: "", category: "", department: "", jenis_kompetensi: "Hard Skill", kode: "", deskripsi: "", status: "Aktif" });
  const [skillFormErr, setSkillFormErr] = useState("");
  const [skillFormLoading, setSkillFormLoading] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState("");
  const [posSearch, setPosSearch] = useState("");
  const [levelMap, setLevelMap] = useState<Record<string, number>>({});
  const [addSkillModal, setAddSkillModal] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const [savingLevelIds, setSavingLevelIds] = useState<Set<string>>(new Set());
  const [removingSkillIds, setRemovingSkillIds] = useState<Set<string>>(new Set());
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>("__dept__");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<{ id: string; name: string; category: string }[]>([]);

  useEffect(() => {
    getCompetencyRequests("Pending").then((rows) => setPendingRequests(rows as { id: string; name: string; category: string }[])).catch(() => {});
  }, []);

  useEffect(() => {
    const map: Record<string, number> = {};
    posSkills
      .filter((ps) => ps.position_code === selectedPosition)
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

  const loadDeptSkills = async (dept: string) => {
    if (deptSkillMap[dept]) {
      setDeptSelected(new Set(deptSkillMap[dept]));
      return;
    }
    const ids = await getDeptSkillList(dept) as string[];
    const s = new Set<string>(ids);
    setDeptSkillMap((prev) => ({ ...prev, [dept]: s }));
    setDeptSelected(new Set(s));
  };

  const handleDeptTabChange = async (dept: string) => {
    setDeptTab(dept);
    setDeptSearch("");
    if (dept) await loadDeptSkills(dept);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => { if (s.category) set.add(s.category); });
    return Array.from(set).sort();
  }, [skills]);

  const currentPosSkills = useMemo(() => {
    if (!selectedPosition) return [];
    return posSkills.filter((ps) => ps.position_code === selectedPosition);
  }, [posSkills, selectedPosition]);

  const availableSkills = useMemo(() => {
    const usedIds = new Set(currentPosSkills.map((ps) => ps.skill_id));
    return skills.filter((s) => !usedIds.has(s.id));
  }, [skills, currentPosSkills]);

  const selectedPosInfo = useMemo(() => {
    return positions.find((p) => p.name === selectedPosition);
  }, [positions, selectedPosition]);

  // Kategori yang dianggap relevan untuk tiap dept (berlaku hanya untuk skill tanpa dept tag)
  const DEPT_CATEGORIES: Record<string, string[]> = {
    "SDM & Aset":                        ["HR", "Soft Skills", "Manajemen"],
    "Finance / Accounting":              ["Soft Skills", "Manajemen"],
    "Operasional":                       ["Operasional", "K3", "Teknis", "Soft Skills"],
    "SCM (Supply Chain Management)":     ["Operasional", "K3", "Teknis", "Soft Skills"],
    "Quality Control (QC)":              ["Manajemen", "Soft Skills"],
    "Management Representative":         ["Manajemen", "Soft Skills"],
    "Health, Safety & Environment":      ["K3", "Teknis", "Soft Skills"],
    "Marketing":                         ["Manajemen", "Soft Skills"],
    "PPJK":                              ["Operasional", "Teknis", "Soft Skills"],
    "General Affairs":                   ["Operasional", "Soft Skills"],
    "Gudang":                            ["Operasional", "K3", "Teknis"],
    "Peralatan":                         ["Operasional", "K3", "Teknis"],
    "Security":                          ["K3", "Soft Skills"],
    "Direksi":                           ["Manajemen", "Soft Skills"],
  };

  const positionsByDept = useMemo(() => {
    const q = posSearch.toLowerCase();
    const map: Record<string, Position[]> = {};
    for (const p of positions) {
      if (q && !p.name.toLowerCase().includes(q) && !p.department.toLowerCase().includes(q)) continue;
      if (!map[p.department]) map[p.department] = [];
      map[p.department].push(p);
    }
    return map;
  }, [positions, posSearch]);

  const modalFilteredSkills = useMemo(() => {
    const deptName = selectedPosInfo?.department || "";
    if (showAllCategories || modalCategoryFilter === "__all__") return availableSkills;
    if (modalCategoryFilter === "__dept__") {
      const allowedCategories = DEPT_CATEGORIES[deptName] || [];
      return availableSkills.filter((s) => {
        // Skill dengan dept tag → hanya tampil jika dept cocok
        if (s.department) return s.department === deptName;
        // Skill universal (tanpa dept tag) → filter berdasarkan kategori
        if (!deptName || allowedCategories.length === 0) return true;
        return allowedCategories.includes(s.category);
      });
    }
    return availableSkills.filter((s) => s.category === modalCategoryFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSkills, modalCategoryFilter, selectedPosInfo, showAllCategories]);

  const positionsWithStandard = useMemo(() => {
    const set = new Set(posSkills.map((ps) => ps.position_code));
    return set.size;
  }, [posSkills]);

  const openAddSkill = () => {
    setSkillForm({ id: "", name: "", category: "", department: "", jenis_kompetensi: "Hard Skill", kode: "", deskripsi: "", status: "Aktif" });
    setSkillFormErr("");
    setSkillModal("add");
  };

  const openEditSkill = (s: Skill) => {
    setSkillForm({ id: s.id, name: s.name, category: s.category, department: s.department || "", jenis_kompetensi: s.jenis_kompetensi || "Hard Skill", kode: s.kode || "", deskripsi: s.deskripsi || "", status: s.status || "Aktif" });
    setSkillFormErr("");
    setSkillModal("edit");
  };

  const openDelSkill = (s: Skill) => {
    setSkillForm({ id: s.id, name: s.name, category: s.category, department: s.department || "", jenis_kompetensi: s.jenis_kompetensi || "Hard Skill", kode: s.kode || "", deskripsi: s.deskripsi || "", status: s.status || "Aktif" });
    setSkillFormErr("");
    setSkillModal("del");
  };

  const closeSkillModal = () => {
    setSkillModal(null);
    setSkillForm({ id: "", name: "", category: "", department: "", jenis_kompetensi: "Hard Skill", kode: "", deskripsi: "", status: "Aktif" });
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
    fd.append("jenis_kompetensi", skillForm.jenis_kompetensi);
    if (skillForm.department) fd.append("department", skillForm.department);
    // Kode/Deskripsi/Status hanya berlaku untuk skill yang sudah ada — skill
    // baru melalui alur usulan_kompetensi (persetujuan Direktur) yang belum
    // punya kolom ini, jadi hanya dikirim saat mengedit skill existing.
    if (skillForm.id) {
      if (skillForm.kode) fd.append("kode", skillForm.kode);
      if (skillForm.deskripsi) fd.append("deskripsi", skillForm.deskripsi);
      fd.append("status", skillForm.status);
    }
    const r = await saveSkill(fd);
    setSkillFormLoading(false);
    if ("error" in r) { showToast("error", r.error); setSkillFormErr(r.error); return; }
    showToast("success", skillForm.id
      ? "Skill berhasil diupdate."
      : "Usulan kompetensi baru terkirim ke Direktur untuk disetujui.");
    closeSkillModal();
    await refreshData();
    getCompetencyRequests("Pending").then((rows) => setPendingRequests(rows as { id: string; name: string; category: string }[])).catch(() => {});
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
    fd.append("position_code", selectedPosition);
    fd.append("skill_id", skillId);
    fd.append("required_level", String(level));
    // `positions` is sourced straight from the `jabatan` table (Master
    // Jabatan) — passing its id here is what makes Gap Analysis resolve via
    // Employee Assignment (formasi_jabatan.jabatan_id) instead of only the
    // legacy position-name text match.
    if (selectedPosInfo?.id) fd.append("jabatan_id", selectedPosInfo.id);
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
    if (selectedSkillIds.size === 0) return;
    let hasError = false;
    for (const skillId of selectedSkillIds) {
      const fd = new FormData();
      fd.append("position_code", selectedPosition);
      fd.append("skill_id", skillId);
      fd.append("required_level", "0");
      if (selectedPosInfo?.id) fd.append("jabatan_id", selectedPosInfo.id);
      const r = await saveRequiredLevel(fd);
      if (r?.error) { showToast("error", r.error); hasError = true; break; }
    }
    if (!hasError) {
      showToast("success", `${selectedSkillIds.size} skill berhasil ditambahkan ke jabatan.`);
    }
    setAddSkillModal(false);
    setSelectedSkillIds(new Set());
    await refreshData();
  };

  const doRemoveSkill = async (skillId: string) => {
    setRemovingSkillIds((prev) => new Set(prev).add(skillId));
    const r = await removeSkillFromPosition(selectedPosition, skillId);
    setRemovingSkillIds((prev) => { const n = new Set(prev); n.delete(skillId); return n; });
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Skill dihapus dari jabatan.");
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
        <p className="text-sm text-gray-500 mt-1">Kelola katalog skill dan required level per jabatan. Menambah kompetensi baru butuh persetujuan Direktur.</p>
      </div>

      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">{pendingRequests.length} usulan kompetensi baru menunggu persetujuan Direktur</p>
            <p className="text-[11px] text-amber-700 mt-0.5">{pendingRequests.map((r) => r.name).join(", ")}</p>
          </div>
        </div>
      )}


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

      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6 flex-wrap">
        <button onClick={() => setActiveTab("catalog")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "catalog" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
          Katalog Kompetensi
        </button>
        <button onClick={() => setActiveTab("guides")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "guides" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
          <BookOpen size={12} /> Panduan per Level
        </button>
        <button onClick={() => setActiveTab("required")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "required" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
          Required Level per Jabatan
        </button>
        <button onClick={() => setActiveTab("dept")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "dept" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
          Kompetensi per Departemen
        </button>
      </div>

      {activeTab === "guides" && (
        <div>
          <div className="mb-4">
            <p className="text-xs text-slate-500">Isi panduan deskripsi per level (1–5) untuk setiap kompetensi. Kepala departemen akan melihat panduan ini saat menilai karyawan.</p>
          </div>
          <PanduanLevelForm skills={skills} />
        </div>
      )}

      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{skills.length} kompetensi dalam katalog</p>
            <button onClick={openAddSkill} className="bg-[#1A2530] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors inline-flex items-center gap-2">
              <Plus size={13} /> Tambah Kompetensi
            </button>
          </div>

          {skills.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Belum ada skill."
              description="Tambahkan skill untuk memulai katalog kompetensi."
            />
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
                          <button onClick={() => openEditSkill(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="Edit">
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
        <div className="flex gap-4 min-h-[600px]">
          {/* LEFT PANEL — daftar jabatan per departemen */}
          <div className="w-64 shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <Search size={13} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari jabatan..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-full"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {Object.keys(positionsByDept).sort().length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Tidak ada jabatan ditemukan.</p>
              ) : (
                Object.keys(positionsByDept).sort().map((dept) => (
                  <div key={dept} className="mb-2">
                    <p className="px-3 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{dept}</p>
                    {positionsByDept[dept].map((p) => {
                      const hasStandard = posSkills.some((ps) => ps.position_code === p.name);
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPosition(p.name)}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                            selectedPosition === p.name
                              ? "bg-[#CC0000]/10 border-r-2 border-[#CC0000]"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span className={`text-xs font-semibold leading-tight ${selectedPosition === p.name ? "text-[#CC0000]" : "text-slate-700"}`}>
                            {p.name}
                          </span>
                          {hasStandard && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Sudah ada standar" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANEL — skill untuk jabatan terpilih */}
          <div className="flex-1 min-w-0">
            {!selectedPosition ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Layers size={28} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-500">Pilih jabatan di sebelah kiri</p>
                <p className="text-xs text-slate-400 mt-1">untuk melihat dan mengatur standar kompetensinya.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{selectedPosition}</p>
                    {selectedPosInfo && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedPosInfo.department}{selectedPosInfo.level ? ` · ${selectedPosInfo.level}` : ""}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedSkillIds(new Set()); setModalCategoryFilter("__dept__"); setShowAllCategories(false); setAddSkillModal(true); }}
                    className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2 shrink-0"
                  >
                    <Plus size={14} /> Tambah Kompetensi
                  </button>
                </div>

                {currentPosSkills.length === 0 ? (
                  <EmptyState
                    icon={Layers}
                    title="Belum ada standar kompetensi untuk jabatan ini."
                    description={"Klik “Tambah Kompetensi” untuk memulai."}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kompetensi</th>
                          <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                          <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level Minimum yang Dibutuhkan</th>
                          <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {currentPosSkills.map((ps) => {
                          const skill = skills.find((s) => s.id === ps.skill_id);
                          const localLevel = levelMap[ps.skill_id] ?? ps.required_level;
                          return (
                            <tr key={ps.position_code + "-" + ps.skill_id} className="hover:bg-slate-50/50 transition-colors">
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
                                <div className="flex items-center gap-2 justify-center">
                                  <button
                                    onClick={() => setLevelMap((prev) => ({ ...prev, [ps.skill_id]: Math.max(0, (prev[ps.skill_id] ?? ps.required_level) - 1) }))}
                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors"
                                  >−</button>
                                  <div className="text-center min-w-[100px]">
                                    <span className={`block text-base font-extrabold ${getLevelColor(localLevel).replace("bg-", "text-").replace("-50", "-700").replace("-100", "-700")}`}>
                                      {localLevel}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-semibold">{getLevelLabel(localLevel)}</span>
                                  </div>
                                  <button
                                    onClick={() => setLevelMap((prev) => ({ ...prev, [ps.skill_id]: Math.min(5, (prev[ps.skill_id] ?? ps.required_level) + 1) }))}
                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors"
                                  >+</button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => doSaveLevel(ps.skill_id)}
                                    disabled={savingLevelIds.has(ps.skill_id)}
                                    className="px-2.5 py-1.5 bg-[#1A2530] text-white text-xs font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                                  >
                                    <Save size={11} /> Simpan
                                  </button>
                                  <button
                                    onClick={() => doRemoveSkill(ps.skill_id)}
                                    disabled={removingSkillIds.has(ps.skill_id)}
                                    className="px-2.5 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                                    title="Hapus kompetensi ini dari jabatan"
                                  >
                                    <Trash2 size={11} />
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
        </div>
      )}

      {activeTab === "dept" && (() => {
        const DEPTS = ["Direksi", "Marketing", "PPJK", "Finance / Accounting", "SDM & Aset", "General Affairs", "Operasional", "Gudang", "SCM (Supply Chain Management)", "Health, Safety & Environment", "Management Representative", "Quality Control (QC)", "Peralatan", "Security"];
        const q = deptSearch.toLowerCase();
        const filteredSkills = skills.filter((s) => !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
        const byCategory: Record<string, Skill[]> = {};
        for (const s of filteredSkills) {
          if (!byCategory[s.category]) byCategory[s.category] = [];
          byCategory[s.category].push(s);
        }
        return (
          <div className="flex gap-4 min-h-[600px]">
            {/* LEFT: Dept list */}
            <div className="w-56 shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Departemen</p>
              </div>
              <div className="overflow-y-auto flex-1 py-2">
                {DEPTS.map((d) => {
                  const count = deptSkillMap[d]?.size ?? null;
                  return (
                    <button key={d} onClick={() => handleDeptTabChange(d)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 transition-colors ${deptTab === d ? "bg-[#CC0000]/10 border-r-2 border-[#CC0000]" : "hover:bg-slate-50"}`}>
                      <span className={`text-xs font-semibold leading-tight ${deptTab === d ? "text-[#CC0000]" : "text-slate-700"}`}>{d}</span>
                      {count !== null && (
                        <span className="text-[9px] font-bold text-slate-400 shrink-0">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Skill checklist */}
            <div className="flex-1 min-w-0">
              {!deptTab ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col items-center justify-center text-center p-12">
                  <Layers size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-500">Pilih departemen</p>
                  <p className="text-xs text-slate-400 mt-1">untuk mengatur kompetensi yang dinilai di departemen itu.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">{deptTab}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Centang kompetensi yang harus dinilai untuk karyawan departemen ini.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <Search size={13} className="text-slate-400" />
                      <input type="text" placeholder="Cari..." value={deptSearch} onChange={(e) => setDeptSearch(e.target.value)}
                        className="text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-32" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 max-h-[480px]">
                    {Object.keys(byCategory).sort().map((cat) => (
                      <div key={cat} className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{cat}</p>
                          <button onClick={() => {
                            const ids = byCategory[cat].map((s) => s.id);
                            const allChecked = ids.every((id) => deptSelected.has(id));
                            setDeptSelected((prev) => {
                              const n = new Set(prev);
                              ids.forEach((id) => allChecked ? n.delete(id) : n.add(id));
                              return n;
                            });
                          }} className="text-[9px] text-[#CC0000] hover:underline font-bold">
                            {byCategory[cat].every((s) => deptSelected.has(s.id)) ? "Batal semua" : "Pilih semua"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {byCategory[cat].map((s) => {
                            const checked = deptSelected.has(s.id);
                            return (
                              <label key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${checked ? "bg-[#CC0000]/5 border-[#CC0000]/30" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}>
                                <input type="checkbox" checked={checked}
                                  onChange={() => setDeptSelected((prev) => { const n = new Set(prev); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })}
                                  className="accent-[#CC0000] shrink-0" />
                                <span className={`text-xs font-semibold leading-tight ${checked ? "text-[#CC0000]" : "text-slate-700"}`}>{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <span className="text-xs text-slate-500"><span className="font-bold text-slate-700">{deptSelected.size}</span> kompetensi dipilih</span>
                    <button
                      onClick={async () => {
                        setDeptSaving(true);
                        const r = await saveDeptSkillList(deptTab, Array.from(deptSelected));
                        setDeptSaving(false);
                        if (r?.error) { showToast("error", r.error as string); return; }
                        setDeptSkillMap((prev) => ({ ...prev, [deptTab]: new Set(deptSelected) }));
                        showToast("success", `Kompetensi untuk ${deptTab} berhasil disimpan.`);
                      }}
                      disabled={deptSaving}
                      className="px-5 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                    >
                      <Save size={13} /> {deptSaving ? "Menyimpan..." : "Simpan Pilihan"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jenis Kompetensi
                  </label>
                  <select
                    value={skillForm.jenis_kompetensi}
                    onChange={(e) => setSkillForm({ ...skillForm, jenis_kompetensi: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  >
                    <option value="Hard Skill">Hard Skill</option>
                    <option value="Soft Skill">Soft Skill</option>
                  </select>
                </div>
                {skillForm.id && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kode Kompetensi</label>
                      <input
                        type="text"
                        value={skillForm.kode}
                        onChange={(e) => setSkillForm({ ...skillForm, kode: e.target.value })}
                        placeholder="Contoh: C001"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi</label>
                      <textarea
                        value={skillForm.deskripsi}
                        onChange={(e) => setSkillForm({ ...skillForm, deskripsi: e.target.value })}
                        rows={2}
                        placeholder="Penjelasan singkat kompetensi ini..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        value={skillForm.status}
                        onChange={(e) => setSkillForm({ ...skillForm, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Khusus Departemen
                    <span className="ml-1 font-normal normal-case text-slate-400">(kosongkan = berlaku semua dept)</span>
                  </label>
                  <select
                    value={skillForm.department}
                    onChange={(e) => setSkillForm({ ...skillForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  >
                    <option value="">— Semua Departemen —</option>
                    {["Direksi", "Marketing", "PPJK", "Finance / Accounting", "SDM & Aset", "General Affairs", "Operasional", "Gudang", "SCM (Supply Chain Management)", "Health, Safety & Environment", "Management Representative", "Quality Control (QC)", "Peralatan", "Security"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
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
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[4vh]" onClick={() => { setAddSkillModal(false); setSelectedSkillIds(new Set()); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5">
                <Plus size={18} className="text-emerald-400" />
                <h3 className="text-white font-bold text-sm">Tambah Kompetensi ke Jabatan — {selectedPosition}</h3>
              </div>
              <button onClick={() => { setAddSkillModal(false); setSelectedSkillIds(new Set()); }} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* LEFT: Available skills — 60% */}
              <div className="lg:w-[60%] flex flex-col min-h-0 border-r border-slate-100">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Kompetensi</p>
                  {/* Category filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => { setModalCategoryFilter("__dept__"); setShowAllCategories(false); }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${!showAllCategories && modalCategoryFilter === "__dept__" ? "bg-[#CC0000] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      Relevan ({selectedPosInfo?.department || "Dept"})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setModalCategoryFilter(cat); setShowAllCategories(false); }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${!showAllCategories && modalCategoryFilter === cat ? "bg-[#CC0000] text-white" : `${getCategoryBadge(cat)} border`}`}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowAllCategories(true)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 ${showAllCategories ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      Semua <ChevronDown size={10} />
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400">{modalFilteredSkills.length} kompetensi ditampilkan · Klik untuk memilih</p>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                  {modalFilteredSkills.length === 0 ? (
                    <EmptyState
                      icon={Layers}
                      title="Tidak ada kompetensi tersedia."
                      description="Semua sudah ditambahkan atau tidak ada yang cocok dengan filter."
                    />
                  ) : (
                    <div className="space-y-1">
                      {modalFilteredSkills.map((s) => {
                        const isSelected = selectedSkillIds.has(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedSkillIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(s.id)) next.delete(s.id);
                                else next.add(s.id);
                                return next;
                              });
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                              isSelected
                                ? "bg-[#CC0000]/10 border border-[#CC0000]/30 shadow-sm"
                                : "hover:bg-slate-50 border border-transparent"
                            }`}
                          >
                            <div>
                              <p className={`text-xs font-bold ${isSelected ? "text-[#CC0000]" : "text-slate-800"}`}>{s.name}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold shrink-0 ${getCategoryBadge(s.category)}`}>{s.category}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-500">
                    {selectedSkillIds.size} kompetensi dipilih
                  </p>
                  <button
                    onClick={doAddSkillToPos}
                    disabled={selectedSkillIds.size === 0}
                    className="bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors inline-flex items-center gap-2"
                  >
                    <Save size={14} /> Tambahkan
                  </button>
                </div>
              </div>

              {/* RIGHT: Panduan Level reference — 40% */}
              <div className="lg:w-[40%] flex flex-col min-h-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-sky-600" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Panduan Level (0–5)</p>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                  {[
                    { level: 0, title: "Tidak Dibutuhkan", color: "border-gray-200 bg-gray-50 text-gray-600", desc: "Belum memiliki pengetahuan terkait kompetensi ini. Belum pernah terpapar atau menerima pelatihan." },
                    { level: 1, title: "Basic — Mengetahui Konsep Dasar", color: "border-red-200 bg-red-50 text-red-700", desc: "Memiliki pengetahuan dasar berupa pemahaman teori dan terminologi, namun belum dapat menerapkan secara praktis tanpa bimbingan." },
                    { level: 2, title: "Intermediate — Dapat dgn Bimbingan", color: "border-orange-200 bg-orange-50 text-orange-700", desc: "Mampu melaksanakan tugas dasar terkait kompetensi, namun masih memerlukan supervisi dan arahan berkala." },
                    { level: 3, title: "Advanced — Mandiri", color: "border-yellow-200 bg-yellow-50 text-yellow-700", desc: "Mampu melaksanakan tugas secara mandiri tanpa supervisi terus-menerus. Mulai mampu memecahkan masalah umum." },
                    { level: 4, title: "Expert — Mahir & Membimbing", color: "border-blue-200 bg-blue-50 text-blue-700", desc: "Sangat menguasai, mampu menangani situasi kompleks, melatih, dan mentransfer pengetahuan kepada orang lain." },
                    { level: 5, title: "Master — Ahli & Inovator", color: "border-emerald-200 bg-emerald-50 text-emerald-700", desc: "Diakui sebagai pakar. Mampu menciptakan standar, metodologi, dan inovasi baru di tingkat organisasi." },
                  ].map((lv) => (
                    <div key={lv.level} className={`border rounded-xl p-3 ${lv.color}`}>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center font-black text-xs shadow-sm shrink-0">{lv.level}</span>
                        <p className="text-[11px] font-extrabold leading-tight">{lv.title}</p>
                      </div>
                      <p className="text-[10px] leading-relaxed opacity-80 pl-9">{lv.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
