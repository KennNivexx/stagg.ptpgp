"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Layers, AlertTriangle, X } from "lucide-react";
import { getGrades, saveGrade, deleteGrade, type GradeJabatan } from "@/app/actions/grades";
import EmptyState from "@/components/EmptyState";

function formatRupiah(n: number | null) {
  if (n == null) return "—";
  return "Rp " + n.toLocaleString("id-ID");
}

export default function GradesPage() {
  const [rows, setRows] = useState<GradeJabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GradeJabatan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GradeJabatan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [fKode, setFKode] = useState("");
  const [fNama, setFNama] = useState("");
  const [fUrutan, setFUrutan] = useState("0");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [fKet, setFKet] = useState("");

  const fetchData = async () => { setRows(await getGrades()); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };
  const resetForm = () => { setFKode(""); setFNama(""); setFUrutan("0"); setFMin(""); setFMax(""); setFKet(""); setEditing(null); };
  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (g: GradeJabatan) => {
    setEditing(g); setFKode(g.kode); setFNama(g.nama); setFUrutan(String(g.urutan));
    setFMin(g.salary_min != null ? String(g.salary_min) : ""); setFMax(g.salary_max != null ? String(g.salary_max) : "");
    setFKet(g.keterangan || ""); setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const fd = new FormData();
    if (editing) fd.append("id", editing.id);
    fd.append("kode", fKode); fd.append("nama", fNama); fd.append("urutan", fUrutan);
    fd.append("salary_min", fMin); fd.append("salary_max", fMax); fd.append("keterangan", fKet);
    const res = await saveGrade(fd);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setShowForm(false); resetForm();
    showSuccess("Grade berhasil disimpan.");
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setError("");
    const res = await deleteGrade(deleteTarget.id);
    setDeleting(false);
    if (res.error) { setError(res.error); return; }
    setDeleteTarget(null);
    showSuccess("Grade berhasil dihapus.");
    await fetchData();
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Grade & Level</h1>
          <p className="text-sm text-gray-500">Klasifikasi jabatan berdasarkan grade dan rentang gaji, dipakai sebagai acuan Master Jabatan.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={16} /> Tambah Grade
        </button>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kode *</label>
              <input required value={fKode} onChange={e => setFKode(e.target.value)} placeholder="G1"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama *</label>
              <input required value={fNama} onChange={e => setFNama(e.target.value)} placeholder="Grade 1"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Urutan</label>
              <input type="number" value={fUrutan} onChange={e => setFUrutan(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Salary Min</label>
              <input type="number" value={fMin} onChange={e => setFMin(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Salary Max</label>
              <input type="number" value={fMax} onChange={e => setFMax(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Keterangan</label>
              <input value={fKet} onChange={e => setFKet(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Grade"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Layers} title="Belum ada Grade & Level." description="Tambahkan grade pertama untuk mulai mengklasifikasikan jabatan." />
        ) : (
          <div className="divide-y divide-slate-50">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-2">Kode</div>
              <div className="col-span-3">Nama</div>
              <div className="col-span-4">Rentang Gaji</div>
              <div className="col-span-1">Urutan</div>
              <div className="col-span-2 text-right">Aksi</div>
            </div>
            {rows.map(g => (
              <div key={g.id} className="px-6 py-3 hover:bg-slate-50/40 transition-all grid grid-cols-12 gap-4 items-center cursor-pointer" onClick={() => openEdit(g)}>
                <div className="col-span-2"><span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{g.kode}</span></div>
                <div className="col-span-3 text-sm font-extrabold text-slate-800 truncate">{g.nama}</div>
                <div className="col-span-4 text-xs text-slate-500">{formatRupiah(g.salary_min)} &mdash; {formatRupiah(g.salary_max)}</div>
                <div className="col-span-1 text-xs text-slate-500">{g.urutan}</div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(g); }} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-xl border border-red-100"><AlertTriangle size={20} className="text-red-600" /></div>
                <div><h3 className="font-bold text-slate-800">Hapus Grade?</h3><p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak dapat diurungkan.</p></div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-sm text-slate-600 mb-6">Anda akan menghapus <span className="font-extrabold text-slate-800">{deleteTarget.nama}</span> secara permanen.</p>
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
