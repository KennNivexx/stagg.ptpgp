"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDriverPerformanceReviews, submitDriverPerformanceReview, getSupirForAssignment,
  type DriverPerformanceReview,
} from "@/app/actions/vehicles";
import {
  Gauge, Plus, X, Send, AlertTriangle, CheckCircle2, ArrowLeft,
  ShieldAlert, ClipboardList,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface Driver { id: string; full_name: string; nik: string | null; department: string | null; position: string | null }

const HASIL_OPTIONS = ["Baik", "Perlu Perbaikan", "Pelanggaran Ringan", "Pelanggaran Kritikal"] as const;
const TINDAK_LANJUT_OPTIONS = ["Surat Teguran", "Briefing/Pelatihan Tambahan", "PHK"] as const;

const HASIL_STYLE: Record<string, string> = {
  "Baik": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Perlu Perbaikan": "bg-amber-50 text-amber-700 border-amber-200",
  "Pelanggaran Ringan": "bg-orange-50 text-orange-700 border-orange-200",
  "Pelanggaran Kritikal": "bg-red-50 text-red-700 border-red-200",
};

function SubmitReviewForm({ drivers, onDone }: { drivers: Driver[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [periode, setPeriode] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [catatan, setCatatan] = useState("");
  const [hasil, setHasil] = useState<string>("");
  const [tindakLanjut, setTindakLanjut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setEmployeeId(""); setPeriode(""); setEvaluator(""); setCatatan(""); setHasil(""); setTindakLanjut("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    fd.set("periode", periode);
    fd.set("evaluator", evaluator);
    fd.set("catatan", catatan);
    fd.set("hasil", hasil);
    fd.set("tindak_lanjut", tindakLanjut);
    const res = await submitDriverPerformanceReview(fd);
    setLoading(false);
    if ("error" in res) { setError(res.error); return; }
    setSuccess(true);
    onDone();
    setTimeout(() => { setOpen(false); setSuccess(false); reset(); }, 1500);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-[#CC0000] hover:bg-[#aa0000] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors inline-flex items-center gap-2">
        <Plus size={14} /> Input Review Kinerja
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1A2530] flex items-center gap-2">
                <Gauge size={20} className="text-[#CC0000]" /> Monitoring Kinerja Pengemudi
              </h2>
              <button onClick={() => !loading && setOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={24} />
                </div>
                <p className="font-bold text-emerald-700">Hasil review berhasil disimpan!</p>
                {hasil === "Pelanggaran Kritikal" && (
                  <p className="text-xs text-slate-500 mt-1">Surat Peringatan (SP3) otomatis diterbitkan melalui menu Surat Peringatan.</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Pengemudi</label>
                  <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none bg-white">
                    <option value="">Pilih pengemudi...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name}{d.nik ? ` (${d.nik})` : ""} — {d.department || "-"}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Periode</label>
                    <input required value={periode} onChange={e => setPeriode(e.target.value)} placeholder="Q3 2026"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Evaluator</label>
                    <input value={evaluator} onChange={e => setEvaluator(e.target.value)} placeholder="Spv / Ka Div Operasional"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Hasil Penilaian</label>
                  <select required value={hasil} onChange={e => setHasil(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none bg-white">
                    <option value="">Pilih hasil...</option>
                    {HASIL_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {hasil === "Pelanggaran Kritikal" && (
                    <p className="mt-1.5 text-[11px] text-red-600 font-semibold flex items-center gap-1">
                      <ShieldAlert size={12} /> Akan otomatis menerbitkan Surat Peringatan SP3 untuk pengemudi ini.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Tindak Lanjut (opsional)</label>
                  <select value={tindakLanjut} onChange={e => setTindakLanjut(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none bg-white">
                    <option value="">Tidak ada</option>
                    {TINDAK_LANJUT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Catatan</label>
                  <textarea rows={3} value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Detail evaluasi, insiden, atau observasi..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none resize-none" />
                </div>

                {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button type="submit" disabled={loading || !employeeId} className="w-full bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? "Menyimpan..." : "Simpan Review"} <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function DriverMonitoringPage() {
  const [reviews, setReviews] = useState<DriverPerformanceReview[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [reviewsRes, driversRes] = await Promise.all([
        getDriverPerformanceReviews(),
        getSupirForAssignment(),
      ]);
      setReviews(reviewsRes as DriverPerformanceReview[]);
      setDrivers((driversRes as Driver[]) || []);
      setErrorMsg("");
    } catch {
      setErrorMsg("Gagal memuat data monitoring kinerja pengemudi. Coba muat ulang halaman.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const baikCount = reviews.filter(r => r.hasil === "Baik").length;
  const kritikalCount = reviews.filter(r => r.hasil === "Pelanggaran Kritikal").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <Link href="/hrd/recruitment/drivers" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ArrowLeft size={14} /> Kembali ke Rekrutmen Pengemudi
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A2530] flex items-center gap-2"><Gauge size={22} className="text-[#CC0000]" /> Monitoring Kinerja Pengemudi</h1>
            <p className="text-sm text-gray-500 mt-1">PR-SDM-02 — evaluasi kinerja triwulanan oleh Spv / Ka Div Operasional. Hasil &quot;Pelanggaran Kritikal&quot; otomatis terhubung ke sistem Surat Peringatan.</p>
          </div>
          <SubmitReviewForm drivers={drivers} onDone={load} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><ClipboardList size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Review</p>
              <p className="text-xl font-extrabold text-slate-800">{reviews.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Hasil &quot;Baik&quot;</p>
              <p className="text-xl font-extrabold text-slate-800">{baikCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pelanggaran Kritikal</p>
              <p className="text-xl font-extrabold text-slate-800">{kritikalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={Gauge} title="Belum ada riwayat monitoring kinerja pengemudi." description="Input review triwulanan pertama menggunakan tombol di atas." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-[10px]">Pengemudi</th>
                <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-[10px]">Periode</th>
                <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-[10px]">Evaluator</th>
                <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-[10px]">Hasil</th>
                <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-[10px]">Tindak Lanjut</th>
                <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-[10px]">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                  <td className="py-3 px-4 font-semibold text-slate-700">{r.employee_name}</td>
                  <td className="py-3 px-4 text-slate-500">{r.periode}</td>
                  <td className="py-3 px-4 text-slate-500">{r.evaluator}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${HASIL_STYLE[r.hasil] || "bg-slate-50 text-slate-500 border-slate-200"}`}>{r.hasil}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {r.tindak_lanjut || "-"}
                    {r.related_warning_id && (
                      <Link href="/hrd/relations/warnings" className="ml-1.5 text-[10px] text-[#CC0000] font-bold hover:underline">(Lihat SP)</Link>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={r.catatan}>{r.catatan || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
