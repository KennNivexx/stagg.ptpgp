"use client";

import { useState, useEffect } from "react";
import { Truck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getVehicleRequests, updateVehicleRequestStatus, type VehicleProcurementRequest } from "@/app/actions/vehicle-procurement";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLES: Record<string, string> = {
  Disetujui: "bg-emerald-50 text-emerald-600",
  Ditolak: "bg-red-50 text-red-600",
  Pending: "bg-amber-50 text-amber-600",
};

export default function DirectorVehicleRequestsPage() {
  const [data, setData] = useState<VehicleProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => { getVehicleRequests().then(d => { setData(d); setLoading(false); }); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doApprove = async (id: string) => {
    setBusyId(id);
    const result = await updateVehicleRequestStatus(id, "Disetujui");
    setBusyId(null);
    if ("error" in result) { showToast(result.error); return; }
    setData(prev => prev.map(r => r.id === id ? { ...r, status: "Disetujui" } : r));
    showToast("Pengadaan disetujui.");
  };

  const doReject = async () => {
    if (!rejectFor || !rejectNote.trim()) { showToast("Alasan penolakan wajib diisi."); return; }
    setBusyId(rejectFor);
    const result = await updateVehicleRequestStatus(rejectFor, "Ditolak", rejectNote.trim());
    setBusyId(null);
    if ("error" in result) { showToast(result.error); return; }
    setData(prev => prev.map(r => r.id === rejectFor ? { ...r, status: "Ditolak" } : r));
    showToast("Pengadaan ditolak.");
    setRejectFor(null); setRejectNote("");
  };

  const pending = data.filter(r => r.status === "Pending").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengadaan Kendaraan</h1>
        <p className="text-sm text-gray-500">Setujui atau tolak pengajuan pembelian kendaraan baru dari HRD.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: data.length, icon: <Truck size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: pending, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Diproses", value: data.length - pending, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Truck} title="Belum ada pengajuan pengadaan kendaraan." className="bg-white border-slate-100" />
      ) : (
        <div className="space-y-3">
          {data.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.quantity}x {r.vehicle_type}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Diajukan oleh {r.requested_by} &middot; {new Date(r.created_at).toLocaleDateString("id-ID")}</p>
                  {r.estimated_cost != null && <p className="text-xs text-slate-600 mt-1">Estimasi biaya: Rp {r.estimated_cost.toLocaleString("id-ID")}</p>}
                  {r.reason && <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{r.reason}&rdquo;</p>}
                  {r.status === "Ditolak" && r.rejection_reason && <p className="text-xs text-red-500 mt-1">Alasan: {r.rejection_reason}</p>}
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-500"}`}>{r.status}</span>
              </div>
              {r.status === "Pending" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                  <button onClick={() => doApprove(r.id)} disabled={busyId === r.id} className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} /> Setujui
                  </button>
                  <button onClick={() => setRejectFor(r.id)} disabled={busyId === r.id} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                    <XCircle size={13} /> Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Alasan Penolakan</h3>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3} autoFocus className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectFor(null); setRejectNote(""); }} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Batal</button>
              <button onClick={doReject} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold">Tolak Pengajuan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
