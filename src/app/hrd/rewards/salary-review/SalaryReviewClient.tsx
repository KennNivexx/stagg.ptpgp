"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, TrendingUp, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { saveSalaryReview, updateSalaryReviewStatus, saveMeritMatrix, deleteMeritMatrix, recommendMeritPct } from "@/app/actions/rewards";
import EmptyState from "@/components/EmptyState";

type Employee = { id: string; full_name: string; department: string; position: string };
type Grade = { id: string; kode: string; nama: string };

interface Props {
  employees: Employee[];
  grades: Grade[];
  reviews: Array<Record<string, unknown>>;
  meritMatrix: Array<Record<string, unknown>>;
}

const REVIEW_TYPES = ["Merit Increase", "Grade Adjustment", "Promotion Adjustment", "Market Adjustment"];

export default function SalaryReviewClient({ employees, grades, reviews, meritMatrix }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"review" | "matrix">("review");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [salaryBefore, setSalaryBefore] = useState("");
  const [salaryAfter, setSalaryAfter] = useState("");
  const [recommending, setRecommending] = useState(false);

  const showMsg = (type: "success" | "error", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 5000); };

  const handleRecommend = async () => {
    if (!selectedEmployee) { showMsg("error", "Pilih karyawan terlebih dahulu."); return; }
    setRecommending(true);
    const rec = await recommendMeritPct(selectedEmployee);
    setRecommending(false);
    if (rec.kpiScore == null) { showMsg("error", "Karyawan belum punya skor KPI — rekomendasi tidak bisa dihitung."); return; }
    if (rec.meritPct === 0) { showMsg("error", `Skor KPI ${rec.kpiScore} tidak cocok dengan band Merit Matrix manapun.`); return; }
    const base = Number(salaryBefore) || 0;
    if (base > 0) setSalaryAfter(String(Math.round(base * (1 + rec.meritPct / 100))));
    showMsg("success", `Rekomendasi: +${rec.meritPct}% (skor KPI ${rec.kpiScore}).`);
  };

  const handleSaveReview = async (fd: FormData) => {
    setBusy(true);
    const res = await saveSalaryReview(fd);
    setBusy(false);
    if ("error" in res) { showMsg("error", res.error); return; }
    showMsg("success", "Salary Review berhasil diajukan.");
    setSelectedEmployee(""); setSalaryBefore(""); setSalaryAfter("");
    router.refresh();
  };

  const handleDecision = async (id: string, approve: boolean) => {
    setBusy(true);
    const res = await updateSalaryReviewStatus(id, approve);
    setBusy(false);
    if ("error" in res) { showMsg("error", res.error); return; }
    router.refresh();
  };

  const handleSaveMerit = async (fd: FormData) => {
    setBusy(true);
    const res = await saveMeritMatrix(fd);
    setBusy(false);
    if ("error" in res) { showMsg("error", res.error); return; }
    router.refresh();
  };

  const handleDeleteMerit = async (id: string) => {
    setBusy(true);
    await deleteMeritMatrix(id);
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5">
        {(["review", "matrix"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${tab === t ? "bg-pgp-red text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
            {t === "review" ? "Salary Review" : "Merit Matrix"}
          </button>
        ))}
      </div>

      {msg && <div className={`p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}

      {tab === "review" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Ajukan Salary Review</h3>
            <form action={handleSaveReview} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Karyawan</label>
                <select name="employee_id" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} required
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-xs bg-white">
                  <option value="">Pilih karyawan...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.position}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jenis Review</label>
                <select name="review_type" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs bg-white">
                  {REVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal Efektif</label>
                <input name="effective_date" type="date" className="w-full border border-gray-200 p-2.5 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gaji Sekarang (Rp)</label>
                <input name="salary_before" type="number" min="0" value={salaryBefore} onChange={e => setSalaryBefore(e.target.value)} className="w-full border border-gray-200 p-2.5 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gaji Baru (Rp)</label>
                <div className="flex gap-2">
                  <input name="salary_after" type="number" min="0" required value={salaryAfter} onChange={e => setSalaryAfter(e.target.value)} className="flex-1 border border-gray-200 p-2.5 rounded-xl text-xs" />
                  <button type="button" onClick={handleRecommend} disabled={recommending}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold disabled:opacity-50 flex items-center gap-1 shrink-0">
                    <Sparkles size={12} /> {recommending ? "..." : "Rekomendasi"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grade Lama</label>
                <select name="grade_before" className="w-full border border-gray-200 p-2.5 rounded-xl text-xs bg-white">
                  <option value="">-</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.kode} — {g.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grade Baru</label>
                <select name="grade_after" className="w-full border border-gray-200 p-2.5 rounded-xl text-xs bg-white">
                  <option value="">-</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.kode} — {g.nama}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alasan</label>
                <input name="reason" placeholder="Alasan review..." className="w-full border border-gray-200 p-2.5 rounded-xl text-xs" />
              </div>
              <button type="submit" disabled={busy} className="sm:col-span-2 py-2.5 bg-pgp-red hover:bg-pgp-red-hover text-white rounded-xl text-xs font-bold disabled:opacity-50">
                {busy ? "Mengajukan..." : "Ajukan Salary Review"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Salary Review</h3>
            </div>
            {reviews.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Belum ada salary review." />
            ) : (
              <div className="divide-y divide-slate-50">
                {reviews.map((r) => {
                  const emp = r.karyawan as Record<string, string> | undefined;
                  const status = r.status as string;
                  return (
                    <div key={r.id as string} className="p-5 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{emp?.full_name || "-"} <span className="text-[10px] font-normal text-slate-400">({r.review_type as string})</span></p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Rp {Number(r.salary_before || 0).toLocaleString("id-ID")} → Rp {Number(r.salary_after || 0).toLocaleString("id-ID")}
                          {r.reason ? ` · ${r.reason}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          status === "Disetujui" ? "bg-emerald-50 text-emerald-700" : status === "Ditolak" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                        }`}>{status}</span>
                        {status === "Menunggu" && (
                          <>
                            <button onClick={() => handleDecision(r.id as string, true)} disabled={busy} title="Setujui (Direktur)"
                              className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600"><CheckCircle2 size={16} /></button>
                            <button onClick={() => handleDecision(r.id as string, false)} disabled={busy} title="Tolak (Direktur)"
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><XCircle size={16} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "matrix" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Merit Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">Band skor KPI × grade → % kenaikan rekomendasi</p>
          </div>
          <div className="divide-y divide-slate-50">
            {meritMatrix.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Belum ada Merit Matrix." />
            ) : meritMatrix.map((m) => {
              const grade = m.grade_jabatan as { nama: string } | null;
              return (
                <div key={m.id as string} className="p-4 flex items-center justify-between">
                  <p className="text-xs text-slate-700">
                    Skor {m.performance_min as number}–{m.performance_max as number} · {grade?.nama || "Semua Grade"} → <b>+{m.merit_pct as number}%</b>
                  </p>
                  <button onClick={() => handleDeleteMerit(m.id as string)} disabled={busy} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                </div>
              );
            })}
          </div>
          <form action={handleSaveMerit} className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input name="performance_min" type="number" min="0" max="100" placeholder="Skor Min" required className="border border-gray-200 p-2.5 rounded-xl text-xs" />
            <input name="performance_max" type="number" min="0" max="100" placeholder="Skor Max" required className="border border-gray-200 p-2.5 rounded-xl text-xs" />
            <select name="grade_id" className="border border-gray-200 p-2.5 rounded-xl text-xs bg-white">
              <option value="">Semua Grade</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.kode}</option>)}
            </select>
            <input name="merit_pct" type="number" min="0" placeholder="% Kenaikan" required className="border border-gray-200 p-2.5 rounded-xl text-xs" />
            <button type="submit" disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold disabled:opacity-50">
              <Plus size={13} /> Tambah
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
