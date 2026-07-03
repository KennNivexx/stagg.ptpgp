"use client";

import { useState } from "react";
import { Heart, BarChart3, ClipboardList, TrendingUp, Send, X } from "lucide-react";
import { createSurvey } from "@/app/actions/relations";
import EmptyState from "@/components/EmptyState";

const SURVEY_TYPES = [
  { id: "engagement", label: "Engagement", icon: Heart, desc: "Survei keterikatan karyawan" },
  { id: "satisfaction", label: "Kepuasan", icon: TrendingUp, desc: "Survei kepuasan kerja" },
  { id: "exit", label: "Exit Interview", icon: ClipboardList, desc: "Wawancara keluar karyawan" },
  { id: "training", label: "Feedback Pelatihan", icon: BarChart3, desc: "Umpan balik program pelatihan" },
];

interface Survey {
  id: string; title: string; survey_type: string; questions: string;
  start_date?: string; end_date?: string; status: string; created_at: string; created_by?: string;
}

export default function SurveysClient({ initialSurveys }: { initialSurveys: Survey[] }) {
  const [surveys, setSurveys] = useState<Survey[]>(initialSurveys);
  const [title, setTitle] = useState("");
  const [surveyType, setSurveyType] = useState("engagement");
  const [questions, setQuestions] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleCreate = async () => {
    if (!title || !questions) { showToast("Judul dan pertanyaan wajib diisi."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("survey_type", surveyType);
    fd.append("questions", questions);
    fd.append("start_date", startDate);
    fd.append("end_date", endDate);
    const result = await createSurvey(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Survei berhasil dibuat!");
    setSurveys(prev => [{
      id: "local-" + Date.now(), title, survey_type: surveyType, questions,
      start_date: startDate || undefined, end_date: endDate || undefined,
      status: "Aktif", created_at: new Date().toISOString(),
    }, ...prev]);
    setTitle(""); setQuestions(""); setStartDate(""); setEndDate("");
  };

  const typeLabel = SURVEY_TYPES.find(t => t.id === surveyType)?.label || surveyType;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SURVEY_TYPES.map(st => {
          const Icon = st.icon;
          const count = surveys.filter(s => s.survey_type === st.id).length;
          return (
            <button key={st.id} onClick={() => setSurveyType(st.id)}
              className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all text-left ${surveyType === st.id ? "border-[#CC0000]" : "border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 ${surveyType === st.id ? "bg-red-50 text-[#CC0000]" : "bg-blue-50 text-blue-600"} rounded-xl`}><Icon size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{st.label}</p>
                  <p className="text-sm font-extrabold text-slate-800">{count} survei</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Buat Survei Baru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Rancang survei untuk karyawan</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Judul Survei</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none"
                  placeholder="Masukkan judul survei..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tipe Survei</label>
                <select value={surveyType} onChange={e => setSurveyType(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none">
                  {SURVEY_TYPES.map(st => <option key={st.id} value={st.id}>{st.label} - {st.desc}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Mulai</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Selesai</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pertanyaan (pisahkan dengan baris baru)</label>
              <textarea rows={6} value={questions} onChange={e => setQuestions(e.target.value)}
                placeholder={"1. Bagaimana tingkat kepuasan Anda terhadap lingkungan kerja?\n2. Apakah Anda merasa dihargai dalam pekerjaan?\n3. Bagaimana hubungan Anda dengan atasan langsung?"}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none resize-none" />
            </div>
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 disabled:opacity-50">
              <Send size={14} /> {saving ? "Membuat..." : "Buat & Simpan Survei"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan</h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Total Survei Dibuat", value: surveys.length, color: "text-slate-800" },
                { label: "Survei Aktif", value: surveys.filter(s => s.status === "Aktif").length, color: "text-emerald-600" },
                { label: "Survei Ditutup", value: surveys.filter(s => s.status === "Ditutup").length, color: "text-slate-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{label}</span>
                  <span className={`text-sm font-extrabold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Survei Terbaru</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {surveys.slice(0, 5).length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Belum ada survei."
                  className="border-none py-6"
                />
              ) : surveys.slice(0, 5).map(s => (
                <div key={s.id} className="p-4">
                  <p className="text-xs font-bold text-slate-800 truncate">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold">
                      {SURVEY_TYPES.find(t => t.id === s.survey_type)?.label || s.survey_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
