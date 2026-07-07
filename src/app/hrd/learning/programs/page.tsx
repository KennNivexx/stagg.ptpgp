"use client";

import { useState } from "react";
import { GraduationCap, Clock, Users, MapPin, Plus, X, Save, Search, Pencil } from "lucide-react";

type Program = {
  id: string;
  name: string;
  category: string;
  duration: string;
  instructor: string;
  maxParticipants: number;
  status: string;
  description: string;
};

const INITIAL_PROGRAMS: Program[] = [
  { id: "1", name: "Pelatihan Kepemimpinan Dasar", category: "Leadership", duration: "3 Hari", instructor: "Dr. Ahmad Fauzi", maxParticipants: 30, status: "Aktif", description: "Program pengembangan kemampuan kepemimpinan bagi supervisor dan manajer baru" },
  { id: "2", name: "Workshop Keselamatan Kerja", category: "K3", duration: "2 Hari", instructor: "Budi Hartono, S.K3", maxParticipants: 50, status: "Aktif", description: "Pelatihan standar keselamatan dan kesehatan kerja sesuai regulasi" },
  { id: "3", name: "Microsoft Excel Advanced", category: "Teknis", duration: "5 Hari", instructor: "Rina Kusuma", maxParticipants: 20, status: "Aktif", description: "Pelatihan Excel tingkat lanjut untuk analisis data bisnis" },
  { id: "4", name: "Service Excellence", category: "Soft Skills", duration: "2 Hari", instructor: "Maya Indriani", maxParticipants: 40, status: "Aktif", description: "Meningkatkan kualitas layanan pelanggan dan komunikasi" },
  { id: "5", name: "Manajemen Proyek Profesional", category: "Leadership", duration: "5 Hari", instructor: "Irwan Setiawan, PMP", maxParticipants: 25, status: "Planned", description: "Persiapan sertifikasi manajemen proyek untuk project manager" },
  { id: "6", name: "Digital Marketing Basic", category: "Teknis", duration: "3 Hari", instructor: "Dian Purnama", maxParticipants: 30, status: "Planned", description: "Pengenalan strategi pemasaran digital dan media sosial" },
  { id: "7", name: "Pelatihan ISO 9001", category: "Sertifikasi", duration: "4 Hari", instructor: "Tim Konsultan", maxParticipants: 15, status: "Completed", description: "Pemahaman dan implementasi standar mutu ISO 9001:2015" },
  { id: "8", name: "Effective Communication", category: "Soft Skills", duration: "2 Hari", instructor: "Sarah Amalia", maxParticipants: 35, status: "Completed", description: "Teknik komunikasi efektif di lingkungan kerja" },
];

const CATEGORIES = ["Leadership", "K3", "Teknis", "Soft Skills", "Sertifikasi"];
const STATUSES = ["Aktif", "Planned", "Completed"];

export default function ProgramPelatihan() {
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [activeTab, setActiveTab] = useState("Aktif");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "Teknis", duration: "", instructor: "", maxParticipants: 20, status: "Planned", description: "" });

  const filtered = programs.filter((p) => {
    if (activeTab && p.status !== activeTab) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setPrograms((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...formData } : p)));
      setEditingId(null);
    } else {
      setPrograms([...programs, { id: Date.now().toString(), ...formData }]);
    }
    setShowForm(false);
    setFormData({ name: "", category: "Teknis", duration: "", instructor: "", maxParticipants: 20, status: "Planned", description: "" });
  };

  const handleEdit = (prog: Program) => {
    setEditingId(prog.id);
    setFormData({ name: prog.name, category: prog.category, duration: prog.duration, instructor: prog.instructor, maxParticipants: prog.maxParticipants, status: prog.status, description: prog.description });
    setShowForm(true);
  };

  const getStatusColor = (s: string) => {
    if (s === "Aktif") return "bg-emerald-50 text-emerald-700";
    if (s === "Planned") return "bg-amber-50 text-amber-700";
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
          onClick={() => { setEditingId(null); setFormData({ name: "", category: "Teknis", duration: "", instructor: "", maxParticipants: 20, status: "Planned", description: "" }); setShowForm(true); }}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Program</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama program pelatihan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi</label>
                  <input required value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Contoh: 3 Hari" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instruktur</label>
                  <input required value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama instruktur" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Peserta</label>
                  <input type="number" required value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" min={1} />
                </div>
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
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> {editingId ? "Simpan Perubahan" : "Simpan Program"}
              </button>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
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
                <button onClick={() => handleEdit(prog)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 group-hover:text-slate-500 transition-colors">
                  <Pencil size={14} />
                </button>
              </div>
              <h3 className="font-extrabold text-sm text-slate-800 mb-2">{prog.name}</h3>
              <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{prog.description}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 mb-3">
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg">
                  <Clock size={10} /> {prog.duration}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg">
                  <Users size={10} /> Max {prog.maxParticipants}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                <MapPin size={11} className="text-slate-400" />
                <p className="text-[10px] text-slate-500">{prog.instructor}</p>
                <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{prog.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
