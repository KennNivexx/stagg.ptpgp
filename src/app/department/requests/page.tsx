"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Users, Filter } from "lucide-react";
import { getDeptData } from "@/app/actions/department";
import { getCookie } from "@/lib/cookie-client";
import { EMAIL_TO_DEPT } from "@/lib/dept-map";

interface Request {
  id: string; department: string; position: string;
  quantity: number; reason: string; urgency: string; status: string;
  requested_by: string; created_at: string;
}

const STATUS_FILTERS = ["Semua", "Pending", "Disetujui", "Ditolak"];

export default function DeptRequests() {
  const [deptName, setDeptName] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Semua");

  const loadData = async (dname: string) => {
    setLoading(true);
    try {
      const data = await getDeptData(dname);
      setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const email = getCookie("user_email");
    const department = EMAIL_TO_DEPT[email] || "";
    setDeptName(department);
    if (department) loadData(department);
  }, []);

  const filtered = statusFilter === "Semua"
    ? requests
    : requests.filter(r => r.status === statusFilter);

  const getStatusBadge = (s: string) => {
    const m: Record<string, string> = {
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      Disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Ditolak: "bg-red-50 text-red-700 border-red-200",
    };
    return m[s] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  const getUrgencyBadge = (u: string) => {
    const m: Record<string, string> = {
      Tinggi: "bg-red-50 text-red-700 border-red-200",
      Sedang: "bg-amber-50 text-amber-700 border-amber-200",
      Rendah: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return m[u] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const approvedCount = requests.filter(r => r.status === "Disetujui").length;
  const rejectedCount = requests.filter(r => r.status === "Ditolak").length;

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-1">Riwayat Permintaan</h1>
        <p className="text-sm text-gray-500">{deptName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending", value: pendingCount, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", value: approvedCount, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", value: rejectedCount, icon: <XCircle size={18} />, color: "bg-red-50 text-red-600" },
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
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Permintaan</h3>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              {STATUS_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center"><Users size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-sm text-slate-500">Belum ada permintaan.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Posisi</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Jumlah</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Urgensi</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Alasan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{req.position}</td>
                    <td className="px-4 py-3 text-slate-600">{req.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getUrgencyBadge(req.urgency)}`}>{req.urgency}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{req.reason || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getStatusBadge(req.status)}`}>{req.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(req.created_at).toLocaleDateString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
