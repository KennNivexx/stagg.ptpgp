"use client";

import { useState } from "react";
import { Lightbulb, CheckCircle2, XCircle, Clock } from "lucide-react";
import { reviewCompetencyRequest } from "@/app/actions/skills";
import EmptyState from "@/components/EmptyState";

export interface CompetencyRequest {
  id: string; name: string; category: string; department: string | null;
  requested_by: string; status: string; created_at: string; decided_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-600",
  Disetujui: "bg-emerald-50 text-emerald-600",
  Ditolak: "bg-red-50 text-red-600",
};

export default function DirectorCompetencyClient({ requests: initial }: { requests: CompetencyRequest[] }) {
  const [requests, setRequests] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const decide = async (id: string, approve: boolean) => {
    setBusyId(id);
    const result = await reviewCompetencyRequest(id, approve);
    setBusyId(null);
    if ("error" in result) { showToast(result.error); return; }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: approve ? "Disetujui" : "Ditolak" } : r)));
    showToast(approve ? "Kompetensi disetujui dan ditambahkan ke pustaka." : "Usulan ditolak.");
  };

  const pending = requests.filter((r) => r.status === "Pending");
  const decided = requests.filter((r) => r.status !== "Pending");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Usulan Kompetensi Baru</h1>
        <p className="text-sm text-gray-500">HRD mengusulkan kompetensi baru di sini — kompetensi hanya masuk pustaka setelah Anda setujui.</p>
      </div>

      <div>
        <h2 className="text-sm font-extrabold text-slate-700 mb-3 flex items-center gap-2"><Clock size={14} className="text-amber-500" /> Menunggu Keputusan ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState icon={Lightbulb} title="Tidak ada usulan menunggu." className="bg-white border-slate-100" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {pending.map((r) => (
              <div key={r.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.category} {r.department ? `— ${r.department}` : "— Berlaku semua departemen"}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Diusulkan oleh {r.requested_by} &middot; {new Date(r.created_at).toLocaleDateString("id-ID")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => decide(r.id, true)} disabled={busyId === r.id}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Setujui
                  </button>
                  <button onClick={() => decide(r.id, false)} disabled={busyId === r.id}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
                    <XCircle size={13} /> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {decided.length > 0 && (
        <div>
          <h2 className="text-sm font-extrabold text-slate-700 mb-3">Riwayat Keputusan</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {decided.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-800">{r.name}</p>
                  <p className="text-[10px] text-slate-400">{r.category} {r.department ? `— ${r.department}` : ""}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-500"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
