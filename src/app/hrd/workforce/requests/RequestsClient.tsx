"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { FileText, Clock, CheckCircle2, XCircle, Users, Trash2, Plus } from "lucide-react";
import { getRequests, updateRequestStatus, deleteRequest } from "@/app/actions/requests";

interface Request {
  id: string; department: string; position: string; quantity: number;
  reason: string; urgency: string; status: string; requested_by: string; created_at: string;
}

interface Props { departments: string[]; positions: string[]; }

export default function RequestsClient({ departments: _departments, positions: _positions }: Props) {
  const [data, setData] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => { getRequests().then(setData).finally(() => setLoading(false)); }, []);

  useAutoRefresh(() => { getRequests().then(setData); });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doStatus = async (id: string, status: string) => {
    await updateRequestStatus(id, status);
    setData(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    const req = data.find(r => r.id === id);
    if (status === "Disetujui" && req) {
      showToast(`Disetujui! Headcount ${req.department} +${req.quantity}.`);
    } else if (status === "Ditolak") {
      showToast("Permintaan ditolak.");
    }
  };

  const doDelete = async (id: string) => { await deleteRequest(id); getRequests().then(setData); };

  const getStatusBadge = (s: string) => {
    const m: Record<string, string> = { Pending: "bg-amber-50 text-amber-700", "Direview HRD": "bg-blue-50 text-blue-700", Disetujui: "bg-emerald-50 text-emerald-700", Ditolak: "bg-red-50 text-red-700" };
    return m[s] || "bg-slate-100 text-slate-600";
  };

  const pending = data.filter(r => r.status === "Pending").length;
  const approved = data.filter(r => r.status === "Disetujui").length;
  const rejected = data.filter(r => r.status === "Ditolak").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Permintaan Tenaga Kerja</h1>
        <p className="text-sm text-gray-500">Ajukan dan pantau permintaan penambahan tenaga kerja per departemen.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: data.length, icon: <FileText size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: pending, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", value: approved, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", value: rejected, icon: <XCircle size={18} />, color: "bg-red-50 text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Permintaan</h3>
            <span className="text-[10px] text-slate-400">Diajukan oleh Department Manager</span>
          </div>
        </div>
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" /></div>
            ) : data.length === 0 ? (
              <div className="p-12 text-center"><Users size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-sm text-slate-500">Belum ada permintaan.</p></div>
            ) : (
              data.map(req => (
                <div key={req.id} className="p-4 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400">{req.id.slice(0, 12)}</span>
                        <span className="text-sm font-bold text-slate-800">{req.position}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${req.urgency === "Tinggi" ? "bg-red-50 text-red-700 border-red-200" : req.urgency === "Sedang" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{req.urgency}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span><Users size={10} /> {req.department}</span>
                        <span>Jumlah: {req.quantity}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === "Pending" && (
                        <>
                          <button onClick={() => doStatus(req.id, "Direview HRD")} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold transition-colors">Approve ke Director</button>
                          <button onClick={() => doStatus(req.id, "Ditolak")} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold transition-colors">Tolak</button>
                        </>
                      )}
                      {req.status === "Direview HRD" && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700">Menunggu Director</span>
                      )}
                      {req.status === "Disetujui" && (
                        <Link href={`/hrd/recruitment/new?dept=${encodeURIComponent(req.department)}&pos=${encodeURIComponent(req.position)}&qty=${req.quantity}&req=${req.id}`}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition-colors inline-flex items-center gap-1">
                          <Plus size={10} /> Buat Lowongan
                        </Link>
                      )}
                      {req.status === "Ditolak" && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-700">Ditolak</span>
                      )}
                      <button onClick={() => doDelete(req.id)} className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  {req.reason && <p className="text-xs text-slate-500 mt-1">{req.reason}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    {req.requested_by && <span>{req.requested_by}</span>}
                    <span>{new Date(req.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  );
}
