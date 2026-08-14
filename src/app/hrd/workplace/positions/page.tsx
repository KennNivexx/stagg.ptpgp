"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Briefcase, AlertTriangle, X, Search, ShieldCheck, ArrowUpDown } from "lucide-react";
import { getMasterJabatan, addPosition, updatePosition, deletePosition, type MasterJabatan } from "@/app/actions/positions";
import { getGrades, type GradeJabatan } from "@/app/actions/grades";
import { getDepartments } from "@/app/actions/org";
import EmptyState from "@/components/EmptyState";
import { ORG_LEVELS, levelRank } from "@/lib/org-levels";

const LEVELS = ORG_LEVELS;

/**
 * Master Jabatan: katalog jenis jabatan (bukan jumlah posisi — itu diatur di
 * Position Management/Formasi). CRUD penuh menggantikan monitor read-only
 * lama yang auto-derive dari data karyawan.
 */
export default function MasterJabatanPage() {
  const [rows, setRows] = useState<MasterJabatan[]>([]);
  const [grades, setGrades] = useState<GradeJabatan[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelSort, setLevelSort] = useState<"senior-first" | "junior-first" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MasterJabatan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasterJabatan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [fCode, setFCode] = useState("");
  const [fName, setFName] = useState("");
  const [fDept, setFDept] = useState("");
  const [fLevel, setFLevel] = useState("Staff");
  const [fGrade, setFGrade] = useState("");
  const [fKepala, setFKepala] = useState(false);
  const [fStatus, setFStatus] = useState("Aktif");

  const fetchData = async () => {
    const [j, g, d] = await Promise.all([getMasterJabatan(), getGrades(), getDepartments()]);
    setRows(j); setGrades(g); setDepartments(d.map(x => x.name));
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const resetForm = () => {
    setFCode(""); setFName(""); setFDept(""); setFLevel("Staff"); setFGrade(""); setFKepala(false); setFStatus("Aktif");
    setEditing(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (r: MasterJabatan) => {
    setEditing(r); setFCode(r.code); setFName(r.name); setFDept(r.department); setFLevel(r.level || "Staff");
    setFGrade(r.grade_id || ""); setFKepala(r.is_kepala_unit); setFStatus(r.status);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const fd = new FormData();
    if (editing) fd.append("id", editing.id);
    fd.append("code", fCode); fd.append("name", fName); fd.append("department", fDept);
    fd.append("level", fLevel); fd.append("grade_id", fGrade); fd.append("is_kepala_unit", fKepala ? "true" : "false");
    fd.append("status", fStatus);
    const res = editing ? await updatePosition(fd) : await addPosition(fd);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setShowForm(false); resetForm();
    showSuccess(editing ? "Jabatan berhasil diupdate." : "Jabatan baru berhasil ditambahkan.");
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setError("");
    const res = await deletePosition(deleteTarget.id);
    setDeleting(false);
    if (res.error) { setError(res.error); return; }
    setDeleteTarget(null);
    showSuccess("Jabatan berhasil dihapus.");
    await fetchData();
  };

  const filtered = rows
    .filter(r => !search.trim() || r.name.toLowerCase().includes(search.toLowerCase()) || r.code.includes(search) || r.department.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!levelSort) return 0;
      const diff = levelRank(a.level) - levelRank(b.level); // ascending = most senior first
      return levelSort === "senior-first" ? diff : -diff;
    });

  const toggleLevelSort = () => {
    setLevelSort(prev => prev === null ? "senior-first" : prev === "senior-first" ? "junior-first" : null);
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Master Jabatan</h1>
          <p className="text-sm text-gray-500">Katalog jenis jabatan (Job Family) — mendefinisikan jenis jabatan, bukan jumlah posisi. Jumlah posisi diatur di Position Management (Formasi).</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={16} /> Tambah Jabatan
        </button>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kode Jabatan *</label>
              <input required value={fCode} onChange={e => setFCode(e.target.value)} placeholder="Cth: 1.1.1.0.0.0.0"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm font-mono focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Jabatan *</label>
              <input required value={fName} onChange={e => setFName(e.target.value)} placeholder="Cth: Operator"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Departemen</label>
              <select value={fDept} onChange={e => setFDept(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none">
                <option value="">Umum (tidak terikat departemen)</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Level</label>
              <select value={fLevel} onChange={e => setFLevel(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Grade</label>
              <select value={fGrade} onChange={e => setFGrade(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none">
                <option value="">— Belum ditentukan —</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.kode} — {g.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
              <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none">
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <input type="checkbox" checked={fKepala} onChange={e => setFKepala(e.target.checked)} className="rounded border-gray-300" />
            Jabatan ini adalah Kepala Unit (kepemimpinan unit akan otomatis mengikuti siapa yang menempati posisi ini)
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Jabatan"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-blue-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">{rows.length} jabatan terdaftar</h3>
          </div>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode, nama, atau departemen..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Briefcase} title="Belum ada jabatan." description="Tambahkan jabatan pertama untuk memulai Master Jabatan." />
        ) : (
          <div className="divide-y divide-slate-50">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-2">Kode</div>
              <div className="col-span-3">Nama</div>
              <div className="col-span-2">Departemen</div>
              <button type="button" onClick={toggleLevelSort} className="col-span-2 flex items-center gap-1 text-left hover:text-slate-600 transition-colors">
                Level / Grade <ArrowUpDown size={11} className={levelSort ? "text-[#CC0000]" : ""} />
                {levelSort && <span className="normal-case font-semibold text-[8px] text-slate-400">({levelSort === "senior-first" ? "senior→junior" : "junior→senior"})</span>}
              </button>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Aksi</div>
            </div>
            {filtered.map(r => (
              <div key={r.id} className="px-6 py-3 hover:bg-slate-50/40 transition-all grid grid-cols-12 gap-4 items-center cursor-pointer" onClick={() => openEdit(r)}>
                <div className="col-span-2"><span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{r.code}</span></div>
                <div className="col-span-3 min-w-0 flex items-center gap-1.5">
                  <p className="text-sm font-extrabold text-slate-800 truncate">{r.name}</p>
                  {r.is_kepala_unit && <ShieldCheck size={13} className="text-indigo-500 shrink-0" />}
                </div>
                <div className="col-span-2 text-xs text-slate-500 truncate">{r.department || "Umum"}</div>
                <div className="col-span-2 text-xs text-slate-500 truncate">{r.level || "—"} {r.grade_name ? `· ${r.grade_name}` : ""}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold border ${r.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{r.status}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(r); }}
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
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
                <div><h3 className="font-bold text-slate-800">Hapus Jabatan?</h3><p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak dapat diurungkan.</p></div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-sm text-slate-600 mb-6">Anda akan menghapus <span className="font-extrabold text-slate-800">{deleteTarget.name}</span> secara permanen.</p>
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
