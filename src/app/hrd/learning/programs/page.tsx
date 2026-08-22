"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Clock, Users, MapPin, Plus, X, Save, Search, Pencil, Trash2 } from "lucide-react";
import { getTrainings, saveTraining, deleteTraining } from "@/app/actions/trainings";

type Program = {
  id: string;
  title: string;
  category: string | null;
  durasi_jam: number | null;
  instruktur: string | null;
  status: string;
  description: string;
  date_start: string;
  date_end: string;
  enrollment_count: number;
};

const CATEGORIES = ["Leadership", "K3", "Teknis", "Soft Skills", "Sertifikasi"];
// Matches trainings.ts's VALID_STATUSES exactly — this page reads/writes the
// same `pelatihan` table as /hrd/learning/trainings via the same actions.
const STATUSES = ["Planned", "Ongoing", "Completed", "Cancelled"];

const emptyForm = {
  title: "", category: "Teknis", durasi_jam: "", instruktur: "",
  status: "Planned", description: "", date_start: "", date_end: "",
};

export default function ProgramPelatihan() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Planned");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getTrainings().then((data) => {
      setPrograms(data as unknown as Program[]);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const filtered = programs.filter((p) => {
    if (activeTab && p.status !== activeTab) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData();
    if (editingId) fd.set("id", editingId);
    fd.set("title", formData.title);
    fd.set("category", formData.category);
    fd.set("durasi_jam", formData.durasi_jam);
    fd.set("instruktur", formData.instruktur);
    fd.set("status", formData.status);
    fd.set("description", formData.description);
    fd.set("date_start", formData.date_start);
    fd.set("date_end", formData.date_end);
    const res = await saveTraining(fd);
    setSaving(false);
    if ("error" in res) { setError(res.error || "Gagal menyimpan program."); return; }
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    load();
  };

  const handleEdit = (prog: Program) => {
    setEditingId(prog.id);
    setFormData({
      title: prog.title, category: prog.category || "Teknis",
      durasi_jam: prog.durasi_jam != null ? String(prog.durasi_jam) : "",
      instruktur: prog.instruktur || "", status: prog.status,
      description: prog.description || "", date_start: prog.date_start || "", date_end: prog.date_end || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus program pelatihan ini? Peserta yang terdaftar juga akan dihapus.")) return;
    const res = await deleteTraining(id);
    if ("error" in res) { alert(res.error); return; }
    load();
  };

  const getStatusColor = (s: string) => {
    if (s === "Ongoing") return "bg-blue-50 text-blue-700";
    if (s === "Planned") return "bg-amber-50 text-amber-700";
    if (s === "Completed") return "bg-emerald-50 text-emerald-700";
    return "bg-slate-100 text-slate-500";
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Program Pelatihan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola program pelatihan dan pengembangan karyawan perusahaan.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData(emptyForm); setError(""); setShowForm(true); }}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Program
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === s ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s} ({programs.filter((p) => p.status === s).length})
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari program..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-56 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">{editingId ? "Edit Program" : "Tambah Program Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Program</label>
                <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama program pelatihan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (jam)</label>
                  <input type="number" min={0} value={formData.durasi_jam} onChange={(e) => setFormData({ ...formData, durasi_jam: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Contoh: 16" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input type="date" required value={formData.date_start} onChange={(e) => setFormData({ ...formData, date_start: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input type="date" required value={formData.date_end} onChange={(e) => setFormData({ ...formData, date_end: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instruktur</label>
                <input value={formData.instruktur} onChange={(e) => setFormData({ ...formData, instruktur: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama instruktur" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" rows={2} placeholder="Deskripsi program..." />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Program"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-slate-500">Memuat data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <GraduationCap size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Tidak ada program pelatihan ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prog) => (
            <div key={prog.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(prog.status)}`}>{prog.status}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(prog)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 group-hover:text-slate-500 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(prog.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 group-hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-extrabold text-sm text-slate-800 mb-2">{prog.title}</h3>
              <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{prog.description}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 mb-3">
                {prog.durasi_jam != null && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg">
                    <Clock size={10} /> {prog.durasi_jam} jam
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg">
                  <Users size={10} /> {prog.enrollment_count} peserta
                </span>
              </div>
              <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                <MapPin size={11} className="text-slate-400" />
                <p className="text-[10px] text-slate-500">{prog.instruktur || "Belum ditentukan"}</p>
                {prog.category && <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{prog.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
