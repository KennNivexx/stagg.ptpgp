"use client";

import { useState } from "react";
import { FileText, HelpCircle, Plus, X, Save, Search, BarChart3, CheckCircle, Clock } from "lucide-react";

type Quiz = {
  id: string;
  title: string;
  program: string;
  questionsCount: number;
  passScore: number;
  duration: string;
  status: string;
};

const INITIAL_QUIZZES: Quiz[] = [
  { id: "1", title: "Evaluasi Kepemimpinan Dasar", program: "Pelatihan Kepemimpinan Dasar", questionsCount: 25, passScore: 75, duration: "60 menit", status: "Aktif" },
  { id: "2", title: "Kuis K3 - Teori", program: "Workshop Keselamatan Kerja", questionsCount: 30, passScore: 80, duration: "45 menit", status: "Aktif" },
  { id: "3", title: "Kuis K3 - Praktik", program: "Workshop Keselamatan Kerja", questionsCount: 15, passScore: 70, duration: "30 menit", status: "Aktif" },
  { id: "4", title: "Excel Advanced - Final Test", program: "Microsoft Excel Advanced", questionsCount: 40, passScore: 75, duration: "90 menit", status: "Aktif" },
  { id: "5", title: "Service Excellence Quiz", program: "Service Excellence", questionsCount: 20, passScore: 70, duration: "30 menit", status: "Aktif" },
  { id: "6", title: "Manajemen Proyek - Pre-Test", program: "Manajemen Proyek Profesional", questionsCount: 30, passScore: 70, duration: "45 menit", status: "Draft" },
  { id: "7", title: "Manajemen Proyek - Post-Test", program: "Manajemen Proyek Profesional", questionsCount: 50, passScore: 80, duration: "90 menit", status: "Draft" },
  { id: "8", title: "ISO 9001 Evaluasi", program: "Pelatihan ISO 9001", questionsCount: 35, passScore: 75, duration: "60 menit", status: "Completed" },
  { id: "9", title: "Communication Evaluation", program: "Effective Communication", questionsCount: 25, passScore: 70, duration: "45 menit", status: "Completed" },
];

const PROGRAM_LIST = [...new Set(INITIAL_QUIZZES.map((q) => q.program))];

export default function KuisEvaluasi() {
  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", program: "", questionsCount: 10, passScore: 70, duration: "30 menit" });

  const filtered = quizzes.filter((q) => {
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterProgram && q.program !== filterProgram) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuiz: Quiz = { id: Date.now().toString(), ...formData, status: "Draft" };
    setQuizzes([newQuiz, ...quizzes]);
    setShowForm(false);
    setFormData({ title: "", program: "", questionsCount: 10, passScore: 70, duration: "30 menit" });
  };

  const getStatusColor = (s: string) => {
    if (s === "Aktif") return "bg-emerald-50 text-emerald-700";
    if (s === "Draft") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-500";
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Kuis & Evaluasi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kuis, ujian, dan evaluasi untuk setiap program pelatihan.</p>
        </div>
        <button
          onClick={() => { setFormData({ title: "", program: "", questionsCount: 10, passScore: 70, duration: "30 menit" }); setShowForm(true); }}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Kuis
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kuis..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-56 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          />
        </div>
        <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-gray-600 outline-none">
          <option value="">Semua Program</option>
          {PROGRAM_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {filterProgram && <button onClick={() => setFilterProgram("")} className="text-xs text-[#CC0000] hover:underline">Hapus filter</button>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Kuis Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kuis</label>
                <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Judul kuis" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Program Pelatihan</label>
                <select required value={formData.program} onChange={(e) => setFormData({ ...formData, program: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Program</option>
                  {PROGRAM_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Soal</label>
                  <input type="number" required value={formData.questionsCount} onChange={(e) => setFormData({ ...formData, questionsCount: Number(e.target.value) })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" min={1} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Lulus (%)</label>
                  <input type="number" required value={formData.passScore} onChange={(e) => setFormData({ ...formData, passScore: Number(e.target.value) })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" min={0} max={100} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi</label>
                  <input required value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="30 menit" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Kuis
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Kuis</p>
              <p className="text-xl font-extrabold text-slate-800">{quizzes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kuis Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{quizzes.filter((q) => q.status === "Aktif").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><HelpCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Soal</p>
              <p className="text-xl font-extrabold text-slate-800">{quizzes.reduce((s, q) => s + q.questionsCount, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Tidak ada kuis ditemukan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Judul Kuis</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Program</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Jumlah Soal</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nilai Lulus</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Durasi</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <HelpCircle size={14} className="text-slate-500" />
                      </div>
                      <p className="font-bold text-slate-800 text-xs">{q.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{q.program}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-extrabold text-slate-800 text-xs">{q.questionsCount}</span>
                    <span className="text-[10px] text-slate-400"> soal</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-extrabold text-xs ${q.passScore >= 80 ? "text-red-600" : q.passScore >= 70 ? "text-amber-600" : "text-emerald-600"}`}>{q.passScore}%</span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                    <Clock size={10} /> {q.duration}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(q.status)}`}>{q.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
