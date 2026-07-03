"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, RefreshCw, ChevronDown, ChevronUp, Clock, CheckCircle, Brain, Pencil, ClipboardList } from "lucide-react";
import { getAllRecruitmentTests, getRecruitmentTest, saveRecruitmentTest, deleteRecruitmentTest, type Question } from "@/app/actions/tests";
import { getJobPostings } from "@/app/actions/recruitment";
import EmptyState from "@/components/EmptyState";

type TestType = "tulis" | "psikotes";

const OPTION_KEYS = ["A", "B", "C", "D"];

const defaultTulisQuestion = (): Question => ({
  id: crypto.randomUUID(),
  type: "pilihan_ganda",
  text: "",
  options: ["", "", "", ""],
  correct_answer: "",
  points: 5,
});

const defaultPsikotesQuestion = (): Question => ({
  id: crypto.randomUUID(),
  type: "skala",
  text: "",
  dimension: "Integritas",
  reverse: false,
});

interface TestRow {
  id: string;
  test_type: string;
  title: string;
  duration_minutes: number;
  passing_score: number;
  is_active: boolean;
  job_posting_id: string | null;
}

interface FormState {
  job_posting_id: string | null;
  test_type: TestType;
  title: string;
  instructions: string;
  questions: Question[];
  duration_minutes: number;
  passing_score: number;
  is_active: boolean;
}

const blankForm = (): FormState => ({
  job_posting_id: null,
  test_type: "tulis",
  title: "",
  instructions: "",
  questions: [defaultTulisQuestion()],
  duration_minutes: 60,
  passing_score: 70,
  is_active: true,
});

