"use client";

import { useState, useEffect, useMemo } from "react";
import { Book, FileText, Video, Presentation, Upload, Search, X, Save, FolderOpen, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getTrainings } from "@/app/actions/trainings";
import { getTrainingMaterials, saveTrainingMaterial, deleteTrainingMaterial } from "@/app/actions/trainings";
import EmptyState from "@/components/EmptyState";

type Training = { id: string; title: string };
type Material = {
  id: string;
  training_id: string;
  title: string;
  type: string;
  file_size: string | null;
  created_at: string;
};

const MATERIAL_TYPES = ["PDF", "PPT", "Video", "Template", "File"];

const typeIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  PDF: FileText,
  PPT: Presentation,
  Video: Video,
  Template: FileText,
  File: FileText,
};

const typeColors: Record<string, string> = {
  PDF: "bg-red-50 text-red-700",
  PPT: "bg-orange-50 text-orange-700",
  Video: "bg-blue-50 text-blue-700",
  Template: "bg-purple-50 text-purple-700",
  File: "bg-slate-100 text-slate-600",
};

export default function MateriPelatihan() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", training_id: "", type: "PDF" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, m] = await Promise.all([getTrainings(), getTrainingMaterials()]);
      setTrainings((t as Record<string, unknown>[]).map((x) => ({ id: x.id as string, title: x.title as string })));
      setMaterials(m as Material[]);
    } catch {
      showToast("error", "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const trainingMap = useMemo(() => {
    const map: Record<string, string> = {};
    trainings.forEach((t) => { map[t.id] = t.title; });
    return map;
  }, [trainings]);

  const filtered = materials.filter((m) => {
    const programName = trainingMap[m.training_id] || "";
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase()) && !programName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType && m.type !== filterType) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("training_id", formData.training_id);
    fd.append("title", formData.title);
    fd.append("type", formData.type);
    const r = await saveTrainingMaterial(fd);
    setSaving(false);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Materi berhasil ditambahkan.");
    setShowForm(false);
    setFormData({ title: "", training_id: "", type: "PDF" });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus materi ini?")) return;
    const r = await deleteTrainingMaterial(id);
    if (r?.error) { showToast("error", r.error); return; }
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    showToast("success", "Materi berhasil dihapus.");
  };

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Materi Pelatihan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola materi, modul, dan bahan ajar — mengikuti program training yang sudah ada.</p>
        </div>
        <button
          onClick={() => { setFormData({ title: "", training_id: "", type: "PDF" }); setShowForm(true); }}
          disabled={trainings.length === 0}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Upload size={14} /> Unggah Materi
        </button>
      </div>

      {!loading && trainings.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Belum ada program training. Buat program training terlebih dahulu di halaman <b>Training</b> sebelum menambahkan materi.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setFilterType("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!filterType ? "bg-[#1A2530] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Semua ({materials.length})
        </button>
        {MATERIAL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
              filterType === t ? `${typeColors[t]} ring-1 ring-current` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {(() => { const Icon = typeIcons[t]; return <Icon size={12} />; })()}
            {t} ({materials.filter((m) => m.type === t).length})
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari materi..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-56 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Unggah Materi Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Materi</label>
                <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Judul materi" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Program Pelatihan</label>
                <select required value={formData.training_id} onChange={(e) => setFormData({ ...formData, training_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Program</option>
                  {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe File</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs">
                Unggah file belum tersedia — catat metadata materi di sini terlebih dahulu.
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Book} title="Tidak ada materi ditemukan." description="Unggah materi pertama untuk program pelatihan yang ada." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mat) => {
            const Icon = typeIcons[mat.type] || FileText;
            const color = typeColors[mat.type] || "bg-slate-100 text-slate-600";
            return (
              <div key={mat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl inline-block mb-3 ${color}`}>
                    <Icon size={22} />
                  </div>
                  <button onClick={() => handleDelete(mat.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mb-1 line-clamp-2 group-hover:text-[#CC0000] transition-colors">{mat.title}</h3>
                <p className="text-[10px] text-slate-400 mb-3 flex items-center gap-1">
                  <FolderOpen size={10} /> {trainingMap[mat.training_id] || "Program tidak ditemukan"}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${color}`}>{mat.type}</span>
                  <p className="text-[8px] text-slate-400">{new Date(mat.created_at).toLocaleDateString("id-ID")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
