"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Network, Plus, Users, Award, Briefcase, Edit3, Trash2, X,
  AlertTriangle, Search, CheckCircle2, RefreshCw
} from "lucide-react";
import { getPositions, addPosition, updatePosition, deletePosition } from "@/app/actions/positions";
import type { Employee } from "@/types/org";

interface Position {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
}

interface Props {
  departments: string[];
  employees: Employee[];
}

export default function PositionsClient({ departments, employees }: Props) {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | "edit" | "del">(null);
  const [selected, setSelected] = useState<Position | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [formErr, setFormErr] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [codeManual, setCodeManual] = useState(false);

  const levelToNum = (lv: string): number => {
    const map: Record<string, number> = {
      "Staff": 1, "Supervisor": 2, "Asisten Manajer": 3,
      "Manager": 4, "Kepala Divisi": 5, "Wakil Direktur": 6, "Direktur": 7,
    };
    return map[lv] || 0;
  };

  function generateCode(dept: string, level: string, excludeId?: string): string {
    const di = deptList.indexOf(dept) + 1;
    const ln = levelToNum(level) || 1;
    const same = positions.filter(p =>
      p.department === dept && levelToNum(p.level) === ln && p.id !== excludeId
    );
    const seq = same.length + 1;
    return `${di}.${ln}.${seq}.0.0.0.0`;
  }

  function regenCode(dept: string, level: string, excludeId?: string) {
    if (dept && level) {
      setFormCode(generateCode(dept, level, excludeId));
    }
    setCodeManual(false);
    setFormErr("");
  }

  useEffect(() => {
    getPositions().then(data => { setPositions(data); setLoading(false); });
  }, []);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const deptList = departments;

  const positionsByDept = useMemo(() => {
    const map: Record<string, Position[]> = {};
    positions.forEach(p => {
      const d = p.department || "Tanpa Departemen";
      if (!map[d]) map[d] = [];
      map[d].push(p);
    });
    const filtered: Record<string, Position[]> = {};
    for (const [dept, list] of Object.entries(map)) {
      if (search.trim()) {
        const s = search.toLowerCase();
        const f = list.filter(p => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s));
        if (f.length > 0) filtered[dept] = f;
      } else {
        filtered[dept] = list;
      }
    }
    return filtered;
  }, [positions, search]);

  const empCountByPos = useMemo(() => {
    const map: Record<string, string[]> = {};
    employees.forEach(e => {
      const p = e.position;
      if (!p) return;
      if (!map[p]) map[p] = [];
      map[p].push(e.full_name);
    });
    return map;
  }, [employees]);

  const openAdd = () => {
    setFormCode(""); setFormName(""); setFormDept(""); setFormLevel(""); setFormErr(""); setCodeManual(false);
    setModal("add");
  };
  const openEdit = (pos: Position) => {
    setSelected(pos);
    setFormCode(pos.code); setFormName(pos.name); setFormDept(pos.department); setFormLevel(pos.level);
    setFormErr("");
    setCodeManual(true);
    setModal("edit");
  };

  const closeM = () => { setModal(null); setSelected(null); };
  const openDel = (pos: Position) => {
    setSelected(pos);
    setFormErr("");
    setModal("del");
  };

  const validateCode = (code: string): boolean => /^\d+(\.\d+)+$/.test(code);

  const doAdd = async () => {
    const code = (formCode || generateCode(formDept, formLevel)).trim();
    if (!formName.trim()) { setFormErr("Nama jabatan wajib diisi."); return; }
    if (!formDept.trim()) { setFormErr("Departemen wajib dipilih."); return; }
    if (!formLevel) { setFormErr("Level wajib dipilih."); return; }
    if (!validateCode(code)) {
      setFormErr("Format kode tidak valid. Gunakan format: 1.2.3.0.0.0.0 (7 digit dipisah titik).");
      return;
    }
    setFormLoading(true); setFormErr("");
    const fd = new FormData();
    fd.append("code", code);
    fd.append("name", formName.trim());
    fd.append("department", formDept.trim());
    fd.append("level", formLevel);
    const r = await addPosition(fd);
    setFormLoading(false);
    if (r.error) { showToast("error", r.error); setFormErr(r.error); return; }
    showToast("success", "Jabatan berhasil ditambahkan.");
    closeM();
    getPositions().then(setPositions);
    router.refresh();
  };

  const doEdit = async () => {
    if (!selected || !formName.trim()) { setFormErr("Nama jabatan wajib diisi."); return; }
    if (!formDept.trim()) { setFormErr("Departemen wajib dipilih."); return; }
    if (!formLevel) { setFormErr("Level wajib dipilih."); return; }
    const code = formCode.trim();
    if (!validateCode(code)) {
      setFormErr("Format kode tidak valid. Gunakan format: 1.2.3.0.0.0.0 (7 digit dipisah titik).");
      return;
    }
    setFormLoading(true); setFormErr("");
    const fd = new FormData();
    fd.append("id", selected.id);
    fd.append("code", code);
    fd.append("name", formName.trim());
    fd.append("department", formDept.trim());
    fd.append("level", formLevel);
    const r = await updatePosition(fd);
    setFormLoading(false);
    if (r.error) { showToast("error", r.error); setFormErr(r.error); return; }
    showToast("success", "Jabatan berhasil diupdate.");
    closeM();
    getPositions().then(setPositions);
    router.refresh();
  };

  const doDel = async () => {
    if (!selected) return;
    setFormLoading(true); setFormErr("");
    const r = await deletePosition(selected.id);
    setFormLoading(false);
    if (r.error) { showToast("error", r.error); setFormErr(r.error); return; }
    showToast("success", "Jabatan berhasil dihapus.");
    closeM();
    getPositions().then(setPositions);
    router.refresh();
  };

  const totalUnique = positions.length;
  const totalEmployees = employees.length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Jabatan", value: totalUnique, icon: <Award size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Total Karyawan", value: totalEmployees, icon: <Users size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Departemen", value: deptList.length, icon: <Briefcase size={18} />, color: "bg-amber-50 text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Cari kode atau nama jabatan..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" />
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors shrink-0">
          <Plus size={14} /> Tambah Jabatan
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-slate-400">Memuat data...</p>
        </div>
      ) : positions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Network size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500 font-bold">Belum ada data jabatan.</p>
          <p className="text-xs text-slate-400 mt-1">Tambahkan jabatan untuk mulai mengelola struktur organisasi.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(positionsByDept).map(([dept, list]) => (
            <div key={dept} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                    {dept.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{dept}</p>
                    <p className="text-[10px] text-slate-400">{list.length} jabatan</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Kode</th>
                      <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Jabatan</th>
                      <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28">Level</th>
                      <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Karyawan</th>
                      <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {list.map((pos) => {
                      const emps = empCountByPos[pos.name] || [];
                      return (
                        <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-2.5 px-4">
                            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{pos.code}</span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <Award size={12} className="text-amber-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-800">{pos.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            {pos.level ? (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{pos.level}</span>
                            ) : (
                              <span className="text-[10px] text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="text-xs font-bold text-slate-600">{emps.length}</span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEdit(pos)}
                                className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600 transition-colors" title="Edit Kode & Nama">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => openDel(pos)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors" title="Hapus">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[8vh]"
          onClick={closeM}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className={`px-5 py-4 flex items-center justify-between ${modal === "del" ? "bg-red-500" : "bg-slate-900"}`}>
              <div className="flex items-center gap-2.5">
                {modal === "add" && <Plus size={18} className="text-emerald-400" />}
                {modal === "edit" && <Edit3 size={18} className="text-sky-400" />}
                {modal === "del" && <Trash2 size={18} className="text-white" />}
                <h3 className="text-white font-bold text-sm">
                  {modal === "add" && "Tambah Jabatan Baru"}
                  {modal === "edit" && `Edit: ${selected?.name}`}
                  {modal === "del" && "Hapus Jabatan?"}
                </h3>
              </div>
              <button onClick={closeM} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>

            {modal === "del" ? (
              <div className="p-5">
                <p className="text-slate-600 text-sm mb-1">
                  Anda akan menghapus jabatan <span className="font-black text-slate-900">&ldquo;{selected?.name}&rdquo;</span>.
                  Tindakan ini tidak dapat diurungkan.
                </p>
                {formErr && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mt-3">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{formErr}</p>
                  </div>
                )}
                <div className="flex gap-3 mt-5">
                  <button onClick={closeM} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                  <button onClick={doDel} disabled={formLoading}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                    {formLoading ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Departemen <span className="text-red-500">*</span>
                  </label>
                  <select value={formDept} onChange={e => {
                    const v = e.target.value;
                    setFormDept(v);
                    if (!codeManual) regenCode(v, formLevel, modal === "edit" ? selected?.id : undefined);
                  }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all">
                    <option value="">Pilih Departemen</option>
                    {deptList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Jabatan <span className="text-red-500">*</span>
                  </label>
                  {modal === "edit" ? (
                    <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium select-none">
                      {formName}
                      <span className="ml-2 text-[10px] text-slate-400">(tidak dapat diubah)</span>
                    </div>
                  ) : (
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                      placeholder="Contoh: Staff Akuntansi"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select value={formLevel} onChange={e => {
                    const v = e.target.value;
                    setFormLevel(v);
                    if (!codeManual) regenCode(formDept, v, modal === "edit" ? selected?.id : undefined);
                  }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all">
                    <option value="">Pilih Level</option>
                    <option>Staff</option>
                    <option>Supervisor</option>
                    <option>Asisten Manajer</option>
                    <option>Manager</option>
                    <option>Kepala Divisi</option>
                    <option>Wakil Direktur</option>
                    <option>Direktur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Kode Jabatan <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="text" value={formCode} onChange={e => {
                      setFormCode(e.target.value);
                      setCodeManual(true);
                      setFormErr("");
                    }}
                      placeholder="1.2.1.0.0.0.0"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all font-mono tracking-wider" />
                    <button type="button" onClick={() => regenCode(formDept, formLevel, modal === "edit" ? selected?.id : undefined)}
                      disabled={!formDept || !formLevel}
                      className="shrink-0 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Generate ulang dari Departemen + Level">
                      <RefreshCw size={12} /> Generate
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Format: <span className="font-mono">DEPT.LEVEL.SEQ.0.0.0.0</span> (7 digit dipisah titik). Kode akan digenerate otomatis.
                  </p>
                </div>

                {formErr && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{formErr}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={closeM}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
                    Batal
                  </button>
                  <button onClick={modal === "add" ? doAdd : doEdit} disabled={formLoading}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                    {formLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
