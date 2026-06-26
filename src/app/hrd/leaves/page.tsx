"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Clock, Plus } from "lucide-react";
import { getLeaves, submitLeave, updateLeaveStatus } from "@/app/actions/leaves";

interface LeaveRecord {
  id: string; employee_id: string; employee_name: string; department: string;
  type: string; start_date: string; end_date: string; reason: string;
  status: string; created_at: string; updated_at: string;
}

const LEAVE_TYPES = ["Cuti Tahunan", "Cuti Sakit", "Cuti Melahirkan", "Izin", "Cuti Besar", "Lainnya"];

export default function LeavesPage() {
  const [data, setData] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [fType, setFType] = useState("Cuti Tahunan");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fReason, setFReason] = useState("");
  const [fErr, setFErr] = useState("");
  const [fLoading, setFLoading] = useState(false);

  useEffect(() => { getLeaves({}).then(d => { setData(d); setLoading(false); }); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doSubmit = async () => {
    if (!fStart || !fEnd) { setFErr("Tanggal wajib diisi."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    fd.append("type", fType); fd.append("start_date", fStart); fd.append("end_date", fEnd); fd.append("reason", fReason);
    const r = await submitLeave(fd);
    setFLoading(false);
    if (r.error) { showToast(r.error); return; }
    showToast("Cuti berhasil diajukan!");
    setShowForm(false);
    getLeaves({}).then(setData);
  };

  const doStatus = async (id: string, status: string) => {
    const result = await updateLeaveStatus(id, status);
    if (result?.error) { showToast(result.error); return; }
    setData(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    showToast(status === "Disetujui" ? "Cuti disetujui." : "Cuti ditolak.");
  };

  const filtered = data.filter(d => !statusFilter || d.status === statusFilter);
  const pending = data.filter(d => d.status === "Pending").length;
  const approved = data.filter(d => d.status === "Disetujui").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Cuti & Izin</h1>
          <p className="text-sm text-gray-500">Ajukan dan kelola permintaan cuti karyawan.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
          <Plus size={14} /> {showForm ? "Tutup" : "Ajukan Cuti"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Pengajuan", value: data.length, icon: <Calendar size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: pending, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", value: approved, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">Form Pengajuan Cuti</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Tipe</label>
              <select value={fType} onChange={e => setFType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Mulai</label>
                <input type="date" value={fStart} onChange={e => setFStart(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Selesai</label>
                <input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Alasan</label>
            <textarea value={fReason} onChange={e => setFReason(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          {fErr && <p className="text-red-500 text-xs">{fErr}</p>}
          <button onClick={doSubmit} disabled={fLoading} className="px-6 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-50">
            {fLoading ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </div>
      )}

      <div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs">
          <option value="">Semua Status</option>
          <option value="Pending">Pending</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Calendar size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-sm text-slate-500">Belum ada pengajuan cuti.</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
              <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tipe</th>
              <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Periode</th>
              <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase w-32">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/30">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{l.employee_name}<br /><span className="text-[10px] text-slate-400">{l.department}</span></td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">{l.type}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">{l.start_date} → {l.end_date}</td>
                  <td className="py-2.5 px-4 text-center"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${l.status === "Disetujui" ? "bg-emerald-50 text-emerald-600" : l.status === "Ditolak" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{l.status}</span></td>
                  <td className="py-2.5 px-4 text-center">
                    {l.status === "Pending" && (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => doStatus(l.id, "Disetujui")} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">Setujui</button>
                        <button onClick={() => doStatus(l.id, "Ditolak")} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold">Tolak</button>
                      </div>
                    )}
                    {l.status !== "Pending" && <span className="text-[10px] text-slate-400">{l.updated_at ? new Date(l.updated_at).toLocaleDateString("id-ID") : ""}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
