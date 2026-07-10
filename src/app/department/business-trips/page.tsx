"use client";

import { useState, useEffect } from "react";
import { Plane, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getBusinessTrips, updateBusinessTripStatus } from "@/app/actions/business-trips";
import EmptyState from "@/components/EmptyState";

interface TripRecord {
  id: string; employee_id: string; employee_name: string; department: string;
  destination: string; start_date: string; end_date: string; reason: string;
  status: string; created_at: string; updated_at: string;
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

function countDays(start: string, end: string) {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

export default function DeptBusinessTripsPage() {
  const [data, setData] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { getBusinessTrips({}).then((d) => { setData(d as TripRecord[]); setLoading(false); }); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doStatus = async (id: string, status: string) => {
    setBusyId(id);
    const result = await updateBusinessTripStatus(id, status);
    setBusyId(null);
    if ("error" in result) { showToast(result.error); return; }
    setData((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    showToast(status === "Disetujui" ? "Perjalanan dinas disetujui." : "Perjalanan dinas ditolak.");
  };

  const filtered = data.filter((d) => !statusFilter || d.status === statusFilter);
  const pending = data.filter((d) => d.status === "Pending").length;
  const approved = data.filter((d) => d.status === "Disetujui").length;
  const rejected = data.filter((d) => d.status === "Ditolak").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Perjalanan Dinas Departemen</h1>
        <p className="text-sm text-gray-500">Setujui atau tolak pengajuan dinas karyawan di departemen Anda. Selama masa dinas disetujui, karyawan dikecualikan dari cek radius lokasi kerja saat absen.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Pengajuan", value: data.length, icon: <Plane size={18} />, color: "bg-blue-50 text-blue-600" },
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
        <EmptyState icon={Plane} title="Belum ada pengajuan dinas." className="bg-white border-slate-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tujuan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Periode</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Hari</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase w-36">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 text-xs">
                      <p className="font-bold text-slate-800">{t.employee_name}</p>
                      {t.reason && <p className="text-[10px] text-slate-400 italic">&ldquo;{t.reason}&rdquo;</p>}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{t.destination}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{t.start_date} → {t.end_date}</td>
                    <td className="py-2.5 px-4 text-center text-xs font-bold text-slate-600">{countDays(t.start_date, t.end_date)}</td>
                    <td className="py-2.5 px-4 text-center"><StatusBadge status={t.status} /></td>
                    <td className="py-2.5 px-4 text-center">
                      {t.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => doStatus(t.id, "Disetujui")} disabled={busyId === t.id}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold disabled:opacity-50">Setujui</button>
                          <button onClick={() => doStatus(t.id, "Ditolak")} disabled={busyId === t.id}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold disabled:opacity-50">Tolak</button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">{t.updated_at ? new Date(t.updated_at).toLocaleDateString("id-ID") : ""}</span>
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
