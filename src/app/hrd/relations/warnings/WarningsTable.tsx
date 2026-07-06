"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ShieldOff } from "lucide-react";
import { markWarningExpired } from "@/app/actions/employee";
import EmptyState from "@/components/EmptyState";

interface Warning {
  id: string;
  employee_name: string;
  employee_email: string;
  sp_level: string;
  reason: string;
  status: string;
  created_at: string | null;
  valid_until: string | null;
  issued_by: string | null;
}

const warningColors: Record<string, string> = {
  SP1: "bg-amber-50 text-amber-700",
  SP2: "bg-orange-50 text-orange-700",
  SP3: "bg-red-50 text-red-700",
};

const getStatusBadge = (status: string) => {
  if (status === "Aktif") return "bg-red-50 text-red-700";
  if (status === "Kadaluarsa") return "bg-slate-50 text-slate-500";
  return "bg-slate-100 text-slate-600";
};

export default function WarningsTable({ warnings }: { warnings: Warning[] }) {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [expiringId, setExpiringId] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleExpire = async (id: string) => {
    setExpiringId(id);
    const result = await markWarningExpired(id);
    setExpiringId("");
    if (result?.error) { showToast(result.error); return; }
    showToast("SP ditandai kadaluarsa.");
    router.refresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm">Daftar Surat Peringatan</h3>
        <p className="text-xs text-slate-400 mt-0.5">Riwayat surat peringatan seluruh karyawan. SP yang lewat masa berlaku otomatis ditandai kadaluarsa.</p>
      </div>

      {warnings.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada surat peringatan yang dikeluarkan."
          description='Klik tombol "Keluarkan SP" untuk membuat surat peringatan baru.'
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Level</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Alasan</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Berlaku Hingga</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dikeluarkan Oleh</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {warnings.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-800">{w.employee_name}</p>
                    <p className="text-[10px] text-slate-400">{w.employee_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${warningColors[w.sp_level] || "bg-slate-100 text-slate-600"}`}>
                      {w.sp_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{w.reason}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {w.created_at ? new Date(w.created_at).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {w.valid_until ? new Date(w.valid_until).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusBadge(w.status)}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{w.issued_by || "-"}</td>
                  <td className="px-6 py-4">
                    {w.status === "Aktif" ? (
                      <button
                        onClick={() => handleExpire(w.id)}
                        disabled={expiringId === w.id}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <ShieldOff size={12} /> {expiringId === w.id ? "Memproses..." : "Tandai Kadaluarsa"}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300">-</span>
                    )}
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
