"use client";

import { useState, useEffect } from "react";
import { Clock3, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getLembur, reviewLembur } from "@/app/actions/workforce-time";
import EmptyState from "@/components/EmptyState";

interface Lembur {
  id: string; karyawan_nama: string; tanggal: string; jam_mulai: string | null; jam_selesai: string | null; alasan: string | null; hours: number | null; amount: number | null; status: string;
}

const STATUS_STYLES: Record<string, string> = {
  Disetujui: "bg-emerald-50 text-emerald-600",
  Ditolak: "bg-red-50 text-red-600",
  Pending: "bg-amber-50 text-amber-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_STYLES[status] || "bg-slate-50 text-slate-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "Disetujui" ? "bg-emerald-500" : status === "Ditolak" ? "bg-red-500" : "bg-amber-500"}`} />
      {status}
    </span>
  );
}

export default function DeptOvertimePage() {
  const [data, setData] = useState<Lembur[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { getLembur().then((d) => { setData(d as Lembur[]); setLoading(false); }); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doReview = async (id: string, approve: boolean) => {
    setBusyId(id);
    const result = await reviewLembur(id, approve);
    setBusyId(null);
    if (result && "error" in result) { showToast(result.error as string); return; }
    setData((prev) => prev.map((d) => (d.id === id ? { ...d, status: approve ? "Disetujui" : "Ditolak" } : d)));
    showToast(approve ? "Lembur disetujui." : "Lembur ditolak.");
  };

  const filtered = data.filter((d) => !statusFilter || d.status === statusFilter);
  const pending = data.filter((d) => d.status === "Pending").length;
  const approved = data.filter((d) => d.status === "Disetujui").length;
  const rejected = data.filter((d) => d.status === "Ditolak").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Lembur Departemen</h1>
        <p className="text-sm text-gray-500">Setujui atau tolak pengajuan lembur karyawan di departemen Anda.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Pengajuan", value: data.length, icon: <Clock3 size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: pending, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", value: approved, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", value: rejected, icon: <XCircle size={18} />, color: "bg-red-50 text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs">
          <option value="">Semua Status</option>
          <option value="Pending">Pending</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Clock3} title="Belum ada pengajuan lembur." className="bg-white border-slate-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tanggal</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Jam</th>
                <th className="text-right py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Estimasi</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase w-36">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 text-xs">
                      <p className="font-bold text-slate-800">{r.karyawan_nama}</p>
                      {r.alasan && <p className="text-[10px] text-slate-400 italic">&ldquo;{r.alasan}&rdquo;</p>}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{r.tanggal}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{r.jam_mulai || "—"}–{r.jam_selesai || "—"}</td>
                    <td className="py-2.5 px-4 text-right text-xs font-bold text-slate-600">{r.amount ? `Rp ${Number(r.amount).toLocaleString("id-ID")}` : "—"}</td>
                    <td className="py-2.5 px-4 text-center"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-4 text-center">
                      {r.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => doReview(r.id, true)} disabled={busyId === r.id}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold disabled:opacity-50">Setujui</button>
                          <button onClick={() => doReview(r.id, false)} disabled={busyId === r.id}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold disabled:opacity-50">Tolak</button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
