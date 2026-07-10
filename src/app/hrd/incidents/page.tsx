"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { getIncidents } from "@/app/actions/incidents";
import EmptyState from "@/components/EmptyState";

interface IncidentRecord {
  id: string; employee_id: string; employee_name: string; department: string;
  title: string; description: string; severity: string; status: string;
  resolved_by: string; resolution_notes: string; created_at: string; updated_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  Selesai: "bg-emerald-50 text-emerald-600",
  Ditindaklanjuti: "bg-blue-50 text-blue-600",
  Dilaporkan: "bg-amber-50 text-amber-600",
};

export default function HRDIncidentsPage() {
  const [data, setData] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { getIncidents({}).then((d) => { setData(d as IncidentRecord[]); setLoading(false); }); }, []);

  const filtered = data.filter((d) => !statusFilter || d.status === statusFilter);
  const open = data.filter((d) => d.status !== "Selesai").length;
  const resolved = data.filter((d) => d.status === "Selesai").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Insiden</h1>
        <p className="text-sm text-gray-500">Laporan insiden/kerusakan seluruh departemen. Tindak lanjut dilakukan oleh atasan departemen masing-masing.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: data.length, icon: <AlertTriangle size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Belum Selesai", value: open, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Selesai", value: resolved, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
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
          <option value="Dilaporkan">Dilaporkan</option>
          <option value="Ditindaklanjuti">Ditindaklanjuti</option>
          <option value="Selesai">Selesai</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Belum ada laporan insiden." className="bg-white border-slate-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Departemen</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Judul</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Keparahan</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Ditindaklanjuti Oleh</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{r.employee_name}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{r.department}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{r.title}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{r.severity}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{r.resolved_by || "-"}</td>
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
