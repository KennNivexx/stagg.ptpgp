"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase, Users, CheckCircle2, XCircle, FileText, Search,
  AlertTriangle, X,
} from "lucide-react";
import { getJobPostings } from "@/app/actions/recruitment";
import EmptyState from "@/components/EmptyState";

interface JobPosting {
  id: string;
  position: string;
  department: string;
  quantity: number;
  quantity_filled: number;
  status: string;
  created_at: string;
}

interface Props {
  totalEmployees: number;
}

export default function RecruitmentClient({ totalEmployees }: Props) {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getJobPostings()
      .then((data) => { setPostings(data as JobPosting[]); setLoading(false); })
      .catch(() => { showToast("error", "Gagal memuat data lowongan."); setLoading(false); });
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    postings.forEach((p) => { if (p.department) set.add(p.department); });
    return Array.from(set).sort();
  }, [postings]);

  const filtered = useMemo(() => {
    return postings.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (deptFilter && p.department !== deptFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!p.position.toLowerCase().includes(s) && !p.department.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [postings, statusFilter, deptFilter, search]);

  const openCount = postings.filter((p) => p.status === "Open").length;
  const closedCount = postings.filter((p) => p.status === "Closed").length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-1 rounded-lg text-xs font-bold";
    if (status === "Open") return `${base} bg-emerald-50 text-emerald-700`;
    if (status === "Closed") return `${base} bg-slate-100 text-slate-500`;
    return `${base} bg-slate-100 text-slate-600`;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Lowongan", value: postings.length, icon: <Briefcase size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Open", value: openCount, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Closed", value: closedCount, icon: <XCircle size={18} />, color: "bg-slate-50 text-slate-600" },
          { label: "Total Karyawan", value: totalEmployees, icon: <Users size={18} />, color: "bg-amber-50 text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari posisi atau departemen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30"
        >
          <option value="">Semua Status</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30"
        >
          <option value="">Semua Departemen</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-slate-400">Memuat data...</p>
        </div>
      ) : postings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Belum ada data lowongan."
          description="Lowongan akan muncul di sini setelah ditambahkan."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Tidak ada lowongan yang sesuai filter."
          description="Ubah filter untuk melihat hasil lainnya."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Posisi</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kuota</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Terisi</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-slate-800">{p.position}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-600">{p.department}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-bold text-slate-700">{p.quantity}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-bold text-slate-700">{p.quantity_filled || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={getStatusBadge(p.status)}>{p.status}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs text-slate-500">{formatDate(p.created_at)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/hrd/recruitment/pipeline?job=${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <FileText size={12} /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs text-slate-500">Total: <span className="font-bold text-slate-800">{filtered.length}</span> lowongan</p>
          </div>
        </div>
      )}
    </div>
  );
}
