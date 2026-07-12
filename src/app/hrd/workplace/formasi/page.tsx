"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Users, AlertTriangle, X, UserPlus, UserMinus } from "lucide-react";
import { getFormasiList, createFormasi, deleteFormasi, assignKaryawan, unassignKaryawan, getUnassignedActiveEmployees, type FormasiRow } from "@/app/actions/formasi";
import { getMasterJabatan, type MasterJabatan } from "@/app/actions/positions";
import { getOrgStructure } from "@/app/actions/org";
import type { OrgUnit } from "@/types/org";
import EmptyState from "@/components/EmptyState";

function flattenUnits(tree: OrgUnit[]): { id: string; code: string; name: string }[] {
  const out: { id: string; code: string; name: string }[] = [];
  const walk = (n: OrgUnit) => { if (!n.isEmployee) { out.push({ id: n.id, code: n.code, name: n.name }); n.children.forEach(walk); } };
  tree.forEach(walk);
  return out;
}

export default function FormasiPage() {
  const [rows, setRows] = useState<FormasiRow[]>([]);
  const [units, setUnits] = useState<{ id: string; code: string; name: string }[]>([]);
  const [jabatans, setJabatans] = useState<MasterJabatan[]>([]);
  const [unassigned, setUnassigned] = useState<{ id: string; full_name: string; position: string; department: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fUnit, setFUnit] = useState("");
  const [fJabatan, setFJabatan] = useState("");
  const [fKet, setFKet] = useState("");

  const [assignTarget, setAssignTarget] = useState<FormasiRow | null>(null);
  const [assignKaryawanId, setAssignKaryawanId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormasiRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    const [f, j, tree, u] = await Promise.all([getFormasiList(), getMasterJabatan(), getOrgStructure(), getUnassignedActiveEmployees()]);
    setRows(f); setJabatans(j); setUnits(flattenUnits(tree)); setUnassigned(u);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const stats = useMemo(() => ({
    total: rows.length, filled: rows.filter(r => r.status === "Filled").length, vacant: rows.filter(r => r.status === "Vacant").length,
  }), [rows]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const fd = new FormData();
    fd.append("unit_organisasi_id", fUnit); fd.append("jabatan_id", fJabatan); fd.append("keterangan", fKet);
    const res = await createFormasi(fd);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setFUnit(""); setFJabatan(""); setFKet(""); setShowForm(false);
    showSuccess(`Position Number ${res.position_number} berhasil dibuat.`);
    await fetchData();
  };

  const handleAssign = async () => {
    if (!assignTarget || !assignKaryawanId) return;
    setAssigning(true); setError("");
    const res = await assignKaryawan(assignTarget.id, assignKaryawanId);
    setAssigning(false);
    if (res.error) { setError(res.error); return; }
    setAssignTarget(null); setAssignKaryawanId("");
    showSuccess("Karyawan berhasil ditempatkan.");
    await fetchData();
  };

  const handleUnassign = async (row: FormasiRow) => {
    setError("");
    const res = await unassignKaryawan(row.id);
    if (res.error) { setError(res.error); return; }
    showSuccess("Penempatan dilepas.");
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setError("");
    const res = await deleteFormasi(deleteTarget.id);
    setDeleting(false);
    if (res.error) { setError(res.error); return; }
    setDeleteTarget(null);
    showSuccess("Position Number dihapus.");
    await fetchData();
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Position Management (Formasi)</h1>
          <p className="text-sm text-gray-500">Setiap jabatan pada unit organisasi punya Position Number unik — memantau formasi terisi, kosong, dan kebutuhan rekrutmen secara real-time.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl transition-colors">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Batal" : "Tambah Formasi"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Total Formasi</p><p className="text-2xl font-black text-slate-800">{stats.total}</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Terisi</p><p className="text-2xl font-black text-emerald-600">{stats.filled}</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"><p className="text-[10px] font-bold text-slate-400 uppercase">Kosong</p><p className="text-2xl font-black text-amber-600">{stats.vacant}</p></div>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit Organisasi *</label>
              <select required value={fUnit} onChange={e => setFUnit(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none">
                <option value="">Pilih Unit</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jabatan *</label>
              <select required value={fJabatan} onChange={e => setFJabatan(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none">
                <option value="">Pilih Jabatan</option>
                {jabatans.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Keterangan</label>
              <input value={fKet} onChange={e => setFKet(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Buat Position Number"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada Position Number." description="Tambahkan formasi untuk mulai mengelola kapasitas organisasi." />
        ) : (
          <div className="divide-y divide-slate-50">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-2">Position #</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-2">Jabatan</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Karyawan</div>
              <div className="col-span-3 text-right">Aksi</div>
            </div>
            {rows.map(r => (
              <div key={r.id} className="px-6 py-3 hover:bg-slate-50/40 transition-all grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2"><span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{r.position_number}</span></div>
                <div className="col-span-2 text-xs text-slate-600 truncate">{r.unit_name}</div>
                <div className="col-span-2 text-xs text-slate-600 truncate">{r.jabatan_name}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold border ${r.status === "Filled" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{r.status}</span>
                </div>
                <div className="col-span-2 text-xs font-semibold text-slate-700 truncate">{r.karyawan_name || "—"}</div>
                <div className="col-span-3 flex items-center justify-end gap-1">
                  {r.status === "Vacant" ? (
                    <button onClick={() => setAssignTarget(r)} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors">
                      <UserPlus size={12} /> Assign
                    </button>
                  ) : (
                    <button onClick={() => handleUnassign(r)} className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-bold transition-colors">
                      <UserMinus size={12} /> Lepas
                    </button>
                  )}
                  <button onClick={() => setDeleteTarget(r)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAssignTarget(null)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Assign Karyawan ke {assignTarget.position_number}</h3>
              <button onClick={() => setAssignTarget(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <select value={assignKaryawanId} onChange={e => setAssignKaryawanId(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none mb-4">
              <option value="">Pilih Karyawan</option>
              {unassigned.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.position || "—"})</option>)}
            </select>
            {unassigned.length === 0 && <p className="text-xs text-slate-400 mb-4">Semua karyawan aktif sudah menempati Position Number.</p>}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setAssignTarget(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
              <button type="button" onClick={handleAssign} disabled={assigning || !assignKaryawanId} className="px-4 py-2 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50">
                {assigning ? "Menyimpan..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-xl border border-red-100"><AlertTriangle size={20} className="text-red-600" /></div>
                <div><h3 className="font-bold text-slate-800">Hapus Position Number?</h3><p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak dapat diurungkan.</p></div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-sm text-slate-600 mb-6">Anda akan menghapus <span className="font-extrabold text-slate-800">{deleteTarget.position_number}</span> secara permanen.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50">
                {deleting ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
