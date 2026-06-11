"use client";

import { useState } from "react";
import { Award, Code, Heart, Lightbulb, Briefcase, Plus, X, Save, Search, Pencil } from "lucide-react";

type Competency = {
  id: string;
  name: string;
  category: string;
  level: string;
  description: string;
};

const CATEGORIES = [
  { id: "teknis", label: "Teknis", icon: Code, color: "bg-blue-50 text-blue-700" },
  { id: "softskills", label: "Soft Skills", icon: Heart, color: "bg-emerald-50 text-emerald-700" },
  { id: "leadership", label: "Leadership", icon: Lightbulb, color: "bg-amber-50 text-amber-700" },
  { id: "fungsional", label: "Fungsional", icon: Briefcase, color: "bg-purple-50 text-purple-700" },
];

const LEVELS = ["Basic", "Intermediate", "Advanced", "Expert"];

const INITIAL_COMPETENCIES: Competency[] = [
  { id: "1", name: "Pemrograman Web", category: "teknis", level: "Advanced", description: "Kemampuan mengembangkan aplikasi web menggunakan framework modern" },
  { id: "2", name: "Analisis Data", category: "teknis", level: "Intermediate", description: "Kemampuan menganalisis data bisnis menggunakan tools statistik" },
  { id: "3", name: "Manajemen Database", category: "teknis", level: "Advanced", description: "Kemampuan merancang dan mengelola database perusahaan" },
  { id: "4", name: "Infrastruktur Cloud", category: "teknis", level: "Intermediate", description: "Mengelola infrastruktur cloud seperti AWS, GCP, atau Azure" },
  { id: "5", name: "Komunikasi Efektif", category: "softskills", level: "Advanced", description: "Kemampuan menyampaikan informasi dengan jelas dan persuasif" },
  { id: "6", name: "Kerja Sama Tim", category: "softskills", level: "Expert", description: "Kemampuan bekerja dalam tim lintas departemen" },
  { id: "7", name: "Problem Solving", category: "softskills", level: "Advanced", description: "Kemampuan mengidentifikasi dan menyelesaikan masalah secara sistematis" },
  { id: "8", name: "Manajemen Waktu", category: "softskills", level: "Intermediate", description: "Mengelola prioritas dan tenggat waktu secara efisien" },
  { id: "9", name: "Kepemimpinan Tim", category: "leadership", level: "Advanced", description: "Memimpin dan memotivasi tim mencapai target" },
  { id: "10", name: "Pengambilan Keputusan", category: "leadership", level: "Advanced", description: "Membuat keputusan strategis berdasarkan data dan analisis" },
  { id: "11", name: "Manajemen Proyek", category: "leadership", level: "Intermediate", description: "Merencanakan dan mengelola proyek dari awal hingga selesai" },
  { id: "12", name: "Coaching & Mentoring", category: "leadership", level: "Intermediate", description: "Membimbing dan mengembangkan kemampuan anggota tim" },
  { id: "13", name: "Manajemen Keuangan", category: "fungsional", level: "Expert", description: "Mengelola laporan keuangan, budgeting, dan analisis finansial" },
  { id: "14", name: "Manajemen SDM", category: "fungsional", level: "Advanced", description: "Mengelola siklus hidup karyawan dari rekrutmen hingga pensiun" },
  { id: "15", name: "Customer Service", category: "fungsional", level: "Intermediate", description: "Memberikan layanan pelanggan yang responsif dan profesional" },
  { id: "16", name: "Supply Chain", category: "fungsional", level: "Advanced", description: "Mengelola rantai pasok dari procurement hingga distribusi" },
];

export default function PustakaKompetensi() {
  const [competencies, setCompetencies] = useState<Competency[]>(INITIAL_COMPETENCIES);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "teknis", level: "Intermediate", description: "" });

  const filtered = competencies.filter((c) => {
    if (activeCategory && c.category !== activeCategory) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setCompetencies((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...formData } : c)));
      setEditingId(null);
    } else {
      setCompetencies([...competencies, { id: Date.now().toString(), ...formData }]);
    }
    setShowForm(false);
    setFormData({ name: "", category: "teknis", level: "Intermediate", description: "" });
  };

  const handleEdit = (comp: Competency) => {
    setEditingId(comp.id);
    setFormData({ name: comp.name, category: comp.category, level: comp.level, description: comp.description });
    setShowForm(true);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "Expert": return "bg-purple-50 text-purple-700";
      case "Advanced": return "bg-blue-50 text-blue-700";
      case "Intermediate": return "bg-amber-50 text-amber-700";
      default: return "bg-emerald-50 text-emerald-700";
    }
  };

  const getCatInfo = (catId: string) => CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Pustaka Kompetensi</h1>
          <p className="text-sm text-gray-500 mt-1">Katalog standar kompetensi perusahaan: Teknis, Soft Skills, Leadership, dan Fungsional.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({ name: "", category: "teknis", level: "Intermediate", description: "" }); setShowForm(true); }}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Kompetensi
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setActiveCategory("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!activeCategory ? "bg-[#1A2530] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Semua
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
              activeCategory === cat.id ? `${cat.color} ring-1 ring-current` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <cat.icon size={12} /> {cat.label} ({competencies.filter((c) => c.category === cat.id).length})
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kompetensi..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-56 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">{editingId ? "Edit Kompetensi" : "Tambah Kompetensi Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kompetensi</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama kompetensi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
                  <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" rows={2} placeholder="Deskripsi kompetensi..." />
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> {editingId ? "Simpan Perubahan" : "Simpan Kompetensi"}
              </button>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Award size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Tidak ada kompetensi ditemukan.</p>
          {activeCategory && <p className="text-xs text-slate-400 mt-1">Coba ubah filter kategori.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((comp) => {
            const cat = getCatInfo(comp.category);
            return (
              <div key={comp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${cat.color}`}>
                    <cat.icon size={20} />
                  </div>
                  <button onClick={() => handleEdit(comp)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 group-hover:text-slate-500 transition-colors">
                    <Pencil size={14} />
                  </button>
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mb-2">{comp.name}</h3>
                <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{comp.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${cat.color}`}>{cat.label}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${getLevelBadge(comp.level)}`}>{comp.level}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
