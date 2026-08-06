"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Lock, AlertTriangle } from "lucide-react";
import { closePayrollPeriod } from "@/app/actions/admin";
import EmptyState from "@/components/EmptyState";

type Period = Record<string, unknown>;

const STATUS_LABEL: Record<string, string> = {
  Draft: "Draft",
  Processing: "Diproses",
  "Waiting Approval": "Menunggu Approval",
  Approved: "Disetujui",
  Paid: "Dibayar",
  Closed: "Closed",
  Cancelled: "Dibatalkan",
};
const STATUS_COLOR: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Processing: "bg-amber-50 text-amber-700",
  "Waiting Approval": "bg-sky-50 text-sky-700",
  Approved: "bg-blue-50 text-blue-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-800 text-white",
  Cancelled: "bg-red-50 text-red-700",
};

export default function PeriodeClient({ initialPeriods }: { initialPeriods: Period[] }) {
  const router = useRouter();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleClose = async (id: string) => {
    setClosingId(id); setMsg(null);
    const res = await closePayrollPeriod(id);
    setClosingId(null); setConfirmId(null);
    if ("error" in res) { setMsg({ type: "error", text: res.error }); return; }
    setMsg({ type: "success", text: "Periode berhasil ditutup (Closed)." });
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Periode Payroll</h1>
        <p className="text-sm text-gray-500">Periode dibuat otomatis saat HRD men-generate payroll pertama kali untuk bulan tersebut. Tutup (Closed) periode setelah semua slip Dibayar agar tidak bisa diubah lagi.</p>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      {initialPeriods.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Belum ada periode payroll." description="Periode akan otomatis dibuat saat Generate Payroll pertama kali dijalankan di menu Payroll." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Periode", "Tanggal Mulai", "Tanggal Akhir", "Status", "Dibuat Oleh", ""].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {initialPeriods.map((p) => (
                  <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{p.nama_periode as string}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.tanggal_awal ? new Date(p.tanggal_awal as string).toLocaleDateString("id-ID") : "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.tanggal_akhir ? new Date(p.tanggal_akhir as string).toLocaleDateString("id-ID") : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_COLOR[p.status as string] || "bg-slate-50 text-slate-600"}`}>
                        {STATUS_LABEL[p.status as string] || (p.status as string)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{(p.created_by_name as string) || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status !== "Closed" && p.status !== "Cancelled" && (
                        confirmId === p.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleClose(p.id as string)} disabled={closingId === p.id}
                              className="px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-md hover:bg-slate-900 disabled:opacity-50">
                              {closingId === p.id ? "Menutup..." : "Konfirmasi Tutup"}
                            </button>
                            <button onClick={() => setConfirmId(null)} className="px-2.5 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md hover:bg-slate-200">
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmId(p.id as string)}
                            className="px-2.5 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-md hover:bg-slate-100 flex items-center gap-1 ml-auto">
                            <Lock size={11} /> Tutup Periode
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Periode hanya bisa ditutup jika <strong>semua</strong> slip gaji di dalamnya sudah berstatus Dibayar. Setelah Closed, tidak ada slip di periode tersebut yang bisa diedit atau diubah statusnya lagi.
        </p>
      </div>
    </div>
  );
}