export default function RecruitmentTestsPage() {
  const [tests, setTests] = useState<TestRow[]>([]);
  const [jobPostings, setJobPostings] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());

  useEffect(() => {
    Promise.all([getAllRecruitmentTests(), getJobPostings()]).then(([t, j]) => {
      setTests(t as TestRow[]);
      setJobPostings(j as Array<{ id: string; title: string }>);
      setLoading(false);
    });
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(blankForm());
    setExpandedQ(null);
    setShowForm(true);
    setTimeout(() => document.getElementById("test-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openEdit = async (id: string) => {
    setLoadingEdit(true);
    const data = await getRecruitmentTest(id);
    setLoadingEdit(false);
    if (!data) { setMsg({ type: "error", text: "Gagal memuat data tes." }); return; }
    setEditingId(id);
    setForm({
      job_posting_id: data.job_posting_id,
      test_type: data.test_type as TestType,
      title: data.title,
      instructions: data.instructions || "",
      questions: data.questions,
      duration_minutes: data.duration_minutes,
      passing_score: data.passing_score,
      is_active: data.is_active,
    });
    setExpandedQ(null);
    setShowForm(true);
    setTimeout(() => document.getElementById("test-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleTypeChange = (t: TestType) => {
    if (form.questions.length > 1 || form.questions[0].text) {
      if (!confirm("Ganti tipe tes akan menghapus semua soal yang sudah diisi. Lanjutkan?")) return;
    }
    const q = t === "tulis" ? [defaultTulisQuestion()] : [defaultPsikotesQuestion()];
    setForm({ ...form, test_type: t, questions: q });
  };

  const addQuestion = () => {
    const q = form.test_type === "tulis" ? defaultTulisQuestion() : defaultPsikotesQuestion();
    setForm({ ...form, questions: [...form.questions, q] });
    setExpandedQ(q.id);
  };

  const removeQuestion = (idx: number) => {
    if (form.questions.length <= 1) return;
    const next = form.questions.filter((_, i) => i !== idx);
    setForm({ ...form, questions: next });
  };

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    const qs = [...form.questions];
    qs[idx] = { ...qs[idx], ...patch };
    setForm({ ...form, questions: qs });
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    const qs = [...form.questions];
    const opts = [...(qs[qIdx].options || ["", "", "", ""])];
    opts[oIdx] = val;
    qs[qIdx] = { ...qs[qIdx], options: opts };
    setForm({ ...form, questions: qs });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setMsg({ type: "error", text: "Judul tes wajib diisi." }); return; }
    const emptyQ = form.questions.findIndex(q => !q.text.trim());
    if (emptyQ >= 0) { setMsg({ type: "error", text: `Soal #${emptyQ + 1} masih kosong.` }); setExpandedQ(form.questions[emptyQ].id); return; }
    setSaving(true);
    const res = await saveRecruitmentTest(editingId, form);
    setSaving(false);
    if (res.error) { setMsg({ type: "error", text: res.error }); return; }
    setMsg({ type: "success", text: editingId ? "Tes berhasil diperbarui." : "Tes berhasil disimpan." });
    closeForm();
    const t = await getAllRecruitmentTests();
    setTests(t as TestRow[]);
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tes ini? Tindakan ini tidak dapat dibatalkan.")) return;
    await deleteRecruitmentTest(id);
    setTests(tests.filter(t => t.id !== id));
  };

  if (loading) return <div className="p-8 text-sm text-gray-500 text-center">Memuat...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/hrd/recruitment" className="inline-flex items-center text-xs text-gray-500 hover:text-red-600 mb-3 font-semibold">
          <ArrowLeft size={14} className="mr-1" /> Rekrutmen
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tes Rekrutmen Online</h1>
            <p className="text-xs text-slate-500 mt-0.5">Kelola soal tes tulis & psikotes untuk kandidat</p>
          </div>
          <button onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors">
            <Plus size={14} /> Buat Tes Baru
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
          {msg.text}
        </div>
      )}

      {/* List */}
      <div className="space-y-3 mb-6">
        {tests.length === 0 && !showForm && (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada tes rekrutmen."
            description="Jalankan migrasi SQL terlebih dahulu agar template bawaan muncul di sini."
          />
        )}
        {tests.map(t => {
          const linkedJob = t.job_posting_id ? jobPostings.find(j => j.id === t.job_posting_id) : null;
          return (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.test_type === "tulis" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
              {t.test_type === "tulis" ? <CheckCircle size={20} /> : <Brain size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-800 truncate">{t.title}</p>
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.is_active ? "Aktif" : "Nonaktif"}
                </span>
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${linkedJob ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                  {linkedJob ? linkedJob.title : "Semua Lowongan"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Clock size={10} /> {t.duration_minutes} menit</span>
                {t.test_type === "tulis" && <span>Nilai lulus: {t.passing_score}</span>}
                <span>{t.test_type === "tulis" ? "Tes Tulis" : "Psikotes"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => openEdit(t.id)} disabled={loadingEdit}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(t.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div id="test-form" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">{editingId ? "Edit Tes" : "Buat Tes Baru"}</h2>
            <button onClick={closeForm} className="text-xs text-slate-400 hover:text-slate-600">Batal</button>
          </div>
          <div className="p-5 space-y-5">

            {/* Tipe */}
            <div className="flex gap-3">
              {(["tulis", "psikotes"] as TestType[]).map(t => (
                <button key={t} onClick={() => handleTypeChange(t)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${form.test_type === t
                    ? t === "tulis" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {t === "tulis" ? "📝 Tes Tulis (Pilihan Ganda)" : "🧠 Psikotes (Skala Likert)"}
                </button>
              ))}
            </div>

            {/* Info dasar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Judul Tes *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-red-400"
                  placeholder="cth: Tes Pengetahuan Freight Forwarding" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Durasi (menit)</label>
                <input type="number" value={form.duration_minutes} min={5}
                  onChange={e => setForm({ ...form, duration_minutes: +e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-red-400" />
              </div>
              {form.test_type === "tulis" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nilai Kelulusan (0–100)</label>
                  <input type="number" value={form.passing_score} min={0} max={100}
                    onChange={e => setForm({ ...form, passing_score: +e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-red-400" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lowongan (opsional)</label>
                <select value={form.job_posting_id || ""}
                  onChange={e => setForm({ ...form, job_posting_id: e.target.value || null })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-red-400 bg-white">
                  <option value="">Semua Lowongan</option>
                  {jobPostings.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Instruksi untuk Peserta</label>
              <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} rows={2}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-red-400 resize-none"
                placeholder="Baca setiap soal dengan teliti sebelum menjawab..." />
            </div>

            {/* Toggle aktif */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-700">Status Aktif</p>
                <p className="text-[10px] text-slate-400">Tes aktif dapat langsung dikerjakan kandidat</p>
              </div>
              <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-emerald-500" : "bg-gray-300"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "left-[26px]" : "left-1"}`} />
              </button>
            </div>

            {/* Soal */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-800">Daftar Soal ({form.questions.length})</span>
                <button onClick={addQuestion}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">
                  <Plus size={12} /> Tambah Soal
                </button>
              </div>

              <div className="space-y-2">
                {form.questions.map((q, idx) => (
                  <div key={q.id} className={`border rounded-xl overflow-hidden ${expandedQ === q.id ? "border-red-200" : "border-slate-200"}`}>
                    {/* Header soal */}
                    <div className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer select-none"
                      onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${q.text ? "bg-red-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-xs text-slate-700 truncate">{q.text || "(soal belum diisi)"}</span>
                      {form.questions.length > 1 && (
                        <button onClick={e => { e.stopPropagation(); removeQuestion(idx); }}
                          className="text-red-400 hover:text-red-600 p-1" title="Hapus soal">
                          <Trash2 size={12} />
                        </button>
                      )}
                      {expandedQ === q.id ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                    </div>

                    {/* Body soal */}
                    {expandedQ === q.id && (
                      <div className="p-4 space-y-4 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                            {q.type === "pilihan_ganda" ? "Pertanyaan" : "Pernyataan"}
                          </label>
                          <textarea value={q.text} onChange={e => updateQuestion(idx, { text: e.target.value })} rows={3}
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-400 resize-none"
                            placeholder={q.type === "pilihan_ganda" ? "Tulis pertanyaan di sini..." : "Tulis pernyataan di sini..."} />
                        </div>

                        {q.type === "pilihan_ganda" && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase">Pilihan Jawaban — centang radio = jawaban benar</p>
                            <div className="space-y-2">
                              {(q.options || ["", "", "", ""]).map((opt, oIdx) => (
                                <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${q.correct_answer === OPTION_KEYS[oIdx] ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
                                  <input type="radio"
                                    name={`correct-${q.id}`}
                                    checked={q.correct_answer === OPTION_KEYS[oIdx]}
                                    onChange={() => updateQuestion(idx, { correct_answer: OPTION_KEYS[oIdx] })}
                                    className="accent-emerald-500 shrink-0"
                                    title={`Pilihan ${OPTION_KEYS[oIdx]} = jawaban benar`} />
                                  <span className="text-xs font-bold text-slate-500 w-4 shrink-0">{OPTION_KEYS[oIdx]}.</span>
                                  <input type="text" value={opt}
                                    onChange={e => updateOption(idx, oIdx, e.target.value)}
                                    className="flex-1 bg-transparent border-none text-sm outline-none"
                                    placeholder={`Isi pilihan ${OPTION_KEYS[oIdx]}...`} />
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-[10px] text-gray-400">Poin soal ini:</span>
                              <input type="number" value={q.points ?? 5} min={1}
                                onChange={e => updateQuestion(idx, { points: +e.target.value })}
                                className="w-14 border border-slate-200 rounded-lg p-1.5 text-xs text-center outline-none focus:border-red-400" />
                            </div>
                          </div>
                        )}

                        {q.type === "skala" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Dimensi / Aspek</label>
                              <input type="text" value={q.dimension || ""}
                                onChange={e => updateQuestion(idx, { dimension: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-400"
                                placeholder="cth: Integritas, Adaptasi..." />
                            </div>
                            <div className="flex items-end pb-1">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={!!q.reverse}
                                  onChange={e => updateQuestion(idx, { reverse: e.target.checked })}
                                  className="accent-red-600 w-4 h-4" />
                                <span className="text-xs text-gray-600 font-medium">Reverse scoring</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</> : <><Save size={14} /> {editingId ? "Simpan Perubahan" : "Simpan Tes"}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
