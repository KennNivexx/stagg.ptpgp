"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck, Save } from "lucide-react";
import { getTrainings, getEvaluasiPelatihan, saveEvaluasiPelatihan, type EvaluasiPelatihanRow } from "@/app/actions/trainings";
import EmptyState from "@/components/EmptyState";

interface TrainingOption { id: string; title: string; status: string; date_start: string }

const SCORE_LABELS = [
  { key: "reaction_score", label: "Reaction" },
  { key: "learning_score", label: "Learning" },
  { key: "behavior_score", label: "Behavior" },
] as const;

export default function EvaluationPage() {
  const [trainings, setTrainings] = useState<TrainingOption[]>([]);
  const [selectedTraining, setSelectedTraining] = useState("");
  const [rows, setRows] = useState<EvaluasiPelatihanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Record<string, { reaction_score: string; learning_score: string; behavior_score: string; result_notes: string }>>({});

  useEffect(() => {
    getTrainings().then(t => {
      const completed = (t as Record<string, unknown>[]).filter(x => x.status === "Completed") as unknown as TrainingOption[];
      setTrainings(completed);
      setLoading(false);
    });
  }, []);

  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const loadRows = async (trainingId: string) => {
    setSelectedTraining(trainingId);
    if (!trainingId) { setRows([]); return; }
    setLoadingRows(true);
    const r = await getEvaluasiPelatihan(trainingId);
    setRows(r);
    const d: typeof draft = {};
    r.forEach(row => {
      d[row.karyawan_id] = {
        reaction_score: row.reaction_score != null ? String(row.reaction_score) : "",
        learning_score: row.learning_score != null ? String(row.learning_score) : "",
        behavior_score: row.behavior_score != null ? String(row.behavior_score) : "",
        result_notes: row.result_notes || "",
      };
    });
    setDraft(d);
    setLoadingRows(false);
  };

  const handleSave = async (karyawanId: string) => {
    setSavingId(karyawanId); setError("");
    const d = draft[karyawanId] || { reaction_score: "", learning_score: "", behavior_score: "", result_notes: "" };
    const fd = new FormData();
    fd.append("training_id", selectedTraining);
    fd.append("karyawan_id", karyawanId);
    fd.append("reaction_score", d.reaction_score);
    fd.append("learning_score", d.learning_score);
    fd.append("behavior_score", d.behavior_score);
    fd.append("result_notes", d.result_notes);
    const res = await saveEvaluasiPelatihan(fd);
    setSavingId(null);
    if (res.error) { setError(res.error); return; }
    showSuccess("Evaluasi tersimpan.");
    await loadRows(selectedTraining);
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Evaluasi Pelatihan</h1>
        <p className="text-sm text-gray-500">Model Kirkpatrick — Reaction, Learning, Behavior (skala 1-5), dan catatan Result per peserta training yang sudah selesai.</p>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pilih Training (status Completed)</label>
        <select value={selectedTraining} onChange={e => loadRows(e.target.value)}
          className="w-full md:w-96 border border-gray-200 p-3 rounded-xl text-sm bg-white">
          <option value="">Pilih training...</option>
          {trainings.map(t => <option key={t.id} value={t.id}>{t.title} ({t.date_start})</option>)}
        </select>
        {trainings.length === 0 && <p className="text-xs text-slate-400 mt-2">Belum ada training berstatus Completed.</p>}
      </div>

      {selectedTraining && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loadingRows ? (
            <div className="p-8 text-center text-sm text-slate-500">Memuat peserta...</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="Belum ada peserta terdaftar di training ini." />
          ) : (
            <div className="divide-y divide-slate-50">
              {rows.map(r => (
                <div key={r.karyawan_id} className="p-5 grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
                  <p className="text-sm font-bold text-slate-800 md:col-span-2">{r.karyawan_nama}</p>
                  {SCORE_LABELS.map(sl => (
                    <div key={sl.key}>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">{sl.label}</label>
                      <select
                        value={draft[r.karyawan_id]?.[sl.key] || ""}
                        onChange={e => setDraft(prev => ({ ...prev, [r.karyawan_id]: { ...prev[r.karyawan_id], reaction_score: prev[r.karyawan_id]?.reaction_score || "", learning_score: prev[r.karyawan_id]?.learning_score || "", behavior_score: prev[r.karyawan_id]?.behavior_score || "", result_notes: prev[r.karyawan_id]?.result_notes || "", [sl.key]: e.target.value } }))}
                        className="w-full border border-gray-200 p-2 rounded-lg text-xs bg-white mt-1"
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  ))}
                  <button onClick={() => handleSave(r.karyawan_id)} disabled={savingId === r.karyawan_id}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 mt-4 md:mt-5">
                    <Save size={12} /> {savingId === r.karyawan_id ? "..." : "Simpan"}
                  </button>
                  <div className="md:col-span-6">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Result — Catatan Dampak</label>
                    <input
                      value={draft[r.karyawan_id]?.result_notes || ""}
                      onChange={e => setDraft(prev => ({ ...prev, [r.karyawan_id]: { ...prev[r.karyawan_id], reaction_score: prev[r.karyawan_id]?.reaction_score || "", learning_score: prev[r.karyawan_id]?.learning_score || "", behavior_score: prev[r.karyawan_id]?.behavior_score || "", result_notes: e.target.value } }))}
                      placeholder="Dampak kerja setelah pelatihan..."
                      className="w-full border border-gray-200 p-2 rounded-lg text-xs mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
