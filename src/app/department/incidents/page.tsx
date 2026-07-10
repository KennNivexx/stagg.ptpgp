"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { getIncidents, updateIncidentStatus } from "@/app/actions/incidents";
import EmptyState from "@/components/EmptyState";

interface IncidentRecord {
  id: string; employee_id: string; employee_name: string; department: string;
  title: string; description: string; severity: string; status: string;
  resolution_notes: string; created_at: string; updated_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  Selesai: "bg-emerald-50 text-emerald-600",
  Ditindaklanjuti: "bg-blue-50 text-blue-600",
  Dilaporkan: "bg-amber-50 text-amber-600",
};

const SEVERITY_STYLES: Record<string, string> = {
  Berat: "bg-red-50 text-red-700 border-red-200",
  Sedang: "bg-amber-50 text-amber-700 border-amber-200",
  Ringan: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function DeptIncidentsPage() {
  const [data, setData] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  useEffect(() => { getIncidents({}).then((d) => { setData(d as IncidentRecord[]); setLoading(false); }); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doStatus = async (id: string, status: string) => {
    setBusyId(id);
    const result = await updateIncidentStatus(id, status, noteDraft[id]);
    setBusyId(null);
    if ("error" in result) { showToast(result.error); return; }
    setData((prev) => prev.map((d) => (d.id === id ? { ...d, status, resolution_notes: noteDraft[id] || d.resolution_notes } : d)));
    showToast(`Status diperbarui ke ${status}.`);
  };

  const filtered = data.filter((d) => !statusFilter || d.status === statusFilter);
  const open = data.filter((d) => d.status !== "Selesai").length;
  const resolved = data.filter((d) => d.status === "Selesai").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Insiden Departemen</h1>
        <p className="text-sm text-gray-500">Tindak lanjuti laporan kerusakan/insiden dari karyawan di departemen Anda.</p>
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
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Belum ada laporan insiden." className="bg-white border-slate-100" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800">{r.title}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${SEVERITY_STYLES[r.severity] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{r.severity}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Dilaporkan oleh <span className="font-semibold">{r.employee_name}</span> &middot; {new Date(r.created_at).toLocaleDateString("id-ID")}</p>
                  {r.description && <p className="text-xs text-slate-600 mt-2">{r.description}</p>}
                </div>
              </div>
              {r.status !== "Selesai" && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex flex-col sm:flex-row gap-2">
                  <input
                    value={noteDraft[r.id] ?? ""}
                    onChange={(e) => setNoteDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Catatan tindak lanjut (opsional)..."
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                  <div className="flex gap-2">
                    {r.status === "Dilaporkan" && (
                      <button onClick={() => doStatus(r.id, "Ditindaklanjuti")} disabled={busyId === r.id}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold disabled:opacity-50">Tindak Lanjuti</button>
                    )}
                    <button onClick={() => doStatus(r.id, "Selesai")} disabled={busyId === r.id}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold disabled:opacity-50">Tandai Selesai</button>
                  </div>
                </div>
              )}
              {r.status === "Selesai" && r.resolution_notes && (
                <p className="text-[11px] text-emerald-600 italic mt-2 pt-2 border-t border-slate-50">Catatan: {r.resolution_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
