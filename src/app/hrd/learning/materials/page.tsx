"use client";

import { useState } from "react";
import { Book, FileText, Video, Presentation, Upload, Search, Plus, X, Save, FolderOpen } from "lucide-react";

type Material = {
  id: string;
  title: string;
  program: string;
  type: string;
  uploadDate: string;
  size: string;
};

const INITIAL_MATERIALS: Material[] = [
  { id: "1", title: "Modul Kepemimpinan Dasar", program: "Pelatihan Kepemimpinan Dasar", type: "PDF", uploadDate: "2026-06-01", size: "2.4 MB" },
  { id: "2", title: "Presentasi Kepemimpinan", program: "Pelatihan Kepemimpinan Dasar", type: "PPT", uploadDate: "2026-06-02", size: "5.1 MB" },
  { id: "3", title: "Video Simulasi Kepemimpinan", program: "Pelatihan Kepemimpinan Dasar", type: "Video", uploadDate: "2026-06-03", size: "128 MB" },
  { id: "4", title: "Panduan K3 Lengkap", program: "Workshop Keselamatan Kerja", type: "PDF", uploadDate: "2026-05-20", size: "3.8 MB" },
  { id: "5", title: "Presentasi APD", program: "Workshop Keselamatan Kerja", type: "PPT", uploadDate: "2026-05-21", size: "4.2 MB" },
  { id: "6", title: "Video Prosedur Darurat", program: "Workshop Keselamatan Kerja", type: "Video", uploadDate: "2026-05-22", size: "245 MB" },
  { id: "7", title: "Modul Excel Advanced", program: "Microsoft Excel Advanced", type: "PDF", uploadDate: "2026-06-10", size: "1.9 MB" },
  { id: "8", title: "Latihan Excel Dataset", program: "Microsoft Excel Advanced", type: "File", uploadDate: "2026-06-10", size: "850 KB" },
  { id: "9", title: "Modul Service Excellence", program: "Service Excellence", type: "PDF", uploadDate: "2026-06-15", size: "2.1 MB" },
  { id: "10", title: "Video Roleplay Customer Service", program: "Service Excellence", type: "Video", uploadDate: "2026-06-16", size: "180 MB" },
  { id: "11", title: "Modul Manajemen Proyek", program: "Manajemen Proyek Profesional", type: "PDF", uploadDate: "2026-06-20", size: "4.5 MB" },
  { id: "12", title: "Template Project Charter", program: "Manajemen Proyek Profesional", type: "Template", uploadDate: "2026-06-20", size: "1.2 MB" },
];

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
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", program: "", type: "PDF" });

  const programList = [...new Set(materials.map((m) => m.program))];

  const filtered = materials.filter((m) => {
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase()) && !m.program.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType && m.type !== filterType) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMat: Material = {
      id: Date.now().toString(),
      title: formData.title,
      program: formData.program,
      type: formData.type,
      uploadDate: new Date().toISOString().split("T")[0],
      size: "-",
    };
    setMaterials([newMat, ...materials]);
    setShowForm(false);
    setFormData({ title: "", program: "", type: "PDF" });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Materi Pelatihan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola materi, modul, dan bahan ajar untuk setiap program pelatihan.</p>
        </div>
        <button
          onClick={() => { setFormData({ title: "", program: "", type: "PDF" }); setShowForm(true); }}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Upload size={14} /> Unggah Materi
        </button>
      </div>

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
                <select required value={formData.program} onChange={(e) => setFormData({ ...formData, program: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Program</option>
                  {programList.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe File</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#CC0000] transition-colors cursor-pointer">
                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-500">Klik atau seret file ke sini</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, PPT, Video (Max 500MB)</p>
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Unggah
              </button>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Book size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Tidak ada materi ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mat) => {
            const Icon = typeIcons[mat.type] || FileText;
            const color = typeColors[mat.type] || "bg-slate-100 text-slate-600";
            return (
              <div key={mat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group cursor-pointer">
                <div className={`p-3 rounded-xl inline-block mb-3 ${color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mb-1 line-clamp-2 group-hover:text-[#CC0000] transition-colors">{mat.title}</h3>
                <p className="text-[10px] text-slate-400 mb-3 flex items-center gap-1">
                  <FolderOpen size={10} /> {mat.program}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${color}`}>{mat.type}</span>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500">{mat.size}</p>
                    <p className="text-[8px] text-slate-400">{new Date(mat.uploadDate).toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
