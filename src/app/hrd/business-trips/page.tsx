"use client";

import { useState, useEffect } from "react";
import { Plane, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getBusinessTrips } from "@/app/actions/business-trips";
import EmptyState from "@/components/EmptyState";

interface TripRecord {
  id: string; employee_id: string; employee_name: string; department: string;
  destination: string; start_date: string; end_date: string; reason: string;
  status: string; approved_by?: string; created_at: string; updated_at: string;
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

export default function HRDBusinessTripsPage() {
  const [data, setData] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { getBusinessTrips({}).then((d) => { setData(d as TripRecord[]); setLoading(false); }); }, []);

  const filtered = data.filter((d) => !statusFilter || d.status === statusFilter);
  const pending = data.filter((d) => d.status === "Pending").length;
  const approved = data.filter((d) => d.status === "Disetujui").length;
  const rejected = data.filter((d) => d.status === "Ditolak").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Perjalanan Dinas</h1>
        <p className="text-sm text-gray-500">Laporan pengajuan perjalanan dinas seluruh karyawan. Keputusan disetujui/ditolak dilakukan oleh atasan departemen masing-masing.</p>
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
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Plane} title="Belum ada pengajuan dinas." className="bg-white border-slate-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Departemen</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tujuan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Periode</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Disetujui Oleh</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 text-xs">
                      <p className="font-bold text-slate-800">{t.employee_name}</p>
                      {t.reason && <p className="text-[10px] text-slate-400 italic">&ldquo;{t.reason}&rdquo;</p>}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{t.department}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{t.destination}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{t.start_date} → {t.end_date}</td>
                    <td className="py-2.5 px-4 text-center"><StatusBadge status={t.status} /></td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{t.approved_by || "-"}</td>
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
