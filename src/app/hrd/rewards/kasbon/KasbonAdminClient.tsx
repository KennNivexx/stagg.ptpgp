"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Wallet, CheckCircle2, XCircle, X, Users, Clock } from "lucide-react";
import { decideKasbon, type KasbonRow } from "@/app/actions/kasbon";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLE: Record<string, string> = {
  Diajukan: "bg-amber-50 text-amber-700",
  Disetujui: "bg-sky-50 text-sky-700",
  Berjalan: "bg-blue-50 text-blue-700",
  Lunas: "bg-emerald-50 text-emerald-700",
  Ditolak: "bg-red-50 text-red-700",
  Dibatalkan: "bg-slate-100 text-slate-500",
};

function fmt(n: number) { return (n || 0).toLocaleString("id-ID"); }

export default function KasbonAdminClient({ initialKasbon }: { initialKasbon: KasbonRow[] }) {
  const router = useRouter();
  const [rejectTarget, setRejectTarget] = useState<KasbonRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { pendingCount, runningCount, totalOutstanding } = useMemo(() => ({
    pendingCount: initialKasbon.filter((k) => k.status === "Diajukan").length,
    runningCount: initialKasbon.filter((k) => k.status === "Berjalan").length,
    totalOutstanding: initialKasbon.filter((k) => k.status === "Berjalan").reduce((s, k) => s + k.sisa_pokok, 0),
  }), [initialKasbon]);

  const handleApprove = async (id: string) => {
    setBusyId(id); setMsg(null);
    const res = await decideKasbon(id, "Disetujui");
    setBusyId(null);
    if ("error" in res) { setMsg({ type: "error", text: res.error }); return; }
    router.refresh();
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id); setMsg(null);
    const res = await decideKasbon(rejectTarget.id, "Ditolak", rejectReason);
    setBusyId(null);
    if ("error" in res) { setMsg({ type: "error", text: res.error }); return; }
    setRejectTarget(null); setRejectReason("");
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Kasbon Karyawan</h1>
        <p className="text-sm text-gray-500">Kelola pengajuan pinjaman kasbon dan cicilan potong gaji otomatis.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Persetujuan</p><p className="text-xl font-extrabold text-slate-800">{pendingCount}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Sedang Berjalan</p><p className="text-xl font-extrabold text-slate-800">{runningCount}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Wallet size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Outstanding</p><p className="text-xl font-extrabold text-slate-800">Rp {fmt(totalOutstanding)}</p></div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      {initialKasbon.length === 0 ? (
        <EmptyState icon={Wallet} title="Belum ada pengajuan kasbon." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Karyawan", "Jumlah", "Cicilan", "Sisa Pokok", "Status", ""].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {initialKasbon.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 text-xs">{k.full_name || "-"}</p>
                      <p className="text-[10px] text-slate-400">{k.department || "-"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{k.alasan}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">Rp {fmt(k.jumlah_pengajuan)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{k.jumlah_cicilan}x &bull; Rp {fmt(k.cicilan_per_bulan)}/bln</td>
                    <td className="px-4 py-3 text-xs text-slate-600">Rp {fmt(k.sisa_pokok)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[k.status] || "bg-slate-50 text-slate-600"}`}>{k.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {k.status === "Diajukan" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleApprove(k.id)} disabled={busyId === k.id}
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Setujui
                          </button>
                          <button onClick={() => { setRejectTarget(k); setRejectReason(""); }} disabled={busyId === k.id}
                            className="px-2.5 py-1.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-md hover:bg-red-100 disabled:opacity-50 flex items-center gap-1">
                            <XCircle size={11} /> Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRejectTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-red-700 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><XCircle size={14} /> Tolak Kasbon</h3>
              <button onClick={() => setRejectTarget(null)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                <strong>{rejectTarget.full_name}</strong> — Rp {fmt(rejectTarget.jumlah_pengajuan)}
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Alasan Penolakan</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setRejectTarget(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold">Batal</button>
                <button onClick={handleReject} disabled={busyId === rejectTarget.id || !rejectReason.trim()}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                  {busyId === rejectTarget.id ? "Memproses..." : "Tolak"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
