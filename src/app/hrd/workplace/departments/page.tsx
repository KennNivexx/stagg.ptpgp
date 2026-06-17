"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Building2, AlertTriangle, X, ArrowRight } from "lucide-react";
import { getOrgStructure, addOrgUnit, deleteOrgUnit, updateOrgUnit, moveOrgUnit } from "@/app/actions/org";
import type { OrgUnit, FlatUnit } from "@/types/org";

function flattenTree(tree: OrgUnit[]): FlatUnit[] {
  const result: FlatUnit[] = [];
  function walk(units: OrgUnit[]) {
    for (const u of units) {
      result.push({ 
        id: u.id, 
        code: u.code, 
        name: u.name, 
        level: u.level, 
        leader_name: u.leader_name, 
        leader_email: u.leader_email 
      });
      if (u.children) walk(u.children);
    }
  }
  walk(tree);
  return result;
}

const LEVEL_COLORS: Record<number, string> = {
  0: "bg-red-50 text-red-700 border border-red-200", 
  1: "bg-slate-900 text-slate-100 border border-slate-800", 
  2: "bg-red-50 text-red-600 border border-red-200", 
  3: "bg-indigo-50 text-indigo-700 border border-indigo-200", 
  4: "bg-blue-50 text-blue-700 border border-blue-200", 
  5: "bg-cyan-50 text-cyan-700 border border-cyan-200", 
  6: "bg-emerald-50 text-emerald-700 border border-emerald-200", 
  7: "bg-amber-50 text-amber-700 border border-amber-200", 
};

function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] || "bg-gray-50 text-gray-700 border border-gray-200";
}

function getLevelLabel(level: number): string {
  switch (level) {
    case 0: return "Komisaris";
    case 1: return "Direktur Utama";
    case 2: return "Wakil Direktur";
    case 3: return "Kepala Divisi (L3)";
    case 4: return "Manajer Unit (L4)";
    case 5: return "Asisten Manajer (L5)";
    case 6: return "Supervisor / Koordinator";
    case 7: return "Staf / Pelaksana";
    default: return "Staf";
  }
}

