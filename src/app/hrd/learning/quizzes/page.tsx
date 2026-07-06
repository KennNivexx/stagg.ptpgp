"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, HelpCircle, Plus, X, Save, Search, CheckCircle, Clock, Trash2, AlertTriangle } from "lucide-react";
import { getTrainings, getTrainingQuizzes, saveTrainingQuiz, deleteTrainingQuiz } from "@/app/actions/trainings";
import EmptyState from "@/components/EmptyState";

type Training = { id: string; title: string };
type Quiz = {
  id: string;
  training_id: string;
  title: string;
  questions_count: number;
  pass_score: number;
  duration_minutes: number;
  status: string;
  created_at: string;
};

export default function KuisEvaluasi() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTraining, setFilterTraining] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", training_id: "", questions_count: 10, pass_score: 70, duration_minutes: 30 });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, q] = await Promise.all([getTrainings(), getTrainingQuizzes()]);
      setTrainings((t as Record<string, unknown>[]).map((x) => ({ id: x.id as string, title: x.title as string })));
      setQuizzes(q as Quiz[]);
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

  const filtered = quizzes.filter((q) => {
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTraining && q.training_id !== filterTraining) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("training_id", formData.training_id);
    fd.append("title", formData.title);
    fd.append("questions_count", String(formData.questions_count));
    fd.append("pass_score", String(formData.pass_score));
    fd.append("duration_minutes", String(formData.duration_minutes));
    const r = await saveTrainingQuiz(fd);
    setSaving(false);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Kuis berhasil ditambahkan.");
    setShowForm(false);
    setFormData({ title: "", training_id: "", questions_count: 10, pass_score: 70, duration_minutes: 30 });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kuis ini?")) return;
    const r = await deleteTrainingQuiz(id);
    if (r?.error) { showToast("error", r.error); return; }
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    showToast("success", "Kuis berhasil dihapus.");
  };

  const getStatusColor = (s: string) => {
    if (s === "Aktif") return "bg-emerald-50 text-emerald-700";
    if (s === "Draft") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-500";
  };

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Kuis & Evaluasi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kuis dan evaluasi — mengikuti program training yang sudah ada.</p>
        </div>
        <button
          onClick={() => { setFormData({ title: "", training_id: "", questions_count: 10, pass_score: 70, duration_minutes: 30 }); setShowForm(true); }}
          disabled={trainings.length === 0}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Tambah Kuis
        </button>
      </div>

      {!loading && trainings.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Belum ada program training. Buat program training terlebih dahulu di halaman <b>Training</b> sebelum menambahkan kuis.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kuis..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-56 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          />
        </div>
        <select value={filterTraining} onChange={(e) => setFilterTraining(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-gray-600 outline-none">
          <option value="">Semua Program</option>
          {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        {filterTraining && <button onClick={() => setFilterTraining("")} className="text-xs text-[#CC0000] hover:underline">Hapus filter</button>}
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
                <select required value={formData.training_id} onChange={(e) => setFormData({ ...formData, training_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Program</option>
                  {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Soal</label>
                  <input type="number" required value={formData.questions_count} onChange={(e) => setFormData({ ...formData, questions_count: Number(e.target.value) })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" min={1} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Lulus (%)</label>
                  <input type="number" required value={formData.pass_score} onChange={(e) => setFormData({ ...formData, pass_score: Number(e.target.value) })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" min={0} max={100} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (menit)</label>
                  <input type="number" required value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" min={1} />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Kuis"}
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
              <p className="text-xl font-extrabold text-slate-800">{quizzes.reduce((s, q) => s + q.questions_count, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Tidak ada kuis ditemukan." description="Tambahkan kuis pertama untuk program pelatihan yang ada." />
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
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Aksi</th>
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
                  <td className="px-6 py-4 text-xs text-slate-600">{trainingMap[q.training_id] || "-"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-extrabold text-slate-800 text-xs">{q.questions_count}</span>
                    <span className="text-[10px] text-slate-400"> soal</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-extrabold text-xs ${q.pass_score >= 80 ? "text-red-600" : q.pass_score >= 70 ? "text-amber-600" : "text-emerald-600"}`}>{q.pass_score}%</span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock size={10} /> {q.duration_minutes} menit</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(q.status)}`}>{q.status}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
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
