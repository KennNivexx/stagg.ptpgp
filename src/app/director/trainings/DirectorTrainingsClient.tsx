"use client";

import { useState } from "react";
import { GraduationCap, CheckCircle2, XCircle, Clock } from "lucide-react";
import { reviewTrainingBudget } from "@/app/actions/trainings";
import EmptyState from "@/components/EmptyState";

export interface TrainingRow {
  id: string; title: string; department: string | null; description: string;
  date_start: string; date_end: string; proposed_cost: number | null; budget_status: string;
}

export default function DirectorTrainingsClient({ awaiting: initialAwaiting, history }: { awaiting: TrainingRow[]; history: TrainingRow[] }) {
  const [awaiting, setAwaiting] = useState(initialAwaiting);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [costInputs, setCostInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const decide = async (id: string, approve: boolean) => {
    setBusyId(id);
    const finalCostRaw = costInputs[id];
    const finalCost = finalCostRaw ? parseInt(finalCostRaw, 10) : undefined;
    const result = await reviewTrainingBudget(id, approve, finalCost);
    setBusyId(null);
    if ("error" in result) { showToast(result.error); return; }
    setAwaiting((prev) => prev.filter((t) => t.id !== id));
    showToast(approve ? "Anggaran disetujui, karyawan telah diberi tahu." : "Pengajuan ditolak.");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Anggaran Pelatihan</h1>
        <p className="text-sm text-gray-500">Setujui atau tolak biaya pelatihan yang diajukan HRD. Karyawan baru diberi tahu setelah Anda menyetujui.</p>
      </div>

      <div>
        <h2 className="text-sm font-extrabold text-slate-700 mb-3 flex items-center gap-2"><Clock size={14} className="text-amber-500" /> Menunggu Keputusan ({awaiting.length})</h2>
        {awaiting.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Tidak ada pengajuan menunggu." className="bg-white border-slate-100" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {awaiting.map((t) => (
              <div key={t.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.department || "Semua Departemen"} &middot; {t.date_start} → {t.date_end}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{t.description}</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">Estimasi biaya: Rp {(t.proposed_cost || 0).toLocaleString("id-ID")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Biaya final (opsional)"
                    value={costInputs[t.id] || ""}
                    onChange={(e) => setCostInputs((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    className="w-36 px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                  <button onClick={() => decide(t.id, true)} disabled={busyId === t.id}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Setujui
                  </button>
                  <button onClick={() => decide(t.id, false)} disabled={busyId === t.id}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
                    <XCircle size={13} /> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-extrabold text-slate-700 mb-3">Riwayat Keputusan</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {history.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-800">{t.title}</p>
                  <p className="text-[10px] text-slate-400">{t.department || "Semua Departemen"} &middot; Rp {(t.proposed_cost || 0).toLocaleString("id-ID")}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${t.budget_status === "Disetujui" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{t.budget_status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
