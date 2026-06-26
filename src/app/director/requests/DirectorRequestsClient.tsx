"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Users,
} from "lucide-react";
import { updateRequestStatus } from "@/app/actions/requests";
import type { DirectorRequest } from "./page";

interface Props {
  requests: DirectorRequest[];
}

const STATUS_OPTIONS = ["Semua", "Direview HRD", "Disetujui", "Ditolak", "Pending"] as const;

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    "Direview HRD": "bg-purple-50 text-purple-700 border-purple-200",
    Disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Ditolak: "bg-red-50 text-red-700 border-red-200",
  };
  const color = colors[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${color}`}>
      {status}
    </span>
  );
}

function ActionButtons({
  id,
}: {
  id: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const handleAction = async (status: string) => {
    setLoading(status === "Disetujui" ? "approve" : "reject");
    await updateRequestStatus(id, status);
    setLoading(null);
    const ok = status === "Disetujui";
    setToast({ msg: ok ? "Request disetujui!" : "Request ditolak.", ok });
    setTimeout(() => setToast(null), 3000);
    router.refresh();
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg border text-sm font-bold ${
          toast.ok
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleAction("Disetujui")}
          disabled={loading !== null}
          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
        >
          {loading === "approve" ? "..." : "Approve"}
        </button>
        <button
          onClick={() => handleAction("Ditolak")}
          disabled={loading !== null}
          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
        >
          {loading === "reject" ? "..." : "Tolak"}
        </button>
      </div>
    </>
  );
}

export default function DirectorRequestsClient({ requests }: Props) {
  const [filter, setFilter] = useState<string>("Semua");
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = useMemo(() => {
    if (filter === "Semua") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const stats = [
    { label: "Total", value: requests.length, icon: FileText, color: "bg-blue-50 text-blue-600" },
    { label: "Direview HRD", value: requests.filter(r => r.status === "Direview HRD").length, icon: Clock, color: "bg-purple-50 text-purple-600" },
    { label: "Disetujui", value: requests.filter(r => r.status === "Disetujui").length, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Ditolak", value: requests.filter(r => r.status === "Ditolak").length, icon: XCircle, color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Permintaan Tenaga Kerja
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review dan kelola seluruh workforce requests.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => { setFilter(opt); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              filter === opt
                ? "bg-pgp-red text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posisi</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departemen</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Urgensi</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diajukan Oleh</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Users size={40} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm text-slate-500">Tidak ada data permintaan.</p>
                  </td>
                </tr>
              ) : (
                paged.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{req.id.slice(0, 10)}</span>
                        <span className="text-sm font-bold text-slate-800">{req.position}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{req.department}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-bold">{req.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        req.urgency === "Tinggi" ? "bg-red-50 text-red-700 border-red-200" :
                        req.urgency === "Sedang" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{req.requested_by || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(req.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "Direview HRD" ? (
                        <ActionButtons id={req.id} />
                      ) : (
                        <StatusBadge status={req.status} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              Halaman {page + 1} dari {totalPages} ({filtered.length} data)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
