"use client";

import { useState } from "react";
import { Plus, Star, Eye, X, Target, Users } from "lucide-react";
import Link from "next/link";
import { saveKpiEvaluation } from "@/app/actions/performance-hrd";

interface Employee { id: string; full_name: string; department: string; position: string; }
interface Evaluation { id: string; employee_id: string; period: string; score: number; status: string; employees?: { full_name: string; department: string; position: string; }; }

interface Props {
  evaluations: Evaluation[];
  employees: Employee[];
  avgScore: number;
}

export default function KPIClient({ evaluations, employees, avgScore }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [period, setPeriod] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() < 3 ? 1 : new Date().getMonth() < 6 ? 2 : new Date().getMonth() < 9 ? 3 : 4).padStart(2, "0")}`);
  const [score, setScore] = useState(75);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [detailEv, setDetailEv] = useState<Evaluation | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openModal = (empId = "") => {
    setSelectedEmpId(empId);
    setScore(75);
    setComments("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedEmpId) { showToast("Pilih karyawan terlebih dahulu."); return; }
    if (!period.trim()) { showToast("Periode wajib diisi."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", selectedEmpId);
    fd.append("period", period);
    fd.append("score", score.toString());
    fd.append("comments", comments);
    const result = await saveKpiEvaluation(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Evaluasi KPI berhasil disimpan.");
    setShowModal(false);
  };

  const topScore = evaluations.filter(e => e.score != null).reduce((max, e) => Math.max(max, Number(e.score) || 0), 0);
  const evaluatedCount = new Set(evaluations.map(e => e.employee_id)).size;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">KPI & Feedback</h1>
          <p className="text-sm text-gray-500">Kelola target, evaluasi, dan penilaian kinerja karyawan.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2"
        >
          <Plus size={14} /> Buat Evaluasi Baru
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Evaluasi", value: evaluations.length, color: "blue", icon: <Target size={18} /> },
          { label: "Rata-rata Skor", value: avgScore.toFixed(1), color: "emerald", icon: <Star size={18} /> },
          { label: "Performa Tertinggi", value: topScore || "-", color: "amber", icon: <Star size={18} /> },
          { label: "Karyawan Dinilai", value: evaluatedCount, color: "red", icon: <Users size={18} /> },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                s.color === "blue" ? "bg-blue-50 text-blue-600" :
                s.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                s.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
              }`}>{s.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Evaluasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Penilaian KPI karyawan</p>
          </div>
          {evaluations.length === 0 ? (
            <div className="p-12 text-center">
              <Target size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data evaluasi KPI.</p>
              <p className="text-xs text-slate-400 mt-1">Buat evaluasi baru untuk memulai penilaian kinerja.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {evaluations.map((ev) => {
                const emp = ev.employees;
                const sc = Number(ev.score) || 0;
                return (
                  <div key={ev.id} className="p-6 hover:bg-slate-50/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {emp?.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{emp?.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400">{emp?.department || "-"} - {emp?.position || "-"}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Periode: {ev.period || "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex gap-0.5 justify-end mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={10} className={star <= sc / 20 ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${sc >= 80 ? "bg-emerald-50 text-emerald-700" : sc >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          Skor: {sc}
                        </span>
                      </div>
                      <button onClick={() => setDetailEv(ev)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Lihat Detail">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Karyawan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pilih karyawan untuk dinilai</p>
          </div>
          {employees.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada karyawan.</p>
              <Link href="/hrd/employees/new" className="text-xs text-[#CC0000] font-bold hover:underline mt-2 inline-block">
                + Tambah Karyawan
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {employees.map((emp) => (
                <div key={emp.id} className="px-6 py-4 hover:bg-slate-50/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {emp.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{emp.full_name}</p>
                      <p className="text-[10px] text-slate-400">{emp.department}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(emp.id)}
                    className="text-[10px] font-bold text-[#CC0000] hover:text-[#aa0000] transition-colors"
                  >
                    Nilai
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detailEv && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setDetailEv(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><Eye size={14} /> Detail Evaluasi KPI</h3>
              <button onClick={() => setDetailEv(null)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {detailEv.employees?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{detailEv.employees?.full_name || "Unknown"}</p>
                  <p className="text-[10px] text-slate-400">{detailEv.employees?.department} · {detailEv.employees?.position}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Periode</p>
                  <p className="text-sm font-bold text-slate-800">{detailEv.period || "-"}</p>
                </div>
                <div className={`rounded-xl p-3 ${Number(detailEv.score) >= 80 ? "bg-emerald-50" : Number(detailEv.score) >= 60 ? "bg-amber-50" : "bg-red-50"}`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Skor</p>
                  <p className={`text-xl font-extrabold ${Number(detailEv.score) >= 80 ? "text-emerald-700" : Number(detailEv.score) >= 60 ? "text-amber-700" : "text-red-700"}`}>
                    {detailEv.score}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Performa</p>
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={14} className={s <= Number(detailEv.score) / 20 ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                  ))}
                </div>
                <p className="text-xs text-slate-600 font-semibold">
                  {Number(detailEv.score) >= 80 ? "Sangat Baik" : Number(detailEv.score) >= 60 ? "Cukup Baik" : "Perlu Perbaikan"}
                </p>
              </div>
              <button onClick={() => setDetailEv(null)} className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Buat Evaluasi KPI</h3>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
                >
                  <option value="">Pilih karyawan...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name} — {e.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Periode</label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="mis. 2026-Q2"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Skor (0–100)</label>
                  <span className={`text-sm font-extrabold ${score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}>{score}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  className="w-full accent-[#CC0000]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan (opsional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                  placeholder="Catatan evaluasi..."
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
                  Batal
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