export default function DepartmentsPage() {
  const [tree, setTree] = useState<OrgUnit[]>([]);
  const [flatUnits, setFlatUnits] = useState<FlatUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [parentCode, setParentCode] = useState("");
  const [unitName, setUnitName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingUnit, setEditingUnit] = useState<FlatUnit | null>(null);
  const [editName, setEditName] = useState("");
  const [editLeaderName, setEditLeaderName] = useState("");
  const [editLeaderEmail, setEditLeaderEmail] = useState("");
  const [editLevel, setEditLevel] = useState<number>(0);
  const [editParentCode, setEditParentCode] = useState("");
  const [editing, setEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FlatUnit | null>(null);

  const fetchOrg = async () => {
    const t = await getOrgStructure();
    setTree(t);
    setFlatUnits(flattenTree(t));
    setLoading(false);
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const getParentCode = (targetCode: string): string => {
    function walk(nodes: OrgUnit[], parent: OrgUnit | null): string {
      for (const node of nodes) {
        if (node.code === targetCode) {
          return parent ? parent.code : "";
        }
        if (node.children) {
          const res = walk(node.children, node);
          if (res) return res;
        }
      }
      return "";
    }
    return walk(tree, null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);
    const fd = new FormData();
    fd.append("parent_code", parentCode);
    fd.append("unit_name", unitName);
    fd.append("leader_name", leaderName);
    fd.append("leader_email", leaderEmail);
    const res = await addOrgUnit(fd);
    if (res.error) { 
      setError(res.error); 
    } else {
      setUnitName(""); setLeaderName(""); setLeaderEmail("");
      showSuccess("Unit berhasil ditambahkan.");
      await fetchOrg();
    }
    setAdding(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setError("");
    setEditing(true);
    
    const originalParent = getParentCode(editingUnit.code);

    // 1. Update basic information and level
    const fd = new FormData();
    fd.append("unit_code", editingUnit.code);
    fd.append("unit_name", editName);
    fd.append("leader_name", editLeaderName);
    fd.append("leader_email", editLeaderEmail);
    fd.append("level", editLevel.toString());
    
    const res = await updateOrgUnit(fd);
    if (res.error) { 
      setError(res.error); 
      setEditing(false);
      return;
    }

    // 2. If parent has changed, trigger parent move
    if (editParentCode !== originalParent) {
      if (editParentCode) {
        const moveRes = await moveOrgUnit(editingUnit.code, editParentCode);
        if (moveRes.error) {
          setError(moveRes.error);
          await fetchOrg();
          setEditing(false);
          return;
        }
      }
    }

    setEditingUnit(null);
    showSuccess("Unit berhasil diperbarui.");
    await fetchOrg();
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    const res = await deleteOrgUnit(deleteTarget.code);
    if (res.error) { 
      setError(res.error); 
    } else {
      setDeleteTarget(null);
      showSuccess("Unit beserta sub-unit berhasil dihapus.");
      await fetchOrg();
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center h-64">
        <p className="text-sm text-slate-500">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Unit & Departemen Kerja</h1>
        <p className="text-sm text-gray-500">Kelola unit organisasi dalam struktur hierarki perusahaan secara dinamis.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>
      )}

      {/* Add New Unit Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-[#CC0000]" /> Tambah Unit Baru
        </h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Induk Unit (Parent) *</label>
            <select value={parentCode} onChange={(e) => setParentCode(e.target.value)} required
              className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none bg-white">
              <option value="">Pilih Induk</option>
              {flatUnits.map(u => (
                <option key={u.code} value={u.code}>{u.code} — {u.name} (L{u.level})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Unit *</label>
            <input type="text" required value={unitName} onChange={(e) => setUnitName(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none"
              placeholder="Cth: Divisi HRD" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Pejabat / Pimpinan</label>
            <input type="text" value={leaderName} onChange={(e) => setLeaderName(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none"
              placeholder="Cth: Radian, S.Sos." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Pejabat / Pimpinan</label>
            <input type="email" value={leaderEmail} onChange={(e) => setLeaderEmail(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none"
              placeholder="email@ptpgp.co.id" />
          </div>
          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <button type="submit" disabled={adding}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50">
              {adding ? "Menyimpan..." : "Simpan Unit"}
            </button>
          </div>
        </form>
      </div>

      {/* Hierarchical Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Unit Organisasi</h3>
              <p className="text-xs text-slate-400 mt-0.5">{flatUnits.length} unit terdaftar dalam sistem</p>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
          <div className="col-span-2">Kode</div>
          <div className="col-span-4">Nama Unit Organisasi</div>
          <div className="col-span-3">Pimpinan / Pejabat</div>
          <div className="col-span-2">Tingkat Jabatan</div>
          <div className="col-span-1 text-right">Aksi</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100/60">
          {flatUnits.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada unit organisasi.</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan unit untuk memulai.</p>
            </div>
          ) : (
            flatUnits.map((unit) => (
              <div key={unit.code} className="px-6 py-3.5 hover:bg-slate-50/40 transition-all grid grid-cols-12 gap-4 items-center">
                {/* Code */}
                <div className="col-span-2">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    {unit.code}
                  </span>
                </div>
                
                {/* Indented Name representing Hierarchy */}
                <div 
                  className="col-span-4 flex items-center min-w-0" 
                  style={{ paddingLeft: `${Math.max(0, unit.level - 1) * 16}px` }}
                >
                  {unit.level > 1 && (
                    <span className="text-slate-300 font-mono mr-2 select-none">└─</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-800 truncate">{unit.name}</p>
                  </div>
                </div>

                {/* Pejabat / Pimpinan info with small profile initials */}
                <div className="col-span-3 min-w-0">
                  {unit.leader_name ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-200 flex-shrink-0">
                        {unit.leader_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate leading-snug">{unit.leader_name}</p>
                        {unit.leader_email && (
                          <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{unit.leader_email}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-light italic">-</span>
                  )}
                </div>

                {/* Level Tag */}
                <div className="col-span-2">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border ${getLevelColor(unit.level)}`}>
                    L{unit.level} &bull; {getLevelLabel(unit.level)}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => {
                    setEditingUnit(unit);
                    setEditName(unit.name);
                    setEditLeaderName(unit.leader_name);
                    setEditLeaderEmail(unit.leader_email);
                    setEditLevel(unit.level);
                    setEditParentCode(getParentCode(unit.code));
                  }}
                    className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(unit)}
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Unit Modal */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingUnit(null)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800">Edit Unit Organisasi</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">KODE: {editingUnit.code}</p>
              </div>
              <button onClick={() => setEditingUnit(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Unit</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Pejabat / Pimpinan</label>
                <input type="text" value={editLeaderName} onChange={(e) => setEditLeaderName(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Pejabat / Pimpinan</label>
                <input type="email" value={editLeaderEmail} onChange={(e) => setEditLeaderEmail(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
              </div>

              {/* Tingkat Jabatan (Level) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tingkat Jabatan (Level)</label>
                <select value={editLevel} onChange={(e) => setEditLevel(Number(e.target.value))}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none bg-white">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(lvl => (
                    <option key={lvl} value={lvl}>L{lvl} &mdash; {getLevelLabel(lvl)}</option>
                  ))}
                </select>
              </div>

              {/* Reparenting (Move parent) */}
              {editingUnit.level > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pindahkan ke Induk Baru (Reparent)</label>
                  <select value={editParentCode} onChange={(e) => setEditParentCode(e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none bg-white">
                    <option value="">Pilih Induk Baru</option>
                    {flatUnits
                      .filter(u => u.code !== editingUnit.code && !u.code.startsWith(editingUnit.code + "."))
                      .map(u => (
                        <option key={u.code} value={u.code}>{u.code} — {u.name} (L{u.level})</option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-50">
                <button type="button" onClick={() => setEditingUnit(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={editing}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl disabled:opacity-50 transition-colors">
                  {editing ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100"><AlertTriangle size={20} className="text-red-600" /></div>
              <div>
                <h3 className="font-bold text-slate-800">Hapus Unit Organisasi?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Semua sub-unit di bawahnya juga akan dihapus permanen.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Anda akan menghapus <span className="font-extrabold text-slate-800">{deleteTarget.code} &mdash; {deleteTarget.name}</span> beserta seluruh unit turunannya. Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
              <button type="button" onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
