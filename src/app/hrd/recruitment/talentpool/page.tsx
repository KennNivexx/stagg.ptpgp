"use client";

import { useState } from "react";
import { Star, Search, Plus, X, Save, User, Briefcase, Award, MapPin, Tag } from "lucide-react";

type Talent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  source: string;
  notes: string;
  status: string;
  addedAt: string;
};

const INITIAL_TALENTS: Talent[] = [
  { id: "1", name: "Budi Santoso", email: "budi@email.com", phone: "0812-3456-7890", skills: ["React", "Node.js", "TypeScript"], experience: "Senior", source: "LinkedIn", notes: "Kandidat kuat, pengalaman 5 tahun di startup", status: "Aktif", addedAt: "2026-04-15" },
  { id: "2", name: "Siti Rahayu", email: "siti@email.com", phone: "0813-4567-8901", skills: ["Project Management", "Agile", "Scrum"], experience: "Mid-Level", source: "Referral", notes: "Direkomendasikan oleh Manager IT", status: "Aktif", addedAt: "2026-05-01" },
  { id: "3", name: "Andre Wijaya", email: "andre@email.com", phone: "0814-5678-9012", skills: ["Data Science", "Python", "SQL"], experience: "Senior", source: "JobStreet", notes: "Berpengalaman di bidang data analytics", status: "Aktif", addedAt: "2026-03-20" },
  { id: "4", name: "Dewi Lestari", email: "dewi@email.com", phone: "0815-6789-0123", skills: ["UI/UX Design", "Figma", "Adobe XD"], experience: "Mid-Level", source: "Instagram", notes: "Portfolio desain sangat menarik", status: "Aktif", addedAt: "2026-05-10" },
  { id: "5", name: "Rian Permana", email: "rian@email.com", phone: "0816-7890-1234", skills: ["DevOps", "AWS", "Docker"], experience: "Junior", source: "Kampus", notes: "Fresh graduate potensial", status: "Aktif", addedAt: "2026-06-01" },
  { id: "6", name: "Maya Indah", email: "maya@email.com", phone: "0817-8901-2345", skills: ["Accounting", "Finance", "Excel"], experience: "Mid-Level", source: "LinkedIn", notes: "Pengalaman finance 3 tahun", status: "Aktif", addedAt: "2026-02-28" },
];

const skillOptions = ["React", "Node.js", "TypeScript", "Python", "SQL", "Project Management", "Agile", "Scrum", "Data Science", "DevOps", "AWS", "Docker", "UI/UX Design", "Figma", "Adobe XD", "Accounting", "Finance", "Excel", "Java", "Go", "Kubernetes", "Flutter", "Vue.js", "Angular"];

const experienceLevels = ["Junior", "Mid-Level", "Senior", "Expert"];

export default function TalentPool() {
  const [talents, setTalents] = useState<Talent[]>(INITIAL_TALENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterExp, setFilterExp] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", skills: "" as string, experience: "Mid-Level", source: "", notes: "",
  });

  const filtered = talents.filter((t) => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    if (filterSkill && !t.skills.some((s) => s.toLowerCase().includes(filterSkill.toLowerCase()))) return false;
    if (filterExp && t.experience !== filterExp) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTalent: Talent = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      experience: formData.experience,
      source: formData.source,
      notes: formData.notes,
      status: "Aktif",
      addedAt: new Date().toISOString().split("T")[0],
    };
    setTalents([newTalent, ...talents]);
    setShowForm(false);
    setFormData({ name: "", email: "", phone: "", skills: "", experience: "Mid-Level", source: "", notes: "" });
  };

  const getExpBadge = (exp: string) => {
    switch (exp) {
      case "Senior": return "bg-amber-50 text-amber-700";
      case "Mid-Level": return "bg-blue-50 text-blue-700";
      case "Junior": return "bg-emerald-50 text-emerald-700";
      case "Expert": return "bg-purple-50 text-purple-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getSkillColor = (idx: number) => {
    const colors = ["bg-blue-50 text-blue-700", "bg-emerald-50 text-emerald-700", "bg-amber-50 text-amber-700", "bg-purple-50 text-purple-700", "bg-rose-50 text-rose-700", "bg-cyan-50 text-cyan-700"];
    return colors[idx % colors.length];
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Talent Pool</h1>
          <p className="text-sm text-gray-500 mt-1">Bank data kandidat potensial untuk kebutuhan rekrutmen masa depan.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Kandidat
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau keahlian..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-64 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          />
        </div>
        <select value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-gray-600 outline-none">
          <option value="">Semua Keahlian</option>
          {skillOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterExp} onChange={(e) => setFilterExp(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-gray-600 outline-none">
          <option value="">Semua Level</option>
          {experienceLevels.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        {(filterSkill || filterExp) && (
          <button onClick={() => { setFilterSkill(""); setFilterExp(""); }} className="text-xs text-[#CC0000] hover:underline">Hapus filter</button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Kandidat ke Talent Pool</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama kandidat" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telepon</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="08xx-xxxx-xxxx" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keahlian <span className="text-slate-400 font-normal">(pisahkan dengan koma)</span></label>
                <input required value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="React, Node.js, TypeScript" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Level Pengalaman</label>
                  <select value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    {experienceLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sumber</label>
                  <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    <option value="">Pilih sumber</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="JobStreet">JobStreet</option>
                    <option value="Referral">Referral</option>
                    <option value="Kampus">Kampus</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" rows={2} placeholder="Catatan tentang kandidat..." />
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Simpan
              </button>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Star size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Tidak ada kandidat ditemukan.</p>
          {(searchQuery || filterSkill || filterExp) && <p className="text-xs text-slate-400 mt-1">Coba ubah filter pencarian.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm text-slate-800">{t.name}</h3>
                  <p className="text-[10px] text-slate-500">{t.email}</p>
                  {t.source && (
                    <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={9} /> {t.source}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getExpBadge(t.experience)}`}>
                  {t.experience}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {t.skills.map((s, i) => (
                  <span key={s} className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${getSkillColor(i)}`}>{s}</span>
                ))}
              </div>
              {t.notes && <p className="text-[10px] text-slate-500 mb-3 bg-slate-50 rounded-lg p-2.5">{t.notes}</p>}
              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                  <Star size={9} className="text-amber-400" /> Ditambahkan {new Date(t.addedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button
                  onClick={() => setTalents(talents.filter((tl) => tl.id !== t.id))}
                  className="text-[9px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <X size={9} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
