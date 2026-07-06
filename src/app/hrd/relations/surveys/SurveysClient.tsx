"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart, BarChart3, ClipboardList, TrendingUp, Send, Plus, Trash2, GripVertical, BarChart2,
} from "lucide-react";
import { createSurvey, closeSurvey, type SurveyQuestion } from "@/app/actions/relations";
import EmptyState from "@/components/EmptyState";

const SURVEY_TYPES = [
  { id: "engagement", label: "Engagement", icon: Heart, desc: "Survei keterikatan karyawan" },
  { id: "satisfaction", label: "Kepuasan", icon: TrendingUp, desc: "Survei kepuasan kerja" },
  { id: "exit", label: "Exit Interview", icon: ClipboardList, desc: "Wawancara keluar karyawan" },
  { id: "training", label: "Feedback Pelatihan", icon: BarChart3, desc: "Umpan balik program pelatihan" },
];

const QUESTION_TYPES: { id: SurveyQuestion["type"]; label: string }[] = [
  { id: "short_text", label: "Teks Singkat" },
  { id: "paragraph", label: "Paragraf" },
  { id: "multiple_choice", label: "Pilihan Ganda" },
  { id: "checkbox", label: "Checkbox" },
  { id: "rating", label: "Rating (1-5)" },
];

interface Survey {
  id: string; title: string; survey_type: string; questions_json?: SurveyQuestion[];
  start_date?: string; end_date?: string; status: string; created_at: string; created_by?: string;
}

function newQuestion(): SurveyQuestion {
  return { id: "q-" + Math.random().toString(36).slice(2, 9), type: "short_text", label: "", required: true };
}

export default function SurveysClient({ initialSurveys }: { initialSurveys: Survey[] }) {
  const router = useRouter();
  const surveys = initialSurveys;
  const [title, setTitle] = useState("");
  const [surveyType, setSurveyType] = useState("engagement");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([newQuestion()]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const updateQuestion = (id: string, patch: Partial<SurveyQuestion>) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };
  const addQuestion = () => setQuestions((qs) => [...qs, newQuestion()]);
  const removeQuestion = (id: string) => setQuestions((qs) => (qs.length > 1 ? qs.filter((q) => q.id !== id) : qs));
  const addOption = (id: string) => updateQuestion(id, { options: [...(questions.find((q) => q.id === id)?.options || []), ""] });
  const updateOption = (id: string, idx: number, val: string) => {
    const q = questions.find((q) => q.id === id);
    if (!q) return;
    const opts = [...(q.options || [])];
    opts[idx] = val;
    updateQuestion(id, { options: opts });
  };
  const removeOption = (id: string, idx: number) => {
    const q = questions.find((q) => q.id === id);
    if (!q) return;
    updateQuestion(id, { options: (q.options || []).filter((_, i) => i !== idx) });
  };

  const handleCreate = async () => {
    if (!title.trim()) { showToast("Judul survei wajib diisi."); return; }
    if (questions.some((q) => !q.label.trim())) { showToast("Setiap pertanyaan wajib memiliki teks."); return; }
    if (questions.some((q) => (q.type === "multiple_choice" || q.type === "checkbox") && (!q.options || q.options.filter((o) => o.trim()).length < 2))) {
      showToast("Pilihan ganda/checkbox wajib memiliki minimal 2 opsi.");
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("survey_type", surveyType);
    fd.append("start_date", startDate);
    fd.append("end_date", endDate);
    fd.append("questions_json", JSON.stringify(questions));
    const result = await createSurvey(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Survei berhasil dibuat!");
    setTitle(""); setQuestions([newQuestion()]); setStartDate(""); setEndDate("");
    router.refresh();
  };

  const handleClose = async (id: string) => {
    const result = await closeSurvey(id);
    if (result?.error) { showToast(result.error); return; }
    showToast("Survei ditutup.");
    router.refresh();
  };

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
            <p className="text-xs text-slate-400 mt-0.5">Rancang survei seperti Google Form — tambahkan pertanyaan sesuai kebutuhan</p>
          </div>
          <div className="p-6 space-y-5">
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

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Pertanyaan</label>
              {questions.map((q, qi) => (
                <div key={q.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/40">
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="text-slate-300 mt-2.5 shrink-0" />
                    <input value={q.label} onChange={e => updateQuestion(q.id, { label: e.target.value })}
                      placeholder={`Pertanyaan ${qi + 1}...`}
                      className="flex-1 text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 focus:border-[#CC0000] outline-none bg-white" />
                    <select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as SurveyQuestion["type"], options: (e.target.value === "multiple_choice" || e.target.value === "checkbox") ? (q.options || ["", ""]) : undefined })}
                      className="text-[10px] font-bold border border-gray-200 rounded-lg px-2 py-2 bg-white focus:border-[#CC0000] outline-none shrink-0">
                      {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <button onClick={() => removeQuestion(q.id)} disabled={questions.length === 1}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {(q.type === "multiple_choice" || q.type === "checkbox") && (
                    <div className="pl-6 space-y-2">
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="text-slate-300">{q.type === "multiple_choice" ? "○" : "☐"}</span>
                          <input value={opt} onChange={e => updateOption(q.id, oi, e.target.value)}
                            placeholder={`Opsi ${oi + 1}`}
                            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#CC0000] outline-none bg-white" />
                          <button onClick={() => removeOption(q.id, oi)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                        </div>
                      ))}
                      <button onClick={() => addOption(q.id)} className="text-[10px] font-bold text-[#CC0000] hover:underline pl-5">+ Tambah opsi</button>
                    </div>
                  )}

                  {q.type === "rating" && (
                    <div className="pl-6 flex items-center gap-1.5 text-slate-300 text-xs">
                      {[1, 2, 3, 4, 5].map(n => <span key={n} className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center">{n}</span>)}
                    </div>
                  )}

                  <label className="pl-6 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} className="rounded accent-[#CC0000]" />
                    <span className="text-[10px] text-slate-500">Wajib diisi</span>
                  </label>
                </div>
              ))}
              <button onClick={addQuestion}
                className="w-full px-4 py-2.5 border border-dashed border-slate-300 text-slate-500 text-xs font-bold rounded-xl hover:border-[#CC0000] hover:text-[#CC0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Tambah Pertanyaan
              </button>
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
              <h3 className="font-extrabold text-slate-800 text-sm">Semua Survei</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {surveys.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Belum ada survei." className="border-none py-6" />
              ) : surveys.map(s => (
                <div key={s.id} className="p-4">
                  <p className="text-xs font-bold text-slate-800 truncate">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold">
                      {SURVEY_TYPES.find(t => t.id === s.survey_type)?.label || s.survey_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Link href={`/hrd/relations/surveys/${s.id}/results`} className="text-[10px] font-bold text-[#CC0000] hover:underline flex items-center gap-1">
                      <BarChart2 size={11} /> Lihat Hasil
                    </Link>
                    {s.status === "Aktif" && (
                      <button onClick={() => handleClose(s.id)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Tutup Survei</button>
                    )}
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
